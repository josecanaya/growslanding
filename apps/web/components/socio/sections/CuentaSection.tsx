'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Award, MapPin, Phone, Mail, Settings, LogOut, Shield, FileText, TrendingUp, Bell } from 'lucide-react';

import { logout } from '@/lib/auth';
import { useCurrentUser } from '@/lib/hooks/useCurrentUser';
import { SocioQrCard } from '@/components/socio/SocioQrCard';

interface CuentaSectionProps {
  user: {
    name: string;
    avatar: string;
    rating: number;
    level: string;
  };
}

export function CuentaSection({ user }: CuentaSectionProps) {
  const router = useRouter();
  const currentUser = useCurrentUser();
  
  // Datos del usuario - se cargarán desde Supabase cuando se implemente
  const [userData, setUserData] = useState({
    ...user,
    email: currentUser?.email || '',
    telefono: '',
    ubicacion: '',
    fechaRegistro: '',
    obrasCompletadas: 0,
    ingresosTotales: '$0',
    proximoNivel: '',
    progresoNivel: 0
  });
  
  // Documentación - se cargará desde Supabase cuando se implemente
  const [documentos, setDocumentos] = useState<Array<{
    nombre: string;
    tipo: 'seguro' | 'certificado' | 'art';
    estado: 'vigente' | 'vencido' | 'por_vencer';
    diasVencimiento?: number;
  }>>([]);

  const handleLogout = () => {
    logout({ router });
  };

  const oficioLabel =
    userData.level && userData.level !== '—' ? userData.level : 'Constructor/a — obra';

  return (
    <div className="space-y-8 bg-[#f7f9fb] pb-8 font-stitch-body text-stitch-on-surface">
      {/* Perfil compacto (ref. stitch_socio / cuenta / qr) */}
      <section className="flex flex-col items-center text-center">
        <div className="relative">
          <div className="flex h-24 w-24 items-center justify-center overflow-hidden rounded-3xl border-4 border-white bg-[#d8e2ff] text-3xl font-bold text-[#163274] shadow-xl">
            {userData.avatar}
          </div>
          <div className="absolute -bottom-1 -right-1 rounded-lg border-2 border-white bg-[#003473] p-1.5 text-white shadow-lg">
            <Award className="h-3 w-3" />
          </div>
        </div>
        <h2 className="mt-4 font-[family-name:var(--font-manrope,Manrope,sans-serif)] text-3xl font-extrabold tracking-tight text-[#163274]">
          {userData.name}
        </h2>
        <p className="mt-1 text-sm font-medium tracking-wide text-[#43617c]">{oficioLabel}</p>
        {userData.fechaRegistro ? (
          <p className="mt-2 text-xs text-[#434653]">
            Miembro desde {new Date(userData.fechaRegistro).toLocaleDateString()}
          </p>
        ) : null}
      </section>

      <SocioQrCard fallbackDisplayName={userData.name} fallbackOficio={oficioLabel} />

      {/* Información de contacto */}
      <div className="rounded-2xl border border-[#c3c6d5]/20 bg-white p-5 shadow-[0_12px_32px_rgba(22,50,116,0.06)]">
        <h3 className="mb-1 font-[family-name:var(--font-manrope,Manrope,sans-serif)] text-lg font-bold text-[#191c1e]">
          Tus datos
        </h3>
        <p className="mb-4 text-xs text-[#434653]">
          Completá teléfono y ubicación cuando configures tu perfil; ayudan a que te encuentren como
          contacto de obra.
        </p>
        <div className="space-y-3">
          <div className="flex items-center text-sm text-gray-600">
            <Mail className="mr-3 h-4 w-4 shrink-0 text-[#737784]" />
            {userData.email ? (
              <span>{userData.email}</span>
            ) : (
              <span className="text-amber-800">Falta email — agregalo para recuperar tu cuenta</span>
            )}
          </div>
          <div className="flex items-center text-sm text-gray-600">
            <Phone className="mr-3 h-4 w-4 shrink-0 text-[#737784]" />
            {userData.telefono ? (
              <span>{userData.telefono}</span>
            ) : (
              <span className="text-gray-400">Teléfono no cargado todavía</span>
            )}
          </div>
          <div className="flex items-center text-sm text-gray-600">
            <MapPin className="mr-3 h-4 w-4 shrink-0 text-[#737784]" />
            {userData.ubicacion ? (
              <span>{userData.ubicacion}</span>
            ) : (
              <span className="text-gray-400">Ubicación no indicada</span>
            )}
          </div>
        </div>
        <div className="mt-5 border-t border-[#eceef0] pt-4">
          <p className="text-xs font-bold uppercase tracking-widest text-[#163274]">
            Especialidades
          </p>
          <p className="mt-2 text-sm text-[#434653]">
            Cuando el perfil avance, vas a poder listar oficios y certificaciones acá.
          </p>
        </div>
      </div>

      {/* Estadísticas */}
      <div className="grid grid-cols-2 gap-4">
        <div className="rounded-lg p-4" style={{ backgroundColor: '#1A202C' }}>
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm" style={{ color: '#A0AEC0' }}>Obras completadas</div>
              <div className="text-2xl font-bold" style={{ color: '#FEEB70' }}>{userData.obrasCompletadas}</div>
            </div>
            <TrendingUp className="h-8 w-8" style={{ color: '#FEEB70' }} />
          </div>
        </div>
        <div className="rounded-lg p-4" style={{ backgroundColor: '#008080' }}>
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm" style={{ color: '#FFFFFF' }}>Ingresos totales</div>
              <div className="text-2xl font-bold" style={{ color: '#FFFFFF' }}>{userData.ingresosTotales}</div>
            </div>
            <Award className="h-8 w-8" style={{ color: '#FFFFFF' }} />
          </div>
        </div>
      </div>

      {/* Documentación y seguridad */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
        <h3 className="font-semibold text-gray-900 mb-3">Documentación y seguridad</h3>
        {documentos.length === 0 ? (
          <div className="text-center py-6 text-gray-500">
            <Shield className="h-12 w-12 mx-auto mb-4 text-gray-400" />
            <p className="text-sm">No hay documentos disponibles</p>
            <p className="text-xs text-gray-400 mt-2">Los documentos se cargarán cuando estén disponibles</p>
          </div>
        ) : (
          <div className="space-y-3">
            {documentos.map((doc, index) => (
              <div key={index} className="flex items-center justify-between">
                <div className="flex items-center">
                  {doc.tipo === 'seguro' ? (
                    <Shield className="h-5 w-5 text-green-600 mr-3" />
                  ) : doc.tipo === 'certificado' ? (
                    <FileText className="h-5 w-5 text-green-600 mr-3" />
                  ) : (
                    <Award className="h-5 w-5 text-yellow-600 mr-3" />
                  )}
                  <span className="text-sm text-gray-700">{doc.nombre}</span>
                </div>
                <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                  doc.estado === 'vigente'
                    ? 'bg-green-100 text-green-800'
                    : doc.estado === 'por_vencer'
                    ? 'bg-yellow-100 text-yellow-800'
                    : 'bg-red-100 text-red-800'
                }`}>
                  {doc.estado === 'vigente' 
                    ? 'Vigente' 
                    : doc.estado === 'por_vencer' && doc.diasVencimiento
                    ? `Vence en ${doc.diasVencimiento} días`
                    : 'Vencido'}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Configuración */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
        <h3 className="font-semibold text-gray-900 mb-3">Configuración</h3>
        <div className="space-y-3">
          <button className="w-full flex items-center justify-between p-3 text-left hover:bg-gray-50 rounded-lg transition-colors">
            <div className="flex items-center">
              <Settings className="h-5 w-5 text-gray-400 mr-3" />
              <span className="text-sm text-gray-700">Configuración de cuenta</span>
            </div>
            <span className="text-gray-400">›</span>
          </button>
          <button className="w-full flex items-center justify-between p-3 text-left hover:bg-gray-50 rounded-lg transition-colors">
            <div className="flex items-center">
              <Bell className="h-5 w-5 text-gray-400 mr-3" />
              <span className="text-sm text-gray-700">Notificaciones</span>
            </div>
            <span className="text-gray-400">›</span>
          </button>
          <button className="w-full flex items-center justify-between p-3 text-left hover:bg-gray-50 rounded-lg transition-colors">
            <div className="flex items-center">
              <Shield className="h-5 w-5 text-gray-400 mr-3" />
              <span className="text-sm text-gray-700">Privacidad</span>
            </div>
            <span className="text-gray-400">›</span>
          </button>
        </div>
      </div>

      {/* Cerrar sesión */}
      <button
        onClick={handleLogout}
        className="w-full flex items-center justify-center space-x-2 bg-red-600 hover:bg-red-700 text-white py-3 px-4 rounded-lg font-medium transition-colors"
      >
        <LogOut className="h-5 w-5" />
        <span>Cerrar sesión</span>
      </button>
    </div>
  );
}
