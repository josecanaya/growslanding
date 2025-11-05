'use client';

import {useState, useEffect} from 'react';
import {useTranslations, useLocale} from 'next-intl';
import Link from 'next/link';
import Image from 'next/image';
import {Menu, X, Globe, LogIn, UserPlus} from 'lucide-react';

export function Navigation() {
  const [isOpen, setIsOpen] = useState(false);
  const [isLangOpen, setIsLangOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const t = useTranslations('navigation');
  const locale = useLocale();

  // Detectar scroll
  useEffect(() => {
    const handleScroll = () => {
      const scrollTop = window.scrollY;
      setIsScrolled(scrollTop > 100); // Aparece después de 100px de scroll
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navItems = [
    { label: 'Inicio', href: '#home' },
    { label: 'Soluciones', href: '#obras' },
    { label: 'Roles', href: '#users' },
    { label: 'Ecosistema', href: '#ecosystem' },
    { label: 'Precios', href: '#pricing' },
    { label: 'Contacto', href: '#contacto' },
  ];

  const languages = [
    { code: 'es', name: 'Español', flag: '🇪🇸' },
    { code: 'en', name: 'English', flag: '🇺🇸' },
  ];

  return (
    <nav className={`fixed top-0 w-full bg-black/95 backdrop-blur-sm border-b border-yellow-400/30 z-50 transition-all duration-500 ${
      isScrolled ? 'translate-y-0 opacity-100' : '-translate-y-full opacity-0'
    }`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-8 lg:px-8">
        <div className="flex justify-between items-center h-24 gap-4">
          {/* Logo */}
          <Link href="/" className="flex-shrink-0 flex items-center gap-3 hover:opacity-90 transition-opacity" style={{ height: '100%' }}>
            <Image 
              src="/images/logo-amarillo.svg" 
              alt="GROWS" 
              width={140} 
              height={67} 
              className="object-contain" 
              priority
              style={{ height: '50%', width: 'auto', objectFit: 'contain', filter: 'invert(88%) sepia(98%) saturate(2639%) hue-rotate(345deg) brightness(101%) contrast(101%)' }}
            />
            <span className="text-yellow-400 font-bold text-2xl">GROWS</span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:block">
            <div className="flex items-baseline space-x-4">
              {navItems.map((item) => (
                <a
                  key={item.label}
                  href={item.href}
                  className="text-white/90 hover:text-yellow-400 px-3 py-3 text-sm font-semibold transition-colors duration-200 hover:bg-white/10 rounded-lg"
                >
                  {item.label}
                </a>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="hidden md:flex items-center gap-4">
            {/* Language Selector */}
            <div className="relative">
              <button
                onClick={() => setIsLangOpen(!isLangOpen)}
                className="flex items-center space-x-2 text-white/90 hover:text-yellow-400 px-4 py-3 text-lg font-semibold transition-colors duration-200 hover:bg-white/10 rounded-lg"
              >
                <Globe className="h-4 w-4" />
                <span>ES</span>
              </button>
              
              {isLangOpen && (
                <div className="absolute right-0 mt-2 w-32 bg-white rounded-lg shadow-lg border border-gray-200 overflow-hidden">
                  {languages.map((lang) => (
                    <button
                      key={lang.code}
                      className="w-full text-left px-4 py-2 text-sm text-gray-800 hover:bg-gray-100 transition-colors duration-200 flex items-center space-x-2"
                      onClick={() => setIsLangOpen(false)}
                    >
                      <span>{lang.flag}</span>
                      <span>{lang.name}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Auth Buttons */}
            <Link
              href={`/${locale}/coming-soon`}
              className="flex items-center gap-2 text-white/90 hover:text-yellow-400 px-4 py-3 text-sm font-semibold transition-colors duration-200 hover:bg-white/10 rounded-lg"
            >
              <LogIn className="h-5 w-5" />
              Ingresar
            </Link>
            <Link
              href={`/${locale}/coming-soon`}
              className="flex items-center gap-2 bg-yellow-400 text-black px-6 py-3 rounded-lg text-sm font-bold hover:bg-yellow-300 transition-all duration-200 shadow-lg hover:shadow-xl"
            >
              <UserPlus className="h-5 w-5" />
              Registrarse
            </Link>
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="text-white hover:text-acento focus:outline-none focus:text-acento"
            >
              {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Navigation */}
      {isOpen && (
        <div className="md:hidden">
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3 bg-black border-t border-yellow-400/30">
            {navItems.map((item) => (
              <a
                key={item.label}
                href={item.href}
                className="text-white/90 hover:text-yellow-400 block px-3 py-2 text-base font-medium"
                onClick={() => setIsOpen(false)}
              >
                {item.label}
              </a>
            ))}
            
            {/* Mobile Auth Buttons */}
            <div className="px-3 py-2 border-t border-yellow-400/30 mt-2 space-y-2">
              <Link
                href={`/${locale}/coming-soon`}
                className="flex items-center gap-2 text-white/90 hover:text-yellow-400 px-3 py-2 text-base font-medium"
                onClick={() => setIsOpen(false)}
              >
                <LogIn className="h-4 w-4" />
                Ingresar
              </Link>
              <Link
                href={`/${locale}/coming-soon`}
                className="flex items-center justify-center gap-2 bg-yellow-400 text-black px-5 py-3 rounded-md text-base font-semibold w-full"
                onClick={() => setIsOpen(false)}
              >
                <UserPlus className="h-4 w-4" />
                Registrarse
              </Link>
            </div>

            {/* Mobile Language */}
            <div className="px-3 py-2 border-t border-yellow-400/30 mt-2">
              <div className="space-y-2">
                {languages.map((lang) => (
                  <button
                    key={lang.code}
                    className="flex items-center space-x-2 text-white/90 hover:text-yellow-400 px-3 py-2 text-base font-medium w-full text-left"
                    onClick={() => setIsOpen(false)}
                  >
                    <span>{lang.flag}</span>
                    <span>{lang.name}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}
