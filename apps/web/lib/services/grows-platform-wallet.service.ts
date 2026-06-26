import { resolveGrowsPlatformOrgId } from '../wallet/grows-platform.config';
import { WalletMvpService } from './wallet-mvp.service';

export class GrowsPlatformWalletService {
  static async obtenerOrgId(): Promise<string> {
    const orgId = await resolveGrowsPlatformOrgId();
    if (!orgId) {
      throw new Error(
        'GROWS_PLATFORM_ORG_ID no configurado: no se puede operar la billetera de plataforma',
      );
    }
    return orgId;
  }

  static async obtenerSaldo() {
    const orgId = await this.obtenerOrgId();
    return WalletMvpService.obtenerSaldo('ORG', orgId);
  }

  static async obtenerMovimientos(limit = 50, offset = 0) {
    const orgId = await this.obtenerOrgId();
    return WalletMvpService.obtenerMovimientos('ORG', orgId, limit, offset);
  }

  static async obtenerResumen() {
    const [saldo, movimientos] = await Promise.all([
      this.obtenerSaldo(),
      this.obtenerMovimientos(10, 0),
    ]);

    return {
      orgId: await this.obtenerOrgId(),
      saldo_actual: saldo.saldo_actual ?? 0,
      saldo_pendiente: saldo.saldo_pendiente ?? 0,
      moneda: saldo.moneda ?? 'ARS',
      ultimosMovimientos: movimientos.movimientos,
      totalMovimientos: movimientos.total,
    };
  }
}
