'use client';

import {useState} from 'react';
import {useTranslations} from 'next-intl';
import {Menu, X, Globe, LogIn, UserPlus} from 'lucide-react';

const APP_URL = 'http://localhost:3001';

export function Navigation() {
  const [isOpen, setIsOpen] = useState(false);
  const [isLangOpen, setIsLangOpen] = useState(false);
  const t = useTranslations('navigation');

  const navItems = [
    { label: t('home'), href: '#home' },
    { label: 'Solución', href: '#solution' },
    { label: 'Precios', href: '#pricing' },
    { label: t('users'), href: '#users' },
    { label: t('contact'), href: '#contact' },
  ];

  const languages = [
    { code: 'es', name: 'Español', flag: '🇪🇸' },
    { code: 'en', name: 'English', flag: '🇺🇸' },
  ];

  return (
    <nav className="fixed top-0 w-full bg-grows-primary/95 backdrop-blur-sm border-b border-grows-secondary/30 z-50">
      <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12">
        <div className="flex justify-between items-center h-24">
          {/* Logo */}
          <div className="flex-shrink-0 flex items-center">
            <div className="w-12 h-12 bg-grows-secondary rounded-lg flex items-center justify-center mr-4 shadow-lg">
              <span className="text-grows-primary font-bold text-2xl">G</span>
            </div>
            <span className="text-white font-bold text-3xl">GROWS</span>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:block">
            <div className="ml-10 flex items-baseline space-x-8">
              {navItems.map((item) => (
                <a
                  key={item.label}
                  href={item.href}
                  className="text-white/90 hover:text-grows-secondary px-4 py-3 text-lg font-semibold transition-colors duration-200 hover:bg-white/10 rounded-lg"
                >
                  {item.label}
                </a>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="hidden md:flex items-center gap-6">
            {/* Language Selector */}
            <div className="relative">
              <button
                onClick={() => setIsLangOpen(!isLangOpen)}
                className="flex items-center space-x-2 text-white/90 hover:text-grows-secondary px-4 py-3 text-lg font-semibold transition-colors duration-200 hover:bg-white/10 rounded-lg"
              >
                <Globe className="h-4 w-4" />
                <span>ES</span>
              </button>
              
              {isLangOpen && (
                <div className="absolute right-0 mt-2 w-32 bg-white rounded-lg shadow-lg border border-grows-border overflow-hidden">
                  {languages.map((lang) => (
                    <button
                      key={lang.code}
                      className="w-full text-left px-4 py-2 text-sm text-grows-text-primary hover:bg-grows-background transition-colors duration-200 flex items-center space-x-2"
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
            <a
              href={`${APP_URL}/auth/login`}
              className="flex items-center gap-3 text-white/90 hover:text-grows-secondary px-6 py-3 text-lg font-semibold transition-colors duration-200 hover:bg-white/10 rounded-lg"
            >
              <LogIn className="h-5 w-5" />
              Ingresar
            </a>
            <a
              href={`${APP_URL}/auth/login`}
              className="flex items-center gap-3 bg-grows-secondary text-grows-text-primary px-8 py-3 rounded-lg text-lg font-bold hover:bg-grows-secondary/90 transition-all duration-200 shadow-lg hover:shadow-xl"
            >
              <UserPlus className="h-5 w-5" />
              Registrarse
            </a>
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
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3 bg-grows-primary border-t border-grows-secondary/30">
            {navItems.map((item) => (
              <a
                key={item.label}
                href={item.href}
                className="text-white/90 hover:text-grows-secondary block px-3 py-2 text-base font-medium"
                onClick={() => setIsOpen(false)}
              >
                {item.label}
              </a>
            ))}
            
            {/* Mobile Auth Buttons */}
            <div className="px-3 py-2 border-t border-grows-secondary/30 mt-2 space-y-2">
              <a
                href={`${APP_URL}/auth/login`}
                className="flex items-center gap-2 text-white/90 hover:text-grows-secondary px-3 py-2 text-base font-medium"
                onClick={() => setIsOpen(false)}
              >
                <LogIn className="h-4 w-4" />
                Ingresar
              </a>
              <a
                href={`${APP_URL}/auth/login`}
                className="flex items-center justify-center gap-2 bg-grows-secondary text-grows-text-primary px-5 py-3 rounded-md text-base font-semibold w-full"
                onClick={() => setIsOpen(false)}
              >
                <UserPlus className="h-4 w-4" />
                Registrarse
              </a>
            </div>

            {/* Mobile Language */}
            <div className="px-3 py-2 border-t border-grows-secondary/30 mt-2">
              <div className="space-y-2">
                {languages.map((lang) => (
                  <button
                    key={lang.code}
                    className="flex items-center space-x-2 text-white/90 hover:text-grows-secondary px-3 py-2 text-base font-medium w-full text-left"
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
