// components/FaixaParceiros.server.tsx — busca parceiros ativos do Supabase
// Falha silenciosa: retorna null se zero parceiros ou erro

import { createSupabaseServerClient as createClient } from '@/lib/supabase/server'
import FaixaParceiros, { type Parceiro } from './FaixaParceiros'

export default async function FaixaParceirosServer() {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('parceiros')
    .select('id, nome, cidade, logo_url, site_url, verificado, categoria_parceiro')
    .eq('ativo', true)
    .order('verificado', { ascending: false })
    .order('nome', { ascending: true })
    .limit(12)

  if (error || !data || data.length === 0) return null

  return <FaixaParceiros parceiros={data as Parceiro[]} />
}
