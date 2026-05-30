import { JornadasRepository, type JornadaRow } from './infrastructure/jornadas.repository';

export class JornadaSocioService {
  static async obtenerDelDia(socioId: string, fecha?: string): Promise<JornadaRow | null> {
    return JornadasRepository.findBySocioYFecha(socioId, fecha);
  }

  static async iniciar(params: { socioId: string; obraId: string }): Promise<JornadaRow> {
    const fecha = JornadasRepository.fechaHoyIso();
    const existente = await JornadasRepository.findBySocioYFecha(params.socioId, fecha);
    if (existente) return existente;

    try {
      return await JornadasRepository.insert({
        socio_id: params.socioId,
        obra_id: params.obraId,
        fecha,
        hora_inicio: new Date().toISOString(),
      });
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      if (msg.includes('unique') || msg.includes('duplicate') || msg.includes('23505')) {
        const again = await JornadasRepository.findBySocioYFecha(params.socioId, fecha);
        if (again) return again;
      }
      throw e;
    }
  }

  static async finalizar(params: { jornadaId: string; socioId: string }): Promise<JornadaRow | null> {
    const horaFin = new Date().toISOString();
    await JornadasRepository.finalizar(params.jornadaId, params.socioId, horaFin);
    return JornadasRepository.findBySocioYFecha(params.socioId);
  }
}
