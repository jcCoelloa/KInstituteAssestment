import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';

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
  constructor(private readonly prisma: PrismaService) {}

  private getCaseDefaults(intent: string): CaseDefaults {
    return CASE_DEFAULTS_BY_INTENT[intent] ?? CASE_DEFAULTS_BY_INTENT.DEFAULT;
  }

  // Crea un caso nuevo o reutiliza el existente para el mismo número de teléfono.
  async createOrGetCase(phone: string, intent: string) {
    let existing = await this.prisma.case.findFirst({
      where: { phone },
      orderBy: { updatedAt: 'desc' },
    });

    if (!existing) {
      const defaults = this.getCaseDefaults(intent);

      existing = await this.prisma.case.create({
        data: {
          phone,
          type: defaults.type,
          status: defaults.status,
          intent,
        },
      });
    }

    return existing;
  }

  // Guarda un mensaje del hilo de conversación en el caso correspondiente.
  async addMessage(caseId: number, direction: string, text: string) {
    return this.prisma.message.create({
      data: {
        caseId,
        direction,
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

  // Actualiza el estado de un caso para reflejar el avance del seguimiento.
  async updateStatus(id: number, status: string) {
    return this.prisma.case.update({
      where: { id },
      data: { status },
    });
  }
}
