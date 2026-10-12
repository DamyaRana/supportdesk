
import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { Prisma, UserRole, TicketPriority } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateTicketInput } from './dto/create-ticket.input';
import { UpdateTicketInput } from './dto/update-ticket.input';
import { Ticket } from './models/ticket.model';

export interface AuthenticatedUser {
  id: number;
  role: UserRole;
}

@Injectable()
export class TicketsService {
  private readonly logger = new Logger(TicketsService.name);

  constructor(private readonly prisma: PrismaService) {}

  
async create(
  input: CreateTicketInput,
  user: AuthenticatedUser,
): Promise<Ticket> {
  return this.prisma.ticket.create({
    data: {
      title: input.title.trim(),
      description: input.description.trim(),
      category: input.category.trim(),
      priority: TicketPriority.MEDIUM,
      createdById: user.id,
    },
  });
}


  async findAll(user: AuthenticatedUser): Promise<Ticket[]> {
    return this.prisma.ticket.findMany({
      where:
        user.role === UserRole.ADMIN
          ? {}
          : { createdById: user.id },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(
    id: number,
    user: AuthenticatedUser,
  ): Promise<Ticket> {
    const ticket = await this.prisma.ticket.findUnique({
      where: { id },
    });

    if (!ticket) {
      throw new NotFoundException(
        `Ticket with ID ${id} was not found.`,
      );
    }

    this.assertCanAccess(ticket.createdById, user);

    return ticket;
  }

  async update(
    input: UpdateTicketInput,
    user: AuthenticatedUser,
  ): Promise<Ticket> {
    const { id, ...fields } = input;

    const existingTicket = await this.prisma.ticket.findUnique({
      where: { id },
      select: { id: true, createdById: true },
    });

    if (!existingTicket) {
      throw new NotFoundException(
        `Ticket with ID ${id} was not found.`,
      );
    }

    this.assertCanAccess(existingTicket.createdById, user);

    if (
      user.role !== UserRole.ADMIN &&
      (fields.status !== undefined || fields.priority !== undefined)
    ) {
      throw new ForbiddenException(
        'Only the admin can change ticket status or priority.',
      );
    }

    const data: Prisma.TicketUpdateInput = {};

    if (fields.title !== undefined) {
      data.title = fields.title.trim();
    }

    if (fields.description !== undefined) {
      data.description = fields.description.trim();
    }

    if (fields.category !== undefined) {
      data.category = fields.category.trim();
    }

    if (fields.priority !== undefined) {
      data.priority = fields.priority;
    }

    if (fields.status !== undefined) {
      data.status = fields.status;
    }

    try {
      return await this.prisma.ticket.update({
        where: { id },
        data,
      });
    } catch (error: unknown) {
      this.handlePrismaError(error, 'update');
    }
  }

  async remove(
    id: number,
    user: AuthenticatedUser,
  ): Promise<Ticket> {
    const existingTicket = await this.prisma.ticket.findUnique({
      where: { id },
      select: { id: true, createdById: true },
    });

    if (!existingTicket) {
      throw new NotFoundException(
        `Ticket with ID ${id} was not found.`,
      );
    }

    this.assertCanAccess(existingTicket.createdById, user);

    try {
      return await this.prisma.ticket.delete({
        where: { id },
      });
    } catch (error: unknown) {
      this.handlePrismaError(error, 'delete');
    }
  }

  private assertCanAccess(
    createdById: number | null,
    user: AuthenticatedUser,
  ): void {
    if (
      user.role !== UserRole.ADMIN &&
      createdById !== user.id
    ) {
      // Don't reveal whether another user's ticket exists.
      throw new NotFoundException('Ticket not found.');
    }
  }

  private handlePrismaError(
    error: unknown,
    operation: 'update' | 'delete',
  ): never {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === 'P2025'
    ) {
      throw new NotFoundException(
        'The ticket does not exist or has already been removed.',
      );
    }

    this.logger.error(
      `Ticket ${operation} failed.`,
      error instanceof Error ? error.stack : undefined,
    );

    throw new InternalServerErrorException(
      'The ticket operation could not be completed.',
    );
  }
}
