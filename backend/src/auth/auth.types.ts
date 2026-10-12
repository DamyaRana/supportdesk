
import { Field, Int, ObjectType, registerEnumType } from '@nestjs/graphql';
import { UserRole } from '@prisma/client';

registerEnumType(UserRole, {
  name: 'UserRole',
});

@ObjectType()
export class AuthUser {
  @Field(() => Int)
  id: number;

  @Field()
  name: string;

  @Field()
  email: string;

  @Field(() => UserRole)
  role: UserRole;
}

@ObjectType()
export class AuthPayload {
  @Field()
  accessToken: string;

  @Field(() => AuthUser)
  user: AuthUser;
}
