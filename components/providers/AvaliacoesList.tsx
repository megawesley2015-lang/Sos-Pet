import { UserRound } from "lucide-react";
import { StarRating } from "./StarRating";
import { formatRelativeDate } from "@/lib/utils/format";
import type { ReviewWithAuthor } from "@/lib/services/reviews";

interface AvaliacoesListProps {
  reviews: ReviewWithAuthor[];
}

export function AvaliacoesList({ reviews }: AvaliacoesListProps) {
  if (reviews.length === 0) {
    return (
      <p className="rounded-xl border border-dashed border-white/10 bg-ink-700/30 p-6 text-center text-sm text-fg-muted">
        Ainda sem avaliações. Seja o primeiro a avaliar.
      </p>
    );
  }

  return (
    <ul className="space-y-3">
      {reviews.map((r) => {
        const initials = (r.author_name ?? "?")
          .split(/\s+/)
          .filter(Boolean)
          .slice(0, 2)
          .map((s) => s[0]?.toUpperCase())
          .join("");

        return (
          <li
            key={r.id}
            className="rounded-xl border border-white/10 bg-ink-700/50 p-4"
          >
            <div className="flex items-start gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full border border-white/10 bg-ink-800 text-[11px] font-bold uppercase text-cyan-300">
                {r.author_avatar ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={r.author_avatar}
                    alt=""
                    className="h-full w-full object-cover"
                  />
                ) : initials ? (
                  initials
                ) : (
                  <UserRound className="h-4 w-4" />
                )}
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm font-bold text-fg">
                    {r.author_name ?? "Usuário"}
                  </p>
                  <span className="text-[11px] text-fg-subtle">
                    {formatRelativeDate(r.created_at)}
                  </span>
                </div>
                <div className="mt-1">
                  <StarRating
                    name={`r-${r.id}`}
                    readOnly
                    value={r.nota}
                    size="sm"
                  />
                </div>
                {r.comentario && (
                  <p className="mt-2 text-sm leading-relaxed text-fg">
                    {r.comentario}
                  </p>
                )}
              </div>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
