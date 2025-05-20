export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      budgets: {
        Row: {
          amount: number
          category_id: string
          created_at: string | null
          family_id: string
          id: string
          month: string
          year: number
        }
        Insert: {
          amount: number
          category_id: string
          created_at?: string | null
          family_id: string
          id?: string
          month: string
          year: number
        }
        Update: {
          amount?: number
          category_id?: string
          created_at?: string | null
          family_id?: string
          id?: string
          month?: string
          year?: number
        }
        Relationships: [
          {
            foreignKeyName: "budgets_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "budgets_family_id_fkey"
            columns: ["family_id"]
            isOneToOne: false
            referencedRelation: "families"
            referencedColumns: ["id"]
          },
        ]
      }
      categories: {
        Row: {
          budget: number | null
          color: string
          created_at: string | null
          description: string | null
          family_id: string | null
          icon: string | null
          id: string
          name: string
          parent_id: string | null
        }
        Insert: {
          budget?: number | null
          color: string
          created_at?: string | null
          description?: string | null
          family_id?: string | null
          icon?: string | null
          id?: string
          name: string
          parent_id?: string | null
        }
        Update: {
          budget?: number | null
          color?: string
          created_at?: string | null
          description?: string | null
          family_id?: string | null
          icon?: string | null
          id?: string
          name?: string
          parent_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "categories_family_id_fkey"
            columns: ["family_id"]
            isOneToOne: false
            referencedRelation: "families"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "categories_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
      }
      categorization_rules: {
        Row: {
          category_id: string
          created_at: string | null
          id: string
          is_active: boolean | null
          name: string
          pattern: string
          pattern_type: string
          priority: number | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          category_id: string
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          pattern: string
          pattern_type: string
          priority?: number | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          category_id?: string
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          pattern?: string
          pattern_type?: string
          priority?: number | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "categorization_rules_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
      }
      demo_leads: {
        Row: {
          additional_info: string | null
          created_at: string | null
          email: string
          id: string
          interest_type: string | null
          last_contact: string | null
          name: string
          receipt_data: Json | null
        }
        Insert: {
          additional_info?: string | null
          created_at?: string | null
          email: string
          id?: string
          interest_type?: string | null
          last_contact?: string | null
          name: string
          receipt_data?: Json | null
        }
        Update: {
          additional_info?: string | null
          created_at?: string | null
          email?: string
          id?: string
          interest_type?: string | null
          last_contact?: string | null
          name?: string
          receipt_data?: Json | null
        }
        Relationships: []
      }
      expense_members: {
        Row: {
          allocation_percentage: number | null
          created_at: string
          expense_id: string
          id: string
          member_id: string
        }
        Insert: {
          allocation_percentage?: number | null
          created_at?: string
          expense_id: string
          id?: string
          member_id: string
        }
        Update: {
          allocation_percentage?: number | null
          created_at?: string
          expense_id?: string
          id?: string
          member_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "expense_members_expense_id_fkey"
            columns: ["expense_id"]
            isOneToOne: false
            referencedRelation: "expenses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "expense_members_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "family_members"
            referencedColumns: ["id"]
          },
        ]
      }
      expenses: {
        Row: {
          amount: number
          category: string
          created_at: string | null
          date: string
          description: string
          family_id: string
          id: string
          is_tax_deductible: boolean | null
          needs_replacement: boolean | null
          next_replacement_date: string | null
          payment_method: string | null
          place: string
          receipt_url: string | null
          replacement_frequency: number | null
          tags: string[] | null
          tax_amount: number | null
          transaction_id: string | null
          vendor_id: string | null
        }
        Insert: {
          amount: number
          category: string
          created_at?: string | null
          date: string
          description: string
          family_id: string
          id?: string
          is_tax_deductible?: boolean | null
          needs_replacement?: boolean | null
          next_replacement_date?: string | null
          payment_method?: string | null
          place: string
          receipt_url?: string | null
          replacement_frequency?: number | null
          tags?: string[] | null
          tax_amount?: number | null
          transaction_id?: string | null
          vendor_id?: string | null
        }
        Update: {
          amount?: number
          category?: string
          created_at?: string | null
          date?: string
          description?: string
          family_id?: string
          id?: string
          is_tax_deductible?: boolean | null
          needs_replacement?: boolean | null
          next_replacement_date?: string | null
          payment_method?: string | null
          place?: string
          receipt_url?: string | null
          replacement_frequency?: number | null
          tags?: string[] | null
          tax_amount?: number | null
          transaction_id?: string | null
          vendor_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "expenses_family_id_fkey"
            columns: ["family_id"]
            isOneToOne: false
            referencedRelation: "families"
            referencedColumns: ["id"]
          },
        ]
      }
      families: {
        Row: {
          color: string
          created_at: string | null
          id: string
          name: string
          user_id: string
        }
        Insert: {
          color: string
          created_at?: string | null
          id?: string
          name: string
          user_id: string
        }
        Update: {
          color?: string
          created_at?: string | null
          id?: string
          name?: string
          user_id?: string
        }
        Relationships: []
      }
      family_members: {
        Row: {
          created_at: string
          date_of_birth: string | null
          family_id: string
          id: string
          name: string
          notes: string | null
          type: string
        }
        Insert: {
          created_at?: string
          date_of_birth?: string | null
          family_id: string
          id?: string
          name: string
          notes?: string | null
          type: string
        }
        Update: {
          created_at?: string
          date_of_birth?: string | null
          family_id?: string
          id?: string
          name?: string
          notes?: string | null
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "family_members_family_id_fkey"
            columns: ["family_id"]
            isOneToOne: false
            referencedRelation: "families"
            referencedColumns: ["id"]
          },
        ]
      }
      receipt_details: {
        Row: {
          confidence_summary: Json | null
          created_at: string | null
          currency: string | null
          discount_amount: number | null
          expense_id: string
          id: string
          payment_method: string | null
          raw_data: Json | null
          receipt_number: string | null
          subtotal: number | null
          tax_amount: number | null
          transaction_time: string | null
          vendor_address: string | null
          vendor_name: string | null
          vendor_phone: string | null
          vendor_website: string | null
        }
        Insert: {
          confidence_summary?: Json | null
          created_at?: string | null
          currency?: string | null
          discount_amount?: number | null
          expense_id: string
          id?: string
          payment_method?: string | null
          raw_data?: Json | null
          receipt_number?: string | null
          subtotal?: number | null
          tax_amount?: number | null
          transaction_time?: string | null
          vendor_address?: string | null
          vendor_name?: string | null
          vendor_phone?: string | null
          vendor_website?: string | null
        }
        Update: {
          confidence_summary?: Json | null
          created_at?: string | null
          currency?: string | null
          discount_amount?: number | null
          expense_id?: string
          id?: string
          payment_method?: string | null
          raw_data?: Json | null
          receipt_number?: string | null
          subtotal?: number | null
          tax_amount?: number | null
          transaction_time?: string | null
          vendor_address?: string | null
          vendor_name?: string | null
          vendor_phone?: string | null
          vendor_website?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "receipt_details_expense_id_fkey"
            columns: ["expense_id"]
            isOneToOne: false
            referencedRelation: "expenses"
            referencedColumns: ["id"]
          },
        ]
      }
      receipt_line_items: {
        Row: {
          category_confidence: number | null
          category_id: string | null
          created_at: string | null
          description: string
          discount: boolean | null
          expense_id: string
          id: string
          quantity: number | null
          sku: string | null
          suggested_category_id: string | null
          total_price: number
          unit_price: number | null
        }
        Insert: {
          category_confidence?: number | null
          category_id?: string | null
          created_at?: string | null
          description: string
          discount?: boolean | null
          expense_id: string
          id?: string
          quantity?: number | null
          sku?: string | null
          suggested_category_id?: string | null
          total_price: number
          unit_price?: number | null
        }
        Update: {
          category_confidence?: number | null
          category_id?: string | null
          created_at?: string | null
          description?: string
          discount?: boolean | null
          expense_id?: string
          id?: string
          quantity?: number | null
          sku?: string | null
          suggested_category_id?: string | null
          total_price?: number
          unit_price?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "receipt_line_items_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "receipt_line_items_expense_id_fkey"
            columns: ["expense_id"]
            isOneToOne: false
            referencedRelation: "expenses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "receipt_line_items_suggested_category_id_fkey"
            columns: ["suggested_category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
      }
      reminders: {
        Row: {
          created_at: string | null
          due_date: string
          family_id: string
          frequency: number | null
          id: string
          is_recurring: boolean
          related_expense_id: string | null
          title: string
          type: string
        }
        Insert: {
          created_at?: string | null
          due_date: string
          family_id: string
          frequency?: number | null
          id?: string
          is_recurring?: boolean
          related_expense_id?: string | null
          title: string
          type: string
        }
        Update: {
          created_at?: string | null
          due_date?: string
          family_id?: string
          frequency?: number | null
          id?: string
          is_recurring?: boolean
          related_expense_id?: string | null
          title?: string
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "reminders_family_id_fkey"
            columns: ["family_id"]
            isOneToOne: false
            referencedRelation: "families"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reminders_related_expense_id_fkey"
            columns: ["related_expense_id"]
            isOneToOne: false
            referencedRelation: "expenses"
            referencedColumns: ["id"]
          },
        ]
      }
      report_templates: {
        Row: {
          config: Json
          created_at: string | null
          description: string | null
          id: string
          is_favorite: boolean | null
          name: string
          type: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          config: Json
          created_at?: string | null
          description?: string | null
          id?: string
          is_favorite?: boolean | null
          name: string
          type: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          config?: Json
          created_at?: string | null
          description?: string | null
          id?: string
          is_favorite?: boolean | null
          name?: string
          type?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DefaultSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
