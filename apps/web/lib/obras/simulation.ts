export type Role = 'profesional' | 'contratista' | 'inversor';
export type Block = { id: string; title: string; state: 'pendiente' | 'en_curso' | 'presentado' | 'validado'; dependsOn: string[]; evidence?: string };
export type Activity = { id: string; author: string; role: Role; text: string; visibility: 'publica' | 'equipo'; blockId?: string };
export type Scenario = { id: string; name: string; city: string; type: string; situation: string; target: string; professional: string; contractor: string; investor: string; blocks: Block[]; activity: Activity[]; proposal?: string; following: boolean };

const seeds = [
  ['Casa Patio', 'Rosario', 'Vivienda', 'La estructura está lista para inspección.', 'Validar estructura para habilitar mampostería.', 'Estructura', 'Mampostería'],
  ['Ribera Norte', 'Santa Fe', 'Edificio', 'Se presentó el ensayo de impermeabilización.', 'Revisar el ensayo antes de cerrar la cubierta.', 'Impermeabilización', 'Terminación de cubierta'],
  ['Taller del Sur', 'Córdoba', 'Local', 'La instalación eléctrica espera la aprobación del trazado.', 'Resolver el trazado y liberar la instalación.', 'Trazado eléctrico', 'Cableado'],
  ['Los Aromos', 'Funes', 'Vivienda', 'La compra de aberturas depende de medidas verificadas.', 'Confirmar medidas antes de fabricar.', 'Relevamiento de vanos', 'Fabricación de aberturas'],
  ['Distrito Parque', 'Mendoza', 'Edificio', 'El contratista informó el fin de la excavación.', 'Validar excavación antes de fundar.', 'Excavación', 'Fundaciones'],
  ['Escuela Horizonte', 'La Plata', 'Educación', 'Las aulas necesitan una revisión de accesibilidad.', 'Aprobar el recorrido accesible.', 'Revisión de accesibilidad', 'Ejecución de rampas'],
  ['Mercado Central', 'Paraná', 'Comercio', 'El montaje depende de la recepción de perfiles.', 'Controlar materiales antes del montaje.', 'Recepción de perfiles', 'Montaje de estructura'],
  ['Casa del Lago', 'Bariloche', 'Vivienda', 'La aislación debe verificarse antes del revestimiento.', 'Registrar continuidad de la aislación.', 'Aislación térmica', 'Revestimiento interior'],
  ['Clínica Alameda', 'Buenos Aires', 'Salud', 'La prueba hidráulica está pendiente.', 'Validar la prueba antes de tapar instalaciones.', 'Prueba hidráulica', 'Cierre de canalizaciones'],
  ['Dúplex Encuentro', 'Neuquén', 'Vivienda', 'El avance informado todavía no está certificado.', 'Distinguir trabajo presentado de avance validado.', 'Losa sobre planta baja', 'Muros de planta alta'],
  ['Hotel del Valle', 'Salta', 'Turismo', 'El prototipo de habitación requiere aprobación.', 'Aprobar una unidad antes de repetir terminaciones.', 'Habitación modelo', 'Terminaciones de habitaciones'],
  ['Centro Semilla', 'Tucumán', 'Comunidad', 'Se debe coordinar la entrega del salón.', 'Completar inspección antes de la entrega.', 'Inspección final', 'Entrega del salón'],
  ['Galpón Logístico', 'Pilar', 'Industria', 'El piso depende de la compactación del suelo.', 'Validar ensayo de compactación.', 'Compactación de base', 'Piso industrial'],
  ['Pasaje Olivos', 'Vicente López', 'Reforma', 'La demolición requiere proteger elementos existentes.', 'Verificar protecciones antes de intervenir.', 'Protecciones de obra', 'Demolición controlada'],
  ['Terrazas del Este', 'Mar del Plata', 'Edificio', 'La recepción de balcones necesita evidencias.', 'Aprobar barandas antes de habilitar balcones.', 'Inspección de barandas', 'Habilitación de balcones'],
] as const;

export function createScenarios(): Scenario[] {
  return seeds.map(([name, city, type, situation, target, first, second], i) => ({
    id: `demo-${i + 1}`, name, city, type, situation, target,
    professional: ['Ana Torres', 'Martín Ríos', 'Lucía Vega'][i % 3],
    contractor: ['Equipo Sur', 'Cooperativa Norte', 'Construcciones Delta'][i % 3],
    investor: ['Paula Méndez', 'Diego Luna', 'Marina Sol'][i % 3],
    following: false,
    blocks: [
      { id: 'plan', title: 'Alcance y documentación inicial', state: 'validado', dependsOn: [] },
      { id: 'actual', title: first, state: i % 3 === 0 ? 'presentado' : 'en_curso', dependsOn: ['plan'], ...(i % 3 === 0 ? { evidence: `Acta ficticia de ${first.toLowerCase()} y registro de inspección.` } : {}) },
      { id: 'siguiente', title: second, state: 'pendiente', dependsOn: ['actual'] },
    ],
    activity: [
      { id: 'presentacion', author: ['Ana Torres', 'Martín Ríos', 'Lucía Vega'][i % 3], role: 'profesional', text: `${name}: ${situation} Compartimos el seguimiento de esta etapa.`, visibility: 'publica' },
      { id: 'consulta', author: ['Paula Méndez', 'Diego Luna', 'Marina Sol'][i % 3], role: 'inversor', text: '¿Qué condición falta para habilitar la próxima etapa?', visibility: 'publica' },
      { id: 'coordinacion', author: ['Equipo Sur', 'Cooperativa Norte', 'Construcciones Delta'][i % 3], role: 'contratista', text: `Coordinamos la revisión de ${first.toLowerCase()} con la dirección de obra.`, visibility: 'equipo', blockId: 'actual' },
    ],
  }));
}

export function inspectScenario(obra: Scenario) {
  const validated = obra.blocks.filter(b => b.state === 'validado').length;
  const blocked = obra.blocks.filter(b => b.state !== 'validado' && b.dependsOn.some(id => obra.blocks.find(other => other.id === id)?.state !== 'validado'));
  return { progress: Math.round(validated / obra.blocks.length * 100), blocked, pendingReview: obra.blocks.filter(b => b.state === 'presentado'), sources: obra.blocks.map(b => b.id) };
}

export function visibleActivity(obra: Scenario, role: Role | 'publico') {
  return obra.activity.filter(event => event.visibility === 'publica' || role === 'profesional' || role === 'contratista');
}

export type Action = { type: 'evidence'; text: string } | { type: 'validate' } | { type: 'comment'; text: string } | { type: 'propose' } | { type: 'accept' } | { type: 'follow' };
export function act(obra: Scenario, role: Role | 'publico', action: Action): Scenario {
  if (action.type === 'follow') return { ...obra, following: !obra.following };
  if (role === 'publico') throw new Error('Elegí una participación de prueba dentro de la obra.');
  const next: Scenario = structuredClone(obra);
  const block = next.blocks.find(b => b.id === 'actual')!;
  const author = role === 'profesional' ? obra.professional : role === 'contratista' ? obra.contractor : obra.investor;
  const add = (text: string, visibility: 'publica' | 'equipo', blockId?: string) => next.activity.push({ id: `evento-${next.activity.length}`, author, role, text, visibility, blockId });
  if (action.type === 'evidence') {
    if (role !== 'contratista' || block.state !== 'en_curso' || !action.text.trim()) throw new Error('El contratista debe aportar evidencia de un trabajo en curso.');
    block.evidence = action.text.trim(); block.state = 'presentado';
    add(`Presentó evidencia de ${block.title}. Pendiente de validación profesional.`, 'equipo', block.id);
  } else if (action.type === 'validate') {
    if (role !== 'profesional' || block.state !== 'presentado' || !block.evidence) throw new Error('La validación requiere un profesional y evidencia presentada.');
    block.state = 'validado';
    add(`Validó ${block.title}. Se habilita ${next.blocks.find(b => b.id === 'siguiente')!.title}.`, 'publica', block.id);
  } else if (action.type === 'comment') {
    if (!action.text.trim()) throw new Error('Escribí un comentario.');
    add(action.text.trim().slice(0, 1000), 'publica');
  } else if (action.type === 'propose') {
    if (role !== 'profesional') throw new Error('Esta propuesta corresponde al profesional.');
    next.proposal = 'Coordinar inspección de la siguiente etapa';
    add('Solicitó una propuesta de tarea. El intérprete de lenguaje está simulado con una plantilla.', 'equipo');
  } else if (action.type === 'accept') {
    if (role !== 'profesional' || !next.proposal || next.blocks.some(b => b.id === 'propuesta')) throw new Error('No hay una propuesta nueva para aceptar.');
    next.blocks.push({ id: 'propuesta', title: next.proposal, state: 'pendiente', dependsOn: ['siguiente'] });
    add(`Aceptó la propuesta: ${next.proposal}.`, 'equipo', 'propuesta');
    next.proposal = undefined;
  }
  return next;
}
