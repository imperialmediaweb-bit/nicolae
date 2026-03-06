import { PrismaClient } from "../src/generated/prisma/client.js";
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcryptjs";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

async function main() {
  // Create default admin user
  const hashedPassword = await bcrypt.hash("admin123", 12);

  await prisma.user.upsert({
    where: { username: "admin" },
    update: {},
    create: {
      username: "admin",
      password: hashedPassword,
      name: "Administrator",
      role: "admin",
    },
  });

  // Create demo staff
  const staffPassword = await bcrypt.hash("staff123", 12);
  await prisma.user.upsert({
    where: { username: "psiholog1" },
    update: {},
    create: {
      username: "psiholog1",
      password: staffPassword,
      name: "Maria Popescu",
      role: "psiholog",
    },
  });

  await prisma.user.upsert({
    where: { username: "asistent1" },
    update: {},
    create: {
      username: "asistent1",
      password: staffPassword,
      name: "Ion Ionescu",
      role: "asistent",
    },
  });

  await prisma.user.upsert({
    where: { username: "farmacist1" },
    update: {},
    create: {
      username: "farmacist1",
      password: staffPassword,
      name: "Elena Dumitrescu",
      role: "farmacist",
    },
  });

  // Create medication categories
  const categories = [
    { name: "Cardio", description: "Medicamente cardiovasculare", icon: "Heart", color: "#EF4444" },
    { name: "Diabet", description: "Medicamente pentru diabet", icon: "Droplets", color: "#8B5CF6" },
    { name: "Gastro", description: "Medicamente gastrointestinale", icon: "Pill", color: "#F59E0B" },
    { name: "Respirator", description: "Medicamente respiratorii", icon: "Wind", color: "#06B6D4" },
    { name: "Neuro", description: "Medicamente neurologice", icon: "Brain", color: "#EC4899" },
    { name: "Psihiatric", description: "Medicamente psihiatrice", icon: "Shield", color: "#6366F1" },
    { name: "Antibiotice", description: "Antibiotice și antimicrobiene", icon: "Zap", color: "#10B981" },
    { name: "Durere", description: "Analgezice și antiinflamatoare", icon: "Flame", color: "#F97316" },
    { name: "Alergii", description: "Antihistaminice și antialergice", icon: "Flower", color: "#A855F7" },
    { name: "Dermato", description: "Medicamente dermatologice", icon: "Sun", color: "#FBBF24" },
    { name: "Vitamine", description: "Vitamine și suplimente", icon: "Star", color: "#22C55E" },
    { name: "Altele", description: "Alte medicamente", icon: "Package", color: "#6B7280" },
  ];

  for (const cat of categories) {
    await prisma.medicationCategory.upsert({
      where: { name: cat.name },
      update: {},
      create: cat,
    });
  }

  // Create subscription plans
  const plans = [
    {
      name: "basic",
      displayName: "Basic",
      price: 49,
      color: "#6B7280",
      sortOrder: 1,
      features: JSON.stringify(["progres", "tips_parinti", "tips_copii"]),
    },
    {
      name: "premium",
      displayName: "Premium",
      price: 99,
      color: "#3B82F6",
      sortOrder: 2,
      features: JSON.stringify(["progres", "tips_parinti", "tips_copii", "retete", "activitati"]),
    },
    {
      name: "vip",
      displayName: "VIP",
      price: 149,
      color: "#8B5CF6",
      sortOrder: 3,
      features: JSON.stringify(["progres", "tips_parinti", "tips_copii", "retete", "activitati", "evaluari"]),
    },
  ];

  for (const plan of plans) {
    await prisma.subscriptionPlan.upsert({
      where: { name: plan.name },
      update: { displayName: plan.displayName, price: plan.price, color: plan.color, features: plan.features, sortOrder: plan.sortOrder },
      create: plan,
    });
  }

  console.log("Seed completat cu succes!");
  console.log("Conturi create:");
  console.log("  admin / admin123 (Administrator)");
  console.log("  psiholog1 / staff123 (Psiholog)");
  console.log("  asistent1 / staff123 (Asistent)");
  console.log("  farmacist1 / staff123 (Farmacist)");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
