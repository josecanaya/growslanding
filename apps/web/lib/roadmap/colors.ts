// 🎨 SISTEMA DE COLORES PROFESIONAL - ROADMAP GROWS
// Máximo 5 colores: Blanco, Gris, Azul Petróleo, Violeta, Amarillo Pálido

export const colors = {
  // Colores base
  white: '#ffffff',
  gray: {
    50: '#f9fafb',   // Fondo muy claro
    100: '#f3f4f6',  // Fondo claro
    200: '#e5e7eb',  // Bordes
    300: '#d1d5db',  // Texto secundario
    400: '#9ca3af',  // Texto deshabilitado
    500: '#6b7280',  // Texto principal
    600: '#4b5563',  // Texto oscuro
    700: '#374151',  // Texto muy oscuro
    800: '#1f2937',  // Fondo oscuro
    900: '#111827',  // Fondo muy oscuro
  },
  
  // Colores principales del sistema
  petrol: {
    50: '#f0f9ff',   // Fondo muy claro
    100: '#e0f2fe',  // Fondo claro
    200: '#bae6fd',  // Bordes
    300: '#7dd3fc',  // Hover
    400: '#38bdf8',  // Accent
    500: '#0ea5e9',  // Primario
    600: '#0284c7',  // Primario oscuro
    700: '#0369a1',  // Primario muy oscuro
    800: '#075985',  // Azul petróleo
    900: '#0c4a6e',  // Azul petróleo oscuro
  },
  
  violet: {
    50: '#faf5ff',   // Fondo muy claro
    100: '#f3e8ff',  // Fondo claro
    200: '#e9d5ff',  // Bordes
    300: '#d8b4fe',  // Hover
    400: '#c084fc',  // Accent
    500: '#a855f7',  // Primario
    600: '#9333ea',  // Primario oscuro
    700: '#7c3aed',  // Primario muy oscuro
    800: '#6b21a8',  // Violeta
    900: '#581c87',  // Violeta oscuro
  },
  
  gold: {
    50: '#fffbeb',   // Fondo muy claro
    100: '#fef3c7',  // Fondo claro
    200: '#fde68a',  // Bordes
    300: '#fcd34d',  // Hover
    400: '#fbbf24',  // Accent
    500: '#f59e0b',  // Primario dorado
    600: '#d97706',  // Primario oscuro
    700: '#b45309',  // Primario muy oscuro
    800: '#92400e',  // Dorado oscuro
    900: '#78350f',  // Dorado muy oscuro
  },
  
  // Estados del sistema
  success: '#10b981',  // Verde para completado
  warning: '#f59e0b',  // Dorado para advertencias
  error: '#ef4444',    // Rojo para errores
  info: '#3b82f6',     // Azul para información
};

// Clases de Tailwind para usar en componentes
export const colorClasses = {
  // Fondos
  background: {
    primary: 'bg-white',
    secondary: 'bg-gray-50',
    tertiary: 'bg-gray-100',
    dark: 'bg-gray-800',
    darkSecondary: 'bg-gray-900',
  },
  
  // Textos
  text: {
    primary: 'text-gray-700',
    secondary: 'text-gray-500',
    tertiary: 'text-gray-400',
    dark: 'text-gray-800',
    darkSecondary: 'text-gray-900',
  },
  
  // Bordes
  border: {
    primary: 'border-gray-200',
    secondary: 'border-gray-300',
    dark: 'border-gray-600',
    darkSecondary: 'border-gray-700',
  },
  
  // Estados de progreso
  progress: {
    pending: 'bg-gray-300',
    inProgress: 'bg-petrol-500',
    almostComplete: 'bg-violet-500',
    complete: 'bg-success',
  },
  
  // Botones
  button: {
    primary: 'bg-petrol-500 hover:bg-petrol-600 text-white',
    secondary: 'bg-gray-100 hover:bg-gray-200 text-gray-700',
    accent: 'bg-violet-500 hover:bg-violet-600 text-white',
    warning: 'bg-gold-400 hover:bg-gold-500 text-gray-800',
  },
  
  // Cards
  card: {
    default: 'bg-white border-gray-200',
    hover: 'hover:bg-gray-50 hover:border-gray-300',
    selected: 'bg-petrol-50 border-petrol-200',
  },
};

// Función para obtener colores de progreso
export function getProgressColor(progress: number): string {
  if (progress === 100) return colors.success;
  if (progress >= 70) return colors.violet[500];
  if (progress >= 30) return colors.petrol[500];
  return colors.gray[300];
}

// Función para obtener clases de progreso
export function getProgressClasses(progress: number): string {
  if (progress === 100) return 'bg-green-500';
  if (progress >= 70) return 'bg-violet-500';
  if (progress >= 30) return 'bg-blue-500';
  return 'bg-gray-300';
}

// Función para obtener colores de estado
export function getStatusColor(status: string | any): string {
  const statusStr = String(status || '').toLowerCase();
  switch (statusStr) {
    case 'complete':
    case 'completed':
    case 'completo':
      return colors.success;
    case 'in-progress':
    case 'en-curso':
    case 'en_curso':
      return colors.petrol[500];
    case 'pending':
    case 'pendiente':
      return colors.gray[400];
    case 'warning':
    case 'advertencia':
      return colors.gold[500];
    default:
      return colors.gray[500];
  }
}
