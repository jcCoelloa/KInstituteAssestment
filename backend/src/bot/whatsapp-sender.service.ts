import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class WhatsappSenderService {
  private readonly logger = new Logger(WhatsappSenderService.name);

  // Envía un mensaje de WhatsApp por la API REST de Twilio (best-effort).
  // ponytail: no-op sin credenciales; migrar a plantilla aprobada al salir de la ventana de 24h de Meta.
  async sendMessage(toPhone: string, text: string): Promise<void> {
    const sid = process.env.TWILIO_ACCOUNT_SID;
    const token = process.env.TWILIO_AUTH_TOKEN;
    const from = process.env.TWILIO_WHATSAPP_NUMBER;

    if (!sid || !token || !from) {
      this.logger.warn(`Twilio sin configurar; omito envío a ${toPhone}: "${text}"`);
      return;
    }

    try {
      const body = new URLSearchParams({
        To: `whatsapp:${toPhone}`,
        From: `whatsapp:${from}`,
        Body: text,
      });

      const response = await fetch(
        `https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json`,
        {
          method: 'POST',
          headers: {
            Authorization: `Basic ${Buffer.from(`${sid}:${token}`).toString('base64')}`,
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body,
        },
      );

      if (!response.ok) {
        this.logger.error(`Twilio respondió ${response.status} al enviar a ${toPhone}`);
      }
    } catch (error) {
      // Un fallo de entrega nunca debe romper el cambio de estado.
      this.logger.error(`Error enviando WhatsApp a ${toPhone}: ${String(error)}`);
    }
  }
}
