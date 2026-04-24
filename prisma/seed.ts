import { PrismaClient } from "@prisma/client";
import { hash } from "bcryptjs";
import { seedDemoContentForUser } from "./demo-seed";

const prisma = new PrismaClient();

/** Тестовый пользователь: пароль `admin`, смените в проде. */
async function main() {
  const email = "anyasmm@smmplaner.local";
  const passwordHash = await hash("admin", 10);
  const user = await prisma.user.upsert({
    where: { email },
    create: { email, passwordHash },
    update: { passwordHash },
  });

  /**
   * Демо-данные (клиенты, посты, активность). На проде задайте SEED_DEMO_DATA=0
   * после первого импорта, чтобы сид не перезаписывал контент при каждом деплое.
   */
  if (process.env.SEED_DEMO_DATA !== "0") {
    await seedDemoContentForUser(prisma, user.id);
  }
}

main()
  .then(() => {
    console.log(
      "Seed OK: anyasmm@smmplaner.local / admin" +
        (process.env.SEED_DEMO_DATA === "0"
          ? " (демо-данные пропущены: SEED_DEMO_DATA=0)"
          : " (демо-контент залит; отключить: SEED_DEMO_DATA=0)")
    );
  })
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
