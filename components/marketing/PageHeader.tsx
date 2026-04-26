interface PageHeaderProps {
  eyebrow?: string;
  title: string;
  description?: string;
}

/**
 * Cabeçalho padronizado pras páginas estáticas (light/warm).
 */
export function PageHeader({ eyebrow, title, description }: PageHeaderProps) {
  return (
    <header className="border-b border-warm-200/60 bg-warm-100/30 py-12">
      <div className="mx-auto max-w-3xl px-4">
        {eyebrow && (
          <p className="text-xs font-bold uppercase tracking-widest text-brand-700/80">
            {eyebrow}
          </p>
        )}
        <h1 className="mt-2 font-display text-3xl font-black text-ink-900 sm:text-4xl">
          {title}
        </h1>
        {description && (
          <p className="mt-3 max-w-2xl text-base text-ink-700">{description}</p>
        )}
      </div>
    </header>
  );
}
