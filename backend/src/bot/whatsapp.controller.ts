import { Body, Controller, Header, HttpCode, Post } from '@nestjs/common';
import { CasesService } from './cases.service';
import { IntentionsService } from './intentions.service';

@Controller('webhook')
export class WhatsappController {
  constructor(
    private readonly casesService: CasesService,
    private readonly intentionsService: IntentionsService,
  ) {}

  @Post('whatsapp')
  @HttpCode(200)
  @Header('Content-Type', 'text/xml; charset=utf-8')
  // Recibe mensajes de Twilio, los procesa y responde con TwiML para WhatsApp.
  async handleWebhook(@Body() body: any) {
    // Extrae el texto y el número del remitente desde el payload de Twilio.
    const messageText = body?.entry?.[0]?.changes?.[0]?.value?.messages?.[0]?.text?.body ?? body?.Body ?? '';
    const phone = body?.entry?.[0]?.changes?.[0]?.value?.contacts?.[0]?.wa_id ?? body?.From?.replace('whatsapp:', '') ?? 'unknown';

    const intent = this.intentionsService.detect(messageText);
    const response = this.intentionsService.getResponse(intent);

    const caseRecord = await this.casesService.createOrGetCase(phone, intent);
    await this.casesService.addMessage(caseRecord.id, 'INBOUND', messageText);
    await this.casesService.addMessage(caseRecord.id, 'OUTBOUND', response);

    const escapedResponse = response
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');

    return `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Message>${escapedResponse}</Message>
</Response>`;
  }
}
