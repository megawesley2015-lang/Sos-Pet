/**
 * Database types — espelha o schema SQL em supabase/schema.sql
 *
 * Em projetos maduros, gere este arquivo automaticamente via:
 *   npx supabase gen types typescript --project-id <ID> > lib/types/database.ts
 *
 * Para o MVP, mantemos manual para evitar dependência do Supabase CLI.
 *
 * IMPORTANTE: Database é declarado como `type` (não `interface`) e usa
 *   { [_ in string]: never }
 * em vez de `Record<string, never>` pra Views/Enums. Isso é necessário pro
 * supabase-js v2.50+ inferir corretamente — caso contrário, todas as queries
 * retornam `never` e quebram o typecheck.
 */

export type PetKind = "lost" | "found";
export type PetSpecies = "dog" | "cat" | "other";
export type PetSize = "small" | "medium" | "large";
export type PetSex = "male" | "female" | "unknown";
export type PetStatus = "active" | "resolved" | "removed";
export type ProfileRole = "tutor" | "provider" | "admin";

export interface ProfileRow {
  id: string;
  created_at: string;
  updated_at: string;
  full_name: string | null;
  phone: string | null;
  avatar_url: string | null;
  role: ProfileRole;
}

// Insert explícito (evita Pick & Partial encadeado, que confunde inferência)
export interface ProfileInsert {
  id: string;
  created_at?: string;
  updated_at?: string;
  full_name?: string | null;
  phone?: string | null;
  avatar_url?: string | null;
  role?: ProfileRole;
}

export type ProfileUpdate = Partial<
  Omit<ProfileRow, "id" | "created_at" | "updated_at">
>;

// ----- avisos -----
export interface AvisoRow {
  id: string;
  created_at: string;
  mensagem: string;
  emoji: string | null;
  link: string | null;
  prioridade: number;
  ativo: boolean;
  expires_at: string | null;
}

export interface AvisoInsert {
  id?: string;
  created_at?: string;
  mensagem: string;
  emoji?: string | null;
  link?: string | null;
  prioridade?: number;
  ativo?: boolean;
  expires_at?: string | null;
}

// ----- parceiros -----
export type ParceiroStatus = "pendente" | "aprovado" | "rejeitado";

export interface ParceiroRow {
  id: string;
  created_at: string;
  nome: string;
  email: string;
  empresa: string | null;
  mensagem: string | null;
  status: ParceiroStatus;
}

export interface ParceiroInsert {
  id?: string;
  created_at?: string;
  nome: string;
  email: string;
  empresa?: string | null;
  mensagem?: string | null;
  status?: ParceiroStatus;
}

// ----- prestadores -----
export type PrestadorCategoria =
  | "veterinario"
  | "petshop"
  | "adestrador"
  | "hospedagem"
  | "banho_tosa"
  | "outro";

export type PrestadorStatus = "ativo" | "pausado" | "pendente_aprovacao";

export interface PrestadorRow {
  id: string;
  created_at: string;
  updated_at: string;
  user_id: string | null;
  slug: string;
  nome: string;
  descricao: string | null;
  categoria: PrestadorCategoria;
  telefone: string | null;
  whatsapp: string | null;
  email: string | null;
  instagram: string | null;
  site: string | null;
  cidade: string;
  bairro: string | null;
  estado: string | null;
  endereco: string | null;
  logo_url: string | null;
  capa_url: string | null;
  emergencia24h: boolean;
  delivery: boolean;
  agendamento_online: boolean;
  verificado: boolean;
  destaque: boolean;
  media_avaliacoes: number;
  total_avaliacoes: number;
  status: PrestadorStatus;
}

export interface PrestadorInsert {
  id?: string;
  created_at?: string;
  updated_at?: string;
  user_id?: string | null;
  slug: string;
  nome: string;
  descricao?: string | null;
  categoria: PrestadorCategoria;
  telefone?: string | null;
  whatsapp?: string | null;
  email?: string | null;
  instagram?: string | null;
  site?: string | null;
  cidade: string;
  bairro?: string | null;
  estado?: string | null;
  endereco?: string | null;
  logo_url?: string | null;
  capa_url?: string | null;
  emergencia24h?: boolean;
  delivery?: boolean;
  agendamento_online?: boolean;
  verificado?: boolean;
  destaque?: boolean;
  media_avaliacoes?: number;
  total_avaliacoes?: number;
  status?: PrestadorStatus;
}

export type PrestadorUpdate = Partial<PrestadorInsert>;

// ----- avaliacoes -----
export interface AvaliacaoRow {
  id: string;
  created_at: string;
  prestador_id: string;
  user_id: string;
  nota: number;
  comentario: string | null;
}

export interface AvaliacaoInsert {
  id?: string;
  created_at?: string;
  prestador_id: string;
  user_id: string;
  nota: number;
  comentario?: string | null;
}

export type AvaliacaoUpdate = Partial<
  Pick<AvaliacaoRow, "nota" | "comentario">
>;

// ----- prestador_stats -----
export interface PrestadorStatsRow {
  prestador_id: string;
  visualizacoes: number;
  cliques_whatsapp: number;
  cliques_telefone: number;
  updated_at: string;
}

export interface PrestadorStatsInsert {
  prestador_id: string;
  visualizacoes?: number;
  cliques_whatsapp?: number;
  cliques_telefone?: number;
  updated_at?: string;
}

// ----- alertas_sos -----
export type AlertStatus = "ativo" | "resolvido" | "cancelado";

export interface AlertSosRow {
  id: string;
  created_at: string;
  pet_id: string;
  user_id: string;
  raio_km: number;
  imagem_url: string | null;
  mensagem: string | null;
  status: AlertStatus;
}

export interface AlertSosInsert {
  id?: string;
  created_at?: string;
  pet_id: string;
  user_id: string;
  raio_km?: number;
  imagem_url?: string | null;
  mensagem?: string | null;
  status?: AlertStatus;
}

export type AlertSosUpdate = Partial<AlertSosInsert>;

// ----- pets -----
export interface PetRow {
  id: string;
  created_at: string;
  updated_at: string;
  owner_id: string | null;
  kind: PetKind;
  name: string | null;
  species: PetSpecies;
  breed: string | null;
  color: string;
  size: PetSize | null;
  sex: PetSex | null;
  age_approx: string | null;
  description: string | null;
  behavior: string | null;
  neighborhood: string;
  city: string;
  state: string | null;
  event_date: string; // "YYYY-MM-DD"
  photo_url: string | null;
  contact_name: string;
  contact_phone: string;
  contact_whatsapp: boolean;
  status: PetStatus;
}

export interface PetInsert {
  id?: string;
  created_at?: string;
  updated_at?: string;
  owner_id?: string | null;
  kind: PetKind;
  name?: string | null;
  species: PetSpecies;
  breed?: string | null;
  color: string;
  size?: PetSize | null;
  sex?: PetSex | null;
  age_approx?: string | null;
  description?: string | null;
  behavior?: string | null;
  neighborhood: string;
  city: string;
  state?: string | null;
  event_date: string;
  photo_url?: string | null;
  contact_name: string;
  contact_phone: string;
  contact_whatsapp?: boolean;
  status?: PetStatus;
}

export type PetUpdate = Partial<PetInsert>;

// ----- sightings (avistamentos) -----
export interface SightingRow {
  id: string;
  created_at: string;
  pet_id: string;
  lat: number;
  lng: number;
  address: string | null;
  photo_url: string | null;
  description: string | null;
  reporter_name: string | null;
}

export interface SightingInsert {
  id?: string;
  created_at?: string;
  pet_id: string;
  lat: number;
  lng: number;
  address?: string | null;
  photo_url?: string | null;
  description?: string | null;
  reporter_name?: string | null;
}

export type SightingUpdate = Partial<SightingInsert>;

// ============================================================
// Database — formato canônico do supabase-js v2.50+
// ============================================================
export type Database = {
  public: {
    Tables: {
      pets: {
        Row: PetRow;
        Insert: PetInsert;
        Update: PetUpdate;
        Relationships: [];
      };
      profiles: {
        Row: ProfileRow;
        Insert: ProfileInsert;
        Update: ProfileUpdate;
        Relationships: [];
      };
      alertas_sos: {
        Row: AlertSosRow;
        Insert: AlertSosInsert;
        Update: AlertSosUpdate;
        Relationships: [];
      };
      prestadores: {
        Row: PrestadorRow;
        Insert: PrestadorInsert;
        Update: PrestadorUpdate;
        Relationships: [];
      };
      avaliacoes: {
        Row: AvaliacaoRow;
        Insert: AvaliacaoInsert;
        Update: AvaliacaoUpdate;
        Relationships: [];
      };
      prestador_stats: {
        Row: PrestadorStatsRow;
        Insert: PrestadorStatsInsert;
        Update: Partial<PrestadorStatsRow>;
        Relationships: [];
      };
      avisos: {
        Row: AvisoRow;
        Insert: AvisoInsert;
        Update: Partial<AvisoInsert>;
        Relationships: [];
      };
      parceiros: {
        Row: ParceiroRow;
        I