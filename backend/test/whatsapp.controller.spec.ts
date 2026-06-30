import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import { WhatsappController } from '../src/bot/whatsapp.controller';

describe('WhatsappController', () => {
  let controller: WhatsappController;
  let casesService: any;
  let intentionsService: any;

  beforeEach(() => {
    casesService = {
      createOrGetCase: jest.fn(),
      addMessage: jest.fn(),
    };

    intentionsService = {
      detect: jest.fn(),
      getResponse: jest.fn(),
    };

    controller = new WhatsappController(casesService, intentionsService);
  });

  it('devuelve un TwiML válido para un mensaje entrante', async () => {
    casesService.createOrGetCase.mockResolvedValue({ id: 42 });
    casesService.addMessage.mockResolvedValue(undefined);
    intentionsService.detect.mockReturnValue('RECLAMO');
    intentionsService.getResponse.mockReturnValue('He abierto un caso de reclamo.');

    const result = await controller.handleWebhook({
      Body: 'quiero un reclamo',
      From: 'whatsapp:+51999999999',
    });

    const createOrGetCaseMock = casesService.createOrGetCase as jest.Mock;
    expect(createOrGetCaseMock).toHaveBeenCalledWith('+51999999999', 'RECLAMO');
    expect(result).toContain('<Response>');
    expect(result).toContain('<Message>');
    expect(result).toContain('He abierto un caso de reclamo.');
  });
});
