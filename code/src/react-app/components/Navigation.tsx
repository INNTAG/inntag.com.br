import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router';
import { Menu, X, ArrowUpRight, Globe, ChevronDown } from 'lucide-react';

import { useLanguage, LANGUAGES, Language } from '@/react-app/contexts/LanguageContext';

interface NavigationProps {
  division?: string;
  lightBackground?: boolean;
}

export function Navigation({ division, lightBackground = false }: NavigationProps) {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isLangMenuOpen, setIsLangMenuOpen] = useState(false);
  const location = useLocation();
  const { language, setLanguage, t } = useLanguage();

  const NAV_LINKS = [
    { label: t('nav.home'), href: '/' },
    { label: t('nav.products'), href: '/produtos' },
    { label: t('nav.services'), href: '/servicos' },
    { label: 'Máquinas', href: '/maquinas' },
    { label: t('nav.clients'), href: '/clientes' },
    { label: t('nav.portfolio'), href: '/portfolio' },
    { label: 'Destaques', href: '/destaques' },
    { label: t('nav.contact'), href: '/contato' },
    { label: t('nav.portal'), href: '/portal' },
  ];

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    setIsMobileMenuOpen(false);
    setIsLangMenuOpen(false);
  }, [location.pathname]);

  const currentLang = LANGUAGES.find(l => l.code === language);

  // Text color based on background and scroll state
  const textColor = lightBackground && !isScrolled ? 'text-neutral-900' : 'text-white';
  const hoverBg = lightBackground && !isScrolled ? 'hover:bg-black/5' : 'hover:bg-white/5';
  const activeBg = lightBackground && !isScrolled ? 'bg-black/10' : 'bg-white/10';
  const divisionBorder = lightBackground && !isScrolled ? 'border-neutral-400' : 'border-white/30';

  return (
    <>
      <nav 
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
          isScrolled 
            ? 'bg-black/90 backdrop-blur-xl border-b border-white/10 py-4' 
            : 'bg-transparent py-6'
        }`}
      >
        <div className="max-w-7xl mx-auto px-6 flex items-center justify-between">
          {/* Logo - Original on light bg, white inverted on dark bg */}
          <Link to="/" className="relative z-10 flex items-center gap-2">
            <img 
              src="/api/files/logo-inntag.png" 
              alt="INNTAG" 
              className={`h-8 md:h-10 w-auto transition-all ${
                lightBackground && !isScrolled ? '' : 'brightness-0 invert'
              }`}
            />
            {division && (
              <span className={`text-sm font-medium border-l pl-4 ml-4 ${textColor} ${divisionBorder}`}>
                {division}
              </span>
            )}
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden lg:flex items-center gap-1">
            {NAV_LINKS.map((link) => {
              const isActive = location.pathname === link.href || 
                (link.href !== '/' && location.pathname.startsWith(link.href));
              return (
                <Link
                  key={link.href}
                  to={link.href}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                    isActive
                      ? `${activeBg} ${textColor}`
                      : `${textColor} ${hoverBg}`
                  }`}
                >
                  {link.label}
                </Link>
              );
            })}
          </div>

          {/* Language Selector & CTA Button */}
          <div className="hidden lg:flex items-center gap-3">
            {/* Language Selector */}
            <div className="relative">
              <button
                onClick={() => setIsLangMenuOpen(!isLangMenuOpen)}
                className={`flex items-center gap-2 px-3 py-2 rounded-full transition-all text-sm ${textColor} ${hoverBg}`}
              >
                <Globe size={16} />
                <span>{currentLang?.flag}</span>
                <ChevronDown size={14} className={`transition-transform ${isLangMenuOpen ? 'rotate-180' : ''}`} />
              </button>
              
              {isLangMenuOpen && (
                <>
                  <div 
                    className="fixed inset-0 z-40" 
                    onClick={() => setIsLangMenuOpen(false)}
                  />
                  <div className="absolute right-0 mt-2 w-44 bg-neutral-900 border border-white/10 rounded-xl shadow-2xl overflow-hidden z-50">
                    {LANGUAGES.map((lang) => (
                      <button
                        key={lang.code}
                        onClick={() => {
                          setLanguage(lang.code as Language);
                          setIsLangMenuOpen(false);
                        }}
                        className={`w-full flex items-center gap-3 px-4 py-3 text-sm transition-colors ${
                          language === lang.code 
                            ? 'bg-orange-500/20 text-orange-400' 
                            : 'text-white hover:bg-white/5'
                        }`}
                      >
                        <span className="text-lg">{lang.flag}</span>
                        <span>{lang.name}</span>
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>

            <Link
              to="/contato"
              className="group inline-flex items-center gap-2 bg-white text-black px-5 py-2.5 rounded-full text-sm font-semibold hover:bg-orange-500 hover:text-white transition-all"
            >
              {t('nav.quote')}
              <ArrowUpRight size={14} className="group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className={`lg:hidden relative z-10 p-2 ${textColor}`}
            aria-label="Menu"
          >
            {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </nav>

      {/* Mobile Menu */}
      <div 
        className={`fixed inset-0 z-40 bg-black transition-all duration-500 lg:hidden ${
          isMobileMenuOpen ? 'opacity-100 visible' : 'opacity-0 invisible'
        }`}
      >
        <div className="flex flex-col items-center justify-center h-full gap-6 px-6">
          {NAV_LINKS.map((link, i) => {
            const isActive = location.pathname === link.href;
            return (
              <Link
                key={link.href}
                to={link.href}
                className={`text-3xl font-semibold transition-all duration-300 ${
                  isActive ? 'text-red-500' : 'text-white'
                }`}
                style={{ 
                  transitionDelay: isMobileMenuOpen ? `${i * 50}ms` : '0ms',
                  opacity: isMobileMenuOpen ? 1 : 0,
                  transform: isMobileMenuOpen ? 'translateY(0)' : 'translateY(20px)',
                }}
              >
                {link.label}
              </Link>
            );
          })}
          
          {/* Mobile Language Selector */}
          <div 
            className="flex items-center gap-3 mt-4"
            style={{ 
              transitionDelay: isMobileMenuOpen ? `${NAV_LINKS.length * 50}ms` : '0ms',
              opacity: isMobileMenuOpen ? 1 : 0,
            }}
          >
            {LANGUAGES.map((lang) => (
              <button
                key={lang.code}
                onClick={() => setLanguage(lang.code as Language)}
                className={`text-2xl p-2 rounded-lg transition-all ${
                  language === lang.code 
                    ? 'bg-orange-500/20 ring-2 ring-orange-500' 
                    : 'hover:bg-white/10'
                }`}
              >
                {lang.flag}
              </button>
            ))}
          </div>
          
          <Link
            to="/contato"
            className="mt-4 inline-flex items-center gap-2 bg-orange-500 text-white px-8 py-4 rounded-full font-semibold"
            style={{ 
              transitionDelay: isMobileMenuOpen ? `${(NAV_LINKS.length + 1) * 50}ms` : '0ms',
              opacity: isMobileMenuOpen ? 1 : 0,
            }}
          >
            {t('hero.cta')}
            <ArrowUpRight size={18} />
          </Link>
        </div>
      </div>
    </>
  );
}
