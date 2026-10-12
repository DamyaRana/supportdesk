import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { TicketsResolver } from './tickets.resolver';
import { TicketsService } from './tickets.service';

@Module({
  imports: [PrismaModule],
  providers: [TicketsResolver, TicketsService],
})
export class TicketsModule {}