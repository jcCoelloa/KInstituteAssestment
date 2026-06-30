export type Intent = 'FECHAS_CICLOS' | 'FECHAS_PAGO' | 'INSCRIPCION' | 'ADMISIONES' | 'RECLAMO' | 'DESCONOCIDA';

export class IntentionsService {
  // Clasifica el mensaje entrante según palabras clave y devuelve la intención correspondiente.
  detect(text: string): Intent {
    const normalized = text.toLowerCase().trim();

    if (/reclamo|queja|problema/.test(normalized)) {
      return 'RECLAMO';
    }

    if (/pago|matr[ií]cula|cuota|fecha de pago/.test(normalized)) {
      return 'FECHAS_PAGO';
    }

    if (/inscrib|registr|matricul/.test(normalized)) {
      return 'INSCRIPCION';
    }

    if (/admision|ingenier[ií]a|carrera/.test(normalized)) {
      return 'ADMISIONES';
    }

    if (/ciclo|inicio|fin|vigente|empieza|termina/.test(normalized)) {
      return 'FECHAS_CICLOS';
    }

    return 'DESCONOCIDA';
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
