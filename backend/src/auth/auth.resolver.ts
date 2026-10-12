
import { Args, Mutation, Resolver } from '@nestjs/graphql';
import { AuthService } from './auth.service';
import { AuthPayload } from './auth.types';
import { RegisterInput } from './dto/register.input';
import { LoginInput } from './dto/login.input';
import { UseGuards } from '@nestjs/common';
import { Query, Context } from '@nestjs/graphql';
import { GqlAuthGuard } from './gql-auth.guard';
import { AuthUser } from './auth.types';
@Resolver()
export class AuthResolver {
  constructor(private readonly authService: AuthService) {}

  @Mutation(() => AuthPayload)
  register(@Args('input') input: RegisterInput) {
    return this.authService.register(input);
  }

  @Mutation(() => AuthPayload)
  login(@Args('input') input: LoginInput) {
    return this.authService.login(input);
  }

  @Query(() => AuthUser)
@UseGuards(GqlAuthGuard)
me(@Context() context: { req: { user: AuthUser } }) {
  return context.req.user;
}
}
