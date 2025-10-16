import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function testConnection() {
  console.log("🧠 Probando conexión a Supabase...");
  try {
    const result = await prisma.$queryRaw`SELECT NOW() AS current_time`;
    console.log("✅ Conexión exitosa:", result);
  } catch (error) {
    console.error("❌ Error de conexión:", error);
  } finally {
    await prisma.$disconnect();
  }
}

testConnection();
