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
          email: string
          full_name: string | null
          role: 'interviewer' | 'candidate'
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          full_name?: string | null
          role: 'interviewer' | 'candidate'
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          full_name?: string | null
          role?: 'interviewer' | 'candidate'
          created_at?: string
          updated_at?: string
        }
      }
      interviews: {
        Row: {
          id: string
          title: string
          description: string | null
          interviewer_id: string
          candidate_id: string | null
          scheduled_at: string
          duration: number
          status: 'scheduled' | 'in_progress' | 'completed'
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          title: string
          description?: string | null
          interviewer_id: string
          candidate_id?: string | null
          scheduled_at: string
          duration: number
          status?: 'scheduled' | 'in_progress' | 'completed'
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          title?: string
          description?: string | null
          interviewer_id?: string
          candidate_id?: string | null
          scheduled_at?: string
          duration?: number
          status?: 'scheduled' | 'in_progress' | 'completed'
          created_at?: string
          updated_at?: string
        }
      }
    }
  }
}