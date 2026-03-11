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
          created_at?: string
          updated_at?: string
        }
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
          form_schema: Json | null
          steps_config: Json | null
          required_documents: Json | null
          created_at: string
          updated_at: string
        }
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
      }
    }
  }
}
