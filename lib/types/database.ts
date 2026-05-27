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
export type PetStatus = "draft" | "active" | "resolved" | "removed";
export type ProfileRole = "tutor" | "provider" | "admin";
export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];
export type JsonObject = { [key: string]: Json | undefined };
type DbRow<T> = T & Record<string, unknown>;
type DbInsert<T> = T & Record<string, unknown>;
type DbUpdate<T> = T & Record<string, unknown>;

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
  dias_atendimento: JsonObject | null;
  horarios_disponiveis: JsonObject | null;
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
  dias_atendimento?: JsonObject | null;
  horarios_disponiveis?: JsonObject | null;
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

// ----- pet_saude -----
export type PetSaudeTipo = "vacina" | "medicamento" | "exame" | "outro";

export interface PetSaudeRow {
  id: string;
  created_at: string;
  updated_at: string;
  pet_id: string;
  user_id: string;
  tipo: PetSaudeTipo;
  nome: string;
  data_aplicacao: string; // "YYYY-MM-DD"
  proxima_dose: string | null; // "YYYY-MM-DD"
  notificar: boolean;
  observacoes: string | null;
}

export interface PetSaudeInsert {
  id?: string;
  created_at?: string;
  updated_at?: string;
  pet_id: string;
  user_id: string;
  tipo: PetSaudeTipo;
  nome: string;
  data_aplicacao: string;
  proxima_dose?: string | null;
  notificar?: boolean;
  observacoes?: string | null;
}

export type PetSaudeUpdate = Partial<PetSaudeInsert>;

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
  latitude: number | null;
  longitude: number | null;
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
  latitude?: number | null;
  longitude?: number | null;
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

// ----- loja / catálogo de produtos -----
export type CheckoutType = "external" | "internal";

export interface StoreProductRow {
  id: string;
  created_at: string;
  updated_at: string;
  name: string;
  description: string | null;
  price_cents: number;
  original_price_cents: number | null;
  photo_url: string | null;
  supplier_name: string | null;
  category: string;
  checkout_type: CheckoutType;
  external_url: string | null;
  active: boolean;
  featured: boolean;
  sort_order: number;
}

export interface StoreProductInsert {
  id?: string;
  created_at?: string;
  updated_at?: string;
  name: string;
  description?: string | null;
  price_cents: number;
  original_price_cents?: number | null;
  photo_url?: string | null;
  supplier_name?: string | null;
  category?: string;
  checkout_type?: CheckoutType;
  external_url?: string | null;
  active?: boolean;
  featured?: boolean;
  sort_order?: number;
}

export type StoreProductUpdate = Partial<StoreProductInsert>;

// ----- plaquinhas / pedidos -----
export type PaymentStatus =
  | "pending_payment"
  | "paid"
  | "failed"
  | "refunded"
  | "cancelled";

export type SupplierStatus =
  | "awaiting_payment"
  | "queued"
  | "sent_to_supplier"
  | "in_production"
  | "shipped"
  | "delivered";

export interface ShippingAddress {
  cep: string;
  logradouro: string;
  numero: string;
  complemento: string | null;
  bairro: string;
  cidade: string;
  estado: string;
}

export interface PetTagOrderRow {
  id: string;
  pet_id: string;
  user_id: string | null;
  payment_provider: string;
  payment_id: string | null;
  preference_id: string | null;
  payment_status: PaymentStatus;
  amount_cents: number;
  tag_type: string;
  shipping_name: string;
  shipping_address: ShippingAddress;
  tag_contact_phone: string;
  supplier_status: SupplierStatus;
  supplier_notified_at: string | null;
  tracking_code: string | null;
  shipped_at: string | null;
  delivered_at: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface PetTagOrderInsert {
  id?: string;
  pet_id: string;
  user_id?: string | null;
  payment_provider?: string;
  payment_id?: string | null;
  preference_id?: string | null;
  payment_status?: PaymentStatus;
  amount_cents: number;
  tag_type?: string;
  shipping_name: string;
  shipping_address: ShippingAddress;
  tag_contact_phone: string;
  supplier_status?: SupplierStatus;
  supplier_notified_at?: string | null;
  tracking_code?: string | null;
  shipped_at?: string | null;
  delivered_at?: string | null;
  notes?: string | null;
  created_at?: string;
  updated_at?: string;
}

export type PetTagOrderUpdate = Partial<PetTagOrderInsert>;

// ============================================================
// Módulo ONG — Gestão para ONGs e Protetores
// ============================================================

export type ShelterType = "ong" | "protetor";
export type ShelterPetStatus = "available" | "fostered" | "adopted" | "deceased";
export type HealthStatus = "healthy" | "recovering" | "critical" | "treated";
export type MedicalRecordType = "consultation" | "surgery" | "exam" | "treatment" | "observation";
export type AdoptionStatus = "active" | "returned" | "deceased" | "transferred";

export interface ShelterRow {
  id: string;
  user_id: string;
  name: string;
  type: ShelterType;
  cnpj: string | null;
  phone: string;
  email: string | null;
  city: string;
  neighborhood: string | null;
  description: string | null;
  logo_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface ShelterInsert {
  id?: string;
  user_id: string;
  name: string;
  type: ShelterType;
  cnpj?: string | null;
  phone: string;
  email?: string | null;
  city: string;
  neighborhood?: string | null;
  description?: string | null;
  logo_url?: string | null;
}

export type ShelterUpdate = Partial<Omit<ShelterInsert, "user_id">>;

export interface ShelterPetRow {
  id: string;
  shelter_id: string;
  name: string | null;
  species: PetSpecies;
  breed: string | null;
  color: string;
  size: PetSize;
  sex: PetSex;
  estimated_age: string | null;
  rescue_date: string;
  rescue_location: string | null;
  health_status: HealthStatus;
  behavior: string | null;
  description: string | null;
  photo_url: string | null;
  status: ShelterPetStatus;
  // Prontuário — dados fixos do pet
  weight_kg: number | null;
  microchip: string | null;
  is_castrated: boolean;
  created_at: string;
  updated_at: string;
}

export interface ShelterPetInsert {
  id?: string;
  shelter_id: string;
  name?: string | null;
  species: PetSpecies;
  breed?: string | null;
  color: string;
  size: PetSize;
  sex: PetSex;
  estimated_age?: string | null;
  rescue_date: string;
  rescue_location?: string | null;
  health_status?: HealthStatus;
  behavior?: string | null;
  description?: string | null;
  photo_url?: string | null;
  status?: ShelterPetStatus;
  weight_kg?: number | null;
  microchip?: string | null;
  is_castrated?: boolean;
}

export type ShelterPetUpdate = Partial<Omit<ShelterPetInsert, "shelter_id">>;

export interface MedicalRecordRow {
  id: string;
  pet_id: string;
  record_date: string;
  type: MedicalRecordType;
  description: string;
  vet_name: string | null;
  weight_kg: number | null;
  notes: string | null;
  created_by: string | null;
  created_at: string;
}

export interface MedicalRecordInsert {
  id?: string;
  pet_id: string;
  record_date?: string;
  type: MedicalRecordType;
  description: string;
  vet_name?: string | null;
  weight_kg?: number | null;
  notes?: string | null;
  created_by?: string | null;
}

export interface VaccinationRow {
  id: string;
  pet_id: string;
  vaccine_name: string;
  applied_date: string;
  next_dose_date: string | null;
  vet_name: string | null;
  batch: string | null;
  notes: string | null;
  created_at: string;
}

export interface VaccinationInsert {
  id?: string;
  pet_id: string;
  vaccine_name: string;
  applied_date: string;
  next_dose_date?: string | null;
  vet_name?: string | null;
  batch?: string | null;
  notes?: string | null;
}

export interface MedicationRow {
  id: string;
  pet_id: string;
  medication_name: string;
  dosage: string;
  frequency: string;
  start_date: string;
  end_date: string | null;
  is_ongoing: boolean;
  reason: string | null;
  notes: string | null;
  created_at: string;
}

export interface MedicationInsert {
  id?: string;
  pet_id: string;
  medication_name: string;
  dosage: string;
  frequency: string;
  start_date: string;
  end_date?: string | null;
  is_ongoing?: boolean;
  reason?: string | null;
  notes?: string | null;
}

export type MedicationUpdate = Partial<Omit<MedicationInsert, "pet_id">>;

export interface AdoptionRow {
  id: string;
  pet_id: string;
  shelter_id: string;
  adopter_name: string;
  adopter_phone: string;
  adopter_email: string | null;
  adopter_city: string;
  adopter_neighborhood: string | null;
  adoption_date: string;
  // Acompanhamento pós-adoção em dois checkpoints (30 e 90 dias)
  follow_up_30_date: string | null;
  follow_up_30_notes: string | null;
  follow_up_90_date: string | null;
  follow_up_90_notes: string | null;
  status: AdoptionStatus;
  created_at: string;
  updated_at: string;
}

export interface AdoptionInsert {
  id?: string;
  pet_id: string;
  shelter_id: string;
  adopter_name: string;
  adopter_phone: string;
  adopter_email?: string | null;
  adopter_city: string;
  adopter_neighborhood?: string | null;
  adoption_date: string;
  follow_up_30_date?: string | null;
  follow_up_30_notes?: string | null;
  follow_up_90_date?: string | null;
  follow_up_90_notes?: string | null;
  status?: AdoptionStatus;
}

export type AdoptionUpdate = Partial<Omit<AdoptionInsert, "pet_id" | "shelter_id">>;

// ── achados e perdidos ──────────────────────────────────────
export type AchadoTipo = "perdido" | "encontrado";
export type AchadoStatus = "ativo" | "inativo" | "resolvido";
export type AchadoEspecie = "cao" | "gato" | "outro";
export type AchadoPorte = "pequeno" | "medio" | "grande";
export type AchadoSexo = "macho" | "femea" | "desconhecido";

export interface AchadoPerdidoRow {
  id: string;
  created_at: string;
  updated_at: string;
  user_id: string | null;
  tipo: AchadoTipo;
  nome: string | null;
  especie: AchadoEspecie;
  raca: string | null;
  cor: string;
  porte: AchadoPorte | null;
  sexo: AchadoSexo | null;
  idade_aprox: string | null;
  descricao: string | null;
  comportamento: string | null;
  bairro: string | null;
  cidade: string;
  data_ocorrencia: string;
  foto_url: string | null;
  contato: string;
  status: AchadoStatus;
}

export interface AchadoPerdidoInsert {
  id?: string;
  created_at?: string;
  updated_at?: string;
  user_id?: string | null;
  tipo: AchadoTipo;
  nome?: string | null;
  especie: AchadoEspecie;
  raca?: string | null;
  cor: string;
  porte?: AchadoPorte | null;
  sexo?: AchadoSexo | null;
  idade_aprox?: string | null;
  descricao?: string | null;
  comportamento?: string | null;
  bairro?: string | null;
  cidade: string;
  data_ocorrencia: string;
  foto_url?: string | null;
  contato: string;
  status?: AchadoStatus;
}

export type AchadoPerdidoUpdate = Partial<Omit<AchadoPerdidoInsert, "user_id">>;

// ============================================================
// Database — formato canônico do supabase-js v2.50+
// ============================================================
export type Database = {
  public: {
    Tables: {
      pet_saude: {
        Row: DbRow<PetSaudeRow>;
        Insert: DbInsert<PetSaudeInsert>;
        Update: DbUpdate<PetSaudeUpdate>;
        Relationships: [];
      };
      pets: {
        Row: DbRow<PetRow>;
        Insert: DbInsert<PetInsert>;
        Update: DbUpdate<PetUpdate>;
        Relationships: [];
      };
      profiles: {
        Row: DbRow<ProfileRow>;
        Insert: DbInsert<ProfileInsert>;
        Update: DbUpdate<ProfileUpdate>;
        Relationships: [];
      };
      alertas_sos: {
        Row: DbRow<AlertSosRow>;
        Insert: DbInsert<AlertSosInsert>;
        Update: DbUpdate<AlertSosUpdate>;
        Relationships: [];
      };
      prestadores: {
        Row: DbRow<PrestadorRow>;
        Insert: DbInsert<PrestadorInsert>;
        Update: DbUpdate<PrestadorUpdate>;
        Relationships: [];
      };
      avaliacoes: {
        Row: DbRow<AvaliacaoRow>;
        Insert: DbInsert<AvaliacaoInsert>;
        Update: DbUpdate<AvaliacaoUpdate>;
        Relationships: [];
      };
      prestador_stats: {
        Row: DbRow<PrestadorStatsRow>;
        Insert: DbInsert<PrestadorStatsInsert>;
        Update: DbUpdate<Partial<PrestadorStatsInsert>>;
        Relationships: [];
      };
      avisos: {
        Row: DbRow<AvisoRow>;
        Insert: DbInsert<AvisoInsert>;
        Update: DbUpdate<Partial<AvisoInsert>>;
        Relationships: [];
      };
      parceiros: {
        Row: DbRow<ParceiroRow>;
        Insert: DbInsert<ParceiroInsert>;
        Update: DbUpdate<Partial<ParceiroInsert>>;
        Relationships: [];
      };
      store_products: {
        Row: DbRow<StoreProductRow>;
        Insert: DbInsert<StoreProductInsert>;
        Update: DbUpdate<StoreProductUpdate>;
        Relationships: [];
      };
      pet_tag_orders: {
        Row: DbRow<PetTagOrderRow>;
        Insert: DbInsert<PetTagOrderInsert>;
        Update: DbUpdate<PetTagOrderUpdate>;
        Relationships: [];
      };
      sightings: {
        Row: DbRow<SightingRow>;
        Insert: DbInsert<SightingInsert>;
        Update: DbUpdate<SightingUpdate>;
        Relationships: [];
      };
      // ── ONG module ──────────────────────────────────────
      shelters: {
        Row: DbRow<ShelterRow>;
        Insert: DbInsert<ShelterInsert>;
        Update: DbUpdate<ShelterUpdate>;
        Relationships: [];
      };
      shelter_pets: {
        Row: DbRow<ShelterPetRow>;
        Insert: DbInsert<ShelterPetInsert>;
        Update: DbUpdate<ShelterPetUpdate>;
        Relationships: [];
      };
      medical_records: {
        Row: DbRow<MedicalRecordRow>;
        Insert: DbInsert<MedicalRecordInsert>;
        Update: DbUpdate<Partial<MedicalRecordInsert>>;
        Relationships: [];
      };
      vaccinations: {
        Row: DbRow<VaccinationRow>;
        Insert: DbInsert<VaccinationInsert>;
        Update: DbUpdate<Partial<VaccinationInsert>>;
        Relationships: [];
      };
      medications: {
        Row: DbRow<MedicationRow>;
        Insert: DbInsert<MedicationInsert>;
        Update: DbUpdate<MedicationUpdate>;
        Relationships: [];
      };
      adoptions: {
        Row: DbRow<AdoptionRow>;
        Insert: DbInsert<AdoptionInsert>;
        Update: DbUpdate<AdoptionUpdate>;
        Relationships: [];
      };
      achados_perdidos: {
        Row: DbRow<AchadoPerdidoRow>;
        Insert: DbInsert<AchadoPerdidoInsert>;
        Update: DbUpdate<AchadoPerdidoUpdate>;
        Relationships: [];
      };
      sentinel_partners: {
        Row: DbRow<{
          id: string;
          name: string;
          type: string;
          address: string | null;
          neighborhood: string | null;
          city: string;
          contact_phone: string | null;
          contact_email: string | null;
          has_cameras: boolean;
          latitude: number | null;
          longitude: number | null;
          verified: boolean;
          is_active: boolean;
          created_at: string;
        }>;
        Insert: DbInsert<{
          id?: string;
          name: string;
          type: string;
          address?: string | null;
          neighborhood?: string | null;
          city: string;
          contact_phone?: string | null;
          contact_email?: string | null;
          has_cameras?: boolean;
          latitude?: number | null;
          longitude?: number | null;
          verified?: boolean;
          is_active?: boolean;
          created_at?: string;
        }>;
        Update: DbUpdate<{
          name?: string;
          type?: string;
          address?: string | null;
          neighborhood?: string | null;
          city?: string;
          contact_phone?: string | null;
          contact_email?: string | null;
          has_cameras?: boolean;
          latitude?: number | null;
          longitude?: number | null;
          verified?: boolean;
          is_active?: boolean;
        }>;
        Relationships: [];
      };
    };
    Views: {
      // Definida na migration 20260504_hardening — listagem pública de pets
      // ATIVOS sem campos de contato (anti-scraping de telefones).
      pets_public: {
        Row: Omit<PetRow, "contact_name" | "contact_phone" | "contact_whatsapp">;
        Relationships: [];
      };
    };
    Functions: {
      incrementar_visualizacao_prestador: {
        Args: Record<string, unknown> | never;
        Returns: unknown;
      };
      incrementar_clique_whatsapp: {
        Args: Record<string, unknown> | never;
        Returns: unknown;
      };
      incrementar_clique_telefone: {
        Args: Record<string, unknown> | never;
        Returns: unknown;
      };
      // RPC para detalhe expor contato sob demanda (B-05).
      get_pet_contact: {
        Args: { pet_id: string };
        Returns: {
          contact_name: string;
          contact_phone: string;
          contact_whatsapp: boolean;
        };
      };
      // RPC para Server Action criar pet anônimo (B-08).
      // Anônimos não inserem direto na tabela `pets` — RLS bloqueia.
      create_pet_anon: {
        Args: {
          p_kind: PetKind;
          p_species: PetSpecies;
          p_color: string;
          p_neighborhood: string;
          p_city: string;
          p_state: string | null;
          p_event_date: string;
          p_contact_name: string;
          p_contact_phone: string;
          p_contact_whatsapp: boolean;
          p_name?: string | null;
          p_breed?: string | null;
          p_size?: PetSize | null;
          p_sex?: PetSex | null;
          p_age_approx?: string | null;
          p_description?: string | null;
          p_behavior?: string | null;
          p_photo_url?: string | null;
          p_latitude?: number | null;
          p_longitude?: number | null;
        };
        Returns: string; // uuid do novo pet
      };
    };
    Enums: { [_ in string]: never };
  };
};
