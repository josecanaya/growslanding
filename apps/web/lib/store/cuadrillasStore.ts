'use client';

import { create } from 'zustand';
import { Cuadrilla, Especialidad, EstadoCuadrilla, FiltrosCuadrillas, Obra, Tarea } from '../types/cuadrillas';

interface CuadrillasState {
  cuadrillas: Cuadrilla[];
  obras: Obra[];
  tareas: Tarea[];
  filtros: FiltrosCuadrillas;
  cuadrillaSeleccionada: Cuadrilla | null;
  showDrawer: boolean;
  showModalAsignacion: boolean;
  
  // Acciones
  setFiltros: (filtros: Partial<FiltrosCuadrillas>) => void;
  moverCuadrilla: (cuadrillaId: string, nuevaEspecialidad: Especialidad) => void;
  seleccionarCuadrilla: (cuadrilla: Cuadrilla | null) => void;
  abrirDrawer: () => void;
  cerrarDrawer: () => void;
  abrirModalAsignacion: () => void;
  cerrarModalAsignacion: () => void;
  asignarTarea: (cuadrillaId: string, tareaId: string) => void;
  actualizarCuadrilla: (cuadrillaId: string, updates: Partial<Cuadrilla>) => void;
}

// Datos mock iniciales
const cuadrillasMock: Cuadrilla[] = [
  {
    id: '1',
    nombre: 'Cuadrilla Albañilería Norte',
    encargado: 'Carlos Mendoza',
    telefonoEncargado: '+54 11 1234-5678',
    whatsappEncargado: '+54 11 1234-5678',
    emailEncargado: 'carlos.mendoza@email.com',
    fotoEncargado: '/images/avatar-carlos.jpg',
    especialidad: 'Albañilería / Estructura',
    estado: 'Disponible',
    antiguedad: '3 años y 8 obras',
    valoracionPromedio: 4.5,
    obrasParticipadas: 8,
    cumplimientoTiempo: 92,
    seguridadAlDia: true,
    integrantes: [
      { 
        id: '1', 
        nombre: 'Carlos Mendoza', 
        rol: 'Encargado', 
        seguroVigente: true,
        telefono: '+54 11 1234-5678',
        whatsapp: '+54 11 1234-5678',
        email: 'carlos.mendoza@email.com',
        dni: '12345678',
        fechaIngreso: '2021-03-15'
      },
      { 
        id: '2', 
        nombre: 'Roberto Silva', 
        rol: 'Oficial', 
        seguroVigente: true,
        telefono: '+54 11 2345-6789',
        whatsapp: '+54 11 2345-6789',
        dni: '23456789',
        fechaIngreso: '2021-06-20'
      },
      { 
        id: '3', 
        nombre: 'Miguel Torres', 
        rol: 'Ayudante', 
        seguroVigente: true,
        telefono: '+54 11 3456-7890',
        whatsapp: '+54 11 3456-7890',
        dni: '34567890',
        fechaIngreso: '2022-01-10'
      }
    ],
    documentos: [
      { id: '1', tipo: 'ART', nombre: 'ART Albañilería Norte', vigente: true },
      { id: '2', tipo: 'Seguro', nombre: 'Seguro de Accidentes', vigente: true },
      { id: '3', tipo: 'Certificado', nombre: 'Certificado de Capacitación', vigente: true }
    ],
    kpi: {
      tareasAsignadas: 8,
      tareasEnEjecucion: 3,
      tareasTerminadas: 5,
      cumplimientoPct: 62
    },
    feedback: [
      {
        id: '1',
        fecha: '2024-01-15',
        obraNombre: 'Casa Familiar Los Robles',
        puntuacion: 5,
        comentario: 'Excelente trabajo, muy puntual y calidad impecable.',
        autor: 'Arq. María González'
      },
      {
        id: '2',
        fecha: '2023-11-20',
        obraNombre: 'Edificio Residencial Norte',
        puntuacion: 4,
        comentario: 'Buen desempeño, algunos retrasos menores.',
        autor: 'Arq. Juan Pérez'
      }
    ],
    badges: [
      {
        id: '1',
        tipo: 'cumplimiento',
        titulo: '🏆 Cumplió 10 obras a tiempo',
        descripcion: 'Más de 10 obras completadas en tiempo',
        icono: '🏆',
        fechaObtenido: '2024-01-10'
      },
      {
        id: '2',
        tipo: 'antiguedad',
        titulo: '⭐ Socio de confianza',
        descripcion: 'Más de 2 años trabajando juntos',
        icono: '⭐',
        fechaObtenido: '2023-03-15'
      }
    ],
    asignaciones: [
      {
        obraNombre: 'Casa Familiar Los Robles',
        tareaNombre: 'Muros exteriores 30cm',
        etapa: 'estructura',
        estado: 'EN_EJECUCION',
        fechaInicio: '2024-01-20',
        fechaFinEstimada: '2024-02-15'
      },
      {
        obraNombre: 'Edificio Residencial Norte',
        tareaNombre: 'Excavación de fundación',
        etapa: 'estructura',
        estado: 'TERMINADA',
        fechaInicio: '2023-12-01',
        fechaFinEstimada: '2023-12-20'
      }
    ]
  },
  {
    id: '2',
    nombre: 'Cuadrilla Yesería Sur',
    encargado: 'Ana García',
    telefonoEncargado: '+54 11 4567-8901',
    whatsappEncargado: '+54 11 4567-8901',
    emailEncargado: 'ana.garcia@email.com',
    fotoEncargado: '/images/avatar-ana.jpg',
    especialidad: 'Yesería / Terminaciones',
    estado: 'En obra',
    antiguedad: '2 años y 6 obras',
    valoracionPromedio: 4.2,
    obrasParticipadas: 6,
    cumplimientoTiempo: 88,
    seguridadAlDia: true,
    integrantes: [
      { 
        id: '1', 
        nombre: 'Ana García', 
        rol: 'Encargada', 
        seguroVigente: true,
        telefono: '+54 11 4567-8901',
        whatsapp: '+54 11 4567-8901',
        email: 'ana.garcia@email.com',
        dni: '45678901',
        fechaIngreso: '2022-02-10'
      },
      { 
        id: '2', 
        nombre: 'Luis Fernández', 
        rol: 'Yesero', 
        seguroVigente: true,
        telefono: '+54 11 5678-9012',
        whatsapp: '+54 11 5678-9012',
        dni: '56789012',
        fechaIngreso: '2022-05-15'
      }
    ],
    documentos: [
      { id: '1', tipo: 'ART', nombre: 'ART Yesería Sur', vigente: true },
      { id: '2', tipo: 'Certificado', nombre: 'Certificado de Salud', vigente: true }
    ],
    kpi: {
      tareasAsignadas: 5,
      tareasEnEjecucion: 2,
      tareasTerminadas: 3,
      cumplimientoPct: 60
    },
    feedback: [
      {
        id: '1',
        fecha: '2024-01-10',
        obraNombre: 'Casa Unifamiliar Sur',
        puntuacion: 4,
        comentario: 'Trabajo muy limpio y detallado.',
        autor: 'Arq. Roberto López'
      }
    ],
    badges: [
      {
        id: '1',
        tipo: 'velocidad',
        titulo: '⏱️ Récord de rapidez',
        descripcion: 'Completó obra en tiempo récord',
        icono: '⏱️',
        fechaObtenido: '2023-12-15'
      }
    ],
    asignaciones: [
      {
        obraNombre: 'Casa Familiar Los Robles',
        tareaNombre: 'Revoque grueso exterior',
        etapa: 'terminaciones',
        estado: 'EN_EJECUCION',
        fechaInicio: '2024-01-25',
        fechaFinEstimada: '2024-02-10'
      }
    ]
  },
  {
    id: '3',
    nombre: 'Cuadrilla Carpintería Centro',
    encargado: 'Diego López',
    telefonoEncargado: '+54 11 6789-0123',
    whatsappEncargado: '+54 11 6789-0123',
    emailEncargado: 'diego.lopez@email.com',
    fotoEncargado: '/images/avatar-diego.jpg',
    especialidad: 'Carpintería',
    estado: 'Ocupada',
    antiguedad: '4 años y 12 obras',
    valoracionPromedio: 4.8,
    obrasParticipadas: 12,
    cumplimientoTiempo: 95,
    seguridadAlDia: false,
    integrantes: [
      { 
        id: '1', 
        nombre: 'Diego López', 
        rol: 'Encargado', 
        seguroVigente: true,
        telefono: '+54 11 6789-0123',
        whatsapp: '+54 11 6789-0123',
        email: 'diego.lopez@email.com',
        dni: '67890123',
        fechaIngreso: '2020-08-15'
      },
      { 
        id: '2', 
        nombre: 'Pedro Martínez', 
        rol: 'Carpintero', 
        seguroVigente: true,
        telefono: '+54 11 7890-1234',
        whatsapp: '+54 11 7890-1234',
        dni: '78901234',
        fechaIngreso: '2021-03-20'
      },
      { 
        id: '3', 
        nombre: 'Sergio Ruiz', 
        rol: 'Ayudante', 
        seguroVigente: false,
        telefono: '+54 11 8901-2345',
        whatsapp: '+54 11 8901-2345',
        dni: '89012345',
        fechaIngreso: '2022-09-10'
      }
    ],
    documentos: [
      { id: '1', tipo: 'ART', nombre: 'ART Carpintería Centro', vigente: false },
      { id: '2', tipo: 'Seguro', nombre: 'Seguro de Responsabilidad Civil', vigente: true }
    ],
    kpi: {
      tareasAsignadas: 3,
      tareasEnEjecucion: 0,
      tareasTerminadas: 1,
      cumplimientoPct: 33
    },
    feedback: [
      {
        id: '1',
        fecha: '2024-01-05',
        obraNombre: 'Ampliación Comercial Centro',
        puntuacion: 5,
        comentario: 'Excelente carpintería, muy profesional.',
        autor: 'Arq. Laura Martín'
      }
    ],
    badges: [
      {
        id: '1',
        tipo: 'calidad',
        titulo: '🎯 Maestro carpintero',
        descripcion: 'Reconocido por su calidad excepcional',
        icono: '🎯',
        fechaObtenido: '2023-10-20'
      }
    ]
  },
  {
    id: '4',
    nombre: 'Cuadrilla Electricidad Este',
    encargado: 'María González',
    telefonoEncargado: '+54 11 9012-3456',
    whatsappEncargado: '+54 11 9012-3456',
    emailEncargado: 'maria.gonzalez@email.com',
    fotoEncargado: '/images/avatar-maria.jpg',
    especialidad: 'Electricidad',
    estado: 'Disponible',
    antiguedad: '2 años y 5 obras',
    valoracionPromedio: 4.3,
    obrasParticipadas: 5,
    cumplimientoTiempo: 90,
    seguridadAlDia: true,
    integrantes: [
      { 
        id: '1', 
        nombre: 'María González', 
        rol: 'Encargada', 
        seguroVigente: true,
        telefono: '+54 11 9012-3456',
        whatsapp: '+54 11 9012-3456',
        email: 'maria.gonzalez@email.com',
        dni: '90123456',
        fechaIngreso: '2022-04-12'
      },
      { 
        id: '2', 
        nombre: 'Jorge Herrera', 
        rol: 'Electricista', 
        seguroVigente: true,
        telefono: '+54 11 0123-4567',
        whatsapp: '+54 11 0123-4567',
        dni: '01234567',
        fechaIngreso: '2022-07-08'
      }
    ],
    documentos: [
      { id: '1', tipo: 'ART', nombre: 'ART Electricidad Este', vigente: true },
      { id: '2', tipo: 'Certificado', nombre: 'Certificado Técnico', vigente: true }
    ],
    kpi: {
      tareasAsignadas: 6,
      tareasEnEjecucion: 2,
      tareasTerminadas: 4,
      cumplimientoPct: 67
    },
    feedback: [
      {
        id: '1',
        fecha: '2024-01-12',
        obraNombre: 'Edificio Residencial Norte',
        puntuacion: 4,
        comentario: 'Instalación eléctrica muy bien ejecutada.',
        autor: 'Arq. Carlos Ruiz'
      }
    ],
    badges: [
      {
        id: '1',
        tipo: 'antiguedad',
        titulo: '🔌 Especialista eléctrico',
        descripcion: 'Experto en instalaciones complejas',
        icono: '🔌',
        fechaObtenido: '2023-08-15'
      }
    ],
    asignaciones: [
      {
        obraNombre: 'Edificio Residencial Norte',
        tareaNombre: 'Instalación eléctrica baños',
        etapa: 'obra_gris',
        estado: 'EN_EJECUCION',
        fechaInicio: '2024-01-18',
        fechaFinEstimada: '2024-02-05'
      }
    ]
  },
  {
    id: '5',
    nombre: 'Cuadrilla Plomería Oeste',
    encargado: 'Ricardo Morales',
    telefonoEncargado: '+54 11 1234-9876',
    whatsappEncargado: '+54 11 1234-9876',
    emailEncargado: 'ricardo.morales@email.com',
    fotoEncargado: '/images/avatar-ricardo.jpg',
    especialidad: 'Plomería / Gas',
    estado: 'Inactiva',
    antiguedad: '1 año y 3 obras',
    valoracionPromedio: 3.8,
    obrasParticipadas: 3,
    cumplimientoTiempo: 75,
    seguridadAlDia: false,
    integrantes: [
      { 
        id: '1', 
        nombre: 'Ricardo Morales', 
        rol: 'Encargado', 
        seguroVigente: true,
        telefono: '+54 11 1234-9876',
        whatsapp: '+54 11 1234-9876',
        email: 'ricardo.morales@email.com',
        dni: '12349876',
        fechaIngreso: '2023-01-20'
      },
      { 
        id: '2', 
        nombre: 'Fernando Castro', 
        rol: 'Plomero', 
        seguroVigente: false,
        telefono: '+54 11 2345-8765',
        whatsapp: '+54 11 2345-8765',
        dni: '23458765',
        fechaIngreso: '2023-03-15'
      }
    ],
    documentos: [
      { id: '1', tipo: 'ART', nombre: 'ART Plomería Oeste', vigente: false },
      { id: '2', tipo: 'Certificado', nombre: 'Certificado de Competencias', vigente: true }
    ],
    kpi: {
      tareasAsignadas: 2,
      tareasEnEjecucion: 0,
      tareasTerminadas: 1,
      cumplimientoPct: 50
    },
    feedback: [
      {
        id: '1',
        fecha: '2023-12-10',
        obraNombre: 'Casa Unifamiliar Sur',
        puntuacion: 3,
        comentario: 'Trabajo aceptable, pero con algunos retrasos.',
        autor: 'Arq. Patricia Silva'
      }
    ],
    badges: []
  }
];

const obrasMock: Obra[] = [
  { id: '1', nombre: 'Casa Familiar Los Robles', estado: 'ACTIVA' },
  { id: '2', nombre: 'Edificio Residencial Norte', estado: 'ACTIVA' },
  { id: '3', nombre: 'Ampliación Comercial Centro', estado: 'ACTIVA' },
  { id: '4', nombre: 'Casa Unifamiliar Sur', estado: 'ACTIVA' }
];

const tareasMock: Tarea[] = [
  { id: '1', nombre: 'Excavación de fundación', obraId: '1', etapa: 'estructura', estado: 'PENDIENTE' },
  { id: '2', nombre: 'Hormigón de fundación', obraId: '1', etapa: 'estructura', estado: 'PENDIENTE' },
  { id: '3', nombre: 'Muros exteriores 30cm', obraId: '1', etapa: 'estructura', estado: 'EN_EJECUCION', cuadrillaId: '1' },
  { id: '4', nombre: 'Instalación eléctrica baños', obraId: '2', etapa: 'obra_gris', estado: 'EN_EJECUCION', cuadrillaId: '4' },
  { id: '5', nombre: 'Revoque grueso exterior', obraId: '1', etapa: 'terminaciones', estado: 'EN_EJECUCION', cuadrillaId: '2' },
  { id: '6', nombre: 'Instalación de puertas', obraId: '2', etapa: 'terminaciones', estado: 'PENDIENTE' },
  { id: '7', nombre: 'Pintura exterior', obraId: '3', etapa: 'terminaciones', estado: 'PENDIENTE' },
  { id: '8', nombre: 'Instalación sanitaria', obraId: '4', etapa: 'obra_gris', estado: 'PENDIENTE' }
];

export const useCuadrillasStore = create<CuadrillasState>((set, get) => ({
  cuadrillas: cuadrillasMock,
  obras: obrasMock,
  tareas: tareasMock,
  filtros: {},
  cuadrillaSeleccionada: null,
  showDrawer: false,
  showModalAsignacion: false,

  setFiltros: (nuevosFiltros) => {
    set((state) => ({
      filtros: { ...state.filtros, ...nuevosFiltros }
    }));
  },

  moverCuadrilla: (cuadrillaId, nuevaEspecialidad) => {
    set((state) => ({
      cuadrillas: state.cuadrillas.map(cuadrilla =>
        cuadrilla.id === cuadrillaId
          ? { ...cuadrilla, especialidad: nuevaEspecialidad }
          : cuadrilla
      )
    }));
  },

  seleccionarCuadrilla: (cuadrilla) => {
    set({ cuadrillaSeleccionada: cuadrilla });
  },

  abrirDrawer: () => {
    set({ showDrawer: true });
  },

  cerrarDrawer: () => {
    set({ showDrawer: false });
  },

  abrirModalAsignacion: () => {
    set({ showModalAsignacion: true });
  },

  cerrarModalAsignacion: () => {
    set({ showModalAsignacion: false });
  },

  asignarTarea: (cuadrillaId, tareaId) => {
    set((state) => ({
      tareas: state.tareas.map(tarea =>
        tarea.id === tareaId
          ? { ...tarea, cuadrillaId, estado: 'ASIGNADA' as const }
          : tarea
      ),
      cuadrillas: state.cuadrillas.map(cuadrilla =>
        cuadrilla.id === cuadrillaId
          ? { 
              ...cuadrilla, 
              kpi: { 
                ...cuadrilla.kpi, 
                tareasAsignadas: cuadrilla.kpi.tareasAsignadas + 1 
              }
            }
          : cuadrilla
      )
    }));
  },

  actualizarCuadrilla: (cuadrillaId, updates) => {
    set((state) => ({
      cuadrillas: state.cuadrillas.map(cuadrilla =>
        cuadrilla.id === cuadrillaId
          ? { ...cuadrilla, ...updates }
          : cuadrilla
      )
    }));
  }
}));