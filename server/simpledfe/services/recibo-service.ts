import { mysqlPool } from "../mysql-config";

export class ReciboService {
  static async atualizarStatusRecibo(reciboId: number, status: string): Promise<void> {
    await mysqlPool.execute(
      "UPDATE recibos SET rec_status = ? WHERE rec_id = ?",
      [status, reciboId]
    );
  }
}
