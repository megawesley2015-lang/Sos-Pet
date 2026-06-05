export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      achados_perdidos: {
        Row: {
          bairro: string | null
          cidade: string
          comportamento: string | null
          contato: string
          cor: string
          created_at: string
          data_ocorrencia: string
          descricao: string | null
          especie: string
          foto_url: string | null
          id: string
          idade_aprox: string | null
          nome: string | null
          porte: string | null
          raca: string | null
          sexo: string | null
          status: string
          tipo: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          bairro?: string | null
          cidade: string
          comportamento?: string | null
          contato: string
          cor: string
          created_at?: string
          data_ocorrencia: string
          descricao?: string | null
          especie: string
          foto_url?: string | null
          id?: string
          idade_aprox?: string | null
          nome?: string | null
          porte?: string | null
          raca?: string | null
          sexo?: string | null
          status?: string
          tipo: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          bairro?: string | null
          cidade?: string
          comportamento?: string | null
          contato?: string
          cor?: string
          created_at?: string
          data_ocorrencia?: string
          descricao?: string | null
          especie?: string
          foto_url?: string | null
          id?: string
          idade_aprox?: string | null
          nome?: string | null
          porte?: string | null
          raca?: string | null
          sexo?: string | null
          status?: string
          tipo?: string
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      adocoes: {
        Row: {
          acompanhamento_30d: boolean | null
          acompanhamento_30d_em: string | null
          acompanhamento_90d: boolean | null
          acompanhamento_90d_em: string | null
          adotante_cpf: string | null
          adotante_email: string | null
          adotante_nome: string
          adotante_telefone: string
          created_at: string | null
          data_adocao: string
          id: string
          observacoes: string | null
          ong_id: string
          pet_id: string
          status: string | null
          updated_at: string | null
        }
        Insert: {
          acompanhamento_30d?: boolean | null
          acompanhamento_30d_em?: string | null
          acompanhamento_90d?: boolean | null
          acompanhamento_90d_em?: string | null
          adotante_cpf?: string | null
          adotante_email?: string | null
          adotante_nome: string
          adotante_telefone: string
          created_at?: string | null
          data_adocao: string
          id?: string
          observacoes?: string | null
          ong_id: string
          pet_id: string
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          acompanhamento_30d?: boolean | null
          acompanhamento_30d_em?: string | null
          acompanhamento_90d?: boolean | null
          acompanhamento_90d_em?: string | null
          adotante_cpf?: string | null
          adotante_email?: string | null
          adotante_nome?: string
          adotante_telefone?: string
          created_at?: string | null
          data_adocao?: string
          id?: string
          observacoes?: string | null
          ong_id?: string
          pet_id?: string
          status?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "adocoes_ong_id_fkey"
            columns: ["ong_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "adocoes_pet_id_fkey"
            columns: ["pet_id"]
            isOneToOne: false
            referencedRelation: "pets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "adocoes_pet_id_fkey"
            columns: ["pet_id"]
            isOneToOne: false
            referencedRelation: "pets_public"
            referencedColumns: ["id"]
          },
        ]
      }
      adoptions: {
        Row: {
          adopter_city: string
          adopter_email: string | null
          adopter_name: string
          adopter_neighborhood: string | null
          adopter_phone: string
          adoption_date: string
          created_at: string
          follow_up_30_date: string | null
          follow_up_30_notes: string | null
          follow_up_90_date: string | null
          follow_up_90_notes: string | null
          follow_up_date: string | null
          follow_up_notes: string | null
          id: string
          pet_id: string
          shelter_id: string
          status: string
          updated_at: string
        }
        Insert: {
          adopter_city: string
          adopter_email?: string | null
          adopter_name: string
          adopter_neighborhood?: string | null
          adopter_phone: string
          adoption_date?: string
          created_at?: string
          follow_up_30_date?: string | null
          follow_up_30_notes?: string | null
          follow_up_90_date?: string | null
          follow_up_90_notes?: string | null
          follow_up_date?: string | null
          follow_up_notes?: string | null
          id?: string
          pet_id: string
          shelter_id: string
          status?: string
          updated_at?: string
        }
        Update: {
          adopter_city?: string
          adopter_email?: string | null
          adopter_name?: string
          adopter_neighborhood?: string | null
          adopter_phone?: string
          adoption_date?: string
          created_at?: string
          follow_up_30_date?: string | null
          follow_up_30_notes?: string | null
          follow_up_90_date?: string | null
          follow_up_90_notes?: string | null
          follow_up_date?: string | null
          follow_up_notes?: string | null
          id?: string
          pet_id?: string
          shelter_id?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "adoptions_pet_id_fkey"
            columns: ["pet_id"]
            isOneToOne: false
            referencedRelation: "shelter_pets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "adoptions_shelter_id_fkey"
            columns: ["shelter_id"]
            isOneToOne: false
            referencedRelation: "shelters"
            referencedColumns: ["id"]
          },
        ]
      }
      alertas_sos: {
        Row: {
          created_at: string
          id: string
          imagem_url: string | null
          mensagem: string | null
          pet_id: string
          raio_km: number
          status: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          imagem_url?: string | null
          mensagem?: string | null
          pet_id: string
          raio_km?: number
          status?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          imagem_url?: string | null
          mensagem?: string | null
          pet_id?: string
          raio_km?: number
          status?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "alertas_sos_pet_id_fkey"
            columns: ["pet_id"]
            isOneToOne: false
            referencedRelation: "pets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "alertas_sos_pet_id_fkey"
            columns: ["pet_id"]
            isOneToOne: false
            referencedRelation: "pets_public"
            referencedColumns: ["id"]
          },
        ]
      }
      avaliacoes: {
        Row: {
          comentario: string | null
          created_at: string
          id: string
          nota: number
          prestador_id: string
          user_id: string
        }
        Insert: {
          comentario?: string | null
          created_at?: string
          id?: string
          nota: number
          prestador_id: string
          user_id: string
        }
        Update: {
          comentario?: string | null
          created_at?: string
          id?: string
          nota?: number
          prestador_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "avaliacoes_prestador_id_fkey"
            columns: ["prestador_id"]
            isOneToOne: false
            referencedRelation: "prestadores"
            referencedColumns: ["id"]
          },
        ]
      }
      avisos: {
        Row: {
          ativo: boolean
          created_at: string
          emoji: string | null
          expires_at: string | null
          id: string
          link: string | null
          mensagem: string
          prioridade: number
        }
        Insert: {
          ativo?: boolean
          created_at?: string
          emoji?: string | null
          expires_at?: string | null
          id?: string
          link?: string | null
          mensagem: string
          prioridade?: number
        }
        Update: {
          ativo?: boolean
          created_at?: string
          emoji?: string | null
          expires_at?: string | null
          id?: string
          link?: string | null
          mensagem?: string
          prioridade?: number
        }
        Relationships: []
      }
      medicacoes: {
        Row: {
          ativa: boolean | null
          created_at: string | null
          data_fim: string | null
          data_inicio: string
          dosagem: string | null
          frequencia: string | null
          id: string
          nome: string
          observacao: string | null
          prontuario_id: string
        }
        Insert: {
          ativa?: boolean | null
          created_at?: string | null
          data_fim?: string | null
          data_inicio: string
          dosagem?: string | null
          frequencia?: string | null
          id?: string
          nome: string
          observacao?: string | null
          prontuario_id: string
        }
        Update: {
          ativa?: boolean | null
          created_at?: string | null
          data_fim?: string | null
          data_inicio?: string
          dosagem?: string | null
          frequencia?: string | null
          id?: string
          nome?: string
          observacao?: string | null
          prontuario_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "medicacoes_prontuario_id_fkey"
            columns: ["prontuario_id"]
            isOneToOne: false
            referencedRelation: "prontuarios"
            referencedColumns: ["id"]
          },
        ]
      }
      medical_records: {
        Row: {
          created_at: string
          created_by: string | null
          description: string
          id: string
          notes: string | null
          pet_id: string
          record_date: string
          type: string
          vet_name: string | null
          weight_kg: number | null
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          description: string
          id?: string
          notes?: string | null
          pet_id: string
          record_date?: string
          type: string
          vet_name?: string | null
          weight_kg?: number | null
        }
        Update: {
          created_at?: string
          created_by?: string | null
          description?: string
          id?: string
          notes?: string | null
          pet_id?: string
          record_date?: string
          type?: string
          vet_name?: string | null
          weight_kg?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "medical_records_pet_id_fkey"
            columns: ["pet_id"]
            isOneToOne: false
            referencedRelation: "shelter_pets"
            referencedColumns: ["id"]
          },
        ]
      }
      medications: {
        Row: {
          created_at: string
          dosage: string
          end_date: string | null
          frequency: string
          id: string
          is_ongoing: boolean
          medication_name: string
          notes: string | null
          pet_id: string
          reason: string | null
          start_date: string
        }
        Insert: {
          created_at?: string
          dosage: string
          end_date?: string | null
          frequency: string
          id?: string
          is_ongoing?: boolean
          medication_name: string
          notes?: string | null
          pet_id: string
          reason?: string | null
          start_date: string
        }
        Update: {
          created_at?: string
          dosage?: string
          end_date?: string | null
          frequency?: string
          id?: string
          is_ongoing?: boolean
          medication_name?: string
          notes?: string | null
          pet_id?: string
          reason?: string | null
          start_date?: string
        }
        Relationships: [
          {
            foreignKeyName: "medications_pet_id_fkey"
            columns: ["pet_id"]
            isOneToOne: false
            referencedRelation: "shelter_pets"
            referencedColumns: ["id"]
          },
        ]
      }
      ong_details: {
        Row: {
          aprovado: boolean | null
          cidade: string | null
          cnpj: string | null
          created_at: string | null
          descricao: string | null
          logo_url: string | null
          nome_ong: string
          profile_id: string
          telefone: string | null
        }
        Insert: {
          aprovado?: boolean | null
          cidade?: string | null
          cnpj?: string | null
          created_at?: string | null
          descricao?: string | null
          logo_url?: string | null
          nome_ong: string
          profile_id: string
          telefone?: string | null
        }
        Update: {
          aprovado?: boolean | null
          cidade?: string | null
          cnpj?: string | null
          created_at?: string | null
          descricao?: string | null
          logo_url?: string | null
          nome_ong?: string
          profile_id?: string
          telefone?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ong_details_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      parceiros: {
        Row: {
          ativo: boolean | null
          categoria_parceiro: string | null
          cidade: string | null
          created_at: string
          email: string
          empresa: string | null
          id: string
          logo_url: string | null
          mensagem: string | null
          nome: string
          site_url: string | null
          status: string
          verificado: boolean | null
        }
        Insert: {
          ativo?: boolean | null
          categoria_parceiro?: string | null
          cidade?: string | null
          created_at?: string
          email: string
          empresa?: string | null
          id?: string
          logo_url?: string | null
          mensagem?: string | null
          nome: string
          site_url?: string | null
          status?: string
          verificado?: boolean | null
        }
        Update: {
          ativo?: boolean | null
          categoria_parceiro?: string | null
          cidade?: string | null
          created_at?: string
          email?: string
          empresa?: string | null
          id?: string
          logo_url?: string | null
          mensagem?: string | null
          nome?: string
          site_url?: string | null
          status?: string
          verificado?: boolean | null
        }
        Relationships: []
      }
      pet_tag_orders: {
        Row: {
          amount_cents: number
          created_at: string | null
          delivered_at: string | null
          id: string
          notes: string | null
          payment_id: string | null
          payment_provider: string
          payment_status: string
          pet_id: string
          preference_id: string | null
          shipped_at: string | null
          shipping_address: Json
          shipping_name: string
          supplier_notified_at: string | null
          supplier_status: string
          tag_contact_phone: string
          tag_type: string
          tracking_code: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          amount_cents: number
          created_at?: string | null
          delivered_at?: string | null
          id?: string
          notes?: string | null
          payment_id?: string | null
          payment_provider?: string
          payment_status?: string
          pet_id: string
          preference_id?: string | null
          shipped_at?: string | null
          shipping_address: Json
          shipping_name: string
          supplier_notified_at?: string | null
          supplier_status?: string
          tag_contact_phone: string
          tag_type?: string
          tracking_code?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          amount_cents?: number
          created_at?: string | null
          delivered_at?: string | null
          id?: string
          notes?: string | null
          payment_id?: string | null
          payment_provider?: string
          payment_status?: string
          pet_id?: string
          preference_id?: string | null
          shipped_at?: string | null
          shipping_address?: Json
          shipping_name?: string
          supplier_notified_at?: string | null
          supplier_status?: string
          tag_contact_phone?: string
          tag_type?: string
          tracking_code?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "pet_tag_orders_pet_id_fkey"
            columns: ["pet_id"]
            isOneToOne: false
            referencedRelation: "pets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pet_tag_orders_pet_id_fkey"
            columns: ["pet_id"]
            isOneToOne: false
            referencedRelation: "pets_public"
            referencedColumns: ["id"]
          },
        ]
      }
      pets: {
        Row: {
          age_approx: string | null
          behavior: string | null
          breed: string | null
          city: string
          color: string
          contact_name: string
          contact_phone: string
          contact_whatsapp: boolean
          created_at: string
          data_desaparecimento: string | null
          data_reencontro: string | null
          deleted_at: string | null
          depoimento: string | null
          description: string | null
          event_date: string | null
          id: string
          kind: string
          latitude: number | null
          longitude: number | null
          name: string | null
          neighborhood: string
          owner_id: string | null
          photo_url: string | null
          sex: string | null
          size: string | null
          species: string
          state: string | null
          status: string
          updated_at: string
        }
        Insert: {
          age_approx?: string | null
          behavior?: string | null
          breed?: string | null
          city: string
          color: string
          contact_name: string
          contact_phone: string
          contact_whatsapp?: boolean
          created_at?: string
          data_desaparecimento?: string | null
          data_reencontro?: string | null
          deleted_at?: string | null
          depoimento?: string | null
          description?: string | null
          event_date?: string | null
          id?: string
          kind: string
          latitude?: number | null
          longitude?: number | null
          name?: string | null
          neighborhood: string
          owner_id?: string | null
          photo_url?: string | null
          sex?: string | null
          size?: string | null
          species: string
          state?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          age_approx?: string | null
          behavior?: string | null
          breed?: string | null
          city?: string
          color?: string
          contact_name?: string
          contact_phone?: string
          contact_whatsapp?: boolean
          created_at?: string
          data_desaparecimento?: string | null
          data_reencontro?: string | null
          deleted_at?: string | null
          depoimento?: string | null
          description?: string | null
          event_date?: string | null
          id?: string
          kind?: string
          latitude?: number | null
          longitude?: number | null
          name?: string | null
          neighborhood?: string
          owner_id?: string | null
          photo_url?: string | null
          sex?: string | null
          size?: string | null
          species?: string
          state?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      prestador_stats: {
        Row: {
          cliques_telefone: number
          cliques_whatsapp: number
          prestador_id: string
          updated_at: string
          visualizacoes: number
        }
        Insert: {
          cliques_telefone?: number
          cliques_whatsapp?: number
          prestador_id: string
          updated_at?: string
          visualizacoes?: number
        }
        Update: {
          cliques_telefone?: number
          cliques_whatsapp?: number
          prestador_id?: string
          updated_at?: string
          visualizacoes?: number
        }
        Relationships: [
          {
            foreignKeyName: "prestador_stats_prestador_id_fkey"
            columns: ["prestador_id"]
            isOneToOne: true
            referencedRelation: "prestadores"
            referencedColumns: ["id"]
          },
        ]
      }
      prestadores: {
        Row: {
          agendamento_online: boolean
          bairro: string | null
          capa_url: string | null
          categoria: string
          cidade: string
          created_at: string
          delivery: boolean
          descricao: string | null
          destaque: boolean
          email: string | null
          emergencia24h: boolean
          endereco: string | null
          estado: string | null
          id: string
          instagram: string | null
          latitude: number | null
          logo_url: string | null
          longitude: number | null
          media_avaliacoes: number
          nome: string
          dias_atendimento:     Json | null
          horarios_disponiveis: Json | null
          plan: string
          site: string | null
          slug: string
          status: string
          telefone: string | null
          total_avaliacoes: number
          updated_at: string
          user_id: string | null
          verificado: boolean
          whatsapp: string | null
        }
        Insert: {
          agendamento_online?: boolean
          bairro?: string | null
          capa_url?: string | null
          categoria: string
          cidade: string
          created_at?: string
          delivery?: boolean
          descricao?: string | null
          destaque?: boolean
          email?: string | null
          emergencia24h?: boolean
          endereco?: string | null
          estado?: string | null
          id?: string
          instagram?: string | null
          latitude?: number | null
          logo_url?: string | null
          longitude?: number | null
          media_avaliacoes?: number
          nome: string
          plan?: string
          site?: string | null
          slug: string
          status?: string
          telefone?: string | null
          total_avaliacoes?: number
          updated_at?: string
          user_id?: string | null
          verificado?: boolean
          whatsapp?: string | null
        }
        Update: {
          agendamento_online?: boolean
          bairro?: string | null
          capa_url?: string | null
          categoria?: string
          cidade?: string
          created_at?: string
          delivery?: boolean
          descricao?: string | null
          destaque?: boolean
          email?: string | null
          emergencia24h?: boolean
          endereco?: string | null
          estado?: string | null
          id?: string
          instagram?: string | null
          latitude?: number | null
          logo_url?: string | null
          longitude?: number | null
          media_avaliacoes?: number
          nome?: string
          plan?: string
          site?: string | null
          slug?: string
          status?: string
          telefone?: string | null
          total_avaliacoes?: number
          updated_at?: string
          user_id?: string | null
          verificado?: boolean
          whatsapp?: string | null
        }
        Relationships: []
      }
      products: {
        Row: {
          active: boolean | null
          category: string | null
          color: string | null
          compare_price: number | null
          created_at: string | null
          description: string | null
          id: string
          image_url: string | null
          last_synced_at: string | null
          model: string | null
          name: string
          price: number | null
          region_tag: string | null
          source_url: string | null
          supplier: string | null
          supplier_sku: string | null
        }
        Insert: {
          active?: boolean | null
          category?: string | null
          color?: string | null
          compare_price?: number | null
          created_at?: string | null
          description?: string | null
          id?: string
          image_url?: string | null
          last_synced_at?: string | null
          model?: string | null
          name: string
          price?: number | null
          region_tag?: string | null
          source_url?: string | null
          supplier?: string | null
          supplier_sku?: string | null
        }
        Update: {
          active?: boolean | null
          category?: string | null
          color?: string | null
          compare_price?: number | null
          created_at?: string | null
          description?: string | null
          id?: string
          image_url?: string | null
          last_synced_at?: string | null
          model?: string | null
          name?: string
          price?: number | null
          region_tag?: string | null
          source_url?: string | null
          supplier?: string | null
          supplier_sku?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          consent_at: string | null
          created_at: string
          feature_flags: Json
          full_name: string | null
          id: string
          phone: string | null
          role: string
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          consent_at?: string | null
          created_at?: string
          feature_flags?: Json
          full_name?: string | null
          id: string
          phone?: string | null
          role?: string
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          consent_at?: string | null
          created_at?: string
          feature_flags?: Json
          full_name?: string | null
          id?: string
          phone?: string | null
          role?: string
          updated_at?: string
        }
        Relationships: []
      }
      prontuarios: {
        Row: {
          castrado: boolean | null
          created_at: string | null
          data_resgate: string
          id: string
          microchip: string | null
          observacoes: string | null
          ong_id: string
          peso_kg: number | null
          pet_id: string
          situacao_saude: string | null
          updated_at: string | null
        }
        Insert: {
          castrado?: boolean | null
          created_at?: string | null
          data_resgate: string
          id?: string
          microchip?: string | null
          observacoes?: string | null
          ong_id: string
          peso_kg?: number | null
          pet_id: string
          situacao_saude?: string | null
          updated_at?: string | null
        }
        Update: {
          castrado?: boolean | null
          created_at?: string | null
          data_resgate?: string
          id?: string
          microchip?: string | null
          observacoes?: string | null
          ong_id?: string
          peso_kg?: number | null
          pet_id?: string
          situacao_saude?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "prontuarios_ong_id_fkey"
            columns: ["ong_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "prontuarios_pet_id_fkey"
            columns: ["pet_id"]
            isOneToOne: false
            referencedRelation: "pets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "prontuarios_pet_id_fkey"
            columns: ["pet_id"]
            isOneToOne: false
            referencedRelation: "pets_public"
            referencedColumns: ["id"]
          },
        ]
      }
      shelter_pets: {
        Row: {
          behavior: string | null
          breed: string | null
          color: string
          created_at: string
          description: string | null
          estimated_age: string | null
          health_status: string
          id: string
          is_castrated: boolean
          microchip: string | null
          name: string | null
          photo_url: string | null
          rescue_date: string
          rescue_location: string | null
          sex: string
          shelter_id: string
          size: string
          species: string
          status: string
          updated_at: string
          weight_kg: number | null
        }
        Insert: {
          behavior?: string | null
          breed?: string | null
          color: string
          created_at?: string
          description?: string | null
          estimated_age?: string | null
          health_status?: string
          id?: string
          is_castrated?: boolean
          microchip?: string | null
          name?: string | null
          photo_url?: string | null
          rescue_date?: string
          rescue_location?: string | null
          sex: string
          shelter_id: string
          size: string
          species: string
          status?: string
          updated_at?: string
          weight_kg?: number | null
        }
        Update: {
          behavior?: string | null
          breed?: string | null
          color?: string
          created_at?: string
          description?: string | null
          estimated_age?: string | null
          health_status?: string
          id?: string
          is_castrated?: boolean
          microchip?: string | null
          name?: string | null
          photo_url?: string | null
          rescue_date?: string
          rescue_location?: string | null
          sex?: string
          shelter_id?: string
          size?: string
          species?: string
          status?: string
          updated_at?: string
          weight_kg?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "shelter_pets_shelter_id_fkey"
            columns: ["shelter_id"]
            isOneToOne: false
            referencedRelation: "shelters"
            referencedColumns: ["id"]
          },
        ]
      }
      shelters: {
        Row: {
          city: string
          cnpj: string | null
          created_at: string
          description: string | null
          email: string | null
          id: string
          logo_url: string | null
          name: string
          neighborhood: string | null
          phone: string
          type: string
          updated_at: string
          user_id: string
        }
        Insert: {
          city: string
          cnpj?: string | null
          created_at?: string
          description?: string | null
          email?: string | null
          id?: string
          logo_url?: string | null
          name: string
          neighborhood?: string | null
          phone: string
          type: string
          updated_at?: string
          user_id: string
        }
        Update: {
          city?: string
          cnpj?: string | null
          created_at?: string
          description?: string | null
          email?: string | null
          id?: string
          logo_url?: string | null
          name?: string
          neighborhood?: string | null
          phone?: string
          type?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      sightings: {
        Row: {
          address: string | null
          created_at: string
          description: string | null
          id: string
          lat: number
          lng: number
          pet_id: string
          photo_url: string | null
          reporter_name: string | null
        }
        Insert: {
          address?: string | null
          created_at?: string
          description?: string | null
          id?: string
          lat: number
          lng: number
          pet_id: string
          photo_url?: string | null
          reporter_name?: string | null
        }
        Update: {
          address?: string | null
          created_at?: string
          description?: string | null
          id?: string
          lat?: number
          lng?: number
          pet_id?: string
          photo_url?: string | null
          reporter_name?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "sightings_pet_id_fkey"
            columns: ["pet_id"]
            isOneToOne: false
            referencedRelation: "pets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sightings_pet_id_fkey"
            columns: ["pet_id"]
            isOneToOne: false
            referencedRelation: "pets_public"
            referencedColumns: ["id"]
          },
        ]
      }
      store_products: {
        Row: {
          active: boolean | null
          category: string | null
          checkout_type: string | null
          created_at: string | null
          description: string | null
          external_url: string | null
          featured: boolean | null
          id: string
          name: string
          original_price_cents: number | null
          photo_url: string | null
          price_cents: number
          sort_order: number | null
          supplier_name: string | null
          updated_at: string | null
        }
        Insert: {
          active?: boolean | null
          category?: string | null
          checkout_type?: string | null
          created_at?: string | null
          description?: string | null
          external_url?: string | null
          featured?: boolean | null
          id?: string
          name: string
          original_price_cents?: number | null
          photo_url?: string | null
          price_cents: number
          sort_order?: number | null
          supplier_name?: string | null
          updated_at?: string | null
        }
        Update: {
          active?: boolean | null
          category?: string | null
          checkout_type?: string | null
          created_at?: string | null
          description?: string | null
          external_url?: string | null
          featured?: boolean | null
          id?: string
          name?: string
          original_price_cents?: number | null
          photo_url?: string | null
          price_cents?: number
          sort_order?: number | null
          supplier_name?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      vaccinations: {
        Row: {
          applied_date: string
          batch: string | null
          created_at: string
          id: string
          next_dose_date: string | null
          notes: string | null
          pet_id: string
          vaccine_name: string
          vet_name: string | null
        }
        Insert: {
          applied_date: string
          batch?: string | null
          created_at?: string
          id?: string
          next_dose_date?: string | null
          notes?: string | null
          pet_id: string
          vaccine_name: string
          vet_name?: string | null
        }
        Update: {
          applied_date?: string
          batch?: string | null
          created_at?: string
          id?: string
          next_dose_date?: string | null
          notes?: string | null
          pet_id?: string
          vaccine_name?: string
          vet_name?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "vaccinations_pet_id_fkey"
            columns: ["pet_id"]
            isOneToOne: false
            referencedRelation: "shelter_pets"
            referencedColumns: ["id"]
          },
        ]
      }
      vacinas: {
        Row: {
          created_at: string | null
          data_aplicacao: string
          id: string
          lote: string | null
          nome: string
          observacao: string | null
          prontuario_id: string
          proxima_dose: string | null
          veterinario: string | null
        }
        Insert: {
          created_at?: string | null
          data_aplicacao: string
          id?: string
          lote?: string | null
          nome: string
          observacao?: string | null
          prontuario_id: string
          proxima_dose?: string | null
          veterinario?: string | null
        }
        Update: {
          created_at?: string | null
          data_aplicacao?: string
          id?: string
          lote?: string | null
          nome?: string
          observacao?: string | null
          prontuario_id?: string
          proxima_dose?: string | null
          veterinario?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "vacinas_prontuario_id_fkey"
            columns: ["prontuario_id"]
            isOneToOne: false
            referencedRelation: "prontuarios"
            referencedColumns: ["id"]
          },
        ]
      }
      pet_saude: {
        Row: {
          id:              string
          created_at:      string
          updated_at?:     string | null
          pet_id:          string
          user_id?:        string | null
          tipo:            string
          nome?:           string | null
          data_aplicacao:  string
          proxima_dose?:   string | null
          notificar?:      boolean | null
          observacoes?:    string | null
        }
        Insert: {
          id?:             string
          created_at?:     string
          updated_at?:     string | null
          pet_id:          string
          user_id?:        string | null
          tipo:            string
          nome?:           string | null
          data_aplicacao:  string
          proxima_dose?:   string | null
          notificar?:      boolean | null
          observacoes?:    string | null
        }
        Update: {
          id?:             string
          created_at?:     string
          updated_at?:     string | null
          pet_id?:         string
          user_id?:        string | null
          tipo?:           string
          nome?:           string | null
          data_aplicacao?: string
          proxima_dose?:   string | null
          notificar?:      boolean | null
          observacoes?:    string | null
        }
        Relationships: []
      }
      sentinel_partners: {
        Row: {
          id:            string
          name:          string
          type:          string
          has_cameras:   boolean
          latitude:      number
          longitude:     number
          address:       string | null
          city:          string
          neighborhood:  string | null
          contact_phone: string | null
          contact_email: string | null
          is_active:     boolean
          verified:      boolean
          created_at:    string
        }
        Insert: {
          id?:            string
          name:           string
          type:           string
          has_cameras?:   boolean
          latitude:       number
          longitude:      number
          address?:       string | null
          city:           string
          neighborhood?:  string | null
          contact_phone?: string | null
          contact_email?: string | null
          is_active?:     boolean
          verified?:      boolean
          created_at?:    string
        }
        Update: {
          id?:            string
          name?:          string
          type?:          string
          has_cameras?:   boolean
          latitude?:      number
          longitude?:     number
          address?:       string | null
          city?:          string
          neighborhood?:  string | null
          contact_phone?: string | null
          contact_email?: string | null
          is_active?:     boolean
          verified?:      boolean
          created_at?:    string
        }
        Relationships: []
      }
    }
    Views: {
      pets_public: {
        Row: {
          age_approx: string | null
          behavior: string | null
          breed: string | null
          city: string | null
          color: string | null
          created_at: string | null
          description: string | null
          event_date: string | null
          id: string | null
          kind: string | null
          latitude: number | null
          longitude: number | null
          name: string | null
          neighborhood: string | null
          owner_id: string | null
          photo_url: string | null
          sex: string | null
          size: string | null
          species: string | null
          state: string | null
          status: string | null
          updated_at: string | null
        }
        Insert: {
          age_approx?: string | null
          behavior?: string | null
          breed?: string | null
          city?: string | null
          color?: string | null
          created_at?: string | null
          description?: string | null
          event_date?: string | null
          id?: string | null
          kind?: string | null
          latitude?: number | null
          longitude?: number | null
          name?: string | null
          neighborhood?: string | null
          owner_id?: string | null
          photo_url?: string | null
          sex?: string | null
          size?: string | null
          species?: string | null
          state?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          age_approx?: string | null
          behavior?: string | null
          breed?: string | null
          city?: string | null
          color?: string | null
          created_at?: string | null
          description?: string | null
          event_date?: string | null
          id?: string | null
          kind?: string | null
          latitude?: number | null
          longitude?: number | null
          name?: string | null
          neighborhood?: string | null
          owner_id?: string | null
          photo_url?: string | null
          sex?: string | null
          size?: string | null
          species?: string | null
          state?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      create_pet_anon: {
        Args: {
          p_age_approx?: string
          p_behavior?: string
          p_breed?: string
          p_city: string
          p_color: string
          p_contact_name: string
          p_contact_phone: string
          p_contact_whatsapp: boolean
          p_description?: string
          p_event_date: string
          p_kind: string
          p_latitude?: number
          p_longitude?: number
          p_name?: string
          p_neighborhood: string
          p_photo_url?: string
          p_sex?: string
          p_size?: string
          p_species: string
          p_state: string
        }
        Returns: string
      }
      erase_pet_personal_data: {
        Args: { p_pet_id: string }
        Returns: undefined
      }
      export_user_data: { Args: never; Returns: Json }
      get_pets_by_radius: {
        Args: {
          p_kind?: string
          p_lat: number
          p_limit?: number
          p_lng: number
          p_radius_km?: number
          p_species?: string
        }
        Returns: {
          city: string
          color: string
          created_at: string
          distance_km: number
          id: string
          kind: string
          name: string
          neighborhood: string
          photo_url: string
          species: string
          status: string
        }[]
      }
      get_prestadores_by_radius: {
        Args: {
          p_categoria?: string
          p_lat: number
          p_limit?: number
          p_lng: number
          p_plan?: string
          p_radius_km?: number
        }
        Returns: {
          bairro: string
          categoria: string
          cidade: string
          distance_km: number
          emergencia24h: boolean
          id: string
          logo_url: string
          media_avaliacoes: number
          nome: string
          plan: string
          slug: string
        }[]
      }
      incrementar_clique_telefone: {
        Args: { p_id: string }
        Returns: undefined
      }
      incrementar_clique_whatsapp: {
        Args: { p_id: string }
        Returns: undefined
      }
      incrementar_visualizacao_prestador: {
        Args: { p_id: string }
        Returns: undefined
      }
      is_pet_owner: { Args: { p_pet_id: string }; Returns: boolean }
      is_shelter_owner: { Args: { p_shelter_id: string }; Returns: boolean }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const

// ── Row type aliases — compatibilidade com código existente ──────────────────
export type PetRow            = Tables<'pets'>
export type PrestadorRow      = Tables<'prestadores'>
export type PrestadorStatsRow = Tables<'prestador_stats'>
export type ParceiroRow       = Tables<'parceiros'>
export type SightingRow       = Tables<'sightings'>
export type ProfileRow        = Tables<'profiles'>
export type StoreProductRow   = Tables<'store_products'>
export type AlertSosRow       = Tables<'alertas_sos'>
export type AvaliacaoRow      = Tables<'avaliacoes'>
export type AvisoRow          = Tables<'avisos'>
export type ProfileUpdate     = TablesUpdate<'profiles'>
export type PetUpdate         = TablesUpdate<'pets'>
export type PrestadorUpdate   = TablesUpdate<'prestadores'>

// pet_saude não está no schema gerado — tipo manual até tabela ser criada
export type PetSaudeTipo = string
export interface PetSaudeRow {
  id:              string
  pet_id:          string
  user_id?:        string | null
  tipo:            PetSaudeTipo
  titulo?:         string | null
  nome?:           string | null
  descricao?:      string | null
  data?:           string | null
  data_aplicacao?: string | null
  proxima_dose?:   string | null
  observacoes?:    string | null
  notificar?:      boolean | null
  created_at:      string
}
export type PetSaudeInsert = Omit<PetSaudeRow, 'id' | 'created_at'>

// ── Enum aliases ─────────────────────────────────────────────────────────────
export type PetKind           = 'lost' | 'found'
export type PetSpecies        = 'dog' | 'cat' | 'other'
export type AdoptionStatus    = string
export type HealthStatus      = string
export type ShelterPetStatus  = string
export type PrestadorCategoria    = string
export type SentinelPartnerRow    = Tables<'sentinel_partners'>
export type SentinelPartnerInsert = TablesInsert<'sentinel_partners'>

// Funções não presentes no schema gerado (aplicar migrations pendentes)
// Stub para compatibilidade com lib/services/pets.ts até o DB ser sincronizado
declare module './database' {
  // intencional vazio — apenas para documentar RPCs pendentes
}
