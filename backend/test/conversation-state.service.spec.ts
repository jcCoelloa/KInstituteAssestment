import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import { ConversationStateService } from '../src/bot/conversation-state.service';

describe('ConversationStateService', () => {
  let prisma: any;
  let service: ConversationStateService;

  beforeEach(() => {
    prisma = {
      conversationState: {
        findUnique: jest.fn(),
        upsert: jest.fn(),
        deleteMany: jest.fn(),
      },
    };
    service = new ConversationStateService(prisma);
  });

  it('devuelve null cuando no existe fila para el teléfono', async () => {
    prisma.conversationState.findUnique.mockResolvedValue(null);

    const phase = await service.getPhase('+51999999999');

    expect(prisma.conversationState.findUnique).toHaveBeenCalledWith({ where: { phone: '+51999999999' } });
    expect(phase).toBeNull();
  });

  it('devuelve la fase existente para el teléfono', async () => {
    prisma.conversationState.findUnique.mockResolvedValue({ phone: '+51999999999', phase: 'SELECTING' });

    const phase = await service.getPhase('+51999999999');

    expect(phase).toBe('SELECTING');
  });

  it('crea o actualiza la fase mediante upsert', async () => {
    prisma.conversationState.upsert.mockResolvedValue(undefined);

    await service.setPhase('+51999999999', 'FOLLOWUP');

    expect(prisma.conversationState.upsert).toHaveBeenCalledWith({
      where: { phone: '+51999999999' },
      create: { phone: '+51999999999', phase: 'FOLLOWUP' },
      update: { phase: 'FOLLOWUP' },
    });
  });

  it('borra el estado de la conversación al terminarla', async () => {
    prisma.conversationState.deleteMany.mockResolvedValue(undefined);

    await service.clear('+51999999999');

    expect(prisma.conversationState.deleteMany).toHaveBeenCalledWith({ where: { phone: '+51999999999' } });
  });
});
