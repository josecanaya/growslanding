export const SCOPES = ['grows:public','grows:read','grows:plan','grows:publish','grows:rounds','grows:work'] as const;
export type Scope = typeof SCOPES[number];
export const scopeLabels: Record<Scope,string> = {
 'grows:public':'Consultar obras públicas y participar en el feed',
 'grows:read':'Leer el proyecto privado, su planificación y cotizaciones',
 'grows:plan':'Crear obras y editar tareas, dependencias y pliegos',
 'grows:publish':'Editar presentación, novedades y obras hermanas',
 'grows:rounds':'Preparar y abrir rondas de ensayo; registrar adicionales',
 'grows:work':'Cotizar, iniciar trabajos, presentar evidencias y revisar en obra',
};
