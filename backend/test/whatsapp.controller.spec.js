"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const globals_1 = require("@jest/globals");
const whatsapp_controller_1 = require("../src/bot/whatsapp.controller");
(0, globals_1.describe)('WhatsappController', () => {
    let controller;
    let casesService;
    let intentionsService;
    (0, globals_1.beforeEach)(() => {
        casesService = {
            createOrGetCase: globals_1.jest.fn(),
            addMessage: globals_1.jest.fn(),
        };
        intentionsService = {
            detect: globals_1.jest.fn(),
            getResponse: globals_1.jest.fn(),
        };
        controller = new whatsapp_controller_1.WhatsappController(casesService, intentionsService);
    });
    (0, globals_1.it)('devuelve un TwiML válido para un mensaje entrante', async () => {
        casesService.createOrGetCase.mockResolvedValue({ id: 42 });
        casesService.addMessage.mockResolvedValue(undefined);
        intentionsService.detect.mockReturnValue('RECLAMO');
        intentionsService.getResponse.mockReturnValue('He abierto un caso de reclamo.');
        const result = await controller.handleWebhook({
            Body: 'quiero un reclamo',
            From: 'whatsapp:+51999999999',
        });
        const createOrGetCaseMock = casesService.createOrGetCase;
        (0, globals_1.expect)(createOrGetCaseMock).toHaveBeenCalledWith('+51999999999', 'RECLAMO');
        (0, globals_1.expect)(result).toContain('<Response>');
        (0, globals_1.expect)(result).toContain('<Message>');
        (0, globals_1.expect)(result).toContain('He abierto un caso de reclamo.');
    });
});
//# sourceMappingURL=whatsapp.controller.spec.js.map