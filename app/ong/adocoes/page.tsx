import { redirect } from "next/navigation";
import Link from "next/link";
import { Heart, Plus, CheckCircle2, RotateCcw, Skull, ArrowRightLeft } from "lucide-react";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getUserSafe } from "@/lib/auth/safe";
import type { AdoptionStatus } from "@/lib/types/database";
import { isFollowUp30Overdue } from "@/lib/validation/ong";

export const revalidate = 0;
export const metadata = { title: "Adoções — Painel ONG" };

const STATUS_CONFIG: Record<AdoptionStatus, { label: string; color: string; icon: typeof CheckCircle2 }> = {
  active:      { label: "Ativo",       color: "border-success/40 bg-success/10 text-success",        icon: CheckCircle2 },
  returned:    { label: "Devolvido",   color: "border-danger/40 bg-danger/10 text-danger",             icon: RotateCcw },
  deceased:    { label: "Falecido",    color: "border-fg-subtle/40 bg-ink-600/40 text-fg-subtle",      icon: Skull },
  transferred: { label: "Transferido", color: "border-cyan-500/40 bg-cyan-500/10 text-cyan-300",       icon: ArrowRightLeft },
};

interface SearchParams {
  status?: AdoptionStatus;
}

export default async function AdocoesPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const supabase = await createSupabaseServerClient();
  const user = await getUserSafe(supabase);
  if (!user) redirect("/login?next=/ong/adocoes");

  const { data: shelter } = await supabase
    .from("shelters")
    .select("id")
    .eq("user_id", user.id)
    .maybeSingle();

  if (!shelter) redirect("/ong/cadastro");

  const params = await searchParams;
  const { status } = params;

  let query = supabase
    .from("adoptions")
    .select(`
      id, adopter_name, adopter_city, adoption_date,
      follow_up_30_date, follow_up_90_date, status, created_at,
      shelter_pets(name, species)
    `)
    .eq("shelter_id", shelter.id)
    .order("adoption_date", { ascending: false });

  if (status) query = query.eq("status", status);

  const { data: adoptions } = await query;

  const buildFilter = (s: string) => {
    if (status === s) return "/ong/adocoes";
    return `/ong/adocoes?status=${s}`;
  };

  const today = new Date().toISOString().split("T")[0];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold text-fg">Adoções</h1>
          <p className="mt-1 text-sm text-fg-muted">
            {adoptions?.length ?? 0} registro(s)
          </p>
        </div>
        <Link
          href="/ong/adocoes/novo"
          className="ml-auto flex items-center gap-2 rounded-lg bg-brand-500 px-4 py-2.5 text-sm font-bold text-white shadow-glow-brand transition hover:bg-brand-400"
        >
          <Plus className="h-4 w-4" />
          Registrar adoção
        </Link>
      </div>

      {/* Filtros de status */}
      <div className="flex flex-wrap gap-2">
        {(["active", "returned", "deceased", "transferred"] as AdoptionStatus[]).map((s) => {
          const cfg = STATUS_CONFIG[s];
          const Icon = cfg.icon;
          return (
            <Link
              key={s}
              href={buildFilter(s)}
              className={`flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-bold transition ${
                status === s ? cfg.color : "border-white/10 bg-ink-600/40 text-fg-muted hover:border-white/20"
              }`}
            >
              <Icon className="h-3 w-3" />
              {cfg.label}
            </Link>
          );
        })}
      </div>

      {!adoptions || adoptions.length === 0 ? (
        <div className="flex flex-col items-center gap-4 rounded-xl border border-dashed border-white/10 bg-ink-700/20 py-16">
          <Heart className="h-12 w-12 text-fg-subtle/40" strokeWidth={1} />
          <p className="text-sm text-fg-muted">Nenhuma adoção registrada.</p>
          <Link
            href="/ong/adocoes/novo"
            className="rounded-lg bg-brand-500 px-4 py-2 text-sm font-bold text-white"
          >
            Registrar primeira adoção
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {adoptions.map((adoption) => {
            const cfg = STATUS_CONFIG[adoption.status as AdoptionStatus];
            const Icon = cfg.icon;
            
            const petName = adoption.shelter_pets?.name ?? "Sem nome";
            
            const petSpecies = adoption.shelter_pets?.species;
            const emoji = petSpecies === "dog" ? "🐶" : petSpecies === "cat" ? "🐱" : "🐾";
            const f30 = adoption.follow_up_30_date;
            const f90 = adoption.follow_up_90_date;
            // follow-up atrasado = não registrado E adoção tem N+ dias
            const f30overdue = adoption.status === "active" &&
              isFollowUp30Overdue(adoption.adoption_date, f30 ?? null, today);
            const f90overdue = adoption.status === "active" && !f90 && (() => {
              const due = new Date(adoption.adoption_date);
              due.setDate(due.getDate() + 90);
              return due.toISOString().split("T")[0] <= today;
            })();

            return (
              <Link
                key={adoption.id}
                href={`/ong/adocoes/${adoption.id}`}
                className={`flex items-center gap-4 rounded-xl border p-4 transition hover:border-brand-500/30 hover:shadow-glow-brand ${
                  f30overdue || f90overdue
                    ? "border-danger/20 bg-danger/5"
                    : "border-white/5 bg-ink-700/50"
                }`}
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-ink-600 text-xl">
                  {emoji}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="font-semibold text-fg">{petName}</p>
                    <span className="text-fg-subtle">→</span>
                    <p className="truncate text-sm text-fg">{adoption.adopter_name}</p>
                  </div>
                  <div className="mt-0.5 flex flex-wrap gap-3 text-xs text-fg-muted">
                    <span>{adoption.adopter_city}</span>
                    <span>{new Date(adoption.adoption_date).toLocaleDateString("pt-BR")}</span>
                    {f30overdue && (
                      <span className="font-bold text-danger">🔴 Follow-up 30d atrasado</span>
                    )}
                    {f90overdue && !f30overdue && (
                      <span className="font-bold text-danger">🔴 Follow-up 90d atrasado</span>
                    )}
                    {f30 && !f30overdue && (
                      <span>30d: {new Date(f30).toLocaleDateString("pt-BR")} ✓</span>
                    )}
                    {f90 && !f90overdue && (
                      <span>90d: {new Date(f90).toLocaleDateString("pt-BR")} ✓</span>
                    )}
                  </div>
                </div>
                <span className={`shrink-0 flex items-center gap-1 rounded-full border px-2.5 py-1 text-[10px] font-bold ${cfg.color}`}>
                  <Icon className="h-3 w-3" />
                  {cfg.label}
                </span>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
