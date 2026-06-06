'use client'
// components/pets/PetFormWithUpload.tsx — PetForm com PhotoUpload integrado

import { useRouter }   from 'next/navigation'
import { usePetForm }  from '@/hooks/usePetForm'
import { PhotoUpload } from '@/components/ui/PhotoUpload'

const KIND_LABELS    = { lost: '🐾 Perdi meu pet',       found: '🔍 Encontrei um pet' }
const SPECIES_LABELS = { dog: 'Cachorro', cat: 'Gato',   other: 'Outro' }
const SIZE_LABELS    = { small: 'Pequeno (até 10kg)', medium: 'Médio (10–25kg)', large: 'Grande (acima de 25kg)' }
const SEX_LABELS     = { male: 'Macho', female: 'Fêmea', unknown: 'Não sei' }

const inputCls = `
  w-full rounded-lg border border-[rgb(var(--color-border))]
  bg-[rgb(var(--color-bg-overlay))]
  text-[rgb(var(--color-fg))]
  placeholder:text-[rgb(var(--color-fg-subtle))]
  px-4 py-3 text-sm
  focus:border-[rgb(var(--color-primary))]/60
  focus:outline-none focus:ring-2 focus:ring-[rgb(var(--color-primary))]/20
  transition-all duration-200
`.trim()

function Field({
  label, required, error, children,
}: {
  label: string; required?: boolean; error?: string; children: React.ReactNode
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-sm font-medium text-[rgb(var(--color-fg))]">
        {label}
        {required && <span className="ml-1 text-[rgb(var(--color-primary))]" aria-hidden="true">*</span>}
      </label>
      {children}
      {error && <span role="alert" className="text-xs text-[rgb(var(--color-danger))]">{error}</span>}
    </div>
  )
}

export function PetForm() {
  const router = useRouter()
  const { form, onSubmit, isSubmitting, errors, setValue, watch } = usePetForm({
    onSuccess: (petId) => router.push(`/achados-e-perdidos/${petId}?novo=true`),
    onError:   (msg)   => alert(msg),
  })

  const { register } = form
  const kind         = watch('kind')

  return (
    <form onSubmit={onSubmit} noValidate className="flex flex-col gap-6">

      <Field label="O que aconteceu?" required error={errors.kind?.message}>
        <div className="grid grid-cols-2 gap-3">
          {(Object.entries(KIND_LABELS) as [string, string][]).map(([value, label]) => (
            <label
              key={value}
              className={`
                flex items-center justify-center gap-2 rounded-lg border
                px-4 py-3 cursor-pointer text-sm font-medium transition-all duration-200
                ${watch('kind') === value
                  ? 'border-[rgb(var(--color-primary))] bg-[rgb(var(--color-primary))]/10 text-[rgb(var(--color-primary))]'
                  : 'border-[rgb(var(--color-border))] bg-[rgb(var(--color-bg-overlay))] text-[rgb(var(--color-fg-muted))] hover:border-[rgb(var(--color-border-strong))]'}
              `}
            >
              <input type="radio" value={value} className="sr-only" {...register('kind')} />
              {label}
            </label>
          ))}
        </div>
      </Field>

      <div className="grid grid-cols-2 gap-4">
        <Field label="Espécie" required error={errors.species?.message}>
          <select className={inputCls} {...register('species')}>
            {(Object.entries(SPECIES_LABELS) as [string, string][]).map(([v, l]) => (
              <option key={v} value={v}>{l}</option>
            ))}
          </select>
        </Field>
        <Field label="Porte" required error={errors.size?.message}>
          <select className={inputCls} {...register('size')}>
            {(Object.entries(SIZE_LABELS) as [string, string][]).map(([v, l]) => (
              <option key={v} value={v}>{l}</option>
            ))}
          </select>
        </Field>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Field label="Nome do pet" error={errors.name?.message}>
          <input type="text" placeholder="Ex: Rex, Mimi..." className={inputCls} {...register('name')} />
        </Field>
        <Field label="Raça" error={errors.breed?.message}>
          <input type="text" placeholder="Ex: Labrador, SRD..." className={inputCls} {...register('breed')} />
        </Field>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Field label="Cor predominante" required error={errors.color?.message}>
          <input type="text" placeholder="Ex: Caramelo, preto..." className={inputCls} {...register('color')} />
        </Field>
        <Field label="Sexo" required error={errors.sex?.message}>
          <select className={inputCls} {...register('sex')}>
            {(Object.entries(SEX_LABELS) as [string, string][]).map(([v, l]) => (
              <option key={v} value={v}>{l}</option>
            ))}
          </select>
        </Field>
      </div>

      <Field label="Idade aproximada" error={errors.age_approx?.message}>
        <input type="text" placeholder="Ex: Filhote, 2 anos..." className={inputCls} {...register('age_approx')} />
      </Field>

      <Field label="Descrição" required error={errors.description?.message}>
        <textarea
          rows={4}
          placeholder={kind === 'lost'
            ? 'Descreva seu pet: coleira, manchas, características marcantes...'
            : 'Descreva o pet encontrado: onde estava, comportamento...'}
          className={`${inputCls} resize-none`}
          {...register('description')}
        />
      </Field>

      <Field label="Comportamento" error={errors.behavior?.message}>
        <input type="text" placeholder="Ex: Dócil, arisco, machucado..." className={inputCls} {...register('behavior')} />
      </Field>

      <Field label="Foto do pet" error={errors.photo_url?.message}>
        <PhotoUpload
          onUpload={(url) => setValue('photo_url', url, { shouldValidate: true })}
          onError={(msg)  => form.setError('photo_url', { message: msg })}
        />
      </Field>

      <div className="grid grid-cols-2 gap-4">
        <Field label="Bairro" required error={errors.neighborhood?.message}>
          <input type="text" placeholder="Ex: Centro..." className={inputCls} {...register('neighborhood')} />
        </Field>
        <Field label="Cidade" required error={errors.city?.message}>
          <input type="text" placeholder="Ex: Santos..." className={inputCls} {...register('city')} />
        </Field>
      </div>

      <Field label={`Data do ${kind === 'lost' ? 'desaparecimento' : 'encontro'}`} error={errors.event_date?.message}>
        <input type="date" className={inputCls} max={new Date().toISOString().split('T')[0]} {...register('event_date')} />
      </Field>

      <div className="rounded-xl border border-[rgb(var(--color-border))] bg-[rgb(var(--color-bg-raised))] p-4 flex flex-col gap-4">
        <div>
          <p className="text-xs font-medium text-[rgb(var(--color-fg-muted))] uppercase tracking-wider">Contato</p>
          <p className="mt-1 text-xs text-[rgb(var(--color-fg-subtle))]">
            Visível apenas na página de detalhes — não aparece na listagem pública.
          </p>
        </div>
        <Field label="Seu nome" required error={errors.contact_name?.message}>
          <input type="text" placeholder="Como quer ser chamado..." className={inputCls} {...register('contact_name')} />
        </Field>
        <Field label="Telefone" required error={errors.contact_phone?.message}>
          <input type="tel" placeholder="(13) 99999-9999" className={inputCls} {...register('contact_phone')} />
        </Field>
        <label className="flex items-center gap-3 cursor-pointer">
          <input type="checkbox" className="h-4 w-4 rounded border-[rgb(var(--color-border))] accent-[rgb(var(--color-primary))]" {...register('contact_whatsapp')} />
          <span className="text-sm text-[rgb(var(--color-fg-muted))]">Este número tem WhatsApp</span>
        </label>
      </div>

      <button
        type="submit"
        disabled={isSubmitting}
        className="
          inline-flex items-center justify-center gap-2 rounded-full
          bg-[rgb(var(--color-primary))] text-white
          px-8 py-4 text-sm font-semibold
          hover:bg-[rgb(var(--color-primary))]/90
          active:scale-[0.98] transition-all duration-200
          focus-visible:outline-2 focus-visible:outline-offset-2
          focus-visible:outline-[rgb(var(--color-primary))]
          disabled:opacity-50 disabled:cursor-not-allowed
        "
      >
        {isSubmitting
          ? 'Salvando...'
          : kind === 'lost' ? '🐾 Cadastrar pet perdido' : '🔍 Cadastrar pet encontrado'}
      </button>
    </form>
  )
}
