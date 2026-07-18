import { Controller, Get, Param, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { CountriesService } from './countries.service';
import { Public } from '../../common/decorators/public.decorator';
import { CursorPaginationDto } from '../../common/dto/pagination.dto';
import { ok, paginatedFrom } from '../../common/dto/service-result';

@ApiTags('countries')
@Controller('divisions')
export class DivisionsController {
  constructor(private readonly countriesService: CountriesService) {}

  @Public()
  @Get(':id')
  async getById(@Param('id') id: string) {
    const result = await this.countriesService.getDivisionById(id);
    return ok(result, 'Administrative division retrieved successfully');
  }

  /** e.g. pass a state's id to get its LGAs, or an LGA's id to get its wards. */
  @Public()
  @Get(':id/children')
  async getChildren(@Param('id') id: string, @Query() query: CursorPaginationDto) {
    const page = await this.countriesService.getDivisionChildren(id, query);
    return paginatedFrom(page, query.limit, 'Child divisions retrieved successfully');
  }
}
