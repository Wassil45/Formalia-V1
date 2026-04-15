export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          first_name: string | null
          last_name: string | null
          email: string
          phone: string | null
          role: 'client' | 'admin'
          company_name: string | null
          siret: string | null
          address: string | null
          city: string | null
          postal_code: string | null
          country: string | null
          is_active: boolean
          notes: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          first_name?: string | null
          last_name?: string | null
          email: string
          phone?: string | null
          role?: 'client' | 'admin'
          company_name?: string | null
          siret?: string | null
          address?: string | null
          city?: string | null
          postal_code?: string | null
          country?: string | null
          is_active?: boolean
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          first_name?: string | null
          last_name?: string | null
          email?: string
          phone?: string | null
          role?: 'client' | 'admin'
          company_name?: string | null
          siret?: string | null
          address?: string | null
          city?: string | null
          postal_code?: string | null
          country?: string | null
          is_active?: boolean
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      formalites_catalogue: {
        Row: {
          id: string
          name: string
          type: 'immatriculation' | 'modification' | 'radiation'
          description: string | null
          price_ht: number
          tva_rate: number
          price_ttc: number | null
          estimated_delay_days: number | null
          is_active: boolean
          order_index: number
          icon: string
          form_schema: Json | null
          steps_config: Json | null
          required_documents: Json | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          type: 'immatriculation' | 'modification' | 'radiation'
          description?: string | null
          price_ht: number
          tva_rate?: number
          price_ttc?: number | null
          estimated_delay_days?: number | null
          is_active?: boolean
          order_index?: number
          icon?: string
          form_schema?: Json | null
          steps_config?: Json | null
          required_documents?: Json | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          type?: 'immatriculation' | 'modification' | 'radiation'
          description?: string | null
          price_ht?: number
          tva_rate?: number
          price_ttc?: number | null
          estimated_delay_days?: number | null
          is_active?: boolean
          order_index?: number
          icon?: string
          form_schema?: Json | null
          steps_config?: Json | null
          required_documents?: Json | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      dossiers: {
        Row: {
          id: string
          reference: string
          client_id: string
          formalite_id: string
          status: 'draft' | 'received' | 'processing' | 'pending_documents' | 'completed' | 'rejected'
          form_data: Json | null
          total_amount: number | null
          stripe_session_id: string | null
          stripe_payment_status: string | null
          admin_notes: string | null
          admin_message_to_client: string | null
          completed_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          reference: string
          client_id: string
          formalite_id: string
          status?: 'draft' | 'received' | 'processing' | 'pending_documents' | 'completed' | 'rejected'
          form_data?: Json | null
          total_amount?: number | null
          stripe_session_id?: string | null
          stripe_payment_status?: string | null
          admin_notes?: string | null
          admin_message_to_client?: string | null
          completed_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          reference?: string
          client_id?: string
          formalite_id?: string
          status?: 'draft' | 'received' | 'processing' | 'pending_documents' | 'completed' | 'rejected'
          form_data?: Json | null
          total_amount?: number | null
          stripe_session_id?: string | null
          stripe_payment_status?: string | null
          admin_notes?: string | null
          admin_message_to_client?: string | null
          completed_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "dossiers_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "dossiers_formalite_id_fkey"
            columns: ["formalite_id"]
            isOneToOne: false
            referencedRelation: "formalites_catalogue"
            referencedColumns: ["id"]
          }
        ]
      }
      settings: {
        Row: {
          key: string
          value: string
          updated_at: string
        }
        Insert: {
          key: string
          value: string
          updated_at?: string
        }
        Update: {
          key?: string
          value?: string
          updated_at?: string
        }
        Relationships: []
      }
      faq: {
        Row: {
          id: string
          question: string
          answer: string
          category: string
          order_index: number
          is_published: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          question: string
          answer: string
          category?: string
          order_index?: number
          is_published?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          question?: string
          answer?: string
          category?: string
          order_index?: number
          is_published?: boolean
          updated_at?: string
        }
        Relationships: []
      }
      email_templates: {
        Row: {
          id: string
          name: string
          slug: string
          subject: string
          body_html: string
          body_text: string | null
          variables: string[]
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['email_templates']['Row'], 'id' | 'created_at' | 'updated_at'> & {
          id?: string
          created_at?: string
          updated_at?: string
        }
        Update: Partial<Omit<Database['public']['Tables']['email_templates']['Row'], 'id' | 'created_at'>>
        Relationships: []
      }
      dossier_messages: {
        Row: {
          id: string
          dossier_id: string
          sender_id: string
          sender_role: 'admin' | 'client'
          content: string
          attachments: any[]
          read_at: string | null
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['dossier_messages']['Row'], 'id' | 'created_at'> & {
          id?: string
          created_at?: string
        }
        Update: Partial<Pick<Database['public']['Tables']['dossier_messages']['Row'], 'read_at'>>
        Relationships: [
          {
            foreignKeyName: "dossier_messages_dossier_id_fkey"
            columns: ["dossier_id"]
            isOneToOne: false
            referencedRelation: "dossiers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "dossier_messages_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          }
        ]
      }
      dossier_status_history: {
        Row: {
          id: string
          dossier_id: string
          old_status: string | null
          new_status: string
          changed_by: string | null
          note: string | null
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['dossier_status_history']['Row'], 'id' | 'created_at'> & {
          id?: string
          created_at?: string
        }
        Update: never
        Relationships: [
          {
            foreignKeyName: "dossier_status_history_dossier_id_fkey"
            columns: ["dossier_id"]
            isOneToOne: false
            referencedRelation: "dossiers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "dossier_status_history_changed_by_fkey"
            columns: ["changed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          }
        ]
      }
    }
    Views: Record<string, never>
    Functions: Record<string, never>
    Enums: Record<string, never>
    CompositeTypes: Record<string, never>
  }
}
