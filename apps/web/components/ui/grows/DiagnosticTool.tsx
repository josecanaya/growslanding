'use client';

import { useState, useEffect } from 'react';
import { Card, Button, Badge } from '@/components/ui/grows';
import { AlertCircle, CheckCircle, XCircle, RefreshCw } from 'lucide-react';

/**
 * Componente de diagnóstico para identificar errores de "Failed to fetch"
 * en Next.js 15.5.4
 */
export function DiagnosticTool() {
  const [diagnostics, setDiagnostics] = useState<{
    networkStatus: 'checking' | 'online' | 'offline' | 'error';
    apiEndpoints: { [key: string]: 'checking' | 'ok' | 'error' };
    browserInfo: string;
    nextVersion: string;
  }>({
    networkStatus: 'checking',
    apiEndpoints: {},
    browserInfo: '',
    nextVersion: ''
  });

  const [isRunning, setIsRunning] = useState(false);

  // Detectar información del navegador
  useEffect(() => {
    const browserInfo = `${navigator.userAgent.split(' ')[0]} ${navigator.userAgent.split(' ')[1] || ''}`;
    setDiagnostics(prev => ({
      ...prev,
      browserInfo: browserInfo.trim()
    }));
  }, []);

  // Detectar estado de red
  useEffect(() => {
    const checkNetworkStatus = () => {
      if (navigator.onLine) {
        setDiagnostics(prev => ({ ...prev, networkStatus: 'online' }));
      } else {
        setDiagnostics(prev => ({ ...prev, networkStatus: 'offline' }));
      }
    };

    checkNetworkStatus();
    window.addEventListener('online', checkNetworkStatus);
    window.addEventListener('offline', checkNetworkStatus);

    return () => {
      window.removeEventListener('online', checkNetworkStatus);
      window.removeEventListener('offline', checkNetworkStatus);
    };
  }, []);

  // Probar endpoints comunes
  const testEndpoints = async () => {
    setIsRunning(true);
    const endpoints = [
      '/api/health',
      '/api/obras',
      '/api/cuadrillas',
      '/api/tareas',
      '/api/auth/session'
    ];

    const results: { [key: string]: 'checking' | 'ok' | 'error' } = {};

    for (const endpoint of endpoints) {
      results[endpoint] = 'checking';
      setDiagnostics(prev => ({
        ...prev,
        apiEndpoints: { ...prev.apiEndpoints, ...results }
      }));

      try {
        const response = await fetch(endpoint, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        });

        if (response.ok) {
          results[endpoint] = 'ok';
        } else {
          results[endpoint] = 'error';
        }
      } catch (error) {
        console.error(`Error testing ${endpoint}:`, error);
        results[endpoint] = 'error';
      }

      setDiagnostics(prev => ({
        ...prev,
        apiEndpoints: { ...prev.apiEndpoints, ...results }
      }));

      // Pequeño delay entre requests
      await new Promise(resolve => setTimeout(resolve, 500));
    }

    setIsRunning(false);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'checking':
        return <RefreshCw className="h-4 w-4 animate-spin text-grows-secondary" />;
      case 'ok':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'error':
        return <XCircle className="h-4 w-4 text-red-500" />;
      case 'online':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'offline':
        return <XCircle className="h-4 w-4 text-red-500" />;
      default:
        return <AlertCircle className="h-4 w-4 text-gray-400" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ok':
      case 'online':
        return 'success';
      case 'error':
      case 'offline':
        return 'error';
      case 'checking':
        return 'warning';
      default:
        return 'default';
    }
  };

  return (
    <div className="space-y-6">
      <Card title="🔧 Herramienta de Diagnóstico - Failed to Fetch">
        <div className="space-y-4">
          <p className="text-grows-text-secondary">
            Esta herramienta ayuda a identificar la causa del error "Failed to fetch" en Next.js 15.5.4
          </p>

          {/* Información del sistema */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 border border-grows-border rounded-grows-lg">
              <h4 className="font-semibold text-grows-primary mb-2">Información del Sistema</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-grows-text-secondary">Navegador:</span>
                  <span className="text-grows-primary">{diagnostics.browserInfo}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-grows-text-secondary">Next.js:</span>
                  <span className="text-grows-primary">15.5.4</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-grows-text-secondary">Estado de Red:</span>
                  <div className="flex items-center space-x-1">
                    {getStatusIcon(diagnostics.networkStatus)}
                    <span className="text-grows-primary capitalize">{diagnostics.networkStatus}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-4 border border-grows-border rounded-grows-lg">
              <h4 className="font-semibold text-grows-primary mb-2">Acciones</h4>
              <div className="space-y-2">
                <Button
                  onClick={testEndpoints}
                  disabled={isRunning}
                  variant="primary"
                  size="sm"
                  icon={<RefreshCw className="h-4 w-4" />}
                  className="w-full"
                >
                  {isRunning ? 'Probando...' : 'Probar Endpoints'}
                </Button>
                <Button
                  onClick={() => window.location.reload()}
                  variant="secondary"
                  size="sm"
                  className="w-full"
                >
                  Recargar Página
                </Button>
              </div>
            </div>
          </div>

          {/* Resultados de endpoints */}
          {Object.keys(diagnostics.apiEndpoints).length > 0 && (
            <div className="p-4 border border-grows-border rounded-grows-lg">
              <h4 className="font-semibold text-grows-primary mb-3">Estado de Endpoints API</h4>
              <div className="space-y-2">
                {Object.entries(diagnostics.apiEndpoints).map(([endpoint, status]) => (
                  <div key={endpoint} className="flex items-center justify-between">
                    <span className="text-sm text-grows-text-secondary font-mono">{endpoint}</span>
                    <div className="flex items-center space-x-2">
                      {getStatusIcon(status)}
                      <Badge variant={getStatusColor(status)}>
                        {status === 'checking' ? 'Probando...' : status === 'ok' ? 'OK' : 'Error'}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Soluciones comunes */}
          <div className="p-4 border border-grows-border rounded-grows-lg">
            <h4 className="font-semibold text-grows-primary mb-3">Soluciones Comunes</h4>
            <div className="space-y-3 text-sm">
              <div className="flex items-start space-x-2">
                <div className="w-2 h-2 bg-grows-secondary rounded-full mt-2"></div>
                <div>
                  <strong className="text-grows-primary">Problema de CORS:</strong>
                  <p className="text-grows-text-secondary">Verificar configuración de CORS en next.config.js</p>
                </div>
              </div>
              <div className="flex items-start space-x-2">
                <div className="w-2 h-2 bg-grows-secondary rounded-full mt-2"></div>
                <div>
                  <strong className="text-grows-primary">API Routes:</strong>
                  <p className="text-grows-text-secondary">Asegurar que las rutas API estén correctamente configuradas</p>
                </div>
              </div>
              <div className="flex items-start space-x-2">
                <div className="w-2 h-2 bg-grows-secondary rounded-full mt-2"></div>
                <div>
                  <strong className="text-grows-primary">Variables de Entorno:</strong>
                  <p className="text-grows-text-secondary">Verificar que las variables de entorno estén configuradas</p>
                </div>
              </div>
              <div className="flex items-start space-x-2">
                <div className="w-2 h-2 bg-grows-secondary rounded-full mt-2"></div>
                <div>
                  <strong className="text-grows-primary">Cache del Navegador:</strong>
                  <p className="text-grows-text-secondary">Limpiar cache y cookies del navegador</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}
