
import {
  Args,
  ID,
  Mutation,
  Query,
  Resolver,
} from '@nestjs/graphql';
import {
  BadRequestException,
  UseGuards,
} from '@nestjs/common';

import { TicketsService } from './tickets.service';
import type { AuthenticatedUser } from './tickets.service';
import { Ticket } from './models/ticket.model';
import { CreateTicketInput } from './dto/create-ticket.input';
import { UpdateTicketInput } from './dto/update-ticket.input';
import { GqlAuthGuard } from '../auth/gql-auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';

@Resolver(() => Ticket)
@UseGuards(GqlAuthGuard)
export class TicketsResolver {
  constructor(private readonly ticketsService: TicketsService) {}

  @Mutation(() => Ticket)
  createTicket(
    @Args('input') input: CreateTicketInput,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<Ticket> {
    return this.ticketsService.create(input, user);
  }

  @Query(() => [Ticket])
  tickets(
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<Ticket[]> {
    return this.ticketsService.findAll(user);
  }

  @Query(() => Ticket)
  ticket(
    @Args('id', { type: () => ID }) id: string,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<Ticket> {
    const ticketId = Number(id);

    if (!Number.isSafeInteger(ticketId) || ticketId < 1) {
      throw new BadRequestException(
        'Ticket ID must be a positive integer.',
      );
    }

    return this.ticketsService.findOne(ticketId, user);
  }

  @Mutation(() => Ticket)
  updateTicket(
    @Args('input') input: UpdateTicketInput,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<Ticket> {
    return this.ticketsService.update(input, user);
  }

  @Mutation(() => Ticket)
  deleteTicket(
    @Args('id', { type: () => ID }) id: string,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<Ticket> {
    const ticketId = Number(id);

    if (!Number.isSafeInteger(ticketId) || ticketId < 1) {
      throw new BadRequestException(
        'Ticket ID must be a positive integer.',
      );
    }

    return this.ticketsService.remove(ticketId, user);
  }
}
