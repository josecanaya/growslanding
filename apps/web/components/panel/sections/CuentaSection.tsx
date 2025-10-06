'use client';

import { useState } from 'react';
import { User, Star, Award, Calendar, MapPin, Phone, Mail, Settings, LogOut, Shield, FileText, TrendingUp, Bell } from 'lucide-react';

interface CuentaSectionProps {
  user: {
    name: string;
    avatar: string;
    rating: number;
    level: string;
  };
}

export function CuentaSection({ user }: CuentaSectionProps) {
  const [userData, setUserData] = useState({
    ...user,
    email: 'juan.perez@email.com',
    telefono: '+54 11 1234-5678',
    ubicacion: 'San Isidro, Buenos Aires',
    fechaRegistro: '2021-03-15',
    obrasCompletadas: 12,
    ingresosTotales: '$2,450,000',
    proximoNivel: 'Platino',
    progresoNivel: 75
  });

  const getLevelColor = (level: string) => {
    switch (level.toLowerCase()) {
      case 'bronce': return 'text-amber-600 bg-amber-100';
      case 'plata': return 'text-gray-600 bg-gray-100';
      case 'oro': return 'text-yellow-600 bg-yellow-100';
      case 'platino': return 'text-purple-600 bg-purple-100';
      default: return 'text-yellow-600 bg-yellow-100';
    }
  };

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <span key={i} className={i < Math.floor(rating) ? 'text-yellow-400' : 'text-gray-300'}>
        ★
      </span>
    ));
  };

  const handleLogout = () => {
    localStorage.removeItem('user');
    localStorage.removeItem('isConnected');
    localStorage.removeItem('isOnBreak');
    window.location.href = '/auth/login';
  };

  return (
    <div className="space-y-6">
      {/* Header del perfil */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center space-x-4 mb-4">
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 text-2xl">
            {userData.avatar}
          </div>
          <div className="flex-1">
            <h2 className="text-xl font-bold text-gray-900">{userData.name}</h2>
            <div className="flex items-center space-x-2 mb-2">
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getLevelColor(userData.level)}`}>
                <Award className="h-3 w-3 mr-1" />
                {userData.level}
              </span>
              <div className="flex text-sm">
                {renderStars(userData.rating)}
              </div>
              <span className="text-sm text-gray-500">{userData.rating}</span>
            </div>
            <p className="text-sm text-gray-600">
              Miembro desde {new Date(userData.fechaRegistro).toLocaleDateString()}
            </p>
          </div>
        </div>

        {/* Progreso al siguiente nivel */}
        <div className="bg-gray-50 rounded-lg p-3">
          <div className="flex justify-between text-sm text-gray-600 mb-1">
            <span>Progreso a {userData.proximoNivel}</span>
            <span>{userData.progresoNivel}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${userData.progresoNivel}%` }}
            ></div>
          </div>
        </div>
      </div>

      {/* Información de contacto */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
        <h3 className="font-semibold text-gray-900 mb-3">Información de contacto</h3>
        <div className="space-y-3">
          <div className="flex items-center text-sm text-gray-600">
            <Mail className="h-4 w-4 mr-3 text-gray-400" />
            <span>{userData.email}</span>
          </div>
          <div className="flex items-center text-sm text-gray-600">
            <Phone className="h-4 w-4 mr-3 text-gray-400" />
            <span>{userData.telefono}</span>
          </div>
          <div className="flex items-center text-sm text-gray-600">
            <MapPin className="h-4 w-4 mr-3 text-gray-400" />
            <span>{userData.ubicacion}</span>
          </div>
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
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <Shield className="h-5 w-5 text-green-600 mr-3" />
              <span className="text-sm text-gray-700">Seguro de accidentes</span>
            </div>
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
              Vigente
            </span>
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <FileText className="h-5 w-5 text-green-600 mr-3" />
              <span className="text-sm text-gray-700">Certificado de capacitación</span>
            </div>
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
              Vigente
            </span>
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <Award className="h-5 w-5 text-yellow-600 mr-3" />
              <span className="text-sm text-gray-700">ART</span>
            </div>
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
              Vence en 30 días
            </span>
          </div>
        </div>
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
