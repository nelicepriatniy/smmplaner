import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { verifyPanelUser } from "@/data/usersDb";
import {
  createPanelSessionValue,
  PANEL_SESSION_COOKIE,
  panelSessionCookieOptions,
} from "@/lib/panelSession";

type LoginBody = {
  login?: unknown;
  password?: unknown;
};

export async function POST(request: NextRequest) {
  let body: LoginBody;
  try {
    body = (await request.json()) as LoginBody;
  } catch {
    return NextResponse.json({ error: "Некорректное тело запроса" }, { status: 400 });
  }

  const login = typeof body.login === "string" ? body.login : "";
  const password = typeof body.password === "string" ? body.password : "";

  const user = verifyPanelUser(login, password);
  if (!user) {
    return NextResponse.json(
      { error: "Неверный логин или пароль" },
      { status: 401 }
    );
  }

  const token = await createPanelSessionValue(user.id, user.login);
  const res = NextResponse.json({ ok: true as const });
  res.cookies.set(PANEL_SESSION_COOKIE, token, panelSessionCookieOptions);
  return res;
}
