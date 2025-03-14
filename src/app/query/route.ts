import { prisma } from "@/prisma";

async function listInvoices() {
  const data = await prisma.invoices.findMany({
    where: {
      amount: 666,
    },
    select: {
      amount: true,
      customer: {
        select: {
          name: true,
        },
      },
    },
  });

  return data.map((invoice) => ({
    amount: invoice.amount,
    name: invoice.customer?.name,
  }));
}

export async function GET() {
  try {
    return Response.json(await listInvoices());
  } catch (error) {
    return Response.json({ error }, { status: 500 });
  }
}
