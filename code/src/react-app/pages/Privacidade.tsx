import { Navigation } from '@/react-app/components/Navigation';
import { Footer } from '@/react-app/components/ContactSection';
import { SEO } from '@/react-app/components/SEO';

export default function Privacidade() {
  return (
    <div className="min-h-screen bg-white">
      <SEO
        title="Política de Privacidade"
        description="Política de Privacidade e tratamento de dados pessoais do Grupo INNTAG, em conformidade com a LGPD (Lei nº 13.709/2018)."
        canonical="/privacidade"
      />
      <Navigation lightBackground />

      <main className="max-w-3xl mx-auto px-6 pt-36 pb-24">
        <p className="text-red-600 font-medium tracking-wide uppercase text-sm mb-3">Transparência</p>
        <h1 className="text-4xl md:text-5xl font-semibold text-neutral-900 tracking-tight mb-6">
          Política de Privacidade
        </h1>
        <p className="text-neutral-500 mb-12">
          Em conformidade com a Lei Geral de Proteção de Dados — LGPD (Lei nº 13.709/2018).
        </p>

        <div className="space-y-8 text-neutral-700 leading-relaxed [&_h2]:text-neutral-900 [&_h2]:text-xl [&_h2]:font-semibold [&_h2]:mb-3">
          <section>
            <h2>1. Quem somos</h2>
            <p>
              O Grupo INNTAG, com sede na Av. de Cillo, 4034, Parque Universitário, Americana/SP,
              CEP 13467-600, é o controlador dos dados pessoais tratados por meio deste site.
              Contato: <a href="mailto:contato@inntag.com.br" className="text-red-600 underline">contato@inntag.com.br</a>.
            </p>
          </section>

          <section>
            <h2>2. Dados que coletamos</h2>
            <p>
              Coletamos apenas os dados que você nos fornece voluntariamente ao preencher o formulário de
              contato (nome, e-mail, telefone e empresa) e dados de navegação estritamente necessários ao
              funcionamento e à análise de uso do site (cookies).
            </p>
          </section>

          <section>
            <h2>3. Para que usamos</h2>
            <p>
              Utilizamos os dados para responder às suas solicitações, elaborar propostas comerciais,
              melhorar a experiência de navegação e cumprir obrigações legais. Não vendemos seus dados a
              terceiros.
            </p>
          </section>

          <section>
            <h2>4. Cookies</h2>
            <p>
              Utilizamos cookies essenciais (necessários ao funcionamento) e, mediante seu consentimento,
              cookies de análise para entender como o site é utilizado. Você pode aceitar apenas os
              essenciais no banner exibido ao acessar o site e ajustar as configurações do seu navegador a
              qualquer momento.
            </p>
          </section>

          <section>
            <h2>5. Seus direitos (LGPD)</h2>
            <p>
              Você pode, a qualquer momento, solicitar confirmação da existência de tratamento, acesso,
              correção, anonimização, portabilidade, eliminação dos dados e revogação do consentimento.
              Para exercer seus direitos, entre em contato pelo e-mail
              <a href="mailto:contato@inntag.com.br" className="text-red-600 underline"> contato@inntag.com.br</a>.
            </p>
          </section>

          <section>
            <h2>6. Segurança</h2>
            <p>
              Adotamos medidas técnicas e organizacionais para proteger seus dados contra acesso não
              autorizado, perda ou alteração, incluindo tráfego criptografado (HTTPS) e controles de acesso.
            </p>
          </section>

          <section>
            <h2>7. Alterações</h2>
            <p>
              Esta política pode ser atualizada periodicamente. Recomendamos a revisão regular desta página.
            </p>
          </section>
        </div>
      </main>

      <Footer />
    </div>
  );
}
