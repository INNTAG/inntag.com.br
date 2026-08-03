import { Link } from 'react-router';
import { useEffect, useRef, useState } from 'react';
import { Mail, Phone, MapPin, Linkedin, Instagram, Facebook, ArrowRight } from 'lucide-react';
import { CONTACT, FOOTER } from '../data/content';

interface FooterContent {
  email: string;
  phone: string;
  whatsapp: string;
  address: string;
  cnpj: string;
  linkedin: string;
  instagram: string;
  facebook: string;
}

export function ContactSection() {
  const sectionRef = useRef<HTMLElement>(null);
  const [footerData, setFooterData] = useState<FooterContent | null>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.querySelectorAll('.reveal').forEach((el, i) => {
              setTimeout(() => el.classList.add('visible'), i * 100);
            });
          }
        });
      },
      { threshold: 0.1 }
    );

    if (sectionRef.current) observer.observe(sectionRef.current);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    fetch('/api/public/content/rodape')
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          const content: Record<string, string> = {};
          data.forEach((item: { section: string; content_key: string; content_value: string }) => {
            content[item.content_key] = item.content_value;
          });
          if (Object.keys(content).length > 0) {
            setFooterData({
              email: content.email || CONTACT.info.email,
              phone: content.phone || CONTACT.info.phone,
              whatsapp: content.whatsapp || CONTACT.info.whatsapp,
              address: content.address || CONTACT.info.address,
              cnpj: content.cnpj || FOOTER.legal.cnpj,
              linkedin: content.linkedin || FOOTER.social.linkedin,
              instagram: content.instagram || FOOTER.social.instagram,
              facebook: content.facebook || FOOTER.social.facebook,
            });
          }
        }
      })
      .catch(() => {});
  }, []);

  const contactInfo = footerData || {
    email: CONTACT.info.email,
    phone: CONTACT.info.phone,
    whatsapp: CONTACT.info.whatsapp,
    address: CONTACT.info.address,
    cnpj: FOOTER.legal.cnpj,
    linkedin: FOOTER.social.linkedin,
    instagram: FOOTER.social.instagram,
    facebook: FOOTER.social.facebook,
  };

  return (
    <section id="contato" ref={sectionRef} className="section-content bg-muted/30">
      <div className="container-world">
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto reveal">
          <div className="accent-line mx-auto mb-6" />
          <span className="text-sm uppercase tracking-widest text-muted-foreground font-medium">
            Contato
          </span>
          <h2 className="display-lg mt-4">{CONTACT.title}</h2>
          <p className="body-lg mt-6">{CONTACT.description}</p>
        </div>

        {/* Contact Cards */}
        <div className="grid md:grid-cols-3 gap-6 mt-16">
          {/* Email */}
          <div className="reveal stagger-1 card-world p-8 text-center group hover:bg-accent transition-colors duration-300">
            <div className="w-14 h-14 rounded-2xl bg-accent/10 group-hover:bg-white/20 flex items-center justify-center mx-auto transition-colors">
              <Mail size={28} className="text-accent group-hover:text-white transition-colors" />
            </div>
            <h3 className="text-xl font-bold mt-6 group-hover:text-white transition-colors">E-mail</h3>
            <a 
              href={`mailto:${contactInfo.email}`} 
              className="text-muted-foreground group-hover:text-white/80 mt-2 block transition-colors"
            >
              {contactInfo.email}
            </a>
          </div>

          {/* Phone */}
          <div className="reveal stagger-2 card-world p-8 text-center group hover:bg-accent transition-colors duration-300">
            <div className="w-14 h-14 rounded-2xl bg-accent/10 group-hover:bg-white/20 flex items-center justify-center mx-auto transition-colors">
              <Phone size={28} className="text-accent group-hover:text-white transition-colors" />
            </div>
            <h3 className="text-xl font-bold mt-6 group-hover:text-white transition-colors">Telefone</h3>
            <a 
              href={`tel:${contactInfo.phone}`} 
              className="text-muted-foreground group-hover:text-white/80 mt-2 block transition-colors"
            >
              {contactInfo.phone}
            </a>
          </div>

          {/* Address */}
          <div className="reveal stagger-3 card-world p-8 text-center group hover:bg-accent transition-colors duration-300">
            <div className="w-14 h-14 rounded-2xl bg-accent/10 group-hover:bg-white/20 flex items-center justify-center mx-auto transition-colors">
              <MapPin size={28} className="text-accent group-hover:text-white transition-colors" />
            </div>
            <h3 className="text-xl font-bold mt-6 group-hover:text-white transition-colors">Endereço</h3>
            <p className="text-muted-foreground group-hover:text-white/80 mt-2 transition-colors">
              {contactInfo.address}
            </p>
          </div>
        </div>

        {/* CTA */}
        <div className="text-center mt-12 reveal stagger-4">
          <a 
            href={`mailto:${contactInfo.email}?subject=Solicitação de Orçamento`}
            className="btn-world-lg btn-primary inline-flex"
          >
            {CONTACT.cta}
            <ArrowRight size={20} />
          </a>
        </div>
      </div>
    </section>
  );
}

export function Footer() {
  const [footerData, setFooterData] = useState<{
    email: string;
    phone: string;
    whatsapp: string;
    address: string;
    cnpj: string;
    linkedin: string;
    instagram: string;
    facebook: string;
  } | null>(null);

  useEffect(() => {
    fetch('/api/public/content/rodape')
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          const content: Record<string, string> = {};
          data.forEach((item: { section: string; content_key: string; content_value: string }) => {
            content[item.content_key] = item.content_value;
          });
          if (Object.keys(content).length > 0) {
            setFooterData({
              email: content.email || FOOTER.contact.email,
              phone: content.phone || FOOTER.contact.phone,
              whatsapp: content.whatsapp || FOOTER.contact.whatsapp,
              address: content.address || FOOTER.contact.address,
              cnpj: content.cnpj || FOOTER.legal.cnpj,
              linkedin: content.linkedin || FOOTER.social.linkedin,
              instagram: content.instagram || FOOTER.social.instagram,
              facebook: content.facebook || FOOTER.social.facebook,
            });
          }
        }
      })
      .catch(() => {});
  }, []);

  const contact = footerData || {
    email: FOOTER.contact.email,
    phone: FOOTER.contact.phone,
    whatsapp: FOOTER.contact.whatsapp,
    address: FOOTER.contact.address,
    cnpj: FOOTER.legal.cnpj,
    linkedin: FOOTER.social.linkedin,
    instagram: FOOTER.social.instagram,
    facebook: FOOTER.social.facebook,
  };

  return (
    <footer className="bg-foreground text-background">
      {/* Main Footer */}
      <div className="container-world py-12 md:py-16 lg:py-20">
        <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8 lg:gap-8">
          {/* Company Info */}
          <div className="col-span-2 md:col-span-2 lg:col-span-1">
            <div className="flex items-center gap-2 mb-4 md:mb-6">
              <img 
                src="/api/files/logo-inntag.png" 
                alt="INNTAG" 
                className="h-8 md:h-10 w-auto brightness-0 invert"
              />
            </div>
            <p className="text-background/60 text-xs md:text-sm leading-relaxed max-w-xs">
              {FOOTER.company.description}
            </p>
            
            {/* Social Links */}
            <div className="flex gap-3 md:gap-4 mt-4 md:mt-6">
              <a 
                href={contact.linkedin} 
                target="_blank" 
                rel="noopener noreferrer"
                className="w-9 h-9 md:w-10 md:h-10 rounded-full bg-background/10 flex items-center justify-center hover:bg-accent hover:text-white transition-colors"
              >
                <Linkedin size={16} className="md:w-[18px] md:h-[18px]" />
              </a>
              <a 
                href={contact.instagram} 
                target="_blank" 
                rel="noopener noreferrer"
                className="w-9 h-9 md:w-10 md:h-10 rounded-full bg-background/10 flex items-center justify-center hover:bg-accent hover:text-white transition-colors"
              >
                <Instagram size={16} className="md:w-[18px] md:h-[18px]" />
              </a>
              <a 
                href={contact.facebook} 
                target="_blank" 
                rel="noopener noreferrer"
                className="w-9 h-9 md:w-10 md:h-10 rounded-full bg-background/10 flex items-center justify-center hover:bg-accent hover:text-white transition-colors"
              >
                <Facebook size={16} className="md:w-[18px] md:h-[18px]" />
              </a>
            </div>
          </div>

          {/* Services */}
          <div>
            <h4 className="font-semibold text-base md:text-lg mb-4 md:mb-6">Serviços</h4>
            <ul className="space-y-2 md:space-y-3">
              {FOOTER.services.map((item, index) => (
                <li key={index}>
                  <Link 
                    to={item.href}
                    className="text-background/60 hover:text-accent transition-colors text-xs md:text-sm"
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Company Links */}
          <div>
            <h4 className="font-semibold text-base md:text-lg mb-4 md:mb-6">Empresa</h4>
            <ul className="space-y-2 md:space-y-3">
              {FOOTER.company_links.map((item, index) => (
                <li key={index}>
                  <Link 
                    to={item.href}
                    className="text-background/60 hover:text-accent transition-colors text-xs md:text-sm"
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact Info */}
          <div className="col-span-2 md:col-span-1">
            <h4 className="font-semibold text-base md:text-lg mb-4 md:mb-6">Contato</h4>
            <ul className="space-y-3 md:space-y-4">
              <li className="flex items-start gap-2 md:gap-3">
                <Mail size={16} className="text-accent flex-shrink-0 mt-0.5 md:w-[18px] md:h-[18px]" />
                <div>
                  <p className="text-[10px] md:text-xs text-background/40 uppercase tracking-wide">E-mail</p>
                  <a 
                    href={`mailto:${contact.email}`}
                    className="text-background/80 hover:text-accent transition-colors text-xs md:text-sm"
                  >
                    {contact.email}
                  </a>
                </div>
              </li>
              <li className="flex items-start gap-2 md:gap-3">
                <Phone size={16} className="text-accent flex-shrink-0 mt-0.5 md:w-[18px] md:h-[18px]" />
                <div>
                  <p className="text-[10px] md:text-xs text-background/40 uppercase tracking-wide">Telefone</p>
                  <a 
                    href={`tel:${contact.phone}`}
                    className="text-background/80 hover:text-accent transition-colors text-xs md:text-sm"
                  >
                    {contact.phone}
                  </a>
                </div>
              </li>
              <li className="flex items-start gap-2 md:gap-3">
                <MapPin size={16} className="text-accent flex-shrink-0 mt-0.5 md:w-[18px] md:h-[18px]" />
                <div>
                  <p className="text-[10px] md:text-xs text-background/40 uppercase tracking-wide">Endereço</p>
                  <p className="text-background/80 text-xs md:text-sm">{contact.address}</p>
                </div>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="border-t border-background/10">
        <div className="container-world py-4 md:py-6">
          <div className="flex flex-col md:flex-row justify-between items-center gap-2 md:gap-4">
            <p className="text-background/40 text-xs md:text-sm text-center md:text-left">
              {FOOTER.legal.copyright}
            </p>
            <p className="text-background/40 text-xs md:text-sm">
              {contact.cnpj}
            </p>
          </div>
        </div>
      </div>

      {/* Hidden admin link - triple click to access */}
      <Link 
        to="/config"
        className="fixed bottom-4 right-4 w-1 h-1 opacity-0"
        aria-hidden="true"
      />
    </footer>
  );
}
