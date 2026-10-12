import { Field, ID, ObjectType, registerEnumType } from '@nestjs/graphql';
import { TicketPriority, TicketStatus } from '@prisma/client';

registerEnumType(TicketPriority, {
  name: 'TicketPriority',
});

registerEnumType(TicketStatus, {
  name: 'TicketStatus',
});

@ObjectType()
export class Ticket {
  @Field(() => ID)
  id: number;

  @Field()
  title: string;

  @Field()
  description: string;

  @Field()
  category: string;

  @Field(() => TicketPriority)
  priority: TicketPriority;

  @Field(() => TicketStatus)
  status: TicketStatus;

  @Field()
  createdAt: Date;

  @Field()
  updatedAt: Date;
}