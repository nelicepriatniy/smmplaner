import { PrismaClient } from "@prisma/client";
import { hash } from "bcryptjs";

const prisma = new PrismaClient();

/** Тестовый пользователь: пароль `admin`, смените в проде. */
async function main() {
  const email = "anyasmm@smmplaner.local";
  const passwordHash = await hash("admin", 10);
  await prisma.user.upsert({
    where: { email },
    create: { email, passwordHash },
    update: { passwordHash },
  });
}

main()
  .then(() => {
    console.log("Seed OK: anyasmm@smmplaner.local / admin");
  })
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
