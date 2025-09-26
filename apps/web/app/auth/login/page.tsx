'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Building2, Eye, EyeOff } from 'lucide-react';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    // Simular login
    setTimeout(() => {
      const user = {
        name: 'Juan Pérez',
        avatar: '👷‍♂️',
        rating: 4.8,
        level: 'Oro'
      };
      
      localStorage.setItem('user', JSON.stringify(user));
      localStorage.setItem('isConnected', JSON.stringify(false));
      localStorage.setItem('isOnBreak', JSON.stringify(false));
      
      router.push('/panel');
      setIsLoading(false);
    }, 1000);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-secundario to-claro flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <div className="bg-white rounded-2xl shadow-xl p-8">
          {/* Logo */}
          <div className="text-center mb-8">
            <div className="flex items-center justify-center space-x-3 mb-4">
              <Building2 className="h-8 w-8 text-primario" />
              <h1 className="text-3xl font-bold text-primario">GROWS</h1>
            </div>
            <p className="text-oscuro/70">Panel de Socio Constructor</p>
          </div>

          {/* Form */}
          <form onSubmit={handleLogin} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-oscuro mb-2">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 border border-claro rounded-lg focus:outline-none focus:ring-2 focus:ring-acento focus:border-transparent"
                placeholder="tu@email.com"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-oscuro mb-2">
                Contraseña
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-3 border border-claro rounded-lg focus:outline-none focus:ring-2 focus:ring-acento focus:border-transparent pr-12"
                  placeholder="Tu contraseña"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-oscuro/50 hover:text-oscuro"
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-acento text-oscuro py-3 px-4 rounded-lg font-semibold hover:bg-acento/90 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Iniciando sesión...' : 'Iniciar Sesión'}
            </button>
          </form>

          {/* Demo credentials */}
          <div className="mt-6 p-4 bg-claro rounded-lg">
            <p className="text-sm text-oscuro/70 mb-2">Credenciales de demo:</p>
            <p className="text-xs text-oscuro/60">Email: demo@grows.com</p>
            <p className="text-xs text-oscuro/60">Contraseña: demo123</p>
          </div>

          {/* Footer */}
          <div className="mt-8 text-center">
            <p className="text-sm text-oscuro/50">
              ¿No tienes cuenta?{' '}
              <a href="#" className="text-primario hover:text-primario/80 font-medium">
                Regístrate aquí
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}