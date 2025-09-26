'use client';

import {useState} from 'react';
import {Menu, X} from 'lucide-react';

export function Navigation() {
  const [isOpen, setIsOpen] = useState(false);

  const navItems = [
    { label: '¿Qué es?', href: '#que-es' },
    { label: '¿Para quién?', href: '#para-quien' },
    { label: 'Características', href: '#caracteristicas' },
    { label: 'Comenzar', href: '#comenzar' },
  ];

  return (
    <nav className="fixed top-0 w-full bg-white/95 backdrop-blur-sm border-b border-claro z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="flex-shrink-0">
            <h1 className="text-2xl font-bold text-primario">GROWS</h1>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:block">
            <div className="ml-10 flex items-baseline space-x-8">
              {navItems.map((item) => (
                <a
                  key={item.label}
                  href={item.href}
                  className="text-oscuro hover:text-primario px-3 py-2 text-sm font-medium transition-colors duration-200"
                >
                  {item.label}
                </a>
              ))}
            </div>
          </div>

          {/* Botones de acción */}
          <div className="hidden md:flex items-center space-x-4">
            <button className="text-oscuro hover:text-primario px-3 py-2 text-sm font-medium transition-colors duration-200">
              Iniciar sesión
            </button>
            <button className="bg-acento text-oscuro px-4 py-2 rounded-lg text-sm font-semibold hover:bg-acento/90 transition-colors duration-200">
              Crear cuenta
            </button>
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="text-oscuro hover:text-primario focus:outline-none focus:text-primario"
            >
              {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Navigation */}
      {isOpen && (
        <div className="md:hidden">
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3 bg-white border-t border-claro">
            {navItems.map((item) => (
              <a
                key={item.label}
                href={item.href}
                className="text-oscuro hover:text-primario block px-3 py-2 text-base font-medium"
                onClick={() => setIsOpen(false)}
              >
                {item.label}
              </a>
            ))}
            <div className="px-3 py-2 space-y-2">
              <button className="text-oscuro hover:text-primario block px-3 py-2 text-base font-medium w-full text-left">
                Iniciar sesión
              </button>
              <button className="bg-acento text-oscuro px-3 py-2 rounded-lg text-base font-semibold hover:bg-acento/90 transition-colors duration-200 w-full">
                Crear cuenta
              </button>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}
