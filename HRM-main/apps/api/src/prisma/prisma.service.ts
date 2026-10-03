import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { PrismaClient } from "@prisma/client";

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit {
  private readonly logger = new Logger('PrismaService');
  
  constructor() {
    super();
  }

  async onModuleInit() {
    try {
      this.logger.log('Connecting to Prisma...');
      await this.$connect();
      this.logger.log('Prisma connected successfully');
    } catch (e) {
      this.logger.error(`Prisma connection error: ${e}`);
    }
  }
}
