
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
      expenses: {
        Row: {
          id: string
          family_id: string
          amount: number
          description: string
          category: string
          date: string
          place: string
          needs_replacement?: boolean
          replacement_frequency?: number
          next_replacement_date?: string
          receipt_url?: string
          created_at: string
        }
        Insert: {
          id?: string
          family_id: string
          amount: number
          description: string
          category: string
          date: string
          place: string
          needs_replacement?: boolean
          replacement_frequency?: number
          next_replacement_date?: string
          receipt_url?: string
          created_at?: string
        }
        Update: {
          id?: string
          family_id?: string
          amount?: number
          description?: string
          category?: string
          date?: string
          place?: string
          needs_replacement?: boolean
          replacement_frequency?: number
          next_replacement_date?: string
          receipt_url?: string
          created_at?: string
        }
      }
      families: {
        Row: {
          id: string
          name: string
          color: string
          user_id: string
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          color: string
          user_id: string
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          color?: string
          user_id?: string
          created_at?: string
        }
      }
      categories: {
        Row: {
          id: string
          name: string
          color: string
          family_id?: string
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          color: string
          family_id?: string
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          color?: string
          family_id?: string
          created_at?: string
        }
      }
      reminders: {
        Row: {
          id: string
          family_id: string
          title: string
          due_date: string
          is_recurring: boolean
          frequency?: number
          type: 'bill' | 'replacement'
          related_expense_id?: string
          created_at: string
        }
        Insert: {
          id?: string
          family_id: string
          title: string
          due_date: string
          is_recurring: boolean
          frequency?: number
          type: 'bill' | 'replacement'
          related_expense_id?: string
          created_at?: string
        }
        Update: {
          id?: string
          family_id?: string
          title?: string
          due_date?: string
          is_recurring?: boolean
          frequency?: number
          type?: 'bill' | 'replacement'
          related_expense_id?: string
          created_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
  }
}
