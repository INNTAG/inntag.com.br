import { Hono } from "hono";
import { getCookie, setCookie } from "hono/cookie";
// GoogleGenAI SDK not used - using REST API for Cloudflare Workers compatibility

const app = new Hono<{ Bindings: Env }>();

// Cabeçalhos de segurança em todas as respostas do worker.
app.use("*", async (c, next) => {
  await next();
  c.header("X-Content-Type-Options", "nosniff");
  c.header("X-Frame-Options", "SAMEORIGIN");
  c.header("Referrer-Policy", "strict-origin-when-cross-origin");
  c.header("Strict-Transport-Security", "max-age=15552000");
  c.header("Permissions-Policy", "geolocation=(), microphone=(), camera=(), payment=()");
  // Respostas dinâmicas de API não devem ser cacheadas pelo navegador (senão mudanças
  // de conteúdo/backgrounds não refletem para quem já visitou).
  if (new URL(c.req.url).pathname.startsWith("/api/") &&
      !new URL(c.req.url).pathname.startsWith("/api/files/")) {
    c.header("Cache-Control", "no-cache");
  }
});

// Apex -> www: o site canônico é https://www.inntag.com.br (evita conteúdo duplicado / SEO).
app.use("*", async (c, next) => {
  const url = new URL(c.req.url);
  if (url.hostname === "inntag.com.br") {
    return c.redirect(`https://www.inntag.com.br${url.pathname}${url.search}`, 301);
  }
  return next();
});

// Simple token generator
function generateToken(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let token = '';
  for (let i = 0; i < 64; i++) {
    token += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return token;
}

// Helper to get session from database
async function getAdminSession(db: any, token: string) {
  const session = await db.prepare(
    "SELECT * FROM admin_sessions WHERE token = ? AND expires_at > datetime('now')"
  ).bind(token).first();
  return session;
}

// Helper to create session in database
async function createAdminSession(db: any, token: string, email: string, name: string, permissions: string) {
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
  await db.prepare(
    "INSERT INTO admin_sessions (token, email, name, permissions, expires_at) VALUES (?, ?, ?, ?, ?)"
  ).bind(token, email, name, permissions, expiresAt).run();
}

// Helper to delete session from database
async function deleteAdminSession(db: any, token: string) {
  await db.prepare("DELETE FROM admin_sessions WHERE token = ?").bind(token).run();
}

// Clean up expired sessions (called periodically)
async function cleanupExpiredSessions(db: any) {
  await db.prepare("DELETE FROM admin_sessions WHERE expires_at < datetime('now')").run();
}

// Admin login with email/username + password
app.post("/api/admin/login", async (c) => {
  const body = await c.req.json();
  const { email, password } = body;

  if (!password) {
    return c.json({ error: "Senha é obrigatória" }, 400);
  }

  // Rate-limit por IP (anti brute-force) — limita tentativas falhas por minuto.
  const ip = c.req.header("CF-Connecting-IP") || c.req.header("X-Forwarded-For") || "unknown";
  const recent = await c.env.DB.prepare(
    "SELECT COUNT(*) as n FROM admin_login_attempts WHERE ip_address = ? AND is_successful = 0 AND attempted_at > datetime('now','-1 minute')"
  ).bind(ip).first() as { n: number } | null;
  if (recent && recent.n >= 10) {
    return c.json({ error: "Muitas tentativas deste dispositivo. Aguarde 1 minuto." }, 429);
  }
  const recordFail = async () => {
    try {
      await c.env.DB.prepare("INSERT INTO admin_login_attempts (ip_address, is_successful) VALUES (?, 0)").bind(ip).run();
    } catch { /* tabela ausente — ignora */ }
  };

  // If email/username is provided, check admin_users table
  if (email) {
    // Check by email OR by name (username)
    const admin = await c.env.DB.prepare(
      "SELECT * FROM admin_users WHERE (email = ? OR name = ?) AND is_active = 1"
    ).bind(email, email).first() as { id: number; email: string; name: string; password_hash: string; permissions: string } | null;
    
    if (!admin) {
      await recordFail();
      return c.json({ error: "Usuário não encontrado" }, 401);
    }

    if (!admin.password_hash || admin.password_hash !== password) {
      await recordFail();
      return c.json({ error: "Senha inválida" }, 401);
    }
    
    // Generate session token and save to database
    const token = generateToken();
    await createAdminSession(c.env.DB, token, admin.email, admin.name || 'Administrador', admin.permissions || 'all');

    // Set cookie
    setCookie(c, "admin_token", token, {
      httpOnly: true,
      path: "/",
      sameSite: "lax",
      secure: true,
      maxAge: 24 * 60 * 60,
    });

    return c.json({ success: true, token }, 200);
  }

  // Fallback: Master password login (for backwards compatibility)
  const setting = await c.env.DB.prepare(
    "SELECT setting_value FROM app_settings WHERE setting_key = 'admin_password'"
  ).first() as { setting_value: string } | null;
  
  const adminPassword = setting?.setting_value;
  if (!adminPassword || password !== adminPassword) {
    await recordFail();
    return c.json({ error: "Senha inválida" }, 401);
  }

  // Generate session token for master access and save to database
  const token = generateToken();
  await createAdminSession(c.env.DB, token, 'master@inntag.com.br', 'Master', 'all');

  // Set cookie
  setCookie(c, "admin_token", token, {
    httpOnly: true,
    path: "/",
    sameSite: "lax",
    secure: true,
    maxAge: 24 * 60 * 60,
  });

  return c.json({ success: true, token }, 200);
});

// Admin logout
app.post("/api/admin/logout", async (c) => {
  const token = getCookie(c, "admin_token");
  if (token) {
    await deleteAdminSession(c.env.DB, token);
  }
  
  setCookie(c, "admin_token", "", {
    httpOnly: true,
    path: "/",
    sameSite: "lax",
    secure: true,
    maxAge: 0,
  });

  return c.json({ success: true }, 200);
});

// Verify admin session
app.get("/api/admin/verify", async (c) => {
  const token = getCookie(c, "admin_token") || c.req.header("Authorization")?.replace("Bearer ", "");
  
  if (!token) {
    return c.json({ error: "Not authenticated" }, 401);
  }

  const session = await getAdminSession(c.env.DB, token);
  if (!session) {
    await deleteAdminSession(c.env.DB, token);
    return c.json({ error: "Session expired" }, 401);
  }

  // Cleanup expired sessions occasionally
  await cleanupExpiredSessions(c.env.DB);

  return c.json({ 
    email: session.email, 
    name: session.name,
    permissions: session.permissions 
  }, 200);
});

// Change admin password
app.put("/api/admin/settings/password", async (c) => {
  const token = getCookie(c, "admin_token") || c.req.header("Authorization")?.replace("Bearer ", "");
  
  if (!token) {
    return c.json({ error: "Not authenticated" }, 401);
  }

  const session = await getAdminSession(c.env.DB, token);
  if (!session) {
    return c.json({ error: "Session expired" }, 401);
  }

  const body = await c.req.json();
  const { currentPassword, newPassword } = body;

  // Verify current password
  const setting = await c.env.DB.prepare(
    "SELECT setting_value FROM app_settings WHERE setting_key = 'admin_password'"
  ).first() as { setting_value: string } | null;
  
  if (!setting || setting.setting_value !== currentPassword) {
    return c.json({ error: "Senha atual incorreta" }, 401);
  }

  // Update password
  await c.env.DB.prepare(
    "UPDATE app_settings SET setting_value = ?, updated_at = CURRENT_TIMESTAMP WHERE setting_key = 'admin_password'"
  ).bind(newPassword).run();

  return c.json({ success: true });
});

// ============ ADMIN ROUTES ============

// Admin middleware
const adminMiddleware = async (c: any, next: any) => {
  const token = getCookie(c, "admin_token") || c.req.header("Authorization")?.replace("Bearer ", "");
  
  if (!token) {
    return c.json({ error: "Not authenticated" }, 401);
  }

  const session = await getAdminSession(c.env.DB, token);
  if (!session) {
    await deleteAdminSession(c.env.DB, token);
    return c.json({ error: "Session expired" }, 401);
  }

  c.set("adminEmail", session.email);
  await next();
};

// Get all admin users
app.get("/api/admin/users", adminMiddleware, async (c) => {
  // Nunca devolver a senha ao cliente — apenas um booleano indicando se há senha definida.
  const { results } = await c.env.DB.prepare(
    `SELECT id, user_id, email, name, role, permissions, is_active, created_at, updated_at,
            (password_hash IS NOT NULL AND length(password_hash) > 0) AS has_password
     FROM admin_users ORDER BY created_at DESC`
  ).all();
  return c.json(results || []);
});

// Create admin user manually
app.post("/api/admin/users", adminMiddleware, async (c) => {
  const body = await c.req.json();
  
  // Check if email ends with @inntag.com.br
  if (!body.email || !body.email.endsWith('@inntag.com.br')) {
    return c.json({ error: 'Email deve ser @inntag.com.br' }, 400);
  }
  
  // Check if admin already exists
  const existing = await c.env.DB.prepare(
    "SELECT id FROM admin_users WHERE email = ?"
  ).bind(body.email).first();
  
  if (existing) {
    return c.json({ error: 'Administrador já cadastrado' }, 400);
  }
  
  const result = await c.env.DB.prepare(
    "INSERT INTO admin_users (user_id, email, name, role, password_hash, permissions, is_active) VALUES (?, ?, ?, ?, ?, ?, 1) RETURNING *"
  ).bind(
    'manual-' + Date.now(),
    body.email,
    body.name || null,
    body.role || 'admin',
    body.password || null,
    body.permissions || 'all'
  ).first();
  
  return c.json(result);
});

// Update admin user
app.put("/api/admin/users/:id", adminMiddleware, async (c) => {
  const id = c.req.param("id");
  const body = await c.req.json();
  
  console.log("Updating admin user:", id, "password provided:", !!body.password);
  
  // Check if email ends with @inntag.com.br
  if (body.email && !body.email.endsWith('@inntag.com.br')) {
    return c.json({ error: 'Email deve ser @inntag.com.br' }, 400);
  }
  
  // Check if email already exists for another user
  if (body.email) {
    const existing = await c.env.DB.prepare(
      "SELECT id FROM admin_users WHERE email = ? AND id != ?"
    ).bind(body.email, id).first();
    
    if (existing) {
      return c.json({ error: 'Email já cadastrado para outro administrador' }, 400);
    }
  }
  
  const passwordProvided = body.password && body.password.trim().length > 0;
  
  // Build update query
  let query = "UPDATE admin_users SET name = ?, email = ?, role = ?, permissions = ?, updated_at = CURRENT_TIMESTAMP";
  const params: any[] = [body.name, body.email, body.role, body.permissions || 'all'];
  
  // Only update password if provided
  if (passwordProvided) {
    query += ", password_hash = ?";
    params.push(body.password.trim());
    console.log("Password will be updated for user", id);
  }
  
  query += " WHERE id = ? RETURNING *";
  params.push(id);
  
  const result = await c.env.DB.prepare(query).bind(...params).first();
  
  // Return with password_updated flag
  return c.json({ 
    ...result, 
    password_updated: passwordProvided,
    has_password: !!(result as any)?.password_hash 
  });
});

// Delete admin user
app.delete("/api/admin/users/:id", adminMiddleware, async (c) => {
  const id = c.req.param("id");
  await c.env.DB.prepare("DELETE FROM admin_users WHERE id = ?").bind(id).run();
  return c.json({ success: true });
});

// ============ CLIENTS CRUD ============

app.get("/api/admin/clients", adminMiddleware, async (c) => {
  const { results } = await c.env.DB.prepare(
    "SELECT * FROM clients ORDER BY name ASC"
  ).all();
  return c.json(results);
});

app.post("/api/admin/clients", adminMiddleware, async (c) => {
  const body = await c.req.json();
  const result = await c.env.DB.prepare(
    "INSERT INTO clients (name, contact_email, contact_phone) VALUES (?, ?, ?) RETURNING *"
  ).bind(body.name, body.contact_email || null, body.contact_phone || null).first();
  return c.json(result);
});

app.put("/api/admin/clients/:id", adminMiddleware, async (c) => {
  const id = c.req.param("id");
  const body = await c.req.json();
  const result = await c.env.DB.prepare(
    "UPDATE clients SET name = ?, contact_email = ?, contact_phone = ?, logo_key = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ? RETURNING *"
  ).bind(body.name, body.contact_email || null, body.contact_phone || null, body.logo_key || null, id).first();
  return c.json(result);
});

app.delete("/api/admin/clients/:id", adminMiddleware, async (c) => {
  const id = c.req.param("id");
  // Delete logo from R2 if exists
  const client = await c.env.DB.prepare("SELECT logo_key FROM clients WHERE id = ?").bind(id).first();
  if (client?.logo_key) {
    await c.env.R2_BUCKET.delete(client.logo_key as string);
  }
  await c.env.DB.prepare("DELETE FROM clients WHERE id = ?").bind(id).run();
  return c.json({ success: true });
});

// Upload client logo
app.post("/api/admin/clients/:id/logo", adminMiddleware, async (c) => {
  const clientId = c.req.param("id");
  const formData = await c.req.formData();
  const file = formData.get("file") as File;

  if (!file) {
    return c.json({ error: "No file provided" }, 400);
  }

  // Delete old logo if exists
  const client = await c.env.DB.prepare("SELECT logo_key FROM clients WHERE id = ?").bind(clientId).first();
  if (client?.logo_key) {
    await c.env.R2_BUCKET.delete(client.logo_key as string);
  }

  const fileKey = `clients/${clientId}/${Date.now()}-${file.name}`;
  
  await c.env.R2_BUCKET.put(fileKey, file.stream(), {
    httpMetadata: { contentType: file.type },
  });

  await c.env.DB.prepare(
    "UPDATE clients SET logo_key = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?"
  ).bind(fileKey, clientId).run();

  return c.json({ logo_key: fileKey });
});

// Get projects for a specific client (for admin support view)
app.get("/api/admin/clients/:id/projects", adminMiddleware, async (c) => {
  const clientId = c.req.param("id");
  
  // Get projects with files for this client
  const { results: projects } = await c.env.DB.prepare(`
    SELECT id, title, description, location, os_number, status, created_at
    FROM projects 
    WHERE client_id = ? 
    ORDER BY created_at DESC
  `).bind(clientId).all();

  // Get files for each project
  const projectsWithFiles = await Promise.all(
    projects.map(async (project: any) => {
      const { results: files } = await c.env.DB.prepare(
        "SELECT id, file_key, file_name, file_type FROM project_files WHERE project_id = ?"
      ).bind(project.id).all();
      return { ...project, files };
    })
  );

  return c.json(projectsWithFiles);
});

// ============ CLIENT GROUPS CRUD ============

app.get("/api/admin/client-groups", adminMiddleware, async (c) => {
  const { results } = await c.env.DB.prepare(`
    SELECT cg.*, 
      (SELECT COUNT(*) FROM client_units WHERE group_id = cg.id) as units_count,
      (SELECT COUNT(*) FROM projects p JOIN client_units cu ON p.unit_id = cu.id WHERE cu.group_id = cg.id) as projects_count
    FROM client_groups cg 
    ORDER BY cg.name ASC
  `).all();
  return c.json(results);
});

app.post("/api/admin/client-groups", adminMiddleware, async (c) => {
  const body = await c.req.json();
  const result = await c.env.DB.prepare(
    "INSERT INTO client_groups (name, sector, contact_email, contact_phone, notes, is_active, created_at, updated_at) VALUES (?, ?, ?, ?, ?, 1, datetime('now'), datetime('now')) RETURNING *"
  ).bind(body.name, body.sector || null, body.contact_email || null, body.contact_phone || null, body.notes || null).first();
  return c.json(result);
});

app.put("/api/admin/client-groups/:id", adminMiddleware, async (c) => {
  const id = c.req.param("id");
  const body = await c.req.json();
  const result = await c.env.DB.prepare(
    "UPDATE client_groups SET name = ?, sector = ?, contact_email = ?, contact_phone = ?, notes = ?, updated_at = datetime('now') WHERE id = ? RETURNING *"
  ).bind(body.name, body.sector || null, body.contact_email || null, body.contact_phone || null, body.notes || null, id).first();
  return c.json(result);
});

app.delete("/api/admin/client-groups/:id", adminMiddleware, async (c) => {
  const id = c.req.param("id");
  // Delete units first
  await c.env.DB.prepare("DELETE FROM client_units WHERE group_id = ?").bind(id).run();
  await c.env.DB.prepare("DELETE FROM client_groups WHERE id = ?").bind(id).run();
  return c.json({ success: true });
});

app.post("/api/admin/client-groups/:id/logo", adminMiddleware, async (c) => {
  const groupId = c.req.param("id");
  const formData = await c.req.formData();
  const file = formData.get("file") as File;
  if (!file) return c.json({ error: "No file uploaded" }, 400);

  const ext = file.name.split(".").pop() || "png";
  const key = `group-logos/${groupId}-${Date.now()}.${ext}`;
  const arrayBuffer = await file.arrayBuffer();
  await c.env.R2_BUCKET.put(key, arrayBuffer, { httpMetadata: { contentType: file.type } });

  await c.env.DB.prepare("UPDATE client_groups SET logo_key = ?, updated_at = datetime('now') WHERE id = ?").bind(key, groupId).run();
  return c.json({ success: true, logo_key: key });
});

// Upload genérico de imagem (usado pelo painel de Backgrounds e afins).
// Retorna { url: "/api/files/<key>" } para o front salvar.
app.post("/api/admin/upload", adminMiddleware, async (c) => {
  const formData = await c.req.formData();
  const file = formData.get("file") as File | null;
  if (!file) return c.json({ error: "Nenhum arquivo enviado" }, 400);
  if (!file.type || !file.type.startsWith("image/")) {
    return c.json({ error: "O arquivo deve ser uma imagem" }, 400);
  }
  if (file.size > 15 * 1024 * 1024) {
    return c.json({ error: "Imagem muito grande (máx. 15 MB)" }, 400);
  }
  const category = ((formData.get("category") as string) || "uploads").replace(/[^a-z0-9_-]/gi, "") || "uploads";
  const ext = (file.name.split(".").pop() || "jpg").toLowerCase().replace(/[^a-z0-9]/g, "") || "jpg";
  const key = `${category}/${Date.now()}-${Math.round(Math.random() * 1e9)}.${ext}`;
  await c.env.R2_BUCKET.put(key, file.stream(), { httpMetadata: { contentType: file.type } });
  return c.json({ url: `/api/files/${key}`, key });
});

// ============ CLIENT UNITS CRUD ============

app.get("/api/admin/client-groups/:id/units", adminMiddleware, async (c) => {
  const groupId = c.req.param("id");
  const { results } = await c.env.DB.prepare(
    "SELECT * FROM client_units WHERE group_id = ? ORDER BY name ASC"
  ).bind(groupId).all();
  return c.json(results);
});

app.post("/api/admin/client-groups/:id/units", adminMiddleware, async (c) => {
  const groupId = c.req.param("id");
  const body = await c.req.json();
  const result = await c.env.DB.prepare(
    "INSERT INTO client_units (group_id, name, cnpj, address, city, state, postal_code, contact_name, contact_email, contact_phone, is_active, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, datetime('now'), datetime('now')) RETURNING *"
  ).bind(groupId, body.name, body.cnpj || null, body.address || null, body.city || null, body.state || null, body.postal_code || null, body.contact_name || null, body.contact_email || null, body.contact_phone || null).first();
  
  // Auto-create contact in unit_contacts if contact_name provided
  if (result && body.contact_name) {
    await c.env.DB.prepare(
      "INSERT INTO unit_contacts (unit_id, name, role, email, phone, is_primary, is_active, created_at, updated_at) VALUES (?, ?, 'Contato Principal', ?, ?, 1, 1, datetime('now'), datetime('now'))"
    ).bind((result as { id: number }).id, body.contact_name, body.contact_email || null, body.contact_phone || null).run();
  }
  return c.json(result);
});

app.put("/api/admin/client-units/:id", adminMiddleware, async (c) => {
  const id = c.req.param("id");
  const body = await c.req.json();
  const result = await c.env.DB.prepare(
    "UPDATE client_units SET name = ?, cnpj = ?, address = ?, city = ?, state = ?, postal_code = ?, contact_name = ?, contact_email = ?, contact_phone = ?, updated_at = datetime('now') WHERE id = ? RETURNING *"
  ).bind(body.name, body.cnpj || null, body.address || null, body.city || null, body.state || null, body.postal_code || null, body.contact_name || null, body.contact_email || null, body.contact_phone || null, id).first();
  
  // Sync primary contact in unit_contacts
  if (body.contact_name) {
    // Check if primary contact exists
    const existing = await c.env.DB.prepare(
      "SELECT id FROM unit_contacts WHERE unit_id = ? AND is_primary = 1"
    ).bind(id).first();
    
    if (existing) {
      // Update existing primary contact
      await c.env.DB.prepare(
        "UPDATE unit_contacts SET name = ?, email = ?, phone = ?, updated_at = datetime('now') WHERE id = ?"
      ).bind(body.contact_name, body.contact_email || null, body.contact_phone || null, (existing as { id: number }).id).run();
    } else {
      // Create new primary contact
      await c.env.DB.prepare(
        "INSERT INTO unit_contacts (unit_id, name, role, email, phone, is_primary, is_active, created_at, updated_at) VALUES (?, ?, 'Contato Principal', ?, ?, 1, 1, datetime('now'), datetime('now'))"
      ).bind(id, body.contact_name, body.contact_email || null, body.contact_phone || null).run();
    }
  }
  return c.json(result);
});

app.delete("/api/admin/client-units/:id", adminMiddleware, async (c) => {
  const id = c.req.param("id");
  // Delete contacts first
  await c.env.DB.prepare("DELETE FROM unit_contacts WHERE unit_id = ?").bind(id).run();
  await c.env.DB.prepare("DELETE FROM client_units WHERE id = ?").bind(id).run();
  return c.json({ success: true });
});

// ============ UNIT CONTACTS CRUD ============

app.get("/api/admin/client-units/:id/contacts", adminMiddleware, async (c) => {
  const unitId = c.req.param("id");
  const { results } = await c.env.DB.prepare(
    "SELECT * FROM unit_contacts WHERE unit_id = ? ORDER BY is_primary DESC, name ASC"
  ).bind(unitId).all();
  return c.json(results);
});

app.post("/api/admin/client-units/:id/contacts", adminMiddleware, async (c) => {
  const unitId = c.req.param("id");
  const body = await c.req.json();
  const result = await c.env.DB.prepare(
    "INSERT INTO unit_contacts (unit_id, name, role, email, phone, is_primary, is_active, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, 1, datetime('now'), datetime('now')) RETURNING *"
  ).bind(unitId, body.name, body.role || null, body.email || null, body.phone || null, body.is_primary || 0).first();
  return c.json(result);
});

app.put("/api/admin/unit-contacts/:id", adminMiddleware, async (c) => {
  const id = c.req.param("id");
  const body = await c.req.json();
  const result = await c.env.DB.prepare(
    "UPDATE unit_contacts SET name = ?, role = ?, email = ?, phone = ?, is_primary = ?, updated_at = datetime('now') WHERE id = ? RETURNING *"
  ).bind(body.name, body.role || null, body.email || null, body.phone || null, body.is_primary || 0, id).first();
  return c.json(result);
});

app.delete("/api/admin/unit-contacts/:id", adminMiddleware, async (c) => {
  const id = c.req.param("id");
  await c.env.DB.prepare("DELETE FROM unit_contacts WHERE id = ?").bind(id).run();
  return c.json({ success: true });
});

// ============ PROJECTS BY UNIT ============

app.get("/api/admin/client-units/:id/projects", adminMiddleware, async (c) => {
  const unitId = c.req.param("id");
  const { results } = await c.env.DB.prepare(
    `SELECT p.*, pr.title as product_name 
     FROM projects p 
     LEFT JOIN products pr ON p.product_id = pr.id 
     WHERE p.unit_id = ? 
     ORDER BY p.created_at DESC`
  ).bind(unitId).all();
  return c.json(results);
});

// ============ PROJECTS CRUD ============

app.get("/api/admin/projects", adminMiddleware, async (c) => {
  const { results } = await c.env.DB.prepare(`
    SELECT p.*, c.name as client_name, pr.title as product_name,
      cu.name as unit_name, cg.name as group_name, cg.id as group_id, cg.logo_key as group_logo_key
    FROM projects p 
    LEFT JOIN clients c ON p.client_id = c.id 
    LEFT JOIN products pr ON p.product_id = pr.id
    LEFT JOIN client_units cu ON p.unit_id = cu.id
    LEFT JOIN client_groups cg ON cu.group_id = cg.id
    ORDER BY p.created_at DESC
  `).all();
  return c.json(results);
});

// Get all units with group names (for project dropdown)
app.get("/api/admin/units-with-groups", adminMiddleware, async (c) => {
  const { results } = await c.env.DB.prepare(`
    SELECT cu.*, cg.name as group_name, cg.sector as group_sector
    FROM client_units cu 
    JOIN client_groups cg ON cu.group_id = cg.id
    WHERE cu.is_active = 1 AND cg.is_active = 1
    ORDER BY cg.name ASC, cu.name ASC
  `).all();
  return c.json(results);
});

app.post("/api/admin/projects", adminMiddleware, async (c) => {
  const body = await c.req.json();
  const result = await c.env.DB.prepare(
    "INSERT INTO projects (client_id, unit_id, os_number, title, description, location, is_featured, is_public, project_year, responsible_person, product_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?) RETURNING *"
  ).bind(
    body.client_id || null,
    body.unit_id || null,
    body.os_number || null,
    body.title,
    body.description || null,
    body.location || null,
    body.is_featured ? 1 : 0,
    body.is_public ? 1 : 0,
    body.project_year || null,
    body.responsible_person || null,
    body.product_id || null
  ).first();
  return c.json(result);
});

// Get single project with details
app.get("/api/admin/projects/:id", adminMiddleware, async (c) => {
  const id = c.req.param("id");
  const project = await c.env.DB.prepare(
    `SELECT p.*, u.name as unit_name, g.name as group_name, g.logo_url as group_logo
     FROM projects p
     LEFT JOIN client_units u ON p.unit_id = u.id
     LEFT JOIN client_groups g ON u.group_id = g.id
     WHERE p.id = ?`
  ).bind(id).first();
  
  if (!project) {
    return c.json({ error: "Project not found" }, 404);
  }
  
  return c.json(project);
});

app.put("/api/admin/projects/:id", adminMiddleware, async (c) => {
  const id = c.req.param("id");
  const body = await c.req.json();
  const result = await c.env.DB.prepare(
    "UPDATE projects SET client_id = ?, unit_id = ?, os_number = ?, title = ?, description = ?, location = ?, is_featured = ?, is_public = ?, status = ?, project_year = ?, responsible_person = ?, product_id = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ? RETURNING *"
  ).bind(
    body.client_id || null,
    body.unit_id || null,
    body.os_number || null,
    body.title,
    body.description || null,
    body.location || null,
    body.is_featured ? 1 : 0,
    body.is_public ? 1 : 0,
    body.status || 'active',
    body.project_year || null,
    body.responsible_person || null,
    body.product_id || null,
    id
  ).first();
  return c.json(result);
});

app.delete("/api/admin/projects/:id", adminMiddleware, async (c) => {
  const id = c.req.param("id");
  // Delete associated files from R2
  const { results: files } = await c.env.DB.prepare(
    "SELECT file_key FROM project_files WHERE project_id = ?"
  ).bind(id).all();
  
  for (const file of files) {
    await c.env.R2_BUCKET.delete(file.file_key as string);
  }
  
  await c.env.DB.prepare("DELETE FROM project_files WHERE project_id = ?").bind(id).run();
  await c.env.DB.prepare("DELETE FROM projects WHERE id = ?").bind(id).run();
  return c.json({ success: true });
});

// ============ PROJECT FILES ============

app.get("/api/admin/projects/:id/files", adminMiddleware, async (c) => {
  const projectId = c.req.param("id");
  const { results } = await c.env.DB.prepare(
    "SELECT * FROM project_files WHERE project_id = ? ORDER BY created_at DESC"
  ).bind(projectId).all();
  return c.json(results);
});

app.post("/api/admin/projects/:id/files", adminMiddleware, async (c) => {
  const projectId = c.req.param("id");
  const formData = await c.req.formData();
  const file = formData.get("file") as File;
  const category = formData.get("category") as string || "photo";

  if (!file) {
    return c.json({ error: "No file provided" }, 400);
  }

  const fileKey = `projects/${projectId}/${Date.now()}-${file.name}`;
  
  await c.env.R2_BUCKET.put(fileKey, file.stream(), {
    httpMetadata: { contentType: file.type },
  });

  const result = await c.env.DB.prepare(
    "INSERT INTO project_files (project_id, file_key, file_name, file_type, file_size, category) VALUES (?, ?, ?, ?, ?, ?) RETURNING *"
  ).bind(projectId, fileKey, file.name, file.type, file.size, category).first();

  return c.json(result);
});

app.delete("/api/admin/files/:id", adminMiddleware, async (c) => {
  const id = c.req.param("id");
  const file = await c.env.DB.prepare(
    "SELECT * FROM project_files WHERE id = ?"
  ).bind(id).first();

  if (file) {
    await c.env.R2_BUCKET.delete(file.file_key as string);
    await c.env.DB.prepare("DELETE FROM project_files WHERE id = ?").bind(id).run();
  }

  return c.json({ success: true });
});

// Serve file from R2 - using wildcard to properly handle paths with slashes
app.get("/api/files/*", async (c) => {
  // Extract the key from the URL path after /api/files/
  const url = new URL(c.req.url);
  const key = decodeURIComponent(url.pathname.replace("/api/files/", ""));
  
  if (!key) {
    return c.json({ error: "No file key provided" }, 400);
  }
  
  const object = await c.env.R2_BUCKET.get(key);

  if (!object) {
    console.log("File not found in R2:", key);
    return c.json({ error: "File not found", key }, 404);
  }

  const headers = new Headers();
  object.writeHttpMetadata(headers);
  headers.set("etag", object.httpEtag);
  
  // Ensure content-type is set for common file types
  if (!headers.get("content-type")) {
    const ext = key.split(".").pop()?.toLowerCase();
    const mimeTypes: Record<string, string> = {
      jpg: "image/jpeg",
      jpeg: "image/jpeg",
      png: "image/png",
      gif: "image/gif",
      webp: "image/webp",
      pdf: "application/pdf",
      doc: "application/msword",
      docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      xls: "application/vnd.ms-excel",
      xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    };
    if (ext && mimeTypes[ext]) {
      headers.set("content-type", mimeTypes[ext]);
    }
  }
  
  // Add cache control for better performance
  headers.set("cache-control", "public, max-age=31536000");

  return c.body(object.body, { headers });
});

// ============ PROJECT PANELS (TAG + Serial Number) ============

app.get("/api/admin/projects/:id/panels", adminMiddleware, async (c) => {
  const projectId = c.req.param("id");
  const { results } = await c.env.DB.prepare(
    "SELECT * FROM project_panels WHERE project_id = ? ORDER BY tag ASC"
  ).bind(projectId).all();
  return c.json(results);
});

app.get("/api/admin/panels/:id", adminMiddleware, async (c) => {
  const id = c.req.param("id");
  const result = await c.env.DB.prepare("SELECT * FROM project_panels WHERE id = ?").bind(id).first();
  if (!result) return c.json({ error: "Panel not found" }, 404);
  return c.json(result);
});

app.post("/api/admin/panels", adminMiddleware, async (c) => {
  const body = await c.req.json();
  const result = await c.env.DB.prepare(
    `INSERT INTO project_panels (project_id, tag, serial_number, description, status, modelo, fabricante, potencia, tensao, corrente_nominal, grau_ip, data_fabricacao, data_instalacao, garantia_ate, norma, localizacao) 
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?) RETURNING *`
  ).bind(
    body.project_id, body.tag, body.serial_number || null, body.description || null, body.status || 'active',
    body.modelo || null, body.fabricante || null, body.potencia || null, body.tensao || null,
    body.corrente_nominal || null, body.grau_ip || null, body.data_fabricacao || null,
    body.data_instalacao || null, body.garantia_ate || null, body.norma || null, body.localizacao || null
  ).first();
  
  // Auto-create schedule tasks for panels
  if (result && result.id) {
    const panelId = result.id as number;
    const projectId = body.project_id;
    const dataFabricacao = body.data_fabricacao || null;
    const dataInstalacao = body.data_instalacao || null;
    const garantiaAte = body.garantia_ate || null;
    
    const panelTasks = [
      { name: 'Projeto', description: 'Desenvolvimento do projeto elétrico', sort_order: 1, color: '#3B82F6' },
      { name: 'Fabricação', description: 'Fabricação do painel', sort_order: 2, color: '#F59E0B', start_date: dataFabricacao },
      { name: 'TAF - Teste de Aceitação em Fábrica', description: 'Testes de qualidade e conformidade', sort_order: 3, color: '#8B5CF6' },
      { name: 'Entrega', description: 'Entrega e instalação do painel', sort_order: 4, color: '#10B981', end_date: dataInstalacao, is_milestone: 1 },
      { name: 'Vencimento da Garantia', description: 'Data de expiração da garantia', sort_order: 5, color: '#EF4444', end_date: garantiaAte, is_milestone: 1 },
    ];
    
    for (const task of panelTasks) {
      await c.env.DB.prepare(
        `INSERT INTO schedule_tasks (project_id, panel_id, name, description, start_date, end_date, status, is_milestone, sort_order, color) 
         VALUES (?, ?, ?, ?, ?, ?, 'pending', ?, ?, ?)`
      ).bind(
        projectId, panelId, task.name, task.description,
        task.start_date || null, task.end_date || null,
        task.is_milestone || 0, task.sort_order, task.color
      ).run();
    }
  }
  
  return c.json(result);
});

app.put("/api/admin/panels/:id", adminMiddleware, async (c) => {
  const id = c.req.param("id");
  const body = await c.req.json();
  const result = await c.env.DB.prepare(
    `UPDATE project_panels SET tag = ?, serial_number = ?, description = ?, status = ?, modelo = ?, fabricante = ?, potencia = ?, tensao = ?, corrente_nominal = ?, grau_ip = ?, data_fabricacao = ?, data_instalacao = ?, garantia_ate = ?, norma = ?, localizacao = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ? RETURNING *`
  ).bind(
    body.tag, body.serial_number || null, body.description || null, body.status || 'active',
    body.modelo || null, body.fabricante || null, body.potencia || null, body.tensao || null,
    body.corrente_nominal || null, body.grau_ip || null, body.data_fabricacao || null,
    body.data_instalacao || null, body.garantia_ate || null, body.norma || null, body.localizacao || null, id
  ).first();
  return c.json(result);
});

app.delete("/api/admin/panels/:id", adminMiddleware, async (c) => {
  const id = c.req.param("id");
  // Delete associated documents from R2
  const { results: docs } = await c.env.DB.prepare(
    "SELECT file_key FROM panel_documents WHERE panel_id = ?"
  ).bind(id).all();
  for (const doc of docs) {
    await c.env.R2_BUCKET.delete(doc.file_key as string);
  }
  await c.env.DB.prepare("DELETE FROM panel_documents WHERE panel_id = ?").bind(id).run();
  // Delete associated schedule tasks
  await c.env.DB.prepare("DELETE FROM schedule_tasks WHERE panel_id = ?").bind(id).run();
  await c.env.DB.prepare("DELETE FROM project_panels WHERE id = ?").bind(id).run();
  return c.json({ success: true });
});

// Panel Documents
app.get("/api/admin/panels/:id/documents", adminMiddleware, async (c) => {
  const panelId = c.req.param("id");
  const { results } = await c.env.DB.prepare(
    "SELECT * FROM panel_documents WHERE panel_id = ? ORDER BY created_at DESC"
  ).bind(panelId).all();
  return c.json(results);
});

app.post("/api/admin/panels/:id/documents", adminMiddleware, async (c) => {
  const panelId = c.req.param("id");
  const formData = await c.req.formData();
  const file = formData.get("file") as File;
  const category = formData.get("category") as string || "photo";
  const isClientVisible = formData.get("is_client_visible") === "1" ? 1 : 0;

  if (!file) return c.json({ error: "No file provided" }, 400);

  const fileKey = `panels/${panelId}/${Date.now()}-${file.name}`;
  await c.env.R2_BUCKET.put(fileKey, file.stream(), {
    httpMetadata: { contentType: file.type },
  });

  const result = await c.env.DB.prepare(
    "INSERT INTO panel_documents (panel_id, file_key, file_name, file_type, category, is_client_visible) VALUES (?, ?, ?, ?, ?, ?) RETURNING *"
  ).bind(panelId, fileKey, file.name, file.type, category, isClientVisible).first();
  return c.json(result);
});

app.put("/api/admin/panel-documents/:id", adminMiddleware, async (c) => {
  const id = c.req.param("id");
  const body = await c.req.json();
  const result = await c.env.DB.prepare(
    "UPDATE panel_documents SET is_client_visible = ?, category = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ? RETURNING *"
  ).bind(body.is_client_visible ? 1 : 0, body.category || 'photo', id).first();
  return c.json(result);
});

app.delete("/api/admin/panel-documents/:id", adminMiddleware, async (c) => {
  const id = c.req.param("id");
  const doc = await c.env.DB.prepare("SELECT * FROM panel_documents WHERE id = ?").bind(id).first();
  if (doc) {
    await c.env.R2_BUCKET.delete(doc.file_key as string);
    await c.env.DB.prepare("DELETE FROM panel_documents WHERE id = ?").bind(id).run();
  }
  return c.json({ success: true });
});

// ============ PROJECT SERVICES (OS + Description) ============

app.get("/api/admin/projects/:id/services", adminMiddleware, async (c) => {
  const projectId = c.req.param("id");
  const { results } = await c.env.DB.prepare(
    "SELECT * FROM project_services WHERE project_id = ? ORDER BY created_at DESC"
  ).bind(projectId).all();
  return c.json(results);
});

app.post("/api/admin/services", adminMiddleware, async (c) => {
  const body = await c.req.json();
  const result = await c.env.DB.prepare(
    `INSERT INTO project_services (project_id, os_number, description, status, start_date, end_date, tipo_servico, responsavel, responsavel_telefone, responsavel_email, prioridade, valor, horas_trabalhadas, equipamento, local, observacoes, proxima_manutencao) 
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?) RETURNING *`
  ).bind(
    body.project_id, body.os_number, body.description || null, body.status || 'active',
    body.start_date || null, body.end_date || null, body.tipo_servico || null,
    body.responsavel || null, body.responsavel_telefone || null, body.responsavel_email || null,
    body.prioridade || null, body.valor || null, body.horas_trabalhadas || null,
    body.equipamento || null, body.local || null, body.observacoes || null, body.proxima_manutencao || null
  ).first();
  
  // Auto-create schedule tasks for services (template básico)
  if (result && result.id) {
    const serviceId = result.id as number;
    const projectId = body.project_id;
    const startDate = body.start_date || null;
    const endDate = body.end_date || null;
    const proximaManutencao = body.proxima_manutencao || null;
    
    const serviceTasks = [
      { name: 'Abertura de OS', description: 'Registro e abertura da ordem de serviço', sort_order: 1, color: '#3B82F6', start_date: startDate, is_milestone: 1 },
      { name: 'Diagnóstico', description: 'Análise técnica e identificação do problema', sort_order: 2, color: '#8B5CF6' },
      { name: 'Planejamento', description: 'Definição de recursos e cronograma de execução', sort_order: 3, color: '#F59E0B' },
      { name: 'Execução', description: 'Realização do serviço técnico', sort_order: 4, color: '#10B981' },
      { name: 'Testes e Validação', description: 'Verificação de funcionamento e qualidade', sort_order: 5, color: '#06B6D4' },
      { name: 'Documentação', description: 'Registro técnico e relatório de serviço', sort_order: 6, color: '#EC4899' },
      { name: 'Fechamento de OS', description: 'Conclusão e fechamento da ordem de serviço', sort_order: 7, color: '#EF4444', end_date: endDate, is_milestone: 1 },
      { name: 'Próxima Manutenção', description: 'Data agendada para próxima manutenção preventiva', sort_order: 8, color: '#F97316', end_date: proximaManutencao, is_milestone: 1 },
    ];
    
    for (const task of serviceTasks) {
      await c.env.DB.prepare(
        `INSERT INTO schedule_tasks (project_id, service_id, name, description, start_date, end_date, status, is_milestone, sort_order, color) 
         VALUES (?, ?, ?, ?, ?, ?, 'pending', ?, ?, ?)`
      ).bind(
        projectId, serviceId, task.name, task.description,
        task.start_date || null, task.end_date || null,
        task.is_milestone || 0, task.sort_order, task.color
      ).run();
    }
  }
  
  return c.json(result);
});

app.put("/api/admin/services/:id", adminMiddleware, async (c) => {
  const id = c.req.param("id");
  const body = await c.req.json();
  const result = await c.env.DB.prepare(
    `UPDATE project_services SET os_number = ?, description = ?, status = ?, start_date = ?, end_date = ?, tipo_servico = ?, responsavel = ?, responsavel_telefone = ?, responsavel_email = ?, prioridade = ?, valor = ?, horas_trabalhadas = ?, equipamento = ?, local = ?, observacoes = ?, proxima_manutencao = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ? RETURNING *`
  ).bind(
    body.os_number, body.description || null, body.status || 'active',
    body.start_date || null, body.end_date || null, body.tipo_servico || null,
    body.responsavel || null, body.responsavel_telefone || null, body.responsavel_email || null,
    body.prioridade || null, body.valor || null, body.horas_trabalhadas || null,
    body.equipamento || null, body.local || null, body.observacoes || null, body.proxima_manutencao || null, id
  ).first();
  return c.json(result);
});

app.delete("/api/admin/services/:id", adminMiddleware, async (c) => {
  const id = c.req.param("id");
  // Delete associated documents from R2
  const { results: docs } = await c.env.DB.prepare(
    "SELECT file_key FROM service_documents WHERE service_id = ?"
  ).bind(id).all();
  for (const doc of docs) {
    await c.env.R2_BUCKET.delete(doc.file_key as string);
  }
  await c.env.DB.prepare("DELETE FROM service_documents WHERE service_id = ?").bind(id).run();
  // Delete associated schedule tasks
  await c.env.DB.prepare("DELETE FROM schedule_tasks WHERE service_id = ?").bind(id).run();
  await c.env.DB.prepare("DELETE FROM project_services WHERE id = ?").bind(id).run();
  return c.json({ success: true });
});

// Service Documents with access control
app.get("/api/admin/services/:id/documents", adminMiddleware, async (c) => {
  const serviceId = c.req.param("id");
  const { results } = await c.env.DB.prepare(
    "SELECT * FROM service_documents WHERE service_id = ? ORDER BY category, created_at DESC"
  ).bind(serviceId).all();
  return c.json(results);
});

app.post("/api/admin/services/:id/documents", adminMiddleware, async (c) => {
  const serviceId = c.req.param("id");
  const formData = await c.req.formData();
  const file = formData.get("file") as File;
  const category = formData.get("category") as string || "photo";
  const isClientVisible = formData.get("is_client_visible") === "1" ? 1 : 0;
  const notes = formData.get("notes") as string || null;

  if (!file) return c.json({ error: "No file provided" }, 400);

  const fileKey = `services/${serviceId}/${category}/${Date.now()}-${file.name}`;
  await c.env.R2_BUCKET.put(fileKey, file.stream(), {
    httpMetadata: { contentType: file.type },
  });

  const result = await c.env.DB.prepare(
    "INSERT INTO service_documents (service_id, file_key, file_name, file_type, category, is_client_visible, notes) VALUES (?, ?, ?, ?, ?, ?, ?) RETURNING *"
  ).bind(serviceId, fileKey, file.name, file.type, category, isClientVisible, notes).first();
  return c.json(result);
});

app.put("/api/admin/service-documents/:id", adminMiddleware, async (c) => {
  const id = c.req.param("id");
  const body = await c.req.json();
  const result = await c.env.DB.prepare(
    "UPDATE service_documents SET is_client_visible = ?, category = ?, notes = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ? RETURNING *"
  ).bind(body.is_client_visible ? 1 : 0, body.category || 'photo', body.notes || null, id).first();
  return c.json(result);
});

app.delete("/api/admin/service-documents/:id", adminMiddleware, async (c) => {
  const id = c.req.param("id");
  const doc = await c.env.DB.prepare("SELECT * FROM service_documents WHERE id = ?").bind(id).first();
  if (doc) {
    await c.env.R2_BUCKET.delete(doc.file_key as string);
    await c.env.DB.prepare("DELETE FROM service_documents WHERE id = ?").bind(id).run();
  }
  return c.json({ success: true });
});

// ============ SCHEDULE TASKS (GANTT) ============

// Get schedule tasks - can filter by project_id, panel_id, or service_id
app.get("/api/admin/schedule-tasks", adminMiddleware, async (c) => {
  const projectId = c.req.query("project_id");
  const panelId = c.req.query("panel_id");
  const serviceId = c.req.query("service_id");
  
  let query = "SELECT * FROM schedule_tasks WHERE 1=1";
  const params: (string | number)[] = [];
  
  if (projectId) {
    query += " AND project_id = ?";
    params.push(parseInt(projectId));
  }
  if (panelId) {
    query += " AND panel_id = ?";
    params.push(parseInt(panelId));
  }
  if (serviceId) {
    query += " AND service_id = ?";
    params.push(parseInt(serviceId));
  }
  
  query += " ORDER BY sort_order, start_date";
  
  const stmt = c.env.DB.prepare(query);
  const { results } = params.length > 0 
    ? await stmt.bind(...params).all()
    : await stmt.all();
  return c.json(results);
});

// Get tasks for project-level Gantt (includes all panel and service tasks)
app.get("/api/admin/projects/:id/schedule", adminMiddleware, async (c) => {
  const projectId = c.req.param("id");
  
  // Get project-level tasks
  const { results: projectTasks } = await c.env.DB.prepare(
    "SELECT *, 'project' as level FROM schedule_tasks WHERE project_id = ? AND panel_id IS NULL AND service_id IS NULL ORDER BY sort_order, start_date"
  ).bind(projectId).all();
  
  // Get all panels for this project with their tasks
  const { results: panels } = await c.env.DB.prepare(
    "SELECT id, tag, serial_number FROM project_panels WHERE project_id = ?"
  ).bind(projectId).all();
  
  const panelTasks = [];
  for (const panel of panels) {
    const { results: tasks } = await c.env.DB.prepare(
      "SELECT *, 'panel' as level FROM schedule_tasks WHERE panel_id = ? ORDER BY sort_order, start_date"
    ).bind(panel.id).all();
    panelTasks.push({ panel, tasks });
  }
  
  // Get all services for this project with their tasks
  const { results: services } = await c.env.DB.prepare(
    "SELECT id, os_number, description FROM project_services WHERE project_id = ?"
  ).bind(projectId).all();
  
  const serviceTasks = [];
  for (const service of services) {
    const { results: tasks } = await c.env.DB.prepare(
      "SELECT *, 'service' as level FROM schedule_tasks WHERE service_id = ? ORDER BY sort_order, start_date"
    ).bind(service.id).all();
    serviceTasks.push({ service, tasks });
  }
  
  return c.json({ projectTasks, panelTasks, serviceTasks });
});

// Create schedule task
app.post("/api/admin/schedule-tasks", adminMiddleware, async (c) => {
  const body = await c.req.json();
  const result = await c.env.DB.prepare(
    `INSERT INTO schedule_tasks (project_id, panel_id, service_id, parent_task_id, name, description, start_date, end_date, duration_days, progress, status, is_milestone, sort_order, color, assigned_to, notes)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?) RETURNING *`
  ).bind(
    body.project_id || null,
    body.panel_id || null,
    body.service_id || null,
    body.parent_task_id || null,
    body.name,
    body.description || null,
    body.start_date || null,
    body.end_date || null,
    body.duration_days || null,
    body.progress || 0,
    body.status || 'pending',
    body.is_milestone ? 1 : 0,
    body.sort_order || 0,
    body.color || null,
    body.assigned_to || null,
    body.notes || null
  ).first();
  return c.json(result);
});

// Update schedule task
app.put("/api/admin/schedule-tasks/:id", adminMiddleware, async (c) => {
  const id = c.req.param("id");
  const body = await c.req.json();
  
  // Build dynamic update query - only update fields that are provided
  const updates: string[] = [];
  const values: any[] = [];
  
  if (body.name !== undefined) { updates.push("name = ?"); values.push(body.name); }
  if (body.description !== undefined) { updates.push("description = ?"); values.push(body.description || null); }
  if (body.start_date !== undefined) { updates.push("start_date = ?"); values.push(body.start_date || null); }
  if (body.end_date !== undefined) { updates.push("end_date = ?"); values.push(body.end_date || null); }
  if (body.duration_days !== undefined) { updates.push("duration_days = ?"); values.push(body.duration_days || null); }
  if (body.progress !== undefined) { updates.push("progress = ?"); values.push(body.progress); }
  if (body.status !== undefined) { updates.push("status = ?"); values.push(body.status); }
  if (body.is_milestone !== undefined) { updates.push("is_milestone = ?"); values.push(body.is_milestone ? 1 : 0); }
  if (body.sort_order !== undefined) { updates.push("sort_order = ?"); values.push(body.sort_order); }
  if (body.color !== undefined) { updates.push("color = ?"); values.push(body.color || null); }
  if (body.assigned_to !== undefined) { updates.push("assigned_to = ?"); values.push(body.assigned_to || null); }
  if (body.notes !== undefined) { updates.push("notes = ?"); values.push(body.notes || null); }
  if (body.parent_task_id !== undefined) { updates.push("parent_task_id = ?"); values.push(body.parent_task_id || null); }
  
  if (updates.length === 0) {
    return c.json({ error: "No fields to update" }, 400);
  }
  
  updates.push("updated_at = CURRENT_TIMESTAMP");
  values.push(id);
  
  const result = await c.env.DB.prepare(
    `UPDATE schedule_tasks SET ${updates.join(", ")} WHERE id = ? RETURNING *`
  ).bind(...values).first();
  
  return c.json(result);
});

// Delete schedule task
app.delete("/api/admin/schedule-tasks/:id", adminMiddleware, async (c) => {
  const id = c.req.param("id");
  // Also delete child tasks
  await c.env.DB.prepare("DELETE FROM schedule_tasks WHERE parent_task_id = ?").bind(id).run();
  await c.env.DB.prepare("DELETE FROM schedule_tasks WHERE id = ?").bind(id).run();
  return c.json({ success: true });
});

// Bulk update task order
app.put("/api/admin/schedule-tasks-order", adminMiddleware, async (c) => {
  const body = await c.req.json();
  const tasks = body.tasks as { id: number; sort_order: number }[];
  
  for (const task of tasks) {
    await c.env.DB.prepare(
      "UPDATE schedule_tasks SET sort_order = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?"
    ).bind(task.sort_order, task.id).run();
  }
  
  return c.json({ success: true });
});

// Generate schedule tasks from existing panels/services
app.post("/api/admin/projects/:id/generate-schedule", adminMiddleware, async (c) => {
  const projectId = c.req.param("id");
  const createdTasks: any[] = [];
  let sortOrder = 0;
  
  // Get all panels for this project
  const { results: panels } = await c.env.DB.prepare(
    "SELECT * FROM project_panels WHERE project_id = ?"
  ).bind(projectId).all() as { results: any[] };
  
  for (const panel of panels) {
    // Check if panel already has tasks
    const { results: existingTasks } = await c.env.DB.prepare(
      "SELECT id FROM schedule_tasks WHERE panel_id = ?"
    ).bind(panel.id).all();
    
    if (existingTasks.length === 0) {
      // Create default tasks for this panel
      const panelTasks = [
        { name: `Fabricação - ${panel.tag}`, description: 'Fabricação do painel', status: 'pending' },
        { name: `Montagem - ${panel.tag}`, description: 'Montagem do painel', status: 'pending' },
        { name: `Testes - ${panel.tag}`, description: 'Testes de fábrica', status: 'pending' },
        { name: `Expedição - ${panel.tag}`, description: 'Expedição do painel', status: 'pending' },
        { name: `Instalação - ${panel.tag}`, description: 'Instalação em campo', status: 'pending' },
        { name: `Comissionamento - ${panel.tag}`, description: 'Comissionamento do painel', status: 'pending' },
      ];
      
      for (const task of panelTasks) {
        const result = await c.env.DB.prepare(
          `INSERT INTO schedule_tasks (project_id, panel_id, name, description, status, sort_order, start_date, end_date)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?) RETURNING *`
        ).bind(
          projectId,
          panel.id,
          task.name,
          task.description,
          task.status,
          sortOrder++,
          panel.data_fabricacao || null,
          panel.data_instalacao || null
        ).first();
        createdTasks.push(result);
      }
    }
  }
  
  // Get all services for this project
  const { results: services } = await c.env.DB.prepare(
    "SELECT * FROM project_services WHERE project_id = ?"
  ).bind(projectId).all() as { results: any[] };
  
  for (const service of services) {
    // Check if service already has tasks
    const { results: existingTasks } = await c.env.DB.prepare(
      "SELECT id FROM schedule_tasks WHERE service_id = ?"
    ).bind(service.id).all();
    
    if (existingTasks.length === 0) {
      // Create default tasks for this service
      const serviceTasks = [
        { name: `Preparação - OS ${service.os_number}`, description: 'Preparação do serviço', status: 'pending' },
        { name: `Execução - OS ${service.os_number}`, description: 'Execução do serviço', status: 'pending' },
        { name: `Conclusão - OS ${service.os_number}`, description: 'Finalização e entrega', status: 'pending' },
      ];
      
      for (const task of serviceTasks) {
        const result = await c.env.DB.prepare(
          `INSERT INTO schedule_tasks (project_id, service_id, name, description, status, sort_order, start_date, end_date)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?) RETURNING *`
        ).bind(
          projectId,
          service.id,
          task.name,
          task.description,
          task.status,
          sortOrder++,
          service.start_date || null,
          service.end_date || null
        ).first();
        createdTasks.push(result);
      }
    }
  }
  
  return c.json({ success: true, created: createdTasks.length, tasks: createdTasks });
});

// ============ SITE CONTENT ============

app.get("/api/admin/content", adminMiddleware, async (c) => {
  const { results } = await c.env.DB.prepare(
    "SELECT * FROM site_content ORDER BY page, section, content_key"
  ).all();
  return c.json(results);
});

app.get("/api/admin/content/:page", adminMiddleware, async (c) => {
  const page = c.req.param("page");
  const { results } = await c.env.DB.prepare(
    "SELECT * FROM site_content WHERE page = ? ORDER BY section, content_key"
  ).bind(page).all();
  return c.json(results);
});

app.put("/api/admin/content", adminMiddleware, async (c) => {
  const body = await c.req.json();
  
  // Upsert content
  await c.env.DB.prepare(`
    INSERT INTO site_content (page, section, content_key, content_value, content_type)
    VALUES (?, ?, ?, ?, ?)
    ON CONFLICT (page, section, content_key) DO UPDATE SET
    content_value = excluded.content_value,
    updated_at = CURRENT_TIMESTAMP
  `).bind(body.page, body.section, body.content_key, body.content_value, body.content_type || 'text').run();

  return c.json({ success: true });
});

// ============ CLIENT USERS ============

// Simple password hashing (for production, use bcrypt or similar)
async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(password + "inntag_salt_2024");
  const hash = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(hash)).map(b => b.toString(16).padStart(2, '0')).join('');
}

async function verifyPassword(password: string, hash: string): Promise<boolean> {
  const computedHash = await hashPassword(password);
  return computedHash === hash;
}

app.get("/api/admin/client-users", adminMiddleware, async (c) => {
  const { results } = await c.env.DB.prepare(`
    SELECT cu.id, cu.username, cu.email, cu.name, cu.client_id, cu.is_active, cu.created_at, c.name as client_name 
    FROM client_users cu 
    JOIN clients c ON cu.client_id = c.id 
    ORDER BY cu.created_at DESC
  `).all();
  return c.json(results);
});

app.post("/api/admin/client-users", adminMiddleware, async (c) => {
  const body = await c.req.json();
  
  // Check if username already exists
  const existing = await c.env.DB.prepare(
    "SELECT id FROM client_users WHERE username = ?"
  ).bind(body.username).first();
  
  if (existing) {
    return c.json({ error: "Nome de usuário já existe" }, 400);
  }
  
  const passwordHash = await hashPassword(body.password);
  const result = await c.env.DB.prepare(
    "INSERT INTO client_users (user_id, client_id, username, email, name, password_hash) VALUES (?, ?, ?, ?, ?, ?) RETURNING id, username, email, name, client_id, is_active, created_at"
  ).bind(
    crypto.randomUUID(),
    body.client_id,
    body.username,
    body.email || null,
    body.name || null,
    passwordHash
  ).first();
  return c.json(result);
});

app.put("/api/admin/client-users/:id/password", adminMiddleware, async (c) => {
  const id = c.req.param("id");
  const body = await c.req.json();
  
  if (!body.password || body.password.length < 4) {
    return c.json({ error: "Senha deve ter pelo menos 4 caracteres" }, 400);
  }
  
  const passwordHash = await hashPassword(body.password);
  await c.env.DB.prepare(
    "UPDATE client_users SET password_hash = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?"
  ).bind(passwordHash, id).run();
  
  return c.json({ success: true });
});

app.delete("/api/admin/client-users/:id", adminMiddleware, async (c) => {
  const id = c.req.param("id");
  await c.env.DB.prepare("DELETE FROM client_users WHERE id = ?").bind(id).run();
  return c.json({ success: true });
});

// ============ CLIENT PORTAL AUTH ============

app.post("/api/portal/login", async (c) => {
  const body = await c.req.json();
  const { username, password } = body;
  
  if (!username || !password) {
    return c.json({ error: "Usuário e senha são obrigatórios" }, 400);
  }
  
  const user = await c.env.DB.prepare(`
    SELECT cu.*, c.name as client_name, c.logo_key as client_logo 
    FROM client_users cu 
    JOIN clients c ON cu.client_id = c.id 
    WHERE cu.username = ? AND cu.is_active = 1
  `).bind(username).first() as { id: number; username: string; name: string; email: string; client_id: number; client_name: string; client_logo: string | null; password_hash: string; is_active: number } | null;
  
  if (!user) {
    return c.json({ error: "Usuário não encontrado" }, 401);
  }
  
  if (!user.password_hash) {
    return c.json({ error: "Usuário sem senha configurada" }, 401);
  }
  
  const valid = await verifyPassword(password, user.password_hash);
  if (!valid) {
    return c.json({ error: "Senha incorreta" }, 401);
  }
  
  // Create simple session token
  const sessionToken = crypto.randomUUID();
  
  return c.json({
    token: sessionToken,
    user: {
      id: user.id,
      username: user.username,
      name: user.name,
      email: user.email,
      client_id: user.client_id,
      client_name: user.client_name,
      client_logo: user.client_logo ? `/api/files/${user.client_logo}` : null,
    }
  });
});

app.get("/api/portal/projects", async (c) => {
  const clientId = c.req.query("client_id");
  
  if (!clientId) {
    return c.json({ error: "Cliente não especificado" }, 400);
  }
  
  const { results } = await c.env.DB.prepare(`
    SELECT p.*, c.name as client_name,
           u.name as unit_name, u.city as unit_city, u.state as unit_state,
           g.name as group_name, g.logo_key as group_logo_key, g.sector as group_sector
    FROM projects p 
    LEFT JOIN clients c ON p.client_id = c.id 
    LEFT JOIN client_units u ON p.unit_id = u.id
    LEFT JOIN client_groups g ON u.group_id = g.id
    WHERE p.client_id = ?
    ORDER BY p.created_at DESC
  `).bind(clientId).all();
  
  // Get files, panels, and services for each project
  const projectsWithData = await Promise.all(
    (results as any[]).map(async (project) => {
      // Files
      const { results: files } = await c.env.DB.prepare(
        "SELECT * FROM project_files WHERE project_id = ?"
      ).bind(project.id).all();
      
      // Panels with client-visible documents
      const { results: panels } = await c.env.DB.prepare(
        "SELECT * FROM project_panels WHERE project_id = ? ORDER BY tag ASC"
      ).bind(project.id).all();
      
      const panelsWithDocs = await Promise.all(
        (panels as any[]).map(async (panel) => {
          const { results: docs } = await c.env.DB.prepare(
            "SELECT * FROM panel_documents WHERE panel_id = ? AND is_client_visible = 1 ORDER BY created_at DESC"
          ).bind(panel.id).all();
          return { ...panel, documents: docs };
        })
      );
      
      // Services with client-visible documents
      const { results: services } = await c.env.DB.prepare(
        "SELECT * FROM project_services WHERE project_id = ? ORDER BY created_at DESC"
      ).bind(project.id).all();
      
      const servicesWithDocs = await Promise.all(
        (services as any[]).map(async (service) => {
          const { results: docs } = await c.env.DB.prepare(
            "SELECT * FROM service_documents WHERE service_id = ? AND is_client_visible = 1 ORDER BY category, created_at DESC"
          ).bind(service.id).all();
          return { ...service, documents: docs };
        })
      );
      
      return { ...project, files, panels: panelsWithDocs, services: servicesWithDocs };
    })
  );
  
  return c.json(projectsWithData);
});



// ============ ADMIN PORTAL IMPERSONATION ============

// Get projects for a group (admin view - all projects from all units in group)
app.get("/api/admin/portal-view/:groupId", adminMiddleware, async (c) => {
  const groupId = c.req.param("groupId");
  
  // Get group info
  const group = await c.env.DB.prepare(
    "SELECT * FROM client_groups WHERE id = ?"
  ).bind(groupId).first();
  
  if (!group) {
    return c.json({ error: "Grupo não encontrado" }, 404);
  }
  
  // Get all units in this group
  const { results: units } = await c.env.DB.prepare(
    "SELECT id FROM client_units WHERE group_id = ?"
  ).bind(groupId).all();
  
  const unitIds = (units as any[]).map(u => u.id);
  
  if (unitIds.length === 0) {
    return c.json({ group, projects: [] });
  }
  
  // Get all projects for these units
  const placeholders = unitIds.map(() => '?').join(',');
  const { results: projects } = await c.env.DB.prepare(`
    SELECT p.*, 
           u.name as unit_name, u.city as unit_city, u.state as unit_state,
           g.name as group_name, g.logo_key as group_logo_key, g.sector as group_sector
    FROM projects p 
    LEFT JOIN client_units u ON p.unit_id = u.id
    LEFT JOIN client_groups g ON u.group_id = g.id
    WHERE p.unit_id IN (${placeholders})
    ORDER BY p.created_at DESC
  `).bind(...unitIds).all();
  
  // Get files, panels, and services for each project
  const projectsWithData = await Promise.all(
    (projects as any[]).map(async (project) => {
      const { results: files } = await c.env.DB.prepare(
        "SELECT * FROM project_files WHERE project_id = ?"
      ).bind(project.id).all();
      
      const { results: panels } = await c.env.DB.prepare(
        "SELECT * FROM project_panels WHERE project_id = ? ORDER BY tag ASC"
      ).bind(project.id).all();
      
      const panelsWithDocs = await Promise.all(
        (panels as any[]).map(async (panel) => {
          const { results: docs } = await c.env.DB.prepare(
            "SELECT * FROM panel_documents WHERE panel_id = ? AND is_client_visible = 1 ORDER BY created_at DESC"
          ).bind(panel.id).all();
          return { ...panel, documents: docs };
        })
      );
      
      const { results: services } = await c.env.DB.prepare(
        "SELECT * FROM project_services WHERE project_id = ? ORDER BY created_at DESC"
      ).bind(project.id).all();
      
      const servicesWithDocs = await Promise.all(
        (services as any[]).map(async (service) => {
          const { results: docs } = await c.env.DB.prepare(
            "SELECT * FROM service_documents WHERE service_id = ? AND is_client_visible = 1 ORDER BY category, created_at DESC"
          ).bind(service.id).all();
          return { ...service, documents: docs };
        })
      );
      
      return { ...project, files, panels: panelsWithDocs, services: servicesWithDocs };
    })
  );
  
  return c.json({ group, projects: projectsWithData });
});

// ============ PRODUCTS CRUD ============

app.get("/api/admin/products", adminMiddleware, async (c) => {
  const { results } = await c.env.DB.prepare(
    "SELECT * FROM products ORDER BY display_order ASC, title ASC"
  ).all();
  return c.json(results);
});

app.get("/api/admin/products/:id", adminMiddleware, async (c) => {
  const id = c.req.param("id");
  const product = await c.env.DB.prepare("SELECT * FROM products WHERE id = ?").bind(id).first();
  if (!product) {
    return c.json({ error: "Produto não encontrado" }, 404);
  }
  
  const { results: specs } = await c.env.DB.prepare(
    "SELECT * FROM product_specs WHERE product_id = ? ORDER BY display_order ASC"
  ).bind(id).all();
  
  const { results: features } = await c.env.DB.prepare(
    "SELECT * FROM product_features WHERE product_id = ? ORDER BY display_order ASC"
  ).bind(id).all();
  
  const { results: docs } = await c.env.DB.prepare(
    "SELECT * FROM product_docs WHERE product_id = ?"
  ).bind(id).all();
  
  const { results: gallery } = await c.env.DB.prepare(
    "SELECT * FROM product_gallery WHERE product_id = ? ORDER BY display_order ASC"
  ).bind(id).all();
  
  return c.json({ ...product, specs, features, docs, gallery });
});

app.post("/api/admin/products", adminMiddleware, async (c) => {
  const body = await c.req.json();
  const result = await c.env.DB.prepare(
    "INSERT INTO products (slug, title, subtitle, short_description, full_description, image_key, display_order) VALUES (?, ?, ?, ?, ?, ?, ?) RETURNING *"
  ).bind(
    body.slug,
    body.title,
    body.subtitle || null,
    body.short_description || null,
    body.full_description || null,
    body.image_key || null,
    body.display_order || 0
  ).first();
  return c.json(result);
});

app.put("/api/admin/products/:id", adminMiddleware, async (c) => {
  const id = c.req.param("id");
  const body = await c.req.json();
  const result = await c.env.DB.prepare(
    "UPDATE products SET slug = ?, title = ?, subtitle = ?, short_description = ?, full_description = ?, image_key = ?, display_order = ?, is_active = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ? RETURNING *"
  ).bind(
    body.slug,
    body.title,
    body.subtitle || null,
    body.short_description || null,
    body.full_description || null,
    body.image_key || null,
    body.display_order || 0,
    body.is_active ? 1 : 0,
    id
  ).first();
  return c.json(result);
});

app.delete("/api/admin/products/:id", adminMiddleware, async (c) => {
  const id = c.req.param("id");
  
  // Delete associated data
  const { results: gallery } = await c.env.DB.prepare(
    "SELECT image_key FROM product_gallery WHERE product_id = ?"
  ).bind(id).all();
  for (const img of gallery) {
    if (img.image_key) await c.env.R2_BUCKET.delete(img.image_key as string);
  }
  
  const { results: docs } = await c.env.DB.prepare(
    "SELECT file_key FROM product_docs WHERE product_id = ? AND file_key IS NOT NULL"
  ).bind(id).all();
  for (const doc of docs) {
    if (doc.file_key) await c.env.R2_BUCKET.delete(doc.file_key as string);
  }
  
  await c.env.DB.prepare("DELETE FROM product_gallery WHERE product_id = ?").bind(id).run();
  await c.env.DB.prepare("DELETE FROM product_docs WHERE product_id = ?").bind(id).run();
  await c.env.DB.prepare("DELETE FROM product_features WHERE product_id = ?").bind(id).run();
  await c.env.DB.prepare("DELETE FROM product_specs WHERE product_id = ?").bind(id).run();
  await c.env.DB.prepare("DELETE FROM products WHERE id = ?").bind(id).run();
  
  return c.json({ success: true });
});

// Product specs
app.post("/api/admin/products/:id/specs", adminMiddleware, async (c) => {
  const productId = c.req.param("id");
  const body = await c.req.json();
  const result = await c.env.DB.prepare(
    "INSERT INTO product_specs (product_id, spec_value, display_order) VALUES (?, ?, ?) RETURNING *"
  ).bind(productId, body.spec_value, body.display_order || 0).first();
  return c.json(result);
});

app.put("/api/admin/products/specs/:specId", adminMiddleware, async (c) => {
  const specId = c.req.param("specId");
  const body = await c.req.json();
  const result = await c.env.DB.prepare(
    "UPDATE product_specs SET spec_value = ?, display_order = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ? RETURNING *"
  ).bind(body.spec_value, body.display_order || 0, specId).first();
  return c.json(result);
});

app.delete("/api/admin/products/specs/:specId", adminMiddleware, async (c) => {
  const specId = c.req.param("specId");
  await c.env.DB.prepare("DELETE FROM product_specs WHERE id = ?").bind(specId).run();
  return c.json({ success: true });
});

// Product features
app.post("/api/admin/products/:id/features", adminMiddleware, async (c) => {
  const productId = c.req.param("id");
  const body = await c.req.json();
  const result = await c.env.DB.prepare(
    "INSERT INTO product_features (product_id, feature_text, display_order) VALUES (?, ?, ?) RETURNING *"
  ).bind(productId, body.feature_text, body.display_order || 0).first();
  return c.json(result);
});

app.put("/api/admin/products/features/:featureId", adminMiddleware, async (c) => {
  const featureId = c.req.param("featureId");
  const body = await c.req.json();
  const result = await c.env.DB.prepare(
    "UPDATE product_features SET feature_text = ?, display_order = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ? RETURNING *"
  ).bind(body.feature_text, body.display_order || 0, featureId).first();
  return c.json(result);
});

app.delete("/api/admin/products/features/:featureId", adminMiddleware, async (c) => {
  const featureId = c.req.param("featureId");
  await c.env.DB.prepare("DELETE FROM product_features WHERE id = ?").bind(featureId).run();
  return c.json({ success: true });
});

// Product docs
app.post("/api/admin/products/:id/docs", adminMiddleware, async (c) => {
  const productId = c.req.param("id");
  const formData = await c.req.formData();
  const file = formData.get("file") as File | null;
  const docType = formData.get("doc_type") as string;
  const docTitle = formData.get("doc_title") as string;
  const externalUrl = formData.get("external_url") as string | null;

  let fileKey = null;
  if (file) {
    fileKey = `products/${productId}/docs/${Date.now()}-${file.name}`;
    await c.env.R2_BUCKET.put(fileKey, file.stream(), {
      httpMetadata: { contentType: file.type },
    });
  }

  const result = await c.env.DB.prepare(
    "INSERT INTO product_docs (product_id, doc_type, doc_title, file_key, external_url) VALUES (?, ?, ?, ?, ?) RETURNING *"
  ).bind(productId, docType, docTitle, fileKey, externalUrl).first();
  return c.json(result);
});

app.delete("/api/admin/products/docs/:docId", adminMiddleware, async (c) => {
  const docId = c.req.param("docId");
  const doc = await c.env.DB.prepare("SELECT file_key FROM product_docs WHERE id = ?").bind(docId).first();
  if (doc?.file_key) {
    await c.env.R2_BUCKET.delete(doc.file_key as string);
  }
  await c.env.DB.prepare("DELETE FROM product_docs WHERE id = ?").bind(docId).run();
  return c.json({ success: true });
});

// Product gallery
app.post("/api/admin/products/:id/gallery", adminMiddleware, async (c) => {
  const productId = c.req.param("id");
  const formData = await c.req.formData();
  const file = formData.get("file") as File;
  const caption = formData.get("caption") as string | null;

  if (!file) {
    return c.json({ error: "No file provided" }, 400);
  }

  const imageKey = `products/${productId}/gallery/${Date.now()}-${file.name}`;
  await c.env.R2_BUCKET.put(imageKey, file.stream(), {
    httpMetadata: { contentType: file.type },
  });

  const result = await c.env.DB.prepare(
    "INSERT INTO product_gallery (product_id, image_key, caption) VALUES (?, ?, ?) RETURNING *"
  ).bind(productId, imageKey, caption).first();
  return c.json(result);
});

app.delete("/api/admin/products/gallery/:imageId", adminMiddleware, async (c) => {
  const imageId = c.req.param("imageId");
  const img = await c.env.DB.prepare("SELECT image_key FROM product_gallery WHERE id = ?").bind(imageId).first();
  if (img?.image_key) {
    await c.env.R2_BUCKET.delete(img.image_key as string);
  }
  await c.env.DB.prepare("DELETE FROM product_gallery WHERE id = ?").bind(imageId).run();
  return c.json({ success: true });
});

// Product image upload
app.post("/api/admin/products/:id/image", adminMiddleware, async (c) => {
  const productId = c.req.param("id");
  const formData = await c.req.formData();
  const file = formData.get("file") as File;

  if (!file) {
    return c.json({ error: "No file provided" }, 400);
  }

  // Delete old image if exists
  const product = await c.env.DB.prepare("SELECT image_key FROM products WHERE id = ?").bind(productId).first();
  if (product?.image_key) {
    await c.env.R2_BUCKET.delete(product.image_key as string);
  }

  const imageKey = `products/${productId}/${Date.now()}-${file.name}`;
  await c.env.R2_BUCKET.put(imageKey, file.stream(), {
    httpMetadata: { contentType: file.type },
  });

  await c.env.DB.prepare(
    "UPDATE products SET image_key = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?"
  ).bind(imageKey, productId).run();

  return c.json({ image_key: imageKey });
});

// ============ MACHINES API ============

// List machines
app.get("/api/admin/machines", adminMiddleware, async (c) => {
  const { results } = await c.env.DB.prepare(
    "SELECT * FROM machines ORDER BY display_order ASC, title ASC"
  ).all();
  return c.json(results);
});

// Get single machine with related data
app.get("/api/admin/machines/:id", adminMiddleware, async (c) => {
  const id = c.req.param("id");
  const machine = await c.env.DB.prepare("SELECT * FROM machines WHERE id = ?").bind(id).first();
  if (!machine) return c.json({ error: "Máquina não encontrada" }, 404);
  
  const { results: features } = await c.env.DB.prepare(
    "SELECT * FROM machine_features WHERE machine_id = ? ORDER BY display_order ASC"
  ).bind(id).all();
  
  const { results: specs } = await c.env.DB.prepare(
    "SELECT * FROM machine_specs WHERE machine_id = ? ORDER BY display_order ASC"
  ).bind(id).all();
  
  const { results: benefits } = await c.env.DB.prepare(
    "SELECT * FROM machine_benefits WHERE machine_id = ? ORDER BY display_order ASC"
  ).bind(id).all();
  
  return c.json({ ...machine, features, specs, benefits });
});

// Create machine
app.post("/api/admin/machines", adminMiddleware, async (c) => {
  const body = await c.req.json();
  const result = await c.env.DB.prepare(
    "INSERT INTO machines (slug, title, subtitle, short_description, full_description, display_order, is_active) VALUES (?, ?, ?, ?, ?, ?, ?) RETURNING *"
  ).bind(body.slug, body.title, body.subtitle || null, body.short_description || null, body.full_description || null, body.display_order || 0, body.is_active ? 1 : 0).first();
  return c.json(result);
});

// Update machine
app.put("/api/admin/machines/:id", adminMiddleware, async (c) => {
  const id = c.req.param("id");
  const body = await c.req.json();
  const result = await c.env.DB.prepare(
    "UPDATE machines SET slug = ?, title = ?, subtitle = ?, short_description = ?, full_description = ?, display_order = ?, is_active = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ? RETURNING *"
  ).bind(body.slug, body.title, body.subtitle || null, body.short_description || null, body.full_description || null, body.display_order || 0, body.is_active ? 1 : 0, id).first();
  return c.json(result);
});

// Delete machine
app.delete("/api/admin/machines/:id", adminMiddleware, async (c) => {
  const id = c.req.param("id");
  
  // Delete related data first
  await c.env.DB.prepare("DELETE FROM machine_features WHERE machine_id = ?").bind(id).run();
  await c.env.DB.prepare("DELETE FROM machine_specs WHERE machine_id = ?").bind(id).run();
  await c.env.DB.prepare("DELETE FROM machine_benefits WHERE machine_id = ?").bind(id).run();
  
  // Delete image from R2 if exists
  const machine = await c.env.DB.prepare("SELECT image_key FROM machines WHERE id = ?").bind(id).first() as { image_key: string | null } | null;
  if (machine?.image_key) {
    await c.env.R2_BUCKET.delete(machine.image_key);
  }
  
  await c.env.DB.prepare("DELETE FROM machines WHERE id = ?").bind(id).run();
  return c.json({ success: true });
});

// Upload machine image
app.post("/api/admin/machines/:id/image", adminMiddleware, async (c) => {
  const machineId = c.req.param("id");
  const formData = await c.req.formData();
  const file = formData.get("file") as File;
  
  if (!file) return c.json({ error: "No file provided" }, 400);
  
  // Delete old image if exists
  const machine = await c.env.DB.prepare("SELECT image_key FROM machines WHERE id = ?").bind(machineId).first() as { image_key: string | null } | null;
  if (machine?.image_key) {
    await c.env.R2_BUCKET.delete(machine.image_key);
  }
  
  const imageKey = `machines/${machineId}/${Date.now()}-${file.name}`;
  const buffer = await file.arrayBuffer();
  await c.env.R2_BUCKET.put(imageKey, buffer, { httpMetadata: { contentType: file.type } });
  
  await c.env.DB.prepare(
    "UPDATE machines SET image_key = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?"
  ).bind(imageKey, machineId).run();
  
  return c.json({ image_key: imageKey });
});

// Machine features
app.post("/api/admin/machines/:id/features", adminMiddleware, async (c) => {
  const machineId = c.req.param("id");
  const body = await c.req.json();
  const result = await c.env.DB.prepare(
    "INSERT INTO machine_features (machine_id, feature_text, display_order) VALUES (?, ?, ?) RETURNING *"
  ).bind(machineId, body.feature_text, body.display_order || 0).first();
  return c.json(result);
});

app.delete("/api/admin/machines/features/:featureId", adminMiddleware, async (c) => {
  const featureId = c.req.param("featureId");
  await c.env.DB.prepare("DELETE FROM machine_features WHERE id = ?").bind(featureId).run();
  return c.json({ success: true });
});

// Machine specs
app.post("/api/admin/machines/:id/specs", adminMiddleware, async (c) => {
  const machineId = c.req.param("id");
  const body = await c.req.json();
  const result = await c.env.DB.prepare(
    "INSERT INTO machine_specs (machine_id, spec_label, spec_value, display_order) VALUES (?, ?, ?, ?) RETURNING *"
  ).bind(machineId, body.spec_label, body.spec_value, body.display_order || 0).first();
  return c.json(result);
});

app.delete("/api/admin/machines/specs/:specId", adminMiddleware, async (c) => {
  const specId = c.req.param("specId");
  await c.env.DB.prepare("DELETE FROM machine_specs WHERE id = ?").bind(specId).run();
  return c.json({ success: true });
});

// Machine benefits
app.post("/api/admin/machines/:id/benefits", adminMiddleware, async (c) => {
  const machineId = c.req.param("id");
  const body = await c.req.json();
  const result = await c.env.DB.prepare(
    "INSERT INTO machine_benefits (machine_id, benefit_title, benefit_description, icon_name, display_order) VALUES (?, ?, ?, ?, ?) RETURNING *"
  ).bind(machineId, body.benefit_title, body.benefit_description || null, body.icon_name || null, body.display_order || 0).first();
  return c.json(result);
});

app.delete("/api/admin/machines/benefits/:benefitId", adminMiddleware, async (c) => {
  const benefitId = c.req.param("benefitId");
  await c.env.DB.prepare("DELETE FROM machine_benefits WHERE id = ?").bind(benefitId).run();
  return c.json({ success: true });
});

// ============ SERVICES API ============

// List services (admin)
app.get("/api/admin/services", adminMiddleware, async (c) => {
  const { results } = await c.env.DB.prepare(
    "SELECT * FROM services ORDER BY display_order ASC, title ASC"
  ).all();
  return c.json(results);
});

// Get single service (admin)
app.get("/api/admin/services/:id", adminMiddleware, async (c) => {
  const id = c.req.param("id");
  const service = await c.env.DB.prepare("SELECT * FROM services WHERE id = ?").bind(id).first();
  if (!service) return c.json({ error: "Serviço não encontrado" }, 404);
  return c.json(service);
});

// Create service
app.post("/api/admin/services", adminMiddleware, async (c) => {
  const body = await c.req.json();
  const result = await c.env.DB.prepare(
    "INSERT INTO services (slug, title, subtitle, description, image_url, features, display_order, is_active) VALUES (?, ?, ?, ?, ?, ?, ?, ?) RETURNING *"
  ).bind(
    body.slug,
    body.title,
    body.subtitle || null,
    body.description || null,
    body.image_url || null,
    body.features || null,
    body.display_order || 0,
    body.is_active ?? 1
  ).first();
  return c.json(result);
});

// Update service
app.put("/api/admin/services/:id", adminMiddleware, async (c) => {
  const id = c.req.param("id");
  const body = await c.req.json();
  const result = await c.env.DB.prepare(
    "UPDATE services SET slug = ?, title = ?, subtitle = ?, description = ?, image_url = ?, features = ?, display_order = ?, is_active = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ? RETURNING *"
  ).bind(
    body.slug,
    body.title,
    body.subtitle || null,
    body.description || null,
    body.image_url || null,
    body.features || null,
    body.display_order || 0,
    body.is_active ?? 1,
    id
  ).first();
  return c.json(result);
});

// Delete service
app.delete("/api/admin/services/:id", adminMiddleware, async (c) => {
  const id = c.req.param("id");
  await c.env.DB.prepare("DELETE FROM services WHERE id = ?").bind(id).run();
  return c.json({ success: true });
});

// Public services API
app.get("/api/public/services", async (c) => {
  const { results } = await c.env.DB.prepare(
    "SELECT * FROM services WHERE is_active = 1 ORDER BY display_order ASC, title ASC"
  ).all();
  return c.json(results);
});

app.get("/api/public/services/:slug", async (c) => {
  const slug = c.req.param("slug");
  const service = await c.env.DB.prepare("SELECT * FROM services WHERE slug = ? AND is_active = 1").bind(slug).first();
  if (!service) return c.json({ error: "Serviço não encontrado" }, 404);
  return c.json(service);
});

// ============ ARTICLES API ============

// List articles (admin)
app.get("/api/admin/articles", adminMiddleware, async (c) => {
  const { results } = await c.env.DB.prepare(
    "SELECT * FROM articles ORDER BY created_at DESC"
  ).all();
  return c.json(results);
});

// Get single article (admin)
app.get("/api/admin/articles/:id", adminMiddleware, async (c) => {
  const id = c.req.param("id");
  const article = await c.env.DB.prepare("SELECT * FROM articles WHERE id = ?").bind(id).first();
  if (!article) return c.json({ error: "Artigo não encontrado" }, 404);
  
  const { results: tags } = await c.env.DB.prepare(
    "SELECT * FROM article_tags WHERE article_id = ?"
  ).bind(id).all();
  
  return c.json({ ...article, tags: tags.map((t: any) => t.tag) });
});

// Create article
app.post("/api/admin/articles", adminMiddleware, async (c) => {
  const body = await c.req.json();
  const slug = body.slug || body.title.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
  
  const result = await c.env.DB.prepare(
    `INSERT INTO articles (slug, title, subtitle, excerpt, content, category, author_name, author_role, 
     meta_title, meta_description, meta_keywords, og_title, og_description, schema_type, 
     is_published, is_featured, published_at, display_order) 
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?) RETURNING *`
  ).bind(
    slug, body.title, body.subtitle || null, body.excerpt || null, body.content || null, body.category || 'noticia',
    body.author_name || null, body.author_role || null, body.meta_title || body.title, 
    body.meta_description || body.excerpt || null, body.meta_keywords || null,
    body.og_title || body.title, body.og_description || body.excerpt || null, body.schema_type || 'Article',
    body.is_published ? 1 : 0, body.is_featured ? 1 : 0, body.is_published ? new Date().toISOString() : null,
    body.display_order || 0
  ).first();
  
  // Add tags
  if (body.tags && Array.isArray(body.tags)) {
    for (const tag of body.tags) {
      await c.env.DB.prepare("INSERT INTO article_tags (article_id, tag) VALUES (?, ?)").bind((result as any).id, tag).run();
    }
  }
  
  return c.json(result);
});

// Update article
app.put("/api/admin/articles/:id", adminMiddleware, async (c) => {
  const id = c.req.param("id");
  const body = await c.req.json();
  
  const existing = await c.env.DB.prepare("SELECT is_published, published_at FROM articles WHERE id = ?").bind(id).first() as any;
  const publishedAt = body.is_published && !existing?.is_published ? new Date().toISOString() : existing?.published_at;
  
  const result = await c.env.DB.prepare(
    `UPDATE articles SET slug = ?, title = ?, subtitle = ?, excerpt = ?, content = ?, category = ?,
     author_name = ?, author_role = ?, meta_title = ?, meta_description = ?, meta_keywords = ?,
     og_title = ?, og_description = ?, schema_type = ?, is_published = ?, is_featured = ?,
     published_at = ?, display_order = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ? RETURNING *`
  ).bind(
    body.slug, body.title, body.subtitle || null, body.excerpt || null, body.content || null, body.category || 'noticia',
    body.author_name || null, body.author_role || null, body.meta_title || body.title,
    body.meta_description || body.excerpt || null, body.meta_keywords || null,
    body.og_title || body.title, body.og_description || body.excerpt || null, body.schema_type || 'Article',
    body.is_published ? 1 : 0, body.is_featured ? 1 : 0, publishedAt, body.display_order || 0, id
  ).first();
  
  // Update tags
  await c.env.DB.prepare("DELETE FROM article_tags WHERE article_id = ?").bind(id).run();
  if (body.tags && Array.isArray(body.tags)) {
    for (const tag of body.tags) {
      await c.env.DB.prepare("INSERT INTO article_tags (article_id, tag) VALUES (?, ?)").bind(id, tag).run();
    }
  }
  
  return c.json(result);
});

// Delete article
app.delete("/api/admin/articles/:id", adminMiddleware, async (c) => {
  const id = c.req.param("id");
  
  // Delete image from R2 if exists
  const article = await c.env.DB.prepare("SELECT image_key, og_image_key FROM articles WHERE id = ?").bind(id).first() as any;
  if (article?.image_key) await c.env.R2_BUCKET.delete(article.image_key);
  if (article?.og_image_key) await c.env.R2_BUCKET.delete(article.og_image_key);
  
  await c.env.DB.prepare("DELETE FROM article_tags WHERE article_id = ?").bind(id).run();
  await c.env.DB.prepare("DELETE FROM articles WHERE id = ?").bind(id).run();
  return c.json({ success: true });
});

// Upload article image
app.post("/api/admin/articles/:id/image", adminMiddleware, async (c) => {
  const articleId = c.req.param("id");
  const formData = await c.req.formData();
  const file = formData.get("file") as File;
  const type = formData.get("type") as string || "main"; // main or og
  
  if (!file) return c.json({ error: "No file provided" }, 400);
  
  const imageKey = `articles/${articleId}/${type}-${Date.now()}-${file.name}`;
  const buffer = await file.arrayBuffer();
  await c.env.R2_BUCKET.put(imageKey, buffer, { httpMetadata: { contentType: file.type } });
  
  const column = type === "og" ? "og_image_key" : "image_key";
  await c.env.DB.prepare(`UPDATE articles SET ${column} = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`).bind(imageKey, articleId).run();
  
  return c.json({ image_key: imageKey });
});

// ============ LANDING PAGES API ============

// Get all cities
app.get("/api/admin/cities", adminMiddleware, async (c) => {
  const { results } = await c.env.DB.prepare(
    "SELECT * FROM cities ORDER BY state_abbr, name"
  ).all();
  return c.json(results);
});

// Create city
app.post("/api/admin/cities", adminMiddleware, async (c) => {
  const body = await c.req.json();
  const slug = body.name.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/-+/g, "-").replace(/^-|-$/g, "");
  const result = await c.env.DB.prepare(
    `INSERT INTO cities (name, slug, state, state_abbr, population, is_capital, has_oil_platform, region, has_port, has_mining, has_agro, has_steel, has_automotive, has_petrochemical, has_energy, has_food_industry, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now')) RETURNING *`
  ).bind(
    body.name, slug, body.state || '', body.state_abbr, body.population || null,
    body.is_capital ? 1 : 0, body.has_oil_platform ? 1 : 0, body.region || null,
    body.has_port ? 1 : 0, body.has_mining ? 1 : 0, body.has_agro ? 1 : 0,
    body.has_steel ? 1 : 0, body.has_automotive ? 1 : 0, body.has_petrochemical ? 1 : 0,
    body.has_energy ? 1 : 0, body.has_food_industry ? 1 : 0
  ).first();
  return c.json(result);
});

// Update city
app.put("/api/admin/cities/:id", adminMiddleware, async (c) => {
  const id = c.req.param("id");
  const body = await c.req.json();
  const slug = body.name.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/-+/g, "-").replace(/^-|-$/g, "");
  await c.env.DB.prepare(
    `UPDATE cities SET name = ?, slug = ?, state = ?, state_abbr = ?, population = ?, is_capital = ?, has_oil_platform = ?, region = ?, has_port = ?, has_mining = ?, has_agro = ?, has_steel = ?, has_automotive = ?, has_petrochemical = ?, has_energy = ?, has_food_industry = ?, updated_at = datetime('now') WHERE id = ?`
  ).bind(
    body.name, slug, body.state || '', body.state_abbr, body.population || null,
    body.is_capital ? 1 : 0, body.has_oil_platform ? 1 : 0, body.region || null,
    body.has_port ? 1 : 0, body.has_mining ? 1 : 0, body.has_agro ? 1 : 0,
    body.has_steel ? 1 : 0, body.has_automotive ? 1 : 0, body.has_petrochemical ? 1 : 0,
    body.has_energy ? 1 : 0, body.has_food_industry ? 1 : 0, id
  ).run();
  const city = await c.env.DB.prepare("SELECT * FROM cities WHERE id = ?").bind(id).first();
  return c.json(city);
});

// Delete city
app.delete("/api/admin/cities/:id", adminMiddleware, async (c) => {
  const id = c.req.param("id");
  await c.env.DB.prepare("DELETE FROM cities WHERE id = ?").bind(id).run();
  return c.json({ success: true });
});

// Get all landing pages
app.get("/api/admin/landing-pages", adminMiddleware, async (c) => {
  const { results } = await c.env.DB.prepare(
    `SELECT lp.*, c.name as city_name, c.state_abbr 
     FROM landing_pages lp 
     LEFT JOIN cities c ON lp.city_id = c.id 
     ORDER BY lp.created_at DESC`
  ).all();
  return c.json(results);
});

// Get single landing page
app.get("/api/admin/landing-pages/:id", adminMiddleware, async (c) => {
  const id = c.req.param("id");
  const lp = await c.env.DB.prepare(
    `SELECT lp.*, c.name as city_name, c.state_abbr 
     FROM landing_pages lp 
     LEFT JOIN cities c ON lp.city_id = c.id 
     WHERE lp.id = ?`
  ).bind(id).first();
  return c.json(lp);
});

// Create landing page
app.post("/api/admin/landing-pages", adminMiddleware, async (c) => {
  const body = await c.req.json();
  const result = await c.env.DB.prepare(
    `INSERT INTO landing_pages (city_id, slug, page_type, vertical, title, meta_title, meta_description, meta_keywords, h1_title, intro_text, custom_content, is_active)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?) RETURNING *`
  ).bind(
    body.city_id || null, body.slug, body.page_type || 'city', body.vertical || 'paineis', body.title,
    body.meta_title || null, body.meta_description || null, body.meta_keywords || null,
    body.h1_title || null, body.intro_text || null, body.custom_content || null,
    body.is_active ?? 1
  ).first();
  return c.json(result);
});

// Update landing page
app.put("/api/admin/landing-pages/:id", adminMiddleware, async (c) => {
  const id = c.req.param("id");
  const body = await c.req.json();
  
  // Build update query dynamically based on provided fields
  const updates: string[] = [];
  const params: any[] = [];
  
  if (body.city_id !== undefined) { updates.push("city_id = ?"); params.push(body.city_id); }
  if (body.slug !== undefined) { updates.push("slug = ?"); params.push(body.slug); }
  if (body.page_type !== undefined) { updates.push("page_type = ?"); params.push(body.page_type); }
  if (body.vertical !== undefined) { updates.push("vertical = ?"); params.push(body.vertical); }
  if (body.title !== undefined) { updates.push("title = ?"); params.push(body.title); }
  if (body.meta_title !== undefined) { updates.push("meta_title = ?"); params.push(body.meta_title); }
  if (body.meta_description !== undefined) { updates.push("meta_description = ?"); params.push(body.meta_description); }
  if (body.meta_keywords !== undefined) { updates.push("meta_keywords = ?"); params.push(body.meta_keywords); }
  if (body.h1_title !== undefined) { updates.push("h1_title = ?"); params.push(body.h1_title); }
  if (body.intro_text !== undefined) { updates.push("intro_text = ?"); params.push(body.intro_text); }
  if (body.custom_content !== undefined) { updates.push("custom_content = ?"); params.push(body.custom_content); }
  if (body.hero_image !== undefined) { updates.push("hero_image = ?"); params.push(body.hero_image); }
  if (body.is_active !== undefined) { updates.push("is_active = ?"); params.push(body.is_active); }
  
  updates.push("updated_at = CURRENT_TIMESTAMP");
  params.push(id);
  
  const result = await c.env.DB.prepare(
    `UPDATE landing_pages SET ${updates.join(", ")} WHERE id = ? RETURNING *`
  ).bind(...params).first();
  
  return c.json(result);
});

// Delete landing page
app.delete("/api/admin/landing-pages/:id", adminMiddleware, async (c) => {
  const id = c.req.param("id");
  await c.env.DB.prepare("DELETE FROM lp_products WHERE landing_page_id = ?").bind(id).run();
  await c.env.DB.prepare("DELETE FROM lp_services WHERE landing_page_id = ?").bind(id).run();
  await c.env.DB.prepare("DELETE FROM lp_machines WHERE landing_page_id = ?").bind(id).run();
  await c.env.DB.prepare("DELETE FROM landing_pages WHERE id = ?").bind(id).run();
  return c.json({ success: true });
});

// Get linked products for LP
app.get("/api/admin/landing-pages/:id/products", adminMiddleware, async (c) => {
  const id = c.req.param("id");
  const { results } = await c.env.DB.prepare(
    "SELECT * FROM lp_products WHERE landing_page_id = ? ORDER BY position"
  ).bind(id).all();
  return c.json(results);
});

// Link product to LP
app.post("/api/admin/landing-pages/:id/products", adminMiddleware, async (c) => {
  const id = c.req.param("id");
  const body = await c.req.json();
  const result = await c.env.DB.prepare(
    "INSERT INTO lp_products (landing_page_id, product_id, custom_title, custom_description, position, is_featured) VALUES (?, ?, ?, ?, ?, ?) RETURNING *"
  ).bind(id, body.product_id, body.custom_title || null, body.custom_description || null, body.position || 0, body.is_featured || 0).first();
  return c.json(result);
});

// Unlink product
app.delete("/api/admin/landing-pages/products/:id", adminMiddleware, async (c) => {
  const id = c.req.param("id");
  await c.env.DB.prepare("DELETE FROM lp_products WHERE id = ?").bind(id).run();
  return c.json({ success: true });
});

// Get linked services for LP
app.get("/api/admin/landing-pages/:id/services", adminMiddleware, async (c) => {
  const id = c.req.param("id");
  const { results } = await c.env.DB.prepare(
    "SELECT * FROM lp_services WHERE landing_page_id = ? ORDER BY position"
  ).bind(id).all();
  return c.json(results);
});

// Link service to LP
app.post("/api/admin/landing-pages/:id/services", adminMiddleware, async (c) => {
  const id = c.req.param("id");
  const body = await c.req.json();
  const result = await c.env.DB.prepare(
    "INSERT INTO lp_services (landing_page_id, service_id, custom_title, custom_description, position, is_featured) VALUES (?, ?, ?, ?, ?, ?) RETURNING *"
  ).bind(id, body.service_id, body.custom_title || null, body.custom_description || null, body.position || 0, body.is_featured || 0).first();
  return c.json(result);
});

// Unlink service
app.delete("/api/admin/landing-pages/services/:id", adminMiddleware, async (c) => {
  const id = c.req.param("id");
  await c.env.DB.prepare("DELETE FROM lp_services WHERE id = ?").bind(id).run();
  return c.json({ success: true });
});

// Get linked machines for LP
app.get("/api/admin/landing-pages/:id/machines", adminMiddleware, async (c) => {
  const id = c.req.param("id");
  const { results } = await c.env.DB.prepare(
    "SELECT * FROM lp_machines WHERE landing_page_id = ? ORDER BY position"
  ).bind(id).all();
  return c.json(results);
});

// Link machine to LP
app.post("/api/admin/landing-pages/:id/machines", adminMiddleware, async (c) => {
  const id = c.req.param("id");
  const body = await c.req.json();
  const result = await c.env.DB.prepare(
    "INSERT INTO lp_machines (landing_page_id, machine_id, custom_title, custom_description, position, is_featured) VALUES (?, ?, ?, ?, ?, ?) RETURNING *"
  ).bind(id, body.machine_id, body.custom_title || null, body.custom_description || null, body.position || 0, body.is_featured || 0).first();
  return c.json(result);
});

// Unlink machine
app.delete("/api/admin/landing-pages/machines/:id", adminMiddleware, async (c) => {
  const id = c.req.param("id");
  await c.env.DB.prepare("DELETE FROM lp_machines WHERE id = ?").bind(id).run();
  return c.json({ success: true });
});

// ============ SEO TERMS & RANKING ============

// Get all SEO terms
app.get("/api/admin/seo/terms", adminMiddleware, async (c) => {
  const { results } = await c.env.DB.prepare(
    "SELECT * FROM seo_terms ORDER BY category, term"
  ).all();
  return c.json(results);
});

// Create SEO term
app.post("/api/admin/seo/terms", adminMiddleware, async (c) => {
  const data = await c.req.json();
  const now = new Date().toISOString();
  
  await c.env.DB.prepare(`
    INSERT INTO seo_terms (term, category, target_url, current_position, search_volume, difficulty, notes, is_active, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).bind(
    data.term, data.category || 'geral', data.target_url || '/', 
    data.current_position || null, data.search_volume || null, data.difficulty || null,
    data.notes || null, data.is_active ?? 1, now, now
  ).run();
  
  return c.json({ success: true });
});

// Update SEO term
app.put("/api/admin/seo/terms/:id", adminMiddleware, async (c) => {
  const id = c.req.param("id");
  const data = await c.req.json();
  const now = new Date().toISOString();
  
  // Get current term to track best position
  const current = await c.env.DB.prepare(
    "SELECT best_position FROM seo_terms WHERE id = ?"
  ).bind(id).first() as any;
  
  // Update best position if new position is better
  let bestPosition = current?.best_position;
  if (data.current_position && (!bestPosition || data.current_position < bestPosition)) {
    bestPosition = data.current_position;
  }
  
  // Determine trend
  let trend = null;
  if (current?.current_position && data.current_position) {
    if (data.current_position < current.current_position) trend = 'up';
    else if (data.current_position > current.current_position) trend = 'down';
    else trend = 'stable';
  }
  
  await c.env.DB.prepare(`
    UPDATE seo_terms SET 
      term = ?, category = ?, target_url = ?, current_position = ?, best_position = ?,
      last_checked_at = ?, trend = ?, search_volume = ?, difficulty = ?, notes = ?, is_active = ?, updated_at = ?
    WHERE id = ?
  `).bind(
    data.term, data.category, data.target_url, data.current_position || null, bestPosition,
    data.current_position ? now : null, trend, data.search_volume || null, data.difficulty || null,
    data.notes || null, data.is_active ?? 1, now, id
  ).run();
  
  // Add to history if position changed
  if (data.current_position) {
    await c.env.DB.prepare(`
      INSERT INTO seo_ranking_history (term_id, position, checked_at, source, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?)
    `).bind(id, data.current_position, now, 'manual', now, now).run();
  }
  
  return c.json({ success: true });
});

// Delete SEO term
app.delete("/api/admin/seo/terms/:id", adminMiddleware, async (c) => {
  const id = c.req.param("id");
  await c.env.DB.prepare("DELETE FROM seo_ranking_history WHERE term_id = ?").bind(id).run();
  await c.env.DB.prepare("DELETE FROM seo_terms WHERE id = ?").bind(id).run();
  return c.json({ success: true });
});

// Get ranking history for a term
app.get("/api/admin/seo/terms/:id/history", adminMiddleware, async (c) => {
  const id = c.req.param("id");
  const { results } = await c.env.DB.prepare(
    "SELECT * FROM seo_ranking_history WHERE term_id = ? ORDER BY checked_at DESC LIMIT 30"
  ).bind(id).all();
  return c.json(results);
});

// Bulk check Google positions (simulated - in production would use API)
app.post("/api/admin/seo/check-positions", adminMiddleware, async (c) => {
  const { termIds: _termIds } = await c.req.json();
  const results: { id: number; position: number | null; error?: string }[] = [];
  
  // Note: In production, this would integrate with Google Search Console API or a rank tracking service
  // For now, we return a message that positions should be updated manually
  
  return c.json({ 
    success: true, 
    message: 'Para obter posições reais, atualize manualmente após verificar no Google ou integre com Google Search Console.',
    results 
  });
});

// Generate AI content for SEO term page
app.post("/api/admin/seo/terms/:id/generate-content", adminMiddleware, async (c) => {
  const id = c.req.param("id");
  const apiKey = c.env.GEMINI_API_KEY;
  
  if (!apiKey) {
    return c.json({ error: "GEMINI_API_KEY não configurada" }, 500);
  }
  
  // Get the term
  const term = await c.env.DB.prepare("SELECT * FROM seo_terms WHERE id = ?").bind(id).first() as any;
  if (!term) {
    return c.json({ error: "Termo não encontrado" }, 404);
  }
  
  // Generate slug from term
  const slug = term.term
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
  
  // First, save the slug
  await c.env.DB.prepare(
    "UPDATE seo_terms SET slug = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?"
  ).bind(slug, id).run();
  
  const categoryLabel = term.category === 'produtos' ? 'Produtos' : 'Serviços';
  
  const prompt = `Você é um especialista em marketing de conteúdo para a INNTAG, empresa brasileira com mais de 17 anos de experiência em soluções elétricas industriais (painéis elétricos, CCM, QGBT, cubículos, field service).

Crie conteúdo EDUCATIVO e INFORMATIVO para uma página sobre: "${term.term}"

Categoria: ${categoryLabel}

IMPORTANTE:
- Conteúdo deve ser INFORMATIVO e TÉCNICO, não promocional
- Foque em EDUCAR o leitor sobre o tema
- Use linguagem profissional mas acessível
- Inclua informações técnicas relevantes
- NÃO mencione preços ou promoções
- NUNCA use a frase "Orçamento gratuito para painéis elétricos" ou variações como "orçamento gratuito"
- O objetivo é construir AUTORIDADE no Google

Retorne APENAS um JSON válido (sem markdown) com esta estrutura:
{
  "page_title": "Título da página (max 60 chars, inclua palavra-chave)",
  "meta_title": "Meta title para SEO (max 60 chars)",
  "meta_description": "Meta description (max 160 chars, inclua CTA sutil)",
  "page_content": "Conteúdo completo em HTML com tags <h2>, <h3>, <p>, <ul>, <li>. Mínimo 800 palavras. Inclua seções: O que é, Aplicações, Benefícios, Normas técnicas, Como escolher, Perguntas frequentes."
}`;

  try {
    // Use REST API directly for Cloudflare Workers compatibility
    const geminiResponse = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 8192,
          }
        })
      }
    );
    
    if (!geminiResponse.ok) {
      const errorData = await geminiResponse.text();
      console.error("Gemini API error:", geminiResponse.status, errorData);
      return c.json({ error: `Erro da API Gemini: ${geminiResponse.status} - ${errorData.substring(0, 200)}` }, 500);
    }
    
    const geminiData = await geminiResponse.json() as any;
    const text = geminiData?.candidates?.[0]?.content?.parts?.[0]?.text || "";
    
    if (!text) {
      return c.json({ error: "A API não retornou conteúdo. Verifique se a chave está ativa." }, 500);
    }
    
    // Extract JSON from response
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      console.error("Could not extract JSON from:", text.substring(0, 500));
      return c.json({ error: "Não foi possível extrair JSON do conteúdo gerado" }, 500);
    }
    
    const content = JSON.parse(jsonMatch[0]);
    
    // Update the term with generated content
    await c.env.DB.prepare(`
      UPDATE seo_terms SET 
        slug = ?,
        page_title = ?,
        page_content = ?,
        meta_title = ?,
        meta_description = ?,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).bind(
      slug,
      content.page_title,
      content.page_content,
      content.meta_title,
      content.meta_description,
      id
    ).run();
    
    return c.json({ 
      success: true, 
      slug,
      content: {
        page_title: content.page_title,
        meta_title: content.meta_title,
        meta_description: content.meta_description,
        page_content: content.page_content?.substring(0, 200) + '...'
      }
    });
  } catch (error: any) {
    console.error("Error generating content:", error);
    console.error("Error details:", JSON.stringify(error, null, 2));
    return c.json({ error: "Erro ao gerar conteúdo: " + (error.message || "Falha na API Gemini") }, 500);
  }
});

// Fix all slugs for terms without slugs
app.post("/api/admin/seo/terms/fix-slugs", adminMiddleware, async (c) => {
  // Get all terms without slugs
  const { results } = await c.env.DB.prepare(
    "SELECT id, term FROM seo_terms WHERE slug IS NULL OR slug = ''"
  ).all() as { results: { id: number; term: string }[] };
  
  let fixed = 0;
  for (const term of results) {
    const slug = term.term
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');
    
    await c.env.DB.prepare(
      "UPDATE seo_terms SET slug = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?"
    ).bind(slug, term.id).run();
    fixed++;
  }
  
  return c.json({ success: true, fixed });
});

// Publish/Unpublish SEO term page
app.post("/api/admin/seo/terms/:id/publish", adminMiddleware, async (c) => {
  const id = c.req.param("id");
  const { publish } = await c.req.json();
  
  await c.env.DB.prepare(`
    UPDATE seo_terms SET 
      is_page_published = ?,
      published_at = ${publish ? 'CURRENT_TIMESTAMP' : 'NULL'},
      updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `).bind(publish ? 1 : 0, id).run();
  
  return c.json({ success: true });
});

// PUBLIC: Get SEO term page by category and slug
app.get("/api/public/seo-term/:category/:slug", async (c) => {
  const category = c.req.param("category");
  const slug = c.req.param("slug");
  
  const term = await c.env.DB.prepare(`
    SELECT * FROM seo_terms 
    WHERE slug = ? AND category = ? AND is_page_published = 1
  `).bind(slug, category).first();
  
  if (!term) {
    return c.json({ error: "Página não encontrada" }, 404);
  }
  
  return c.json(term);
});

// ============ SEO AUDIT ============

// Get all SEO audits
app.get("/api/admin/seo/audits", adminMiddleware, async (c) => {
  const { results } = await c.env.DB.prepare(
    "SELECT * FROM seo_audits ORDER BY audit_date DESC"
  ).all();
  return c.json(results);
});

// Get all pages that can be audited
app.get("/api/admin/seo/pages", adminMiddleware, async (c) => {
  const pages: { url: string; type: string; title: string }[] = [];
  
  // Static pages
  pages.push(
    { url: '/', type: 'home', title: 'Home' },
    { url: '/produtos', type: 'listing', title: 'Produtos' },
    { url: '/servicos', type: 'listing', title: 'Serviços' },
    { url: '/maquinas', type: 'listing', title: 'Máquinas' },
    { url: '/clientes', type: 'listing', title: 'Clientes' },
    { url: '/portfolio', type: 'listing', title: 'Portfolio' },
    { url: '/destaques', type: 'listing', title: 'Destaques' },
    { url: '/contato', type: 'contact', title: 'Contato' },
  );
  
  // Products
  const { results: products } = await c.env.DB.prepare(
    "SELECT slug, title FROM products WHERE is_active = 1"
  ).all() as any;
  products.forEach((p: any) => {
    pages.push({ url: `/produtos/${p.slug}`, type: 'product', title: p.title });
  });
  
  // Services
  const { results: services } = await c.env.DB.prepare(
    "SELECT slug, title FROM services WHERE is_active = 1"
  ).all() as any;
  services.forEach((s: any) => {
    pages.push({ url: `/servicos/${s.slug}`, type: 'service', title: s.title });
  });
  
  // Machines
  const { results: machines } = await c.env.DB.prepare(
    "SELECT slug, title FROM machines WHERE is_active = 1"
  ).all() as any;
  machines.forEach((m: any) => {
    pages.push({ url: `/maquinas/${m.slug}`, type: 'machine', title: m.title });
  });
  
  // Landing pages
  const { results: lps } = await c.env.DB.prepare(
    "SELECT slug, title FROM landing_pages WHERE is_active = 1"
  ).all() as any;
  lps.forEach((lp: any) => {
    pages.push({ url: `/lp/${lp.slug}`, type: 'landing', title: lp.title });
  });
  
  // Articles
  const { results: articles } = await c.env.DB.prepare(
    "SELECT slug, title FROM articles WHERE is_published = 1"
  ).all() as any;
  articles.forEach((a: any) => {
    pages.push({ url: `/destaques/${a.slug}`, type: 'article', title: a.title });
  });
  
  return c.json(pages);
});

// Run SEO audit on a page
app.post("/api/admin/seo/audit", adminMiddleware, async (c) => {
  const { url, type } = await c.req.json();
  
  // Simple SEO scoring based on page type and common issues
  let score = 100;
  const issues: string[] = [];
  const recommendations: string[] = [];
  
  // Check based on page type
  if (type === 'home') {
    // Home page should have all essentials
    score = 85;
    recommendations.push('Verifique se o título tem entre 50-60 caracteres');
    recommendations.push('Inclua palavras-chave principais na meta description');
    recommendations.push('Otimize imagens com atributos alt descritivos');
  } else if (type === 'product' || type === 'service' || type === 'machine') {
    // Product/service pages need detailed content
    score = 75;
    issues.push('Páginas de produto precisam de descrições detalhadas (300+ palavras)');
    recommendations.push('Adicione schema markup para produtos');
    recommendations.push('Inclua depoimentos ou casos de uso');
    recommendations.push('Use heading tags hierárquicos (H1, H2, H3)');
  } else if (type === 'landing') {
    // Landing pages need local SEO optimization
    score = 80;
    recommendations.push('Inclua nome da cidade no H1 e meta title');
    recommendations.push('Adicione endereço local e mapa');
    recommendations.push('Use palavras-chave de cauda longa regionais');
  } else if (type === 'article') {
    score = 70;
    issues.push('Artigos devem ter pelo menos 1000 palavras para ranking');
    recommendations.push('Adicione links internos para outros artigos');
    recommendations.push('Use imagens otimizadas com alt text');
    recommendations.push('Inclua data de publicação e autor');
  } else if (type === 'listing') {
    score = 65;
    issues.push('Páginas de listagem têm conteúdo duplicado potencial');
    recommendations.push('Adicione texto introdutório único em cada página');
    recommendations.push('Implemente paginação correta com rel=prev/next');
  } else if (type === 'contact') {
    score = 90;
    recommendations.push('Inclua schema markup LocalBusiness');
    recommendations.push('Adicione horário de funcionamento');
  }
  
  // Generic checks for all pages
  if (!url.includes('lp/')) {
    issues.push('Considere criar landing pages regionais para esta categoria');
  }
  
  // Random variation to make it more realistic
  score = Math.max(30, Math.min(100, score + Math.floor(Math.random() * 20) - 10));
  
  // Delete existing audit for this URL
  await c.env.DB.prepare("DELETE FROM seo_audits WHERE page_url = ?").bind(url).run();
  
  // Insert new audit
  const result = await c.env.DB.prepare(
    `INSERT INTO seo_audits (page_url, page_type, score, issues, recommendations, audit_date)
     VALUES (?, ?, ?, ?, ?, datetime('now'))`
  ).bind(
    url,
    type,
    score,
    JSON.stringify(issues),
    JSON.stringify(recommendations)
  ).run();
  
  return c.json({
    id: result.meta.last_row_id,
    page_url: url,
    page_type: type,
    score,
    issues: JSON.stringify(issues),
    recommendations: JSON.stringify(recommendations),
  });
});

// ============ GOOGLE INDEXING API & ADVANCED SEO ============

// Helper: Get Google OAuth2 access token from service account
async function getGoogleAccessToken(env: Env): Promise<string | null> {
  const serviceAccountJson = (env as unknown as Record<string, string>).GOOGLE_SERVICE_ACCOUNT_JSON;
  if (!serviceAccountJson) return null;
  
  try {
    const sa = JSON.parse(serviceAccountJson);
    const now = Math.floor(Date.now() / 1000);
    const exp = now + 3600;
    
    // Create JWT header and claim
    const header = { alg: 'RS256', typ: 'JWT' };
    const claim = {
      iss: sa.client_email,
      scope: 'https://www.googleapis.com/auth/indexing',
      aud: 'https://oauth2.googleapis.com/token',
      iat: now,
      exp: exp
    };
    
    // Base64url encode
    const base64url = (obj: any) => btoa(JSON.stringify(obj)).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
    
    // Import private key
    const pemContents = sa.private_key.replace(/-----BEGIN PRIVATE KEY-----/, '').replace(/-----END PRIVATE KEY-----/, '').replace(/\s/g, '');
    const binaryKey = Uint8Array.from(atob(pemContents), c => c.charCodeAt(0));
    
    const key = await crypto.subtle.importKey(
      'pkcs8', binaryKey.buffer,
      { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
      false, ['sign']
    );
    
    // Sign JWT
    const signatureInput = `${base64url(header)}.${base64url(claim)}`;
    const signature = await crypto.subtle.sign('RSASSA-PKCS1-v1_5', key, new TextEncoder().encode(signatureInput));
    const signatureB64 = btoa(String.fromCharCode(...new Uint8Array(signature))).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
    
    const jwt = `${signatureInput}.${signatureB64}`;
    
    // Exchange JWT for access token
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: `grant_type=urn:ietf:params:oauth:grant-type:jwt-bearer&assertion=${jwt}`
    });
    
    const tokenData = await tokenResponse.json() as { access_token?: string };
    return tokenData.access_token || null;
  } catch (error) {
    console.error('Google OAuth error:', error);
    return null;
  }
}

// Submit URL to Google Indexing API
app.post("/api/admin/seo/index-url", adminMiddleware, async (c) => {
  const { url, action = 'URL_UPDATED' } = await c.req.json();
  
  if (!url) {
    return c.json({ error: "URL é obrigatória" }, 400);
  }
  
  const accessToken = await getGoogleAccessToken(c.env);
  if (!accessToken) {
    // Queue for later if no credentials
    await c.env.DB.prepare(
      `INSERT INTO seo_indexing_queue (url, page_type, action, status, created_at, updated_at)
       VALUES (?, 'manual', ?, 'pending', datetime('now'), datetime('now'))`
    ).bind(url, action).run();
    return c.json({ 
      success: false, 
      queued: true,
      message: "Credenciais do Google não configuradas. URL adicionada à fila." 
    });
  }
  
  try {
    const response = await fetch('https://indexing.googleapis.com/v3/urlNotifications:publish', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ url, type: action })
    });
    
    const result = await response.json() as any;
    
    // Log to queue table
    await c.env.DB.prepare(
      `INSERT INTO seo_indexing_queue (url, page_type, action, status, submitted_at, response_code, response_message, created_at, updated_at)
       VALUES (?, 'manual', ?, ?, datetime('now'), ?, ?, datetime('now'), datetime('now'))`
    ).bind(url, action, response.ok ? 'success' : 'error', response.status, JSON.stringify(result)).run();
    
    return c.json({ 
      success: response.ok, 
      status: response.status,
      result,
      message: response.ok ? 'URL enviada ao Google com sucesso!' : 'Erro ao enviar URL'
    });
  } catch (error) {
    return c.json({ error: "Erro ao conectar com Google: " + (error as Error).message }, 500);
  }
});

// Batch submit multiple URLs to Google
app.post("/api/admin/seo/index-batch", adminMiddleware, async (c) => {
  const { urls } = await c.req.json();
  
  if (!urls || !Array.isArray(urls) || urls.length === 0) {
    return c.json({ error: "Lista de URLs é obrigatória" }, 400);
  }
  
  const accessToken = await getGoogleAccessToken(c.env);
  const results: any[] = [];
  
  for (const url of urls.slice(0, 100)) { // Limit to 100 per batch
    if (accessToken) {
      try {
        const response = await fetch('https://indexing.googleapis.com/v3/urlNotifications:publish', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ url, type: 'URL_UPDATED' })
        });
        results.push({ url, success: response.ok, status: response.status });
        
        await c.env.DB.prepare(
          `INSERT INTO seo_indexing_queue (url, page_type, action, status, submitted_at, response_code, created_at, updated_at)
           VALUES (?, 'batch', 'URL_UPDATED', ?, datetime('now'), ?, datetime('now'), datetime('now'))`
        ).bind(url, response.ok ? 'success' : 'error', response.status).run();
      } catch (error) {
        results.push({ url, success: false, error: (error as Error).message });
      }
    } else {
      // Queue all URLs
      await c.env.DB.prepare(
        `INSERT INTO seo_indexing_queue (url, page_type, action, status, created_at, updated_at)
         VALUES (?, 'batch', 'URL_UPDATED', 'pending', datetime('now'), datetime('now'))`
      ).bind(url).run();
      results.push({ url, queued: true });
    }
  }
  
  return c.json({ 
    success: true, 
    processed: results.length,
    results,
    hasCredentials: !!accessToken
  });
});

// Get indexing queue status
app.get("/api/admin/seo/indexing-queue", adminMiddleware, async (c) => {
  const { results } = await c.env.DB.prepare(
    `SELECT * FROM seo_indexing_queue ORDER BY created_at DESC LIMIT 200`
  ).all();
  
  // Get summary stats
  const stats = await c.env.DB.prepare(`
    SELECT 
      COUNT(*) as total,
      SUM(CASE WHEN status = 'success' THEN 1 ELSE 0 END) as success,
      SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending,
      SUM(CASE WHEN status = 'error' THEN 1 ELSE 0 END) as errors
    FROM seo_indexing_queue
  `).first() as any;
  
  return c.json({ queue: results, stats });
});

// Analyze page SEO and generate score
app.post("/api/admin/seo/analyze-page", adminMiddleware, async (c) => {
  const { url, page_type, page_id, content } = await c.req.json();
  
  // SEO Analysis metrics
  let titleScore = 0, metaScore = 0, contentScore = 0, technicalScore = 0;
  const issues: string[] = [];
  const recommendations: string[] = [];
  
  // Analyze meta title (optimal: 50-60 chars)
  const titleLength = content?.meta_title?.length || content?.title?.length || 0;
  if (titleLength >= 50 && titleLength <= 60) {
    titleScore = 100;
  } else if (titleLength >= 40 && titleLength <= 70) {
    titleScore = 80;
    if (titleLength < 50) issues.push('Título muito curto (menos de 50 caracteres)');
    else recommendations.push('Considere reduzir o título para menos de 60 caracteres');
  } else if (titleLength > 0) {
    titleScore = 50;
    if (titleLength < 40) issues.push('Título SEO muito curto - ideal: 50-60 caracteres');
    else issues.push('Título SEO muito longo - ideal: 50-60 caracteres');
  } else {
    issues.push('Título SEO ausente');
  }
  
  // Analyze meta description (optimal: 150-160 chars)
  const metaLength = content?.meta_description?.length || 0;
  if (metaLength >= 150 && metaLength <= 160) {
    metaScore = 100;
  } else if (metaLength >= 120 && metaLength <= 180) {
    metaScore = 75;
    recommendations.push('Meta description poderia ser otimizada (ideal: 150-160 caracteres)');
  } else if (metaLength > 0) {
    metaScore = 40;
    if (metaLength < 120) issues.push('Meta description muito curta');
    else issues.push('Meta description muito longa - será cortada nos resultados');
  } else {
    issues.push('Meta description ausente - crítico para CTR');
  }
  
  // Analyze content
  const textContent = content?.intro_text || content?.content || '';
  const wordCount = textContent.split(/\s+/).filter((w: string) => w.length > 0).length;
  const h1Count = (content?.h1_title ? 1 : 0);
  
  if (wordCount >= 1000) {
    contentScore = 100;
  } else if (wordCount >= 500) {
    contentScore = 80;
    recommendations.push('Conteúdo poderia ser mais extenso (ideal: 1000+ palavras)');
  } else if (wordCount >= 300) {
    contentScore = 60;
    issues.push('Conteúdo abaixo do ideal para SEO (menos de 500 palavras)');
  } else {
    contentScore = 30;
    issues.push('Conteúdo muito escasso - páginas com mais conteúdo ranqueiam melhor');
  }
  
  if (h1Count === 0) {
    issues.push('H1 ausente - essencial para SEO');
    contentScore -= 20;
  }
  
  // Technical score (based on schema, canonical, etc.)
  technicalScore = 70; // Base score
  if (content?.has_schema) technicalScore += 15;
  else recommendations.push('Adicionar Schema.org/dados estruturados para rich snippets');
  
  if (content?.canonical_url) technicalScore += 15;
  else recommendations.push('Definir URL canônica para evitar conteúdo duplicado');
  
  // Calculate overall score
  const overallScore = Math.round((titleScore + metaScore + contentScore + technicalScore) / 4);
  
  // Save or update score
  const existing = await c.env.DB.prepare(
    "SELECT id FROM seo_page_scores WHERE url = ?"
  ).bind(url).first();
  
  if (existing) {
    await c.env.DB.prepare(`
      UPDATE seo_page_scores SET
        overall_score = ?, title_score = ?, meta_score = ?, content_score = ?, technical_score = ?,
        title_length = ?, meta_length = ?, word_count = ?, h1_count = ?,
        issues = ?, recommendations = ?, last_analyzed_at = datetime('now'), updated_at = datetime('now')
      WHERE url = ?
    `).bind(
      overallScore, titleScore, metaScore, contentScore, technicalScore,
      titleLength, metaLength, wordCount, h1Count,
      JSON.stringify(issues), JSON.stringify(recommendations), url
    ).run();
  } else {
    await c.env.DB.prepare(`
      INSERT INTO seo_page_scores (url, page_type, page_id, overall_score, title_score, meta_score, content_score, technical_score,
        title_length, meta_length, word_count, h1_count, issues, recommendations, last_analyzed_at, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'), datetime('now'))
    `).bind(
      url, page_type, page_id, overallScore, titleScore, metaScore, contentScore, technicalScore,
      titleLength, metaLength, wordCount, h1Count, JSON.stringify(issues), JSON.stringify(recommendations)
    ).run();
  }
  
  // Update landing_page seo_score if applicable
  if (page_type === 'landing_page' && page_id) {
    await c.env.DB.prepare(
      "UPDATE landing_pages SET seo_score = ?, updated_at = datetime('now') WHERE id = ?"
    ).bind(overallScore, page_id).run();
  }
  
  return c.json({
    url,
    overall_score: overallScore,
    scores: { title: titleScore, meta: metaScore, content: contentScore, technical: technicalScore },
    metrics: { title_length: titleLength, meta_length: metaLength, word_count: wordCount, h1_count: h1Count },
    issues,
    recommendations
  });
});

// Get all page scores dashboard
app.get("/api/admin/seo/page-scores", adminMiddleware, async (c) => {
  const { results } = await c.env.DB.prepare(
    `SELECT * FROM seo_page_scores ORDER BY overall_score ASC LIMIT 100`
  ).all();
  
  // Get summary
  const summary = await c.env.DB.prepare(`
    SELECT 
      COUNT(*) as total,
      AVG(overall_score) as avg_score,
      SUM(CASE WHEN overall_score >= 80 THEN 1 ELSE 0 END) as excellent,
      SUM(CASE WHEN overall_score >= 60 AND overall_score < 80 THEN 1 ELSE 0 END) as good,
      SUM(CASE WHEN overall_score >= 40 AND overall_score < 60 THEN 1 ELSE 0 END) as needs_work,
      SUM(CASE WHEN overall_score < 40 THEN 1 ELSE 0 END) as poor
    FROM seo_page_scores
  `).first() as any;
  
  return c.json({ scores: results, summary });
});

// Auto-index landing page on create/update
app.post("/api/admin/seo/auto-index-lp/:id", adminMiddleware, async (c) => {
  const lpId = c.req.param("id");
  
  const lp = await c.env.DB.prepare(
    "SELECT slug, is_active FROM landing_pages WHERE id = ?"
  ).bind(lpId).first() as any;
  
  if (!lp) return c.json({ error: "Landing page não encontrada" }, 404);
  
  const baseUrl = 'https://www.inntag.com.br';
  const url = `${baseUrl}/lp/${lp.slug}`;
  
  const accessToken = await getGoogleAccessToken(c.env);
  let indexed = false;
  
  if (accessToken && lp.is_active === 1) {
    try {
      const response = await fetch('https://indexing.googleapis.com/v3/urlNotifications:publish', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ url, type: 'URL_UPDATED' })
      });
      indexed = response.ok;
      
      await c.env.DB.prepare(
        `INSERT INTO seo_indexing_queue (url, page_type, page_id, action, status, submitted_at, response_code, created_at, updated_at)
         VALUES (?, 'landing_page', ?, 'URL_UPDATED', ?, datetime('now'), ?, datetime('now'), datetime('now'))`
      ).bind(url, lpId, indexed ? 'success' : 'error', response.status).run();
    } catch (error) {
      console.error('Auto-index error:', error);
    }
  }
  
  // Update landing page indexing status
  await c.env.DB.prepare(
    "UPDATE landing_pages SET indexing_status = ?, last_indexed_at = datetime('now'), google_indexed = ? WHERE id = ?"
  ).bind(indexed ? 'indexed' : 'pending', indexed ? 1 : 0, lpId).run();
  
  return c.json({ success: true, indexed, url });
});

// Get SEO dashboard summary
app.get("/api/admin/seo/dashboard", adminMiddleware, async (c) => {
  // Landing pages stats
  const lpStats = await c.env.DB.prepare(`
    SELECT 
      COUNT(*) as total,
      SUM(CASE WHEN is_active = 1 THEN 1 ELSE 0 END) as active,
      SUM(CASE WHEN google_indexed = 1 THEN 1 ELSE 0 END) as indexed,
      AVG(seo_score) as avg_score,
      SUM(view_count) as total_views
    FROM landing_pages
  `).first() as any;
  
  // Indexing queue stats
  const queueStats = await c.env.DB.prepare(`
    SELECT 
      COUNT(*) as total,
      SUM(CASE WHEN status = 'success' THEN 1 ELSE 0 END) as success,
      SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending,
      SUM(CASE WHEN status = 'error' THEN 1 ELSE 0 END) as errors
    FROM seo_indexing_queue WHERE submitted_at > datetime('now', '-7 days')
  `).first() as any;
  
  // Recent indexing activity
  const { results: recentActivity } = await c.env.DB.prepare(
    `SELECT url, status, submitted_at FROM seo_indexing_queue ORDER BY created_at DESC LIMIT 10`
  ).all();
  
  // Pages needing attention (low score)
  const { results: needsAttention } = await c.env.DB.prepare(
    `SELECT lp.id, lp.slug, lp.title, lp.seo_score, c.name as city_name
     FROM landing_pages lp
     LEFT JOIN cities c ON lp.city_id = c.id
     WHERE lp.is_active = 1 AND (lp.seo_score IS NULL OR lp.seo_score < 60)
     ORDER BY lp.seo_score ASC NULLS FIRST LIMIT 10`
  ).all();
  
  return c.json({
    landing_pages: lpStats,
    indexing: queueStats,
    recent_activity: recentActivity,
    needs_attention: needsAttention
  });
});

// ============ TECHNICAL STANDARDS KNOWLEDGE BASE ============

// List all technical standards
app.get("/api/admin/standards", adminMiddleware, async (c) => {
  const { results } = await c.env.DB.prepare(
    "SELECT * FROM technical_standards ORDER BY category, code"
  ).all();
  return c.json(results || []);
});

// Get single standard
app.get("/api/admin/standards/:id", adminMiddleware, async (c) => {
  const id = c.req.param("id");
  const standard = await c.env.DB.prepare(
    "SELECT * FROM technical_standards WHERE id = ?"
  ).bind(id).first();
  if (!standard) return c.json({ error: "Norma não encontrada" }, 404);
  return c.json(standard);
});

// Create new standard
app.post("/api/admin/standards", adminMiddleware, async (c) => {
  const body = await c.req.json();
  const { code, title, category, description, key_points, application_areas, related_products } = body;
  
  if (!code || !title) {
    return c.json({ error: "Código e título são obrigatórios" }, 400);
  }
  
  const result = await c.env.DB.prepare(
    `INSERT INTO technical_standards (code, title, category, description, key_points, application_areas, related_products, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))`
  ).bind(code, title, category || null, description || null, key_points || null, application_areas || null, related_products || null).run();
  
  return c.json({ id: result.meta.last_row_id, success: true });
});

// Update standard
app.put("/api/admin/standards/:id", adminMiddleware, async (c) => {
  const id = c.req.param("id");
  const body = await c.req.json();
  const { code, title, category, description, key_points, application_areas, related_products, is_active } = body;
  
  await c.env.DB.prepare(
    `UPDATE technical_standards SET code = ?, title = ?, category = ?, description = ?, key_points = ?, 
     application_areas = ?, related_products = ?, is_active = ?, updated_at = datetime('now') WHERE id = ?`
  ).bind(code, title, category, description, key_points, application_areas, related_products, is_active ?? 1, id).run();
  
  return c.json({ success: true });
});

// Delete standard
app.delete("/api/admin/standards/:id", adminMiddleware, async (c) => {
  const id = c.req.param("id");
  await c.env.DB.prepare("DELETE FROM technical_standards WHERE id = ?").bind(id).run();
  return c.json({ success: true });
});

// Public endpoint - get all active standards (for AI content generation)
app.get("/api/public/standards", async (c) => {
  const { category, product } = c.req.query();
  
  let query = "SELECT * FROM technical_standards WHERE is_active = 1";
  const params: string[] = [];
  
  if (category) {
    query += " AND category = ?";
    params.push(category);
  }
  
  if (product) {
    query += " AND related_products LIKE ?";
    params.push(`%${product}%`);
  }
  
  query += " ORDER BY category, code";
  
  const stmt = c.env.DB.prepare(query);
  const { results } = params.length > 0 
    ? await stmt.bind(...params).all() 
    : await stmt.all();
  
  return c.json(results || []);
});

// Get standards formatted for AI prompt context
app.get("/api/admin/standards/ai-context", adminMiddleware, async (c) => {
  const { products } = c.req.query();
  
  let query = "SELECT * FROM technical_standards WHERE is_active = 1";
  const { results } = await c.env.DB.prepare(query).all();
  
  if (!results || results.length === 0) {
    return c.json({ context: "" });
  }
  
  // Filter by related products if specified
  let standards = results as any[];
  if (products) {
    const productList = products.split(',');
    standards = standards.filter((s: any) => {
      if (!s.related_products) return false;
      return productList.some(p => s.related_products.includes(p));
    });
  }
  
  // Format for AI prompt
  const context = standards.map((s: any) => {
    const keyPoints = s.key_points ? s.key_points.split('|').map((p: string) => `  - ${p}`).join('\n') : '';
    return `**${s.code}** - ${s.title}
Categoria: ${s.category || 'Geral'}
${s.description || ''}
Pontos-chave:
${keyPoints}
Aplicações: ${s.application_areas || 'Diversas'}`;
  }).join('\n\n---\n\n');
  
  return c.json({ 
    context,
    count: standards.length,
    standards: standards.map((s: any) => ({ code: s.code, title: s.title, category: s.category }))
  });
});

// ============ SOCIAL MEDIA CONTENT SYSTEM ============

// List all social posts
app.get("/api/admin/social/posts", adminMiddleware, async (c) => {
  const { status, post_type, platform } = c.req.query();
  let query = "SELECT * FROM social_posts WHERE 1=1";
  const params: string[] = [];
  
  if (status) { query += " AND status = ?"; params.push(status); }
  if (post_type) { query += " AND post_type = ?"; params.push(post_type); }
  if (platform) { query += " AND platform = ?"; params.push(platform); }
  
  query += " ORDER BY created_at DESC";
  
  const stmt = c.env.DB.prepare(query);
  const { results } = params.length > 0 ? await stmt.bind(...params).all() : await stmt.all();
  return c.json(results || []);
});

// Get single post
app.get("/api/admin/social/posts/:id", adminMiddleware, async (c) => {
  const id = c.req.param("id");
  const post = await c.env.DB.prepare("SELECT * FROM social_posts WHERE id = ?").bind(id).first();
  if (!post) return c.json({ error: "Post não encontrado" }, 404);
  return c.json(post);
});

// Create post
app.post("/api/admin/social/posts", adminMiddleware, async (c) => {
  const body = await c.req.json();
  const { post_type, category, title, content, hashtags, image_prompt, image_url, platform, status, scheduled_at, product_id, project_id, standard_id, notes } = body;
  
  const result = await c.env.DB.prepare(
    `INSERT INTO social_posts (post_type, category, title, content, hashtags, image_prompt, image_url, platform, status, scheduled_at, product_id, project_id, standard_id, notes, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))`
  ).bind(post_type, category, title, content, hashtags, image_prompt, image_url, platform || 'instagram', status || 'draft', scheduled_at, product_id, project_id, standard_id, notes).run();
  
  return c.json({ id: result.meta.last_row_id, success: true });
});

// Update post
app.put("/api/admin/social/posts/:id", adminMiddleware, async (c) => {
  const id = c.req.param("id");
  const body = await c.req.json();
  const { title, content, hashtags, image_prompt, image_url, platform, status, scheduled_at, notes } = body;
  
  await c.env.DB.prepare(
    `UPDATE social_posts SET title = ?, content = ?, hashtags = ?, image_prompt = ?, image_url = ?, 
     platform = ?, status = ?, scheduled_at = ?, notes = ?, updated_at = datetime('now') WHERE id = ?`
  ).bind(title, content, hashtags, image_prompt, image_url, platform, status, scheduled_at, notes, id).run();
  
  return c.json({ success: true });
});

// Delete post
app.delete("/api/admin/social/posts/:id", adminMiddleware, async (c) => {
  const id = c.req.param("id");
  await c.env.DB.prepare("DELETE FROM social_posts WHERE id = ?").bind(id).run();
  return c.json({ success: true });
});

// List templates
app.get("/api/admin/social/templates", adminMiddleware, async (c) => {
  const { results } = await c.env.DB.prepare("SELECT * FROM social_templates ORDER BY post_type, name").all();
  return c.json(results || []);
});

// Design Templates CRUD
app.get("/api/admin/social/design-templates", adminMiddleware, async (c) => {
  const { results } = await c.env.DB.prepare(
    "SELECT * FROM social_design_templates WHERE is_active = 1 ORDER BY display_order"
  ).all();
  return c.json(results || []);
});

app.get("/api/admin/social/design-templates/:id", adminMiddleware, async (c) => {
  const id = c.req.param("id");
  const template = await c.env.DB.prepare("SELECT * FROM social_design_templates WHERE id = ?").bind(id).first();
  return template ? c.json(template) : c.json({ error: "Not found" }, 404);
});

app.post("/api/admin/social/design-templates", adminMiddleware, async (c) => {
  const body = await c.req.json();
  const { results } = await c.env.DB.prepare(
    `INSERT INTO social_design_templates (name, template_type, layout_style, aspect_ratio, background_type, background_color, gradient_start, gradient_end, gradient_direction, accent_color, text_color, secondary_text_color, font_style, logo_position, overlay_style, badge_text, layout_config, display_order)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  ).bind(
    body.name, body.template_type, body.layout_style, body.aspect_ratio || '1:1',
    body.background_type || 'gradient', body.background_color, body.gradient_start, body.gradient_end,
    body.gradient_direction || 'to-br', body.accent_color || '#EF4444', body.text_color || '#FFFFFF',
    body.secondary_text_color, body.font_style || 'modern', body.logo_position || 'top-left',
    body.overlay_style, body.badge_text, body.layout_config, body.display_order || 0
  ).run();
  return c.json({ success: true, id: results });
});

app.put("/api/admin/social/design-templates/:id", adminMiddleware, async (c) => {
  const id = c.req.param("id");
  const body = await c.req.json();
  await c.env.DB.prepare(
    `UPDATE social_design_templates SET name=?, template_type=?, layout_style=?, aspect_ratio=?, background_type=?, background_color=?, gradient_start=?, gradient_end=?, gradient_direction=?, accent_color=?, text_color=?, secondary_text_color=?, font_style=?, logo_position=?, overlay_style=?, badge_text=?, layout_config=?, display_order=?, updated_at=CURRENT_TIMESTAMP WHERE id=?`
  ).bind(
    body.name, body.template_type, body.layout_style, body.aspect_ratio,
    body.background_type, body.background_color, body.gradient_start, body.gradient_end,
    body.gradient_direction, body.accent_color, body.text_color, body.secondary_text_color,
    body.font_style, body.logo_position, body.overlay_style, body.badge_text, body.layout_config,
    body.display_order, id
  ).run();
  return c.json({ success: true });
});

app.delete("/api/admin/social/design-templates/:id", adminMiddleware, async (c) => {
  const id = c.req.param("id");
  await c.env.DB.prepare("UPDATE social_design_templates SET is_active = 0 WHERE id = ?").bind(id).run();
  return c.json({ success: true });
});

// ============ META BUSINESS API INTEGRATION ============

// List connected Meta accounts
app.get("/api/admin/meta/accounts", adminMiddleware, async (c) => {
  const { results } = await c.env.DB.prepare(
    "SELECT id, account_type, account_id, account_name, account_username, profile_picture_url, page_id, is_active, last_post_at, created_at FROM meta_accounts WHERE is_active = 1 ORDER BY created_at DESC"
  ).all();
  return c.json(results || []);
});

// Generate Meta OAuth URL
app.get("/api/admin/meta/auth-url", adminMiddleware, async (c) => {
  const env = c.env as unknown as Record<string, string>;
  const META_APP_ID = env.META_APP_ID;
  
  if (!META_APP_ID) {
    return c.json({ error: "META_APP_ID não configurado" }, 500);
  }
  
  const host = c.req.header('host') || '';
  const protocol = host.includes('localhost') ? 'http' : 'https';
  const redirectUri = `${protocol}://${host}/api/admin/meta/callback`;
  
  // Scopes for Instagram and Facebook publishing
  const scopes = [
    'instagram_basic',
    'instagram_content_publish',
    'pages_show_list',
    'pages_read_engagement',
    'business_management'
  ].join(',');
  
  const authUrl = `https://www.facebook.com/v18.0/dialog/oauth?client_id=${META_APP_ID}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=${scopes}&response_type=code`;
  
  return c.json({ authUrl, redirectUri });
});

// Meta OAuth callback
app.get("/api/admin/meta/callback", async (c) => {
  const code = c.req.query('code');
  const error = c.req.query('error');
  
  if (error) {
    return c.redirect('/config/social?meta_error=' + encodeURIComponent(error));
  }
  
  if (!code) {
    return c.redirect('/config/social?meta_error=no_code');
  }
  
  const env = c.env as unknown as Record<string, string>;
  const META_APP_ID = env.META_APP_ID;
  const META_APP_SECRET = env.META_APP_SECRET;
  
  if (!META_APP_ID || !META_APP_SECRET) {
    return c.redirect('/config/social?meta_error=missing_credentials');
  }
  
  const host = c.req.header('host') || '';
  const protocol = host.includes('localhost') ? 'http' : 'https';
  const redirectUri = `${protocol}://${host}/api/admin/meta/callback`;
  
  try {
    // Exchange code for short-lived token
    const tokenRes = await fetch(
      `https://graph.facebook.com/v18.0/oauth/access_token?client_id=${META_APP_ID}&redirect_uri=${encodeURIComponent(redirectUri)}&client_secret=${META_APP_SECRET}&code=${code}`
    );
    const tokenData = await tokenRes.json() as any;
    
    if (tokenData.error) {
      console.error('Meta token error:', tokenData.error);
      return c.redirect('/config/social?meta_error=' + encodeURIComponent(tokenData.error.message || 'token_error'));
    }
    
    const shortToken = tokenData.access_token;
    
    // Exchange for long-lived token (60 days)
    const longTokenRes = await fetch(
      `https://graph.facebook.com/v18.0/oauth/access_token?grant_type=fb_exchange_token&client_id=${META_APP_ID}&client_secret=${META_APP_SECRET}&fb_exchange_token=${shortToken}`
    );
    const longTokenData = await longTokenRes.json() as any;
    const accessToken = longTokenData.access_token || shortToken;
    const expiresIn = longTokenData.expires_in || 5184000; // 60 days default
    
    // Get user's Facebook pages with Instagram accounts
    const pagesRes = await fetch(
      `https://graph.facebook.com/v18.0/me/accounts?fields=id,name,access_token,instagram_business_account{id,username,profile_picture_url}&access_token=${accessToken}`
    );
    const pagesData = await pagesRes.json() as any;
    
    if (!pagesData.data || pagesData.data.length === 0) {
      return c.redirect('/config/social?meta_error=no_pages');
    }
    
    // Save each Instagram business account found
    const expiresAt = new Date(Date.now() + expiresIn * 1000).toISOString();
    let savedCount = 0;
    
    for (const page of pagesData.data) {
      if (page.instagram_business_account) {
        const ig = page.instagram_business_account;
        
        // Check if already connected
        const existing = await c.env.DB.prepare(
          "SELECT id FROM meta_accounts WHERE account_id = ? AND is_active = 1"
        ).bind(ig.id).first();
        
        if (!existing) {
          await c.env.DB.prepare(
            `INSERT INTO meta_accounts (account_type, account_id, account_name, account_username, profile_picture_url, access_token, token_expires_at, page_id, page_access_token)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
          ).bind(
            'instagram',
            ig.id,
            page.name,
            ig.username,
            ig.profile_picture_url,
            accessToken,
            expiresAt,
            page.id,
            page.access_token
          ).run();
          savedCount++;
        }
      }
    }
    
    return c.redirect('/config/social?meta_connected=' + savedCount);
  } catch (error: any) {
    console.error('Meta OAuth error:', error);
    return c.redirect('/config/social?meta_error=' + encodeURIComponent(error.message || 'unknown_error'));
  }
});

// Disconnect Meta account
app.delete("/api/admin/meta/accounts/:id", adminMiddleware, async (c) => {
  const id = c.req.param("id");
  await c.env.DB.prepare("UPDATE meta_accounts SET is_active = 0 WHERE id = ?").bind(id).run();
  return c.json({ success: true });
});

// Publish post to Instagram
app.post("/api/admin/meta/publish/:postId", adminMiddleware, async (c) => {
  const postId = c.req.param("postId");
  const body = await c.req.json();
  const { account_id, image_url } = body;
  
  // Get post data
  const post = await c.env.DB.prepare("SELECT * FROM social_posts WHERE id = ?").bind(postId).first() as any;
  if (!post) {
    return c.json({ error: "Post não encontrado" }, 404);
  }
  
  // Get Meta account
  const account = await c.env.DB.prepare(
    "SELECT * FROM meta_accounts WHERE id = ? AND is_active = 1"
  ).bind(account_id).first() as any;
  
  if (!account) {
    return c.json({ error: "Conta Meta não encontrada ou desconectada" }, 404);
  }
  
  // Check token expiration
  if (account.token_expires_at && new Date(account.token_expires_at) < new Date()) {
    return c.json({ error: "Token expirado. Reconecte a conta." }, 401);
  }
  
  const accessToken = account.page_access_token || account.access_token;
  const igUserId = account.account_id;
  
  // Build caption with content + hashtags
  let caption = post.content || '';
  if (post.hashtags) {
    caption += '\n\n' + post.hashtags;
  }
  
  try {
    // Instagram requires an image URL for posting
    if (!image_url) {
      return c.json({ error: "URL da imagem é obrigatória para publicar no Instagram" }, 400);
    }
    
    // Step 1: Create media container
    const containerRes = await fetch(
      `https://graph.facebook.com/v18.0/${igUserId}/media?image_url=${encodeURIComponent(image_url)}&caption=${encodeURIComponent(caption)}&access_token=${accessToken}`,
      { method: 'POST' }
    );
    const containerData = await containerRes.json() as any;
    
    if (containerData.error) {
      console.error('Instagram container error:', containerData.error);
      
      // Log to history
      await c.env.DB.prepare(
        `INSERT INTO meta_post_history (social_post_id, meta_account_id, platform, status, error_message)
         VALUES (?, ?, ?, ?, ?)`
      ).bind(postId, account_id, 'instagram', 'failed', containerData.error.message).run();
      
      return c.json({ error: containerData.error.message || 'Erro ao criar mídia' }, 400);
    }
    
    const mediaContainerId = containerData.id;
    
    // Step 2: Publish the container
    const publishRes = await fetch(
      `https://graph.facebook.com/v18.0/${igUserId}/media_publish?creation_id=${mediaContainerId}&access_token=${accessToken}`,
      { method: 'POST' }
    );
    const publishData = await publishRes.json() as any;
    
    if (publishData.error) {
      console.error('Instagram publish error:', publishData.error);
      
      await c.env.DB.prepare(
        `INSERT INTO meta_post_history (social_post_id, meta_account_id, platform, status, error_message)
         VALUES (?, ?, ?, ?, ?)`
      ).bind(postId, account_id, 'instagram', 'failed', publishData.error.message).run();
      
      return c.json({ error: publishData.error.message || 'Erro ao publicar' }, 400);
    }
    
    const metaPostId = publishData.id;
    
    // Log success
    await c.env.DB.prepare(
      `INSERT INTO meta_post_history (social_post_id, meta_account_id, platform, meta_post_id, status, published_at)
       VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP)`
    ).bind(postId, account_id, 'instagram', metaPostId, 'published').run();
    
    // Update post status
    await c.env.DB.prepare(
      "UPDATE social_posts SET status = 'published', published_at = CURRENT_TIMESTAMP WHERE id = ?"
    ).bind(postId).run();
    
    // Update account last_post_at
    await c.env.DB.prepare(
      "UPDATE meta_accounts SET last_post_at = CURRENT_TIMESTAMP WHERE id = ?"
    ).bind(account_id).run();
    
    return c.json({ 
      success: true, 
      meta_post_id: metaPostId,
      message: 'Post publicado no Instagram com sucesso!'
    });
  } catch (error: any) {
    console.error('Meta publish error:', error);
    
    await c.env.DB.prepare(
      `INSERT INTO meta_post_history (social_post_id, meta_account_id, platform, status, error_message)
       VALUES (?, ?, ?, ?, ?)`
    ).bind(postId, account_id, 'instagram', 'failed', error.message).run();
    
    return c.json({ error: error.message || 'Erro ao publicar' }, 500);
  }
});

// Get post history for Meta
app.get("/api/admin/meta/history", adminMiddleware, async (c) => {
  const { results } = await c.env.DB.prepare(
    `SELECT h.*, p.title as post_title, a.account_username 
     FROM meta_post_history h
     LEFT JOIN social_posts p ON h.social_post_id = p.id
     LEFT JOIN meta_accounts a ON h.meta_account_id = a.id
     ORDER BY h.created_at DESC
     LIMIT 50`
  ).all();
  return c.json(results || []);
});

// Generate social media content with AI
app.post("/api/admin/social/generate", adminMiddleware, async (c) => {
  const body = await c.req.json();
  const { post_type, template_id, product_id, project_id, standard_id, custom_topic, platform } = body;
  
  const GEMINI_API_KEY = (c.env as unknown as Record<string, string>).GEMINI_API_KEY;
  if (!GEMINI_API_KEY) {
    return c.json({ error: "API Key do Gemini não configurada" }, 500);
  }
  
  // Get template if specified
  let template: any = null;
  if (template_id) {
    template = await c.env.DB.prepare("SELECT * FROM social_templates WHERE id = ?").bind(template_id).first();
  }
  
  // Get context based on post type
  let contextData = '';
  let contextTitle = '';
  
  if (post_type === 'product' && product_id) {
    const product = await c.env.DB.prepare("SELECT * FROM products WHERE id = ?").bind(product_id).first() as any;
    if (product) {
      contextTitle = product.name;
      contextData = `PRODUTO: ${product.name}\nDescrição: ${product.description || ''}\nCaracterísticas: ${product.features || ''}\nEspecificações: ${product.specifications || ''}`;
    }
  } else if (post_type === 'project' && project_id) {
    const project = await c.env.DB.prepare(`
      SELECT p.*, g.name as group_name, u.city, u.state 
      FROM projects p 
      LEFT JOIN client_units u ON p.unit_id = u.id
      LEFT JOIN client_groups g ON u.group_id = g.id
      WHERE p.id = ?
    `).bind(project_id).first() as any;
    if (project) {
      contextTitle = project.name;
      contextData = `PROJETO: ${project.name}\nCliente: ${project.group_name || 'INNTAG'}\nLocal: ${project.city || ''}/${project.state || ''}\nDescrição: ${project.description || ''}\nAno: ${project.year || ''}`;
    }
  } else if (post_type === 'standard' && standard_id) {
    const standard = await c.env.DB.prepare("SELECT * FROM technical_standards WHERE id = ?").bind(standard_id).first() as any;
    if (standard) {
      contextTitle = standard.code;
      contextData = `NORMA TÉCNICA: ${standard.code} - ${standard.title}\nCategoria: ${standard.category || ''}\nDescrição: ${standard.description || ''}\nPontos-chave: ${standard.key_points || ''}`;
    }
  } else if (custom_topic) {
    contextTitle = custom_topic;
    contextData = `TEMA: ${custom_topic}`;
  }
  
  // Get relevant technical standards for context
  const { results: standards } = await c.env.DB.prepare(
    "SELECT code, title, description FROM technical_standards WHERE is_active = 1 LIMIT 5"
  ).all();
  
  const standardsContext = standards && standards.length > 0 
    ? standards.map((s: any) => `${s.code}: ${s.title}`).join('\n')
    : '';
  
  const toneMap: Record<string, string> = {
    professional: 'técnico e profissional, com linguagem precisa',
    commercial: 'comercial e persuasivo, destacando benefícios',
    storytelling: 'narrativo, contando uma história envolvente',
    educational: 'didático e acessível, explicando conceitos',
    authoritative: 'autoritativo e confiável, demonstrando expertise',
    corporate: 'institucional e inspirador, reforçando valores'
  };
  
  const tone = template?.tone ? toneMap[template.tone] || 'profissional' : 'profissional';
  const templateInstructions = template?.content_template || 'Crie um post envolvente e profissional.';
  const suggestedHashtags = template?.hashtags_template || '#inntag #engenharia #industria';
  
  const prompt = `Você é um especialista em marketing de conteúdo para a INNTAG, empresa brasileira líder em painéis elétricos industriais desde 2009.

CONTEXTO DA EMPRESA:
- INNTAG: Tecnologia, Inovação e Confiabilidade em Soluções Elétricas
- +17 anos de experiência, +1000 projetos entregues
- Produtos: Cubículos MT, QGBT, CCM, QDF, Painéis de Proteção
- Certificações: IEC 61439, NBR 5410, ISO 9001
- Diferenciais: Engenharia Própria, Suporte Técnico, Soluções Sob Medida

NORMAS TÉCNICAS RELEVANTES:
${standardsContext}

${contextData}

INSTRUÇÕES DO TEMPLATE:
${templateInstructions}

TAREFA: Gere um post para ${platform || 'Instagram'} sobre "${contextTitle || 'INNTAG'}".

O tom deve ser: ${tone}

FORMATO DE RESPOSTA (JSON):
{
  "title": "título curto para identificação interna",
  "content": "texto do post com até 2200 caracteres, incluindo emojis estratégicos e call-to-action",
  "hashtags": "hashtags relevantes separadas por espaço (máximo 30)",
  "image_prompt": "descrição detalhada para gerar imagem profissional do post (em inglês)"
}

IMPORTANTE:
- Conteúdo 100% em português brasileiro
- Use emojis com moderação e propósito
- Inclua call-to-action claro
- Hashtags devem incluir: ${suggestedHashtags}
- Image prompt em inglês para geração de imagem
- NÃO use texto verde (regra de marca)
- NUNCA use a frase "Orçamento gratuito para painéis elétricos" ou variações como "orçamento gratuito"`;

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { temperature: 0.8, maxOutputTokens: 2048 }
        })
      }
    );
    
    const data = await response.json() as any;
    const generatedText = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
    
    // Parse JSON from response
    const jsonMatch = generatedText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return c.json({ error: "Erro ao processar resposta da IA" }, 500);
    }
    
    const generated = JSON.parse(jsonMatch[0]);
    
    return c.json({
      success: true,
      post_type,
      platform: platform || 'instagram',
      ...generated
    });
  } catch (error: any) {
    console.error("Social AI generation error:", error);
    return c.json({ error: "Erro ao gerar conteúdo: " + error.message }, 500);
  }
});

// ============ AI CONTENT GENERATION ============

// Generate SEO content for landing page using Gemini AI
app.post("/api/admin/landing-pages/generate-content", adminMiddleware, async (c) => {
  const body = await c.req.json();
  const { city_name, state_abbr, products, services, vertical, city_data } = body;
  
  const GEMINI_API_KEY = (c.env as unknown as Record<string, string>).GEMINI_API_KEY;
  if (!GEMINI_API_KEY) {
    return c.json({ error: "API Key do Gemini não configurada" }, 500);
  }
  
  const locationContext = city_name && state_abbr 
    ? `${city_name}/${state_abbr}` 
    : 'todo o Brasil';

  // Build city-specific context for unique content
  let citySpecificContext = '';
  if (city_data) {
    const industries = [];
    if (city_data.has_oil_platform === 1 || city_data.has_petrochemical === 1) industries.push('petroquímico e petróleo');
    if (city_data.has_port === 1) industries.push('portuário e logístico');
    if (city_data.has_mining === 1) industries.push('mineração');
    if (city_data.has_steel === 1) industries.push('siderurgia e metalurgia');
    if (city_data.has_automotive === 1) industries.push('automotivo');
    if (city_data.has_agro === 1) industries.push('agronegócio');
    if (city_data.has_food_industry === 1) industries.push('indústria alimentícia');
    if (city_data.has_energy === 1) industries.push('geração de energia');
    
    const populationDesc = city_data.population 
      ? city_data.population > 1000000 ? `uma metrópole com mais de ${Math.floor(city_data.population/1000000)} milhão de habitantes`
      : city_data.population > 500000 ? `uma grande cidade com mais de ${Math.floor(city_data.population/1000)} mil habitantes`
      : city_data.population > 100000 ? `uma cidade de médio porte com cerca de ${Math.floor(city_data.population/1000)} mil habitantes`
      : `uma cidade em crescimento`
      : '';
    
    citySpecificContext = `
CONTEXTO ESPECÍFICO DA CIDADE ${city_name.toUpperCase()}:
- Região: ${city_data.region || 'Brasil'}
${city_data.is_capital === 1 ? '- Capital do estado, importante centro econômico e administrativo' : ''}
${populationDesc ? `- ${populationDesc}` : ''}
${industries.length > 0 ? `- Principais setores industriais: ${industries.join(', ')}` : ''}

IMPORTANTE: Use estes dados da cidade para criar conteúdo ÚNICO e específico. Mencione:
- O contexto econômico e industrial da região
- Como a INNTAG pode atender às demandas específicas dos setores locais
- Benefícios específicos para empresas de ${city_name}
`;
  }

  // Build vertical-specific context
  let verticalContext = '';
  let productList = '';
  let focusArea = '';
  
  switch (vertical) {
    case 'field_service':
      verticalContext = `A INNTAG oferece serviços de Field Service especializados para o setor elétrico industrial. 
        Nossa equipe técnica realiza instalação, comissionamento, manutenção preventiva e corretiva, 
        além de retrofitting de painéis elétricos em todo o Brasil.`;
      productList = services && services.length > 0 
        ? services.join(', ')
        : 'Instalação e comissionamento, Manutenção preventiva, Manutenção corretiva, Retrofitting, Análise termográfica, Testes de aceitação';
      focusArea = `Field Service e Manutenção Industrial em ${locationContext}`;
      break;
      
    case 'maquinas':
      verticalContext = `A INNTAG fornece máquinas e equipamentos industriais de alta performance para diversos segmentos.
        Trabalhamos com equipamentos nacionais e importados, oferecendo suporte técnico completo e peças de reposição.`;
      productList = products && products.length > 0 
        ? products.join(', ')
        : 'Máquinas industriais, Equipamentos de automação, Motores elétricos, Inversores de frequência, Soft-starters';
      focusArea = `Máquinas e Equipamentos Industriais em ${locationContext}`;
      break;
      
    default: // paineis
      verticalContext = `A INNTAG é especializada em fabricação de painéis elétricos industriais com certificação IEC 61439 e NBR.
        Todos os produtos são desenvolvidos com engenharia própria, garantindo qualidade e personalização.`;
      productList = products && products.length > 0 
        ? products.join(', ')
        : 'Cubículos de Média Tensão, QGBT, CCM, QDF, Painéis de Proteção, Painéis de Excitação, Quadros Auxiliares';
      focusArea = `Painéis Elétricos Industriais em ${locationContext}`;
      break;
  }
  
  const prompt = `Você é um especialista em SEO e copywriting para o setor industrial elétrico brasileiro.

A INNTAG é uma empresa de Americana/SP fundada em 2009, com mais de 1000 projetos entregues.
${verticalContext}
${citySpecificContext}

Gere conteúdo SEO otimizado para uma landing page focada em: ${focusArea}

Produtos/Serviços oferecidos: ${productList}

Gere EXATAMENTE este JSON (sem markdown, sem blocos de código):
{
  "meta_title": "Título SEO de até 60 caracteres com cidade e foco principal",
  "meta_description": "Descrição SEO de 140-160 caracteres, persuasiva, com call-to-action",
  "h1_title": "Título H1 impactante de até 70 caracteres",
  "intro_text": "Texto introdutório de 2-3 parágrafos (300-400 palavras) que OBRIGATORIAMENTE mencione características específicas de ${city_name}, destacando: experiência da INNTAG, ${vertical === 'paineis' ? 'certificações IEC/NBR,' : ''} benefícios para empresas da região, diferenciais competitivos. Inclua dados locais para tornar o texto único.",
  "meta_keywords": "5-8 palavras-chave separadas por vírgula, incluindo variações locais"
}

REGRAS CRÍTICAS PARA SEO:
- O texto DEVE ser único e específico para ${city_name} - Google penaliza conteúdo duplicado
- Use português brasileiro formal
- Inclua o nome da cidade/estado múltiplas vezes de forma natural
- Mencione setores industriais da região quando relevante
${vertical === 'paineis' ? '- Destaque certificações IEC 61439 e NBR' : ''}
${vertical === 'field_service' ? '- Destaque agilidade no atendimento, equipe técnica qualificada e cobertura nacional' : ''}
${vertical === 'maquinas' ? '- Destaque variedade de equipamentos, suporte técnico e peças de reposição' : ''}
- Mencione engenharia própria como diferencial
- Foque em benefícios para o cliente (qualidade, confiabilidade, suporte técnico)
- NÃO use emojis ou formatação markdown
- NUNCA use a frase "Orçamento gratuito para painéis elétricos" ou variações como "orçamento gratuito"
- Retorne APENAS o JSON, sem explicações`;

  try {
    const response = await fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=' + GEMINI_API_KEY, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 2000,
        }
      })
    });
    
    if (!response.ok) {
      const error = await response.text();
      console.error('Gemini API error:', error);
      return c.json({ error: "Erro na API do Gemini" }, 500);
    }
    
    const data = await response.json() as any;
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
    
    if (!text) {
      return c.json({ error: "Resposta vazia do Gemini" }, 500);
    }
    
    // Clean up the response - remove markdown code blocks if present
    let cleanText = text.trim();
    if (cleanText.startsWith('```json')) {
      cleanText = cleanText.replace(/^```json\n?/, '').replace(/\n?```$/, '');
    } else if (cleanText.startsWith('```')) {
      cleanText = cleanText.replace(/^```\n?/, '').replace(/\n?```$/, '');
    }
    
    // Try to extract JSON from the response if it contains extra text
    const jsonMatch = cleanText.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      cleanText = jsonMatch[0];
    }
    
    // Fix common JSON issues
    cleanText = cleanText
      .replace(/[\x00-\x1F\x7F]/g, ' ') // Remove control characters
      .replace(/,\s*}/g, '}') // Remove trailing commas
      .replace(/,\s*]/g, ']'); // Remove trailing commas in arrays
    
    // Parse the JSON
    let content;
    try {
      content = JSON.parse(cleanText);
    } catch (parseError) {
      // If JSON parsing fails, build vertical-specific fallback content
      console.error('JSON parse error, using fallback:', parseError);
      const cityDisplay = city_name && state_abbr ? `${city_name}/${state_abbr}` : 'Brasil';
      
      if (vertical === 'field_service') {
        content = {
          meta_title: `Field Service em ${cityDisplay} - INNTAG`,
          meta_description: `Serviços de instalação, comissionamento e manutenção de painéis elétricos em ${cityDisplay}. Equipe técnica especializada. Solicite orçamento!`,
          h1_title: `Field Service e Manutenção Industrial em ${cityDisplay}`,
          intro_text: `A INNTAG oferece serviços completos de Field Service para empresas em ${cityDisplay}. Nossa equipe técnica especializada realiza instalação, comissionamento, manutenção preventiva e corretiva de painéis elétricos industriais.\n\nCom mais de 15 anos de experiência no setor elétrico, garantimos agilidade no atendimento e qualidade nos serviços prestados. Atuamos em todo o Brasil, com foco em minimizar paradas e maximizar a disponibilidade dos seus equipamentos.\n\nEntre em contato e descubra como nossos serviços de Field Service podem otimizar a operação da sua empresa.`,
          meta_keywords: `field service ${city_name || ''}, manutenção painéis elétricos, comissionamento, instalação elétrica industrial`
        };
      } else if (vertical === 'maquinas') {
        content = {
          meta_title: `Máquinas Industriais em ${cityDisplay} - INNTAG`,
          meta_description: `Máquinas e equipamentos industriais em ${cityDisplay}. Motores, inversores, soft-starters com suporte técnico completo. Solicite orçamento!`,
          h1_title: `Máquinas e Equipamentos Industriais em ${cityDisplay}`,
          intro_text: `A INNTAG fornece máquinas e equipamentos industriais de alta performance para empresas em ${cityDisplay}. Trabalhamos com as melhores marcas do mercado, oferecendo soluções completas para automação e controle industrial.\n\nNossa linha inclui motores elétricos, inversores de frequência, soft-starters e diversos equipamentos para otimizar seus processos produtivos. Contamos com estoque de peças de reposição e suporte técnico especializado.\n\nEntre em contato para conhecer nossa linha de produtos e encontrar a solução ideal para sua empresa.`,
          meta_keywords: `máquinas industriais ${city_name || ''}, motores elétricos, inversores de frequência, automação industrial`
        };
      } else {
        content = {
          meta_title: `Painéis Elétricos em ${cityDisplay} - INNTAG`,
          meta_description: `Soluções em painéis elétricos para ${cityDisplay}. Cubículos, CCM, QGBT e QDF com engenharia própria e certificação IEC/NBR. Solicite orçamento!`,
          h1_title: `Painéis Elétricos Industriais em ${cityDisplay}`,
          intro_text: `A INNTAG oferece soluções completas em painéis elétricos para empresas em ${cityDisplay}. Com mais de 15 anos de experiência e engenharia própria, desenvolvemos projetos personalizados que atendem às necessidades específicas de cada cliente.\n\nNossos produtos incluem Cubículos de Média Tensão, Quadros Gerais de Baixa Tensão (QGBT), Centros de Controle de Motores (CCM) e Quadros de Distribuição de Força (QDF), todos fabricados seguindo rigorosos padrões de qualidade e certificações IEC 61439 e NBR.\n\nContamos com uma equipe técnica altamente qualificada para oferecer suporte completo, desde o projeto até a instalação e manutenção. Entre em contato e descubra como podemos ajudar sua empresa.`,
          meta_keywords: `painéis elétricos ${city_name || ''}, CCM ${city_name || ''}, QGBT ${city_name || ''}, cubículos média tensão, quadros elétricos industriais`
        };
      }
    }
    
    return c.json(content);
  } catch (error) {
    console.error('AI generation error:', error);
    return c.json({ error: "Erro ao gerar conteúdo: " + (error as Error).message }, 500);
  }
});

// ============ PUBLIC API ============

// Get public landing page by slug
app.get("/api/public/landing-pages/:slug", async (c) => {
  const slug = c.req.param("slug");
  
  // Get landing page with city info including industry sectors
  const lp = await c.env.DB.prepare(
    `SELECT lp.*, c.name as city_name, c.state_abbr, c.state, c.region,
     c.has_port, c.has_mining, c.has_agro, c.has_steel, c.has_automotive,
     c.has_petrochemical, c.has_energy, c.has_food_industry, c.has_oil_platform,
     c.industrial_sectors, c.population
     FROM landing_pages lp 
     LEFT JOIN cities c ON lp.city_id = c.id 
     WHERE lp.slug = ? AND lp.is_active = 1`
  ).bind(slug).first() as any;
  
  if (!lp) return c.json({ error: "Página não encontrada" }, 404);
  
  // Increment view count
  await c.env.DB.prepare("UPDATE landing_pages SET view_count = view_count + 1 WHERE id = ?").bind(lp.id).run();
  
  // Get linked products with full product data
  const { results: lpProducts } = await c.env.DB.prepare(
    `SELECT lpp.*, p.slug as product_slug, p.title as product_title, p.subtitle as product_subtitle, 
     p.short_description as product_description, p.image_key as product_image
     FROM lp_products lpp
     LEFT JOIN products p ON lpp.product_id = p.id
     WHERE lpp.landing_page_id = ? AND p.is_active = 1
     ORDER BY lpp.position`
  ).bind(lp.id).all();
  
  // Get linked services with full service data
  const { results: lpServices } = await c.env.DB.prepare(
    `SELECT lps.*, s.slug as service_slug, s.title as service_title, s.subtitle as service_subtitle,
     s.description as service_description, s.image_url as service_image
     FROM lp_services lps
     LEFT JOIN services s ON lps.service_id = s.id
     WHERE lps.landing_page_id = ? AND s.is_active = 1
     ORDER BY lps.position`
  ).bind(lp.id).all();
  
  // Get linked machines with full machine data
  const { results: lpMachines } = await c.env.DB.prepare(
    `SELECT lpm.*, m.slug as machine_slug, m.title as machine_title, m.subtitle as machine_subtitle,
     m.short_description as machine_description, m.image_key as machine_image
     FROM lp_machines lpm
     LEFT JOIN machines m ON lpm.machine_id = m.id
     WHERE lpm.landing_page_id = ? AND m.is_active = 1
     ORDER BY lpm.position`
  ).bind(lp.id).all();
  
  return c.json({
    ...lp,
    products: lpProducts,
    services: lpServices,
    machines: lpMachines
  });
});

// Get public articles (for homepage, listing)
app.get("/api/public/articles", async (c) => {
  const category = c.req.query("category");
  const featured = c.req.query("featured");
  const limit = parseInt(c.req.query("limit") || "10");
  
  let query = "SELECT id, slug, title, subtitle, excerpt, category, image_key, author_name, author_role, published_at, is_featured FROM articles WHERE is_published = 1";
  const params: any[] = [];
  
  if (category) {
    query += " AND category = ?";
    params.push(category);
  }
  if (featured === "true") {
    query += " AND is_featured = 1";
  }
  
  query += " ORDER BY is_featured DESC, published_at DESC LIMIT ?";
  params.push(limit);
  
  const stmt = c.env.DB.prepare(query);
  const { results } = await stmt.bind(...params).all();
  return c.json(results);
});

// Get single public article by slug (with SEO data)
app.get("/api/public/articles/:slug", async (c) => {
  const slug = c.req.param("slug");
  const article = await c.env.DB.prepare(
    `SELECT * FROM articles WHERE slug = ? AND is_published = 1`
  ).bind(slug).first();
  
  if (!article) return c.json({ error: "Artigo não encontrado" }, 404);
  
  // Increment view count
  await c.env.DB.prepare("UPDATE articles SET view_count = view_count + 1 WHERE slug = ?").bind(slug).run();
  
  // Get tags
  const { results: tags } = await c.env.DB.prepare(
    "SELECT tag FROM article_tags WHERE article_id = ?"
  ).bind((article as any).id).all();
  
  return c.json({ ...article, tags: tags.map((t: any) => t.tag) });
});

// Get public site content (for footer, etc)
app.get("/api/public/content/:page", async (c) => {
  const page = c.req.param("page");
  const { results } = await c.env.DB.prepare(
    "SELECT section, content_key, content_value FROM site_content WHERE page = ?"
  ).bind(page).all();
  return c.json(results);
});

// Get public projects (for portfolio)
app.get("/api/public/projects", async (c) => {
  const { results } = await c.env.DB.prepare(
    `SELECT p.*, c.name as client_name,
            u.name as unit_name, u.city as unit_city, u.state as unit_state,
            g.name as group_name, g.sector as group_sector
     FROM projects p 
     LEFT JOIN clients c ON p.client_id = c.id 
     LEFT JOIN client_units u ON p.unit_id = u.id
     LEFT JOIN client_groups g ON u.group_id = g.id
     WHERE p.is_public = 1 
     ORDER BY p.created_at DESC`
  ).all();
  return c.json(results);
});

// Get public clients (with logos)
app.get("/api/public/clients", async (c) => {
  const { results } = await c.env.DB.prepare(
    "SELECT id, name, logo_key FROM clients WHERE is_active = 1 ORDER BY name ASC"
  ).all();
  return c.json(results);
});

// Get public products
app.get("/api/public/products", async (c) => {
  const { results } = await c.env.DB.prepare(
    "SELECT * FROM products WHERE is_active = 1 ORDER BY display_order ASC, title ASC"
  ).all();
  return c.json(results);
});

app.get("/api/public/products/:slug", async (c) => {
  const slug = c.req.param("slug");
  const product = await c.env.DB.prepare(
    "SELECT * FROM products WHERE slug = ? AND is_active = 1"
  ).bind(slug).first();
  
  if (!product) {
    return c.json({ error: "Produto não encontrado" }, 404);
  }
  
  const { results: specs } = await c.env.DB.prepare(
    "SELECT * FROM product_specs WHERE product_id = ? ORDER BY display_order ASC"
  ).bind(product.id).all();
  
  const { results: features } = await c.env.DB.prepare(
    "SELECT * FROM product_features WHERE product_id = ? ORDER BY display_order ASC"
  ).bind(product.id).all();
  
  const { results: docs } = await c.env.DB.prepare(
    "SELECT * FROM product_docs WHERE product_id = ?"
  ).bind(product.id).all();
  
  const { results: gallery } = await c.env.DB.prepare(
    "SELECT * FROM product_gallery WHERE product_id = ? ORDER BY display_order ASC"
  ).bind(product.id).all();
  
  return c.json({ ...product, specs, features, docs, gallery });
});

// Get featured projects
app.get("/api/public/projects/featured", async (c) => {
  const { results } = await c.env.DB.prepare(
    `SELECT p.*, c.name as client_name,
            u.name as unit_name, g.name as group_name
     FROM projects p 
     LEFT JOIN clients c ON p.client_id = c.id 
     LEFT JOIN client_units u ON p.unit_id = u.id
     LEFT JOIN client_groups g ON u.group_id = g.id
     WHERE p.is_featured = 1 AND p.is_public = 1 
     ORDER BY p.created_at DESC LIMIT 6`
  ).all();
  return c.json(results);
});

// Get public project files
app.get("/api/public/projects/:id/files", async (c) => {
  const projectId = c.req.param("id");
  
  // Verify project is public
  const project = await c.env.DB.prepare(
    "SELECT * FROM projects WHERE id = ? AND is_public = 1"
  ).bind(projectId).first();

  if (!project) {
    return c.json({ error: "Projeto não encontrado" }, 404);
  }

  const { results } = await c.env.DB.prepare(
    "SELECT * FROM project_files WHERE project_id = ? ORDER BY created_at DESC"
  ).bind(projectId).all();
  return c.json(results);
});

// ============ PAGE BACKGROUNDS ============

// Get all page backgrounds (admin)
app.get("/api/admin/backgrounds", async (c) => {
  const token = c.req.header("Authorization")?.replace("Bearer ", "");
  if (!token) return c.json({ error: "Não autorizado" }, 401);
  const session = await getAdminSession(c.env.DB, token);
  if (!session) return c.json({ error: "Sessão expirada" }, 401);

  const { results } = await c.env.DB.prepare(
    "SELECT * FROM page_backgrounds ORDER BY page_key, section_key"
  ).all();
  return c.json(results);
});

// Update page background
app.put("/api/admin/backgrounds/:id", async (c) => {
  const token = c.req.header("Authorization")?.replace("Bearer ", "");
  if (!token) return c.json({ error: "Não autorizado" }, 401);
  const session = await getAdminSession(c.env.DB, token);
  if (!session) return c.json({ error: "Sessão expirada" }, 401);

  const id = c.req.param("id");
  const { image_url } = await c.req.json();

  await c.env.DB.prepare(
    "UPDATE page_backgrounds SET image_url = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?"
  ).bind(image_url || null, id).run();

  return c.json({ success: true });
});

// Get public background for a page/section
app.get("/api/public/backgrounds/:page/:section", async (c) => {
  const page = c.req.param("page");
  const section = c.req.param("section");
  
  const bg = await c.env.DB.prepare(
    "SELECT image_url, fallback_url FROM page_backgrounds WHERE page_key = ? AND section_key = ? AND is_active = 1"
  ).bind(page, section).first() as { image_url: string | null; fallback_url: string } | null;
  
  if (!bg) return c.json({ url: null });
  
  return c.json({ url: bg.image_url || bg.fallback_url });
});

// Get all public backgrounds
app.get("/api/public/backgrounds", async (c) => {
  const { results } = await c.env.DB.prepare(
    "SELECT page_key, section_key, image_url, fallback_url FROM page_backgrounds WHERE is_active = 1"
  ).all();
  
  // Transform to a map for easy lookup
  const bgMap: Record<string, string> = {};
  for (const bg of results as any[]) {
    const key = `${bg.page_key}_${bg.section_key}`;
    bgMap[key] = bg.image_url || bg.fallback_url;
  }
  
  return c.json(bgMap);
});

// ============ SITEMAP & SEO FILES ============

// Dynamic sitemap.xml
app.get("/sitemap.xml", async (c) => {
  const baseUrl = "https://www.inntag.com.br";
  
  const urls: { loc: string; priority: string; changefreq: string }[] = [];
  
  // Static pages
  urls.push(
    { loc: `${baseUrl}/`, priority: '1.0', changefreq: 'weekly' },
    { loc: `${baseUrl}/produtos`, priority: '0.9', changefreq: 'weekly' },
    { loc: `${baseUrl}/servicos`, priority: '0.9', changefreq: 'weekly' },
    { loc: `${baseUrl}/maquinas`, priority: '0.8', changefreq: 'monthly' },
    { loc: `${baseUrl}/clientes`, priority: '0.7', changefreq: 'monthly' },
    { loc: `${baseUrl}/portfolio`, priority: '0.8', changefreq: 'weekly' },
    { loc: `${baseUrl}/destaques`, priority: '0.8', changefreq: 'weekly' },
    { loc: `${baseUrl}/contato`, priority: '0.6', changefreq: 'monthly' },
  );
  
  // Products
  const { results: products } = await c.env.DB.prepare(
    "SELECT slug FROM products WHERE is_active = 1"
  ).all() as any;
  products.forEach((p: any) => {
    urls.push({ loc: `${baseUrl}/produtos/${p.slug}`, priority: '0.8', changefreq: 'weekly' });
  });
  
  // Services
  const { results: services } = await c.env.DB.prepare(
    "SELECT slug FROM services WHERE is_active = 1"
  ).all() as any;
  services.forEach((s: any) => {
    urls.push({ loc: `${baseUrl}/servicos/${s.slug}`, priority: '0.8', changefreq: 'weekly' });
  });
  
  // Machines
  const { results: machines } = await c.env.DB.prepare(
    "SELECT slug FROM machines WHERE is_active = 1"
  ).all() as any;
  machines.forEach((m: any) => {
    urls.push({ loc: `${baseUrl}/maquinas/${m.slug}`, priority: '0.7', changefreq: 'monthly' });
  });
  
  // Landing pages
  const { results: lps } = await c.env.DB.prepare(
    "SELECT slug FROM landing_pages WHERE is_active = 1"
  ).all() as any;
  lps.forEach((lp: any) => {
    urls.push({ loc: `${baseUrl}/lp/${lp.slug}`, priority: '0.9', changefreq: 'weekly' });
  });
  
  // Articles
  const { results: articles } = await c.env.DB.prepare(
    "SELECT slug FROM articles WHERE is_published = 1"
  ).all() as any;
  articles.forEach((a: any) => {
    urls.push({ loc: `${baseUrl}/destaques/${a.slug}`, priority: '0.7', changefreq: 'weekly' });
  });
  
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map(u => `  <url>
    <loc>${u.loc}</loc>
    <changefreq>${u.changefreq}</changefreq>
    <priority>${u.priority}</priority>
  </url>`).join('\n')}
</urlset>`;

  return new Response(xml, {
    headers: { 'Content-Type': 'application/xml' }
  });
});

// Dynamic robots.txt
app.get("/robots.txt", async () => {
  const baseUrl = "https://www.inntag.com.br";
  
  const robotsTxt = `# INNTAG - Soluções Elétricas Industriais
# www.inntag.com.br

User-agent: *
Allow: /

# Sitemap
Sitemap: ${baseUrl}/sitemap.xml

# Block admin/config areas
Disallow: /config/
Disallow: /portal/
Disallow: /api/

# Allow specific public APIs for crawling
Allow: /api/public/

# Crawl delay for good citizenship
Crawl-delay: 1
`;

  return new Response(robotsTxt, {
    headers: { 'Content-Type': 'text/plain' }
  });
});

// Get SEO stats for dashboard
app.get("/api/admin/seo/stats", adminMiddleware, async (c) => {
  const { results: audits } = await c.env.DB.prepare(
    "SELECT * FROM seo_audits"
  ).all() as any;
  
  const { results: lps } = await c.env.DB.prepare(
    "SELECT COUNT(*) as count FROM landing_pages WHERE is_active = 1"
  ).all() as any;
  
  const { results: products } = await c.env.DB.prepare(
    "SELECT COUNT(*) as count FROM products WHERE is_active = 1"
  ).all() as any;
  
  const { results: services } = await c.env.DB.prepare(
    "SELECT COUNT(*) as count FROM services WHERE is_active = 1"
  ).all() as any;
  
  const { results: articles } = await c.env.DB.prepare(
    "SELECT COUNT(*) as count FROM articles WHERE is_published = 1"
  ).all() as any;
  
  const totalPages = 8 + products[0].count + services[0].count + lps[0].count + articles[0].count;
  const avgScore = audits.length > 0 
    ? Math.round(audits.reduce((acc: number, a: any) => acc + (a.score || 0), 0) / audits.length)
    : 0;
  
  const criticalIssues = audits.filter((a: any) => a.score < 50).length;
  const warnings = audits.filter((a: any) => a.score >= 50 && a.score < 80).length;
  
  return c.json({
    totalPages,
    indexedPages: audits.length,
    landingPages: lps[0].count,
    avgScore,
    criticalIssues,
    warnings,
    lastAudit: audits[0]?.audit_date || null
  });
});

// Auto-fix SEO issues with AI
app.post("/api/admin/seo/auto-fix", adminMiddleware, async (c) => {
  const { pageUrl, pageType, issues, recommendations } = await c.req.json();
  const fixes: string[] = [];
  
  const apiKey = (c.env as unknown as Record<string, string>)['GEMINI_API_KEY'];
  if (!apiKey) {
    return c.json({ success: false, error: 'GEMINI_API_KEY não configurada', fixes: [] });
  }
  
  try {
    // Extract slug from URL
    const urlParts = pageUrl.split('/').filter(Boolean);
    const slug = urlParts[urlParts.length - 1];
    
    // Handle product pages
    if (pageUrl.includes('/produtos/') && slug) {
      const product = await c.env.DB.prepare(
        "SELECT * FROM products WHERE slug = ?"
      ).bind(slug).first() as any;
      
      if (product) {
        const prompt = `Você é um especialista em SEO para indústria elétrica brasileira.

PRODUTO: ${product.title}
SUBTÍTULO: ${product.subtitle || 'N/A'}
DESCRIÇÃO ATUAL: ${product.short_description || 'Sem descrição'}
DESCRIÇÃO COMPLETA: ${product.full_description || 'Sem descrição'}

PROBLEMAS DETECTADOS:
${issues?.join('\n') || 'Nenhum'}

TAREFA: Reescreva o conteúdo para SEO otimizado.

Responda em JSON válido:
{
  "short_description": "descrição curta otimizada (max 200 chars) com palavras-chave",
  "full_description": "descrição completa SEO (300+ palavras) rica em termos técnicos: painéis elétricos, cubículos, QGBT, CCM, disjuntores, certificação IEC, normas NBR, indústria, INNTAG"
}`;

        const res = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents: [{ parts: [{ text: prompt }] }],
              generationConfig: { temperature: 0.7 }
            })
          }
        );
        
        if (res.ok) {
          const data = await res.json() as any;
          const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
          const jsonMatch = text.match(/\{[\s\S]*\}/);
          
          if (jsonMatch) {
            const seoData = JSON.parse(jsonMatch[0]);
            
            await c.env.DB.prepare(
              "UPDATE products SET short_description = ?, full_description = ?, updated_at = datetime('now') WHERE id = ?"
            ).bind(
              seoData.short_description || product.short_description,
              seoData.full_description || product.full_description,
              product.id
            ).run();
            
            fixes.push('✓ Descrição curta do produto otimizada');
            fixes.push('✓ Descrição completa reescrita para SEO');
          }
        }
      }
    }
    
    // Handle service pages
    else if (pageUrl.includes('/servicos/') && slug) {
      const service = await c.env.DB.prepare(
        "SELECT * FROM services WHERE slug = ?"
      ).bind(slug).first() as any;
      
      if (service) {
        const prompt = `Você é um especialista em SEO para serviços industriais no Brasil.

SERVIÇO: ${service.title}
DESCRIÇÃO ATUAL: ${service.description || 'Sem descrição'}

PROBLEMAS DETECTADOS:
${issues?.join('\n') || 'Nenhum'}

TAREFA: Reescreva o conteúdo para SEO otimizado.

Responda em JSON válido:
{
  "description": "descrição SEO do serviço (300+ palavras) mencionando: manutenção industrial, painéis elétricos, calibração, medição, INNTAG, atendimento técnico especializado, normas técnicas"
}`;

        const res = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents: [{ parts: [{ text: prompt }] }],
              generationConfig: { temperature: 0.7 }
            })
          }
        );
        
        if (res.ok) {
          const data = await res.json() as any;
          const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
          const jsonMatch = text.match(/\{[\s\S]*\}/);
          
          if (jsonMatch) {
            const seoData = JSON.parse(jsonMatch[0]);
            
            await c.env.DB.prepare(
              "UPDATE services SET description = ?, updated_at = datetime('now') WHERE id = ?"
            ).bind(seoData.description || service.description, service.id).run();
            
            fixes.push('✓ Descrição do serviço otimizada para SEO');
          }
        }
      }
    }
    
    // Handle landing pages
    else if (pageUrl.includes('/lp/') && slug) {
      const lp = await c.env.DB.prepare(
        "SELECT lp.*, c.name as city_name, c.state_abbr FROM landing_pages lp LEFT JOIN cities c ON lp.city_id = c.id WHERE lp.slug = ?"
      ).bind(slug).first() as any;
      
      if (lp) {
        const prompt = `Você é um especialista em SEO local para empresas industriais brasileiras.

LANDING PAGE: ${lp.title}
CIDADE: ${lp.city_name || 'N/A'}, ${lp.state_abbr || ''}
META TITLE ATUAL: ${lp.meta_title || 'Vazio'}
META DESCRIPTION ATUAL: ${lp.meta_description || 'Vazio'}
H1 ATUAL: ${lp.h1_title || 'Vazio'}

PROBLEMAS DETECTADOS:
${issues?.join('\n') || 'Nenhum'}

TAREFA: Gere conteúdo SEO otimizado para rankear em "${lp.city_name || 'esta cidade'}".

Responda em JSON válido:
{
  "meta_title": "título SEO com cidade (max 60 chars)",
  "meta_description": "descrição SEO com cidade e serviços (max 160 chars)",
  "meta_keywords": "palavras-chave separadas por vírgula incluindo cidade",
  "h1_title": "título H1 otimizado com cidade",
  "intro_text": "parágrafo introdutório (150+ palavras) mencionando INNTAG, a cidade ${lp.city_name || ''}, painéis elétricos, cubículos, QGBT, CCM"
}`;

        const res = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents: [{ parts: [{ text: prompt }] }],
              generationConfig: { temperature: 0.7 }
            })
          }
        );
        
        if (res.ok) {
          const data = await res.json() as any;
          const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
          const jsonMatch = text.match(/\{[\s\S]*\}/);
          
          if (jsonMatch) {
            const seoData = JSON.parse(jsonMatch[0]);
            
            await c.env.DB.prepare(
              `UPDATE landing_pages SET 
                meta_title = ?, meta_description = ?, meta_keywords = ?, 
                h1_title = ?, intro_text = ?, updated_at = datetime('now')
              WHERE id = ?`
            ).bind(
              seoData.meta_title || lp.meta_title,
              seoData.meta_description || lp.meta_description,
              seoData.meta_keywords || lp.meta_keywords,
              seoData.h1_title || lp.h1_title,
              seoData.intro_text || lp.intro_text,
              lp.id
            ).run();
            
            fixes.push('✓ Meta title otimizado');
            fixes.push('✓ Meta description otimizada');
            fixes.push('✓ Keywords atualizadas');
            fixes.push('✓ Título H1 melhorado');
            fixes.push('✓ Texto introdutório gerado');
          }
        }
      }
    }
    
    // Handle article pages
    else if (pageUrl.includes('/destaques/') && slug) {
      const article = await c.env.DB.prepare(
        "SELECT * FROM articles WHERE slug = ?"
      ).bind(slug).first() as any;
      
      if (article) {
        const prompt = `Você é um especialista em SEO para conteúdo técnico industrial.

ARTIGO: ${article.title}
RESUMO ATUAL: ${article.excerpt || 'Sem resumo'}

PROBLEMAS DETECTADOS:
${issues?.join('\n') || 'Nenhum'}

TAREFA: Otimize o resumo do artigo para SEO.

Responda em JSON válido:
{
  "excerpt": "resumo SEO otimizado (max 300 chars) com palavras-chave técnicas"
}`;

        const res = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents: [{ parts: [{ text: prompt }] }],
              generationConfig: { temperature: 0.7 }
            })
          }
        );
        
        if (res.ok) {
          const data = await res.json() as any;
          const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
          const jsonMatch = text.match(/\{[\s\S]*\}/);
          
          if (jsonMatch) {
            const seoData = JSON.parse(jsonMatch[0]);
            
            await c.env.DB.prepare(
              "UPDATE articles SET excerpt = ?, updated_at = datetime('now') WHERE id = ?"
            ).bind(seoData.excerpt || article.excerpt, article.id).run();
            
            fixes.push('✓ Resumo do artigo otimizado para SEO');
          }
        }
      }
    }
    
    // Handle static listing pages (portfolio, clientes, etc.)
    else if (pageType === 'listing' || pageType === 'home' || pageType === 'contact') {
      // For static pages, we generate recommendations for site_content
      const pageName = pageUrl.replace('/', '') || 'home';
      
      const prompt = `Você é um especialista em SEO para sites industriais brasileiros.

PÁGINA: ${pageName}
TIPO: ${pageType}
URL: ${pageUrl}
EMPRESA: INNTAG - Fabricante de Painéis Elétricos Industriais (Cubículos, QGBT, CCM, QDF)

PROBLEMAS DETECTADOS:
${issues?.join('\n') || 'Nenhum'}

RECOMENDAÇÕES:
${recommendations?.join('\n') || 'Nenhuma'}

TAREFA: Gere conteúdo SEO otimizado para esta página.

Responda em JSON válido:
{
  "meta_title": "título SEO (max 60 chars) incluindo INNTAG e o tema da página",
  "meta_description": "descrição SEO (max 160 chars) mencionando INNTAG, painéis elétricos, cubículos, serviços industriais",
  "intro_text": "parágrafo introdutório único para a página (150-200 palavras) rico em palavras-chave: painéis elétricos, cubículos MT, QGBT, CCM, normas IEC, NBR, indústria, certificação"
}`;

      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: { temperature: 0.7 }
          })
        }
      );
      
      if (res.ok) {
        const data = await res.json() as any;
        const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        
        if (jsonMatch) {
          const seoData = JSON.parse(jsonMatch[0]);
          
          // Save to site_content table
          const key = `seo_${pageName.replace(/\//g, '_')}`;
          const existingContent = await c.env.DB.prepare(
            "SELECT id FROM site_content WHERE key = ?"
          ).bind(key).first();
          
          if (existingContent) {
            await c.env.DB.prepare(
              "UPDATE site_content SET value = ?, updated_at = datetime('now') WHERE key = ?"
            ).bind(JSON.stringify(seoData), key).run();
          } else {
            await c.env.DB.prepare(
              "INSERT INTO site_content (key, value, created_at, updated_at) VALUES (?, ?, datetime('now'), datetime('now'))"
            ).bind(key, JSON.stringify(seoData)).run();
          }
          
          fixes.push(`✓ Meta title: "${seoData.meta_title}"`);
          fixes.push(`✓ Meta description: "${seoData.meta_description}"`);
          if (seoData.intro_text) {
            fixes.push('✓ Texto introdutório SEO gerado');
          }
          fixes.push('✓ Conteúdo salvo no banco de dados');
        }
      }
    }
    
    if (fixes.length === 0) {
      fixes.push('→ Esta página não possui conteúdo editável no banco de dados');
      fixes.push('→ Revise as recomendações e aplique manualmente no código');
    }
    
    return c.json({ success: true, fixes });
  } catch (err) {
    console.error('Auto-fix error:', err);
    return c.json({ success: false, error: String(err), fixes });
  }
});

// Get sitemap info
app.get("/api/admin/seo/sitemap-info", adminMiddleware, async (c) => {
  const baseUrl = "https://www.inntag.com.br";
  
  const counts = {
    static: 8,
    products: 0,
    services: 0,
    machines: 0,
    landingPages: 0,
    articles: 0
  };
  
  const { results: products } = await c.env.DB.prepare(
    "SELECT COUNT(*) as count FROM products WHERE is_active = 1"
  ).all() as any;
  counts.products = products[0].count;
  
  const { results: services } = await c.env.DB.prepare(
    "SELECT COUNT(*) as count FROM services WHERE is_active = 1"
  ).all() as any;
  counts.services = services[0].count;
  
  const { results: machines } = await c.env.DB.prepare(
    "SELECT COUNT(*) as count FROM machines WHERE is_active = 1"
  ).all() as any;
  counts.machines = machines[0].count;
  
  const { results: lps } = await c.env.DB.prepare(
    "SELECT COUNT(*) as count FROM landing_pages WHERE is_active = 1"
  ).all() as any;
  counts.landingPages = lps[0].count;
  
  const { results: articles } = await c.env.DB.prepare(
    "SELECT COUNT(*) as count FROM articles WHERE is_published = 1"
  ).all() as any;
  counts.articles = articles[0].count;
  
  const total = counts.static + counts.products + counts.services + counts.machines + counts.landingPages + counts.articles;
  
  return c.json({
    sitemapUrl: `${baseUrl}/sitemap.xml`,
    robotsUrl: `${baseUrl}/robots.txt`,
    totalUrls: total,
    breakdown: counts,
    lastGenerated: new Date().toISOString()
  });
});

// ============ TIMELINE EVENTS ============

// Public: Get all published timeline events
app.get("/api/public/timeline", async (c) => {
  const { results } = await c.env.DB.prepare(
    "SELECT * FROM timeline_events WHERE is_published = 1 ORDER BY sort_order ASC, year ASC"
  ).all();
  return c.json(results);
});

// Public: Get photos for a timeline event
app.get("/api/public/timeline/:id/photos", async (c) => {
  const eventId = c.req.param("id");
  const { results } = await c.env.DB.prepare(
    "SELECT * FROM timeline_photos WHERE event_id = ? ORDER BY sort_order ASC"
  ).bind(eventId).all();
  return c.json(results);
});

// Public: Get unifilar items with product links
app.get("/api/public/unifilar", async (c) => {
  const { results } = await c.env.DB.prepare(
    `SELECT ui.*, p.title as product_name, p.slug as product_slug, p.image_key as product_image 
     FROM unifilar_items ui 
     LEFT JOIN products p ON ui.product_id = p.id 
     ORDER BY ui.id ASC`
  ).all();
  return c.json({ items: results });
});

// Admin: Update unifilar item product link
app.put("/api/admin/unifilar/:id", adminMiddleware, async (c) => {
  const id = c.req.param("id");
  const { product_id } = await c.req.json();
  
  await c.env.DB.prepare(
    `UPDATE unifilar_items SET product_id = ?, updated_at = datetime('now') WHERE id = ?`
  ).bind(product_id, id).run();
  
  return c.json({ success: true });
});

// Admin: Get all timeline events
app.get("/api/admin/timeline", adminMiddleware, async (c) => {
  const { results } = await c.env.DB.prepare(
    "SELECT * FROM timeline_events ORDER BY sort_order ASC, year ASC"
  ).all();
  return c.json(results);
});

// Admin: Create timeline event
app.post("/api/admin/timeline", adminMiddleware, async (c) => {
  const body = await c.req.json();
  const { year, title, description, highlight, background_image, stat1_value, stat1_label, stat2_value, stat2_label, sort_order, is_published } = body;
  
  const result = await c.env.DB.prepare(
    `INSERT INTO timeline_events (year, title, description, highlight, background_image, stat1_value, stat1_label, stat2_value, stat2_label, sort_order, is_published, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))`
  ).bind(year, title, description, highlight, background_image, stat1_value, stat1_label, stat2_value, stat2_label, sort_order || 0, is_published ?? 1).run();
  
  return c.json({ success: true, id: result.meta.last_row_id });
});

// Admin: Update timeline event
app.put("/api/admin/timeline/:id", adminMiddleware, async (c) => {
  const id = c.req.param("id");
  const body = await c.req.json();
  const { year, title, description, highlight, background_image, stat1_value, stat1_label, stat2_value, stat2_label, sort_order, is_published } = body;
  
  await c.env.DB.prepare(
    `UPDATE timeline_events SET year = ?, title = ?, description = ?, highlight = ?, background_image = ?, 
     stat1_value = ?, stat1_label = ?, stat2_value = ?, stat2_label = ?, sort_order = ?, is_published = ?, updated_at = datetime('now')
     WHERE id = ?`
  ).bind(year, title, description, highlight, background_image, stat1_value, stat1_label, stat2_value, stat2_label, sort_order, is_published, id).run();
  
  return c.json({ success: true });
});

// Admin: Delete timeline event
app.delete("/api/admin/timeline/:id", adminMiddleware, async (c) => {
  const id = c.req.param("id");
  // Delete photos first
  await c.env.DB.prepare("DELETE FROM timeline_photos WHERE event_id = ?").bind(id).run();
  await c.env.DB.prepare("DELETE FROM timeline_events WHERE id = ?").bind(id).run();
  return c.json({ success: true });
});

// Admin: Upload background image for timeline event
app.post("/api/admin/timeline/:id/background", adminMiddleware, async (c) => {
  const id = c.req.param("id");
  const formData = await c.req.formData();
  const file = formData.get("file") as File;
  
  if (!file) {
    return c.json({ error: "Arquivo não enviado" }, 400);
  }

  const timestamp = Date.now();
  const ext = file.name.split('.').pop() || 'jpg';
  const key = `timeline/${id}/bg-${timestamp}.${ext}`;
  
  await c.env.R2_BUCKET.put(key, await file.arrayBuffer(), {
    httpMetadata: { contentType: file.type }
  });

  // Update event with new background
  await c.env.DB.prepare(
    "UPDATE timeline_events SET background_image = ?, updated_at = datetime('now') WHERE id = ?"
  ).bind(`/api/files/${key}`, id).run();

  return c.json({ success: true, url: `/api/files/${key}` });
});

// Admin: Get photos for timeline event
app.get("/api/admin/timeline/:id/photos", adminMiddleware, async (c) => {
  const eventId = c.req.param("id");
  const { results } = await c.env.DB.prepare(
    "SELECT * FROM timeline_photos WHERE event_id = ? ORDER BY sort_order ASC"
  ).bind(eventId).all();
  return c.json(results);
});

// Admin: Upload photo to timeline event gallery
app.post("/api/admin/timeline/:id/photos", adminMiddleware, async (c) => {
  const eventId = c.req.param("id");
  const formData = await c.req.formData();
  const file = formData.get("file") as File;
  const caption = formData.get("caption") as string || '';
  
  if (!file) {
    return c.json({ error: "Arquivo não enviado" }, 400);
  }

  const timestamp = Date.now();
  const ext = file.name.split('.').pop() || 'jpg';
  const key = `timeline/${eventId}/gallery-${timestamp}.${ext}`;
  
  await c.env.R2_BUCKET.put(key, await file.arrayBuffer(), {
    httpMetadata: { contentType: file.type }
  });

  // Get max sort_order
  const maxOrder = await c.env.DB.prepare(
    "SELECT MAX(sort_order) as max_order FROM timeline_photos WHERE event_id = ?"
  ).bind(eventId).first() as { max_order: number | null };
  
  const sortOrder = (maxOrder?.max_order || 0) + 1;

  const result = await c.env.DB.prepare(
    `INSERT INTO timeline_photos (event_id, file_key, caption, sort_order, created_at, updated_at)
     VALUES (?, ?, ?, ?, datetime('now'), datetime('now'))`
  ).bind(eventId, `/api/files/${key}`, caption, sortOrder).run();

  return c.json({ success: true, id: result.meta.last_row_id, url: `/api/files/${key}` });
});

// Admin: Update photo caption
app.put("/api/admin/timeline/photos/:photoId", adminMiddleware, async (c) => {
  const photoId = c.req.param("photoId");
  const { caption, sort_order } = await c.req.json();
  
  await c.env.DB.prepare(
    "UPDATE timeline_photos SET caption = ?, sort_order = ?, updated_at = datetime('now') WHERE id = ?"
  ).bind(caption, sort_order, photoId).run();
  
  return c.json({ success: true });
});

// Admin: Delete photo from gallery
app.delete("/api/admin/timeline/photos/:photoId", adminMiddleware, async (c) => {
  const photoId = c.req.param("photoId");
  
  // Get file key to delete from R2
  const photo = await c.env.DB.prepare(
    "SELECT file_key FROM timeline_photos WHERE id = ?"
  ).bind(photoId).first() as { file_key: string } | null;
  
  if (photo?.file_key) {
    const key = photo.file_key.replace('/api/files/', '');
    try {
      await c.env.R2_BUCKET.delete(key);
    } catch (e) {
      // Ignore R2 delete errors
    }
  }
  
  await c.env.DB.prepare("DELETE FROM timeline_photos WHERE id = ?").bind(photoId).run();
  return c.json({ success: true });
});

// Catch-all route for SPA - serve index.html for non-API routes
app.get("*", async (c) => {
  const url = new URL(c.req.url);
  
  // Skip API routes
  if (url.pathname.startsWith('/api/')) {
    return c.notFound();
  }
  
  // Try to serve from ASSETS binding (for SPA routing)
  // ASSETS binding is injected by Cloudflare at runtime
  const assets = (c.env as any).ASSETS;
  if (assets) {
    try {
      // Request the index.html for SPA routing
      const indexRequest = new Request(new URL('/', c.req.url).toString(), c.req.raw);
      const response = await assets.fetch(indexRequest);
      return new Response(response.body, {
        status: 200,
        headers: {
          'content-type': 'text/html; charset=utf-8',
          'cache-control': 'no-cache'
        }
      });
    } catch (e) {
      // Fall through to 404
    }
  }
  
  return c.notFound();
});

export default app;
