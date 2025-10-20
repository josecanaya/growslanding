/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // Paleta GROWS correcta (azul oscuro + amarillo)
        'grows-primary': '#1B263B',
        'grows-secondary': '#f4e27e',
        'grows-background': '#f5f7fa',
        'grows-surface': '#FFFFFF',
        'grows-border': '#e0e0e0',
        'grows-text-primary': '#10161a',
        'grows-text-secondary': '#444444',
        'grows-error': '#B71C1C',
        'grows-success': '#388E3C',
        'grows-warning': '#FBC02D',
        'grows-neutral': '#eaf0f6',
        
        // Legacy (mantener para compatibilidad)
        primario: '#1B263B',
        secundario: '#f5f7fa',
        acento: '#f4e27e',
        claro: '#eaf0f6',
        oscuro: '#10161a',
      },
      fontFamily: {
        sans: ['Inter', 'Nunito', 'Poppins', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        'grows-sm': '0 1px 2px rgba(0, 0, 0, 0.05)',
        'grows-md': '0 4px 6px rgba(0, 0, 0, 0.1)',
        'grows-lg': '0 10px 15px rgba(0, 0, 0, 0.15)',
        'grows-xl': '0 20px 25px rgba(0, 0, 0, 0.2)',
      },
      borderRadius: {
        'grows-sm': '0.25rem',
        'grows-md': '0.5rem',
        'grows-lg': '1rem',
        'grows-xl': '1.5rem',
      },
    },
  },
  plugins: [],
}
