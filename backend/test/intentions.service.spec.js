"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const globals_1 = require("@jest/globals");
const intentions_service_1 = require("../src/bot/intentions.service");
(0, globals_1.describe)('IntentionsService', () => {
    let service;
    (0, globals_1.beforeEach)(() => {
        service = new intentions_service_1.IntentionsService();
    });
    globals_1.it.each([
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
        (0, globals_1.expect)(service.detect(message)).toBe(expectedIntent);
    });
    (0, globals_1.it)('detecta intenciones incluso con textos que incluyen acentos', () => {
        (0, globals_1.expect)(service.detect('quiero hacer mi inscripción')).toBe('INSCRIPCION');
        (0, globals_1.expect)(service.detect('información sobre admisión')).toBe('ADMISIONES');
    });
    globals_1.it.each([
        ['FECHAS_CICLOS', 'ciclo'],
        ['FECHAS_PAGO', 'pago'],
        ['INSCRIPCION', 'inscrib'],
        ['ADMISIONES', 'admision'],
        ['RECLAMO', 'reclamo'],
        ['DESCONOCIDA', 'Estas son mis opciones'],
    ])('devuelve una respuesta adecuada para %s', (intent, expectedFragment) => {
        (0, globals_1.expect)(service.getResponse(intent)).toContain(expectedFragment);
    });
});
//# sourceMappingURL=intentions.service.spec.js.map