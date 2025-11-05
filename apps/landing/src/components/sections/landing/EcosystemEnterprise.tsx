'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';

export function EcosystemEnterprise() {
  return (
    <div className="w-full bg-[#F9FAFB] py-3">
      <div className="max-w-7xl mx-auto px-2">
        
        {/* Título */}
        <div className="text-center mb-20">
          <h2 className="text-6xl font-bold text-[#1E293B] mb-6 tracking-tight leading-tight">
           <span className="text-[#1E293B] font-extrabold"> Más que una plataforma, es un ecosistema.</span>
          </h2>
        </div>

        {/* Diagrama Enterprise */}
        <div className="relative bg-white rounded-2xl p-16 shadow-sm border border-gray-100">
          
          {/* Nivel 1: Roles Estratégicos */}
          <div className="flex justify-center space-x-40 mb-24">
            
            {/* Arquitecto */}
            <Link href="/es/roles/arquitecto-tecnico" className="text-center group block">
              <div className="relative w-32 h-32 bg-[#F3F4F6] rounded-full flex items-center justify-center mx-auto mb-6 shadow-sm border border-gray-200 hover:shadow-md transition-all duration-300 hover:border-[#C6A34F] cursor-pointer">
                <Image 
                  src="/images/Icono_tecnico.png" 
                  alt="Arquitecto" 
                  width={96}
                  height={96}
                  className="w-24 h-24 rounded-full object-cover filter grayscale group-hover:grayscale-0 transition-all duration-300"
                />
                <div className="absolute inset-0 rounded-full border-2 border-dashed border-[#1E40AF] opacity-30 group-hover:opacity-60 transition-all duration-300"></div>
              </div>
              <h3 className="text-xl font-medium text-[#1E293B] mb-3 font-['Inter']">Arquitecto</h3>
              <p className="text-sm text-[#6B7280] max-w-48 font-['Inter'] font-normal">Decisiones de diseño y validaciones técnicas</p>
            </Link>

            {/* Socio Constructor */}
            <Link href="/es/roles/socio-constructor" className="text-center group block">
              <div className="relative w-32 h-32 bg-[#F3F4F6] rounded-full flex items-center justify-center mx-auto mb-6 shadow-sm border border-gray-200 hover:shadow-md transition-all duration-300 hover:border-[#C6A34F] cursor-pointer">
                <Image 
                  src="/images/Icono_socio.png" 
                  alt="Socio Constructor" 
                  width={96}
                  height={96}
                  className="w-24 h-24 rounded-full object-cover filter grayscale group-hover:grayscale-0 transition-all duration-300"
                />
                <div className="absolute inset-0 rounded-full border-2 border-dashed border-[#1E40AF] opacity-30 group-hover:opacity-60 transition-all duration-300"></div>
              </div>
              <h3 className="text-xl font-medium text-[#1E293B] mb-3 font-['Inter']">Socio Constructor</h3>
              <p className="text-sm text-[#6B7280] max-w-48 font-['Inter'] font-normal">Gestión operativa y recursos</p>
            </Link>
          </div>

          {/* Separador */}
          <div className="flex justify-center mb-24">
            <div className="flex items-center space-x-4">
              <div className="w-8 h-px bg-[#C6A34F]"></div>
              <div className="w-2 h-2 bg-[#C6A34F] rounded-full"></div>
              <div className="w-8 h-px bg-[#C6A34F]"></div>
            </div>
          </div>

          {/* Nivel 2: GROWS Control Tower */}
          <div className="relative mb-24">
            <div className="text-center">
              <Link href="/es/sistema-reputacion" className="group block">
                <div className="relative w-40 h-40 bg-[#FFF8E7] rounded-full flex items-center justify-center mx-auto mb-8 shadow-sm border border-[#C6A34F]/20 hover:shadow-md transition-all duration-300 cursor-pointer group">
                  <Image 
                    src="/images/growsapp.png" 
                    alt="GROWS Control Tower" 
                    width={128}
                    height={128}
                    className="w-32 h-32 rounded-full object-cover"
                  />
                  <div className="absolute inset-0 rounded-full border-2 border-dashed border-[#1E40AF] opacity-40 group-hover:opacity-70 transition-all duration-300"></div>
                  
                  {/* Integraciones orbitando - Estilo Enterprise */}
                {/* Supabase - Arriba */}
                <div className="absolute -top-8 left-1/2 transform -translate-x-1/2">
                  <div className="relative w-14 h-14 bg-[#F0F9F4] rounded-full flex items-center justify-center shadow-sm border border-[#1D4E48]/20 hover:border-[#1D4E48] transition-all duration-300 cursor-pointer">
                    <span className="text-[#1D4E48] font-medium text-sm font-['Inter']">DB</span>
                    <div className="absolute inset-0 rounded-full border-2 border-dashed border-[#1E40AF] opacity-30 hover:opacity-50 transition-all duration-300"></div>
                  </div>
                </div>
                
                {/* n8n - Derecha */}
                <div className="absolute top-1/2 -right-8 transform -translate-y-1/2">
                  <div className="relative w-14 h-14 bg-[#F0F9F4] rounded-full flex items-center justify-center shadow-sm border border-[#1D4E48]/20 hover:border-[#1D4E48] transition-all duration-300 cursor-pointer">
                    <span className="text-[#1D4E48] font-medium text-sm font-['Inter']">n8n</span>
                    <div className="absolute inset-0 rounded-full border-2 border-dashed border-[#1E40AF] opacity-30 hover:opacity-50 transition-all duration-300"></div>
                  </div>
                </div>
                
                {/* Pagos - Abajo */}
                <div className="absolute -bottom-8 left-1/2 transform -translate-x-1/2">
                  <div className="relative w-14 h-14 bg-[#F0F9F4] rounded-full flex items-center justify-center shadow-sm border border-[#1D4E48]/20 hover:border-[#1D4E48] transition-all duration-300 cursor-pointer">
                    <svg className="w-6 h-6 text-[#1D4E48]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                    </svg>
                    <div className="absolute inset-0 rounded-full border-2 border-dashed border-[#1E40AF] opacity-30 hover:opacity-50 transition-all duration-300"></div>
                  </div>
                </div>
                
                {/* Analítica - Izquierda */}
                <div className="absolute top-1/2 -left-8 transform -translate-y-1/2">
                  <div className="relative w-14 h-14 bg-[#F0F9F4] rounded-full flex items-center justify-center shadow-sm border border-[#1D4E48]/20 hover:border-[#1D4E48] transition-all duration-300 cursor-pointer">
                    <svg className="w-6 h-6 text-[#1D4E48]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                    <div className="absolute inset-0 rounded-full border-2 border-dashed border-[#1E40AF] opacity-30 hover:opacity-50 transition-all duration-300"></div>
                  </div>
                </div>
              </div>
              <h3 className="text-2xl font-medium text-[#1E293B] mb-3 font-['Inter']">GROWS</h3>
              <p className="text-base text-[#6B7280] font-['Inter'] font-normal">Orquestador central de flujos y datos</p>
            </Link>
            </div>
          </div>

          {/* Separador */}
          <div className="flex justify-center mb-24">
            <div className="flex items-center space-x-4">
              <div className="w-8 h-px bg-[#C6A34F]"></div>
              <div className="w-2 h-2 bg-[#C6A34F] rounded-full"></div>
              <div className="w-8 h-px bg-[#C6A34F]"></div>
            </div>
          </div>

          {/* Nivel 3: Módulos */}
          <div className="flex justify-center space-x-20 mb-24">
            
            {/* Plan de Trabajo */}
            <div className="text-center group">
              <div className="relative w-28 h-28 bg-[#F8FAFC] rounded-full flex items-center justify-center mx-auto mb-6 shadow-sm border border-gray-200 hover:shadow-md transition-all duration-300 hover:border-[#6B7280] cursor-pointer">
                <svg className="w-8 h-8 text-[#6B7280]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <div className="absolute inset-0 rounded-full border-2 border-dashed border-[#1E40AF] opacity-30 group-hover:opacity-50 transition-all duration-300"></div>
              </div>
              <h4 className="text-lg font-medium text-[#1E293B] mb-2 font-['Inter']">Plan de Trabajo</h4>
              <p className="text-sm text-[#6B7280] font-['Inter'] font-normal">Organización de tareas</p>
            </div>

            {/* Cost Manager */}
            <div className="text-center group">
              <div className="relative w-28 h-28 bg-[#F8FAFC] rounded-full flex items-center justify-center mx-auto mb-6 shadow-sm border border-gray-200 hover:shadow-md transition-all duration-300 hover:border-[#6B7280] cursor-pointer">
                <svg className="w-8 h-8 text-[#6B7280]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                </svg>
                <div className="absolute inset-0 rounded-full border-2 border-dashed border-[#1E40AF] opacity-30 group-hover:opacity-50 transition-all duration-300"></div>
              </div>
              <h4 className="text-lg font-medium text-[#1E293B] mb-2 font-['Inter']">Cost Manager</h4>
              <p className="text-sm text-[#6B7280] font-['Inter'] font-normal">Presupuestos y costos</p>
            </div>

            {/* Quality Gate */}
            <div className="text-center group">
              <div className="relative w-28 h-28 bg-[#F8FAFC] rounded-full flex items-center justify-center mx-auto mb-6 shadow-sm border border-gray-200 hover:shadow-md transition-all duration-300 hover:border-[#6B7280] cursor-pointer">
                <svg className="w-8 h-8 text-[#6B7280]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div className="absolute inset-0 rounded-full border-2 border-dashed border-[#1E40AF] opacity-30 group-hover:opacity-50 transition-all duration-300"></div>
              </div>
              <h4 className="text-lg font-medium text-[#1E293B] mb-2 font-['Inter']">Quality Gate</h4>
              <p className="text-sm text-[#6B7280] font-['Inter'] font-normal">Control de calidad</p>
            </div>
          </div>

          {/* Separador */}
          <div className="flex justify-center mb-24">
            <div className="flex items-center space-x-4">
              <div className="w-8 h-px bg-[#8B5CF6]"></div>
              <div className="w-2 h-2 bg-[#8B5CF6] rounded-full"></div>
              <div className="w-8 h-px bg-[#8B5CF6]"></div>
            </div>
          </div>

          {/* Nivel 4: Resultados */}
          <div className="flex justify-center space-x-16">
            
            {/* Insights Hub */}
            <div className="text-center group">
              <div className="relative w-24 h-24 bg-[#F8F5FF] rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm border border-[#8B5CF6]/20 hover:shadow-md transition-all duration-300 hover:border-[#8B5CF6] cursor-pointer">
                <svg className="w-6 h-6 text-[#8B5CF6]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
                <div className="absolute inset-0 rounded-full border-2 border-dashed border-[#1E40AF] opacity-30 group-hover:opacity-50 transition-all duration-300"></div>
              </div>
              <h4 className="text-base font-medium text-[#1E293B] mb-1 font-['Inter']">Insights Hub</h4>
              <p className="text-xs text-[#6B7280] font-['Inter'] font-normal">Reportes y análisis</p>
            </div>

            {/* Reputation Ledger */}
            <div className="text-center group">
              <div className="relative w-24 h-24 bg-[#F8F5FF] rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm border border-[#8B5CF6]/20 hover:shadow-md transition-all duration-300 hover:border-[#8B5CF6] cursor-pointer">
                <svg className="w-6 h-6 text-[#8B5CF6]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                </svg>
                <div className="absolute inset-0 rounded-full border-2 border-dashed border-[#1E40AF] opacity-30 group-hover:opacity-50 transition-all duration-300"></div>
              </div>
              <h4 className="text-base font-medium text-[#1E293B] mb-1 font-['Inter']">Reputation Ledger</h4>
              <p className="text-xs text-[#6B7280] font-['Inter'] font-normal">Sistema de reputación</p>
            </div>

            {/* Alert System */}
            <div className="text-center group">
              <div className="relative w-24 h-24 bg-[#F8F5FF] rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm border border-[#8B5CF6]/20 hover:shadow-md transition-all duration-300 hover:border-[#8B5CF6] cursor-pointer">
                <svg className="w-6 h-6 text-[#8B5CF6]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-5 5v-5zM4 19h6v-2H4v2zM15 7h5l-5-5v5zM4 5h6V3H4v2z" />
                </svg>
                <div className="absolute inset-0 rounded-full border-2 border-dashed border-[#1E40AF] opacity-30 group-hover:opacity-50 transition-all duration-300"></div>
              </div>
              <h4 className="text-base font-medium text-[#1E293B] mb-1 font-['Inter']">Alert System</h4>
              <p className="text-xs text-[#6B7280] font-['Inter'] font-normal">Notificaciones</p>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}

