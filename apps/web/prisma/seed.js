import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

async function main() {
  const org = await prisma.organization.create({
    data: {
      name: "Trigal Constructora",
      cuit: "30-12345678-9",
      address: "Pueblo Esther, Santa Fe",
    },
  });

  await prisma.obra.create({
    data: {
      name: "Jardines de Esther",
      address: "Pueblo Esther",
      estado: "en progreso",
      organization: { connect: { id: org.id } },
    },
  });

  await prisma.socio.create({
    data: {
      nombre: "José Contrera",
      telefono: "+54 341 555-1212",
      email: "admin@trigal.com",
      organization: { connect: { id: org.id } },
    },
  });

  console.log("✅ Seed completado con éxito");
}

main()
  .catch((e) => {
    console.error("❌ Error ejecutando seed:", e);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
