"use client";

import {
  useEffect,
  useId,
  useRef,
  useState,
  useTransition,
  type FormEvent,
} from "react";
import {
  addClientSocialAccountAction,
  updateClientSocialAccountAction,
} from "@/app/(main)/clients/actions";
import type { ClientPlatform, ClientSocialAccountRecord } from "@/domain/smm";
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

type VkWallKind = "group" | "user";

type SocialFormState = {
  platform: ClientPlatform;
  instagramUsername: string;
  instagramBusinessId: string;
  facebookPageId: string;
  pageAccessToken: string;
  businessAccountConfirmed: boolean;
  telegramBotToken: string;
  telegramChatId: string;
  vkWallKind: VkWallKind;
  vkWallEntityId: string;
  vkFromGroup: boolean;
  vkAccessToken: string;
};

function vkWallKindFromAccount(a: ClientSocialAccountRecord): VkWallKind {
  const id = a.vkOwnerId?.trim();
  if (!id) return "group";
  return id.startsWith("-") ? "group" : "user";
}

function vkEntityIdFromAccount(a: ClientSocialAccountRecord): string {
  const id = a.vkOwnerId?.trim().replace(/^-/, "") ?? "";
  return id.replace(/\D/g, "");
}

function initialSocialState(
  mode: "add" | "edit",
  account: ClientSocialAccountRecord | null
): SocialFormState {
  if (mode === "edit" && account) {
    return {
      platform: account.platform,
      instagramUsername: account.instagramUsername,
      instagramBusinessId: account.instagramBusinessId ?? "",
      facebookPageId: account.facebookPageId ?? "",
      pageAccessToken: "",
      businessAccountConfirmed: account.businessAccountConfirmed ?? false,
      telegramBotToken: "",
      telegramChatId: account.telegramChatId ?? "",
      vkWallKind: vkWallKindFromAccount(account),
      vkWallEntityId: vkEntityIdFromAccount(account),
      vkFromGroup: account.vkFromGroup ?? false,
      vkAccessToken: "",
    };
  }
  return {
    platform: "instagram",
    instagramUsername: "",
    instagramBusinessId: "",
    facebookPageId: "",
    pageAccessToken: "",
    businessAccountConfirmed: false,
    telegramBotToken: "",
    telegramChatId: "",
    vkWallKind: "group",
    vkWallEntityId: "",
    vkFromGroup: true,
    vkAccessToken: "",
  };
}

type SocialFormBodyProps = {
  mode: "add" | "edit";
  clientId: string;
  clientFullName: string;
  account: ClientSocialAccountRecord | null;
  onDismiss: () => void;
  onSaved?: () => void;
};

function SocialFormBody({
  mode,
  clientId,
  clientFullName,
  account,
  onDismiss,
  onSaved,
}: SocialFormBodyProps) {
  const formId = useId();
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState("");
  const [values, setValues] = useState<SocialFormState>(() =>
    initialSocialState(mode, account)
  );
  const [isPending, startTransition] = useTransition();

  const setField = <K extends keyof SocialFormState>(k: K, v: SocialFormState[K]) => {
    setValues((p) => ({ ...p, [k]: v }));
  };

  const onSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    setErrorMessage("");
    setStatus("idle");
    startTransition(async () => {
      const res =
        mode === "add"
          ? await addClientSocialAccountAction(clientId, fd)
          : await updateClientSocialAccountAction(account!.id, fd);
      if (res.ok) {
        setStatus("success");
        onSaved?.();
      } else {
        setStatus("error");
        setErrorMessage(res.error);
      }
    });
  };

  const title =
    mode === "add"
      ? `Новая соцсеть — ${clientFullName}`
      : `Редактирование соцсети — ${clientFullName}`;

  return (
    <form className="flex min-h-0 flex-1 flex-col p-5 sm:p-6" onSubmit={onSubmit}>
      <div className="pr-6">
        <h2 className="text-[17px] font-semibold tracking-tight">{title}</h2>
        <p className="mt-2 text-[13px] leading-relaxed text-[var(--muted)]">
          {mode === "add"
            ? "Выберите платформу и заполните данные подключения. Можно добавить несколько сетей к одному клиенту."
            : "Платформа не меняется. Токены при необходимости вставьте заново — пустое поле означает «не менять» (кроме случаев, когда токен ещё не был задан)."}
        </p>
      </div>

      {status === "success" ? (
        <div className="mt-6 flex min-h-0 flex-1 flex-col justify-center rounded-xl border border-[color-mix(in_srgb,var(--accent)_30%,var(--border))] bg-[var(--surface-elevated)] px-4 py-8 text-center">
          <p className="text-[15px] font-medium text-[var(--foreground)]">Сохранено</p>
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

          {mode === "edit" ? null : (
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
          )}

          {values.platform === "vk" && mode === "add" ? (
            <div className="rounded-xl border border-[color-mix(in_srgb,var(--accent)_28%,var(--border))] bg-[var(--surface-elevated)] px-3.5 py-3.5 sm:px-4">
              <p className="mb-2 text-[13px] font-medium text-[var(--foreground)]">
                Токен через VK ID
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
                    placeholder="username"
                    autoComplete="off"
                  />
                </div>
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
                />
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
                      ? "Оставьте пустым, чтобы не менять токен"
                      : "Долгоживущий токен страницы…"
                  }
                />
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
                  Business / Creator, страница и права согласованы
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
                  required={mode === "add" || !account?.hasTelegramBotToken}
                  autoComplete="off"
                  rows={3}
                  placeholder="123456789:AA…"
                />
                {mode === "edit" && account?.hasTelegramBotToken ? (
                  <p className="mt-1 text-[12px] text-[var(--muted)]">
                    Оставьте пустым, чтобы не менять сохранённый токен.
                  </p>
                ) : null}
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
                />
              </div>
            </>
          ) : (
            <>
              <input type="hidden" name="vkWallKind" value={values.vkWallKind} />
              <div role="radiogroup" aria-label="Куда публиковать в ВК">
                <span className="text-[14px] font-medium text-[var(--foreground)]">Стена</span>
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
                    onClick={() => setField("vkWallKind", "group")}
                  >
                    Сообщество
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
              </div>
              <div>
                <label htmlFor={`${formId}-vkentity`} className="text-[14px] font-medium">
                  {values.vkWallKind === "group"
                    ? "ID сообщества (цифры)"
                    : "Числовой ID пользователя"}
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
                  <label htmlFor={`${formId}-vkfrom`} className="cursor-pointer text-[13px]">
                    Публиковать от имени сообщества (from_group)
                  </label>
                </div>
              ) : null}
              <div>
                <label htmlFor={`${formId}-vktoken`} className="text-[14px] font-medium">
                  Access token
                </label>
                <textarea
                  id={`${formId}-vktoken`}
                  name="vkAccessToken"
                  className={`mt-2 min-h-[4.5rem] resize-y ${inputClass} font-mono text-[12px] leading-normal`}
                  value={values.vkAccessToken}
                  onChange={(e) => setField("vkAccessToken", e.target.value)}
                  required={mode === "add" || !account?.hasVkAccessToken}
                  autoComplete="off"
                  rows={3}
                />
                {mode === "edit" && account?.hasVkAccessToken ? (
                  <p className="mt-1 text-[12px] text-[var(--muted)]">
                    Оставьте пустым, чтобы не менять токен.
                  </p>
                ) : null}
              </div>
            </>
          )}
        </div>
      )}

      {status === "success" ? null : (
        <div className="mt-6 flex flex-wrap justify-end gap-2 border-t border-[var(--border)] pt-5 sm:gap-3">
          <button type="button" onClick={onDismiss} className={btnGhostClass} disabled={isPending}>
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

export type ClientSocialAccountFormDialogProps = {
  isOpen: boolean;
  onRequestClose: () => void;
  mode: "add" | "edit";
  clientId: string;
  clientFullName: string;
  account: ClientSocialAccountRecord | null;
  session: number;
  onSaved?: () => void;
};

export function ClientSocialAccountFormDialog({
  isOpen,
  onRequestClose,
  mode,
  clientId,
  clientFullName,
  account,
  session,
  onSaved,
}: ClientSocialAccountFormDialogProps) {
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
            <SocialFormBody
              key={session}
              mode={mode}
              clientId={clientId}
              clientFullName={clientFullName}
              account={account}
              onDismiss={onRequestClose}
              onSaved={onSaved}
            />
          </div>
        </div>
      ) : null}
    </dialog>
  );
}
