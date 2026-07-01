import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import { WhatsappController } from '../src/bot/whatsapp.controller';

describe('WhatsappController', () => {
  let controller: WhatsappController;
  let casesService: any;
  let intentionsService: any;
  let conversationStateService: any;

  beforeEach(() => {
    casesService = {
      createCase: jest.fn(),
      setStatus: jest.fn(),
      getCaseById: jest.fn(),
      addMessage: jest.fn(),
    };

    intentionsService = {
      detect: jest.fn(),
      getResponse: jest.fn(),
      detectStatusQuery: jest.fn().mockReturnValue(null),
      detectFollowUpChoice: jest.fn().mockReturnValue(null),
    };

    conversationStateService = {
      getPhase: jest.fn(),
      setPhase: jest.fn(),
      clear: jest.fn(),
    };
    conversationStateService.getPhase.mockResolvedValue(null);

    controller = new WhatsappController(casesService, intentionsService, conversationStateService);
  });

  it('en una conversación nueva solo muestra el menú, aunque el mensaje ya tenga una palabra clave', async () => {
    conversationStateService.getPhase.mockResolvedValue(null);
    intentionsService.getResponse.mockReturnValue('Estas son mis opciones: 1) ... 5) Reclamo');

    const result = await controller.handleWebhook({ Body: 'cuándo es el pago', From: 'whatsapp:+51999999999' });

    expect(intentionsService.detect).not.toHaveBeenCalled();
    expect(casesService.createCase).not.toHaveBeenCalled();
    expect(result).toContain('Estas son mis opciones');
    expect(result).not.toContain('Responde SÍ para ver el menú');
    expect(conversationStateService.setPhase).toHaveBeenCalledWith('+51999999999', 'SELECTING');
  });

  it('al elegir una opción distinta de reclamo responde, cierra el caso y espera el cierre', async () => {
    conversationStateService.getPhase.mockResolvedValue('SELECTING');
    intentionsService.detect.mockReturnValue('FECHAS_PAGO');
    intentionsService.getResponse.mockReturnValue('Las fechas de pago son...');
    casesService.createCase.mockResolvedValue({ id: 43, type: 'CONSULTA' });

    const result = await controller.handleWebhook({ Body: '2', From: 'whatsapp:+51999999999' });

    expect(casesService.createCase).toHaveBeenCalledWith('+51999999999', 'FECHAS_PAGO');
    expect(casesService.setStatus).toHaveBeenCalledWith(43, 'CERRADO');
    expect(result).toContain('Las fechas de pago son...');
    expect(result).toContain('Responde SÍ para ver el menú');
    expect(conversationStateService.setPhase).toHaveBeenCalledWith('+51999999999', 'FOLLOWUP');
  });

  it('al elegir reclamo pregunta qué pasó sin crear caso ni pedir cierre', async () => {
    conversationStateService.getPhase.mockResolvedValue('SELECTING');
    intentionsService.detect.mockReturnValue('RECLAMO');
    intentionsService.getResponse.mockReturnValue('¿Qué pasó? Cuéntame los detalles de tu reclamo.');

    const result = await controller.handleWebhook({ Body: '5', From: 'whatsapp:+51999999999' });

    expect(casesService.createCase).not.toHaveBeenCalled();
    expect(result).toContain('¿Qué pasó?');
    expect(result).not.toContain('Responde SÍ para ver el menú');
    expect(conversationStateService.setPhase).toHaveBeenCalledWith('+51999999999', 'RECLAMO_DETAILS');
  });

  it('si la opción no se reconoce reenvía el menú y se queda esperando selección', async () => {
    conversationStateService.getPhase.mockResolvedValue('SELECTING');
    intentionsService.detect.mockReturnValue('DESCONOCIDA');
    intentionsService.getResponse.mockReturnValue('Estas son mis opciones: ...');

    const result = await controller.handleWebhook({ Body: 'asdf', From: 'whatsapp:+51999999999' });

    expect(casesService.createCase).not.toHaveBeenCalled();
    expect(result).toContain('Estas son mis opciones');
    expect(result).not.toContain('Responde SÍ para ver el menú');
    expect(conversationStateService.setPhase).not.toHaveBeenCalled();
  });

  it('mientras espera los detalles del reclamo captura el mensaje tal cual, incluso si parece consulta de estado', async () => {
    conversationStateService.getPhase.mockResolvedValue('RECLAMO_DETAILS');
    casesService.createCase.mockResolvedValue({ id: 42, type: 'RECLAMO' });

    const result = await controller.handleWebhook({
      Body: 'estado 5, me cobraron dos veces',
      From: 'whatsapp:+51999999999',
    });

    expect(intentionsService.detectStatusQuery).not.toHaveBeenCalled();
    expect(casesService.createCase).toHaveBeenCalledWith('+51999999999', 'RECLAMO');
    expect(casesService.addMessage).toHaveBeenCalledWith(42, 'INBOUND', 'estado 5, me cobraron dos veces');
    expect(casesService.setStatus).not.toHaveBeenCalled();
    expect(result).toContain('Hemos registrado tu reclamo');
    expect(result).toContain('Tu número de caso es #42');
    expect(result).toContain('Responde SÍ para ver el menú');
    expect(conversationStateService.setPhase).toHaveBeenCalledWith('+51999999999', 'FOLLOWUP');
  });

  it('con SÍ en el cierre reenvía el menú y vuelve a esperar selección', async () => {
    conversationStateService.getPhase.mockResolvedValue('FOLLOWUP');
    intentionsService.detectFollowUpChoice.mockReturnValue('MENU');
    intentionsService.getResponse.mockReturnValue('Estas son mis opciones: ...');

    const result = await controller.handleWebhook({ Body: 'sí', From: 'whatsapp:+51999999999' });

    expect(result).toContain('Estas son mis opciones');
    expect(result).not.toContain('Responde SÍ para ver el menú');
    expect(casesService.createCase).not.toHaveBeenCalled();
    expect(conversationStateService.setPhase).toHaveBeenCalledWith('+51999999999', 'SELECTING');
  });

  it('con NO en el cierre despide sin mencionar casos y termina la conversación', async () => {
    conversationStateService.getPhase.mockResolvedValue('FOLLOWUP');
    intentionsService.detectFollowUpChoice.mockReturnValue('END');

    const result = await controller.handleWebhook({ Body: 'no', From: 'whatsapp:+51999999999' });

    expect(result).toContain('Hemos finalizado la conversación');
    expect(result).not.toContain('estado');
    expect(casesService.createCase).not.toHaveBeenCalled();
    expect(conversationStateService.clear).toHaveBeenCalledWith('+51999999999');
  });

  it('si la respuesta de cierre no es SÍ ni NO repite la pregunta sin clasificar intención', async () => {
    conversationStateService.getPhase.mockResolvedValue('FOLLOWUP');
    intentionsService.detectFollowUpChoice.mockReturnValue(null);

    const result = await controller.handleWebhook({ Body: 'tal vez', From: 'whatsapp:+51999999999' });

    expect(result).toContain('Responde SÍ para ver el menú');
    expect(intentionsService.detect).not.toHaveBeenCalled();
    expect(conversationStateService.setPhase).not.toHaveBeenCalled();
    expect(conversationStateService.clear).not.toHaveBeenCalled();
  });

  it('responde con el estado del caso sin modificarlo, sin importar la fase de la conversación', async () => {
    conversationStateService.getPhase.mockResolvedValue('FOLLOWUP');
    intentionsService.detectStatusQuery.mockReturnValue(7);
    casesService.getCaseById.mockResolvedValue({ id: 7, status: 'EN_PROCESO' });
    casesService.addMessage.mockResolvedValue(undefined);

    const result = await controller.handleWebhook({ Body: 'estado 7', From: 'whatsapp:+51999999999' });

    expect(casesService.createCase).not.toHaveBeenCalled();
    expect(casesService.setStatus).not.toHaveBeenCalled();
    expect(result).toContain('Tu caso #7 está en estado: EN_PROCESO.');
    expect(conversationStateService.setPhase).not.toHaveBeenCalled();
    expect(conversationStateService.clear).not.toHaveBeenCalled();
  });

  it('flujo completo de reclamo en tres mensajes: menú, selección, detalles', async () => {
    intentionsService.getResponse.mockImplementation((intent: string) =>
      intent === 'RECLAMO' ? '¿Qué pasó? Cuéntame los detalles de tu reclamo.' : 'Estas son mis opciones: ...',
    );

    conversationStateService.getPhase.mockResolvedValueOnce(null);
    const menu = await controller.handleWebhook({ Body: 'hola', From: 'whatsapp:+51999999999' });
    expect(menu).toContain('Estas son mis opciones');
    expect(casesService.createCase).not.toHaveBeenCalled();

    conversationStateService.getPhase.mockResolvedValueOnce('SELECTING');
    intentionsService.detect.mockReturnValue('RECLAMO');
    const prompt = await controller.handleWebhook({ Body: '5', From: 'whatsapp:+51999999999' });
    expect(prompt).toContain('¿Qué pasó?');
    expect(casesService.createCase).not.toHaveBeenCalled();

    conversationStateService.getPhase.mockResolvedValueOnce('RECLAMO_DETAILS');
    casesService.createCase.mockResolvedValue({ id: 99, type: 'RECLAMO' });
    const confirmation = await controller.handleWebhook({
      Body: 'el profesor no llegó a clase',
      From: 'whatsapp:+51999999999',
    });
    expect(casesService.createCase).toHaveBeenCalledWith('+51999999999', 'RECLAMO');
    expect(confirmation).toContain('Tu número de caso es #99');
  });
});
