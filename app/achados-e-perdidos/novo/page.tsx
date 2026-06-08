'use client'
// src/app/achados-e-perdidos/novo/page.tsx
// Formulário de cadastro — usa Server Action via useFormState

import { useActionState, useRef, useState } from 'react'
import { useRouter }    from 'next/navigation'
import { cadastrarPet } from '@/actions/pets'
import { uploadFotoPet } from '@/actions/upload'

type FormState = {
  errors?: Record<string, string[]>
  success?: boolean
}

const initialState: FormState = {}

export default function NovoPetPage() {
  const router      = useRouter()
  const fileRef     = useRef<HTMLInputElement>(null)
  const [fotoUrl, setFotoUrl]       = useState<string | null>(null)
  const [uploading, setUploading]   = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)

  const [state, formAction, pending] = useActionState(
    async (_prev: FormState, formData: FormData) => {
      // Injeta foto_url se fez upload
      if (fotoUrl) formData.set('foto_url', fotoUrl)

      const result = await cadastrarPet(formData)

      if (result.success) {
        router.push(`/achados-e-perdidos/${result.data.id}?cadastrado=1`)
        return { success: true }
      }
      return { errors: result.errors }
    },
    initialState
  )

  // Upload separado antes de submeter o formulário
  async function handleFotoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    setUploading(true)
    setUploadError(null)

    const fd = new FormData()
    fd.append('foto', file)

    const result = await uploadFotoPet(fd)

    setUploading(false)

    if (result.success) {
      setFotoUrl(result.url)
    } else {
      setUploadError(result.error)
      if (fileRef.current) fileRef.current.value = ''
    }
  }

  const err = (field: string) => state.errors?.[field]?.[0]

  return (
    <main className="max-w-2xl mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">🐾 Registrar Pet</h1>
        <p className="text-gray-500 text-sm mt-1">
          Preencha as informações do pet perdido ou encontrado.
        </p>
      </div>

      <form action={formAction} className="space-y-5">

        {/* Tipo de registro */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1.5">
            Tipo de registro *
          </label>
          <div className="flex gap-4">
            {(['perdido', 'encontrado'] as const).map((tipo) => (
              <label key={tipo} className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="tipo"
                  value={tipo}
                  defaultChecked={tipo === 'perdido'}
                  className="accent-[#20B2AA]"
                  required
                />
                <span className="capitalize font-medium text-gray-700">{tipo}</span>
              </label>
            ))}
          </div>
          {err('tipo') && <p className="text-red-500 text-xs mt-1">{err('tipo')}</p>}
        </div>

        {/* Espécie */}
        <Field label="Espécie *" error={err('especie')}>
          <select
            name="especie"
            required
            className={inputClass(!!err('especie'))}
          >
            <option value="">Selecione...</option>
            <option value="cao">Cão</option>
            <option value="gato">Gato</option>
            <option value="outro">Outro</option>
          </select>
        </Field>

        {/* Nome */}
        <Field label="Nome do pet" error={err('nome')}>
          <input
            type="text"
            name="nome"
            placeholder="Ex: Rex, Mia..."
            maxLength={100}
            className={inputClass(!!err('nome'))}
          />
        </Field>

        {/* Raça e Cor */}
        <div className="grid grid-cols-2 gap-4">
          <Field label="Raça" error={err('raca')}>
            <input type="text" name="raca" maxLength={100} className={inputClass(!!err('raca'))} />
          </Field>
          <Field label="Cor predominante *" error={err('cor')}>
            <input
              type="text"
              name="cor"
              placeholder="Ex: preto, caramelo..."
              maxLength={50}
              required
              className={inputClass(!!err('cor'))}
            />
          </Field>
        </div>

        {/* Porte e Sexo */}
        <div className="grid grid-cols-2 gap-4">
          <Field label="Porte" error={err('porte')}>
            <select name="porte" className={inputClass(!!err('porte'))}>
              <option value="">Não sei</option>
              <option value="pequeno">Pequeno</option>
              <option value="medio">Médio</option>
              <option value="grande">Grande</option>
            </select>
          </Field>
          <Field label="Sexo" error={err('sexo')}>
            <select name="sexo" className={inputClass(!!err('sexo'))}>
              <option value="desconhecido">Não sei</option>
              <option value="macho">Macho</option>
              <option value="femea">Fêmea</option>
            </select>
          </Field>
        </div>

        {/* Localização */}
        <div className="grid grid-cols-2 gap-4">
          <Field label="Bairro" error={err('bairro')}>
            <input type="text" name="bairro" maxLength={100} className={inputClass(!!err('bairro'))} />
          </Field>
          <Field label="Cidade *" error={err('cidade')}>
            <input
              type="text"
              name="cidade"
              required
              maxLength={100}
              className={inputClass(!!err('cidade'))}
            />
          </Field>
        </div>

        {/* Data */}
        <Field label="Data do desaparecimento / encontro *" error={err('data_ocorrencia')}>
          <input
            type="date"
            name="data_ocorrencia"
            required
            max={new Date().toISOString().split('T')[0]}
            className={inputClass(!!err('data_ocorrencia'))}
          />
        </Field>

        {/* Descrição */}
        <Field label="Descrição" error={err('descricao')}>
          <textarea
            name="descricao"
            rows={3}
            maxLength={1000}
            placeholder="Características físicas, marcas especiais..."
            className={inputClass(!!err('descricao'))}
          />
        </Field>

        {/* Comportamento */}
        <Field label="Comportamento" error={err('comportamento')}>
          <input
            type="text"
            name="comportamento"
            maxLength={200}
            placeholder="Ex: dócil, arisco, machucado..."
            className={inputClass(!!err('comportamento'))}
          />
        </Field>

        {/* Foto */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1.5">
            Foto do pet
          </label>
          <input
            ref={fileRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={handleFotoChange}
            className="block w-full text-sm text-gray-500
                       file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0
                       file:text-sm file:font-semibold file:bg-[#20B2AA]/10
                       file:text-[#20B2AA] hover:file:bg-[#20B2AA]/20 cursor-pointer"
          />
          {uploading && (
            <p className="text-xs text-[#20B2AA] mt-1 animate-pulse">Fazendo upload...</p>
          )}
          {uploadError && (
            <p className="text-xs text-red-500 mt-1">{uploadError}</p>
          )}
          {fotoUrl && !uploading && (
            <p className="text-xs text-green-600 mt-1">✅ Foto enviada com sucesso</p>
          )}
          <p className="text-xs text-gray-400 mt-1">JPEG, PNG ou WebP · Máx. 5MB</p>
        </div>

        {/* Contato */}
        <Field label="Telefone / WhatsApp para contato *" error={err('contato')}>
          <input
            type="tel"
            name="contato"
            required
            placeholder="(13) 99999-9999"
            maxLength={20}
            className={inputClass(!!err('contato'))}
          />
          <p className="text-xs text-gray-400 mt-1">
            Exibido apenas na página de detalhes do pet.
          </p>
        </Field>

        {/* Erro geral */}
        {state.errors?._form && (
          <p className="bg-red-50 text-red-600 text-sm px-4 py-3 rounded-lg border border-red-200">
            {state.errors._form[0]}
          </p>
        )}

        {/* Submit */}
        <button
          type="submit"
          disabled={pending || uploading}
          className="w-full bg-brand-500 hover:bg-brand-600 disabled:opacity-50
                     text-white font-bold py-3.5 rounded-lg transition-colors
                     duration-200 text-base"
        >
          {pending ? 'Salvando...' : '🐾 Salvar Registro'}
        </button>

      </form>
    </main>
  )
}

// ─── Helpers de UI ───────────────────────────────────────────────────────────

function Field({
  label,
  error,
  children,
}: {
  label: string
  error?: string
  children: React.ReactNode
}) {
  return (
    <div>
      <label className="block text-sm font-semibold text-gray-700 mb-1.5">{label}</label>
      {children}
      {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
    </div>
  )
}

function inputClass(hasError: boolean) {
  return [
    'w-full border rounded-lg px-3 py-2.5 text-sm bg-white',
    'focus:outline-none focus:ring-2 transition-colors duration-200',
    hasError
      ? 'border-red-400 focus:border-red-400 focus:ring-red-200'
      : 'border-gray-200 focus:border-[#20B2AA] focus:ring-[#20B2AA]/20',
  ].join(' ')
}
