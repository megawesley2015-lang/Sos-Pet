'use server'

import { createSupabaseServerClient } from '@/lib/supabase/server'
import { PetSchema } from '@/lib/schemas/pet'

type ActionResult =
  | { success: true; data: { id: string } }
  | { success: false; errors: Record<string, string[]> }

export async function cadastrarPet(formData: FormData): Promise<ActionResult> {
  const raw = {
    tipo:            formData.get('tipo'),
    nome:            formData.get('nome') || undefined,
    especie:         formData.get('especie'),
    raca:            formData.get('raca') || undefined,
    cor:             formData.get('cor'),
    porte:           formData.get('porte') || undefined,
    sexo:            formData.get('sexo') || undefined,
    idade_aprox:     formData.get('idade_aprox') || undefined,
    descricao:       formData.get('descricao') || undefined,
    comportamento:   formData.get('comportamento') || undefined,
    bairro:          formData.get('bairro') || undefined,
    cidade:          formData.get('cidade'),
    data_ocorrencia: formData.get('data_ocorrencia'),
    foto_url:        formData.get('foto_url') || undefined,
    contato:         formData.get('contato'),
  }

  const parsed = PetSchema.safeParse(raw)
  if (!parsed.success) {
    return {
      success: false,
      errors: parsed.error.flatten().fieldErrors as Record<string, string[]>,
    }
  }

  const supabase = await createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data, error } = await supabase
    .from('achados_perdidos')
    .insert({ ...parsed.data, user_id: user?.id ?? null })
    .select('id')
    .single()

  if (error || !data) {
    console.error('[cadastrarPet]', error?.message)
    return {
      success: false,
      errors: { _form: ['Erro ao salvar. Tente novamente.'] },
    }
  }

  return { success: true, data: { id: data.id } }
}
