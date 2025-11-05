'use client';

import {Building2, Mail, Phone, MapPin} from 'lucide-react';

export function Footer() {
  return (
    <footer id="contacto" className="bg-black text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Company Info */}
          <div className="col-span-1 md:col-span-2">
            <div className="flex items-center gap-3 mb-4">
              <Building2 className="h-8 w-8 text-yellow-400" />
              <h3 className="text-2xl font-bold text-yellow-400">GROWS</h3>
            </div>
            <p className="text-white/70 mb-6 max-w-md">
              Plataforma integral de gestión para la construcción que conecta constructores, 
              supervisores y clientes para optimizar procesos y mejorar la calidad.
            </p>
            <div className="space-y-2">
              <div className="flex items-center gap-3 text-white/70">
                <Mail className="h-4 w-4" />
                <span>contacto@grows.app</span>
              </div>
              <div className="flex items-center gap-3 text-white/70">
                <Phone className="h-4 w-4" />
                <span>(+54) 341 318-9944</span>
              </div>
              <div className="flex items-center gap-3 text-white/70">
                <MapPin className="h-4 w-4" />
                <span>Rosario, Santa Fe, Argentina</span>
              </div>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-lg font-semibold mb-4">Enlaces Rápidos</h4>
            <ul className="space-y-2">
              <li>
                <a href="#home" className="text-white/70 hover:text-yellow-400 transition-colors">
                  Inicio
                </a>
              </li>
              <li>
                <a href="#obras" className="text-white/70 hover:text-yellow-400 transition-colors">
                  Soluciones
                </a>
              </li>
              <li>
                <a href="#users" className="text-white/70 hover:text-yellow-400 transition-colors">
                  Roles
                </a>
              </li>
              <li>
                <a href="#ecosystem" className="text-white/70 hover:text-yellow-400 transition-colors">
                  Ecosistema
                </a>
              </li>
            </ul>
          </div>

          {/* Features */}
          <div>
            <h4 className="text-lg font-semibold mb-4">Características</h4>
            <ul className="space-y-2">
              <li className="text-white/70">Calendario Inteligente</li>
              <li className="text-white/70">Billetera Digital</li>
              <li className="text-white/70">Bolsa de Trabajo</li>
              <li className="text-white/70">Reportes de Avance</li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-white/20 mt-8 pt-8 flex flex-col md:flex-row justify-between items-center">
          <p className="text-white/60 text-sm">
            © 2024 GROWS. Todos los derechos reservados.
          </p>
          <div className="flex space-x-6 mt-4 md:mt-0">
            <a href="#" className="text-white/60 hover:text-yellow-400 transition-colors text-sm">
              Política de Privacidad
            </a>
            <a href="#" className="text-white/60 hover:text-yellow-400 transition-colors text-sm">
              Términos de Servicio
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
