import { PermissionAction, PrismaClient } from '@prisma/client';
import * as argon2 from 'argon2';
import { readdirSync, readFileSync } from 'fs';
import { join } from 'path';

const prisma = new PrismaClient();

const ROLES = ['super_admin', 'admin', 'project_manager', 'finance', 'support_agent', 'client'];

const PERMISSION_DOMAINS = [
  'users',
  'projects',
  'invoices',
  'payments',
  'wallets',
  'support',
  'blog',
  'services',
  'admin',
];

const TICKET_TYPES = [
  { name: 'Finance', description: 'Billing and finance-related issues' },
  { name: 'Technical', description: 'Domain, hosting, and technical issues' },
  { name: 'Billing', description: 'Failed payment or invoice discrepancy' },
];

// Seed of the service catalogue — Build/Consult/Talent commercial models mirror the
// three pillars on nawill.ng; Add-ons are recurring/one-off extras. See
// docs/ARCHITECTURE.md "services" table for the pillar/billingModel mapping.
const SERVICES = [
  { name: 'Website', pillar: 'build', type: 'core', billingModel: 'project', description: 'Marketing site or web presence build.' },
  { name: 'Web App', pillar: 'build', type: 'core', billingModel: 'project', description: 'Full web application build.' },
  { name: 'Mobile App', pillar: 'build', type: 'core', billingModel: 'project', description: 'iOS/Android mobile app build.' },
  { name: 'API/Backend', pillar: 'build', type: 'core', billingModel: 'project', description: 'Backend service or API build.' },
  { name: 'Product Validation Session', pillar: 'consult', type: 'core', billingModel: 'per_session', description: 'Market fit and feasibility consult session.' },
  { name: 'Tech Stack Advisory', pillar: 'consult', type: 'core', billingModel: 'per_session', description: 'Stack and architecture recommendation session.' },
  { name: 'Developer Placement', pillar: 'talent', type: 'core', billingModel: 'placement', description: 'Single vetted engineer placement.' },
  { name: 'Team Assembly', pillar: 'talent', type: 'core', billingModel: 'placement', description: 'Full team assembled from the vetted pool.' },
  { name: 'Web Hosting', pillar: 'addon', type: 'addon', billingModel: 'recurring', description: 'Managed hosting add-on.' },
  { name: 'Domain', pillar: 'addon', type: 'addon', billingModel: 'recurring', description: 'Domain registration/renewal add-on.' },
  { name: 'Site Maintenance', pillar: 'addon', type: 'addon', billingModel: 'recurring', description: 'Ongoing maintenance add-on.' },
  { name: 'API Integration', pillar: 'addon', type: 'addon', billingModel: 'project', description: 'Third-party API integration add-on.' },
] as const;

// A handful of real, Nawill-relevant starter articles so the Knowledge Base isn't
// empty on a fresh seed. There's no admin authoring UI yet (see docs/QA.md §7) —
// articles are managed here until that exists.
const KNOWLEDGE_BASE = [
  {
    name: 'Getting Started',
    slug: 'getting-started',
    description: 'Onboarding, your dashboard, and how engagements work.',
    icon: 'rocket',
    articles: [
      {
        title: 'How Nawill engagements work',
        slug: 'how-nawill-engagements-work',
        body: 'After signup, our team reviews your project brief and assigns an owner. You can track project phase, invoices, and support tickets from your dashboard at any time.',
      },
      {
        title: 'Understanding project phases',
        slug: 'understanding-project-phases',
        body: 'Projects move through four phases: pre_project (scoping), ongoing (active build), post_project (delivered), and maintenance (ongoing support). You can see the current phase on any project\'s detail page.',
      },
    ],
  },
  {
    name: 'Billing & Payments',
    slug: 'billing-payments',
    description: 'Invoices, wallet funding, and payment methods.',
    icon: 'credit-card',
    articles: [
      {
        title: 'How to fund your wallet',
        slug: 'how-to-fund-your-wallet',
        body: 'Go to Billing > Add Funds, enter an amount, and complete payment via the link provided. Your wallet balance updates automatically once payment is confirmed.',
      },
      {
        title: 'Paying an invoice',
        slug: 'paying-an-invoice',
        body: 'Open an invoice from Billing > Invoices and choose to pay from your wallet balance or via a payment link. You can download any invoice as a PDF at any time.',
      },
      {
        title: 'Understanding discounts and VAT on your invoice',
        slug: 'discounts-and-vat-on-your-invoice',
        body: 'Some invoices include a discount, applied before VAT, and/or VAT calculated on the discounted amount. Both are itemized separately from the line items on your invoice PDF.',
      },
    ],
  },
  {
    name: 'Account & Security',
    slug: 'account-security',
    description: 'Password, two-factor authentication, and email verification.',
    icon: 'shield',
    articles: [
      {
        title: 'Setting up two-factor authentication',
        slug: 'setting-up-two-factor-authentication',
        body: 'Go to Settings > Security and choose authenticator app or email codes. Once enabled, you\'ll be asked for a code at every login.',
      },
      {
        title: 'Verifying your email address',
        slug: 'verifying-your-email-address',
        body: 'Check your inbox for a verification email sent at signup. If you can\'t find it, use the "Resend verification email" banner on your dashboard.',
      },
    ],
  },
  {
    name: 'Support Tickets',
    slug: 'support-tickets',
    description: 'Raising, tracking, and closing support tickets.',
    icon: 'ticket',
    articles: [
      {
        title: 'Raising a support ticket',
        slug: 'raising-a-support-ticket',
        body: 'Go to Support > Tickets > New ticket, choose a type and priority, and describe your issue. Our team replies directly on the ticket.',
      },
      {
        title: 'Closing your own ticket',
        slug: 'closing-your-own-ticket',
        body: 'If your issue is resolved, open the ticket and select "Close ticket." You can always raise a new one if the issue comes back.',
      },
    ],
  },
] as const;

const SEED_DATA_DIR = join(__dirname, 'seed-data');

interface CountrySeed {
  name: string;
  officialName: string | null;
  iso2: string;
  iso3: string;
  numericCode: string | null;
  dialCode: string;
  capital: string | null;
  timezone: string | null;
  region: string | null;
  subregion: string | null;
  currencyCode: string;
  currencyName: string | null;
  currencySymbol: string | null;
}

interface DivisionNode {
  name: string;
  capital?: string;
  code?: string;
  children?: DivisionNode[];
}

interface DivisionTreeSeed {
  countryIso2: string;
  tiers: { tier: number; type: string }[];
  divisions: DivisionNode[];
}

async function seedRoles() {
  for (const name of ROLES) {
    await prisma.role.upsert({ where: { name }, update: {}, create: { name } });
  }
}

async function seedPermissions() {
  for (const domain of PERMISSION_DOMAINS) {
    for (const action of Object.values(PermissionAction)) {
      await prisma.permission.upsert({
        where: { domain_action: { domain, action } },
        update: {},
        create: { domain, action },
      });
    }
  }
}

async function seedTicketTypes() {
  for (const t of TICKET_TYPES) {
    await prisma.ticketType.upsert({ where: { name: t.name }, update: {}, create: t });
  }
}

async function seedServices() {
  for (const s of SERVICES) {
    await prisma.service.upsert({ where: { name: s.name }, update: s, create: s });
  }
}

async function seedKnowledgeBase() {
  for (const category of KNOWLEDGE_BASE) {
    const { articles, ...categoryData } = category;
    const savedCategory = await prisma.knowledgeBaseCategory.upsert({
      where: { slug: categoryData.slug },
      update: categoryData,
      create: categoryData,
    });

    for (const article of articles) {
      await prisma.knowledgeBaseArticle.upsert({
        where: { slug: article.slug },
        update: { ...article, categoryId: savedCategory.id },
        create: { ...article, categoryId: savedCategory.id },
      });
    }
  }
}

async function seedMockProcessor() {
  await prisma.paymentProcessor.upsert({
    where: { id: '00000000-0000-0000-0000-000000000001' },
    update: {},
    create: {
      id: '00000000-0000-0000-0000-000000000001',
      name: 'mock',
      isDefault: true,
      processorStatus: 'active',
      configEncrypted: {},
    },
  });
}

async function seedSuperAdmin() {
  const email = process.env.SUPER_ADMIN_EMAIL;
  const password = process.env.SUPER_ADMIN_PASSWORD;
  if (!email || !password) {
    console.warn('SUPER_ADMIN_EMAIL/SUPER_ADMIN_PASSWORD not set — skipping super-admin seed');
    return;
  }

  const passwordHash = await argon2.hash(password);
  const admin = await prisma.user.upsert({
    where: { email },
    update: { passwordHash, userType: 'admin' },
    create: { name: 'Super Admin', email, passwordHash, userType: 'admin' },
  });

  const superAdminRole = await prisma.role.findUniqueOrThrow({ where: { name: 'super_admin' } });
  await prisma.userRole.upsert({
    where: { userId_roleId: { userId: admin.id, roleId: superAdminRole.id } },
    update: {},
    create: { userId: admin.id, roleId: superAdminRole.id },
  });
}

/** Reads every prisma/seed-data/*.json that isn't a divisions file and upserts it as a country. */
async function seedCountries() {
  const countries: CountrySeed[] = JSON.parse(readFileSync(join(SEED_DATA_DIR, 'countries.json'), 'utf-8'));
  for (const c of countries) {
    await prisma.country.upsert({ where: { iso2: c.iso2 }, update: c, create: c });
  }
  return countries.length;
}

/**
 * Recursively upserts a division tree by (countryId, parentId, name) — safe to
 * re-run, and each level's `type` comes from the file's `tiers` map rather than
 * being hardcoded, so a country with 4 tiers works exactly like one with 2.
 */
async function upsertDivisionNodes(
  countryId: string,
  tierTypes: Map<number, string>,
  nodes: DivisionNode[],
  parentId: string | null,
  tier: number,
): Promise<void> {
  const type = tierTypes.get(tier) ?? `Tier${tier}`;

  for (const node of nodes) {
    // A plain findFirst + create/update, rather than upsert() on the compound unique
    // index, since Prisma's generated WhereUniqueInput doesn't accept `parentId: null`
    // even though the column is nullable — this sidesteps that entirely.
    const existing = await prisma.administrativeDivision.findFirst({
      where: { countryId, parentId, name: node.name },
    });
    const data = { type, tier, capital: node.capital ?? null, code: node.code ?? null };
    const division = existing
      ? await prisma.administrativeDivision.update({ where: { id: existing.id }, data })
      : await prisma.administrativeDivision.create({ data: { ...data, countryId, parentId, name: node.name } });

    if (node.children?.length) {
      await upsertDivisionNodes(countryId, tierTypes, node.children, division.id, tier + 1);
    }
  }
}

/**
 * Dynamic by design: every `*-divisions.json` in prisma/seed-data/ is loaded and
 * seeded automatically — adding a country's hierarchy later is "drop a file in this
 * folder", not "write a new seed function". See docs/ARCHITECTURE.md §7.9.
 */
async function seedDivisions() {
  const files = readdirSync(SEED_DATA_DIR).filter((f) => f.endsWith('-divisions.json'));
  let seededCountries = 0;

  for (const file of files) {
    const data: DivisionTreeSeed = JSON.parse(readFileSync(join(SEED_DATA_DIR, file), 'utf-8'));
    const country = await prisma.country.findUnique({ where: { iso2: data.countryIso2 } });
    if (!country) {
      console.warn(`Skipping ${file}: no country seeded with iso2=${data.countryIso2}`);
      continue;
    }

    const tierTypes = new Map(data.tiers.map((t) => [t.tier, t.type]));
    await upsertDivisionNodes(country.id, tierTypes, data.divisions, null, 1);
    seededCountries += 1;
  }

  return seededCountries;
}

async function main() {
  await seedRoles();
  await seedPermissions();
  await seedTicketTypes();
  await seedServices();
  await seedKnowledgeBase();
  await seedMockProcessor();
  await seedSuperAdmin();

  const countryCount = await seedCountries();
  const divisionTreeCount = await seedDivisions();
  console.log(`Seeded ${countryCount} countries and division trees for ${divisionTreeCount} of them.`);
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
