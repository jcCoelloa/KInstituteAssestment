import { afterEach, describe, expect, it, jest } from '@jest/globals';
import { WhatsappSenderService } from '../src/bot/whatsapp-sender.service';

describe('WhatsappSenderService', () => {
  const originalEnv = { ...process.env };

  afterEach(() => {
    process.env = { ...originalEnv };
    jest.restoreAllMocks();
  });

  it('hace no-op y no llama a fetch cuando faltan credenciales', async () => {
    delete process.env.TWILIO_ACCOUNT_SID;
    delete process.env.TWILIO_AUTH_TOKEN;
    delete process.env.TWILIO_WHATSAPP_NUMBER;

    const fetchSpy = jest.spyOn(globalThis, 'fetch' as never);
    const service = new WhatsappSenderService();

    await expect(service.sendMessage('+50300000000', 'hola')).resolves.toBeUndefined();
    expect(fetchSpy).not.toHaveBeenCalled();
  });
});
