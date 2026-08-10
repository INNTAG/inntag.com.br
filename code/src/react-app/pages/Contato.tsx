import { useState, useEffect } from 'react';
import { Navigation } from '@/react-app/components/Navigation';
import { Footer } from '@/react-app/components/ContactSection';
import { SEO, schemas } from '@/react-app/components/SEO';
import { ASSETS, CONTACT } from '@/react-app/data/content';
import { useBackgrounds } from '@/react-app/hooks/useBackgrounds';
import { Send, Phone, Mail, MapPin, Clock, MessageCircle, ArrowRight } from 'lucide-react';

interface ContactData {
  email: string;
  email2?: string;
  phone: string;
  phone2?: string;
  whatsapp: string;
  address: string;
}

export default function ContatoPage() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    company: '',
    subject: '',
    message: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [contactData, setContactData] = useState<ContactData | null>(null);
  const { getBackground } = useBackgrounds();
  
  const heroImage = getBackground('contato', 'hero', ASSETS.heroContato);

  useEffect(() => {
    fetch('/api/public/content/rodape')
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          const content: Record<string, string> = {};
          data.forEach((item: { content_key: string; content_value: string }) => {
            content[item.content_key] = item.content_value;
          });
          if (Object.keys(content).length > 0) {
            setContactData({
              email: content.email || CONTACT.info.email,
              email2: content.email2 || 'comercial@inntag.com.br',
              phone: content.phone || CONTACT.info.phone,
              phone2: content.phone2 || CONTACT.info.whatsapp,
              whatsapp: content.whatsapp || CONTACT.info.whatsapp,
              address: content.address || CONTACT.info.address,
            });
          }
        }
      })
      .catch(() => {});
  }, []);

  const info = contactData || {
    email: CONTACT.info.email,
    email2: 'comercial@inntag.com.br',
    phone: CONTACT.info.phone,
    phone2: CONTACT.info.whatsapp,
    whatsapp: CONTACT.info.whatsapp,
    address: CONTACT.info.address,
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    await new Promise(resolve => setTimeout(resolve, 1000));
    setSubmitted(true);
    setIsSubmitting(false);
  };

  return (
    <div className="min-h-screen bg-white">
      <SEO
        title="Contato | INNTAG Soluções Elétricas"
        description="Entre em contato com a INNTAG. Atendimento técnico especializado para projetos de painéis elétricos industriais. Americana/SP - (19) 3648-3700."
        keywords="contato INNTAG, orçamento painéis elétricos, telefone INNTAG, email INNTAG, Americana SP"
        canonical="/contato"
        schema={[
          schemas.localBusiness(),
          schemas.breadcrumb([{ name: 'Home', url: '/' }, { name: 'Contato', url: '/contato' }])
        ]}
      />
      <Navigation />
      
      {/* Hero with Background */}
      <section className="relative min-h-[50vh] flex items-end pb-16 overflow-hidden">
        <div className="absolute inset-0">
          <img 
            src={heroImage} 
            alt="Contato INNTAG"
            className="w-full h-full object-cover"
            loading="eager"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/70 to-black/40" />
        </div>
        
        <div className="relative z-10 w-full max-w-7xl mx-auto px-6">
          <p className="text-orange-400 text-sm uppercase tracking-widest font-semibold mb-4">
            Contato
          </p>
          <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold text-white mb-6 max-w-4xl">
            Fale<br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-red-500">
              Conosco
            </span>
          </h1>
          <p className="text-xl text-white/80 max-w-2xl">
            Estamos prontos para entender suas necessidades e apresentar soluções 
            que realmente fazem diferença para sua operação.
          </p>
        </div>
      </section>

      {/* Quick Contact Cards */}
      <section className="py-12 bg-neutral-950">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
            <a href={`tel:${info.phone.replace(/[^+\d]/g, '')}`} className="p-4 md:p-6 bg-white/5 border border-white/10 rounded-2xl hover:bg-white/10 transition-all group flex items-center gap-3 md:gap-4">
              <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl bg-orange-500/20 flex items-center justify-center flex-shrink-0">
                <Phone className="text-orange-400" size={18} />
              </div>
              <div className="min-w-0">
                <p className="text-white/60 text-xs md:text-sm">Telefone</p>
                <p className="text-white font-semibold text-sm md:text-base truncate">{info.phone}</p>
              </div>
            </a>
            
            <a href={`mailto:${info.email}`} className="p-4 md:p-6 bg-white/5 border border-white/10 rounded-2xl hover:bg-white/10 transition-all group flex items-center gap-3 md:gap-4">
              <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl bg-orange-500/20 flex items-center justify-center flex-shrink-0">
                <Mail className="text-orange-400" size={18} />
              </div>
              <div className="min-w-0">
                <p className="text-white/60 text-xs md:text-sm">E-mail</p>
                <p className="text-white font-semibold text-xs md:text-sm truncate">{info.email}</p>
              </div>
            </a>
            
            <a href={`https://wa.me/${info.whatsapp?.replace(/\D/g, '')}`} target="_blank" rel="noopener noreferrer" className="p-4 md:p-6 bg-white/5 border border-white/10 rounded-2xl hover:bg-white/10 transition-all group flex items-center gap-3 md:gap-4">
              <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl bg-green-500/20 flex items-center justify-center flex-shrink-0">
                <MessageCircle className="text-green-400" size={18} />
              </div>
              <div className="min-w-0">
                <p className="text-white/60 text-xs md:text-sm">WhatsApp</p>
                <p className="text-white font-semibold text-sm md:text-base">Enviar</p>
              </div>
            </a>
            
            <div className="p-4 md:p-6 bg-white/5 border border-white/10 rounded-2xl flex items-center gap-3 md:gap-4">
              <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl bg-orange-500/20 flex items-center justify-center flex-shrink-0">
                <Clock className="text-orange-400" size={18} />
              </div>
              <div className="min-w-0">
                <p className="text-white/60 text-xs md:text-sm">Horário</p>
                <p className="text-white font-semibold text-sm md:text-base">Seg–Sex, horário comercial</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Contact Content */}
      <section className="py-24">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid lg:grid-cols-2 gap-16">
            {/* Form */}
            <div>
              <h2 className="text-3xl font-bold text-neutral-900 mb-2">Envie sua mensagem</h2>
              <p className="text-neutral-500 mb-8">Preencha o formulário e retornaremos em breve.</p>
              
              {submitted ? (
                <div className="bg-neutral-50 border border-neutral-200 rounded-3xl p-12 text-center">
                  <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-6">
                    <Send className="text-green-600" size={32} />
                  </div>
                  <h3 className="text-2xl font-bold text-neutral-900 mb-4">Mensagem Enviada!</h3>
                  <p className="text-neutral-500">
                    Recebemos sua mensagem e entraremos em contato em breve.
                  </p>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-5">
                  <div className="grid md:grid-cols-2 gap-5">
                    <div>
                      <label className="block text-sm font-medium text-neutral-700 mb-2">Nome Completo *</label>
                      <input
                        type="text"
                        required
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        className="w-full px-4 py-3.5 rounded-xl border border-neutral-300 bg-white focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition-all"
                        placeholder="Seu nome"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-neutral-700 mb-2">E-mail *</label>
                      <input
                        type="email"
                        required
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        className="w-full px-4 py-3.5 rounded-xl border border-neutral-300 bg-white focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition-all"
                        placeholder="seu@email.com"
                      />
                    </div>
                  </div>
                  <div className="grid md:grid-cols-2 gap-5">
                    <div>
                      <label className="block text-sm font-medium text-neutral-700 mb-2">Telefone</label>
                      <input
                        type="tel"
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        className="w-full px-4 py-3.5 rounded-xl border border-neutral-300 bg-white focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition-all"
                        placeholder="(11) 99999-9999"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-neutral-700 mb-2">Empresa</label>
                      <input
                        type="text"
                        value={formData.company}
                        onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                        className="w-full px-4 py-3.5 rounded-xl border border-neutral-300 bg-white focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition-all"
                        placeholder="Nome da empresa"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-2">Assunto *</label>
                    <select
                      required
                      value={formData.subject}
                      onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                      className="w-full px-4 py-3.5 rounded-xl border border-neutral-300 bg-white focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition-all"
                    >
                      <option value="">Selecione um assunto</option>
                      <option value="orcamento">Solicitar Orçamento</option>
                      <option value="produtos">Informações sobre Produtos</option>
                      <option value="servicos">Informações sobre Serviços</option>
                      <option value="emergencia">Atendimento Emergencial</option>
                      <option value="trabalhe">Trabalhe Conosco</option>
                      <option value="outro">Outro Assunto</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-2">Mensagem *</label>
                    <textarea
                      required
                      rows={5}
                      value={formData.message}
                      onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                      className="w-full px-4 py-3.5 rounded-xl border border-neutral-300 bg-white focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition-all resize-none"
                      placeholder="Descreva sua necessidade..."
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full py-4 px-8 bg-gradient-to-r from-orange-500 to-red-500 text-white font-semibold rounded-xl hover:from-orange-600 hover:to-red-600 transition-all shadow-lg shadow-orange-500/30 disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {isSubmitting ? 'Enviando...' : 'Enviar Mensagem'}
                    <ArrowRight size={18} />
                  </button>
                </form>
              )}
            </div>

            {/* Contact Info & Map */}
            <div className="space-y-8">
              {/* Address Card */}
              <div className="bg-gradient-to-br from-neutral-50 to-neutral-100 border border-neutral-200 rounded-3xl p-8">
                <div className="flex items-start gap-4 mb-6">
                  <div className="w-12 h-12 rounded-xl bg-orange-500/10 flex items-center justify-center flex-shrink-0">
                    <MapPin className="text-orange-500" size={22} />
                  </div>
                  <div>
                    <h3 className="font-bold text-xl text-neutral-900 mb-2">Localização</h3>
                    <p className="text-neutral-600">
                      {info.address}
                    </p>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4 mt-8 pt-8 border-t border-neutral-200">
                  <div>
                    <p className="text-neutral-500 text-sm mb-1">Telefone Principal</p>
                    <p className="text-neutral-900 font-medium">{info.phone}</p>
                  </div>
                  {info.phone2 && info.phone2.replace(/\D/g, '') !== info.phone.replace(/\D/g, '') && (
                    <div>
                      <p className="text-neutral-500 text-sm mb-1">Telefone Alternativo</p>
                      <p className="text-neutral-900 font-medium">{info.phone2}</p>
                    </div>
                  )}
                  <div>
                    <p className="text-neutral-500 text-sm mb-1">E-mail Principal</p>
                    <p className="text-neutral-900 font-medium text-sm">{info.email}</p>
                  </div>
                  <div>
                    <p className="text-neutral-500 text-sm mb-1">E-mail Comercial</p>
                    <p className="text-neutral-900 font-medium text-sm">{info.email2}</p>
                  </div>
                </div>
              </div>
              
              {/* Map */}
              <div className="relative h-[400px] rounded-3xl overflow-hidden border border-neutral-200 shadow-lg">
                <iframe
                  src="https://maps.google.com/maps?q=Av.+de+Cillo,+4034+-+Pq+Universitario,+Americana+-+SP,+13467-600&t=&z=16&ie=UTF8&iwloc=&output=embed"
                  width="100%"
                  height="100%"
                  style={{ border: 0 }}
                  allowFullScreen
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  title="Localização INNTAG"
                  className="w-full h-full"
                />
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-6">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-white/20 backdrop-blur flex items-center justify-center">
                      <MapPin className="text-white" size={20} />
                    </div>
                    <div>
                      <p className="text-white font-semibold">INNTAG Engenharia</p>
                      <p className="text-white/70 text-sm">Americana, SP</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
      
      <Footer />
    </div>
  );
}
