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
      advances: {
        Row: {
          amount_cents: number
          currency: string
          decided_at: string | null
          id: string
          org_id: string
          project_id: string | null
          reason: string | null
          requested_at: string
          requester_id: string
          status: string
          updated_at: string
        }
        Insert: {
          amount_cents: number
          currency?: string
          decided_at?: string | null
          id?: string
          org_id: string
          project_id?: string | null
          reason?: string | null
          requested_at?: string
          requester_id: string
          status?: string
          updated_at?: string
        }
        Update: {
          amount_cents?: number
          currency?: string
          decided_at?: string | null
          id?: string
          org_id?: string
          project_id?: string | null
          reason?: string | null
          requested_at?: string
          requester_id?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "advances_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "orgs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "advances_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "advances_requester_id_fkey"
            columns: ["requester_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_conversations: {
        Row: {
          created_at: string
          id: string
          org_id: string
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          org_id: string
          title?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          org_id?: string
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ai_conversations_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "orgs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_conversations_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_messages: {
        Row: {
          content: string
          conversation_id: string
          created_at: string
          id: string
          role: string
        }
        Insert: {
          content: string
          conversation_id: string
          created_at?: string
          id?: string
          role: string
        }
        Update: {
          content?: string
          conversation_id?: string
          created_at?: string
          id?: string
          role?: string
        }
        Relationships: [
          {
            foreignKeyName: "ai_messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "ai_conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      audit_log: {
        Row: {
          action: string
          actor_email: string | null
          actor_id: string | null
          after: Json | null
          at: string
          before: Json | null
          id: string
          metadata: Json | null
          operation: string | null
          org_id: string
          request_id: string | null
          target_id: string | null
          target_table: string | null
        }
        Insert: {
          action: string
          actor_email?: string | null
          actor_id?: string | null
          after?: Json | null
          at?: string
          before?: Json | null
          id?: string
          metadata?: Json | null
          operation?: string | null
          org_id: string
          request_id?: string | null
          target_id?: string | null
          target_table?: string | null
        }
        Update: {
          action?: string
          actor_email?: string | null
          actor_id?: string | null
          after?: Json | null
          at?: string
          before?: Json | null
          id?: string
          metadata?: Json | null
          operation?: string | null
          org_id?: string
          request_id?: string | null
          target_id?: string | null
          target_table?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "audit_log_actor_id_fkey"
            columns: ["actor_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "audit_log_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "orgs"
            referencedColumns: ["id"]
          },
        ]
      }
      budgets: {
        Row: {
          amount_cents: number
          category: string | null
          created_at: string
          id: string
          name: string
          org_id: string
          project_id: string | null
          spent_cents: number
          updated_at: string
        }
        Insert: {
          amount_cents?: number
          category?: string | null
          created_at?: string
          id?: string
          name: string
          org_id: string
          project_id?: string | null
          spent_cents?: number
          updated_at?: string
        }
        Update: {
          amount_cents?: number
          category?: string | null
          created_at?: string
          id?: string
          name?: string
          org_id?: string
          project_id?: string | null
          spent_cents?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "budgets_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "orgs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "budgets_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      clients: {
        Row: {
          contact_email: string | null
          contact_phone: string | null
          created_at: string
          created_by: string | null
          deleted_at: string | null
          id: string
          name: string
          notes: string | null
          org_id: string
          updated_at: string
          website: string | null
        }
        Insert: {
          contact_email?: string | null
          contact_phone?: string | null
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          id?: string
          name: string
          notes?: string | null
          org_id: string
          updated_at?: string
          website?: string | null
        }
        Update: {
          contact_email?: string | null
          contact_phone?: string | null
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          id?: string
          name?: string
          notes?: string | null
          org_id?: string
          updated_at?: string
          website?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "clients_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "clients_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "orgs"
            referencedColumns: ["id"]
          },
        ]
      }
      credentials: {
        Row: {
          created_at: string
          crew_member_id: string | null
          expires_on: string | null
          file_path: string | null
          id: string
          issued_on: string | null
          kind: string
          number: string | null
          org_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          crew_member_id?: string | null
          expires_on?: string | null
          file_path?: string | null
          id?: string
          issued_on?: string | null
          kind: string
          number?: string | null
          org_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          crew_member_id?: string | null
          expires_on?: string | null
          file_path?: string | null
          id?: string
          issued_on?: string | null
          kind?: string
          number?: string | null
          org_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "credentials_crew_member_id_fkey"
            columns: ["crew_member_id"]
            isOneToOne: false
            referencedRelation: "crew_members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "credentials_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "orgs"
            referencedColumns: ["id"]
          },
        ]
      }
      crew_members: {
        Row: {
          created_at: string
          day_rate_cents: number | null
          email: string | null
          id: string
          name: string
          notes: string | null
          org_id: string
          phone: string | null
          role: string | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          day_rate_cents?: number | null
          email?: string | null
          id?: string
          name: string
          notes?: string | null
          org_id: string
          phone?: string | null
          role?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          day_rate_cents?: number | null
          email?: string | null
          id?: string
          name?: string
          notes?: string | null
          org_id?: string
          phone?: string | null
          role?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "crew_members_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "orgs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crew_members_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      deliverable_comments: {
        Row: {
          body: string
          created_at: string
          deliverable_id: string
          id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          body: string
          created_at?: string
          deliverable_id: string
          id?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          body?: string
          created_at?: string
          deliverable_id?: string
          id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "deliverable_comments_deliverable_id_fkey"
            columns: ["deliverable_id"]
            isOneToOne: false
            referencedRelation: "deliverables"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "deliverable_comments_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      deliverable_history: {
        Row: {
          changed_at: string
          changed_by: string
          data: Json
          deliverable_id: string
          id: string
          version: number
        }
        Insert: {
          changed_at?: string
          changed_by: string
          data: Json
          deliverable_id: string
          id?: string
          version: number
        }
        Update: {
          changed_at?: string
          changed_by?: string
          data?: Json
          deliverable_id?: string
          id?: string
          version?: number
        }
        Relationships: [
          {
            foreignKeyName: "deliverable_history_changed_by_fkey"
            columns: ["changed_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "deliverable_history_deliverable_id_fkey"
            columns: ["deliverable_id"]
            isOneToOne: false
            referencedRelation: "deliverables"
            referencedColumns: ["id"]
          },
        ]
      }
      deliverables: {
        Row: {
          created_at: string
          data: Json
          deadline: string | null
          deleted_at: string | null
          file_path: string | null
          id: string
          org_id: string
          project_id: string
          reviewed_at: string | null
          reviewed_by: string | null
          status: Database["public"]["Enums"]["deliverable_status"]
          submitted_at: string | null
          submitted_by: string | null
          title: string | null
          type: Database["public"]["Enums"]["deliverable_type"]
          updated_at: string
          version: number
        }
        Insert: {
          created_at?: string
          data?: Json
          deadline?: string | null
          deleted_at?: string | null
          file_path?: string | null
          id?: string
          org_id: string
          project_id: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: Database["public"]["Enums"]["deliverable_status"]
          submitted_at?: string | null
          submitted_by?: string | null
          title?: string | null
          type: Database["public"]["Enums"]["deliverable_type"]
          updated_at?: string
          version?: number
        }
        Update: {
          created_at?: string
          data?: Json
          deadline?: string | null
          deleted_at?: string | null
          file_path?: string | null
          id?: string
          org_id?: string
          project_id?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: Database["public"]["Enums"]["deliverable_status"]
          submitted_at?: string | null
          submitted_by?: string | null
          title?: string | null
          type?: Database["public"]["Enums"]["deliverable_type"]
          updated_at?: string
          version?: number
        }
        Relationships: [
          {
            foreignKeyName: "deliverables_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "orgs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "deliverables_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "deliverables_reviewed_by_fkey"
            columns: ["reviewed_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "deliverables_submitted_by_fkey"
            columns: ["submitted_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      equipment: {
        Row: {
          asset_tag: string | null
          category: string | null
          created_at: string
          daily_rate_cents: number | null
          deleted_at: string | null
          id: string
          location_id: string | null
          name: string
          notes: string | null
          org_id: string
          serial: string | null
          status: Database["public"]["Enums"]["equipment_status"]
          updated_at: string
        }
        Insert: {
          asset_tag?: string | null
          category?: string | null
          created_at?: string
          daily_rate_cents?: number | null
          deleted_at?: string | null
          id?: string
          location_id?: string | null
          name: string
          notes?: string | null
          org_id: string
          serial?: string | null
          status?: Database["public"]["Enums"]["equipment_status"]
          updated_at?: string
        }
        Update: {
          asset_tag?: string | null
          category?: string | null
          created_at?: string
          daily_rate_cents?: number | null
          deleted_at?: string | null
          id?: string
          location_id?: string | null
          name?: string
          notes?: string | null
          org_id?: string
          serial?: string | null
          status?: Database["public"]["Enums"]["equipment_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "equipment_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "orgs"
            referencedColumns: ["id"]
          },
        ]
      }
      event_guides: {
        Row: {
          classification: string | null
          config: Json
          created_at: string
          created_by: string | null
          deleted_at: string | null
          id: string
          org_id: string
          persona: Database["public"]["Enums"]["guide_persona"]
          project_id: string
          published: boolean
          slug: string | null
          subtitle: string | null
          tier: number
          title: string
          updated_at: string
        }
        Insert: {
          classification?: string | null
          config?: Json
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          id?: string
          org_id: string
          persona: Database["public"]["Enums"]["guide_persona"]
          project_id: string
          published?: boolean
          slug?: string | null
          subtitle?: string | null
          tier?: number
          title: string
          updated_at?: string
        }
        Update: {
          classification?: string | null
          config?: Json
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          id?: string
          org_id?: string
          persona?: Database["public"]["Enums"]["guide_persona"]
          project_id?: string
          published?: boolean
          slug?: string | null
          subtitle?: string | null
          tier?: number
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "event_guides_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_guides_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "orgs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_guides_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      events: {
        Row: {
          created_at: string
          description: string | null
          ends_at: string
          id: string
          location_id: string | null
          name: string
          org_id: string
          project_id: string | null
          starts_at: string
          status: Database["public"]["Enums"]["event_status"]
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          ends_at: string
          id?: string
          location_id?: string | null
          name: string
          org_id: string
          project_id?: string | null
          starts_at: string
          status?: Database["public"]["Enums"]["event_status"]
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          ends_at?: string
          id?: string
          location_id?: string | null
          name?: string
          org_id?: string
          project_id?: string | null
          starts_at?: string
          status?: Database["public"]["Enums"]["event_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "events_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "orgs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "events_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      expenses: {
        Row: {
          amount_cents: number
          category: string | null
          created_at: string
          currency: string
          description: string
          id: string
          org_id: string
          project_id: string | null
          receipt_path: string | null
          spent_at: string
          status: Database["public"]["Enums"]["expense_status"]
          submitter_id: string
          updated_at: string
        }
        Insert: {
          amount_cents: number
          category?: string | null
          created_at?: string
          currency?: string
          description: string
          id?: string
          org_id: string
          project_id?: string | null
          receipt_path?: string | null
          spent_at: string
          status?: Database["public"]["Enums"]["expense_status"]
          submitter_id: string
          updated_at?: string
        }
        Update: {
          amount_cents?: number
          category?: string | null
          created_at?: string
          currency?: string
          description?: string
          id?: string
          org_id?: string
          project_id?: string | null
          receipt_path?: string | null
          spent_at?: string
          status?: Database["public"]["Enums"]["expense_status"]
          submitter_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "expenses_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "orgs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "expenses_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "expenses_submitter_id_fkey"
            columns: ["submitter_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      fabrication_orders: {
        Row: {
          created_at: string
          description: string | null
          due_at: string | null
          id: string
          org_id: string
          project_id: string | null
          status: string
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          due_at?: string | null
          id?: string
          org_id: string
          project_id?: string | null
          status?: string
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          due_at?: string | null
          id?: string
          org_id?: string
          project_id?: string | null
          status?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "fabrication_orders_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "orgs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fabrication_orders_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      guide_comments: {
        Row: {
          author_email: string | null
          author_name: string | null
          author_user_id: string | null
          body: string
          created_at: string
          guide_id: string
          id: string
          org_id: string
          parent_id: string | null
          resolved_at: string | null
          section_key: string | null
          updated_at: string
        }
        Insert: {
          author_email?: string | null
          author_name?: string | null
          author_user_id?: string | null
          body: string
          created_at?: string
          guide_id: string
          id?: string
          org_id: string
          parent_id?: string | null
          resolved_at?: string | null
          section_key?: string | null
          updated_at?: string
        }
        Update: {
          author_email?: string | null
          author_name?: string | null
          author_user_id?: string | null
          body?: string
          created_at?: string
          guide_id?: string
          id?: string
          org_id?: string
          parent_id?: string | null
          resolved_at?: string | null
          section_key?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "guide_comments_author_user_id_fkey"
            columns: ["author_user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "guide_comments_guide_id_fkey"
            columns: ["guide_id"]
            isOneToOne: false
            referencedRelation: "event_guides"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "guide_comments_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "orgs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "guide_comments_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "guide_comments"
            referencedColumns: ["id"]
          },
        ]
      }
      idempotency_keys: {
        Row: {
          created_at: string
          expires_at: string
          key: string
          method: string
          org_id: string | null
          path: string
          request_hash: string
          response: Json
          status_code: number
          user_id: string | null
        }
        Insert: {
          created_at?: string
          expires_at?: string
          key: string
          method: string
          org_id?: string | null
          path: string
          request_hash: string
          response: Json
          status_code: number
          user_id?: string | null
        }
        Update: {
          created_at?: string
          expires_at?: string
          key?: string
          method?: string
          org_id?: string | null
          path?: string
          request_hash?: string
          response?: Json
          status_code?: number
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "idempotency_keys_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "orgs"
            referencedColumns: ["id"]
          },
        ]
      }
      invoice_line_items: {
        Row: {
          description: string
          id: string
          invoice_id: string
          position: number
          quantity: number
          unit_price_cents: number
          updated_at: string
        }
        Insert: {
          description: string
          id?: string
          invoice_id: string
          position?: number
          quantity?: number
          unit_price_cents?: number
          updated_at?: string
        }
        Update: {
          description?: string
          id?: string
          invoice_id?: string
          position?: number
          quantity?: number
          unit_price_cents?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "invoice_line_items_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "invoices"
            referencedColumns: ["id"]
          },
        ]
      }
      invoices: {
        Row: {
          amount_cents: number
          client_id: string | null
          created_at: string
          created_by: string | null
          currency: string
          deleted_at: string | null
          due_at: string | null
          id: string
          issued_at: string | null
          notes: string | null
          number: string
          org_id: string
          paid_at: string | null
          project_id: string | null
          status: Database["public"]["Enums"]["invoice_status"]
          stripe_payment_intent: string | null
          title: string
          updated_at: string
        }
        Insert: {
          amount_cents?: number
          client_id?: string | null
          created_at?: string
          created_by?: string | null
          currency?: string
          deleted_at?: string | null
          due_at?: string | null
          id?: string
          issued_at?: string | null
          notes?: string | null
          number: string
          org_id: string
          paid_at?: string | null
          project_id?: string | null
          status?: Database["public"]["Enums"]["invoice_status"]
          stripe_payment_intent?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          amount_cents?: number
          client_id?: string | null
          created_at?: string
          created_by?: string | null
          currency?: string
          deleted_at?: string | null
          due_at?: string | null
          id?: string
          issued_at?: string | null
          notes?: string | null
          number?: string
          org_id?: string
          paid_at?: string | null
          project_id?: string | null
          status?: Database["public"]["Enums"]["invoice_status"]
          stripe_payment_intent?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "invoices_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoices_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoices_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "orgs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoices_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      leads: {
        Row: {
          assigned_to: string | null
          created_at: string
          created_by: string | null
          email: string | null
          estimated_value_cents: number | null
          id: string
          name: string
          notes: string | null
          org_id: string
          phone: string | null
          source: string | null
          stage: Database["public"]["Enums"]["lead_stage"]
          updated_at: string
        }
        Insert: {
          assigned_to?: string | null
          created_at?: string
          created_by?: string | null
          email?: string | null
          estimated_value_cents?: number | null
          id?: string
          name: string
          notes?: string | null
          org_id: string
          phone?: string | null
          source?: string | null
          stage?: Database["public"]["Enums"]["lead_stage"]
          updated_at?: string
        }
        Update: {
          assigned_to?: string | null
          created_at?: string
          created_by?: string | null
          email?: string | null
          estimated_value_cents?: number | null
          id?: string
          name?: string
          notes?: string | null
          org_id?: string
          phone?: string | null
          source?: string | null
          stage?: Database["public"]["Enums"]["lead_stage"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "leads_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leads_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leads_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "orgs"
            referencedColumns: ["id"]
          },
        ]
      }
      locations: {
        Row: {
          address: string | null
          city: string | null
          country: string | null
          created_at: string
          id: string
          lat: number | null
          lng: number | null
          name: string
          notes: string | null
          org_id: string
          postcode: string | null
          region: string | null
          updated_at: string
        }
        Insert: {
          address?: string | null
          city?: string | null
          country?: string | null
          created_at?: string
          id?: string
          lat?: number | null
          lng?: number | null
          name: string
          notes?: string | null
          org_id: string
          postcode?: string | null
          region?: string | null
          updated_at?: string
        }
        Update: {
          address?: string | null
          city?: string | null
          country?: string | null
          created_at?: string
          id?: string
          lat?: number | null
          lng?: number | null
          name?: string
          notes?: string | null
          org_id?: string
          postcode?: string | null
          region?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "locations_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "orgs"
            referencedColumns: ["id"]
          },
        ]
      }
      memberships: {
        Row: {
          created_at: string
          deleted_at: string | null
          id: string
          org_id: string
          role: Database["public"]["Enums"]["platform_role"]
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          deleted_at?: string | null
          id?: string
          org_id: string
          role?: Database["public"]["Enums"]["platform_role"]
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          deleted_at?: string | null
          id?: string
          org_id?: string
          role?: Database["public"]["Enums"]["platform_role"]
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "memberships_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "orgs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "memberships_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      mileage_logs: {
        Row: {
          created_at: string
          destination: string
          id: string
          logged_on: string
          miles: number
          notes: string | null
          org_id: string
          origin: string
          project_id: string | null
          rate_cents: number
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          destination: string
          id?: string
          logged_on: string
          miles: number
          notes?: string | null
          org_id: string
          origin: string
          project_id?: string | null
          rate_cents?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          destination?: string
          id?: string
          logged_on?: string
          miles?: number
          notes?: string | null
          org_id?: string
          origin?: string
          project_id?: string | null
          rate_cents?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "mileage_logs_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "orgs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mileage_logs_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mileage_logs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          body: string | null
          created_at: string
          deleted_at: string | null
          href: string | null
          id: string
          org_id: string
          read_at: string | null
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          body?: string | null
          created_at?: string
          deleted_at?: string | null
          href?: string | null
          id?: string
          org_id: string
          read_at?: string | null
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          body?: string | null
          created_at?: string
          deleted_at?: string | null
          href?: string | null
          id?: string
          org_id?: string
          read_at?: string | null
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "orgs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      orgs: {
        Row: {
          branding: Json
          created_at: string
          id: string
          logo_url: string | null
          name: string
          name_override: string | null
          slug: string
          support_email: string | null
          tier: Database["public"]["Enums"]["tier"]
          updated_at: string
        }
        Insert: {
          branding?: Json
          created_at?: string
          id?: string
          logo_url?: string | null
          name: string
          name_override?: string | null
          slug: string
          support_email?: string | null
          tier?: Database["public"]["Enums"]["tier"]
          updated_at?: string
        }
        Update: {
          branding?: Json
          created_at?: string
          id?: string
          logo_url?: string | null
          name?: string
          name_override?: string | null
          slug?: string
          support_email?: string | null
          tier?: Database["public"]["Enums"]["tier"]
          updated_at?: string
        }
        Relationships: []
      }
      po_line_items: {
        Row: {
          description: string
          id: string
          position: number
          purchase_order_id: string
          quantity: number
          unit_price_cents: number
          updated_at: string
        }
        Insert: {
          description: string
          id?: string
          position?: number
          purchase_order_id: string
          quantity?: number
          unit_price_cents?: number
          updated_at?: string
        }
        Update: {
          description?: string
          id?: string
          position?: number
          purchase_order_id?: string
          quantity?: number
          unit_price_cents?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "po_line_items_purchase_order_id_fkey"
            columns: ["purchase_order_id"]
            isOneToOne: false
            referencedRelation: "purchase_orders"
            referencedColumns: ["id"]
          },
        ]
      }
      projects: {
        Row: {
          branding: Json
          budget_cents: number | null
          client_id: string | null
          created_at: string
          created_by: string
          deleted_at: string | null
          description: string | null
          end_date: string | null
          id: string
          name: string
          org_id: string
          slug: string
          start_date: string | null
          status: Database["public"]["Enums"]["project_status"]
          updated_at: string
        }
        Insert: {
          branding?: Json
          budget_cents?: number | null
          client_id?: string | null
          created_at?: string
          created_by: string
          deleted_at?: string | null
          description?: string | null
          end_date?: string | null
          id?: string
          name: string
          org_id: string
          slug: string
          start_date?: string | null
          status?: Database["public"]["Enums"]["project_status"]
          updated_at?: string
        }
        Update: {
          branding?: Json
          budget_cents?: number | null
          client_id?: string | null
          created_at?: string
          created_by?: string
          deleted_at?: string | null
          description?: string | null
          end_date?: string | null
          id?: string
          name?: string
          org_id?: string
          slug?: string
          start_date?: string | null
          status?: Database["public"]["Enums"]["project_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "projects_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "projects_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "orgs"
            referencedColumns: ["id"]
          },
        ]
      }
      proposal_events: {
        Row: {
          at: string
          event_type: string
          id: string
          metadata: Json | null
          proposal_id: string
          share_token: string | null
          updated_at: string
        }
        Insert: {
          at?: string
          event_type: string
          id?: string
          metadata?: Json | null
          proposal_id: string
          share_token?: string | null
          updated_at?: string
        }
        Update: {
          at?: string
          event_type?: string
          id?: string
          metadata?: Json | null
          proposal_id?: string
          share_token?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "proposal_events_proposal_id_fkey"
            columns: ["proposal_id"]
            isOneToOne: false
            referencedRelation: "proposals"
            referencedColumns: ["id"]
          },
        ]
      }
      proposal_share_links: {
        Row: {
          audience: string | null
          created_at: string
          created_by: string | null
          expires_at: string | null
          id: string
          last_viewed_at: string | null
          proposal_id: string
          revoked_at: string | null
          token: string
          updated_at: string
          view_count: number
        }
        Insert: {
          audience?: string | null
          created_at?: string
          created_by?: string | null
          expires_at?: string | null
          id?: string
          last_viewed_at?: string | null
          proposal_id: string
          revoked_at?: string | null
          token: string
          updated_at?: string
          view_count?: number
        }
        Update: {
          audience?: string | null
          created_at?: string
          created_by?: string | null
          expires_at?: string | null
          id?: string
          last_viewed_at?: string | null
          proposal_id?: string
          revoked_at?: string | null
          token?: string
          updated_at?: string
          view_count?: number
        }
        Relationships: [
          {
            foreignKeyName: "proposal_share_links_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "proposal_share_links_proposal_id_fkey"
            columns: ["proposal_id"]
            isOneToOne: false
            referencedRelation: "proposals"
            referencedColumns: ["id"]
          },
        ]
      }
      proposal_signatures: {
        Row: {
          id: string
          proposal_id: string
          share_token: string | null
          signature_data: string | null
          signature_hash: string
          signature_kind: string
          signed_at: string
          signer_email: string | null
          signer_ip: string | null
          signer_name: string
          signer_role: string | null
          updated_at: string
        }
        Insert: {
          id?: string
          proposal_id: string
          share_token?: string | null
          signature_data?: string | null
          signature_hash: string
          signature_kind: string
          signed_at?: string
          signer_email?: string | null
          signer_ip?: string | null
          signer_name: string
          signer_role?: string | null
          updated_at?: string
        }
        Update: {
          id?: string
          proposal_id?: string
          share_token?: string | null
          signature_data?: string | null
          signature_hash?: string
          signature_kind?: string
          signed_at?: string
          signer_email?: string | null
          signer_ip?: string | null
          signer_name?: string
          signer_role?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "proposal_signatures_proposal_id_fkey"
            columns: ["proposal_id"]
            isOneToOne: false
            referencedRelation: "proposals"
            referencedColumns: ["id"]
          },
        ]
      }
      proposal_versions: {
        Row: {
          blocks: Json
          changed_at: string
          changed_by: string | null
          id: string
          proposal_id: string
          theme: Json | null
          updated_at: string
          version: number
        }
        Insert: {
          blocks: Json
          changed_at?: string
          changed_by?: string | null
          id?: string
          proposal_id: string
          theme?: Json | null
          updated_at?: string
          version: number
        }
        Update: {
          blocks?: Json
          changed_at?: string
          changed_by?: string | null
          id?: string
          proposal_id?: string
          theme?: Json | null
          updated_at?: string
          version?: number
        }
        Relationships: [
          {
            foreignKeyName: "proposal_versions_changed_by_fkey"
            columns: ["changed_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "proposal_versions_proposal_id_fkey"
            columns: ["proposal_id"]
            isOneToOne: false
            referencedRelation: "proposals"
            referencedColumns: ["id"]
          },
        ]
      }
      proposals: {
        Row: {
          amount_cents: number | null
          blocks: Json
          client_id: string | null
          created_at: string
          created_by: string | null
          currency: string | null
          deleted_at: string | null
          deposit_percent: number | null
          doc_number: string | null
          expires_at: string | null
          id: string
          notes: string | null
          org_id: string
          project_id: string | null
          sent_at: string | null
          signature_data: string | null
          signature_hash: string | null
          signed_at: string | null
          signer_email: string | null
          signer_name: string | null
          status: Database["public"]["Enums"]["proposal_status"]
          theme: Json
          title: string
          updated_at: string
          version: number
        }
        Insert: {
          amount_cents?: number | null
          blocks?: Json
          client_id?: string | null
          created_at?: string
          created_by?: string | null
          currency?: string | null
          deleted_at?: string | null
          deposit_percent?: number | null
          doc_number?: string | null
          expires_at?: string | null
          id?: string
          notes?: string | null
          org_id: string
          project_id?: string | null
          sent_at?: string | null
          signature_data?: string | null
          signature_hash?: string | null
          signed_at?: string | null
          signer_email?: string | null
          signer_name?: string | null
          status?: Database["public"]["Enums"]["proposal_status"]
          theme?: Json
          title: string
          updated_at?: string
          version?: number
        }
        Update: {
          amount_cents?: number | null
          blocks?: Json
          client_id?: string | null
          created_at?: string
          created_by?: string | null
          currency?: string | null
          deleted_at?: string | null
          deposit_percent?: number | null
          doc_number?: string | null
          expires_at?: string | null
          id?: string
          notes?: string | null
          org_id?: string
          project_id?: string | null
          sent_at?: string | null
          signature_data?: string | null
          signature_hash?: string | null
          signed_at?: string | null
          signer_email?: string | null
          signer_name?: string | null
          status?: Database["public"]["Enums"]["proposal_status"]
          theme?: Json
          title?: string
          updated_at?: string
          version?: number
        }
        Relationships: [
          {
            foreignKeyName: "proposals_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "proposals_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "proposals_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "orgs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "proposals_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      purchase_orders: {
        Row: {
          amount_cents: number
          created_at: string
          created_by: string | null
          currency: string
          deleted_at: string | null
          id: string
          number: string
          org_id: string
          project_id: string | null
          requisition_id: string | null
          status: Database["public"]["Enums"]["po_status"]
          title: string
          updated_at: string
          vendor_id: string | null
        }
        Insert: {
          amount_cents?: number
          created_at?: string
          created_by?: string | null
          currency?: string
          deleted_at?: string | null
          id?: string
          number: string
          org_id: string
          project_id?: string | null
          requisition_id?: string | null
          status?: Database["public"]["Enums"]["po_status"]
          title: string
          updated_at?: string
          vendor_id?: string | null
        }
        Update: {
          amount_cents?: number
          created_at?: string
          created_by?: string | null
          currency?: string
          deleted_at?: string | null
          id?: string
          number?: string
          org_id?: string
          project_id?: string | null
          requisition_id?: string | null
          status?: Database["public"]["Enums"]["po_status"]
          title?: string
          updated_at?: string
          vendor_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "purchase_orders_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "purchase_orders_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "orgs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "purchase_orders_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "purchase_orders_requisition_id_fkey"
            columns: ["requisition_id"]
            isOneToOne: false
            referencedRelation: "requisitions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "purchase_orders_vendor_id_fkey"
            columns: ["vendor_id"]
            isOneToOne: false
            referencedRelation: "vendors"
            referencedColumns: ["id"]
          },
        ]
      }
      rate_limit_overrides: {
        Row: {
          bucket: string
          created_at: string
          id: string
          limit_count: number
          org_id: string
          updated_at: string
          window_ms: number
        }
        Insert: {
          bucket: string
          created_at?: string
          id?: string
          limit_count: number
          org_id: string
          updated_at?: string
          window_ms: number
        }
        Update: {
          bucket?: string
          created_at?: string
          id?: string
          limit_count?: number
          org_id?: string
          updated_at?: string
          window_ms?: number
        }
        Relationships: [
          {
            foreignKeyName: "rate_limit_overrides_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "orgs"
            referencedColumns: ["id"]
          },
        ]
      }
      rentals: {
        Row: {
          created_at: string
          ends_at: string
          equipment_id: string
          id: string
          notes: string | null
          org_id: string
          project_id: string | null
          rate_cents: number | null
          starts_at: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          ends_at: string
          equipment_id: string
          id?: string
          notes?: string | null
          org_id: string
          project_id?: string | null
          rate_cents?: number | null
          starts_at: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          ends_at?: string
          equipment_id?: string
          id?: string
          notes?: string | null
          org_id?: string
          project_id?: string | null
          rate_cents?: number | null
          starts_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "rentals_equipment_id_fkey"
            columns: ["equipment_id"]
            isOneToOne: false
            referencedRelation: "equipment"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rentals_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "orgs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rentals_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      requisitions: {
        Row: {
          created_at: string
          description: string | null
          estimated_cents: number | null
          id: string
          org_id: string
          project_id: string | null
          requester_id: string
          status: Database["public"]["Enums"]["req_status"]
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          estimated_cents?: number | null
          id?: string
          org_id: string
          project_id?: string | null
          requester_id: string
          status?: Database["public"]["Enums"]["req_status"]
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          estimated_cents?: number | null
          id?: string
          org_id?: string
          project_id?: string | null
          requester_id?: string
          status?: Database["public"]["Enums"]["req_status"]
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "requisitions_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "orgs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "requisitions_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "requisitions_requester_id_fkey"
            columns: ["requester_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      stripe_events: {
        Row: {
          event_id: string
          livemode: boolean
          received_at: string
          type: string
        }
        Insert: {
          event_id: string
          livemode?: boolean
          received_at?: string
          type: string
        }
        Update: {
          event_id?: string
          livemode?: boolean
          received_at?: string
          type?: string
        }
        Relationships: []
      }
      tasks: {
        Row: {
          assigned_to: string | null
          created_at: string
          created_by: string | null
          description: string | null
          due_at: string | null
          id: string
          org_id: string
          priority: number
          project_id: string | null
          status: Database["public"]["Enums"]["task_status"]
          title: string
          updated_at: string
        }
        Insert: {
          assigned_to?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          due_at?: string | null
          id?: string
          org_id: string
          priority?: number
          project_id?: string | null
          status?: Database["public"]["Enums"]["task_status"]
          title: string
          updated_at?: string
        }
        Update: {
          assigned_to?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          due_at?: string | null
          id?: string
          org_id?: string
          priority?: number
          project_id?: string | null
          status?: Database["public"]["Enums"]["task_status"]
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "tasks_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "orgs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      ticket_scans: {
        Row: {
          id: string
          location: Json | null
          result: string
          scanned_at: string
          scanner_id: string
          ticket_id: string
        }
        Insert: {
          id?: string
          location?: Json | null
          result: string
          scanned_at?: string
          scanner_id: string
          ticket_id: string
        }
        Update: {
          id?: string
          location?: Json | null
          result?: string
          scanned_at?: string
          scanner_id?: string
          ticket_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ticket_scans_scanner_id_fkey"
            columns: ["scanner_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ticket_scans_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "tickets"
            referencedColumns: ["id"]
          },
        ]
      }
      tickets: {
        Row: {
          code: string
          holder_email: string | null
          holder_name: string | null
          id: string
          issued_at: string
          org_id: string
          project_id: string
          scanned_at: string | null
          scanned_by: string | null
          status: Database["public"]["Enums"]["ticket_status"]
          tier: string
          updated_at: string
        }
        Insert: {
          code: string
          holder_email?: string | null
          holder_name?: string | null
          id?: string
          issued_at?: string
          org_id: string
          project_id: string
          scanned_at?: string | null
          scanned_by?: string | null
          status?: Database["public"]["Enums"]["ticket_status"]
          tier?: string
          updated_at?: string
        }
        Update: {
          code?: string
          holder_email?: string | null
          holder_name?: string | null
          id?: string
          issued_at?: string
          org_id?: string
          project_id?: string
          scanned_at?: string | null
          scanned_by?: string | null
          status?: Database["public"]["Enums"]["ticket_status"]
          tier?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "tickets_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "orgs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tickets_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tickets_scanned_by_fkey"
            columns: ["scanned_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      time_entries: {
        Row: {
          billable: boolean
          created_at: string
          description: string | null
          duration_minutes: number | null
          ended_at: string | null
          id: string
          org_id: string
          project_id: string | null
          started_at: string
          updated_at: string
          user_id: string
        }
        Insert: {
          billable?: boolean
          created_at?: string
          description?: string | null
          duration_minutes?: number | null
          ended_at?: string | null
          id?: string
          org_id: string
          project_id?: string | null
          started_at: string
          updated_at?: string
          user_id: string
        }
        Update: {
          billable?: boolean
          created_at?: string
          description?: string | null
          duration_minutes?: number | null
          ended_at?: string | null
          id?: string
          org_id?: string
          project_id?: string | null
          started_at?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "time_entries_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "orgs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "time_entries_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "time_entries_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      user_passkeys: {
        Row: {
          counter: number
          created_at: string
          credential_id: string
          device_name: string | null
          id: string
          last_used_at: string | null
          public_key: string
          transports: string[] | null
          updated_at: string
          user_id: string
        }
        Insert: {
          counter?: number
          created_at?: string
          credential_id: string
          device_name?: string | null
          id?: string
          last_used_at?: string | null
          public_key: string
          transports?: string[] | null
          updated_at?: string
          user_id: string
        }
        Update: {
          counter?: number
          created_at?: string
          credential_id?: string
          device_name?: string | null
          id?: string
          last_used_at?: string | null
          public_key?: string
          transports?: string[] | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_passkeys_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      user_preferences: {
        Row: {
          consent: Json
          density: string | null
          last_org_id: string | null
          locale: string | null
          table_views: Json
          theme: string | null
          timezone: string | null
          ui_state: Json
          updated_at: string
          user_id: string
        }
        Insert: {
          consent?: Json
          density?: string | null
          last_org_id?: string | null
          locale?: string | null
          table_views?: Json
          theme?: string | null
          timezone?: string | null
          ui_state?: Json
          updated_at?: string
          user_id: string
        }
        Update: {
          consent?: Json
          density?: string | null
          last_org_id?: string | null
          locale?: string | null
          table_views?: Json
          theme?: string | null
          timezone?: string | null
          ui_state?: Json
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_preferences_last_org_id_fkey"
            columns: ["last_org_id"]
            isOneToOne: false
            referencedRelation: "orgs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_preferences_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      users: {
        Row: {
          avatar_url: string | null
          created_at: string
          deleted_at: string | null
          email: string
          id: string
          name: string | null
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          deleted_at?: string | null
          email: string
          id: string
          name?: string | null
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          deleted_at?: string | null
          email?: string
          id?: string
          name?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      vendors: {
        Row: {
          category: string | null
          coi_expires_at: string | null
          contact_email: string | null
          contact_phone: string | null
          created_at: string
          deleted_at: string | null
          id: string
          name: string
          notes: string | null
          org_id: string
          payout_account_id: string | null
          updated_at: string
          w9_on_file: boolean
        }
        Insert: {
          category?: string | null
          coi_expires_at?: string | null
          contact_email?: string | null
          contact_phone?: string | null
          created_at?: string
          deleted_at?: string | null
          id?: string
          name: string
          notes?: string | null
          org_id: string
          payout_account_id?: string | null
          updated_at?: string
          w9_on_file?: boolean
        }
        Update: {
          category?: string | null
          coi_expires_at?: string | null
          contact_email?: string | null
          contact_phone?: string | null
          created_at?: string
          deleted_at?: string | null
          id?: string
          name?: string
          notes?: string | null
          org_id?: string
          payout_account_id?: string | null
          updated_at?: string
          w9_on_file?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "vendors_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "orgs"
            referencedColumns: ["id"]
          },
        ]
      }
      webauthn_challenges: {
        Row: {
          challenge: string
          consumed: boolean
          created_at: string
          email: string | null
          expires_at: string
          id: string
          type: string
          user_id: string | null
        }
        Insert: {
          challenge: string
          consumed?: boolean
          created_at?: string
          email?: string | null
          expires_at?: string
          id?: string
          type: string
          user_id?: string | null
        }
        Update: {
          challenge?: string
          consumed?: boolean
          created_at?: string
          email?: string | null
          expires_at?: string
          id?: string
          type?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "webauthn_challenges_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      auth_org_ids: { Args: never; Returns: string[] }
      auth_user_email: { Args: never; Returns: string }
      current_request_id: { Args: never; Returns: string }
      has_org_role: {
        Args: { required: string[]; target_org: string }
        Returns: boolean
      }
      is_org_member: { Args: { target_org: string }; Returns: boolean }
      proposal_org_id: { Args: { p_id: string }; Returns: string }
    }
    Enums: {
      deliverable_status:
        | "draft"
        | "submitted"
        | "in_review"
        | "approved"
        | "rejected"
        | "revision_requested"
      deliverable_type:
        | "technical_rider"
        | "hospitality_rider"
        | "input_list"
        | "stage_plot"
        | "crew_list"
        | "guest_list"
        | "equipment_pull_list"
        | "power_plan"
        | "rigging_plan"
        | "site_plan"
        | "build_schedule"
        | "vendor_package"
        | "safety_compliance"
        | "comms_plan"
        | "signage_grid"
        | "custom"
      equipment_status:
        | "available"
        | "reserved"
        | "in_use"
        | "maintenance"
        | "retired"
      event_status: "draft" | "scheduled" | "live" | "complete" | "cancelled"
      expense_status: "pending" | "approved" | "rejected" | "reimbursed"
      guide_persona:
        | "artist"
        | "vendor"
        | "client"
        | "sponsor"
        | "guest"
        | "crew"
        | "staff"
        | "custom"
      invoice_status: "draft" | "sent" | "paid" | "overdue" | "voided"
      lead_stage:
        | "new"
        | "qualified"
        | "contacted"
        | "proposal"
        | "won"
        | "lost"
      platform_role:
        | "developer"
        | "owner"
        | "admin"
        | "controller"
        | "collaborator"
        | "contractor"
        | "crew"
        | "client"
        | "viewer"
        | "community"
      po_status: "draft" | "sent" | "acknowledged" | "fulfilled" | "cancelled"
      project_role: "creator" | "collaborator" | "viewer" | "vendor"
      project_status: "draft" | "active" | "paused" | "archived" | "complete"
      proposal_status:
        | "draft"
        | "sent"
        | "approved"
        | "rejected"
        | "expired"
        | "signed"
      req_status: "draft" | "submitted" | "approved" | "rejected" | "converted"
      task_status: "todo" | "in_progress" | "blocked" | "review" | "done"
      ticket_status: "issued" | "transferred" | "scanned" | "voided"
      tier: "portal" | "starter" | "professional" | "enterprise"
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
      deliverable_status: [
        "draft",
        "submitted",
        "in_review",
        "approved",
        "rejected",
        "revision_requested",
      ],
      deliverable_type: [
        "technical_rider",
        "hospitality_rider",
        "input_list",
        "stage_plot",
        "crew_list",
        "guest_list",
        "equipment_pull_list",
        "power_plan",
        "rigging_plan",
        "site_plan",
        "build_schedule",
        "vendor_package",
        "safety_compliance",
        "comms_plan",
        "signage_grid",
        "custom",
      ],
      equipment_status: [
        "available",
        "reserved",
        "in_use",
        "maintenance",
        "retired",
      ],
      event_status: ["draft", "scheduled", "live", "complete", "cancelled"],
      expense_status: ["pending", "approved", "rejected", "reimbursed"],
      guide_persona: [
        "artist",
        "vendor",
        "client",
        "sponsor",
        "guest",
        "crew",
        "staff",
        "custom",
      ],
      invoice_status: ["draft", "sent", "paid", "overdue", "voided"],
      lead_stage: ["new", "qualified", "contacted", "proposal", "won", "lost"],
      platform_role: [
        "developer",
        "owner",
        "admin",
        "controller",
        "collaborator",
        "contractor",
        "crew",
        "client",
        "viewer",
        "community",
      ],
      po_status: ["draft", "sent", "acknowledged", "fulfilled", "cancelled"],
      project_role: ["creator", "collaborator", "viewer", "vendor"],
      project_status: ["draft", "active", "paused", "archived", "complete"],
      proposal_status: [
        "draft",
        "sent",
        "approved",
        "rejected",
        "expired",
        "signed",
      ],
      req_status: ["draft", "submitted", "approved", "rejected", "converted"],
      task_status: ["todo", "in_progress", "blocked", "review", "done"],
      ticket_status: ["issued", "transferred", "scanned", "voided"],
      tier: ["portal", "starter", "professional", "enterprise"],
    },
  },
} as const
