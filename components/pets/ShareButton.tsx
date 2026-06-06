'use client'
// components/pets/ShareButton.tsx — isolado como Client Component

interface ShareButtonProps {
  petName: string
}

export function ShareButton({ petName }: ShareButtonProps) {
  return (
    <button
      type="button"
      onClick={() => {
        if (navigator.share) {
          navigator.share({
            title: `${petName} — SOS Pet`,
            text:  `Ajude a encontrar ${petName}! Veja o alerta no SOS Pet.`,
            url:   window.location.href,
          })
        } else {
          navigator.clipboard.writeText(window.location.href)
          alert('Link copiado!')
        }
      }}
      className="
        flex items-center justify-center gap-2 rounded-full
        border border-[rgb(var(--color-border))]
        px-6 py-3 text-sm text-[rgb(var(--color-fg-muted))]
        hover:border-[rgb(var(--color-border-strong))] hover:text-[rgb(var(--color-fg))]
        transition-all
      "
    >
      🔗 Compartilhar este alerta
    </button>
  )
}
