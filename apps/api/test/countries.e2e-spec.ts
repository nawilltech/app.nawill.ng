import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { createTestApp } from './utils/test-app';
import { PrismaService } from '../src/modules/prisma/prisma.service';

describe('Countries & administrative divisions (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;

  beforeAll(async () => {
    ({ app, prisma } = await createTestApp());
  });

  afterAll(async () => {
    await app.close();
  });

  // Read-only against seeded reference data (§3 of docs/QA.md keeps countries/divisions
  // out of the per-test truncation list) — no beforeEach reset needed here.

  it('lists countries with a computed flag emoji, no stored flag column needed', async () => {
    const res = await request(app.getHttpServer()).get('/api/v1/countries?limit=5').expect(200);
    expect(res.body.data.length).toBeGreaterThan(0);
    expect(res.body.meta.limit).toBe(5);
    for (const country of res.body.data) {
      expect(country.flag).toMatch(/^[\u{1F1E6}-\u{1F1FF}]{2}$/u);
    }
  });

  it('retrieves Nigeria by id with full detail fields populated', async () => {
    const nigeria = await prisma.country.findUniqueOrThrow({ where: { iso2: 'NG' } });
    const res = await request(app.getHttpServer()).get(`/api/v1/countries/${nigeria.id}`).expect(200);

    expect(res.body.data.name).toBe('Nigeria');
    expect(res.body.data.capital).toBe('Abuja');
    expect(res.body.data.currencyCode).toBe('NGN');
    expect(res.body.data.flag).toBe('🇳🇬');
  });

  it('404s for an unknown country id', async () => {
    await request(app.getHttpServer())
      .get('/api/v1/countries/00000000-0000-0000-0000-000000000000')
      .expect(404);
  });

  it('returns Nigeria’s 37 tier-1 states, and Lagos’s LGAs as its children', async () => {
    const nigeria = await prisma.country.findUniqueOrThrow({ where: { iso2: 'NG' } });

    const statesRes = await request(app.getHttpServer())
      .get(`/api/v1/countries/${nigeria.id}/divisions?tier=1&limit=100`)
      .expect(200);
    expect(statesRes.body.data).toHaveLength(37);
    expect(statesRes.body.data.every((d: { tier: number }) => d.tier === 1)).toBe(true);

    const lagos = statesRes.body.data.find((d: { name: string }) => d.name === 'Lagos');
    expect(lagos).toBeDefined();
    expect(lagos.capital).toBe('Ikeja');

    const lgasRes = await request(app.getHttpServer()).get(`/api/v1/divisions/${lagos.id}/children?limit=50`).expect(200);
    expect(lgasRes.body.data).toHaveLength(20);
    expect(lgasRes.body.data.every((d: { tier: number; type: string }) => d.tier === 2 && d.type === 'LocalGovernmentArea')).toBe(
      true,
    );
    expect(lgasRes.body.data.map((d: { name: string }) => d.name)).toContain('Ikeja');
  });

  it('filters divisions by parentId via the same endpoint used for ?tier=', async () => {
    const nigeria = await prisma.country.findUniqueOrThrow({ where: { iso2: 'NG' } });
    const fct = await prisma.administrativeDivision.findFirstOrThrow({
      where: { countryId: nigeria.id, name: 'Federal Capital Territory' },
    });

    const res = await request(app.getHttpServer())
      .get(`/api/v1/countries/${nigeria.id}/divisions?parentId=${fct.id}`)
      .expect(200);

    expect(res.body.data).toHaveLength(6);
    expect(res.body.data.map((d: { name: string }) => d.name)).toContain('Abuja Municipal');
  });
});
