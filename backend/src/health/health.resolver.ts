import { Resolver, Query } from '@nestjs/graphql';

@Resolver()
export class HealthResolver {
  @Query(() => String)
  healthCheck(): string {
    return 'SupportDesk API is running!';
  }
}