// Secrets definidos via `wrangler secret put` — não entram no Env gerado por
// `wrangler types` (que só lê o wrangler.json). Augmenta a interface global Env.
interface Env {
  GEMINI_API_KEY: string;
  META_APP_ID: string;
  META_APP_SECRET: string;
  ADMIN_PASSWORD: string;
  GOOGLE_SERVICE_ACCOUNT_JSON: string;
}
