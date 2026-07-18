import { Module } from '@nestjs/common';
import { UsersController } from './users.controller';
import { OrganizationsController } from './organizations.controller';
import { KycController } from './kyc.controller';
import { UsersService } from './users.service';

@Module({
  controllers: [UsersController, OrganizationsController, KycController],
  providers: [UsersService],
  exports: [UsersService],
})
export class UsersModule {}
