'use client';

import Image from 'next/image';
import Link from 'next/link';
import {Mail, Phone, MapPin, Instagram, ArrowRight} from 'lucide-react';

export function Footer() {
  return (
    <footer className="bg-[#0D0D0D] text-white py-12 px-6 md:px-12">
      <div className="max-w-screen-xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-10">
        {/* Columna 1: Logo + descripción */}
        <div className="flex flex-col items-center md:items-start text-center md:text-left">
          <Image
            src="/images/logo2.png"
            alt="GROWS logo"
            width={120}
            height={120}
            className="mb-4 brightness-0 invert-[0.8]"
          />
          <p className="text-sm text-gray-300 max-w-xs">
            Construcción inteligente impulsada por IA. Conectamos constructores, supervisores y
            clientes para optimizar procesos y mejorar la calidad.
          </p>
        </div>

        {/* Columna 2: Contacto */}
        <div className="flex flex-col items-center md:items-start text-center md:text-left">
          <h3 className="text-[#CBA135] font-semibold text-lg mb-3">Contacto</h3>
          <ul className="space-y-2 text-gray-300">
            <li className="flex items-center gap-2 justify-center md:justify-start">
              <Mail size={18} className="text-[#CBA135]" /> makeitgrows@gmail.com
            </li>
            <li className="flex items-center gap-2 justify-center md:justify-start">
              <Phone size={18} className="text-[#CBA135]" /> (+54) 341 318-9944
            </li>
            <li className="flex items-center gap-2 justify-center md:justify-start">
              <MapPin size={18} className="text-[#CBA135]" /> Rosario, Santa Fe, Argentina
            </li>
          </ul>

          <div className="flex items-center justify-center md:justify-start gap-4 mt-4">
            <a
              href="https://www.instagram.com/makeitgrows"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:scale-110 transition"
            >
              <Instagram className="w-6 h-6 text-[#CBA135]" />
            </a>
          </div>
        </div>

        {/* Columna 3: Enlaces + CTA */}
        <div className="flex flex-col items-center md:items-start text-center md:text-left">
          <h3 className="text-[#CBA135] font-semibold text-lg mb-3">Enlaces Rápidos</h3>
          <ul className="space-y-2 text-gray-300 mb-4">
            <li>
              <Link href="/es" className="hover:text-white transition">
                Inicio
              </Link>
            </li>
            <li>
              <Link href="/es/soluciones" className="hover:text-white transition">
                Soluciones
              </Link>
            </li>
            <li>
              <Link href="/es/roles" className="hover:text-white transition">
                Roles
              </Link>
            </li>
            <li>
              <Link href="/es/ecosistema" className="hover:text-white transition">
                Ecosistema
              </Link>
            </li>
            <li>
              <Link href="/es/precios" className="hover:text-white transition">
                Precios
              </Link>
            </li>
          </ul>

          <Link
            href="mailto:makeitgrows@gmail.com"
            className="inline-flex items-center justify-center gap-2 bg-[#CBA135] text-black font-semibold py-2 px-6 rounded-xl hover:bg-[#E3C35F] transition"
          >
            Contactanos <ArrowRight size={18} />
          </Link>
        </div>
      </div>

      {/* Línea final */}
      <div className="mt-10 border-t border-white/10 pt-6 text-center text-sm text-gray-400">
        © 2025 GROWS — Todos los derechos reservados.
      </div>
    </footer>
  );
}
