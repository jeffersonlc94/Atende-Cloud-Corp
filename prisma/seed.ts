import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const adminEmail = (process.env.SEED_ADMIN_EMAIL || "admin@atende.local").toLowerCase();
  const adminName = process.env.SEED_ADMIN_NAME || "Administrador";
  const adminPassword = process.env.SEED_ADMIN_PASSWORD || "admin123";

  const existingAdmin = await prisma.user.findUnique({ where: { email: adminEmail } });

  if (!existingAdmin) {
    const passwordHash = await bcrypt.hash(adminPassword, 10);
    await prisma.user.create({
      data: {
        name: adminName,
        email: adminEmail,
        passwordHash,
        role: "ADMIN",
      },
    });
    console.log(`Usuário administrador criado: ${adminEmail}`);
  } else {
    console.log("Usuário administrador já existe, pulando criação.");
  }

  await prisma.quoteCounter.upsert({
    where: { id: "default" },
    update: {},
    create: { id: "default", lastNum: 0 },
  });

  const companyCount = await prisma.company.count();
  if (companyCount === 0) {
    await prisma.company.create({
      data: {
        razaoSocial: "Minha Empresa LTDA",
        nomeFantasia: "Minha Empresa",
        cnpj: "00.000.000/0001-00",
        inscricaoEstadual: "ISENTO",
        endereco: "Rua Exemplo, 123 - Centro",
        cidade: "São Paulo",
        estado: "SP",
        cep: "00000-000",
        telefone1: "(11) 0000-0000",
        email: "contato@minhaempresa.com.br",
        nomeResponsavel: adminName,
        isDefault: true,
      },
    });
    console.log("Empresa emissora de exemplo criada.");
  }
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
