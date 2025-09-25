'use client';

import {useTranslations} from 'next-intl';
import {useState} from 'react';
import {Menu, X, Globe} from 'lucide-react';
import {cn} from '@/lib/utils';

export function Navigation() {
  const t = useTranslations('navigation');
  const [isOpen, setIsOpen] = useState(false);

  const navItems = [
    { key: 'home', href: '#home' },
    { key: 'problem', href: '#problem' },
    { key: 'solution', href: '#solution' },
    { key: 'users', href: '#users' },
    { key: 'contact', href: '#contact' },
  ];

  return (
    <nav className="fixed top-0 w-full bg-white/95 backdrop-blur-sm border-b border-gray-200 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="flex-shrink-0">
            <h1 className="text-2xl font-bold text-primary-600">GROWS</h1>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:block">
            <div className="ml-10 flex items-baseline space-x-8">
              {navItems.map((item) => (
                <a
                  key={item.key}
                  href={item.href}
                  className="text-gray-700 hover:text-primary-600 px-3 py-2 text-sm font-medium transition-colors duration-200"
                >
                  {t(item.key as any)}
                </a>
              ))}
            </div>
          </div>

          {/* Language Switcher */}
          <div className="hidden md:flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <Globe className="h-4 w-4 text-gray-500" />
              <select className="text-sm border-none bg-transparent text-gray-700 focus:outline-none">
                <option value="es">ES</option>
                <option value="en">EN</option>
              </select>
            </div>
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="text-gray-700 hover:text-primary-600 focus:outline-none focus:text-primary-600"
            >
              {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Navigation */}
      {isOpen && (
        <div className="md:hidden">
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3 bg-white border-t border-gray-200">
            {navItems.map((item) => (
              <a
                key={item.key}
                href={item.href}
                className="text-gray-700 hover:text-primary-600 block px-3 py-2 text-base font-medium"
                onClick={() => setIsOpen(false)}
              >
                {t(item.key as any)}
              </a>
            ))}
            <div className="px-3 py-2">
              <div className="flex items-center space-x-2">
                <Globe className="h-4 w-4 text-gray-500" />
                <select className="text-sm border-none bg-transparent text-gray-700 focus:outline-none">
                  <option value="es">ES</option>
                  <option value="en">EN</option>
                </select>
              </div>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}
