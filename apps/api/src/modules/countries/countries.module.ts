import { Module } from '@nestjs/common';
import { CountriesController } from './countries.controller';
import { DivisionsController } from './divisions.controller';
import { CountriesService } from './countries.service';

@Module({
  controllers: [CountriesController, DivisionsController],
  providers: [CountriesService],
})
export class CountriesModule {}
