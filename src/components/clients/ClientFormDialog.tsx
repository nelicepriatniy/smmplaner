"use client";

import {
  useEffect,
  useId,
  useRef,
  useState,
  useTransition,
  type FormEvent,
} from "react";
import type { ClientPlatform, ClientRecord } from "@/domain/smm";
import {
  createClientAction,
  updateClientAction,
} from "@/app/(main)/clients/actions";
import { VkIdTokenButton } from "@/components/clients/VkIdTokenButton";

const inputClass =
  "w-full rounded-xl border border-[var(--border)] bg-[var(--background)] px-3.5 py-2.5 text-[15px] text-[var(--foreground)] outline-offset-2 focus:border-[color-mix(in_srgb,var(--accent)_50%,var(--border))] focus:ring-2 focus:ring-[var(--accent-soft)]";
const btnPrimaryClass =
  "inline-flex items-center justify-center rounded-xl border border-transparent bg-[var(--surface-elevated)] px-4 py-2.5 text-[14px] font-medium text-[var(--foreground)] transition-colors hover:bg-[var(--border)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)] disabled:cursor-not-allowed disabled:opacity-50";
const btnGhostClass =
  "inline-flex items-center justify-center rounded-xl border border-[var(--border)] bg-transparent px-4 py-2.5 text-[14px] font-medium text-[var(--muted)] transition-colors hover:border-[color-mix(in_srgb,var(--foreground)_12%,var(--border))] hover:text-[var(--foreground)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)]";

function stripAt(handle: string): string {
  return handle.trim().replace(/^@+/, "");
}

export type ClientFormMode = "add" | "edit";

type VkWallKind = "group" | "user";

type FormState = {
  platform: ClientPlatform;
  fullName: string;
  instagramUsername: string;
  instagramBusinessId: string;
  facebookPageId: string;
  pageAccessToken: string;
  businessAccountConfirmed: boolean;
  contact: string;
  activitySpheres: string;
  telegramBotToken: string;
  telegramChatId: string;
  vkWallKind: VkWallKind;
  vkWallEntityId: string;
  vkFromGroup: boolean;
  vkAccessToken: string;
};

function vkInitialWallKind(client: ClientRecord): VkWallKind {
  const id = client.vkOwnerId?.trim();
  if (!id) return "group";
  return id.startsWith("-") ? "group" : "user";
}

function vkInitialEntityId(client: ClientRecord): string {
  const id = client.vkOwnerId?.trim().replace(/^-/, "") ?? "";
  return id.replace(/\D/g, "");
}

function buildInitialState(mode: ClientFormMode, client: ClientRecord | null): FormState {
  if (mode === "edit" && client) {
    return {
      platform: client.platform,
      fullName: client.fullName,
      instagramUsername: client.instagramUsername,
      instagramBusinessId: client.instagramBusinessId ?? "",
      facebookPageId: client.facebookPageId ?? "",
      pageAccessToken: "",
      businessAccountConfirmed: client.businessAccountConfirmed ?? false,
      contact: client.contact ?? "",
      activitySpheres: client.activitySpheres.join(", "),
      telegramBotToken: "",
      telegramChatId: client.telegramChatId ?? "",
      vkWallKind: vkInitialWallKind(client),
      vkWallEntityId: vkInitialEntityId(client),
      vkFromGroup: client.vkFromGroup ?? false,
      vkAccessToken: "",
    };
  }
  return {
    platform: "instagram",
    fullName: "",
    instagramUsername: "",
    instagramBusinessId: "",
    facebookPageId: "",
    pageAccessToken: "",
    businessAccountConfirmed: false,
    contact: "",
    activitySpheres: "",
    telegramBotToken: "",
    telegramChatId: "",
    vkWallKind: "group",
    vkWallEntityId: "",
    vkFromGroup: true,
    vkAccessToken: "",
  };
}

type ClientFormBodyProps = {
  mode: ClientFormMode;
  client: ClientRecord | null;
  onDismiss: () => void;
  onSaved?: () => void;
};

function ClientFormBody({ mode, client, onDismiss, onSaved }: ClientFormBodyProps) {
  const formId = useId();
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState("");
  const [values, setValues] = useState<FormState>(() => buildInitialState(mode, client));
  const [isPending, startTransition] = useTransition();

  const setField = <K extends keyof FormState>(k: K, v: FormState[K]) => {
    setValues((p) => ({ ...p, [k]: v }));
  };

  const onSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const fd = new FormData(form);
    setErrorMessage("");
    setStatus("idle");

    startTransition(async () => {
      const res =
        mode === "add"
          ? await createClientAction(fd)
          : await updateClientAction(client!.id, fd);
      if (res.ok) {
        setStatus("success");
        onSaved?.();
      } else {
        setStatus("error");
        setErrorMessage(res.error);
      }
    });
  };

  const title = mode === "add" ? "Новый клиент" : "Редактирование клиента";
  const lead =
    mode === "add" ? (
      values.platform === "telegram" ? (
        <>
          Посты для этого клиента планируются для отправки в указанный Telegram-чат через вашего
          бота (токен от @BotFather и ID чата сохраняются в базе).
        </>
      ) : values.platform === "vk" ? (
        <>
          Данные для вызова VK API (метод{" "}
          <code className="rounded bg-[var(--surface-elevated)] px-1">wall.post</code>
          ): access token, владелец стены (owner_id) и публикация от имени сообщества при
          необходимости. Токен хранится в базе — доверенный сервер и ограничение прав токена.
        </>
      ) : (
        <>
          Укажите контакты и при необходимости данные для публикации через Instagram Graph API
          (ID бизнес-аса, страницы Facebook, токен). Токен хранится в базе — используйте
          доверенный сервер и HTTPS.
        </>
      )
    ) : (
      <>
        Изменения сохраняются в вашей базе данных.
        {client ? (
          <span className="mt-2 block text-[12px] text-[var(--muted)]">ID: {client.id}</span>
        ) : null}
      </>
    );

  return (
    <form
      className="flex min-h-0 flex-1 flex-col p-5 sm:p-6"
      onSubmit={onSubmit}
    >
      <div className="pr-6">
        <h2 className="text-[17px] font-semibold tracking-tight">{title}</h2>
        <p className="mt-2 text-[13px] leading-relaxed text-[var(--muted)]">{lead}</p>
      </div>

      {status === "success" ? (
        <div className="mt-6 flex min-h-0 flex-1 flex-col justify-center rounded-xl border border-[color-mix(in_srgb,var(--accent)_30%,var(--border))] bg-[var(--surface-elevated)] px-4 py-8 text-center">
          <p className="text-[15px] font-medium text-[var(--foreground)]">Сохранено</p>
          <p className="mt-2 text-[13px] text-[var(--muted)]">
            {mode === "add" ? "Клиент добавлен в список." : "Карточка клиента обновлена."}
          </p>
          <button
            type="button"
            className={`${btnPrimaryClass} mt-6 self-center`}
            onClick={onDismiss}
          >
            Закрыть
          </button>
        </div>
      ) : (
        <div className="mt-6 min-h-0 flex-1 space-y-4 overflow-y-auto pr-0.5">
          {status === "error" && errorMessage ? (
            <p
              className="rounded-lg border border-rose-500/40 bg-rose-950/30 px-3 py-2 text-[13px] text-rose-100"
              role="alert"
            >
              {errorMessage}
            </p>
          ) : null}

          <input type="hidden" name="platform" value={values.platform} />

          <div role="radiogroup" aria-label="Платформа публикаций">
            <span className="text-[14px] font-medium text-[var(--foreground)]">
              Платформа
            </span>
            <div className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-3">
              <button
                type="button"
                className={`rounded-xl border px-3 py-2.5 text-[14px] font-medium transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)] ${
                  values.platform === "instagram"
                    ? "border-[color-mix(in_srgb,var(--accent)_45%,var(--border))] bg-[var(--surface-elevated)] text-[var(--foreground)]"
                    : "border-[var(--border)] bg-[var(--background)] text-[var(--muted)] hover:text-[var(--foreground)]"
                }`}
                aria-checked={values.platform === "instagram"}
                role="radio"
                onClick={() => setField("platform", "instagram")}
              >
                Instagram
              </button>
              <button
                type="button"
                className={`rounded-xl border px-3 py-2.5 text-[14px] font-medium transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)] ${
                  values.platform === "telegram"
                    ? "border-[color-mix(in_srgb,var(--accent)_45%,var(--border))] bg-[var(--surface-elevated)] text-[var(--foreground)]"
                    : "border-[var(--border)] bg-[var(--background)] text-[var(--muted)] hover:text-[var(--foreground)]"
                }`}
                aria-checked={values.platform === "telegram"}
                role="radio"
                onClick={() => setField("platform", "telegram")}
              >
                Telegram
              </button>
              <button
                type="button"
                className={`rounded-xl border px-3 py-2.5 text-[14px] font-medium transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)] ${
                  values.platform === "vk"
                    ? "border-[color-mix(in_srgb,var(--accent)_45%,var(--border))] bg-[var(--surface-elevated)] text-[var(--foreground)]"
                    : "border-[var(--border)] bg-[var(--background)] text-[var(--muted)] hover:text-[var(--foreground)]"
                }`}
                aria-checked={values.platform === "vk"}
                role="radio"
                onClick={() => setField("platform", "vk")}
              >
                ВКонтакте
              </button>
            </div>
          </div>

          {values.platform === "vk" ? (
            <div className="rounded-xl border border-[color-mix(in_srgb,var(--accent)_28%,var(--border))] bg-[var(--surface-elevated)] px-3.5 py-3.5 sm:px-4">
              <p className="mb-2 text-[13px] font-medium text-[var(--foreground)]">
                Токен через VK ID
              </p>
              <p className="mb-3 text-[12px] leading-relaxed text-[var(--muted)]">
                Ниже можно войти аккаунтом VK — access token подставится в поле «Access token» ниже по
                форме. Нужны переменные{" "}
                <code className="rounded bg-[var(--background)] px-1">NEXT_PUBLIC_VK_APP_ID</code> и{" "}
                <code className="rounded bg-[var(--background)] px-1">
                  NEXT_PUBLIC_VK_REDIRECT_URL
                </code>{" "}
                в <code className="rounded bg-[var(--background)] px-1">.env</code> /{" "}
                <code className="rounded bg-[var(--background)] px-1">.env.local</code>, затем
                перезапуск <code className="rounded bg-[var(--background)] px-1">npm run dev</code>.
                Для публикации постов во ВК у токена должны быть права API{" "}
                <code className="rounded bg-[var(--background)] px-1">wall</code>,{" "}
                <code className="rounded bg-[var(--background)] px-1">photos</code> (и при необходимости{" "}
                <code className="rounded bg-[var(--background)] px-1">groups</code>): включите их в
                кабинете приложения VK ID → «Доступы», задайте{" "}
                <code className="rounded bg-[var(--background)] px-1">NEXT_PUBLIC_VK_SCOPE</code> и
                войдите через кнопку снова. Иначе api.vk.com ответит «Access denied… [15]».
              </p>
              <VkIdTokenButton
                disabled={isPending}
                onAccessToken={(token) => {
                  setField("vkAccessToken", token);
                  setStatus("idle");
                  setErrorMessage("");
                }}
              />
            </div>
          ) : null}

          <div>
            <label
              htmlFor={`${formId}-name`}
              className="text-[14px] font-medium text-[var(--foreground)]"
            >
              Название (бренд, компания или ФИО)
            </label>
            <input
              id={`${formId}-name`}
              name="fullName"
              className={`mt-2 ${inputClass}`}
              value={values.fullName}
              onChange={(e) => setField("fullName", e.target.value)}
              required
              autoComplete="organization"
            />
          </div>

          {values.platform === "instagram" ? (
            <>
              <div>
                <label
                  htmlFor={`${formId}-ig`}
                  className="text-[14px] font-medium text-[var(--foreground)]"
                >
                  Логин Instagram
                </label>
                <div className="mt-2 flex items-center gap-1 rounded-xl border border-[var(--border)] bg-[var(--background)] px-3.5 py-2.5 has-[:focus-within]:border-[color-mix(in_srgb,var(--accent)_50%,var(--border))] has-[:focus-within]:ring-2 has-[:focus-within]:ring-[var(--accent-soft)]">
                  <span className="select-none text-[15px] text-[var(--muted)]" aria-hidden>
                    @
                  </span>
                  <input
                    id={`${formId}-ig`}
                    name="instagramUsername"
                    className="min-w-0 flex-1 border-0 bg-transparent p-0 text-[15px] text-[var(--foreground)] outline-none"
                    value={values.instagramUsername}
                    onChange={(e) =>
                      setField("instagramUsername", stripAt(e.target.value))
                    }
                    required
                    autoCapitalize="none"
                    autoCorrect="off"
                    spellCheck={false}
                    inputMode="text"
                    placeholder="username"
                    autoComplete="off"
                  />
                </div>
                <p className="mt-1 text-[12px] text-[var(--muted)]">Без @, только имя.</p>
              </div>

              <div>
                <label
                  htmlFor={`${formId}-igid`}
                  className="text-[14px] font-medium text-[var(--foreground)]"
                >
                  ID Instagram Business (IG User)
                </label>
                <input
                  id={`${formId}-igid`}
                  name="instagramBusinessId"
                  className={`mt-2 ${inputClass} font-mono text-[14px]`}
                  value={values.instagramBusinessId}
                  onChange={(e) =>
                    setField("instagramBusinessId", e.target.value.replace(/\D/g, ""))
                  }
                  inputMode="numeric"
                  autoComplete="off"
                  placeholder="например 17841405362951494"
                />
                <p className="mt-1 text-[12px] text-[var(--muted)]">
                  В Graph API — идентификатор бизнес-аса для публикации.
                </p>
              </div>

              <div>
                <label
                  htmlFor={`${formId}-pageid`}
                  className="text-[14px] font-medium text-[var(--foreground)]"
                >
                  ID Facebook Page
                </label>
                <input
                  id={`${formId}-pageid`}
                  name="facebookPageId"
                  className={`mt-2 ${inputClass} font-mono text-[14px]`}
                  value={values.facebookPageId}
                  onChange={(e) =>
                    setField("facebookPageId", e.target.value.replace(/\D/g, ""))
                  }
                  inputMode="numeric"
                  autoComplete="off"
                />
                <p className="mt-1 text-[12px] text-[var(--muted)]">
                  К странице обычно привязан Instagram Business.
                </p>
              </div>

              <div>
                <label
                  htmlFor={`${formId}-token`}
                  className="text-[14px] font-medium text-[var(--foreground)]"
                >
                  Page access token
                </label>
                <textarea
                  id={`${formId}-token`}
                  name="pageAccessToken"
                  className={`mt-2 min-h-[4.5rem] resize-y ${inputClass} font-mono text-[12px] leading-normal`}
                  value={values.pageAccessToken}
                  onChange={(e) => setField("pageAccessToken", e.target.value)}
                  autoComplete="off"
                  rows={3}
                  placeholder={
                    mode === "edit"
                      ? "Оставьте пустым, чтобы не менять сохранённый токен; вставьте новый, чтобы заменить."
                      : "Долгоживущий токен страницы с нужными scope…"
                  }
                />
                <p className="mt-1 text-[12px] text-[var(--muted)]">
                  Хранится в БД на сервере; не передаётся обратно в форму при редактировании.
                </p>
              </div>

              <div className="flex gap-3 rounded-xl border border-[var(--border)] bg-[var(--background)] p-3.5">
                <input
                  id={`${formId}-biz`}
                  type="checkbox"
                  name="businessAccountConfirmed"
                  value="on"
                  className="mt-0.5 size-4 shrink-0 cursor-pointer rounded border border-[var(--border)] bg-[var(--surface)] text-[var(--accent)]"
                  checked={values.businessAccountConfirmed}
                  onChange={(e) =>
                    setField("businessAccountConfirmed", e.target.checked)
                  }
                />
                <label
                  htmlFor={`${formId}-biz`}
                  className="cursor-pointer text-[13px] leading-snug text-[var(--foreground)]"
                >
                  Аккаунт Instagram в режиме Business / Creator, к Facebook Page и к вашему
                  приложению (или Business Manager) он подключён, права согласованы с клиентом
                </label>
              </div>
            </>
          ) : values.platform === "telegram" ? (
            <>
              <div>
                <label
                  htmlFor={`${formId}-tgbot`}
                  className="text-[14px] font-medium text-[var(--foreground)]"
                >
                  Токен бота
                </label>
                <textarea
                  id={`${formId}-tgbot`}
                  name="telegramBotToken"
                  className={`mt-2 min-h-[4.5rem] resize-y ${inputClass} font-mono text-[12px] leading-normal`}
                  value={values.telegramBotToken}
                  onChange={(e) => setField("telegramBotToken", e.target.value)}
                  required={
                    mode === "add" ||
                    (mode === "edit" && client != null && !client.hasTelegramBotToken)
                  }
                  autoComplete="off"
                  rows={3}
                  placeholder="123456789:AA… (от @BotFather)"
                />
                <p className="mt-1 text-[12px] text-[var(--muted)]">
                  Полная строка токена — в БД на сервере; в форму при редактировании не
                  подставляется.
                  {mode === "edit" && client?.hasTelegramBotToken ? (
                    <span className="mt-1 block">
                      Оставьте поле пустым, чтобы не менять сохранённый токен; вставьте новый,
                      чтобы заменить.
                    </span>
                  ) : null}
                </p>
              </div>
              <div>
                <label
                  htmlFor={`${formId}-tgchat`}
                  className="text-[14px] font-medium text-[var(--foreground)]"
                >
                  ID чата для постов
                </label>
                <input
                  id={`${formId}-tgchat`}
                  name="telegramChatId"
                  className={`mt-2 ${inputClass} font-mono text-[14px]`}
                  value={values.telegramChatId}
                  onChange={(e) => setField("telegramChatId", e.target.value)}
                  required
                  autoComplete="off"
                  placeholder="например -1001234567890 или @channelusername"
                />
                <p className="mt-1 text-[12px] text-[var(--muted)]">
                  Канал, группа или чат, куда будут уходить материалы этого клиента.
                </p>
              </div>
            </>
          ) : (
            <>
              <input type="hidden" name="vkWallKind" value={values.vkWallKind} />
              <div role="radiogroup" aria-label="Куда публиковать в ВК">
                <span className="text-[14px] font-medium text-[var(--foreground)]">
                  Стена
                </span>
                <div className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-2">
                  <button
                    type="button"
                    className={`rounded-xl border px-3 py-2.5 text-[14px] font-medium transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)] ${
                      values.vkWallKind === "group"
                        ? "border-[color-mix(in_srgb,var(--accent)_45%,var(--border))] bg-[var(--surface-elevated)] text-[var(--foreground)]"
                        : "border-[var(--border)] bg-[var(--background)] text-[var(--muted)] hover:text-[var(--foreground)]"
                    }`}
                    aria-checked={values.vkWallKind === "group"}
                    role="radio"
                    onClick={() => {
                      setField("vkWallKind", "group");
                    }}
                  >
                    Сообщество (группа)
                  </button>
                  <button
                    type="button"
                    className={`rounded-xl border px-3 py-2.5 text-[14px] font-medium transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)] ${
                      values.vkWallKind === "user"
                        ? "border-[color-mix(in_srgb,var(--accent)_45%,var(--border))] bg-[var(--surface-elevated)] text-[var(--foreground)]"
                        : "border-[var(--border)] bg-[var(--background)] text-[var(--muted)] hover:text-[var(--foreground)]"
                    }`}
                    aria-checked={values.vkWallKind === "user"}
                    role="radio"
                    onClick={() => {
                      setField("vkWallKind", "user");
                      setField("vkFromGroup", false);
                    }}
                  >
                    Личная страница
                  </button>
                </div>
                <p className="mt-1.5 text-[12px] text-[var(--muted)]">
                  Для группы owner_id отрицательный (в форму — только цифры id из club… / public…).
                  Для личной стены — числовой id пользователя (положительный owner_id).
                </p>
              </div>

              <div>
                <label
                  htmlFor={`${formId}-vkentity`}
                  className="text-[14px] font-medium text-[var(--foreground)]"
                >
                  {values.vkWallKind === "group"
                    ? "ID сообщества (только цифры)"
                    : "Числовой ID пользователя ВК"}
                </label>
                <input
                  id={`${formId}-vkentity`}
                  name="vkWallEntityId"
                  className={`mt-2 ${inputClass} font-mono text-[14px]`}
                  value={values.vkWallEntityId}
                  onChange={(e) =>
                    setField("vkWallEntityId", e.target.value.replace(/\D/g, ""))
                  }
                  required
                  inputMode="numeric"
                  autoComplete="off"
                  placeholder={
                    values.vkWallKind === "group"
                      ? "например 123456789 из vk.com/club123456789"
                      : "например 123456789 (vk.com/id…)"
                  }
                />
              </div>

              {values.vkWallKind === "group" ? (
                <div className="flex gap-3 rounded-xl border border-[var(--border)] bg-[var(--background)] p-3.5">
                  <input
                    id={`${formId}-vkfrom`}
                    type="checkbox"
                    name="vkFromGroup"
                    value="on"
                    className="mt-0.5 size-4 shrink-0 cursor-pointer rounded border border-[var(--border)] bg-[var(--surface)] text-[var(--accent)]"
                    checked={values.vkFromGroup}
                    onChange={(e) => setField("vkFromGroup", e.target.checked)}
                  />
                  <label
                    htmlFor={`${formId}-vkfrom`}
                    className="cursor-pointer text-[13px] leading-snug text-[var(--foreground)]"
                  >
                    Публиковать от имени сообщества (параметр{" "}
                    <code className="rounded bg-[var(--surface-elevated)] px-1">from_group=1</code>
                    в API)
                  </label>
                </div>
              ) : null}

              <div>
                <label
                  htmlFor={`${formId}-vktoken`}
                  className="text-[14px] font-medium text-[var(--foreground)]"
                >
                  Access token
                </label>
                <textarea
                  id={`${formId}-vktoken`}
                  name="vkAccessToken"
                  className={`mt-2 min-h-[4.5rem] resize-y ${inputClass} font-mono text-[12px] leading-normal`}
                  value={values.vkAccessToken}
                  onChange={(e) => setField("vkAccessToken", e.target.value)}
                  required={
                    mode === "add" ||
                    (mode === "edit" && client != null && !client.hasVkAccessToken)
                  }
                  autoComplete="off"
                  rows={3}
                  placeholder="Лучше пользовательский OAuth-токен (scope photos, wall)…"
                />
                <p className="mt-1 text-[12px] text-[var(--muted)]">
                  Для постов с изображениями нужен пользовательский токен администратора группы (или
                  страницы), а не ключ доступа сообщества: у ВК методы загрузки фото на стену с
                  «групповым» токеном недоступны (ошибка 27). Секрет хранится в БД; при редактировании
                  не подставляется.
                  {mode === "edit" && client?.hasVkAccessToken ? (
                    <span className="mt-1 block">
                      Оставьте пустым, чтобы не менять токен; вставьте новый, чтобы заменить.
                    </span>
                  ) : null}
                </p>
              </div>
            </>
          )}

          <div>
            <label
              htmlFor={`${formId}-contact`}
              className="text-[14px] font-medium text-[var(--foreground)]"
            >
              Контакт для связи
            </label>
            <input
              id={`${formId}-contact`}
              name="contact"
              className={`mt-2 ${inputClass}`}
              value={values.contact}
              onChange={(e) => setField("contact", e.target.value)}
              autoComplete="off"
              placeholder="email, Telegram, телефон…"
            />
          </div>

          <div>
            <label
              htmlFor={`${formId}-spheres`}
              className="text-[14px] font-medium text-[var(--foreground)]"
            >
              Сферы деятельности
            </label>
            <input
              id={`${formId}-spheres`}
              name="activitySpheres"
              className={`mt-2 ${inputClass}`}
              value={values.activitySpheres}
              onChange={(e) => setField("activitySpheres", e.target.value)}
              autoComplete="off"
              placeholder="через запятую, например: кофейня, доставка"
            />
            <p className="mt-1 text-[12px] text-[var(--muted)]">Необязательно, 1–2 сферы.</p>
          </div>
        </div>
      )}

      {status === "success" ? null : (
        <div className="mt-6 flex flex-wrap justify-end gap-2 border-t border-[var(--border)] pt-5 sm:gap-3">
          <button
            type="button"
            onClick={onDismiss}
            className={btnGhostClass}
            disabled={isPending}
          >
            Отмена
          </button>
          <button type="submit" className={btnPrimaryClass} disabled={isPending}>
            {isPending ? "Сохранение…" : "Сохранить"}
          </button>
        </div>
      )}
    </form>
  );
}

export type ClientFormDialogProps = {
  isOpen: boolean;
  onRequestClose: () => void;
  mode: ClientFormMode;
  client: ClientRecord | null;
  /** Увеличивайте при каждом открытии, чтобы форма монтировалась с чистыми/новыми значениями. */
  session: number;
  /** После успешного сохранения (например router.refresh). */
  onSaved?: () => void;
};

export function ClientFormDialog({
  isOpen,
  onRequestClose,
  mode,
  client,
  session,
  onSaved,
}: ClientFormDialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    if (!isOpen) {
      dialogRef.current?.close();
      return;
    }
    dialogRef.current?.showModal();
  }, [isOpen]);

  return (
    <dialog
      ref={dialogRef}
      className="fixed inset-0 z-50 m-0 h-full max-h-none w-full max-w-none border-0 bg-transparent p-0 shadow-none backdrop:bg-black/55"
      onClose={onRequestClose}
    >
      {isOpen ? (
        <div
          className="flex h-full w-full min-h-0 items-center justify-center p-4"
          onClick={onRequestClose}
        >
          <div
            className="w-[min(32rem,calc(100%-2rem))] max-h-[min(90dvh,42rem)] overflow-y-auto rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-0 text-[var(--foreground)] shadow-[0_20px_60px_rgba(0,0,0,0.45)]"
            onClick={(e) => e.stopPropagation()}
            role="presentation"
          >
            <ClientFormBody
              key={session}
              mode={mode}
              client={client}
              onDismiss={onRequestClose}
              onSaved={onSaved}
            />
          </div>
        </div>
      ) : null}
    </dialog>
  );
}
