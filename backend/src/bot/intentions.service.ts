export type Intent = 'FECHAS_CICLOS' | 'FECHAS_PAGO' | 'INSCRIPCION' | 'ADMISIONES' | 'RECLAMO' | 'DESCONOCIDA';

type IntentRule = {
  intent: Intent;
  regex: RegExp;
};

export class IntentionsService {
  private readonly rules: IntentRule[] = [
    { intent: 'RECLAMO', regex: /reclamo|queja|problema/ },
    { intent: 'FECHAS_PAGO', regex: /pago|matr[ií]cula|cuota|fecha de pago/ },
    { intent: 'INSCRIPCION', regex: /inscrib|registr|matricul|inscripción/ },
    { intent: 'ADMISIONES', regex: /admision|ingenier[ií]a|carrera|admisión/ },
    { intent: 'FECHAS_CICLOS', regex: /ciclo|inicio|fin|vigente|empieza|termina/ },
  ];

  // Clasifica el mensaje entrante según palabras clave y devuelve la intención correspondiente.
  detect(text: string): Intent {
    const normalized = text.toLowerCase().trim();
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
      RECLAMO: 'He abierto un caso de reclamo. Un agente lo revisará pronto.',
      DESCONOCIDA: 'Hola, soy el asistente de K Institute. Estas son mis opciones: fechas de ciclos, fechas de pago, inscripción, admisiones o reclamo.',
    };

    return responses[intent];
  }
}
