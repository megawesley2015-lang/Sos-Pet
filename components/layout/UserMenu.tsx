"use client";

import Link from "next/link";
import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Building2,
  ChevronDown,
  LogOut,
  PawPrint,
  Siren,
  ShieldCheck,
  User as UserIcon,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";

interface UserMenuProps {
  email: string;
  fullName: string | null;
  avatarUrl: string | null;
  role?: string | null;
}

/**
 * Menu dropdown do usuário logado — visível na TopBar.
 * Server passa o user; este componente só lida com UI + signOut.
 */
export function UserMenu({ email, fullName, avatarUrl, role }: UserMenuProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const router = useRouter();

  // Fechar ao clicar fora
  useEffect(() => {
    if (!open) return;
    function onClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, [open]);

  // Fechar com Esc
  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    setOpen(false);
    router.refresh();
    router.push("/pets");
  }

  const initials = (fullName ?? email)
    .split(/[\s@]/)
    .filter(Boolean)
    .slice(0, 2)
    .map((s) => s[0]?.toUpperCase())
    .join("");

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={open}
        className="flex items-center gap-1.5 rounded-full border-2 border-cyan-500/60 bg-ink-600 px-1 py-1 text-cyan-300 shadow-glow-cyan transition-all hover:bg-cyan-500/10"
      >
        <span className="flex h-7 w-7 items-center justify-center rounded-full bg-cyan-500/20 text-[11px] font-bold uppercase text-cyan-200">
          {avatarUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={avatarUrl}
              alt=""
              className="h-full w-full rounded-full object-cover"
            />
          ) : (
            initials || "?"
          )}
        </span>
        <ChevronDown className="h-3.5 w-3.5" />
      </button>

      {open && (
        <div
          role="menu"
          data-theme="dark"
          className="absolute right-0 mt-2 w-56 overflow-hidden rounded-xl border border-white/10 bg-ink-700/95 shadow-card-dark backdrop-blur-md"
        >
          <div className="border-b border-white/5 px-4 py-3">
            <p className="truncate text-sm font-bold text-fg">
              {fullName ?? "Usuário"}
            </p>
            <p className="truncate text-xs text-fg-muted">{email}</p>
          </div>

          <Link
            href="/meus-pets"
            role="menuitem"
            onClick={() => setOpen(false)}
            className="flex items-center gap-2 px-4 py-2.5 text-sm text-fg hover:bg-white/5"
          >
            <PawPrint className="h-4 w-4 text-brand-400" />
            Meus pets
          </Link>

          <Link
            href="/resgate"
            role="menuitem"
            onClick={() => setOpen(false)}
            className="flex items-center gap-2 px-4 py-2.5 text-sm text-fg hover:bg-white/5"
          >
            <Siren className="h-4 w-4 text-brand-400" />
            Central de resgate
          </Link>

          <Link
            href="/dashboard-prestador"
            role="menuitem"
            onClick={() => setOpen(false)}
            className="flex items-center gap-2 px-4 py-2.5 text-sm text-fg hover:bg-white/5"
          >
            <Building2 className="h-4 w-4 text-cyan-400" />
            Painel prestador
          </Link>

          <Link
            href="/perfil"
            role="menuitem"
            onClick={() => setOpen(false)}
            className="flex items-center gap-2 px-4 py-2.5 text-sm text-fg hover:bg-white/5"
          >
            <UserIcon className="h-4 w-4 text-cyan-400" />
            Meu perfil
          </Link>

          {role === "admin" && (
            <Link
              href="/admin"
              role="menuitem"
              onClick={() => setOpen(false)}
              className="flex items-center gap-2 border-t border-white/5 px-4 py-2.5 text-sm text-brand-400 hover:bg-brand-500/10"
            >
              <ShieldCheck className="h-4 w-4" />
              Painel admin
            </Link>
          )}

          <button
            type="button"
            role="menuitem"
            onClick={handleSignOut}
            className="flex w-full items-center gap-2 border-t border-white/5 px-4 py-2.5 text-left text-sm text-fg-muted hover:bg-danger/10 hover:text-danger-fg"
          >
            <LogOut className="h-4 w-4" />
            Sair
          </button>
        </div>
      )}
    </div>
  );
}
