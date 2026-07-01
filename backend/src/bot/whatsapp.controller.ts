import { Body, Controller, Header, HttpCode, Post } from '@nestjs/common';
import { CasesService } from './cases.service';
import { IntentionsService } from './intentions.service';
import { ConversationStateService } from './conversation-state.service';

const FOLLOW_UP =
  '¿Hay algo más en que pueda ayudarte? Responde SÍ para ver el menú o NO para terminar la conversación.';
const GOODBYE = 'Gracias por contactarnos. Hemos finalizado la conversación.';

@Controller('webhook')
export class WhatsappController {
  constructor(
    private readonly casesService: CasesService,
    private readonly intentionsService: IntentionsService,
    private readonly conversationStateService: ConversationStateService,
  ) {}

  @Post('whatsapp')
  @HttpCode(200)
  @Header('Content-Type', 'text/xml; charset=utf-8')
  // Recibe mensajes de Twilio, los procesa y responde con TwiML para WhatsApp.
  async handleWebhook(@Body() body: any) {
    const { messageText, phone } = this.extractIncomingMessage(body);
    const phase = await this.conversationStateService.getPhase(phone);

    // 0. Mientras se esperan los detalles de un reclamo, cualquier texto es el reclamo en sí:
    // no se interpreta como consulta de estado ni como intención nueva.
    if (phase === 'RECLAMO_DETAILS') {
      return this.buildTwimlResponse(await this.captureReclamoDetails(phone, messageText));
    }

    // 1. Consulta de estado por número de caso: informa el estado sin modificar el caso ni la fase.
    const caseNumber = this.intentionsService.detectStatusQuery(messageText);
    if (caseNumber !== null) {
      return this.buildTwimlResponse(await this.answerStatusQuery(caseNumber, messageText));
    }

    if (phase === 'FOLLOWUP') {
      return this.buildTwimlResponse(await this.handleFollowUp(phone, messageText));
    }

    if (phase === 'SELECTING') {
      return this.buildTwimlResponse(await this.handleSelection(phone, messageText));
    }

    // Conversación nueva o ya terminada: solo se muestra el menú, sin importar el contenido del mensaje.
    await this.conversationStateService.setPhase(phone, 'SELECTING');
    return this.buildTwimlResponse(this.intentionsService.getResponse('DESCONOCIDA'));
  }

  private async answerStatusQuery(caseNumber: number, messageText: string) {
    const found = await this.casesService.getCaseById(caseNumber);
    const reply = this.withFollowUp(
      found
        ? `Tu caso #${found.id} está en estado: ${found.status}.`
        : `No encontré ningún caso con el número #${caseNumber}.`,
    );

    if (found) {
      await this.casesService.addMessage(found.id, 'INBOUND', messageText);
      await this.casesService.addMessage(found.id, 'OUTBOUND', reply);
    }

    return reply;
  }

  private async handleFollowUp(phone: string, messageText: string) {
    const choice = this.intentionsService.detectFollowUpChoice(messageText);
    if (choice === 'END') {
      await this.conversationStateService.clear(phone);
      return GOODBYE;
    }
    if (choice === 'MENU') {
      await this.conversationStateService.setPhase(phone, 'SELECTING');
      return this.intentionsService.getResponse('DESCONOCIDA');
    }
    // Respuesta no reconocida: se repite la pregunta de cierre sin clasificar intención.
    return FOLLOW_UP;
  }

  private async handleSelection(phone: string, messageText: string) {
    const intent = this.intentionsService.detect(messageText);

    if (intent === 'DESCONOCIDA') {
      return this.intentionsService.getResponse('DESCONOCIDA');
    }

    if (intent === 'RECLAMO') {
      await this.conversationStateService.setPhase(phone, 'RECLAMO_DETAILS');
      return this.intentionsService.getResponse('RECLAMO');
    }

    const response = this.intentionsService.getResponse(intent);
    const record = await this.casesService.createCase(phone, intent);
    await this.casesService.addMessage(record.id, 'INBOUND', messageText);

    const finalResponse = this.withFollowUp(response);
    await this.casesService.addMessage(record.id, 'OUTBOUND', finalResponse);
    await this.casesService.setStatus(record.id, 'CERRADO');
    await this.conversationStateService.setPhase(phone, 'FOLLOWUP');

    return finalResponse;
  }

  private async captureReclamoDetails(phone: string, messageText: string) {
    const record = await this.casesService.createCase(phone, 'RECLAMO');
    await this.casesService.addMessage(record.id, 'INBOUND', messageText);

    const confirmation = `Hemos registrado tu reclamo. Tu número de caso es #${record.id}. Puedes consultar su estado enviando "estado ${record.id}".`;
    const finalResponse = this.withFollowUp(confirmation);

    await this.casesService.addMessage(record.id, 'OUTBOUND', finalResponse);
    await this.conversationStateService.setPhase(phone, 'FOLLOWUP');

    return finalResponse;
  }

  private withFollowUp(text: string) {
    return `${text}\n\n${FOLLOW_UP}`;
  }

  private extractIncomingMessage(body: any) {
    return {
      messageText: body?.entry?.[0]?.changes?.[0]?.value?.messages?.[0]?.text?.body ?? body?.Body ?? '',
      phone: body?.entry?.[0]?.changes?.[0]?.value?.contacts?.[0]?.wa_id ?? body?.From?.replace('whatsapp:', '') ?? 'unknown',
    };
  }

  private buildTwimlResponse(response: string) {
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
