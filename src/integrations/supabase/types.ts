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
    PostgrestVersion: "12.2.12 (cd3cf9e)"
  }
  public: {
    Tables: {
      admin_tasks: {
        Row: {
          category: string | null
          created_at: string | null
          created_by: string | null
          description: string | null
          due_date: string | null
          id: string
          priority: Database["public"]["Enums"]["task_priority"] | null
          status: Database["public"]["Enums"]["task_status"] | null
          title: string
          updated_at: string | null
        }
        Insert: {
          category?: string | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          due_date?: string | null
          id?: string
          priority?: Database["public"]["Enums"]["task_priority"] | null
          status?: Database["public"]["Enums"]["task_status"] | null
          title: string
          updated_at?: string | null
        }
        Update: {
          category?: string | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          due_date?: string | null
          id?: string
          priority?: Database["public"]["Enums"]["task_priority"] | null
          status?: Database["public"]["Enums"]["task_status"] | null
          title?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      budget_allocations: {
        Row: {
          created_at: string
          id: string
          is_default: boolean
          needs_pct: number
          rule_name: string
          savings_pct: number
          updated_at: string
          user_id: string
          wants_pct: number
        }
        Insert: {
          created_at?: string
          id?: string
          is_default?: boolean
          needs_pct?: number
          rule_name: string
          savings_pct?: number
          updated_at?: string
          user_id: string
          wants_pct?: number
        }
        Update: {
          created_at?: string
          id?: string
          is_default?: boolean
          needs_pct?: number
          rule_name?: string
          savings_pct?: number
          updated_at?: string
          user_id?: string
          wants_pct?: number
        }
        Relationships: []
      }
      budget_periods: {
        Row: {
          created_at: string
          id: string
          month: string
          rule_applied: string | null
          snapshot_json: Json | null
          surplus: number
          total_expenses: number
          total_income: number
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          month: string
          rule_applied?: string | null
          snapshot_json?: Json | null
          surplus?: number
          total_expenses?: number
          total_income?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          month?: string
          rule_applied?: string | null
          snapshot_json?: Json | null
          surplus?: number
          total_expenses?: number
          total_income?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      budget_scenarios: {
        Row: {
          created_at: string
          delta_json: Json
          id: string
          name: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          delta_json?: Json
          id?: string
          name: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          delta_json?: Json
          id?: string
          name?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      budget_templates: {
        Row: {
          created_at: string
          description: string | null
          family_id: string | null
          id: string
          is_active: boolean
          is_default: boolean
          name: string
          template_data: Json
          total_monthly_income: number
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          family_id?: string | null
          id?: string
          is_active?: boolean
          is_default?: boolean
          name?: string
          template_data?: Json
          total_monthly_income?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          description?: string | null
          family_id?: string | null
          id?: string
          is_active?: boolean
          is_default?: boolean
          name?: string
          template_data?: Json
          total_monthly_income?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "budget_templates_family_id_fkey"
            columns: ["family_id"]
            isOneToOne: false
            referencedRelation: "families"
            referencedColumns: ["id"]
          },
        ]
      }
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
          group_type: string | null
          icon: string | null
          id: string
          is_budget_category: boolean | null
          name: string
          parent_id: string | null
          sort_order: number | null
          user_id: string | null
        }
        Insert: {
          budget?: number | null
          color: string
          created_at?: string | null
          description?: string | null
          family_id?: string | null
          group_type?: string | null
          icon?: string | null
          id?: string
          is_budget_category?: boolean | null
          name: string
          parent_id?: string | null
          sort_order?: number | null
          user_id?: string | null
        }
        Update: {
          budget?: number | null
          color?: string
          created_at?: string | null
          description?: string | null
          family_id?: string | null
          group_type?: string | null
          icon?: string | null
          id?: string
          is_budget_category?: boolean | null
          name?: string
          parent_id?: string | null
          sort_order?: number | null
          user_id?: string | null
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
          business_type: string | null
          created_at: string | null
          current_payroll_method: string | null
          email: string
          employee_count: string | null
          id: string
          interest_type: string | null
          ip_address: unknown
          last_contact: string | null
          name: string
          phone: string | null
          receipt_data: Json | null
          source: string | null
          user_agent: string | null
          whatsapp_number: string | null
        }
        Insert: {
          additional_info?: string | null
          business_type?: string | null
          created_at?: string | null
          current_payroll_method?: string | null
          email: string
          employee_count?: string | null
          id?: string
          interest_type?: string | null
          ip_address?: unknown
          last_contact?: string | null
          name: string
          phone?: string | null
          receipt_data?: Json | null
          source?: string | null
          user_agent?: string | null
          whatsapp_number?: string | null
        }
        Update: {
          additional_info?: string | null
          business_type?: string | null
          created_at?: string | null
          current_payroll_method?: string | null
          email?: string
          employee_count?: string | null
          id?: string
          interest_type?: string | null
          ip_address?: unknown
          last_contact?: string | null
          name?: string
          phone?: string | null
          receipt_data?: Json | null
          source?: string | null
          user_agent?: string | null
          whatsapp_number?: string | null
        }
        Relationships: []
      }
      download_purchases: {
        Row: {
          amount: number
          created_at: string
          currency: string
          download_expires_at: string | null
          downloaded_at: string | null
          id: string
          order_reference: string | null
          payment_method: string
          paypal_order_id: string | null
          paypal_payment_id: string | null
          product_id: string
          status: string
          updated_at: string
          user_email: string
          user_name: string | null
        }
        Insert: {
          amount: number
          created_at?: string
          currency: string
          download_expires_at?: string | null
          downloaded_at?: string | null
          id?: string
          order_reference?: string | null
          payment_method: string
          paypal_order_id?: string | null
          paypal_payment_id?: string | null
          product_id: string
          status?: string
          updated_at?: string
          user_email: string
          user_name?: string | null
        }
        Update: {
          amount?: number
          created_at?: string
          currency?: string
          download_expires_at?: string | null
          downloaded_at?: string | null
          id?: string
          order_reference?: string | null
          payment_method?: string
          paypal_order_id?: string | null
          paypal_payment_id?: string | null
          product_id?: string
          status?: string
          updated_at?: string
          user_email?: string
          user_name?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "download_purchases_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      employees: {
        Row: {
          created_at: string
          daily_rate: number | null
          date_hired: string | null
          date_terminated: string | null
          email: string | null
          employee_number: string
          employment_type: string
          first_name: string
          hourly_rate: number | null
          id: string
          is_active: boolean
          last_name: string
          monthly_salary: number | null
          national_id: string | null
          nis_number: string | null
          phone: string | null
          updated_at: string
          user_id: string
          weekly_pay_schedule: string | null
          weekly_rate: number | null
        }
        Insert: {
          created_at?: string
          daily_rate?: number | null
          date_hired?: string | null
          date_terminated?: string | null
          email?: string | null
          employee_number: string
          employment_type: string
          first_name: string
          hourly_rate?: number | null
          id?: string
          is_active?: boolean
          last_name: string
          monthly_salary?: number | null
          national_id?: string | null
          nis_number?: string | null
          phone?: string | null
          updated_at?: string
          user_id: string
          weekly_pay_schedule?: string | null
          weekly_rate?: number | null
        }
        Update: {
          created_at?: string
          daily_rate?: number | null
          date_hired?: string | null
          date_terminated?: string | null
          email?: string | null
          employee_number?: string
          employment_type?: string
          first_name?: string
          hourly_rate?: number | null
          id?: string
          is_active?: boolean
          last_name?: string
          monthly_salary?: number | null
          national_id?: string | null
          nis_number?: string | null
          phone?: string | null
          updated_at?: string
          user_id?: string
          weekly_pay_schedule?: string | null
          weekly_rate?: number | null
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
          budget_category_id: string | null
          category: string
          created_at: string | null
          date: string
          description: string
          drive_file_id: string | null
          drive_folder_id: string | null
          drive_url: string | null
          expense_type: string
          family_id: string
          id: string
          is_tax_deductible: boolean | null
          needs_replacement: boolean | null
          next_replacement_date: string | null
          paid_on_date: string | null
          payment_method: string | null
          payroll_entry_id: string | null
          payroll_period_id: string | null
          place: string
          receipt_image_url: string | null
          receipt_url: string | null
          replacement_frequency: number | null
          tags: string[] | null
          tax_amount: number | null
          transaction_id: string | null
          vendor_id: string | null
        }
        Insert: {
          amount: number
          budget_category_id?: string | null
          category: string
          created_at?: string | null
          date: string
          description: string
          drive_file_id?: string | null
          drive_folder_id?: string | null
          drive_url?: string | null
          expense_type?: string
          family_id: string
          id?: string
          is_tax_deductible?: boolean | null
          needs_replacement?: boolean | null
          next_replacement_date?: string | null
          paid_on_date?: string | null
          payment_method?: string | null
          payroll_entry_id?: string | null
          payroll_period_id?: string | null
          place: string
          receipt_image_url?: string | null
          receipt_url?: string | null
          replacement_frequency?: number | null
          tags?: string[] | null
          tax_amount?: number | null
          transaction_id?: string | null
          vendor_id?: string | null
        }
        Update: {
          amount?: number
          budget_category_id?: string | null
          category?: string
          created_at?: string | null
          date?: string
          description?: string
          drive_file_id?: string | null
          drive_folder_id?: string | null
          drive_url?: string | null
          expense_type?: string
          family_id?: string
          id?: string
          is_tax_deductible?: boolean | null
          needs_replacement?: boolean | null
          next_replacement_date?: string | null
          paid_on_date?: string | null
          payment_method?: string | null
          payroll_entry_id?: string | null
          payroll_period_id?: string | null
          place?: string
          receipt_image_url?: string | null
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
          {
            foreignKeyName: "expenses_payroll_entry_id_fkey"
            columns: ["payroll_entry_id"]
            isOneToOne: false
            referencedRelation: "payroll_entries"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "expenses_payroll_period_id_fkey"
            columns: ["payroll_period_id"]
            isOneToOne: false
            referencedRelation: "payroll_periods"
            referencedColumns: ["id"]
          },
        ]
      }
      families: {
        Row: {
          color: string
          created_at: string | null
          drive_folder_id: string | null
          drive_shared_emails: string[] | null
          id: string
          name: string
          user_id: string
        }
        Insert: {
          color: string
          created_at?: string | null
          drive_folder_id?: string | null
          drive_shared_emails?: string[] | null
          id?: string
          name: string
          user_id: string
        }
        Update: {
          color?: string
          created_at?: string | null
          drive_folder_id?: string | null
          drive_shared_emails?: string[] | null
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
      income_sources: {
        Row: {
          amount_ttd: number
          created_at: string
          family_id: string | null
          frequency: string
          id: string
          is_active: boolean
          name: string
          notes: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          amount_ttd?: number
          created_at?: string
          family_id?: string | null
          frequency: string
          id?: string
          is_active?: boolean
          name: string
          notes?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          amount_ttd?: number
          created_at?: string
          family_id?: string | null
          frequency?: string
          id?: string
          is_active?: boolean
          name?: string
          notes?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "income_sources_family_id_fkey"
            columns: ["family_id"]
            isOneToOne: false
            referencedRelation: "families"
            referencedColumns: ["id"]
          },
        ]
      }
      nis_earnings_classes: {
        Row: {
          created_at: string
          earnings_class: string
          effective_date: string
          employee_contribution: number
          employer_contribution: number
          id: string
          is_active: boolean
          max_weekly_earnings: number
          min_weekly_earnings: number
        }
        Insert: {
          created_at?: string
          earnings_class: string
          effective_date: string
          employee_contribution: number
          employer_contribution: number
          id?: string
          is_active?: boolean
          max_weekly_earnings: number
          min_weekly_earnings: number
        }
        Update: {
          created_at?: string
          earnings_class?: string
          effective_date?: string
          employee_contribution?: number
          employer_contribution?: number
          id?: string
          is_active?: boolean
          max_weekly_earnings?: number
          min_weekly_earnings?: number
        }
        Relationships: []
      }
      nis_rates: {
        Row: {
          created_at: string
          effective_date: string
          employee_rate: number
          employer_rate: number
          id: string
          is_active: boolean
          max_weekly_wage: number
          min_weekly_wage: number
        }
        Insert: {
          created_at?: string
          effective_date: string
          employee_rate: number
          employer_rate: number
          id?: string
          is_active?: boolean
          max_weekly_wage: number
          min_weekly_wage: number
        }
        Update: {
          created_at?: string
          effective_date?: string
          employee_rate?: number
          employer_rate?: number
          id?: string
          is_active?: boolean
          max_weekly_wage?: number
          min_weekly_wage?: number
        }
        Relationships: []
      }
      paypal_payments: {
        Row: {
          amount: number
          created_at: string
          currency: string
          id: string
          payment_method: string
          paypal_order_id: string
          paypal_payment_id: string | null
          payroll_period_id: string
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          amount: number
          created_at?: string
          currency?: string
          id?: string
          payment_method?: string
          paypal_order_id: string
          paypal_payment_id?: string | null
          payroll_period_id: string
          status: string
          updated_at?: string
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          currency?: string
          id?: string
          payment_method?: string
          paypal_order_id?: string
          paypal_payment_id?: string | null
          payroll_period_id?: string
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "paypal_payments_payroll_period_id_fkey"
            columns: ["payroll_period_id"]
            isOneToOne: false
            referencedRelation: "payroll_periods"
            referencedColumns: ["id"]
          },
        ]
      }
      payroll_calculations: {
        Row: {
          calculation_date: string
          calculation_method: string
          created_at: string
          employee_contribution: number
          employee_id: string
          employer_contribution: number
          id: string
          nis_class: string
          notes: string | null
          user_id: string
          weekly_earnings: number
        }
        Insert: {
          calculation_date: string
          calculation_method?: string
          created_at?: string
          employee_contribution: number
          employee_id: string
          employer_contribution: number
          id?: string
          nis_class: string
          notes?: string | null
          user_id: string
          weekly_earnings: number
        }
        Update: {
          calculation_date?: string
          calculation_method?: string
          created_at?: string
          employee_contribution?: number
          employee_id?: string
          employer_contribution?: number
          id?: string
          nis_class?: string
          notes?: string | null
          user_id?: string
          weekly_earnings?: number
        }
        Relationships: [
          {
            foreignKeyName: "payroll_calculations_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
        ]
      }
      payroll_entries: {
        Row: {
          calculated_at: string | null
          created_at: string
          days_worked: number | null
          employee_id: string
          gross_pay: number
          hours_worked: number | null
          id: string
          net_pay: number
          nis_employee_contribution: number
          nis_employer_contribution: number
          other_allowances: number | null
          other_deductions: number | null
          payroll_period_id: string
          recorded_pay: number | null
          updated_at: string
          variance_amount: number | null
          variance_notes: string | null
          week_end_date: string | null
          week_number: number | null
          week_start_date: string | null
        }
        Insert: {
          calculated_at?: string | null
          created_at?: string
          days_worked?: number | null
          employee_id: string
          gross_pay?: number
          hours_worked?: number | null
          id?: string
          net_pay?: number
          nis_employee_contribution?: number
          nis_employer_contribution?: number
          other_allowances?: number | null
          other_deductions?: number | null
          payroll_period_id: string
          recorded_pay?: number | null
          updated_at?: string
          variance_amount?: number | null
          variance_notes?: string | null
          week_end_date?: string | null
          week_number?: number | null
          week_start_date?: string | null
        }
        Update: {
          calculated_at?: string | null
          created_at?: string
          days_worked?: number | null
          employee_id?: string
          gross_pay?: number
          hours_worked?: number | null
          id?: string
          net_pay?: number
          nis_employee_contribution?: number
          nis_employer_contribution?: number
          other_allowances?: number | null
          other_deductions?: number | null
          payroll_period_id?: string
          recorded_pay?: number | null
          updated_at?: string
          variance_amount?: number | null
          variance_notes?: string | null
          week_end_date?: string | null
          week_number?: number | null
          week_start_date?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_payroll_entries_employee"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_payroll_entries_payroll_period"
            columns: ["payroll_period_id"]
            isOneToOne: false
            referencedRelation: "payroll_periods"
            referencedColumns: ["id"]
          },
        ]
      }
      payroll_imports: {
        Row: {
          created_at: string
          error_log: Json | null
          file_name: string
          id: string
          import_status: string
          import_type: string
          imported_data: Json | null
          records_failed: number
          records_imported: number
          user_id: string
        }
        Insert: {
          created_at?: string
          error_log?: Json | null
          file_name: string
          id?: string
          import_status?: string
          import_type: string
          imported_data?: Json | null
          records_failed?: number
          records_imported?: number
          user_id: string
        }
        Update: {
          created_at?: string
          error_log?: Json | null
          file_name?: string
          id?: string
          import_status?: string
          import_type?: string
          imported_data?: Json | null
          records_failed?: number
          records_imported?: number
          user_id?: string
        }
        Relationships: []
      }
      payroll_periods: {
        Row: {
          created_at: string
          end_date: string
          entered_date: string | null
          id: string
          name: string
          notes: string | null
          paid_date: string | null
          pay_date: string
          payroll_data: Json | null
          start_date: string
          status: string
          total_gross_pay: number | null
          total_net_pay: number | null
          total_nis_employee: number | null
          total_nis_employer: number | null
          transaction_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          end_date: string
          entered_date?: string | null
          id?: string
          name: string
          notes?: string | null
          paid_date?: string | null
          pay_date: string
          payroll_data?: Json | null
          start_date: string
          status?: string
          total_gross_pay?: number | null
          total_net_pay?: number | null
          total_nis_employee?: number | null
          total_nis_employer?: number | null
          transaction_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          end_date?: string
          entered_date?: string | null
          id?: string
          name?: string
          notes?: string | null
          paid_date?: string | null
          pay_date?: string
          payroll_data?: Json | null
          start_date?: string
          status?: string
          total_gross_pay?: number | null
          total_net_pay?: number | null
          total_nis_employee?: number | null
          total_nis_employer?: number | null
          transaction_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      products: {
        Row: {
          created_at: string
          description: string | null
          download_file_path: string | null
          features: Json | null
          id: string
          is_active: boolean
          name: string
          price_ttd: number
          price_usd: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          download_file_path?: string | null
          features?: Json | null
          id?: string
          is_active?: boolean
          name: string
          price_ttd: number
          price_usd: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          download_file_path?: string | null
          features?: Json | null
          id?: string
          is_active?: boolean
          name?: string
          price_ttd?: number
          price_usd?: number
          updated_at?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string | null
          id: string
          phone_number: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id: string
          phone_number?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          phone_number?: string | null
          updated_at?: string | null
        }
        Relationships: []
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
          member_id: string | null
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
          member_id?: string | null
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
          member_id?: string | null
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
            foreignKeyName: "receipt_line_items_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "family_members"
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
      release_notes: {
        Row: {
          category: string
          created_at: string | null
          description: string
          display_order: number | null
          feature_area: string | null
          id: string
          is_published: boolean | null
          media_url: string | null
          released_at: string
          title: string
          tutorial_steps: Json | null
          updated_at: string | null
        }
        Insert: {
          category: string
          created_at?: string | null
          description: string
          display_order?: number | null
          feature_area?: string | null
          id?: string
          is_published?: boolean | null
          media_url?: string | null
          released_at?: string
          title: string
          tutorial_steps?: Json | null
          updated_at?: string | null
        }
        Update: {
          category?: string
          created_at?: string | null
          description?: string
          display_order?: number | null
          feature_area?: string | null
          id?: string
          is_published?: boolean | null
          media_url?: string | null
          released_at?: string
          title?: string
          tutorial_steps?: Json | null
          updated_at?: string | null
        }
        Relationships: []
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
      sahm_budget_submissions: {
        Row: {
          additional_info: Json | null
          created_at: string
          dependents: number | null
          email: string
          household_size: number | null
          id: string
          ip_address: unknown
          location: string | null
          name: string | null
          needs_data: Json
          notes: string | null
          savings_data: Json
          total_budget: number | null
          total_needs: number | null
          total_savings: number | null
          total_wants: number | null
          user_agent: string | null
          wants_data: Json
        }
        Insert: {
          additional_info?: Json | null
          created_at?: string
          dependents?: number | null
          email: string
          household_size?: number | null
          id?: string
          ip_address?: unknown
          location?: string | null
          name?: string | null
          needs_data?: Json
          notes?: string | null
          savings_data?: Json
          total_budget?: number | null
          total_needs?: number | null
          total_savings?: number | null
          total_wants?: number | null
          user_agent?: string | null
          wants_data?: Json
        }
        Update: {
          additional_info?: Json | null
          created_at?: string
          dependents?: number | null
          email?: string
          household_size?: number | null
          id?: string
          ip_address?: unknown
          location?: string | null
          name?: string | null
          needs_data?: Json
          notes?: string | null
          savings_data?: Json
          total_budget?: number | null
          total_needs?: number | null
          total_savings?: number | null
          total_wants?: number | null
          user_agent?: string | null
          wants_data?: Json
        }
        Relationships: []
      }
      subscription_plans: {
        Row: {
          billing_cycle: string
          created_at: string
          currency: string
          description: string | null
          features: Json | null
          id: string
          is_active: boolean
          max_employees: number | null
          name: string
          price: number
          updated_at: string
        }
        Insert: {
          billing_cycle: string
          created_at?: string
          currency?: string
          description?: string | null
          features?: Json | null
          id?: string
          is_active?: boolean
          max_employees?: number | null
          name: string
          price: number
          updated_at?: string
        }
        Update: {
          billing_cycle?: string
          created_at?: string
          currency?: string
          description?: string | null
          features?: Json | null
          id?: string
          is_active?: boolean
          max_employees?: number | null
          name?: string
          price?: number
          updated_at?: string
        }
        Relationships: []
      }
      user_feedback: {
        Row: {
          admin_response: string | null
          category: string | null
          contact_info: Json | null
          created_at: string
          emoji_rating: string | null
          feedback_type: string
          id: string
          keywords: string[] | null
          message: string
          metadata: Json | null
          priority: string
          rating: number | null
          responded_at: string | null
          sentiment_label: string | null
          sentiment_score: number | null
          status: string
          subject: string
          updated_at: string
          urgency_score: number | null
          user_id: string | null
        }
        Insert: {
          admin_response?: string | null
          category?: string | null
          contact_info?: Json | null
          created_at?: string
          emoji_rating?: string | null
          feedback_type: string
          id?: string
          keywords?: string[] | null
          message: string
          metadata?: Json | null
          priority?: string
          rating?: number | null
          responded_at?: string | null
          sentiment_label?: string | null
          sentiment_score?: number | null
          status?: string
          subject: string
          updated_at?: string
          urgency_score?: number | null
          user_id?: string | null
        }
        Update: {
          admin_response?: string | null
          category?: string | null
          contact_info?: Json | null
          created_at?: string
          emoji_rating?: string | null
          feedback_type?: string
          id?: string
          keywords?: string[] | null
          message?: string
          metadata?: Json | null
          priority?: string
          rating?: number | null
          responded_at?: string | null
          sentiment_label?: string | null
          sentiment_score?: number | null
          status?: string
          subject?: string
          updated_at?: string
          urgency_score?: number | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "user_feedback_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string | null
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      user_subscriptions: {
        Row: {
          created_at: string
          current_period_end: string | null
          current_period_start: string | null
          id: string
          paypal_subscription_id: string | null
          status: string
          subscription_plan_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          current_period_end?: string | null
          current_period_start?: string | null
          id?: string
          paypal_subscription_id?: string | null
          status: string
          subscription_plan_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          current_period_end?: string | null
          current_period_start?: string | null
          id?: string
          paypal_subscription_id?: string | null
          status?: string
          subscription_plan_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_subscriptions_subscription_plan_id_fkey"
            columns: ["subscription_plan_id"]
            isOneToOne: false
            referencedRelation: "subscription_plans"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      clean_duplicate_families: { Args: never; Returns: undefined }
      cleanup_duplicate_budget_categories: { Args: never; Returns: undefined }
      cleanup_duplicate_categories_advanced: {
        Args: never
        Returns: {
          categories_updated: number
          duplicates_removed: number
          message: string
        }[]
      }
      create_default_budget_categories: {
        Args: { user_uuid: string }
        Returns: undefined
      }
      ensure_user_budget_categories: {
        Args: { user_uuid: string }
        Returns: undefined
      }
      ensure_user_budget_categories_safe: {
        Args: { user_uuid: string }
        Returns: undefined
      }
      get_or_create_budget_category: {
        Args: { category_name: string; family_uuid: string; user_uuid: string }
        Returns: string
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      map_all_expenses_to_budget_categories: { Args: never; Returns: undefined }
      map_expenses_to_budget_categories: { Args: never; Returns: undefined }
      reclassify_categories: {
        Args: never
        Returns: {
          categories_reclassified: number
          message: string
        }[]
      }
      seed_comprehensive_categories_for_user:
        | {
            Args: { family_uuid?: string; user_uuid: string }
            Returns: undefined
          }
        | { Args: { user_uuid: string }; Returns: undefined }
      seed_user_comprehensive_categories: {
        Args: { user_uuid: string }
        Returns: undefined
      }
      sync_comprehensive_budget_categories: { Args: never; Returns: undefined }
      update_payroll_period_totals: {
        Args: { period_id: string }
        Returns: undefined
      }
    }
    Enums: {
      app_role: "admin" | "moderator" | "user"
      task_priority: "low" | "medium" | "high" | "urgent"
      task_status: "todo" | "in_progress" | "blocked" | "done"
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
    Enums: {
      app_role: ["admin", "moderator", "user"],
      task_priority: ["low", "medium", "high", "urgent"],
      task_status: ["todo", "in_progress", "blocked", "done"],
    },
  },
} as const
