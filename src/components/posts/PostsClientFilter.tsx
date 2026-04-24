"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";

export type PostsClientFilterOption = {
  id: string;
  label: string;
};

type PostsClientFilterProps = {
  clients: PostsClientFilterOption[];
};

export function PostsClientFilter({ clients }: PostsClientFilterProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const raw = searchParams.get("client") ?? "";
  const selected = clients.some((c) => c.id === raw) ? raw : "";

  return (
    <div className="mb-8 max-w-md">
      <label
        htmlFor="posts-filter-client"
        className="text-[14px] font-medium text-[var(--foreground)]"
      >
        Пользователь
      </label>
      <select
        id="posts-filter-client"
        className="mt-2 w-full"
        value={selected}
        onChange={(e) => {
          const id = e.target.value;
          const next = new URLSearchParams(searchParams.toString());
          if (id) next.set("client", id);
          else next.delete("client");
          const q = next.toString();
          router.push(q ? `${pathname}?${q}` : pathname, { scroll: false });
        }}
      >
        <option value="">Все пользователи</option>
        {clients.map((c) => (
          <option key={c.id} value={c.id}>
            {c.label}
          </option>
        ))}
      </select>
    </div>
  );
}
