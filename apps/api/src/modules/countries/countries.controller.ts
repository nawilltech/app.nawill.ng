import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { CountriesService } from './countries.service';
import { CreateCountryDto } from './dto/create-country.dto';
import { CreateDivisionDto } from './dto/create-division.dto';
import { ListDivisionsDto } from './dto/list-divisions.dto';
import { Public } from '../../common/decorators/public.decorator';
import { Roles } from '../rbac/roles.decorator';
import { CursorPaginationDto } from '../../common/dto/pagination.dto';
import { ok, paginatedFrom } from '../../common/dto/service-result';

@ApiTags('countries')
@Controller('countries')
export class CountriesController {
  constructor(private readonly countriesService: CountriesService) {}

  @Public()
  @Get()
  async list(@Query() query: CursorPaginationDto) {
    const page = await this.countriesService.list(query);
    return paginatedFrom(page, query.limit, 'Countries retrieved successfully');
  }

  @Public()
  @Get(':id')
  async getById(@Param('id') id: string) {
    const result = await this.countriesService.getById(id);
    return ok(result, 'Country retrieved successfully');
  }

  @Roles('admin')
  @Post()
  async create(@Body() dto: CreateCountryDto) {
    const result = await this.countriesService.create(dto);
    return ok(result, 'Country created successfully');
  }

  @Public()
  @Get(':id/divisions')
  async listDivisions(@Param('id') id: string, @Query() query: ListDivisionsDto) {
    const page = await this.countriesService.listDivisions(id, query);
    return paginatedFrom(page, query.limit, 'Administrative divisions retrieved successfully');
  }

  @Roles('admin')
  @Post(':id/divisions')
  async createDivision(@Param('id') id: string, @Body() dto: CreateDivisionDto) {
    const result = await this.countriesService.createDivision(id, dto);
    return ok(result, 'Administrative division created successfully');
  }
}
