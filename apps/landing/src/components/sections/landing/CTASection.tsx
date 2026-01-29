'use client';

import { useTranslations } from 'next-intl';
import { useState } from 'react';
import { Mail, ArrowRight, CheckCircle, AlertCircle } from 'lucide-react';

const APP_URL = 'http://localhost:3001';

export function CTASection() {
  const t = useTranslations('cta');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [email, setEmail] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('loading');
    
    try {
      const response = await fetch('/api/leads', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          source: 'cta_section',
          interest_type: 'free_account',
        }),
      });

      if (!response.ok) {
        throw new Error('Error al enviar');
      }

      setStatus('success');
      setEmail('');
    } catch (e) {
      setStatus('error');
    }
  };

  return (
    <section
      id="contact"
      className="py-20 bg-gradient-to-br from-grows-primary to-grows-primary/80"
    >
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <div className="mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
            ¿Listo para transformar tu construcción?
          </h2>
          <p className="text-xl text-white/90 mb-8">
            Creá tu cuenta gratuita ahora o contactanos para inversiones y soluciones empresariales. Sin compromiso, sin límites de tiempo.
          </p>
        </div>

        <div className="bg-white rounded-grows-lg p-8 md:p-12 shadow-grows-xl">
          {status === 'success' ? (
            <div className="text-center">
              <CheckCircle className="h-16 w-16 text-grows-success mx-auto mb-6" />
              <h3 className="text-2xl font-bold text-grows-text-primary mb-4">
                ¡Gracias por tu interés en GROWS!
              </h3>
              <p className="text-lg text-grows-text-secondary mb-6">
                Nuestro equipo se pondrá en contacto contigo en las próximas 24 horas para coordinar tu acceso o responder tus consultas.
              </p>
              <button
                onClick={() => setStatus('idle')}
                className="text-grows-primary hover:text-grows-primary/80 font-semibold"
              >
                Enviar otro email
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="max-w-md mx-auto">
              <div className="mb-6">
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-grows-text-secondary/50" />
                  <input
                    type="email"
                    placeholder="tu@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="w-full pl-12 pr-4 py-4 border border-grows-border rounded-grows-md text-lg focus:ring-2 focus:ring-grows-primary focus:border-transparent"
                  />
                </div>
                {status === 'error' && (
                  <div className="flex items-center gap-2 mt-2 text-grows-error">
                    <AlertCircle className="h-4 w-4" />
                    <span className="text-sm">Hubo un error. Por favor, intenta nuevamente.</span>
                  </div>
                )}
              </div>

              <button
                type="submit"
                disabled={status === 'loading'}
                className={`w-full bg-grows-primary text-white px-8 py-4 rounded-grows-md text-lg font-semibold transition-all duration-200 flex items-center justify-center gap-2 ${
                  status === 'loading'
                    ? 'opacity-50 cursor-not-allowed'
                    : 'hover:bg-grows-primary/90 hover:shadow-grows-lg'
                }`}
              >
                {status === 'loading' ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    Enviando...
                  </>
                ) : (
                  <>
                    Solicitar información
                    <ArrowRight className="h-5 w-5" />
                  </>
                )}
              </button>

              <p className="text-sm text-grows-text-secondary/50 mt-4">
                Respetamos tu privacidad. Sin spam, solo información valiosa.
              </p>
            </form>
          )}
        </div>

        {/* Additional benefits */}
        <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-8 text-white">
          <div className="text-center">
            <div className="text-3xl font-bold mb-2">Sin límite</div>
            <div className="text-white/90">en Free</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold mb-2">5 minutos</div>
            <div className="text-white/90">de setup</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold mb-2">Soporte</div>
            <div className="text-white/90">por email</div>
          </div>
        </div>
      </div>
    </section>
  );
}