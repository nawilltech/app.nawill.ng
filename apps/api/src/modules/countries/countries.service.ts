import { Injectable, NotFoundException } from '@nestjs/common';
import { Country } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { flagEmoji } from '../../common/util/flag-emoji';
import { CreateCountryDto } from './dto/create-country.dto';
import { CreateDivisionDto } from './dto/create-division.dto';
import { ListDivisionsDto } from './dto/list-divisions.dto';
import { CursorPaginationDto, cursorArgs, sliceCursorPage } from '../../common/dto/pagination.dto';

function withFlag<T extends Country>(country: T) {
  return { ...country, flag: flagEmoji(country.iso2) };
}

@Injectable()
export class CountriesService {
  constructor(private readonly prisma: PrismaService) {}

  async list(query: CursorPaginationDto) {
    const rows = await this.prisma.country.findMany({
      where: { deletedAt: null },
      orderBy: [{ name: 'asc' }, { id: 'asc' }],
      ...cursorArgs(query),
    });
    const { items, nextCursor } = sliceCursorPage(rows, query.limit);
    return { items: items.map(withFlag), nextCursor };
  }

  async getById(id: string) {
    const country = await this.prisma.country.findFirst({ where: { id, deletedAt: null } });
    if (!country) throw new NotFoundException('Country not found');
    return withFlag(country);
  }

  async create(dto: CreateCountryDto) {
    const country = await this.prisma.country.create({ data: dto });
    return withFlag(country);
  }

  async listDivisions(countryId: string, query: ListDivisionsDto) {
    await this.getById(countryId); // 404s if the country doesn't exist

    const rows = await this.prisma.administrativeDivision.findMany({
      where: {
        countryId,
        deletedAt: null,
        ...(query.tier !== undefined ? { tier: query.tier } : {}),
        // Explicit `?parentId=` filters to that parent's children; omitting it
        // (rather than defaulting to "top level only") returns divisions across all
        // tiers for the country, which combined with `?tier=` covers both use cases
        // from a single endpoint — see docs/TECHNICAL.md §2.6 hierarchy notes.
        ...(query.parentId !== undefined ? { parentId: query.parentId } : {}),
      },
      orderBy: [{ tier: 'asc' }, { name: 'asc' }, { id: 'asc' }],
      ...cursorArgs(query),
    });
    return sliceCursorPage(rows, query.limit);
  }

  async createDivision(countryId: string, dto: CreateDivisionDto) {
    await this.getById(countryId);
    if (dto.parentId) {
      await this.getDivisionById(dto.parentId);
    }
    return this.prisma.administrativeDivision.create({
      data: {
        countryId,
        parentId: dto.parentId,
        tier: dto.tier,
        type: dto.type,
        name: dto.name,
        capital: dto.capital,
        code: dto.code,
      },
    });
  }

  async getDivisionById(id: string) {
    const division = await this.prisma.administrativeDivision.findFirst({ where: { id, deletedAt: null } });
    if (!division) throw new NotFoundException('Administrative division not found');
    return division;
  }

  async getDivisionChildren(id: string, query: CursorPaginationDto) {
    await this.getDivisionById(id); // 404s if the parent doesn't exist

    const rows = await this.prisma.administrativeDivision.findMany({
      where: { parentId: id, deletedAt: null },
      orderBy: [{ name: 'asc' }, { id: 'asc' }],
      ...cursorArgs(query),
    });
    return sliceCursorPage(rows, query.limit);
  }
}
