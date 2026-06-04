// types/pets.ts — alinhado com schema real da tabela pets no Supabase

export type PetKind    = 'lost' | 'found'
export type PetSpecies = 'dog' | 'cat' | 'other'
export type PetSize    = 'small' | 'medium' | 'large'
export type PetSex     = 'male' | 'female' | 'unknown'
export type PetStatus  = 'active' | 'resolved' | 'expired' | 'draft' | 'removed'

export interface Pet {
  id:               string
  owner_id:         string | null       // null = cadastro anônimo (MVP)
  kind:             PetKind
  status:           PetStatus
  name:             string | null
  species:          string
  breed:            string | null
  color:            string | null
  size:             PetSize | null
  sex:              PetSex | null
  age_approx:       string | null
  description:      string | null
  behavior:         string | null
  photo_url:        string | null
  neighborhood:     string | null
  city:             string | null
  state:            string | null
  latitude:         number | null
  longitude:        number | null
  // Contato — NUNCA expor na listagem, apenas em /pets/[id]
  contact_name:     string | null
  contact_phone:    string | null
  contact_whatsapp: boolean
  event_date:       string | null       // YYYY-MM-DD
  created_at:       string
  updated_at:       string
  deleted_at?:      string | null       // ISO string quando dados pessoais foram apagados (LGPD)
}

// Para listagem pública — sem dados de contato nem owner_id
export type PetPublic = Omit<Pet,
  'owner_id' | 'contact_name' | 'contact_phone' | 'contact_whatsapp'
>

// Para página de detalhes — com contato, sem owner_id
export type PetDetail = Omit<Pet, 'owner_id'>

// Para INSERT — banco gera id, created_at, updated_at, deleted_at
export type InsertPet = Omit<Pet, 'id' | 'created_at' | 'updated_at' | 'deleted_at'>

// Para UPDATE — apenas campos editáveis
export type UpdatePet = Partial<
  Pick<Pet,
    | 'kind' | 'status' | 'name' | 'species' | 'breed' | 'color'
    | 'size' | 'sex' | 'age_approx' | 'description' | 'behavior'
    | 'photo_url' | 'neighborhood' | 'city' | 'state'
    | 'latitude' | 'longitude' | 'contact_name'
    | 'contact_phone' | 'contact_whatsapp' | 'event_date'
  >
> & { id: string }

// Filtros aceitos na listagem
export interface PetFilters {
  kind?:         PetKind
  species?:      string
  city?:         string
  neighborhood?: string
  status?:       PetStatus
}

// Colunas seguras para SELECT na listagem pública
// NUNCA incluir contact_* ou owner_id aqui
export const PET_PUBLIC_COLUMNS = [
  'id', 'kind', 'status', 'name', 'species', 'breed',
  'color', 'size', 'sex', 'age_approx', 'behavior',
  'photo_url', 'neighborhood', 'city', 'state',
  'latitude', 'longitude', 'event_date', 'created_at',
].join(',') as string

// Colunas para página de detalhes (inclui contato)
export const PET_DETAIL_COLUMNS = [
  ...PET_PUBLIC_COLUMNS.split(','),
  'contact_name', 'contact_phone', 'contact_whatsapp',
].join(',') as string
