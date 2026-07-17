import { prisma } from '@/lib/db';

const BYTES_PER_RECORD: Record<string, number> = {
  users: 700,
  products: 850,
  customers: 750,
  orders: 2600,
  orderLines: 650,
  feedback: 1800,
  aliases: 500,
  connections: 3500,
  activity: 900,
  logs: 1200
};

export function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  const kb = bytes / 1024;
  if (kb < 1024) return `${kb.toFixed(1)} KB`;
  const mb = kb / 1024;
  if (mb < 1024) return `${mb.toFixed(1)} MB`;
  return `${(mb / 1024).toFixed(2)} GB`;
}

export async function getCompanyUsage(companyId: string) {
  const [users, products, customers, orders, orderLines, feedback, productAliases, customerAliases, gmail, outlook, activity, logs] = await Promise.all([
    prisma.user.count({ where: { companyId } }),
    prisma.product.count({ where: { companyId } }),
    prisma.customer.count({ where: { companyId } }),
    prisma.order.count({ where: { companyId } }),
    prisma.orderLine.count({ where: { order: { companyId } } }),
    prisma.orderFeedback.count({ where: { companyId } }),
    prisma.productAlias.count({ where: { companyId } }),
    prisma.customerAlias.count({ where: { companyId } }),
    prisma.gmailConnection.count({ where: { companyId } }),
    prisma.outlookConnection.count({ where: { companyId } }),
    prisma.activityLog.count({ where: { companyId } }).catch(() => 0),
    prisma.systemLog.count({ where: { companyId } }).catch(() => 0)
  ]);

  const aliases = productAliases + customerAliases;
  const connections = gmail + outlook;
  const estimatedBytes =
    users * BYTES_PER_RECORD.users +
    products * BYTES_PER_RECORD.products +
    customers * BYTES_PER_RECORD.customers +
    orders * BYTES_PER_RECORD.orders +
    orderLines * BYTES_PER_RECORD.orderLines +
    feedback * BYTES_PER_RECORD.feedback +
    aliases * BYTES_PER_RECORD.aliases +
    connections * BYTES_PER_RECORD.connections +
    activity * BYTES_PER_RECORD.activity +
    logs * BYTES_PER_RECORD.logs;

  return {
    users,
    products,
    customers,
    orders,
    orderLines,
    feedback,
    productAliases,
    customerAliases,
    aliases,
    gmail,
    outlook,
    connections,
    activity,
    logs,
    estimatedBytes,
    estimatedStorage: formatBytes(estimatedBytes)
  };
}

export async function getAllCompanyUsage() {
  const companies = await prisma.company.findMany({ orderBy: { createdAt: 'desc' } });
  return Promise.all(companies.map(async (company) => ({ company, usage: await getCompanyUsage(company.id) })));
}
