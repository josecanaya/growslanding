'use client';

import {useTranslations} from 'next-intl';
import {useState} from 'react';
import {Mail, ArrowRight, CheckCircle, AlertCircle} from 'lucide-react';
import {cn} from '@/lib/utils';

export function CTASection() {
  const t = useTranslations('cta');
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('loading');

    try {
      const response = await fetch('/api/leads', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      if (!response.ok) {
        throw new Error('Failed to submit email');
      }

      setStatus('success');
      setEmail('');
    } catch (error) {
      console.error('Error submitting email:', error);
      setStatus('error');
    }
  };

  return (
    <section id="contact" className="py-20 bg-gradient-to-br from-primary-600 to-primary-800">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <div className="mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
            {t('title')}
          </h2>
          <p className="text-xl text-primary-100 mb-8">
            {t('subtitle')}
          </p>
        </div>

        <div className="bg-white rounded-2xl p-8 md:p-12 shadow-2xl">
          {status === 'success' ? (
            <div className="text-center">
              <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-6" />
              <h3 className="text-2xl font-bold text-gray-900 mb-4">
                ¡Gracias por tu interés!
              </h3>
              <p className="text-lg text-gray-600 mb-6">
                {t('success')}
              </p>
              <button
                onClick={() => setStatus('idle')}
                className="text-primary-600 hover:text-primary-700 font-semibold"
              >
                Enviar otro email
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="max-w-md mx-auto">
              <div className="mb-6">
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder={t('emailPlaceholder')}
                    required
                    className="w-full pl-12 pr-4 py-4 border border-gray-300 rounded-lg text-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                </div>
                {status === 'error' && (
                  <div className="flex items-center gap-2 mt-2 text-red-600">
                    <AlertCircle className="h-4 w-4" />
                    <span className="text-sm">{t('error')}</span>
                  </div>
                )}
              </div>

              <button
                type="submit"
                disabled={status === 'loading'}
                className={cn(
                  'w-full bg-primary-600 text-white px-8 py-4 rounded-lg text-lg font-semibold transition-all duration-200 flex items-center justify-center gap-2',
                  status === 'loading' 
                    ? 'opacity-50 cursor-not-allowed' 
                    : 'hover:bg-primary-700 hover:shadow-lg'
                )}
              >
                {status === 'loading' ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    Enviando...
                  </>
                ) : (
                  <>
                    {t('submitButton')}
                    <ArrowRight className="h-5 w-5" />
                  </>
                )}
              </button>

              <p className="text-sm text-gray-500 mt-4">
                {t('privacy')}
              </p>
            </form>
          )}
        </div>

        {/* Additional benefits */}
        <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-8 text-white">
          <div className="text-center">
            <div className="text-3xl font-bold mb-2">30 días</div>
            <div className="text-primary-100">Prueba gratuita</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold mb-2">Sin setup</div>
            <div className="text-primary-100">Configuración inmediata</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold mb-2">Soporte 24/7</div>
            <div className="text-primary-100">Asistencia técnica</div>
          </div>
        </div>
      </div>
    </section>
  );
}
