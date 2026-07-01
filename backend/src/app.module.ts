import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma.module';
import { CasesController } from './bot/cases.controller';
import { WhatsappController } from './bot/whatsapp.controller';
import { CasesService } from './bot/cases.service';
import { IntentionsService } from './bot/intentions.service';
import { WhatsappSenderService } from './bot/whatsapp-sender.service';
import { ConversationStateService } from './bot/conversation-state.service';

@Module({
  imports: [PrismaModule],
  controllers: [AppController, CasesController, WhatsappController],
  providers: [AppService, CasesService, IntentionsService, WhatsappSenderService, ConversationStateService],
})
export class AppModule {}
