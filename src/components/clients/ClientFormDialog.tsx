"use client";

import { useEffect, useId, useRef, useState, type FormEvent } from "react";
import type { ClientRecord } from "@/domain/smm";

const inputClass =
  "w-full rounded-xl border border-[var(--border)] bg-[var(--background)] px-3.5 py-2.5 text-[15px] text-[var(--foreground)] outline-offset-2 focus:border-[color-mix(in_srgb,var(--accent)_50%,var(--border))] focus:ring-2 focus:ring-[var(--accent-soft)]";
const btnPrimaryClass =
  "inline-flex items-center justify-center rounded-xl border border-transparent bg-[var(--surface-elevated)] px-4 py-2.5 text-[14px] font-medium text-[var(--foreground)] transition-colors hover:bg-[var(--border)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)]";
const btnGhostClass =
  "inline-flex items-center justify-center rounded-xl border border-[var(--border)] bg-transparent px-4 py-2.5 text-[14px] font-medium text-[var(--muted)] transition-colors hover:border-[color-mix(in_srgb,var(--foreground)_12%,var(--border))] hover:text-[var(--foreground)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)]";

function stripAt(handle: string): string {
  return handle.trim().replace(/^@+/, "");
}

export type ClientFormMode = "add" | "edit";

type FormState = {
  fullName: string;
  instagramUsername: string;
  instagramBusinessId: string;
  facebookPageId: string;
  pageAccessToken: string;
  businessAccountConfirmed: boolean;
  contact: string;
  activitySpheres: string;
};

function buildInitialState(mode: ClientFormMode, client: ClientRecord | null): FormState {
  if (mode === "edit" && client) {
    return {
      fullName: client.fullName,
      instagramUsername: client.instagramUsername,
      instagramBusinessId: "",
      facebookPageId: "",
      pageAccessToken: "",
      businessAccountConfirmed: false,
      contact: "",
      activitySpheres: client.activitySpheres.join(", "),
    };
  }
  return {
    fullName: "",
    instagramUsername: "",
    instagramBusinessId: "",
    facebookPageId: "",
    pageAccessToken: "",
    businessAccountConfirmed: false,
    contact: "",
    activitySpheres: "",
  };
}

type ClientFormBodyProps = {
  mode: ClientFormMode;
  client: ClientRecord | null;
  onDismiss: () => void;
};

function ClientFormBody({ mode, client, onDismiss }: ClientFormBodyProps) {
  const formId = useId();
  const [status, setStatus] = useState<"idle" | "submitted">("idle");
  const [values, setValues] = useState<FormState>(() => buildInitialState(mode, client));

  const setField = <K extends keyof FormState>(k: K, v: FormState[K]) => {
    setValues((p) => ({ ...p, [k]: v }));
  };

  const apiBlockRequired = mode === "add";

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    setStatus("submitted");
  };

  const title = mode === "add" ? "Новый клиент" : "Редактирование клиента";
  const lead =
    mode === "add" ? (
      <>
        Клиентов подключаем с{" "}
        <strong className="font-medium text-[var(--foreground)]">бизнес-асом Instagram</strong>,
        привязанным к{" "}
        <strong className="font-medium text-[var(--foreground)]">странице Facebook</strong>
        , чтобы публиковать посты в его аккаунт через API. Сохранение в базу пока не делаем —
        форма для сбора данных.
      </>
    ) : (
      <>
        Данные взяты из карточки клиента; поля для API (ID, токен) в макете пустые — внесите
        вручную, когда появятся. Сохранение в базу пока не делаем.
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

      {status === "submitted" ? (
        <div className="mt-6 flex min-h-0 flex-1 flex-col justify-center rounded-xl border border-[color-mix(in_srgb,var(--accent)_30%,var(--border))] bg-[var(--surface-elevated)] px-4 py-8 text-center">
          <p className="text-[15px] font-medium text-[var(--foreground)]">Форма заполнена</p>
          <p className="mt-2 text-[13px] text-[var(--muted)]">
            Данные никуда не отправляются. Подключение к API и хранение токенов появятся отдельно.
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
          <div>
            <label
              htmlFor={`${formId}-name`}
              className="text-[14px] font-medium text-[var(--foreground)]"
            >
              Название (бренд, компания или ФИО)
            </label>
            <input
              id={`${formId}-name`}
              className={`mt-2 ${inputClass}`}
              value={values.fullName}
              onChange={(e) => setField("fullName", e.target.value)}
              required
              autoComplete="organization"
            />
          </div>

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
                className="min-w-0 flex-1 border-0 bg-transparent p-0 text-[15px] text-[var(--foreground)] outline-none"
                value={values.instagramUsername}
                onChange={(e) => setField("instagramUsername", stripAt(e.target.value))}
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
              className={`mt-2 ${inputClass} font-mono text-[14px]`}
              value={values.instagramBusinessId}
              onChange={(e) => setField("instagramBusinessId", e.target.value.replace(/\D/g, ""))}
              required={apiBlockRequired}
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
              className={`mt-2 ${inputClass} font-mono text-[14px]`}
              value={values.facebookPageId}
              onChange={(e) => setField("facebookPageId", e.target.value.replace(/\D/g, ""))}
              required={apiBlockRequired}
              inputMode="numeric"
              autoComplete="off"
            />
            <p className="mt-1 text-[12px] text-[var(--muted)]">
              К странице обычно привязан Instagram Business, без неё публикация в IG из API
              недоступна.
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
              className={`mt-2 min-h-[4.5rem] resize-y ${inputClass} font-mono text-[12px] leading-normal`}
              value={values.pageAccessToken}
              onChange={(e) => setField("pageAccessToken", e.target.value)}
              required={apiBlockRequired}
              autoComplete="off"
              rows={3}
              placeholder="Долгоживущий токен страницы с нужными scope…"
            />
            <p className="mt-1 text-[12px] text-[var(--muted)]">
              С правами на публикацию в Instagram (и чтение страницы). В будущем хранится только
              на сервере.
            </p>
          </div>

          <div className="flex gap-3 rounded-xl border border-[var(--border)] bg-[var(--background)] p-3.5">
            <input
              id={`${formId}-biz`}
              type="checkbox"
              className="mt-0.5 size-4 shrink-0 cursor-pointer rounded border border-[var(--border)] bg-[var(--surface)] text-[var(--accent)]"
              checked={values.businessAccountConfirmed}
              onChange={(e) => setField("businessAccountConfirmed", e.target.checked)}
              required={apiBlockRequired}
            />
            <label
              htmlFor={`${formId}-biz`}
              className="cursor-pointer text-[13px] leading-snug text-[var(--foreground)]"
            >
              Аккаунт Instagram в режиме Business / Creator, к Facebook Page и к вашему
              приложению (или Business Manager) он подключён, права согласованы с клиентом
            </label>
          </div>

          <div>
            <label
              htmlFor={`${formId}-contact`}
              className="text-[14px] font-medium text-[var(--foreground)]"
            >
              Контакт для связи
            </label>
            <input
              id={`${formId}-contact`}
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

      {status === "submitted" ? null : (
        <div className="mt-6 flex flex-wrap justify-end gap-2 border-t border-[var(--border)] pt-5 sm:gap-3">
          <button type="button" onClick={onDismiss} className={btnGhostClass}>
            Отмена
          </button>
          <button type="submit" className={btnPrimaryClass}>
            Готово (без сохранения)
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
};

export function ClientFormDialog({
  isOpen,
  onRequestClose,
  mode,
  client,
  session,
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
            />
          </div>
        </div>
      ) : null}
    </dialog>
  );
}
