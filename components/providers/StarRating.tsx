"use client";

import { useState } from "react";
import { Star } from "lucide-react";

interface StarRatingProps {
  name: string;
  defaultValue?: number;
  /** Apenas leitura (mostra a nota sem permitir mudar). */
  readOnly?: boolean;
  size?: "sm" | "md" | "lg";
  /** Para leitura: aceita decimal pra mostrar meia-estrela aproximada. */
  value?: number;
}

const sizeMap = {
  sm: "h-4 w-4",
  md: "h-5 w-5",
  lg: "h-7 w-7",
} as const;

/**
 * Rating de 5 estrelas. Em modo edit, renderiza inputs radio escondidos
 * com o name passado — Server Action recebe via formData.get(name).
 */
export function StarRating({
  name,
  defaultValue = 0,
  readOnly = false,
  size = "md",
  value,
}: StarRatingProps) {
  const [selected, setSelected] = useState(defaultValue);
  const [hover, setHover] = useState(0);

  const display = readOnly ? value ?? 0 : hover || selected;

  return (
    <div className="flex items-center gap-1" role={readOnly ? "img" : undefined}>
      {[1, 2, 3, 4, 5].map((n) => {
        const filled = n <= Math.floor(display);
        const half = !filled && n - 0.5 <= display;
        return (
          <label
            key={n}
            className={readOnly ? "" : "cursor-pointer"}
            onMouseEnter={() => !readOnly && setHover(n)}
            onMouseLeave={() => !readOnly && setHover(0)}
          >
            {!readOnly && (
              <input
                type="radio"
                name={name}
                value={n}
                checked={selected === n}
                onChange={() => setSelected(n)}
                className="sr-only"
              />
            )}
            <Star
              className={`${sizeMap[size]} transition-all ${
                filled
                  ? "fill-brand-500 text-brand-500"
                  : half
                    ? "fill-brand-500/50 text-brand-500"
                    : "fill-transparent text-fg-subtle"
              } ${!readOnly && "hover:scale-110"}`}
              strokeWidth={1.5}
            />
          </label>
        );
      })}
    </div>
  );
}
