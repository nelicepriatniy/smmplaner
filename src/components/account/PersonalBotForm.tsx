"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition, type FormEvent } from "react";
import { updatePersonalTelegramBotAction } from "@/app/(main)/account/actions";

type PersonalBotFormProps = {
  hasSavedToken: boolean;
};

export function PersonalBotForm({ hasSavedToken }: PersonalBotFormProps) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [message, setMessage] = useState<{
    type: "ok" | "err";
    text: string;
  } | null>(null);
  const [value, setValue] = useState("");

  function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setMessage(null);
    const t = value.trim();
    if (!t) {
      if (hasSavedToken) {
        setMessage({ type: "err", text: "Введите новый токен или нажмите «Удалить токен»." });
        return;
      }
      setMessage({ type: "err", text: "Вставьте токен бота от @BotFather." });
      return;
    }
    const fd = new FormData();
    fd.set("personalTelegramBotToken", t);
    start(async () => {
      const r = await updatePersonalTelegramBotAction(fd);
      if (r.ok) {
        setValue("");
        setMessage({ type: "ok", text: "Токен сохранён. Он больше не отображается в форме." });
        router.refresh();
      } else {
        setMessage({ type: "err", text: r.error });
      }
    });
  }

  return (
    <form onSubmit={onSubmit} className="space-y-3">
      <p className="text-[12px] text-[var(--muted)]">
        Кнопка «Уведомить клиента» в редактировании поста шлёт этим ботом в Telegram ссылку на
        согласование. В поле «Контакт» в карточке клиента укажите{" "}
        <span className="whitespace-nowrap">@username</span>, t.me/… или числовой id — после команды
        /start в вашем боте.
      </p>
      <div>
        <label
          htmlFor="account-personal-bot"
          className="text-[14px] font-medium text-[var(--foreground)]"
        >
          Токен бота
        </label>
        {hasSavedToken ? (
          <p className="mb-1.5 mt-0.5 text-[12px] text-[var(--muted)]">
            Текущий токен в базе не показывается. Введите новый ниже, чтобы заменить.
          </p>
        ) : null}
        <input
          id="account-personal-bot"
          name="personalTelegramBot"
          type="password"
          autoComplete="off"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          disabled={pending}
          placeholder="123456789:AA…"
          className="mt-1.5 w-full max-w-md rounded-xl border border-[var(--border)] bg-[var(--background)] px-3 py-2.5 text-[15px] text-[var(--foreground)] outline-offset-2 focus:border-[color-mix(in_srgb,var(--accent)_50%,var(--border))] focus:ring-2 focus:ring-[var(--accent-soft)]"
        />
      </div>
      {message ? (
        <p
          role="status"
          className={
            message.type === "ok"
              ? "text-[13px] text-[color-mix(in_srgb,#5aab7a_90%,var(--foreground))]"
              : "text-[13px] text-rose-200"
          }
        >
          {message.text}
        </p>
      ) : null}
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="submit"
          disabled={pending}
          className="rounded-xl bg-[var(--accent)] px-4 py-2.5 text-[14px] font-semibold text-[#0e1016] transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {pending ? "Сохранение…" : "Сохранить"}
        </button>
        {hasSavedToken ? (
          <button
            type="button"
            disabled={pending}
            onClick={() => {
              if (!window.confirm("Удалить сохранённый токен? Уведомления в Telegram не будут работать, пока не добавите токен снова.")) {
                return;
              }
              setMessage(null);
              setValue("");
              const fd = new FormData();
              fd.set("personalTelegramBotToken", "");
              start(async () => {
                const r = await updatePersonalTelegramBotAction(fd);
                if (r.ok) {
                  setMessage({ type: "ok", text: "Токен удалён." });
                  router.refresh();
                } else {
                  setMessage({ type: "err", text: r.error });
                }
              });
            }}
            className="rounded-xl border border-[var(--border)] bg-[var(--surface-elevated)] px-4 py-2.5 text-[14px] font-medium text-[var(--foreground)] transition-colors hover:bg-[var(--border)] disabled:cursor-not-allowed disabled:opacity-50"
          >
            Удалить токен
          </button>
        ) : null}
      </div>
    </form>
  );
}
