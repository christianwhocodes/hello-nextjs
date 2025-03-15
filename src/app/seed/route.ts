// app/data/route.ts

import { hash } from "@/lib/auth/utils";
import { db } from "@/lib/prisma/connection";
import { customers, invoices, revenue, users } from "@/lib/prisma/fixtures";
import { notFound } from "next/navigation";

async function seedUsers() {
  const insertedUsers = await Promise.all(
    users.map(async (user) => {
      const hashedPassword = hash(user.password);
      return db.users.upsert({
        where: { id: user.id },
        update: {},
        create: {
          id: user.id,
          name: user.name,
          email: user.email,
          password: hashedPassword,
        },
      });
    }),
  );
  return insertedUsers;
}

async function seedCustomers() {
  const insertedCustomers = await Promise.all(
    customers.map((customer) =>
      db.customers.upsert({
        where: { id: customer.id },
        update: {},
        create: {
          id: customer.id,
          name: customer.name,
          email: customer.email,
          image_url: customer.image_url,
        },
      }),
    ),
  );
  return insertedCustomers;
}

async function seedInvoices() {
  const insertedInvoices = await Promise.all(
    invoices.map((invoice) =>
      db.invoices.create({
        data: {
          customer_id: invoice.customer_id,
          amount: invoice.amount,
          status: invoice.status,
          date: new Date(invoice.date),
        },
      }),
    ),
  );
  return insertedInvoices;
}

async function seedRevenue() {
  const insertedRevenue = await Promise.all(
    revenue.map((rev) =>
      db.revenue.upsert({
        where: { month: rev.month },
        update: {},
        create: {
          month: rev.month,
          revenue: rev.revenue,
        },
      }),
    ),
  );
  return insertedRevenue;
}

export async function GET() {
  if (process.env.NODE_ENV === "production") {
    return notFound();
  }

  try {
    // Clear existing data first
    await db.$transaction([
      db.invoices.deleteMany(),
      db.revenue.deleteMany(),
      db.customers.deleteMany(),
      db.users.deleteMany(),
    ]);

    await seedUsers();
    await seedCustomers();
    await seedInvoices();
    await seedRevenue();

    return Response.json({ message: "Database seeded successfully" });
  } catch (error) {
    console.error("Error seeding database:", error);
    return Response.json({ error }, { status: 500 });
  }
}
