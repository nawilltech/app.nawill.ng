import { PrismaService } from '../../src/modules/prisma/prisma.service';

/**
 * Truncates every business/transactional table between tests, leaving the seeded
 * reference data (countries, administrative_divisions, roles, permissions,
 * ticket_types, payment_processors, services) untouched — see docs/QA.md §3.
 */
const TABLES_TO_TRUNCATE = [
  'referral_commissions',
  'referrals',
  'referral_codes',
  'audit_logs',
  'ticket_messages',
  'support_tickets',
  'bank_accounts',
  'wallet_transactions',
  'wallets',
  'payment_notifications',
  'payments',
  'invoice_items',
  'invoices',
  'project_status_requests',
  'project_changes',
  'project_milestones',
  'projects',
  'project_inquiries',
  'user_roles',
  'kyc_documents',
  'users',
  'organizations',
];

export async function resetDb(prisma: PrismaService): Promise<void> {
  const quoted = TABLES_TO_TRUNCATE.map((t) => `"${t}"`).join(', ');
  await prisma.$executeRawUnsafe(`TRUNCATE TABLE ${quoted} RESTART IDENTITY CASCADE;`);
}
