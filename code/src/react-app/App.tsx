import { BrowserRouter as Router, Routes, Route, useLocation } from "react-router";
import { lazy, Suspense } from "react";
import { LanguageProvider } from "@/react-app/contexts/LanguageContext";
import WhatsAppButton from "@/react-app/components/WhatsAppButton";
import CookieConsent from "@/react-app/components/CookieConsent";
import HomePage from "@/react-app/pages/Home";
import ConfigLayout from "@/react-app/pages/config/ConfigLayout";

// Páginas públicas (carregadas sob demanda — reduz o bundle inicial)
const ProdutosPage = lazy(() => import("@/react-app/pages/Produtos"));
const ServicosPage = lazy(() => import("@/react-app/pages/Servicos"));
const MaquinasPage = lazy(() => import("@/react-app/pages/Maquinas"));
const ClientesPage = lazy(() => import("@/react-app/pages/Clientes"));
const PortfolioPage = lazy(() => import("@/react-app/pages/Portfolio"));
const ContatoPage = lazy(() => import("@/react-app/pages/Contato"));
const Portal = lazy(() => import("@/react-app/pages/Portal"));
const Destaques = lazy(() => import("@/react-app/pages/Destaques"));
const LandingPage = lazy(() => import("@/react-app/pages/LandingPage"));
const SEOTermPage = lazy(() => import("@/react-app/pages/SEOTermPage"));
const Unifilar = lazy(() => import("@/react-app/pages/Unifilar"));
const Privacidade = lazy(() => import("@/react-app/pages/Privacidade"));

// Área administrativa (só carrega quando o admin acessa)
const ConfigLogin = lazy(() => import("@/react-app/pages/config/ConfigLogin"));
const ConfigDashboard = lazy(() => import("@/react-app/pages/config/ConfigDashboard"));
const ConfigProdutos = lazy(() => import("@/react-app/pages/config/ConfigProdutos"));
const ConfigProjetos = lazy(() => import("@/react-app/pages/config/ConfigProjetos"));
const ConfigClientes = lazy(() => import("@/react-app/pages/config/ConfigClientes"));
const ConfigConteudo = lazy(() => import("@/react-app/pages/config/ConfigConteudo"));
const ConfigUsuarios = lazy(() => import("@/react-app/pages/config/ConfigUsuarios"));
const ConfigSeguranca = lazy(() => import("@/react-app/pages/config/ConfigSeguranca"));
const ConfigMaquinas = lazy(() => import("@/react-app/pages/config/ConfigMaquinas"));
const ConfigDestaques = lazy(() => import("@/react-app/pages/config/ConfigDestaques"));
const ConfigServicos = lazy(() => import("@/react-app/pages/config/ConfigServicos"));
const ConfigLandingPages = lazy(() => import("@/react-app/pages/config/ConfigLandingPages"));
const ConfigSEO = lazy(() => import("@/react-app/pages/config/ConfigSEO"));
const ConfigEmpresas = lazy(() => import("@/react-app/pages/config/ConfigEmpresas"));
const ConfigBackgrounds = lazy(() => import("@/react-app/pages/config/ConfigBackgrounds"));
const ConfigTimeline = lazy(() => import("@/react-app/pages/config/ConfigTimeline"));
const ConfigNormas = lazy(() => import("@/react-app/pages/config/ConfigNormas"));
const ConfigSocial = lazy(() => import("@/react-app/pages/config/ConfigSocial"));
const ConfigUnifilar = lazy(() => import("@/react-app/pages/config/ConfigUnifilar"));
const ProjetoFullScreen = lazy(() => import("@/react-app/pages/config/ProjetoFullScreen"));
const PainelDetail = lazy(() => import("@/react-app/pages/config/PainelDetail"));
const ServicoDetail = lazy(() => import("@/react-app/pages/config/ServicoDetail"));

function PageFallback() {
  return (
    <div style={{ minHeight: "60vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ width: 28, height: 28, border: "3px solid rgba(120,120,120,.25)", borderTopColor: "#e0432a", borderRadius: "50%", animation: "spin .8s linear infinite" }} />
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}

function AppContent() {
  const location = useLocation();
  const isConfigPage = location.pathname.startsWith('/config');

  return (
    <>
      <Suspense fallback={<PageFallback />}>
        <Routes>
          {/* Public routes */}
          <Route path="/" element={<HomePage />} />
          <Route path="/produtos" element={<ProdutosPage />} />
          <Route path="/produtos/:slug" element={<ProdutosPage />} />
          <Route path="/servicos" element={<ServicosPage />} />
          <Route path="/servicos/:slug" element={<ServicosPage />} />
          <Route path="/maquinas" element={<MaquinasPage />} />
          <Route path="/maquinas/:slug" element={<MaquinasPage />} />
          <Route path="/clientes" element={<ClientesPage />} />
          <Route path="/portfolio" element={<PortfolioPage />} />
          <Route path="/destaques" element={<Destaques />} />
          <Route path="/destaques/:slug" element={<Destaques />} />
          <Route path="/contato" element={<ContatoPage />} />
          <Route path="/portal" element={<Portal />} />
          <Route path="/lp/:slug" element={<LandingPage />} />
          <Route path="/termo/:category/:slug" element={<SEOTermPage />} />
          <Route path="/unifilar" element={<Unifilar />} />
          <Route path="/privacidade" element={<Privacidade />} />

          {/* Admin config */}
          <Route path="/config" element={<ConfigLogin />} />
          <Route path="/config/dashboard" element={<ConfigLayout><ConfigDashboard /></ConfigLayout>} />
          <Route path="/config/produtos" element={<ConfigLayout><ConfigProdutos /></ConfigLayout>} />
          <Route path="/config/projetos" element={<ConfigLayout><ConfigProjetos /></ConfigLayout>} />
          <Route path="/config/clientes" element={<ConfigLayout><ConfigClientes /></ConfigLayout>} />
          <Route path="/config/empresas" element={<ConfigLayout><ConfigEmpresas /></ConfigLayout>} />
          <Route path="/config/conteudo" element={<ConfigLayout><ConfigConteudo /></ConfigLayout>} />
          <Route path="/config/usuarios" element={<ConfigLayout><ConfigUsuarios /></ConfigLayout>} />
          <Route path="/config/seguranca" element={<ConfigLayout><ConfigSeguranca /></ConfigLayout>} />
          <Route path="/config/maquinas" element={<ConfigLayout><ConfigMaquinas /></ConfigLayout>} />
          <Route path="/config/servicos" element={<ConfigLayout><ConfigServicos /></ConfigLayout>} />
          <Route path="/config/landing-pages" element={<ConfigLayout><ConfigLandingPages /></ConfigLayout>} />
          <Route path="/config/seo" element={<ConfigLayout><ConfigSEO /></ConfigLayout>} />
          <Route path="/config/destaques" element={<ConfigLayout><ConfigDestaques /></ConfigLayout>} />
          <Route path="/config/backgrounds" element={<ConfigLayout><ConfigBackgrounds /></ConfigLayout>} />
          <Route path="/config/timeline" element={<ConfigLayout><ConfigTimeline /></ConfigLayout>} />
          <Route path="/config/normas" element={<ConfigLayout><ConfigNormas /></ConfigLayout>} />
          <Route path="/config/social" element={<ConfigLayout><ConfigSocial /></ConfigLayout>} />
          <Route path="/config/unifilar" element={<ConfigLayout><ConfigUnifilar /></ConfigLayout>} />
          <Route path="/config/projeto/:projectId" element={<ProjetoFullScreen />} />
          <Route path="/config/painel/:panelId" element={<PainelDetail />} />
          <Route path="/config/servico/:serviceId" element={<ServicoDetail />} />
        </Routes>
      </Suspense>
      {/* WhatsApp floating button - only on public pages */}
      {!isConfigPage && <WhatsAppButton />}
      {!isConfigPage && <CookieConsent />}
    </>
  );
}

export default function App() {
  return (
    <LanguageProvider>
      <Router>
        <AppContent />
      </Router>
    </LanguageProvider>
  );
}
