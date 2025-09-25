'use client';

import {useTranslations} from 'next-intl';
import {Building2, Mail, Phone, MapPin} from 'lucide-react';

export function Footer() {
  const t = useTranslations('footer');

  return (
    <footer className="bg-gray-900 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Company Info */}
          <div className="col-span-1 md:col-span-2">
            <div className="flex items-center gap-3 mb-4">
              <Building2 className="h-8 w-8 text-primary-400" />
              <h3 className="text-2xl font-bold">GROWS</h3>
            </div>
            <p className="text-gray-300 mb-6 max-w-md">
              {t('description')}
            </p>
            <div className="space-y-2">
              <div className="flex items-center gap-3 text-gray-300">
                <Mail className="h-4 w-4" />
                <span>contacto@grows.com</span>
              </div>
              <div className="flex items-center gap-3 text-gray-300">
                <Phone className="h-4 w-4" />
                <span>+54 11 1234-5678</span>
              </div>
              <div className="flex items-center gap-3 text-gray-300">
                <MapPin className="h-4 w-4" />
                <span>Buenos Aires, Argentina</span>
              </div>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-lg font-semibold mb-4">Enlaces Rápidos</h4>
            <ul className="space-y-2">
              <li>
                <a href="#home" className="text-gray-300 hover:text-white transition-colors">
                  Inicio
                </a>
              </li>
              <li>
                <a href="#problem" className="text-gray-300 hover:text-white transition-colors">
                  Problema
                </a>
              </li>
              <li>
                <a href="#solution" className="text-gray-300 hover:text-white transition-colors">
                  Solución
                </a>
              </li>
              <li>
                <a href="#users" className="text-gray-300 hover:text-white transition-colors">
                  Usuarios
                </a>
              </li>
              <li>
                <a href="#contact" className="text-gray-300 hover:text-white transition-colors">
                  Contacto
                </a>
              </li>
            </ul>
          </div>

          {/* Features */}
          <div>
            <h4 className="text-lg font-semibold mb-4">Características</h4>
            <ul className="space-y-2">
              <li className="text-gray-300">Plantillas Constructivas</li>
              <li className="text-gray-300">Cronogramas Automáticos</li>
              <li className="text-gray-300">Seguimiento Visual</li>
              <li className="text-gray-300">Gestión Centralizada</li>
              <li className="text-gray-300">Sistema de Reputación</li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-gray-800 mt-8 pt-8 flex flex-col md:flex-row justify-between items-center">
          <p className="text-gray-400 text-sm">
            © 2024 GROWS. {t('rights')}
          </p>
          <div className="flex space-x-6 mt-4 md:mt-0">
            <a href="#" className="text-gray-400 hover:text-white transition-colors text-sm">
              Política de Privacidad
            </a>
            <a href="#" className="text-gray-400 hover:text-white transition-colors text-sm">
              Términos de Servicio
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
