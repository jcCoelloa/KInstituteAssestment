export type Intent = 'FECHAS_CICLOS' | 'FECHAS_PAGO' | 'INSCRIPCION' | 'ADMISIONES' | 'RECLAMO' | 'DESCONOCIDA';

type IntentRule = {
  intent: Intent;
  regex: RegExp;
};

const DIGIT_INTENTS: Record<string, Intent> = {
  '1': 'FECHAS_CICLOS',
  '2': 'FECHAS_PAGO',
  '3': 'INSCRIPCION',
  '4': 'ADMISIONES',
  '5': 'RECLAMO',
};

export class IntentionsService {
  private readonly rules: IntentRule[] = [
    { intent: 'RECLAMO', regex: /reclamo|queja|problema/ },
    { intent: 'FECHAS_PAGO', regex: /pago|matr[ií]cula|cuota|fecha de pago/ },
    { intent: 'INSCRIPCION', regex: /inscrib|registr|matricul|inscripción/ },
    { intent: 'ADMISIONES', regex: /admision|ingenier[ií]a|carrera|admisión/ },
    { intent: 'FECHAS_CICLOS', regex: /ciclo|inicio|fin|vigente|empieza|termina/ },
  ];

  // Detecta una consulta de estado ("estado 42", "caso #42") y devuelve el número de caso, o null.
  detectStatusQuery(text: string): number | null {
    const match = text.match(/(?:estado|consult\w*|caso)[^\d]*#?\s*(\d+)/i);
    return match ? Number(match[1]) : null;
  }

  // Interpreta la respuesta al cierre de conversación: SÍ abre el menú, NO la termina.
  detectFollowUpChoice(text: string): 'MENU' | 'END' | null {
    const normalized = text
      .toLowerCase()
      .normalize('NFD')
      .replace(/[̀-ͯ]/g, '')
      .replace(/[.!?¡¿]/g, '')
      .trim();

    if (normalized === 'si') return 'MENU';
    if (normalized === 'no') return 'END';
    return null;
  }

  // Clasifica el mensaje entrante según su número de opción o palabras clave.
  detect(text: string): Intent {
    const normalized = text.toLowerCase().trim();
    if (DIGIT_INTENTS[normalized]) return DIGIT_INTENTS[normalized];

    const matchedRule = this.rules.find(({ regex }) => regex.test(normalized));

    return matchedRule?.intent ?? 'DESCONOCIDA';
  }

  // Devuelve el mensaje de respuesta que se enviará al usuario según la intención detectada.
  getResponse(intent: Intent): string {
    const responses: Record<Intent, string> = {
      FECHAS_CICLOS: 'El ciclo vigente inicia el 1 de marzo y termina el 31 de julio.',
      FECHAS_PAGO: 'Las fechas de pago de matrícula son: 10 de marzo y 15 de abril.',
      INSCRIPCION: 'Puedes inscribirte enviando tus documentos y completando el formulario de admisión.',
      ADMISIONES: 'Las admisiones para ingeniería están abiertas; contáctanos al soporte para más información.',
      RECLAMO: '¿Qué pasó? Cuéntame los detalles de tu reclamo.',
      DESCONOCIDA:
        'Hola, soy el asistente de K Institute. Estas son mis opciones:\n1) Fechas de ciclos\n2) Fechas de pago\n3) Inscripción\n4) Admisiones\n5) Reclamo\n\nResponde con el número o el nombre de la opción que necesitas.',
    };

    return responses[intent];
  }
}
