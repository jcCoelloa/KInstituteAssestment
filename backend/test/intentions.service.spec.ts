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
    ['1', 'FECHAS_CICLOS'],
    ['2', 'FECHAS_PAGO'],
    ['3', 'INSCRIPCION'],
    ['4', 'ADMISIONES'],
    ['5', 'RECLAMO'],
    ['0', 'DESCONOCIDA'],
    ['6', 'DESCONOCIDA'],
    ['1 ', 'FECHAS_CICLOS'],
  ])('detecta "%s" como %s', (message, expectedIntent) => {
    expect(service.detect(message)).toBe(expectedIntent);
  });

  it('detecta intenciones incluso con textos que incluyen acentos', () => {
    expect(service.detect('quiero hacer mi inscripción')).toBe('INSCRIPCION');
    expect(service.detect('información sobre admisión')).toBe('ADMISIONES');
  });

  it.each([
    ['estado 42', 42],
    ['estado #42', 42],
    ['consultar caso 7', 7],
    ['caso #103', 103],
  ])('detecta consulta de estado en "%s"', (message, expectedNumber) => {
    expect(service.detectStatusQuery(message)).toBe(expectedNumber);
  });

  it.each([['quiero un reclamo'], ['hola, ¿qué tal?'], ['']])(
    'no interpreta "%s" como consulta de estado',
    (message) => {
      expect(service.detectStatusQuery(message)).toBeNull();
    },
  );

  it.each([
    ['sí', 'MENU'],
    ['si', 'MENU'],
    ['SÍ', 'MENU'],
    ['no', 'END'],
    ['NO.', 'END'],
  ])('interpreta "%s" como opción de cierre %s', (message, expected) => {
    expect(service.detectFollowUpChoice(message)).toBe(expected);
  });

  it.each([['no gracias'], ['quiero un reclamo'], ['']])(
    'no interpreta "%s" como opción de cierre',
    (message) => {
      expect(service.detectFollowUpChoice(message)).toBeNull();
    },
  );

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

  it('el menú de opciones es una lista numerada', () => {
    const menu = service.getResponse('DESCONOCIDA');

    expect(menu).toContain('1) Fechas de ciclos');
    expect(menu).toContain('2) Fechas de pago');
    expect(menu).toContain('3) Inscripción');
    expect(menu).toContain('4) Admisiones');
    expect(menu).toContain('5) Reclamo');
  });
});
