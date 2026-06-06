'use client'
// hooks/usePetForm.ts — React Hook Form + submit para /api/pets

import { useForm, type Resolver }           from 'react-hook-form'
import { zodResolver }                      from '@hookform/resolvers/zod'
import { petSchema, type PetFormData }      from '@/lib/schemas/pet'
import { resolveError }                     from '@/lib/errors'
import type { ApiResponse }                 from '@/types/errors'

interface UsePetFormOptions {
  onSuccess?: (petId: string) => void
  onError?:   (message: string) => void
}

export function usePetForm({ onSuccess, onError }: UsePetFormOptions = {}) {
  const form = useForm<PetFormData>({
    resolver: zodResolver(petSchema) as Resolver<PetFormData>,
    defaultValues: {
      kind:             'lost',
      species:          'dog',
      size:             'medium',
      sex:              'unknown',
      contact_whatsapp: false,
      color:            '',
      description:      '',
      neighborhood:     '',
      city:             '',
      contact_name:     '',
      contact_phone:    '',
    },
    mode: 'onBlur',
  })

  async function onSubmit(data: PetFormData) {
    try {
      const res = await fetch('/api/pets', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify(data),
      })

      const json: ApiResponse<{ id: string }> = await res.json()

      if (!json.success) {
        onError?.(json.error)
        return
      }

      onSuccess?.(json.data.id)

    } catch (err) {
      const appErr = resolveError(err)
      onError?.(appErr.message)
    }
  }

  return {
    form,
    onSubmit:     form.handleSubmit(onSubmit),
    isSubmitting: form.formState.isSubmitting,
    errors:       form.formState.errors,
    setValue:     form.setValue,
    watch:        form.watch,
  }
}
