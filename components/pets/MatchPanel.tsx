"use client";

import { useEffect, useState, useTransition } from "react";
import Link from "next/link";
import Image from "next/image";
import { Sparkles, CheckCircle, XCircle, ExternalLink, AlertCircle } from "lucide-react";

interface MatchCandidate {
  id: string;
  name: string | null;
  species: string;
  color: string;
  breed: string | null;
  photo: string | null;
  city: string;
  reportedAt: string;
}

interface PetMatch {
  matchId: string;
  score: number;
  status: string;
  matchedAt: string;
  candidate: MatchCandidate;
}

interface MatchPanelProps {
  petId: string;
  petKind: "lost" | "found";
  petName: string | null;
}

function ScoreBadge({ score }: { score: number }) {
  const pct = Math.round(score);
  const color =
    pct >= 80 ? "bg-resolved/15 text-resolved border-resolved/30" :
    pct >= 60 ? "bg-warning/15 text-warning border-warning/30" :
                "bg-brand-500/10 text-brand-600 border-brand-500/20";
  return (
    <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-semibold ${color}`}>
      <Sparkles className="h-3 w-3" />
      {pct}% compatível
    </span>
  );
}

export function MatchPanel({ petId, petKind, petName }: MatchPanelProps) {
  const [matches, setMatches] = useState<PetMatch[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    fetch(`/api/pets/${petId}/matches`)
      .then((r) => r.json())
      .then((body) => {
        if (body.success) setMatches(body.data ?? []);
        else setError(body.error ?? "Erro ao carregar");
      })
      .catch(() => setError("Erro de conexão"))
      .finally(() => setLoading(false));
  }, [petId]);

  function handleAction(matchId: string, action: "confirmed" | "dismissed") {
    startTransition(async () => {
      const res = await fetch(`/api/pets/${petId}/matches`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ matchId, action }),
      });
      if (res.ok) {
        setMatches((prev) =>
          action === "dismissed"
            ? prev.filter((m) => m.matchId !== matchId)
            : prev.map((m) =>
                m.matchId === matchId ? { ...m, status: "confirmed" } : m
              )
        );
      }
    });
  }

  const candidateLabel = petKind === "lost" ? "encontrado" : "perdido";

  if (loading) {
    return (
      <div className="rounded-2xl border border-border bg-bg-raised p-5">
        <div className="flex items-center gap-2 text-sm text-fg-muted">
          <Sparkles className="h-4 w-4 animate-pulse text-brand-500" />
          Buscando possíveis matches…
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center gap-2 rounded-2xl border border-danger/20 bg-danger/5 p-4 text-sm text-danger-fg">
        <AlertCircle className="h-4 w-4 shrink-0" />
        {error}
      </div>
    );
  }

  if (matches.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-border bg-bg-raised p-5 text-center">
        <Sparkles className="mx-auto mb-2 h-6 w-6 text-fg-subtle" />
        <p className="text-sm font-medium text-fg-muted">Nenhum match encontrado ainda</p>
        <p className="mt-1 text-xs text-fg-subtle">
          O sistema monitora automaticamente — você será notificado ao surgir um candidato.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="flex items-center gap-2 text-sm font-semibold text-fg">
          <Sparkles className="h-4 w-4 text-brand-500" />
          {matches.length} possível{matches.length > 1 ? "is" : ""} match{matches.length > 1 ? "es" : ""}
        </h3>
        <span className="text-xs text-fg-subtle">
          Pet {candidateLabel} encontrado pela IA
        </span>
      </div>

      {matches.map((m) => {
        const confirmed = m.status === "confirmed";
        return (
          <div
            key={m.matchId}
            className={[
              "relative overflow-hidden rounded-2xl border p-4 transition-all duration-150",
              confirmed
                ? "border-resolved/30 bg-resolved/5"
                : "border-border bg-bg-raised hover:border-brand-300/50 hover:shadow-hover",
            ].join(" ")}
          >
            <div className="flex items-start gap-3">
              {/* Foto */}
              <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-xl bg-bg-overlay">
                {m.candidate.photo ? (
                  <Image
                    src={m.candidate.photo}
                    alt={m.candidate.name ?? "Pet"}
                    fill
                    className="object-cover"
                    sizes="64px"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-2xl">
                    {m.candidate.species === "dog" ? "🐶" : m.candidate.species === "cat" ? "🐱" : "🐾"}
                  </div>
                )}
              </div>

              {/* Info */}
              <div className="min-w-0 flex-1">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="truncate font-semibold text-fg">
                      {m.candidate.name ?? `Pet ${candidateLabel}`}
                    </p>
                    <p className="text-xs text-fg-muted">
                      {m.candidate.color}
                      {m.candidate.breed ? ` · ${m.candidate.breed}` : ""}
                      {" · "}{m.candidate.city}
                    </p>
                  </div>
                  <ScoreBadge score={m.score} />
                </div>

                <p className="mt-1 text-xs text-fg-subtle">
                  Reportado {new Date(m.candidate.reportedAt).toLocaleDateString("pt-BR")}
                </p>

                {/* Ações */}
                <div className="mt-3 flex items-center gap-2">
                  <Link
                    href={`/pets/${m.candidate.id}`}
                    target="_blank"
                    className="flex items-center gap-1.5 rounded-lg border border-border bg-bg-overlay px-3 py-1.5 text-xs font-medium text-fg-muted transition-colors hover:border-brand-300 hover:text-brand-600"
                  >
                    <ExternalLink className="h-3 w-3" />
                    Ver pet
                  </Link>

                  {!confirmed && (
                    <>
                      <button
                        type="button"
                        disabled={isPending}
                        onClick={() => handleAction(m.matchId, "confirmed")}
                        className="flex items-center gap-1.5 rounded-lg border border-resolved/30 bg-resolved/10 px-3 py-1.5 text-xs font-medium text-resolved transition-colors hover:bg-resolved/20 disabled:opacity-50"
                      >
                        <CheckCircle className="h-3 w-3" />
                        É meu pet!
                      </button>
                      <button
                        type="button"
                        disabled={isPending}
                        onClick={() => handleAction(m.matchId, "dismissed")}
                        className="flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-fg-subtle transition-colors hover:border-danger/30 hover:text-danger-fg disabled:opacity-50"
                      >
                        <XCircle className="h-3 w-3" />
                        Não é
                      </button>
                    </>
                  )}

                  {confirmed && (
                    <span className="flex items-center gap-1 text-xs font-semibold text-resolved">
                      <CheckCircle className="h-3.5 w-3.5" />
                      Match confirmado!
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
