import { randomBytes } from "crypto";
import { mkdir, writeFile } from "fs/promises";
import { join } from "path";
import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { extFromBuffer, pickImageExtension } from "@/lib/uploadImageFormat";

const MAX_BYTES = 12 * 1024 * 1024; // на файл
const MAX_FILES = 10;

export async function POST(request: Request) {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) {
    return NextResponse.json({ error: "Нужна авторизация." }, { status: 401 });
  }

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json({ error: "Некорректные данные формы." }, { status: 400 });
  }

  const raw = formData.getAll("files");
  const files = raw.filter((x): x is File => x instanceof File && x.size > 0);
  if (!files.length) {
    return NextResponse.json({ error: "Нет файлов." }, { status: 400 });
  }
  if (files.length > MAX_FILES) {
    return NextResponse.json(
      { error: `Не больше ${MAX_FILES} файлов за раз.` },
      { status: 400 }
    );
  }

  const dir = join(process.cwd(), "public", "uploads", "posts", userId);
  await mkdir(dir, { recursive: true });

  const urls: string[] = [];

  for (const file of files) {
    if (file.size > MAX_BYTES) {
      return NextResponse.json(
        { error: `Файл «${file.name}» слишком большой (макс. ${MAX_BYTES / 1024 / 1024} МБ).` },
        { status: 400 }
      );
    }
    const mime = file.type.trim().toLowerCase();
    if (mime && !mime.startsWith("image/")) {
      return NextResponse.json(
        { error: `Недопустимый тип файла: ${file.type || "—"}` },
        { status: 400 }
      );
    }
    const buf = Buffer.from(await file.arrayBuffer());
    if (!mime && !extFromBuffer(buf)) {
      return NextResponse.json(
        { error: "Не удалось определить изображение (пустой MIME и неизвестный формат файла)." },
        { status: 400 },
      );
    }

    const ext = pickImageExtension(file, buf);
    const name = `${Date.now()}-${randomBytes(10).toString("hex")}${ext}`;
    await writeFile(join(dir, name), buf);
    urls.push(`/uploads/posts/${userId}/${name}`);
  }

  return NextResponse.json({ urls });
}
