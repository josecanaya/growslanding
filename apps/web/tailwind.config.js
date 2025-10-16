/** @type {import('tailwindcss').Config} */

module.exports = {
  darkMode: ["class"],
  content: [
    "./app/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
    "./lib/**/*.{js,ts,jsx,tsx}"
  ],
  theme: {
    extend: {
      colors: {
        // Sistema de colores GROWS - Azul petróleo + Dorado elegante
        grows: {
          primary: '#0C1D36',      // Azul petróleo (base principal)
          secondary: '#E8C547',    // Dorado (acento principal)
          background: '#F5F6F7',   // Fondo gris claro
          surface: '#FFFFFF',      // Superficie principal
          border: '#E0E0E0',       // Líneas y separadores
          'text-primary': '#0C1D36',  // Texto principal (azul petróleo)
          'text-secondary': '#444444',// Texto secundario
          error: '#A32A2A',        // Rojo apagado y elegante
          success: '#0C1D36',      // Éxito (azul petróleo)
          warning: '#E8C547',      // Advertencia (dorado)
          neutral: '#F5F6F7',      // Neutral base
        },
        // Sistema de colores profesional - 5 colores máximo (legacy - mantener para compatibilidad)
        petrol: {
          50: '#f0f9ff',
          100: '#e0f2fe',
          200: '#bae6fd',
          300: '#7dd3fc',
          400: '#38bdf8',
          500: '#0ea5e9',
          600: '#0284c7',
          700: '#0369a1',
          800: '#075985',  // Azul petróleo principal
          900: '#0c4a6e',
        },
        violet: {
          50: '#faf5ff',
          100: '#f3e8ff',
          200: '#e9d5ff',
          300: '#d8b4fe',
          400: '#c084fc',
          500: '#a855f7',
          600: '#9333ea',
          700: '#7c3aed',
          800: '#6b21a8',  // Violeta principal
          900: '#581c87',
        },
        // Paleta de colores especificada (legacy - mantener para compatibilidad temporal)
        primario: '#1B263B',
        secundario: '#f5f7fa',
        acento: '#9CCC65', // Cambiado de #f4e27e a verde GROWS
        'claro-fondo': '#eaf0f6',
        oscuro: '#10161a',
        'corporativo': '#dce3ea',
        // Variables para compatibilidad con shadcn/ui
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))"
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))"
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))"
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))"
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))"
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))"
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))"
        }
      },
      fontFamily: {
        grows: ['Inter', 'Rubik', 'sans-serif'],
      },
      boxShadow: {
        grows: {
          sm: '0 1px 2px rgba(0, 0, 0, 0.05)',
          md: '0 4px 6px rgba(0, 0, 0, 0.1)',
          lg: '0 10px 15px rgba(0, 0, 0, 0.15)',
          xl: '0 20px 25px rgba(0, 0, 0, 0.2)',
        }
      },
      borderRadius: {
        grows: {
          sm: '0.25rem',
          md: '0.5rem',
          lg: '1rem',
          xl: '1.5rem',
          full: '9999px',
        },
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)"
      },
      spacing: {
        grows: {
          xs: '0.25rem',
          sm: '0.5rem',
          md: '1rem',
          lg: '1.5rem',
          xl: '2rem',
        }
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" }
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" }
        },
        "fade-in": {
          "0%": { opacity: "0", transform: "translateY(12px)" },
          "100%": { opacity: "1", transform: "translateY(0)" }
        },
        "slide-in": {
          "0%": { transform: "translateX(-100%)" },
          "100%": { transform: "translateX(0)" }
        }
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "fade-in": "fade-in 0.6s ease-out forwards",
        "slide-in": "slide-in 0.3s ease-out"
      }
    }
  },
  plugins: [require("tailwindcss-animate")]
};
