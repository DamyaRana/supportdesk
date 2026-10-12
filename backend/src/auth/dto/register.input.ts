
import { Field, InputType } from '@nestjs/graphql';
import { IsEmail, IsString, MaxLength, MinLength } from 'class-validator';

@InputType()
export class RegisterInput {
  @Field()
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  name: string;

  @Field()
  @IsEmail()
  @MaxLength(191)
  email: string;

  @Field()
  @IsString()
  @MinLength(8)
  @MaxLength(72)
  password: string;
}
