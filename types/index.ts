export interface PetCard {
  id: string
  tipo: 'perdido' | 'encontrado'
  nome: string | null
  especie: string
  raca: string | null
  cor: string | null
  porte: string | null
  sexo: string | null
  bairro: string | null
  cidade: string
  data_ocorrencia: string
  foto_url: string | null
  status: string
  created_at: string
}
