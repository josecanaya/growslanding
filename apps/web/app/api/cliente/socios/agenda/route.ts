import { GET as agendaGet } from '../../../socios/agenda/route';

export const runtime = 'nodejs';

/** GET /api/cliente/socios/agenda — alias de /api/socios/agenda */
export const GET = agendaGet;
