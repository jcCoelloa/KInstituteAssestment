import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { WhatsappSenderService } from './whatsapp-sender.service';

type CaseType = 'CONSULTA' | 'RECLAMO';
type CaseStatus = 'ABIERTO' | 'EN_PROCESO' | 'CERRADO';

type CaseDefaults = {
  type: CaseType;
  status: CaseStatus;
};

const CASE_DEFAULTS_BY_INTENT: Record<string, CaseDefaults> = {
  RECLAMO: { type: 'RECLAMO', status: 'ABIERTO' },
  DEFAULT: { type: 'CONSULTA', status: 'EN_PROCESO' },
};

@Injectable()
export class CasesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly whatsappSender: WhatsappSenderService,
  ) {}

  private getCaseDefaults(intent: string): CaseDefaults {
    return CASE_DEFAULTS_BY_INTENT[intent] ?? CASE_DEFAULTS_BY_INTENT.DEFAULT;
  }

  // Abre un caso nuevo para cada consulta o reclamo entrante.
  async createCase(phone: string, intent: string) {
    const defaults = this.getCaseDefaults(intent);
    return this.prisma.case.create({
      data: {
        phone,
        type: defaults.type,
        status: defaults.status,
        intent,
      },
    });
  }

  // Guarda un mensaje del hilo de conversación en el caso correspondiente.
  async addMessage(caseId: number, direction: string, text: string, channel = 'WHATSAPP') {
    return this.prisma.message.create({
      data: {
        caseId,
        direction,
        channel,
        text,
      },
    });
  }

  // Devuelve todos los casos ordenados por la fecha más reciente de actualización.
  async listCases() {
    return this.prisma.case.findMany({
      orderBy: { updatedAt: 'desc' },
      include: { messages: true },
    });
  }

  // Busca un caso por su número, incluyendo su historial de mensajes.
  async getCaseById(id: number) {
    return this.prisma.case.findUnique({
      where: { id },
      include: { messages: true },
    });
  }

  // Cambia el estado de un caso sin notificar (uso interno del bot).
  async setStatus(id: number, status: string) {
    return this.prisma.case.update({
      where: { id },
      data: { status },
    });
  }

  // Actualiza el estado desde el dashboard: registra la nota y notifica al usuario por WhatsApp.
  async updateStatus(id: number, status: string) {
    const updated = await this.setStatus(id, status);

    const note = `El estado de tu caso #${updated.id} cambió a: ${status}.`;
    await this.addMessage(updated.id, 'OUTBOUND', note);
    await this.whatsappSender.sendMessage(updated.phone, note);

    return updated;
  }
}
