import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';

export type ConversationPhase = 'SELECTING' | 'RECLAMO_DETAILS' | 'FOLLOWUP';

@Injectable()
export class ConversationStateService {
  constructor(private readonly prisma: PrismaService) {}

  // Devuelve la fase actual de la conversación para un teléfono, o null si no existe (conversación nueva/terminada).
  async getPhase(phone: string): Promise<ConversationPhase | null> {
    const row = await this.prisma.conversationState.findUnique({ where: { phone } });
    return (row?.phase as ConversationPhase) ?? null;
  }

  // Crea o actualiza la fase de la conversación para un teléfono.
  async setPhase(phone: string, phase: ConversationPhase): Promise<void> {
    await this.prisma.conversationState.upsert({
      where: { phone },
      create: { phone, phase },
      update: { phase },
    });
  }

  // Termina la conversación: borra el estado para que el siguiente mensaje se trate como nuevo.
  async clear(phone: string): Promise<void> {
    await this.prisma.conversationState.deleteMany({ where: { phone } });
  }
}
