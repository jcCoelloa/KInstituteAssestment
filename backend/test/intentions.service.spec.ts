import { beforeEach, describe, expect, it } from '@jest/globals';
import { Intent, IntentionsService } from '../src/bot/intentions.service';

describe('IntentionsService', () => {
  let service: IntentionsService;

  beforeEach(() => {
    service = new IntentionsService();
  });

  it.each([
    ['¿cuándo empieza el ciclo?', 'FECHAS_CICLOS'],
    ['qué fechas tiene el ciclo vigente', 'FECHAS_CICLOS'],
    ['¿qué fechas de pago hay?', 'FECHAS_PAGO'],
    ['cuando pago la matrícula', 'FECHAS_PAGO'],
    ['cómo me inscribo', 'INSCRIPCION'],
    ['quiero registrarme', 'INSCRIPCION'],
    ['información sobre admisión a ingeniería', 'ADMISIONES'],
    ['qué carreras hay', 'ADMISIONES'],
    ['quiero poner un reclamo', 'RECLAMO'],
    ['tengo un problema con mi matrícula', 'RECLAMO'],
    ['hola, ¿qué tal?', 'DESCONOCIDA'],
    ['', 'DESCONOCIDA'],
  ])('detecta "%s" como %s', (message, expectedIntent) => {
    expect(service.detect(message)).toBe(expectedIntent);
  });

  it('detecta intenciones incluso con textos que incluyen acentos', () => {
    expect(service.detect('quiero hacer mi inscripción')).toBe('INSCRIPCION');
    expect(service.detect('información sobre admisión')).toBe('ADMISIONES');
  });

  it.each([
    ['FECHAS_CICLOS', 'ciclo'],
    ['FECHAS_PAGO', 'pago'],
    ['INSCRIPCION', 'inscrib'],
    ['ADMISIONES', 'admision'],
    ['RECLAMO', 'reclamo'],
    ['DESCONOCIDA', 'Estas son mis opciones'],
  ])('devuelve una respuesta adecuada para %s', (intent, expectedFragment) => {
    expect(service.getResponse(intent as Intent)).toContain(expectedFragment);
  });
});
