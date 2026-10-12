import { Field, InputType } from '@nestjs/graphql';
import {
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';
import { TicketPriority } from '@prisma/client';

@InputType()
export class CreateTicketInput {
  @Field()
  @IsString()
  @IsNotEmpty()
  @MaxLength(150)
  title: string;

  @Field()
  @IsString()
  @IsNotEmpty()
  @MaxLength(5000)
  description: string;

  @Field()
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  category: string;

}