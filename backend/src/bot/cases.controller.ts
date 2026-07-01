import { Body, Controller, Get, Param, Patch } from '@nestjs/common';
import { CasesService } from './cases.service';

@Controller('cases')
export class CasesController {
  constructor(private readonly casesService: CasesService) {}

  @Get()
  list() {
    return this.casesService.listCases();
  }

  @Get(':id')
  get(@Param('id') id: string) {
    return this.casesService.getCaseById(Number(id));
  }

  @Patch(':id/status')
  updateStatus(@Param('id') id: string, @Body('status') status: string) {
    return this.casesService.updateStatus(Number(id), status);
  }
}
