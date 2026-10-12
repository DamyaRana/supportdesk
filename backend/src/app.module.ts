import { Module } from '@nestjs/common';
import { GraphQLModule } from '@nestjs/graphql';
import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo';
import { join } from 'path';
import { HealthModule } from './health/health.module';
import { PrismaModule } from './prisma/prisma.module';
import { TicketsModule } from './tickets/tickets.module';
import { AuthModule } from './auth/auth.module';
import { ConfigModule } from '@nestjs/config';
import type { Request, Response } from 'express';
@Module({
  imports: [
    GraphQLModule.forRoot<ApolloDriverConfig>({
      driver: ApolloDriver,
      autoSchemaFile: join(process.cwd(), 'src/schema.gql'),
      sortSchema: true,
      context: (ctx: { req: Request; res: Response }) => ({
  req: ctx.req,
  res: ctx.res,
}),
    }),
    ConfigModule.forRoot({ isGlobal: true }),
    HealthModule,
    PrismaModule,
    TicketsModule,
    AuthModule,
  ],
})
export class AppModule {}