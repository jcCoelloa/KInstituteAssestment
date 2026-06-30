import { IntentionsService } from '../src/bot/intentions.service';

describe('IntentionsService', () => {
  let service: IntentionsService;

  beforeEach(() => {
    service = new IntentionsService();
  });

  it('detecta la intención de fechas de ciclos', () => {
    expect(service.detect('¿cuándo empieza el ciclo?')).toBe('FECHAS_CICLOS');
    expect(service.detect('qué fechas tiene el ciclo vigente')).toBe('FECHAS_CICLOS');
  });

  it('detecta la intención de fechas de pago', () => {
    expect(service.detect('¿qué fechas de pago hay?')).toBe('FECHAS_PAGO');
    expect(service.detect('cuando pago la matrícula')).toBe('FECHAS_PAGO');
  });

  it('detecta la intención de inscripción', () => {
    expect(service.detect('cómo me inscribo')).toBe('INSCRIPCION');
    expect(service.detect('quiero registrarme')).toBe('INSCRIPCION');
  });

  it('detecta la intención de admisiones', () => {
    expect(service.detect('información sobre admisión a ingeniería')).toBe('ADMISIONES');
    expect(service.detect('qué carreras hay')).toBe('ADMISIONES');
  });

  it('detecta la intención de reclamo', () => {
    expect(service.detect('quiero poner un reclamo')).toBe('RECLAMO');
    expect(service.detect('tengo un problema con mi matrícula')).toBe('RECLAMO');
  });

  it('usa fallback para mensajes desconocidos', () => {
    expect(service.detect('hola, ¿qué tal?')).toBe('DESCONOCIDA');
    expect(service.detect('')).toBe('DESCONOCIDA');
  });

  it('devuelve una respuesta adecuada para cada intención del catálogo', () => {
    expect(service.getResponse('FECHAS_CICLOS')).toContain('ciclo');
    expect(service.getResponse('FECHAS_PAGO')).toContain('pago');
    expect(service.getResponse('INSCRIPCION')).toContain('inscrib');
    expect(service.getResponse('ADMISIONES')).toContain('admision');
    expect(service.getResponse('RECLAMO')).toContain('reclamo');
    expect(service.getResponse('DESCONOCIDA')).toContain('Estas son mis opciones');
  });
});
