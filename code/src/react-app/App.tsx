import { BrowserRouter as Router, Routes, Route, useLocation } from "react-router";
import { LanguageProvider } from "@/react-app/contexts/LanguageContext";
import WhatsAppButton from "@/react-app/components/WhatsAppButton";
import CookieConsent from "@/react-app/components/CookieConsent";
import HomePage from "@/react-app/pages/Home";
import ProdutosPage from "@/react-app/pages/Produtos";
import ServicosPage from "@/react-app/pages/Servicos";
import MaquinasPage from "@/react-app/pages/Maquinas";
import ClientesPage from "@/react-app/pages/Clientes";
import PortfolioPage from "@/react-app/pages/Portfolio";
import ContatoPage from "@/react-app/pages/Contato";
import Portal from "@/react-app/pages/Portal";
import ConfigLogin from "@/react-app/pages/config/ConfigLogin";
import ConfigLayout from "@/react-app/pages/config/ConfigLayout";
import ConfigDashboard from "@/react-app/pages/config/ConfigDashboard";
import ConfigProdutos from "@/react-app/pages/config/ConfigProdutos";
import ConfigProjetos from "@/react-app/pages/config/ConfigProjetos";
import ConfigClientes from "@/react-app/pages/config/ConfigClientes";
import ConfigConteudo from "@/react-app/pages/config/ConfigConteudo";
import ConfigUsuarios from "@/react-app/pages/config/ConfigUsuarios";
import ConfigSeguranca from "@/react-app/pages/config/ConfigSeguranca";
import ConfigMaquinas from "@/react-app/pages/config/ConfigMaquinas";
import ConfigDestaques from "@/react-app/pages/config/ConfigDestaques";
import ConfigServicos from "@/react-app/pages/config/ConfigServicos";
import ConfigLandingPages from "@/react-app/pages/config/ConfigLandingPages";
import ConfigSEO from "@/react-app/pages/config/ConfigSEO";
import ConfigEmpresas from "@/react-app/pages/config/ConfigEmpresas";
import ConfigBackgrounds from "@/react-app/pages/config/ConfigBackgrounds";
import ConfigTimeline from "@/react-app/pages/config/ConfigTimeline";
import ConfigNormas from "@/react-app/pages/config/ConfigNormas";
import ConfigSocial from "@/react-app/pages/config/ConfigSocial";
import ConfigUnifilar from "@/react-app/pages/config/ConfigUnifilar";
import ProjetoFullScreen from "@/react-app/pages/config/ProjetoFullScreen";
import PainelDetail from "@/react-app/pages/config/PainelDetail";
import ServicoDetail from "@/react-app/pages/config/ServicoDetail";
import Destaques from "@/react-app/pages/Destaques";
import LandingPage from "@/react-app/pages/LandingPage";
import SEOTermPage from "@/react-app/pages/SEOTermPage";
import Unifilar from "@/react-app/pages/Unifilar";

function AppContent() {
  const location = useLocation();
  const isConfigPage = location.pathname.startsWith('/config');
  
  return (
    <>
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
