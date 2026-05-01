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
      access_scans: {
        Row: {
          accreditation_id: string | null
          device_id: string | null
          gate_code: string | null
          id: string
          org_id: string
          reason: string | null
          result: string
          scanned_at: string
          scanned_by: string | null
          venue_id: string | null
          zone_id: string | null
        }
        Insert: {
          accreditation_id?: string | null
          device_id?: string | null
          gate_code?: string | null
          id?: string
          org_id: string
          reason?: string | null
          result: string
          scanned_at?: string
          scanned_by?: string | null
          venue_id?: string | null
          zone_id?: string | null
        }
        Update: {
          accreditation_id?: string | null
          device_id?: string | null
          gate_code?: string | null
          id?: string
          org_id?: string
          reason?: string | null
          result?: string
          scanned_at?: string
          scanned_by?: string | null
          venue_id?: string | null
          zone_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "access_scans_accreditation_id_fkey"
            columns: ["accreditation_id"]
            isOneToOne: false
            referencedRelation: "accreditations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "access_scans_venue_id_fkey"
            columns: ["venue_id"]
            isOneToOne: false
            referencedRelation: "venues"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "access_scans_zone_id_fkey"
            columns: ["zone_id"]
            isOneToOne: false
            referencedRelation: "venue_zones"
            referencedColumns: ["id"]
          },
        ]
      }
      accommodation_blocks: {
        Row: {
          city: string | null
          contract_path: string | null
          created_at: string
          ends_on: string | null
          id: string
          name: string
          org_id: string
          property: string
          rooms_confirmed: number
          rooms_reserved: number
          stakeholder_group: string | null
          starts_on: string | null
        }
        Insert: {
          city?: string | null
          contract_path?: string | null
          created_at?: string
          ends_on?: string | null
          id?: string
          name: string
          org_id: string
          property: string
          rooms_confirmed?: number
          rooms_reserved?: number
          stakeholder_group?: string | null
          starts_on?: string | null
        }
        Update: {
          city?: string | null
          contract_path?: string | null
          created_at?: string
          ends_on?: string | null
          id?: string
          name?: string
          org_id?: string
          property?: string
          rooms_confirmed?: number
          rooms_reserved?: number
          stakeholder_group?: string | null
          starts_on?: string | null
        }
        Relationships: []
      }
      accreditation_categories: {
        Row: {
          code: string
          color: string | null
          created_at: string
          description: string | null
          id: string
          name: string
          org_id: string
          zone_privileges: Json
        }
        Insert: {
          code: string
          color?: string | null
          created_at?: string
          description?: string | null
          id?: string
          name: string
          org_id: string
          zone_privileges?: Json
        }
        Update: {
          code?: string
          color?: string | null
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          org_id?: string
          zone_privileges?: Json
        }
        Relationships: []
      }
      accreditation_changes: {
        Row: {
          accreditation_id: string
          created_at: string
          decided_at: string | null
          decided_by: string | null
          id: string
          kind: string
          note: string | null
          org_id: string
          requested_by: string | null
          status: string
        }
        Insert: {
          accreditation_id: string
          created_at?: string
          decided_at?: string | null
          decided_by?: string | null
          id?: string
          kind: string
          note?: string | null
          org_id: string
          requested_by?: string | null
          status?: string
        }
        Update: {
          accreditation_id?: string
          created_at?: string
          decided_at?: string | null
          decided_by?: string | null
          id?: string
          kind?: string
          note?: string | null
          org_id?: string
          requested_by?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "accreditation_changes_accreditation_id_fkey"
            columns: ["accreditation_id"]
            isOneToOne: false
            referencedRelation: "accreditations"
            referencedColumns: ["id"]
          },
        ]
      }
      accreditations: {
        Row: {
          card_barcode: string | null
          category_id: string | null
          created_at: string
          delegation_id: string | null
          id: string
          issued_at: string | null
          metadata: Json
          org_id: string
          person_email: string | null
          person_name: string
          photo_path: string | null
          revoke_reason: string | null
          revoked_at: string | null
          state: Database["public"]["Enums"]["accreditation_state"]
          updated_at: string
          user_id: string | null
          valid_from: string | null
          valid_to: string | null
          vetting: Database["public"]["Enums"]["vetting_state"]
        }
        Insert: {
          card_barcode?: string | null
          category_id?: string | null
          created_at?: string
          delegation_id?: string | null
          id?: string
          issued_at?: string | null
          metadata?: Json
          org_id: string
          person_email?: string | null
          person_name: string
          photo_path?: string | null
          revoke_reason?: string | null
          revoked_at?: string | null
          state?: Database["public"]["Enums"]["accreditation_state"]
          updated_at?: string
          user_id?: string | null
          valid_from?: string | null
          valid_to?: string | null
          vetting?: Database["public"]["Enums"]["vetting_state"]
        }
        Update: {
          card_barcode?: string | null
          category_id?: string | null
          created_at?: string
          delegation_id?: string | null
          id?: string
          issued_at?: string | null
          metadata?: Json
          org_id?: string
          person_email?: string | null
          person_name?: string
          photo_path?: string | null
          revoke_reason?: string | null
          revoked_at?: string | null
          state?: Database["public"]["Enums"]["accreditation_state"]
          updated_at?: string
          user_id?: string | null
          valid_from?: string | null
          valid_to?: string | null
          vetting?: Database["public"]["Enums"]["vetting_state"]
        }
        Relationships: [
          {
            foreignKeyName: "accreditations_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "accreditation_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      ad_manifests: {
        Row: {
          actual_at: string | null
          carrier: string | null
          created_at: string
          delegation_id: string | null
          flight_ref: string | null
          id: string
          kind: string
          notes: string | null
          org_id: string
          party_size: number
          scheduled_at: string | null
          status: string
        }
        Insert: {
          actual_at?: string | null
          carrier?: string | null
          created_at?: string
          delegation_id?: string | null
          flight_ref?: string | null
          id?: string
          kind?: string
          notes?: string | null
          org_id: string
          party_size?: number
          scheduled_at?: string | null
          status?: string
        }
        Update: {
          actual_at?: string | null
          carrier?: string | null
          created_at?: string
          delegation_id?: string | null
          flight_ref?: string | null
          id?: string
          kind?: string
          notes?: string | null
          org_id?: string
          party_size?: number
          scheduled_at?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "ad_manifests_delegation_id_fkey"
            columns: ["delegation_id"]
            isOneToOne: false
            referencedRelation: "delegations"
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
      api_keys: {
        Row: {
          created_at: string
          created_by: string | null
          expires_at: string | null
          hashed_secret: string
          id: string
          last_used_at: string | null
          name: string
          org_id: string
          prefix: string
          revoked_at: string | null
          scopes: string[]
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          expires_at?: string | null
          hashed_secret: string
          id?: string
          last_used_at?: string | null
          name: string
          org_id: string
          prefix: string
          revoked_at?: string | null
          scopes?: string[]
        }
        Update: {
          created_at?: string
          created_by?: string | null
          expires_at?: string | null
          hashed_secret?: string
          id?: string
          last_used_at?: string | null
          name?: string
          org_id?: string
          prefix?: string
          revoked_at?: string | null
          scopes?: string[]
        }
        Relationships: [
          {
            foreignKeyName: "api_keys_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "orgs"
            referencedColumns: ["id"]
          },
        ]
      }
      asset_links: {
        Row: {
          asset_kind: string
          asset_serial: string
          credential_id: string
          id: string
          issued_at: string
          org_id: string
          revoked_at: string | null
        }
        Insert: {
          asset_kind: string
          asset_serial: string
          credential_id: string
          id?: string
          issued_at?: string
          org_id: string
          revoked_at?: string | null
        }
        Update: {
          asset_kind?: string
          asset_serial?: string
          credential_id?: string
          id?: string
          issued_at?: string
          org_id?: string
          revoked_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "asset_links_credential_id_fkey"
            columns: ["credential_id"]
            isOneToOne: false
            referencedRelation: "credentials"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "asset_links_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "orgs"
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
      automations: {
        Row: {
          created_at: string
          created_by: string | null
          description: string | null
          enabled: boolean
          id: string
          last_run_at: string | null
          last_run_status: string | null
          name: string
          org_id: string
          steps: Json
          trigger_config: Json
          trigger_kind: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          enabled?: boolean
          id?: string
          last_run_at?: string | null
          last_run_status?: string | null
          name: string
          org_id: string
          steps?: Json
          trigger_config?: Json
          trigger_kind?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          enabled?: boolean
          id?: string
          last_run_at?: string | null
          last_run_status?: string | null
          name?: string
          org_id?: string
          steps?: Json
          trigger_config?: Json
          trigger_kind?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "automations_org_id_fkey"
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
          code: string | null
          committed_cents: number
          created_at: string
          eac_cents: number
          forecast_cents: number
          id: string
          name: string
          notes: string | null
          org_id: string
          project_id: string | null
          spent_cents: number
          updated_at: string
        }
        Insert: {
          amount_cents?: number
          category?: string | null
          code?: string | null
          committed_cents?: number
          created_at?: string
          eac_cents?: number
          forecast_cents?: number
          id?: string
          name: string
          notes?: string | null
          org_id: string
          project_id?: string | null
          spent_cents?: number
          updated_at?: string
        }
        Update: {
          amount_cents?: number
          category?: string | null
          code?: string | null
          committed_cents?: number
          created_at?: string
          eac_cents?: number
          forecast_cents?: number
          id?: string
          name?: string
          notes?: string | null
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
      campaigns: {
        Row: {
          budget_cents: number
          channel: string
          created_at: string
          description: string | null
          ends_on: string | null
          id: string
          kind: string
          metadata: Json
          name: string
          org_id: string
          owner_id: string | null
          spent_cents: number
          starts_on: string | null
          status: string
          updated_at: string
        }
        Insert: {
          budget_cents?: number
          channel?: string
          created_at?: string
          description?: string | null
          ends_on?: string | null
          id?: string
          kind?: string
          metadata?: Json
          name: string
          org_id: string
          owner_id?: string | null
          spent_cents?: number
          starts_on?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          budget_cents?: number
          channel?: string
          created_at?: string
          description?: string | null
          ends_on?: string | null
          id?: string
          kind?: string
          metadata?: Json
          name?: string
          org_id?: string
          owner_id?: string | null
          spent_cents?: number
          starts_on?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "campaigns_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "orgs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "campaigns_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      case_studies: {
        Row: {
          challenge: string | null
          created_at: string
          customer_name: string
          format: string | null
          hero_image_path: string | null
          id: string
          industry: string | null
          metrics: Json
          org_id: string
          outcomes: string | null
          published_at: string | null
          quote_author: string | null
          quote_role: string | null
          quote_text: string | null
          region: string | null
          slug: string
          solution: string | null
          updated_at: string
        }
        Insert: {
          challenge?: string | null
          created_at?: string
          customer_name: string
          format?: string | null
          hero_image_path?: string | null
          id?: string
          industry?: string | null
          metrics?: Json
          org_id: string
          outcomes?: string | null
          published_at?: string | null
          quote_author?: string | null
          quote_role?: string | null
          quote_text?: string | null
          region?: string | null
          slug: string
          solution?: string | null
          updated_at?: string
        }
        Update: {
          challenge?: string | null
          created_at?: string
          customer_name?: string
          format?: string | null
          hero_image_path?: string | null
          id?: string
          industry?: string | null
          metrics?: Json
          org_id?: string
          outcomes?: string | null
          published_at?: string | null
          quote_author?: string | null
          quote_role?: string | null
          quote_text?: string | null
          region?: string | null
          slug?: string
          solution?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "case_studies_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "orgs"
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
      consent_records: {
        Row: {
          granted: boolean
          granted_at: string | null
          id: string
          org_id: string
          purpose: string
          revoked_at: string | null
          user_id: string | null
          version: string | null
        }
        Insert: {
          granted?: boolean
          granted_at?: string | null
          id?: string
          org_id: string
          purpose: string
          revoked_at?: string | null
          user_id?: string | null
          version?: string | null
        }
        Update: {
          granted?: boolean
          granted_at?: string | null
          id?: string
          org_id?: string
          purpose?: string
          revoked_at?: string | null
          user_id?: string | null
          version?: string | null
        }
        Relationships: []
      }
      conversation_messages: {
        Row: {
          attachments: Json
          author_id: string | null
          body: string
          conversation_id: string
          created_at: string
          id: string
          org_id: string
        }
        Insert: {
          attachments?: Json
          author_id?: string | null
          body: string
          conversation_id: string
          created_at?: string
          id?: string
          org_id: string
        }
        Update: {
          attachments?: Json
          author_id?: string | null
          body?: string
          conversation_id?: string
          created_at?: string
          id?: string
          org_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "conversation_messages_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conversation_messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conversation_messages_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "orgs"
            referencedColumns: ["id"]
          },
        ]
      }
      conversations: {
        Row: {
          created_at: string
          id: string
          org_id: string
          record_id: string
          record_type: string
        }
        Insert: {
          created_at?: string
          id?: string
          org_id: string
          record_id: string
          record_type: string
        }
        Update: {
          created_at?: string
          id?: string
          org_id?: string
          record_id?: string
          record_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "conversations_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "orgs"
            referencedColumns: ["id"]
          },
        ]
      }
      cost_codes: {
        Row: {
          active: boolean
          code: string
          created_at: string
          description: string | null
          id: string
          name: string
          org_id: string
        }
        Insert: {
          active?: boolean
          code: string
          created_at?: string
          description?: string | null
          id?: string
          name: string
          org_id: string
        }
        Update: {
          active?: boolean
          code?: string
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          org_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "cost_codes_org_id_fkey"
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
      crisis_alert_receipts: {
        Row: {
          acknowledged_at: string | null
          alert_id: string
          channel: string | null
          delivered_at: string | null
          id: string
          org_id: string
          user_id: string
        }
        Insert: {
          acknowledged_at?: string | null
          alert_id: string
          channel?: string | null
          delivered_at?: string | null
          id?: string
          org_id: string
          user_id: string
        }
        Update: {
          acknowledged_at?: string | null
          alert_id?: string
          channel?: string | null
          delivered_at?: string | null
          id?: string
          org_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "crisis_alert_receipts_alert_id_fkey"
            columns: ["alert_id"]
            isOneToOne: false
            referencedRelation: "crisis_alerts"
            referencedColumns: ["id"]
          },
        ]
      }
      crisis_alerts: {
        Row: {
          audience: Json
          body: string
          channels: Json
          created_at: string
          created_by: string | null
          id: string
          org_id: string
          scheduled_at: string | null
          sent_at: string | null
          severity: string
          title: string
        }
        Insert: {
          audience?: Json
          body: string
          channels?: Json
          created_at?: string
          created_by?: string | null
          id?: string
          org_id: string
          scheduled_at?: string | null
          sent_at?: string | null
          severity?: string
          title: string
        }
        Update: {
          audience?: Json
          body?: string
          channels?: Json
          created_at?: string
          created_by?: string | null
          id?: string
          org_id?: string
          scheduled_at?: string | null
          sent_at?: string | null
          severity?: string
          title?: string
        }
        Relationships: []
      }
      cues: {
        Row: {
          created_at: string
          created_by: string | null
          description: string | null
          duration_seconds: number | null
          event_id: string | null
          id: string
          label: string
          lane: string
          org_id: string
          owner_id: string | null
          scheduled_at: string
          status: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          duration_seconds?: number | null
          event_id?: string | null
          id?: string
          label: string
          lane?: string
          org_id: string
          owner_id?: string | null
          scheduled_at: string
          status?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          duration_seconds?: number | null
          event_id?: string | null
          id?: string
          label?: string
          lane?: string
          org_id?: string
          owner_id?: string | null
          scheduled_at?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "cues_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cues_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "orgs"
            referencedColumns: ["id"]
          },
        ]
      }
      daily_log_deliveries: {
        Row: {
          arrived_at: string | null
          created_at: string
          daily_log_id: string
          description: string
          id: string
          notes: string | null
          org_id: string
          received_by: string | null
          vendor_id: string | null
        }
        Insert: {
          arrived_at?: string | null
          created_at?: string
          daily_log_id: string
          description: string
          id?: string
          notes?: string | null
          org_id: string
          received_by?: string | null
          vendor_id?: string | null
        }
        Update: {
          arrived_at?: string | null
          created_at?: string
          daily_log_id?: string
          description?: string
          id?: string
          notes?: string | null
          org_id?: string
          received_by?: string | null
          vendor_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "daily_log_deliveries_daily_log_id_fkey"
            columns: ["daily_log_id"]
            isOneToOne: false
            referencedRelation: "daily_logs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "daily_log_deliveries_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "orgs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "daily_log_deliveries_received_by_fkey"
            columns: ["received_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "daily_log_deliveries_vendor_id_fkey"
            columns: ["vendor_id"]
            isOneToOne: false
            referencedRelation: "vendors"
            referencedColumns: ["id"]
          },
        ]
      }
      daily_log_equipment: {
        Row: {
          created_at: string
          daily_log_id: string
          description: string | null
          equipment_id: string | null
          hours_idle: number
          hours_used: number
          id: string
          notes: string | null
          org_id: string
        }
        Insert: {
          created_at?: string
          daily_log_id: string
          description?: string | null
          equipment_id?: string | null
          hours_idle?: number
          hours_used?: number
          id?: string
          notes?: string | null
          org_id: string
        }
        Update: {
          created_at?: string
          daily_log_id?: string
          description?: string | null
          equipment_id?: string | null
          hours_idle?: number
          hours_used?: number
          id?: string
          notes?: string | null
          org_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "daily_log_equipment_daily_log_id_fkey"
            columns: ["daily_log_id"]
            isOneToOne: false
            referencedRelation: "daily_logs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "daily_log_equipment_equipment_id_fkey"
            columns: ["equipment_id"]
            isOneToOne: false
            referencedRelation: "equipment"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "daily_log_equipment_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "orgs"
            referencedColumns: ["id"]
          },
        ]
      }
      daily_log_manpower: {
        Row: {
          created_at: string
          daily_log_id: string
          headcount: number
          hours_worked: number
          id: string
          notes: string | null
          org_id: string
          trade: string
          vendor_id: string | null
        }
        Insert: {
          created_at?: string
          daily_log_id: string
          headcount: number
          hours_worked?: number
          id?: string
          notes?: string | null
          org_id: string
          trade: string
          vendor_id?: string | null
        }
        Update: {
          created_at?: string
          daily_log_id?: string
          headcount?: number
          hours_worked?: number
          id?: string
          notes?: string | null
          org_id?: string
          trade?: string
          vendor_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "daily_log_manpower_daily_log_id_fkey"
            columns: ["daily_log_id"]
            isOneToOne: false
            referencedRelation: "daily_logs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "daily_log_manpower_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "orgs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "daily_log_manpower_vendor_id_fkey"
            columns: ["vendor_id"]
            isOneToOne: false
            referencedRelation: "vendors"
            referencedColumns: ["id"]
          },
        ]
      }
      daily_log_photos: {
        Row: {
          caption: string | null
          created_at: string
          daily_log_id: string
          file_path: string
          id: string
          org_id: string
          taken_at: string
          taken_by: string | null
        }
        Insert: {
          caption?: string | null
          created_at?: string
          daily_log_id: string
          file_path: string
          id?: string
          org_id: string
          taken_at?: string
          taken_by?: string | null
        }
        Update: {
          caption?: string | null
          created_at?: string
          daily_log_id?: string
          file_path?: string
          id?: string
          org_id?: string
          taken_at?: string
          taken_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "daily_log_photos_daily_log_id_fkey"
            columns: ["daily_log_id"]
            isOneToOne: false
            referencedRelation: "daily_logs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "daily_log_photos_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "orgs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "daily_log_photos_taken_by_fkey"
            columns: ["taken_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      daily_log_visitors: {
        Row: {
          arrived_at: string | null
          created_at: string
          daily_log_id: string
          departed_at: string | null
          id: string
          name: string
          org_id: string
          organization: string | null
          purpose: string | null
        }
        Insert: {
          arrived_at?: string | null
          created_at?: string
          daily_log_id: string
          departed_at?: string | null
          id?: string
          name: string
          org_id: string
          organization?: string | null
          purpose?: string | null
        }
        Update: {
          arrived_at?: string | null
          created_at?: string
          daily_log_id?: string
          departed_at?: string | null
          id?: string
          name?: string
          org_id?: string
          organization?: string | null
          purpose?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "daily_log_visitors_daily_log_id_fkey"
            columns: ["daily_log_id"]
            isOneToOne: false
            referencedRelation: "daily_logs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "daily_log_visitors_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "orgs"
            referencedColumns: ["id"]
          },
        ]
      }
      daily_logs: {
        Row: {
          approved_at: string | null
          approved_by: string | null
          created_at: string
          created_by: string | null
          id: string
          log_date: string
          notes: string | null
          org_id: string
          project_id: string
          status: string
          submitted_at: string | null
          submitted_by: string | null
          weather_precip_in: number | null
          weather_source: string | null
          weather_summary: string | null
          weather_temp_high_f: number | null
          weather_temp_low_f: number | null
          weather_wind_mph: number | null
        }
        Insert: {
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          log_date: string
          notes?: string | null
          org_id: string
          project_id: string
          status?: string
          submitted_at?: string | null
          submitted_by?: string | null
          weather_precip_in?: number | null
          weather_source?: string | null
          weather_summary?: string | null
          weather_temp_high_f?: number | null
          weather_temp_low_f?: number | null
          weather_wind_mph?: number | null
        }
        Update: {
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          log_date?: string
          notes?: string | null
          org_id?: string
          project_id?: string
          status?: string
          submitted_at?: string | null
          submitted_by?: string | null
          weather_precip_in?: number | null
          weather_source?: string | null
          weather_summary?: string | null
          weather_temp_high_f?: number | null
          weather_temp_low_f?: number | null
          weather_wind_mph?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "daily_logs_approved_by_fkey"
            columns: ["approved_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "daily_logs_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "daily_logs_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "orgs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "daily_logs_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "daily_logs_submitted_by_fkey"
            columns: ["submitted_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      delegation_entries: {
        Row: {
          created_at: string
          delegation_id: string
          discipline: string | null
          event: string | null
          id: string
          org_id: string
          participant_name: string
          status: string
        }
        Insert: {
          created_at?: string
          delegation_id: string
          discipline?: string | null
          event?: string | null
          id?: string
          org_id: string
          participant_name: string
          status?: string
        }
        Update: {
          created_at?: string
          delegation_id?: string
          discipline?: string | null
          event?: string | null
          id?: string
          org_id?: string
          participant_name?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "delegation_entries_delegation_id_fkey"
            columns: ["delegation_id"]
            isOneToOne: false
            referencedRelation: "delegations"
            referencedColumns: ["id"]
          },
        ]
      }
      delegations: {
        Row: {
          attache_user_id: string | null
          code: string
          contact_email: string | null
          contact_phone: string | null
          country: string | null
          created_at: string
          id: string
          metadata: Json
          name: string
          org_id: string
          updated_at: string
        }
        Insert: {
          attache_user_id?: string | null
          code: string
          contact_email?: string | null
          contact_phone?: string | null
          country?: string | null
          created_at?: string
          id?: string
          metadata?: Json
          name: string
          org_id: string
          updated_at?: string
        }
        Update: {
          attache_user_id?: string | null
          code?: string
          contact_email?: string | null
          contact_phone?: string | null
          country?: string | null
          created_at?: string
          id?: string
          metadata?: Json
          name?: string
          org_id?: string
          updated_at?: string
        }
        Relationships: []
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
      deliverable_templates: {
        Row: {
          created_at: string
          created_by: string | null
          data: Json
          deleted_at: string | null
          description: string | null
          id: string
          is_global: boolean
          name: string
          org_id: string
          type: Database["public"]["Enums"]["deliverable_type"]
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          data?: Json
          deleted_at?: string | null
          description?: string | null
          id?: string
          is_global?: boolean
          name: string
          org_id: string
          type: Database["public"]["Enums"]["deliverable_type"]
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          data?: Json
          deleted_at?: string | null
          description?: string | null
          id?: string
          is_global?: boolean
          name?: string
          org_id?: string
          type?: Database["public"]["Enums"]["deliverable_type"]
          updated_at?: string
        }
        Relationships: []
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
      dispatch_runs: {
        Row: {
          actual_arrive: string | null
          actual_depart: string | null
          created_at: string
          destination_venue_id: string | null
          driver_id: string | null
          fleet: Database["public"]["Enums"]["dispatch_fleet"]
          id: string
          manifest: Json
          org_id: string
          origin_venue_id: string | null
          scheduled_arrive: string | null
          scheduled_depart: string
          status: string
          vehicle_ref: string | null
        }
        Insert: {
          actual_arrive?: string | null
          actual_depart?: string | null
          created_at?: string
          destination_venue_id?: string | null
          driver_id?: string | null
          fleet?: Database["public"]["Enums"]["dispatch_fleet"]
          id?: string
          manifest?: Json
          org_id: string
          origin_venue_id?: string | null
          scheduled_arrive?: string | null
          scheduled_depart: string
          status?: string
          vehicle_ref?: string | null
        }
        Update: {
          actual_arrive?: string | null
          actual_depart?: string | null
          created_at?: string
          destination_venue_id?: string | null
          driver_id?: string | null
          fleet?: Database["public"]["Enums"]["dispatch_fleet"]
          id?: string
          manifest?: Json
          org_id?: string
          origin_venue_id?: string | null
          scheduled_arrive?: string | null
          scheduled_depart?: string
          status?: string
          vehicle_ref?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "dispatch_runs_destination_venue_id_fkey"
            columns: ["destination_venue_id"]
            isOneToOne: false
            referencedRelation: "venues"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "dispatch_runs_origin_venue_id_fkey"
            columns: ["origin_venue_id"]
            isOneToOne: false
            referencedRelation: "venues"
            referencedColumns: ["id"]
          },
        ]
      }
      dsar_requests: {
        Row: {
          created_at: string
          due_by: string | null
          fulfilled_at: string | null
          id: string
          identity_verified: boolean
          kind: Database["public"]["Enums"]["dsar_kind"]
          notes: string | null
          org_id: string
          payload_path: string | null
          requester_email: string
          requester_user_id: string | null
          status: Database["public"]["Enums"]["dsar_status"]
          updated_at: string
        }
        Insert: {
          created_at?: string
          due_by?: string | null
          fulfilled_at?: string | null
          id?: string
          identity_verified?: boolean
          kind?: Database["public"]["Enums"]["dsar_kind"]
          notes?: string | null
          org_id: string
          payload_path?: string | null
          requester_email: string
          requester_user_id?: string | null
          status?: Database["public"]["Enums"]["dsar_status"]
          updated_at?: string
        }
        Update: {
          created_at?: string
          due_by?: string | null
          fulfilled_at?: string | null
          id?: string
          identity_verified?: boolean
          kind?: Database["public"]["Enums"]["dsar_kind"]
          notes?: string | null
          org_id?: string
          payload_path?: string | null
          requester_email?: string
          requester_user_id?: string | null
          status?: Database["public"]["Enums"]["dsar_status"]
          updated_at?: string
        }
        Relationships: []
      }
      email_templates: {
        Row: {
          body_html: string
          body_text: string | null
          created_at: string
          created_by: string | null
          deleted_at: string | null
          id: string
          is_active: boolean
          merge_tags: Json
          name: string
          org_id: string
          slug: string
          subject: string
          updated_at: string
        }
        Insert: {
          body_html: string
          body_text?: string | null
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          id?: string
          is_active?: boolean
          merge_tags?: Json
          name: string
          org_id: string
          slug: string
          subject: string
          updated_at?: string
        }
        Update: {
          body_html?: string
          body_text?: string | null
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          id?: string
          is_active?: boolean
          merge_tags?: Json
          name?: string
          org_id?: string
          slug?: string
          subject?: string
          updated_at?: string
        }
        Relationships: []
      }
      environmental_events: {
        Row: {
          created_at: string
          ended_at: string | null
          id: string
          kind: string
          org_id: string
          reading: Json
          severity: string
          started_at: string
          venue_id: string | null
        }
        Insert: {
          created_at?: string
          ended_at?: string | null
          id?: string
          kind: string
          org_id: string
          reading?: Json
          severity: string
          started_at?: string
          venue_id?: string | null
        }
        Update: {
          created_at?: string
          ended_at?: string | null
          id?: string
          kind?: string
          org_id?: string
          reading?: Json
          severity?: string
          started_at?: string
          venue_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "environmental_events_venue_id_fkey"
            columns: ["venue_id"]
            isOneToOne: false
            referencedRelation: "venues"
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
      export_runs: {
        Row: {
          completed_at: string | null
          created_at: string
          file_path: string | null
          id: string
          kind: Database["public"]["Enums"]["export_kind"]
          last_error: string | null
          org_id: string
          params: Json
          requested_by: string | null
          row_count: number | null
          size_bytes: number | null
          status: Database["public"]["Enums"]["export_status"]
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          file_path?: string | null
          id?: string
          kind: Database["public"]["Enums"]["export_kind"]
          last_error?: string | null
          org_id: string
          params?: Json
          requested_by?: string | null
          row_count?: number | null
          size_bytes?: number | null
          status?: Database["public"]["Enums"]["export_status"]
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          file_path?: string | null
          id?: string
          kind?: Database["public"]["Enums"]["export_kind"]
          last_error?: string | null
          org_id?: string
          params?: Json
          requested_by?: string | null
          row_count?: number | null
          size_bytes?: number | null
          status?: Database["public"]["Enums"]["export_status"]
        }
        Relationships: []
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
      form_defs: {
        Row: {
          created_at: string
          created_by: string | null
          description: string | null
          id: string
          org_id: string
          schema: Json
          slug: string
          status: string
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          org_id: string
          schema?: Json
          slug: string
          status?: string
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          org_id?: string
          schema?: Json
          slug?: string
          status?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "form_defs_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "orgs"
            referencedColumns: ["id"]
          },
        ]
      }
      governance_committees: {
        Row: {
          cadence: string | null
          chair_user_id: string | null
          charter: string | null
          created_at: string
          id: string
          members: Json
          name: string
          org_id: string
        }
        Insert: {
          cadence?: string | null
          chair_user_id?: string | null
          charter?: string | null
          created_at?: string
          id?: string
          members?: Json
          name: string
          org_id: string
        }
        Update: {
          cadence?: string | null
          chair_user_id?: string | null
          charter?: string | null
          created_at?: string
          id?: string
          members?: Json
          name?: string
          org_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "governance_committees_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "orgs"
            referencedColumns: ["id"]
          },
        ]
      }
      governance_policies: {
        Row: {
          body: string | null
          category: string | null
          created_at: string
          effective_at: string | null
          id: string
          name: string
          next_review_at: string | null
          org_id: string
          owner_user_id: string | null
          reviewed_at: string | null
          status: string
        }
        Insert: {
          body?: string | null
          category?: string | null
          created_at?: string
          effective_at?: string | null
          id?: string
          name: string
          next_review_at?: string | null
          org_id: string
          owner_user_id?: string | null
          reviewed_at?: string | null
          status?: string
        }
        Update: {
          body?: string | null
          category?: string | null
          created_at?: string
          effective_at?: string | null
          id?: string
          name?: string
          next_review_at?: string | null
          org_id?: string
          owner_user_id?: string | null
          reviewed_at?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "governance_policies_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "orgs"
            referencedColumns: ["id"]
          },
        ]
      }
      guard_tours: {
        Row: {
          cadence_minutes: number | null
          completed_at: string | null
          created_at: string
          description: string | null
          guard_id: string | null
          id: string
          name: string
          next_run_at: string | null
          notes: string | null
          org_id: string
          route: Json
          started_at: string | null
          status: string
          updated_at: string
          venue_id: string | null
        }
        Insert: {
          cadence_minutes?: number | null
          completed_at?: string | null
          created_at?: string
          description?: string | null
          guard_id?: string | null
          id?: string
          name: string
          next_run_at?: string | null
          notes?: string | null
          org_id: string
          route?: Json
          started_at?: string | null
          status?: string
          updated_at?: string
          venue_id?: string | null
        }
        Update: {
          cadence_minutes?: number | null
          completed_at?: string | null
          created_at?: string
          description?: string | null
          guard_id?: string | null
          id?: string
          name?: string
          next_run_at?: string | null
          notes?: string | null
          org_id?: string
          route?: Json
          started_at?: string | null
          status?: string
          updated_at?: string
          venue_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "guard_tours_guard_id_fkey"
            columns: ["guard_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "guard_tours_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "orgs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "guard_tours_venue_id_fkey"
            columns: ["venue_id"]
            isOneToOne: false
            referencedRelation: "venues"
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
      import_runs: {
        Row: {
          created_at: string
          created_by: string | null
          error: string | null
          filename: string | null
          finished_at: string | null
          id: string
          kind: string
          log: Json | null
          org_id: string
          rows_failed: number
          rows_imported: number
          rows_total: number
          source: string
          started_at: string | null
          status: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          error?: string | null
          filename?: string | null
          finished_at?: string | null
          id?: string
          kind: string
          log?: Json | null
          org_id: string
          rows_failed?: number
          rows_imported?: number
          rows_total?: number
          source?: string
          started_at?: string | null
          status?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          error?: string | null
          filename?: string | null
          finished_at?: string | null
          id?: string
          kind?: string
          log?: Json | null
          org_id?: string
          rows_failed?: number
          rows_imported?: number
          rows_total?: number
          source?: string
          started_at?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "import_runs_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "orgs"
            referencedColumns: ["id"]
          },
        ]
      }
      incidents: {
        Row: {
          ai_summary: string | null
          body_part: string | null
          created_at: string
          days_away: number
          days_restricted: number
          description: string | null
          id: string
          injury_source: string | null
          injury_type: string | null
          location: string | null
          occurred_at: string
          org_id: string
          osha_classification: string | null
          osha_recordable: boolean
          photos: Json
          project_id: string | null
          reporter_id: string
          severity: Database["public"]["Enums"]["incident_severity"]
          status: Database["public"]["Enums"]["incident_status"]
          summary: string
          updated_at: string
        }
        Insert: {
          ai_summary?: string | null
          body_part?: string | null
          created_at?: string
          days_away?: number
          days_restricted?: number
          description?: string | null
          id?: string
          injury_source?: string | null
          injury_type?: string | null
          location?: string | null
          occurred_at?: string
          org_id: string
          osha_classification?: string | null
          osha_recordable?: boolean
          photos?: Json
          project_id?: string | null
          reporter_id: string
          severity?: Database["public"]["Enums"]["incident_severity"]
          status?: Database["public"]["Enums"]["incident_status"]
          summary: string
          updated_at?: string
        }
        Update: {
          ai_summary?: string | null
          body_part?: string | null
          created_at?: string
          days_away?: number
          days_restricted?: number
          description?: string | null
          id?: string
          injury_source?: string | null
          injury_type?: string | null
          location?: string | null
          occurred_at?: string
          org_id?: string
          osha_classification?: string | null
          osha_recordable?: boolean
          photos?: Json
          project_id?: string | null
          reporter_id?: string
          severity?: Database["public"]["Enums"]["incident_severity"]
          status?: Database["public"]["Enums"]["incident_status"]
          summary?: string
          updated_at?: string
        }
        Relationships: []
      }
      inspection_items: {
        Row: {
          created_at: string
          id: string
          inspection_id: string
          notes: string | null
          org_id: string
          photo_path: string | null
          position: number
          prompt: string
          result: string
          template_item_id: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          inspection_id: string
          notes?: string | null
          org_id: string
          photo_path?: string | null
          position?: number
          prompt: string
          result?: string
          template_item_id?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          inspection_id?: string
          notes?: string | null
          org_id?: string
          photo_path?: string | null
          position?: number
          prompt?: string
          result?: string
          template_item_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "inspection_items_inspection_id_fkey"
            columns: ["inspection_id"]
            isOneToOne: false
            referencedRelation: "inspections"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inspection_items_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "orgs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inspection_items_template_item_id_fkey"
            columns: ["template_item_id"]
            isOneToOne: false
            referencedRelation: "inspection_template_items"
            referencedColumns: ["id"]
          },
        ]
      }
      inspection_template_items: {
        Row: {
          created_at: string
          id: string
          org_id: string
          position: number
          prompt: string
          requires_note_on_fail: boolean
          requires_photo: boolean
          template_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          org_id: string
          position?: number
          prompt: string
          requires_note_on_fail?: boolean
          requires_photo?: boolean
          template_id: string
        }
        Update: {
          created_at?: string
          id?: string
          org_id?: string
          position?: number
          prompt?: string
          requires_note_on_fail?: boolean
          requires_photo?: boolean
          template_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "inspection_template_items_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "orgs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inspection_template_items_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "inspection_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      inspection_templates: {
        Row: {
          active: boolean
          category: string
          code: string
          created_at: string
          created_by: string | null
          description: string | null
          id: string
          name: string
          org_id: string
        }
        Insert: {
          active?: boolean
          category?: string
          code: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          name: string
          org_id: string
        }
        Update: {
          active?: boolean
          category?: string
          code?: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          name?: string
          org_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "inspection_templates_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inspection_templates_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "orgs"
            referencedColumns: ["id"]
          },
        ]
      }
      inspections: {
        Row: {
          category: string | null
          code: string
          completed_at: string | null
          created_at: string
          created_by: string | null
          id: string
          inspector_id: string | null
          name: string
          notes: string | null
          org_id: string
          project_id: string | null
          scheduled_for: string | null
          signature_path: string | null
          signed_at: string | null
          signed_by: string | null
          started_at: string | null
          status: string
          template_id: string | null
        }
        Insert: {
          category?: string | null
          code: string
          completed_at?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          inspector_id?: string | null
          name: string
          notes?: string | null
          org_id: string
          project_id?: string | null
          scheduled_for?: string | null
          signature_path?: string | null
          signed_at?: string | null
          signed_by?: string | null
          started_at?: string | null
          status?: string
          template_id?: string | null
        }
        Update: {
          category?: string | null
          code?: string
          completed_at?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          inspector_id?: string | null
          name?: string
          notes?: string | null
          org_id?: string
          project_id?: string | null
          scheduled_for?: string | null
          signature_path?: string | null
          signed_at?: string | null
          signed_by?: string | null
          started_at?: string | null
          status?: string
          template_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "inspections_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inspections_inspector_id_fkey"
            columns: ["inspector_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inspections_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "orgs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inspections_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inspections_signed_by_fkey"
            columns: ["signed_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inspections_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "inspection_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      insurance_policies: {
        Row: {
          carrier: string
          created_at: string
          document_path: string | null
          effective_on: string | null
          expires_on: string | null
          id: string
          kind: string
          limits: Json
          org_id: string
          policy_no: string
        }
        Insert: {
          carrier: string
          created_at?: string
          document_path?: string | null
          effective_on?: string | null
          expires_on?: string | null
          id?: string
          kind: string
          limits?: Json
          org_id: string
          policy_no: string
        }
        Update: {
          carrier?: string
          created_at?: string
          document_path?: string | null
          effective_on?: string | null
          expires_on?: string | null
          id?: string
          kind?: string
          limits?: Json
          org_id?: string
          policy_no?: string
        }
        Relationships: []
      }
      integration_connectors: {
        Row: {
          config: Json
          created_at: string
          enabled: boolean
          id: string
          kind: string
          name: string
          org_id: string
          secret_ref: string | null
          slug: string
          updated_at: string
        }
        Insert: {
          config?: Json
          created_at?: string
          enabled?: boolean
          id?: string
          kind: string
          name: string
          org_id: string
          secret_ref?: string | null
          slug: string
          updated_at?: string
        }
        Update: {
          config?: Json
          created_at?: string
          enabled?: boolean
          id?: string
          kind?: string
          name?: string
          org_id?: string
          secret_ref?: string | null
          slug?: string
          updated_at?: string
        }
        Relationships: []
      }
      invites: {
        Row: {
          accepted_at: string | null
          accepted_by: string | null
          created_at: string
          email: string
          expires_at: string
          id: string
          invited_by: string
          org_id: string
          role: Database["public"]["Enums"]["platform_role"]
          status: string
          token: string
        }
        Insert: {
          accepted_at?: string | null
          accepted_by?: string | null
          created_at?: string
          email: string
          expires_at?: string
          id?: string
          invited_by: string
          org_id: string
          role?: Database["public"]["Enums"]["platform_role"]
          status?: string
          token?: string
        }
        Update: {
          accepted_at?: string | null
          accepted_by?: string | null
          created_at?: string
          email?: string
          expires_at?: string
          id?: string
          invited_by?: string
          org_id?: string
          role?: Database["public"]["Enums"]["platform_role"]
          status?: string
          token?: string
        }
        Relationships: [
          {
            foreignKeyName: "invites_accepted_by_fkey"
            columns: ["accepted_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invites_invited_by_fkey"
            columns: ["invited_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invites_org_id_fkey"
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
      itil_changes: {
        Row: {
          actual_end: string | null
          actual_start: string | null
          assigned_to: string | null
          backout_plan: string | null
          code: string
          created_at: string
          description: string | null
          id: string
          impact: string
          org_id: string
          planned_end: string | null
          planned_start: string | null
          requested_by: string | null
          risk: string
          service_request_id: string | null
          status: string
          title: string
          type: string
          updated_at: string
        }
        Insert: {
          actual_end?: string | null
          actual_start?: string | null
          assigned_to?: string | null
          backout_plan?: string | null
          code: string
          created_at?: string
          description?: string | null
          id?: string
          impact?: string
          org_id: string
          planned_end?: string | null
          planned_start?: string | null
          requested_by?: string | null
          risk?: string
          service_request_id?: string | null
          status?: string
          title: string
          type?: string
          updated_at?: string
        }
        Update: {
          actual_end?: string | null
          actual_start?: string | null
          assigned_to?: string | null
          backout_plan?: string | null
          code?: string
          created_at?: string
          description?: string | null
          id?: string
          impact?: string
          org_id?: string
          planned_end?: string | null
          planned_start?: string | null
          requested_by?: string | null
          risk?: string
          service_request_id?: string | null
          status?: string
          title?: string
          type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "itil_changes_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "itil_changes_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "orgs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "itil_changes_requested_by_fkey"
            columns: ["requested_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "itil_changes_service_request_id_fkey"
            columns: ["service_request_id"]
            isOneToOne: false
            referencedRelation: "service_requests"
            referencedColumns: ["id"]
          },
        ]
      }
      itil_problems: {
        Row: {
          assigned_to: string | null
          code: string
          created_at: string
          description: string | null
          detected_at: string
          id: string
          linked_change_id: string | null
          linked_incident_id: string | null
          org_id: string
          priority: string
          reporter_id: string | null
          resolved_at: string | null
          root_cause: string | null
          status: string
          title: string
          updated_at: string
          workaround: string | null
        }
        Insert: {
          assigned_to?: string | null
          code: string
          created_at?: string
          description?: string | null
          detected_at?: string
          id?: string
          linked_change_id?: string | null
          linked_incident_id?: string | null
          org_id: string
          priority?: string
          reporter_id?: string | null
          resolved_at?: string | null
          root_cause?: string | null
          status?: string
          title: string
          updated_at?: string
          workaround?: string | null
        }
        Update: {
          assigned_to?: string | null
          code?: string
          created_at?: string
          description?: string | null
          detected_at?: string
          id?: string
          linked_change_id?: string | null
          linked_incident_id?: string | null
          org_id?: string
          priority?: string
          reporter_id?: string | null
          resolved_at?: string | null
          root_cause?: string | null
          status?: string
          title?: string
          updated_at?: string
          workaround?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "itil_problems_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "itil_problems_linked_change_id_fkey"
            columns: ["linked_change_id"]
            isOneToOne: false
            referencedRelation: "itil_changes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "itil_problems_linked_incident_id_fkey"
            columns: ["linked_incident_id"]
            isOneToOne: false
            referencedRelation: "incidents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "itil_problems_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "orgs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "itil_problems_reporter_id_fkey"
            columns: ["reporter_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      job_queue: {
        Row: {
          attempts: number
          completed_at: string | null
          created_at: string
          dedup_key: string | null
          id: string
          last_error: string | null
          locked_by: string | null
          locked_until: string | null
          max_attempts: number
          org_id: string
          payload: Json
          run_at: string
          state: Database["public"]["Enums"]["job_state"]
          type: string
          updated_at: string
        }
        Insert: {
          attempts?: number
          completed_at?: string | null
          created_at?: string
          dedup_key?: string | null
          id?: string
          last_error?: string | null
          locked_by?: string | null
          locked_until?: string | null
          max_attempts?: number
          org_id: string
          payload?: Json
          run_at?: string
          state?: Database["public"]["Enums"]["job_state"]
          type: string
          updated_at?: string
        }
        Update: {
          attempts?: number
          completed_at?: string | null
          created_at?: string
          dedup_key?: string | null
          id?: string
          last_error?: string | null
          locked_by?: string | null
          locked_until?: string | null
          max_attempts?: number
          org_id?: string
          payload?: Json
          run_at?: string
          state?: Database["public"]["Enums"]["job_state"]
          type?: string
          updated_at?: string
        }
        Relationships: []
      }
      kb_articles: {
        Row: {
          author_id: string | null
          body_markdown: string
          created_at: string
          id: string
          org_id: string
          slug: string
          tags: Json
          title: string
          updated_at: string
          version: number
        }
        Insert: {
          author_id?: string | null
          body_markdown: string
          created_at?: string
          id?: string
          org_id: string
          slug: string
          tags?: Json
          title: string
          updated_at?: string
          version?: number
        }
        Update: {
          author_id?: string | null
          body_markdown?: string
          created_at?: string
          id?: string
          org_id?: string
          slug?: string
          tags?: Json
          title?: string
          updated_at?: string
          version?: number
        }
        Relationships: []
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
      maintenance_jobs: {
        Row: {
          completed_at: string | null
          completed_by: string | null
          created_at: string
          due_at: string
          id: string
          kind: string
          notes: string | null
          org_id: string
          outcome: string | null
          photos: Json
          schedule_id: string | null
          target_id: string | null
          target_kind: string
          updated_at: string
        }
        Insert: {
          completed_at?: string | null
          completed_by?: string | null
          created_at?: string
          due_at: string
          id?: string
          kind: string
          notes?: string | null
          org_id: string
          outcome?: string | null
          photos?: Json
          schedule_id?: string | null
          target_id?: string | null
          target_kind: string
          updated_at?: string
        }
        Update: {
          completed_at?: string | null
          completed_by?: string | null
          created_at?: string
          due_at?: string
          id?: string
          kind?: string
          notes?: string | null
          org_id?: string
          outcome?: string | null
          photos?: Json
          schedule_id?: string | null
          target_id?: string | null
          target_kind?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "maintenance_jobs_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "orgs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "maintenance_jobs_schedule_id_fkey"
            columns: ["schedule_id"]
            isOneToOne: false
            referencedRelation: "maintenance_schedules"
            referencedColumns: ["id"]
          },
        ]
      }
      maintenance_schedules: {
        Row: {
          active: boolean
          cadence_days: number
          created_at: string
          id: string
          kind: string
          last_run_at: string | null
          metadata: Json
          name: string
          next_run_at: string | null
          org_id: string
          owner_id: string | null
          target_id: string | null
          target_kind: string
          updated_at: string
        }
        Insert: {
          active?: boolean
          cadence_days: number
          created_at?: string
          id?: string
          kind: string
          last_run_at?: string | null
          metadata?: Json
          name: string
          next_run_at?: string | null
          org_id: string
          owner_id?: string | null
          target_id?: string | null
          target_kind: string
          updated_at?: string
        }
        Update: {
          active?: boolean
          cadence_days?: number
          created_at?: string
          id?: string
          kind?: string
          last_run_at?: string | null
          metadata?: Json
          name?: string
          next_run_at?: string | null
          org_id?: string
          owner_id?: string | null
          target_id?: string | null
          target_kind?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "maintenance_schedules_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "orgs"
            referencedColumns: ["id"]
          },
        ]
      }
      major_incidents: {
        Row: {
          closed_at: string | null
          created_at: string
          ics_roles: Json
          id: string
          incident_id: string | null
          name: string
          opened_at: string
          org_id: string
          status: string
          timeline: Json
        }
        Insert: {
          closed_at?: string | null
          created_at?: string
          ics_roles?: Json
          id?: string
          incident_id?: string | null
          name: string
          opened_at?: string
          org_id: string
          status?: string
          timeline?: Json
        }
        Update: {
          closed_at?: string | null
          created_at?: string
          ics_roles?: Json
          id?: string
          incident_id?: string | null
          name?: string
          opened_at?: string
          org_id?: string
          status?: string
          timeline?: Json
        }
        Relationships: [
          {
            foreignKeyName: "major_incidents_incident_id_fkey"
            columns: ["incident_id"]
            isOneToOne: false
            referencedRelation: "incidents"
            referencedColumns: ["id"]
          },
        ]
      }
      medical_encounters: {
        Row: {
          chief_complaint: string | null
          clinician_id: string | null
          created_at: string
          disposition: string | null
          id: string
          incident_id: string | null
          org_id: string
          patient_ref: string | null
          phi_encrypted: Json | null
          triage: string | null
          venue_id: string | null
        }
        Insert: {
          chief_complaint?: string | null
          clinician_id?: string | null
          created_at?: string
          disposition?: string | null
          id?: string
          incident_id?: string | null
          org_id: string
          patient_ref?: string | null
          phi_encrypted?: Json | null
          triage?: string | null
          venue_id?: string | null
        }
        Update: {
          chief_complaint?: string | null
          clinician_id?: string | null
          created_at?: string
          disposition?: string | null
          id?: string
          incident_id?: string | null
          org_id?: string
          patient_ref?: string | null
          phi_encrypted?: Json | null
          triage?: string | null
          venue_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "medical_encounters_incident_id_fkey"
            columns: ["incident_id"]
            isOneToOne: false
            referencedRelation: "incidents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "medical_encounters_venue_id_fkey"
            columns: ["venue_id"]
            isOneToOne: false
            referencedRelation: "venues"
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
          kind: string
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
          kind?: string
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
          kind?: string
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
      offer_letter_activity: {
        Row: {
          actor_label: string | null
          actor_user_id: string | null
          id: string
          kind: string
          meta: Json
          occurred_at: string
          offer_letter_id: string
          org_id: string
          summary: string
        }
        Insert: {
          actor_label?: string | null
          actor_user_id?: string | null
          id?: string
          kind: string
          meta?: Json
          occurred_at?: string
          offer_letter_id: string
          org_id: string
          summary: string
        }
        Update: {
          actor_label?: string | null
          actor_user_id?: string | null
          id?: string
          kind?: string
          meta?: Json
          occurred_at?: string
          offer_letter_id?: string
          org_id?: string
          summary?: string
        }
        Relationships: [
          {
            foreignKeyName: "offer_letter_activity_actor_user_id_fkey"
            columns: ["actor_user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "offer_letter_activity_offer_letter_id_fkey"
            columns: ["offer_letter_id"]
            isOneToOne: false
            referencedRelation: "offer_letters"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "offer_letter_activity_offer_letter_id_fkey"
            columns: ["offer_letter_id"]
            isOneToOne: false
            referencedRelation: "offer_letters_resolved"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "offer_letter_activity_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "orgs"
            referencedColumns: ["id"]
          },
        ]
      }
      offer_letters: {
        Row: {
          accepted_at: string | null
          accepted_ip: unknown
          accepted_signature: string | null
          accepted_user_agent: string | null
          access_code: string
          classification: Database["public"]["Enums"]["offer_letter_classification"]
          compensation_basis: Database["public"]["Enums"]["compensation_basis"]
          created_at: string
          created_by: string | null
          crew_member_id: string
          decline_reason: string | null
          declined_at: string | null
          employer: Database["public"]["Enums"]["offer_letter_employer"]
          engagement_end: string | null
          engagement_start: string | null
          expectations_override: string | null
          extra_inclusions: Json
          first_viewed_at: string | null
          id: string
          last_viewed_at: string | null
          lodging_provided: boolean | null
          meals_provided: boolean | null
          org_id: string
          override_amount_cents: number | null
          override_per_diem_cents: number | null
          per_diem_rate_card_item_id: string | null
          project_id: string
          public_token: string
          rate_card_item_id: string | null
          reports_to_crew_member_id: string | null
          role_id: string
          sent_at: string | null
          snapshot: Json | null
          snapshot_at: string | null
          status: Database["public"]["Enums"]["offer_letter_status"]
          terms_override: string | null
          token_expires_at: string | null
          travel_provided: boolean | null
          updated_at: string
          venue_id: string | null
          view_count: number
          withdrawn_at: string | null
        }
        Insert: {
          accepted_at?: string | null
          accepted_ip?: unknown
          accepted_signature?: string | null
          accepted_user_agent?: string | null
          access_code: string
          classification: Database["public"]["Enums"]["offer_letter_classification"]
          compensation_basis?: Database["public"]["Enums"]["compensation_basis"]
          created_at?: string
          created_by?: string | null
          crew_member_id: string
          decline_reason?: string | null
          declined_at?: string | null
          employer: Database["public"]["Enums"]["offer_letter_employer"]
          engagement_end?: string | null
          engagement_start?: string | null
          expectations_override?: string | null
          extra_inclusions?: Json
          first_viewed_at?: string | null
          id?: string
          last_viewed_at?: string | null
          lodging_provided?: boolean | null
          meals_provided?: boolean | null
          org_id: string
          override_amount_cents?: number | null
          override_per_diem_cents?: number | null
          per_diem_rate_card_item_id?: string | null
          project_id: string
          public_token?: string
          rate_card_item_id?: string | null
          reports_to_crew_member_id?: string | null
          role_id: string
          sent_at?: string | null
          snapshot?: Json | null
          snapshot_at?: string | null
          status?: Database["public"]["Enums"]["offer_letter_status"]
          terms_override?: string | null
          token_expires_at?: string | null
          travel_provided?: boolean | null
          updated_at?: string
          venue_id?: string | null
          view_count?: number
          withdrawn_at?: string | null
        }
        Update: {
          accepted_at?: string | null
          accepted_ip?: unknown
          accepted_signature?: string | null
          accepted_user_agent?: string | null
          access_code?: string
          classification?: Database["public"]["Enums"]["offer_letter_classification"]
          compensation_basis?: Database["public"]["Enums"]["compensation_basis"]
          created_at?: string
          created_by?: string | null
          crew_member_id?: string
          decline_reason?: string | null
          declined_at?: string | null
          employer?: Database["public"]["Enums"]["offer_letter_employer"]
          engagement_end?: string | null
          engagement_start?: string | null
          expectations_override?: string | null
          extra_inclusions?: Json
          first_viewed_at?: string | null
          id?: string
          last_viewed_at?: string | null
          lodging_provided?: boolean | null
          meals_provided?: boolean | null
          org_id?: string
          override_amount_cents?: number | null
          override_per_diem_cents?: number | null
          per_diem_rate_card_item_id?: string | null
          project_id?: string
          public_token?: string
          rate_card_item_id?: string | null
          reports_to_crew_member_id?: string | null
          role_id?: string
          sent_at?: string | null
          snapshot?: Json | null
          snapshot_at?: string | null
          status?: Database["public"]["Enums"]["offer_letter_status"]
          terms_override?: string | null
          token_expires_at?: string | null
          travel_provided?: boolean | null
          updated_at?: string
          venue_id?: string | null
          view_count?: number
          withdrawn_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "offer_letters_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "offer_letters_crew_member_id_fkey"
            columns: ["crew_member_id"]
            isOneToOne: false
            referencedRelation: "crew_members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "offer_letters_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "orgs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "offer_letters_per_diem_rate_card_item_id_fkey"
            columns: ["per_diem_rate_card_item_id"]
            isOneToOne: false
            referencedRelation: "rate_card_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "offer_letters_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "offer_letters_rate_card_item_id_fkey"
            columns: ["rate_card_item_id"]
            isOneToOne: false
            referencedRelation: "rate_card_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "offer_letters_reports_to_crew_member_id_fkey"
            columns: ["reports_to_crew_member_id"]
            isOneToOne: false
            referencedRelation: "crew_members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "offer_letters_role_id_fkey"
            columns: ["role_id"]
            isOneToOne: false
            referencedRelation: "org_roles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "offer_letters_venue_id_fkey"
            columns: ["venue_id"]
            isOneToOne: false
            referencedRelation: "venues"
            referencedColumns: ["id"]
          },
        ]
      }
      org_domains: {
        Row: {
          created_at: string
          hostname: string
          id: string
          org_id: string
          purpose: string
          verification_method: string
          verification_token: string
          verified_at: string | null
        }
        Insert: {
          created_at?: string
          hostname: string
          id?: string
          org_id: string
          purpose?: string
          verification_method?: string
          verification_token?: string
          verified_at?: string | null
        }
        Update: {
          created_at?: string
          hostname?: string
          id?: string
          org_id?: string
          purpose?: string
          verification_method?: string
          verification_token?: string
          verified_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "org_domains_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "orgs"
            referencedColumns: ["id"]
          },
        ]
      }
      org_integrations: {
        Row: {
          config: Json
          connector: string
          created_at: string
          id: string
          installed_at: string | null
          last_error: string | null
          org_id: string
          status: string
          updated_at: string
        }
        Insert: {
          config?: Json
          connector: string
          created_at?: string
          id?: string
          installed_at?: string | null
          last_error?: string | null
          org_id: string
          status?: string
          updated_at?: string
        }
        Update: {
          config?: Json
          connector?: string
          created_at?: string
          id?: string
          installed_at?: string | null
          last_error?: string | null
          org_id?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "org_integrations_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "orgs"
            referencedColumns: ["id"]
          },
        ]
      }
      org_offer_letter_settings: {
        Row: {
          brand_logo_url: string | null
          default_classification: Database["public"]["Enums"]["offer_letter_classification"]
          default_confidentiality: boolean
          default_employer: Database["public"]["Enums"]["offer_letter_employer"]
          default_governing_law: string
          default_inclusions: Json
          default_lodging_provided: boolean
          default_meals_provided: boolean
          default_payment_schedule: string
          default_terms: string
          default_travel_provided: boolean
          org_id: string
          signing_authority_crew_member_id: string | null
          updated_at: string
        }
        Insert: {
          brand_logo_url?: string | null
          default_classification?: Database["public"]["Enums"]["offer_letter_classification"]
          default_confidentiality?: boolean
          default_employer?: Database["public"]["Enums"]["offer_letter_employer"]
          default_governing_law?: string
          default_inclusions?: Json
          default_lodging_provided?: boolean
          default_meals_provided?: boolean
          default_payment_schedule: string
          default_terms: string
          default_travel_provided?: boolean
          org_id: string
          signing_authority_crew_member_id?: string | null
          updated_at?: string
        }
        Update: {
          brand_logo_url?: string | null
          default_classification?: Database["public"]["Enums"]["offer_letter_classification"]
          default_confidentiality?: boolean
          default_employer?: Database["public"]["Enums"]["offer_letter_employer"]
          default_governing_law?: string
          default_inclusions?: Json
          default_lodging_provided?: boolean
          default_meals_provided?: boolean
          default_payment_schedule?: string
          default_terms?: string
          default_travel_provided?: boolean
          org_id?: string
          signing_authority_crew_member_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "org_offer_letter_settings_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: true
            referencedRelation: "orgs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "org_offer_letter_settings_signing_authority_fkey"
            columns: ["signing_authority_crew_member_id"]
            isOneToOne: false
            referencedRelation: "crew_members"
            referencedColumns: ["id"]
          },
        ]
      }
      org_roles: {
        Row: {
          created_at: string
          department: string | null
          description: string | null
          id: string
          is_system: boolean
          label: string
          org_id: string
          permissions: string[]
          responsibilities: Json
          slug: string
        }
        Insert: {
          created_at?: string
          department?: string | null
          description?: string | null
          id?: string
          is_system?: boolean
          label: string
          org_id: string
          permissions?: string[]
          responsibilities?: Json
          slug: string
        }
        Update: {
          created_at?: string
          department?: string | null
          description?: string | null
          id?: string
          is_system?: boolean
          label?: string
          org_id?: string
          permissions?: string[]
          responsibilities?: Json
          slug?: string
        }
        Relationships: [
          {
            foreignKeyName: "org_roles_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "orgs"
            referencedColumns: ["id"]
          },
        ]
      }
      orgs: {
        Row: {
          branding: Json
          compliance_settings: Json
          created_at: string
          datamap: Json
          id: string
          logo_url: string | null
          name: string
          name_override: string | null
          slug: string
          stripe_customer_id: string | null
          support_email: string | null
          tier: Database["public"]["Enums"]["tier"]
          updated_at: string
        }
        Insert: {
          branding?: Json
          compliance_settings?: Json
          created_at?: string
          datamap?: Json
          id?: string
          logo_url?: string | null
          name: string
          name_override?: string | null
          slug: string
          stripe_customer_id?: string | null
          support_email?: string | null
          tier?: Database["public"]["Enums"]["tier"]
          updated_at?: string
        }
        Update: {
          branding?: Json
          compliance_settings?: Json
          created_at?: string
          datamap?: Json
          id?: string
          logo_url?: string | null
          name?: string
          name_override?: string | null
          slug?: string
          stripe_customer_id?: string | null
          support_email?: string | null
          tier?: Database["public"]["Enums"]["tier"]
          updated_at?: string
        }
        Relationships: []
      }
      payment_application_lines: {
        Row: {
          completed_to_date_cents: number
          created_at: string
          id: string
          notes: string | null
          org_id: string
          payment_application_id: string
          pct_complete_this_period: number
          pct_complete_to_date: number
          po_line_item_id: string
          retention_cents: number
          scheduled_value_cents: number
          this_period_cents: number
        }
        Insert: {
          completed_to_date_cents?: number
          created_at?: string
          id?: string
          notes?: string | null
          org_id: string
          payment_application_id: string
          pct_complete_this_period?: number
          pct_complete_to_date?: number
          po_line_item_id: string
          retention_cents?: number
          scheduled_value_cents?: number
          this_period_cents?: number
        }
        Update: {
          completed_to_date_cents?: number
          created_at?: string
          id?: string
          notes?: string | null
          org_id?: string
          payment_application_id?: string
          pct_complete_this_period?: number
          pct_complete_to_date?: number
          po_line_item_id?: string
          retention_cents?: number
          scheduled_value_cents?: number
          this_period_cents?: number
        }
        Relationships: [
          {
            foreignKeyName: "payment_application_lines_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "orgs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payment_application_lines_payment_application_id_fkey"
            columns: ["payment_application_id"]
            isOneToOne: false
            referencedRelation: "payment_applications"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payment_application_lines_po_line_item_id_fkey"
            columns: ["po_line_item_id"]
            isOneToOne: false
            referencedRelation: "po_line_items"
            referencedColumns: ["id"]
          },
        ]
      }
      payment_applications: {
        Row: {
          application_number: number
          approved_at: string | null
          approved_by: string | null
          created_at: string
          created_by: string | null
          id: string
          notes: string | null
          org_id: string
          paid_at: string | null
          period_end: string
          period_start: string
          project_id: string
          purchase_order_id: string
          retention_pct: number
          status: string
          submitted_at: string | null
          total_completed_cents: number
          total_due_cents: number
          total_previously_paid_cents: number
          total_retention_cents: number
          vendor_id: string | null
        }
        Insert: {
          application_number: number
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          notes?: string | null
          org_id: string
          paid_at?: string | null
          period_end: string
          period_start: string
          project_id: string
          purchase_order_id: string
          retention_pct?: number
          status?: string
          submitted_at?: string | null
          total_completed_cents?: number
          total_due_cents?: number
          total_previously_paid_cents?: number
          total_retention_cents?: number
          vendor_id?: string | null
        }
        Update: {
          application_number?: number
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          notes?: string | null
          org_id?: string
          paid_at?: string | null
          period_end?: string
          period_start?: string
          project_id?: string
          purchase_order_id?: string
          retention_pct?: number
          status?: string
          submitted_at?: string | null
          total_completed_cents?: number
          total_due_cents?: number
          total_previously_paid_cents?: number
          total_retention_cents?: number
          vendor_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "payment_applications_approved_by_fkey"
            columns: ["approved_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payment_applications_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payment_applications_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "orgs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payment_applications_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payment_applications_purchase_order_id_fkey"
            columns: ["purchase_order_id"]
            isOneToOne: false
            referencedRelation: "purchase_orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payment_applications_vendor_id_fkey"
            columns: ["vendor_id"]
            isOneToOne: false
            referencedRelation: "vendors"
            referencedColumns: ["id"]
          },
        ]
      }
      playbooks: {
        Row: {
          content: Json
          created_at: string
          id: string
          kind: string
          org_id: string
          owner_id: string | null
          slug: string
          status: string
          summary: string | null
          title: string
          updated_at: string
          version: number
        }
        Insert: {
          content?: Json
          created_at?: string
          id?: string
          kind?: string
          org_id: string
          owner_id?: string | null
          slug: string
          status?: string
          summary?: string | null
          title: string
          updated_at?: string
          version?: number
        }
        Update: {
          content?: Json
          created_at?: string
          id?: string
          kind?: string
          org_id?: string
          owner_id?: string | null
          slug?: string
          status?: string
          summary?: string | null
          title?: string
          updated_at?: string
          version?: number
        }
        Relationships: [
          {
            foreignKeyName: "playbooks_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "orgs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "playbooks_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      po_change_order_lines: {
        Row: {
          created_at: string
          description: string
          id: string
          org_id: string
          po_change_order_id: string
          position: number
          quantity: number
          unit_price_cents: number
        }
        Insert: {
          created_at?: string
          description: string
          id?: string
          org_id: string
          po_change_order_id: string
          position?: number
          quantity?: number
          unit_price_cents?: number
        }
        Update: {
          created_at?: string
          description?: string
          id?: string
          org_id?: string
          po_change_order_id?: string
          position?: number
          quantity?: number
          unit_price_cents?: number
        }
        Relationships: [
          {
            foreignKeyName: "po_change_order_lines_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "orgs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "po_change_order_lines_po_change_order_id_fkey"
            columns: ["po_change_order_id"]
            isOneToOne: false
            referencedRelation: "po_change_orders"
            referencedColumns: ["id"]
          },
        ]
      }
      po_change_orders: {
        Row: {
          amount_cents: number
          approved_at: string | null
          approved_by: string | null
          created_at: string
          created_by: string | null
          description: string | null
          id: string
          number: number
          org_id: string
          project_id: string | null
          proposed_at: string
          purchase_order_id: string
          reason: string | null
          schedule_impact_days: number
          status: string
          title: string
        }
        Insert: {
          amount_cents?: number
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          number: number
          org_id: string
          project_id?: string | null
          proposed_at?: string
          purchase_order_id: string
          reason?: string | null
          schedule_impact_days?: number
          status?: string
          title: string
        }
        Update: {
          amount_cents?: number
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          number?: number
          org_id?: string
          project_id?: string | null
          proposed_at?: string
          purchase_order_id?: string
          reason?: string | null
          schedule_impact_days?: number
          status?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "po_change_orders_approved_by_fkey"
            columns: ["approved_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "po_change_orders_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "po_change_orders_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "orgs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "po_change_orders_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "po_change_orders_purchase_order_id_fkey"
            columns: ["purchase_order_id"]
            isOneToOne: false
            referencedRelation: "purchase_orders"
            referencedColumns: ["id"]
          },
        ]
      }
      po_checklist_items: {
        Row: {
          completed_at: string | null
          completed_by: string | null
          created_at: string
          id: string
          notes: string | null
          org_id: string
          photo_path: string | null
          position: number
          prompt: string
          purchase_order_id: string
          requires_photo: boolean
          status: string
        }
        Insert: {
          completed_at?: string | null
          completed_by?: string | null
          created_at?: string
          id?: string
          notes?: string | null
          org_id: string
          photo_path?: string | null
          position?: number
          prompt: string
          purchase_order_id: string
          requires_photo?: boolean
          status?: string
        }
        Update: {
          completed_at?: string | null
          completed_by?: string | null
          created_at?: string
          id?: string
          notes?: string | null
          org_id?: string
          photo_path?: string | null
          position?: number
          prompt?: string
          purchase_order_id?: string
          requires_photo?: boolean
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "po_checklist_items_completed_by_fkey"
            columns: ["completed_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "po_checklist_items_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "orgs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "po_checklist_items_purchase_order_id_fkey"
            columns: ["purchase_order_id"]
            isOneToOne: false
            referencedRelation: "purchase_orders"
            referencedColumns: ["id"]
          },
        ]
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
      prequalification_questionnaires: {
        Row: {
          active: boolean
          code: string
          created_at: string
          created_by: string | null
          description: string | null
          id: string
          name: string
          org_id: string
        }
        Insert: {
          active?: boolean
          code: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          name: string
          org_id: string
        }
        Update: {
          active?: boolean
          code?: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          name?: string
          org_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "prequalification_questionnaires_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "prequalification_questionnaires_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "orgs"
            referencedColumns: ["id"]
          },
        ]
      }
      prequalification_questions: {
        Row: {
          category: string
          created_at: string
          id: string
          org_id: string
          position: number
          prompt: string
          questionnaire_id: string
          required: boolean
          scoring_weight: number
        }
        Insert: {
          category?: string
          created_at?: string
          id?: string
          org_id: string
          position?: number
          prompt: string
          questionnaire_id: string
          required?: boolean
          scoring_weight?: number
        }
        Update: {
          category?: string
          created_at?: string
          id?: string
          org_id?: string
          position?: number
          prompt?: string
          questionnaire_id?: string
          required?: boolean
          scoring_weight?: number
        }
        Relationships: [
          {
            foreignKeyName: "prequalification_questions_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "orgs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "prequalification_questions_questionnaire_id_fkey"
            columns: ["questionnaire_id"]
            isOneToOne: false
            referencedRelation: "prequalification_questionnaires"
            referencedColumns: ["id"]
          },
        ]
      }
      program_reviews: {
        Row: {
          actions: Json
          agenda: Json
          attendees: Json
          created_at: string
          created_by: string | null
          decisions: Json
          id: string
          notes: string | null
          org_id: string
          scheduled_at: string
          title: string
          updated_at: string
        }
        Insert: {
          actions?: Json
          agenda?: Json
          attendees?: Json
          created_at?: string
          created_by?: string | null
          decisions?: Json
          id?: string
          notes?: string | null
          org_id: string
          scheduled_at: string
          title: string
          updated_at?: string
        }
        Update: {
          actions?: Json
          agenda?: Json
          attendees?: Json
          created_at?: string
          created_by?: string | null
          decisions?: Json
          id?: string
          notes?: string | null
          org_id?: string
          scheduled_at?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      project_photos: {
        Row: {
          album: string | null
          caption: string | null
          created_at: string
          file_path: string
          id: string
          lat: number | null
          lng: number | null
          location_id: string | null
          org_id: string
          project_id: string
          taken_at: string
          taken_by: string | null
        }
        Insert: {
          album?: string | null
          caption?: string | null
          created_at?: string
          file_path: string
          id?: string
          lat?: number | null
          lng?: number | null
          location_id?: string | null
          org_id: string
          project_id: string
          taken_at?: string
          taken_by?: string | null
        }
        Update: {
          album?: string | null
          caption?: string | null
          created_at?: string
          file_path?: string
          id?: string
          lat?: number | null
          lng?: number | null
          location_id?: string | null
          org_id?: string
          project_id?: string
          taken_at?: string
          taken_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "project_photos_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "locations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_photos_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "orgs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_photos_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_photos_taken_by_fkey"
            columns: ["taken_by"]
            isOneToOne: false
            referencedRelation: "users"
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
      proposal_activity: {
        Row: {
          actor_id: string | null
          actor_label: string | null
          id: string
          kind: string
          meta: Json
          occurred_at: string
          org_id: string
          proposal_id: string
          summary: string
          target_id: string | null
          target_kind: string | null
        }
        Insert: {
          actor_id?: string | null
          actor_label?: string | null
          id?: string
          kind: string
          meta?: Json
          occurred_at?: string
          org_id: string
          proposal_id: string
          summary: string
          target_id?: string | null
          target_kind?: string | null
        }
        Update: {
          actor_id?: string | null
          actor_label?: string | null
          id?: string
          kind?: string
          meta?: Json
          occurred_at?: string
          org_id?: string
          proposal_id?: string
          summary?: string
          target_id?: string | null
          target_kind?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "proposal_activity_actor_id_fkey"
            columns: ["actor_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "proposal_activity_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "orgs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "proposal_activity_proposal_id_fkey"
            columns: ["proposal_id"]
            isOneToOne: false
            referencedRelation: "proposals"
            referencedColumns: ["id"]
          },
        ]
      }
      proposal_approvals: {
        Row: {
          body: string | null
          created_at: string
          decline_reason: string | null
          due_at: string | null
          id: string
          kind: string
          org_id: string
          proposal_id: string
          signed_at: string | null
          signed_by: string | null
          signed_ip: unknown
          signed_label: string | null
          state: Database["public"]["Enums"]["approval_state"]
          target_id: string | null
          title: string
          updated_at: string
        }
        Insert: {
          body?: string | null
          created_at?: string
          decline_reason?: string | null
          due_at?: string | null
          id?: string
          kind: string
          org_id: string
          proposal_id: string
          signed_at?: string | null
          signed_by?: string | null
          signed_ip?: unknown
          signed_label?: string | null
          state?: Database["public"]["Enums"]["approval_state"]
          target_id?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          body?: string | null
          created_at?: string
          decline_reason?: string | null
          due_at?: string | null
          id?: string
          kind?: string
          org_id?: string
          proposal_id?: string
          signed_at?: string | null
          signed_by?: string | null
          signed_ip?: unknown
          signed_label?: string | null
          state?: Database["public"]["Enums"]["approval_state"]
          target_id?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "proposal_approvals_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "orgs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "proposal_approvals_proposal_id_fkey"
            columns: ["proposal_id"]
            isOneToOne: false
            referencedRelation: "proposals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "proposal_approvals_signed_by_fkey"
            columns: ["signed_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      proposal_change_orders: {
        Row: {
          body: string | null
          created_at: string
          decided_at: string | null
          decided_by: string | null
          decision_note: string | null
          delta_cents: number | null
          id: string
          meta: Json
          number: number
          org_id: string
          priced_at: string | null
          proposal_id: string
          requested_by: string | null
          requested_label: string | null
          state: Database["public"]["Enums"]["change_order_state"]
          title: string
          updated_at: string
        }
        Insert: {
          body?: string | null
          created_at?: string
          decided_at?: string | null
          decided_by?: string | null
          decision_note?: string | null
          delta_cents?: number | null
          id?: string
          meta?: Json
          number: number
          org_id: string
          priced_at?: string | null
          proposal_id: string
          requested_by?: string | null
          requested_label?: string | null
          state?: Database["public"]["Enums"]["change_order_state"]
          title: string
          updated_at?: string
        }
        Update: {
          body?: string | null
          created_at?: string
          decided_at?: string | null
          decided_by?: string | null
          decision_note?: string | null
          delta_cents?: number | null
          id?: string
          meta?: Json
          number?: number
          org_id?: string
          priced_at?: string | null
          proposal_id?: string
          requested_by?: string | null
          requested_label?: string | null
          state?: Database["public"]["Enums"]["change_order_state"]
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "proposal_change_orders_decided_by_fkey"
            columns: ["decided_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "proposal_change_orders_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "orgs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "proposal_change_orders_proposal_id_fkey"
            columns: ["proposal_id"]
            isOneToOne: false
            referencedRelation: "proposals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "proposal_change_orders_requested_by_fkey"
            columns: ["requested_by"]
            isOneToOne: false
            referencedRelation: "users"
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
      proposal_files: {
        Row: {
          category: string
          created_at: string
          id: string
          mime_type: string | null
          name: string
          org_id: string
          proposal_id: string
          size_bytes: number | null
          storage_path: string
          uploaded_by: string | null
        }
        Insert: {
          category: string
          created_at?: string
          id?: string
          mime_type?: string | null
          name: string
          org_id: string
          proposal_id: string
          size_bytes?: number | null
          storage_path: string
          uploaded_by?: string | null
        }
        Update: {
          category?: string
          created_at?: string
          id?: string
          mime_type?: string | null
          name?: string
          org_id?: string
          proposal_id?: string
          size_bytes?: number | null
          storage_path?: string
          uploaded_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "proposal_files_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "orgs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "proposal_files_proposal_id_fkey"
            columns: ["proposal_id"]
            isOneToOne: false
            referencedRelation: "proposals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "proposal_files_uploaded_by_fkey"
            columns: ["uploaded_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      proposal_gate_items: {
        Row: {
          created_at: string
          done_at: string | null
          done_by: string | null
          id: string
          is_done: boolean
          label: string
          ordinal: number
          org_id: string
          phase_state_id: string
          proposal_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          done_at?: string | null
          done_by?: string | null
          id?: string
          is_done?: boolean
          label: string
          ordinal: number
          org_id: string
          phase_state_id: string
          proposal_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          done_at?: string | null
          done_by?: string | null
          id?: string
          is_done?: boolean
          label?: string
          ordinal?: number
          org_id?: string
          phase_state_id?: string
          proposal_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "proposal_gate_items_done_by_fkey"
            columns: ["done_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "proposal_gate_items_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "orgs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "proposal_gate_items_phase_state_id_fkey"
            columns: ["phase_state_id"]
            isOneToOne: false
            referencedRelation: "proposal_phase_states"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "proposal_gate_items_proposal_id_fkey"
            columns: ["proposal_id"]
            isOneToOne: false
            referencedRelation: "proposals"
            referencedColumns: ["id"]
          },
        ]
      }
      proposal_phase_states: {
        Row: {
          approved_at: string | null
          approved_by: string | null
          created_at: string
          id: string
          meta: Json
          org_id: string
          phase_key: string
          phase_name: string
          phase_num: number
          proposal_id: string
          started_at: string | null
          status: Database["public"]["Enums"]["proposal_phase_status"]
          updated_at: string
        }
        Insert: {
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string
          id?: string
          meta?: Json
          org_id: string
          phase_key: string
          phase_name: string
          phase_num: number
          proposal_id: string
          started_at?: string | null
          status?: Database["public"]["Enums"]["proposal_phase_status"]
          updated_at?: string
        }
        Update: {
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string
          id?: string
          meta?: Json
          org_id?: string
          phase_key?: string
          phase_name?: string
          phase_num?: number
          proposal_id?: string
          started_at?: string | null
          status?: Database["public"]["Enums"]["proposal_phase_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "proposal_phase_states_approved_by_fkey"
            columns: ["approved_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "proposal_phase_states_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "orgs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "proposal_phase_states_proposal_id_fkey"
            columns: ["proposal_id"]
            isOneToOne: false
            referencedRelation: "proposals"
            referencedColumns: ["id"]
          },
        ]
      }
      proposal_revision_rounds: {
        Row: {
          created_at: string
          created_by: string | null
          decided_at: string | null
          decided_by: string | null
          decision_note: string | null
          id: string
          org_id: string
          proposal_id: string
          round_num: number
          state: Database["public"]["Enums"]["revision_state"]
          summary: string | null
          target_id: string | null
          target_kind: string
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          decided_at?: string | null
          decided_by?: string | null
          decision_note?: string | null
          id?: string
          org_id: string
          proposal_id: string
          round_num?: number
          state?: Database["public"]["Enums"]["revision_state"]
          summary?: string | null
          target_id?: string | null
          target_kind: string
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          decided_at?: string | null
          decided_by?: string | null
          decision_note?: string | null
          id?: string
          org_id?: string
          proposal_id?: string
          round_num?: number
          state?: Database["public"]["Enums"]["revision_state"]
          summary?: string | null
          target_id?: string | null
          target_kind?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "proposal_revision_rounds_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "proposal_revision_rounds_decided_by_fkey"
            columns: ["decided_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "proposal_revision_rounds_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "orgs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "proposal_revision_rounds_proposal_id_fkey"
            columns: ["proposal_id"]
            isOneToOne: false
            referencedRelation: "proposals"
            referencedColumns: ["id"]
          },
        ]
      }
      proposal_revisions: {
        Row: {
          created_at: string
          created_by: string | null
          file_path: string | null
          id: string
          label: string
          note: string | null
          ordinal: number
          org_id: string
          preview_url: string | null
          proposal_id: string
          round_id: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          file_path?: string | null
          id?: string
          label: string
          note?: string | null
          ordinal?: number
          org_id: string
          preview_url?: string | null
          proposal_id: string
          round_id: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          file_path?: string | null
          id?: string
          label?: string
          note?: string | null
          ordinal?: number
          org_id?: string
          preview_url?: string | null
          proposal_id?: string
          round_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "proposal_revisions_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "proposal_revisions_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "orgs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "proposal_revisions_proposal_id_fkey"
            columns: ["proposal_id"]
            isOneToOne: false
            referencedRelation: "proposals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "proposal_revisions_round_id_fkey"
            columns: ["round_id"]
            isOneToOne: false
            referencedRelation: "proposal_revision_rounds"
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
      punch_items: {
        Row: {
          assignee_id: string | null
          closed_at: string | null
          closed_by: string | null
          code: string
          created_at: string
          created_by: string | null
          description: string | null
          due_at: string | null
          id: string
          org_id: string
          photo_path: string | null
          pin_x: number | null
          pin_y: number | null
          priority: string
          project_id: string
          punch_list_id: string | null
          show_ready_gate: boolean
          site_plan_id: string | null
          status: string
          title: string
          vendor_id: string | null
        }
        Insert: {
          assignee_id?: string | null
          closed_at?: string | null
          closed_by?: string | null
          code: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          due_at?: string | null
          id?: string
          org_id: string
          photo_path?: string | null
          pin_x?: number | null
          pin_y?: number | null
          priority?: string
          project_id: string
          punch_list_id?: string | null
          show_ready_gate?: boolean
          site_plan_id?: string | null
          status?: string
          title: string
          vendor_id?: string | null
        }
        Update: {
          assignee_id?: string | null
          closed_at?: string | null
          closed_by?: string | null
          code?: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          due_at?: string | null
          id?: string
          org_id?: string
          photo_path?: string | null
          pin_x?: number | null
          pin_y?: number | null
          priority?: string
          project_id?: string
          punch_list_id?: string | null
          show_ready_gate?: boolean
          site_plan_id?: string | null
          status?: string
          title?: string
          vendor_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "punch_items_assignee_id_fkey"
            columns: ["assignee_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "punch_items_closed_by_fkey"
            columns: ["closed_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "punch_items_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "punch_items_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "orgs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "punch_items_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "punch_items_punch_list_id_fkey"
            columns: ["punch_list_id"]
            isOneToOne: false
            referencedRelation: "punch_lists"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "punch_items_site_plan_id_fkey"
            columns: ["site_plan_id"]
            isOneToOne: false
            referencedRelation: "site_plans"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "punch_items_vendor_id_fkey"
            columns: ["vendor_id"]
            isOneToOne: false
            referencedRelation: "vendors"
            referencedColumns: ["id"]
          },
        ]
      }
      punch_lists: {
        Row: {
          category: string | null
          created_at: string
          created_by: string | null
          id: string
          name: string
          org_id: string
          project_id: string
          status: string
        }
        Insert: {
          category?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          name: string
          org_id: string
          project_id: string
          status?: string
        }
        Update: {
          category?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          name?: string
          org_id?: string
          project_id?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "punch_lists_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "punch_lists_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "orgs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "punch_lists_project_id_fkey"
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
      rate_card_items: {
        Row: {
          active: boolean
          catalog: string
          created_at: string
          currency: string
          description: string | null
          id: string
          metadata: Json
          name: string
          org_id: string
          sku: string
          unit_price_cents: number
        }
        Insert: {
          active?: boolean
          catalog?: string
          created_at?: string
          currency?: string
          description?: string | null
          id?: string
          metadata?: Json
          name: string
          org_id: string
          sku: string
          unit_price_cents?: number
        }
        Update: {
          active?: boolean
          catalog?: string
          created_at?: string
          currency?: string
          description?: string | null
          id?: string
          metadata?: Json
          name?: string
          org_id?: string
          sku?: string
          unit_price_cents?: number
        }
        Relationships: []
      }
      rate_card_orders: {
        Row: {
          catalog: string
          created_at: string
          currency: string
          delegation_id: string | null
          id: string
          line_items: Json
          notes: string | null
          org_id: string
          requester_id: string | null
          status: string
          total_cents: number
          updated_at: string
        }
        Insert: {
          catalog?: string
          created_at?: string
          currency?: string
          delegation_id?: string | null
          id?: string
          line_items?: Json
          notes?: string | null
          org_id: string
          requester_id?: string | null
          status?: string
          total_cents?: number
          updated_at?: string
        }
        Update: {
          catalog?: string
          created_at?: string
          currency?: string
          delegation_id?: string | null
          id?: string
          line_items?: Json
          notes?: string | null
          org_id?: string
          requester_id?: string | null
          status?: string
          total_cents?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "rate_card_orders_delegation_id_fkey"
            columns: ["delegation_id"]
            isOneToOne: false
            referencedRelation: "delegations"
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
      readiness_exercises: {
        Row: {
          aar: Json
          created_at: string
          id: string
          injects: Json
          kind: string
          name: string
          org_id: string
          project_id: string | null
          scenario: Json
          scheduled_at: string | null
          updated_at: string
        }
        Insert: {
          aar?: Json
          created_at?: string
          id?: string
          injects?: Json
          kind?: string
          name: string
          org_id: string
          project_id?: string | null
          scenario?: Json
          scheduled_at?: string | null
          updated_at?: string
        }
        Update: {
          aar?: Json
          created_at?: string
          id?: string
          injects?: Json
          kind?: string
          name?: string
          org_id?: string
          project_id?: string | null
          scenario?: Json
          scheduled_at?: string | null
          updated_at?: string
        }
        Relationships: []
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
      rfis: {
        Row: {
          answered_at: string | null
          answered_by: string | null
          asked_at: string
          asked_by: string | null
          ball_in_court_id: string | null
          category: string | null
          closed_at: string | null
          code: string
          created_at: string
          due_at: string | null
          id: string
          linked_deliverable_id: string | null
          linked_po_id: string | null
          linked_site_plan_id: string | null
          official_answer: string | null
          org_id: string
          priority: string
          project_id: string
          question: string
          status: string
          subject: string
        }
        Insert: {
          answered_at?: string | null
          answered_by?: string | null
          asked_at?: string
          asked_by?: string | null
          ball_in_court_id?: string | null
          category?: string | null
          closed_at?: string | null
          code: string
          created_at?: string
          due_at?: string | null
          id?: string
          linked_deliverable_id?: string | null
          linked_po_id?: string | null
          linked_site_plan_id?: string | null
          official_answer?: string | null
          org_id: string
          priority?: string
          project_id: string
          question: string
          status?: string
          subject: string
        }
        Update: {
          answered_at?: string | null
          answered_by?: string | null
          asked_at?: string
          asked_by?: string | null
          ball_in_court_id?: string | null
          category?: string | null
          closed_at?: string | null
          code?: string
          created_at?: string
          due_at?: string | null
          id?: string
          linked_deliverable_id?: string | null
          linked_po_id?: string | null
          linked_site_plan_id?: string | null
          official_answer?: string | null
          org_id?: string
          priority?: string
          project_id?: string
          question?: string
          status?: string
          subject?: string
        }
        Relationships: [
          {
            foreignKeyName: "rfis_answered_by_fkey"
            columns: ["answered_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rfis_asked_by_fkey"
            columns: ["asked_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rfis_ball_in_court_id_fkey"
            columns: ["ball_in_court_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rfis_linked_deliverable_id_fkey"
            columns: ["linked_deliverable_id"]
            isOneToOne: false
            referencedRelation: "deliverables"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rfis_linked_po_id_fkey"
            columns: ["linked_po_id"]
            isOneToOne: false
            referencedRelation: "purchase_orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rfis_linked_site_plan_id_fkey"
            columns: ["linked_site_plan_id"]
            isOneToOne: false
            referencedRelation: "site_plans"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rfis_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "orgs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rfis_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      rfq_response_lines: {
        Row: {
          created_at: string
          description: string
          id: string
          notes: string | null
          org_id: string
          position: number
          quantity: number
          rfq_response_id: string
          unit_price_cents: number
        }
        Insert: {
          created_at?: string
          description: string
          id?: string
          notes?: string | null
          org_id: string
          position?: number
          quantity?: number
          rfq_response_id: string
          unit_price_cents?: number
        }
        Update: {
          created_at?: string
          description?: string
          id?: string
          notes?: string | null
          org_id?: string
          position?: number
          quantity?: number
          rfq_response_id?: string
          unit_price_cents?: number
        }
        Relationships: [
          {
            foreignKeyName: "rfq_response_lines_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "orgs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rfq_response_lines_rfq_response_id_fkey"
            columns: ["rfq_response_id"]
            isOneToOne: false
            referencedRelation: "rfq_responses"
            referencedColumns: ["id"]
          },
        ]
      }
      rfq_responses: {
        Row: {
          awarded_at: string | null
          awarded_by: string | null
          created_at: string
          id: string
          notes: string | null
          org_id: string
          requisition_id: string
          status: string
          submitted_at: string | null
          total_cents: number | null
          vendor_id: string | null
        }
        Insert: {
          awarded_at?: string | null
          awarded_by?: string | null
          created_at?: string
          id?: string
          notes?: string | null
          org_id: string
          requisition_id: string
          status?: string
          submitted_at?: string | null
          total_cents?: number | null
          vendor_id?: string | null
        }
        Update: {
          awarded_at?: string | null
          awarded_by?: string | null
          created_at?: string
          id?: string
          notes?: string | null
          org_id?: string
          requisition_id?: string
          status?: string
          submitted_at?: string | null
          total_cents?: number | null
          vendor_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "rfq_responses_awarded_by_fkey"
            columns: ["awarded_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rfq_responses_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "orgs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rfq_responses_requisition_id_fkey"
            columns: ["requisition_id"]
            isOneToOne: false
            referencedRelation: "requisitions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rfq_responses_vendor_id_fkey"
            columns: ["vendor_id"]
            isOneToOne: false
            referencedRelation: "vendors"
            referencedColumns: ["id"]
          },
        ]
      }
      rfqs: {
        Row: {
          awarded_to_vendor_id: string | null
          created_at: string
          created_by: string | null
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
          awarded_to_vendor_id?: string | null
          created_at?: string
          created_by?: string | null
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
          awarded_to_vendor_id?: string | null
          created_at?: string
          created_by?: string | null
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
            foreignKeyName: "rfqs_awarded_to_vendor_id_fkey"
            columns: ["awarded_to_vendor_id"]
            isOneToOne: false
            referencedRelation: "vendors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rfqs_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "orgs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rfqs_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      risks: {
        Row: {
          category: string | null
          created_at: string
          created_by: string | null
          description: string | null
          due_on: string | null
          id: string
          impact: Database["public"]["Enums"]["risk_impact"]
          inherent_score: number | null
          kind: Database["public"]["Enums"]["raid_kind"]
          likelihood: Database["public"]["Enums"]["risk_likelihood"]
          org_id: string
          owner_id: string | null
          project_id: string | null
          residual_score: number | null
          status: Database["public"]["Enums"]["risk_status"]
          title: string
          treatment: string | null
          updated_at: string
        }
        Insert: {
          category?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          due_on?: string | null
          id?: string
          impact?: Database["public"]["Enums"]["risk_impact"]
          inherent_score?: number | null
          kind?: Database["public"]["Enums"]["raid_kind"]
          likelihood?: Database["public"]["Enums"]["risk_likelihood"]
          org_id: string
          owner_id?: string | null
          project_id?: string | null
          residual_score?: number | null
          status?: Database["public"]["Enums"]["risk_status"]
          title: string
          treatment?: string | null
          updated_at?: string
        }
        Update: {
          category?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          due_on?: string | null
          id?: string
          impact?: Database["public"]["Enums"]["risk_impact"]
          inherent_score?: number | null
          kind?: Database["public"]["Enums"]["raid_kind"]
          likelihood?: Database["public"]["Enums"]["risk_likelihood"]
          org_id?: string
          owner_id?: string | null
          project_id?: string | null
          residual_score?: number | null
          status?: Database["public"]["Enums"]["risk_status"]
          title?: string
          treatment?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      rosters: {
        Row: {
          created_at: string
          day_of: string
          id: string
          name: string
          org_id: string
          published_at: string | null
          state: Database["public"]["Enums"]["roster_state"]
          updated_at: string
          venue_id: string | null
        }
        Insert: {
          created_at?: string
          day_of: string
          id?: string
          name: string
          org_id: string
          published_at?: string | null
          state?: Database["public"]["Enums"]["roster_state"]
          updated_at?: string
          venue_id?: string | null
        }
        Update: {
          created_at?: string
          day_of?: string
          id?: string
          name?: string
          org_id?: string
          published_at?: string | null
          state?: Database["public"]["Enums"]["roster_state"]
          updated_at?: string
          venue_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "rosters_venue_id_fkey"
            columns: ["venue_id"]
            isOneToOne: false
            referencedRelation: "venues"
            referencedColumns: ["id"]
          },
        ]
      }
      safeguarding_reports: {
        Row: {
          assigned_to: string | null
          created_at: string
          evidence_paths: Json
          id: string
          narrative: string
          org_id: string
          reporter_id: string | null
          status: string
          subject_ref: string | null
          updated_at: string
        }
        Insert: {
          assigned_to?: string | null
          created_at?: string
          evidence_paths?: Json
          id?: string
          narrative: string
          org_id: string
          reporter_id?: string | null
          status?: string
          subject_ref?: string | null
          updated_at?: string
        }
        Update: {
          assigned_to?: string | null
          created_at?: string
          evidence_paths?: Json
          id?: string
          narrative?: string
          org_id?: string
          reporter_id?: string | null
          status?: string
          subject_ref?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      safety_briefing_attendees: {
        Row: {
          acknowledged_at: string | null
          briefing_id: string
          created_at: string
          crew_member_id: string | null
          id: string
          notes: string | null
          org_id: string
          signature_path: string | null
          user_id: string | null
        }
        Insert: {
          acknowledged_at?: string | null
          briefing_id: string
          created_at?: string
          crew_member_id?: string | null
          id?: string
          notes?: string | null
          org_id: string
          signature_path?: string | null
          user_id?: string | null
        }
        Update: {
          acknowledged_at?: string | null
          briefing_id?: string
          created_at?: string
          crew_member_id?: string | null
          id?: string
          notes?: string | null
          org_id?: string
          signature_path?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "safety_briefing_attendees_briefing_id_fkey"
            columns: ["briefing_id"]
            isOneToOne: false
            referencedRelation: "safety_briefings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "safety_briefing_attendees_crew_member_id_fkey"
            columns: ["crew_member_id"]
            isOneToOne: false
            referencedRelation: "crew_members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "safety_briefing_attendees_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "orgs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "safety_briefing_attendees_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      safety_briefings: {
        Row: {
          attachment_path: string | null
          briefer_id: string | null
          conducted_at: string | null
          created_at: string
          created_by: string | null
          id: string
          notes: string | null
          org_id: string
          project_id: string | null
          scheduled_for: string
          shift_id: string | null
          status: string
          topic: string
        }
        Insert: {
          attachment_path?: string | null
          briefer_id?: string | null
          conducted_at?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          notes?: string | null
          org_id: string
          project_id?: string | null
          scheduled_for: string
          shift_id?: string | null
          status?: string
          topic: string
        }
        Update: {
          attachment_path?: string | null
          briefer_id?: string | null
          conducted_at?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          notes?: string | null
          org_id?: string
          project_id?: string | null
          scheduled_for?: string
          shift_id?: string | null
          status?: string
          topic?: string
        }
        Relationships: [
          {
            foreignKeyName: "safety_briefings_briefer_id_fkey"
            columns: ["briefer_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "safety_briefings_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "safety_briefings_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "orgs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "safety_briefings_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "safety_briefings_shift_id_fkey"
            columns: ["shift_id"]
            isOneToOne: false
            referencedRelation: "shifts"
            referencedColumns: ["id"]
          },
        ]
      }
      service_request_events: {
        Row: {
          actor_id: string | null
          id: string
          kind: string
          occurred_at: string
          org_id: string
          payload: Json
          request_id: string
        }
        Insert: {
          actor_id?: string | null
          id?: string
          kind: string
          occurred_at?: string
          org_id: string
          payload?: Json
          request_id: string
        }
        Update: {
          actor_id?: string | null
          id?: string
          kind?: string
          occurred_at?: string
          org_id?: string
          payload?: Json
          request_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "service_request_events_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "orgs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "service_request_events_request_id_fkey"
            columns: ["request_id"]
            isOneToOne: false
            referencedRelation: "service_requests"
            referencedColumns: ["id"]
          },
        ]
      }
      service_requests: {
        Row: {
          acknowledged_at: string | null
          assigned_to: string | null
          cancelled_at: string | null
          category: string
          created_at: string
          description: string | null
          id: string
          metadata: Json
          opened_at: string
          org_id: string
          photos: Json
          project_id: string | null
          requester_email: string | null
          requester_id: string | null
          requester_name: string | null
          resolution_note: string | null
          resolved_at: string | null
          severity: string
          sla_resolution_breached: boolean
          sla_resolution_due: string | null
          sla_response_breached: boolean
          sla_response_due: string | null
          status: string
          summary: string
          updated_at: string
          venue_id: string | null
          zone_id: string | null
        }
        Insert: {
          acknowledged_at?: string | null
          assigned_to?: string | null
          cancelled_at?: string | null
          category: string
          created_at?: string
          description?: string | null
          id?: string
          metadata?: Json
          opened_at?: string
          org_id: string
          photos?: Json
          project_id?: string | null
          requester_email?: string | null
          requester_id?: string | null
          requester_name?: string | null
          resolution_note?: string | null
          resolved_at?: string | null
          severity?: string
          sla_resolution_breached?: boolean
          sla_resolution_due?: string | null
          sla_response_breached?: boolean
          sla_response_due?: string | null
          status?: string
          summary: string
          updated_at?: string
          venue_id?: string | null
          zone_id?: string | null
        }
        Update: {
          acknowledged_at?: string | null
          assigned_to?: string | null
          cancelled_at?: string | null
          category?: string
          created_at?: string
          description?: string | null
          id?: string
          metadata?: Json
          opened_at?: string
          org_id?: string
          photos?: Json
          project_id?: string | null
          requester_email?: string | null
          requester_id?: string | null
          requester_name?: string | null
          resolution_note?: string | null
          resolved_at?: string | null
          severity?: string
          sla_resolution_breached?: boolean
          sla_resolution_due?: string | null
          sla_response_breached?: boolean
          sla_response_due?: string | null
          status?: string
          summary?: string
          updated_at?: string
          venue_id?: string | null
          zone_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "service_requests_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "orgs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "service_requests_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "service_requests_venue_id_fkey"
            columns: ["venue_id"]
            isOneToOne: false
            referencedRelation: "venues"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "service_requests_zone_id_fkey"
            columns: ["zone_id"]
            isOneToOne: false
            referencedRelation: "venue_zones"
            referencedColumns: ["id"]
          },
        ]
      }
      service_sla_policies: {
        Row: {
          active: boolean
          business_hours_only: boolean
          created_at: string
          id: string
          org_id: string
          resolution_minutes: number
          response_minutes: number
          severity: string
          updated_at: string
        }
        Insert: {
          active?: boolean
          business_hours_only?: boolean
          created_at?: string
          id?: string
          org_id: string
          resolution_minutes: number
          response_minutes: number
          severity: string
          updated_at?: string
        }
        Update: {
          active?: boolean
          business_hours_only?: boolean
          created_at?: string
          id?: string
          org_id?: string
          resolution_minutes?: number
          response_minutes?: number
          severity?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "service_sla_policies_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "orgs"
            referencedColumns: ["id"]
          },
        ]
      }
      shifts: {
        Row: {
          attendance: Database["public"]["Enums"]["shift_attendance"]
          break_minutes: number
          checked_in_at: string | null
          checked_out_at: string | null
          created_at: string
          ends_at: string
          id: string
          meal_credit: boolean
          org_id: string
          role: string | null
          roster_id: string | null
          starts_at: string
          venue_id: string | null
          workforce_member_id: string | null
          zone_id: string | null
        }
        Insert: {
          attendance?: Database["public"]["Enums"]["shift_attendance"]
          break_minutes?: number
          checked_in_at?: string | null
          checked_out_at?: string | null
          created_at?: string
          ends_at: string
          id?: string
          meal_credit?: boolean
          org_id: string
          role?: string | null
          roster_id?: string | null
          starts_at: string
          venue_id?: string | null
          workforce_member_id?: string | null
          zone_id?: string | null
        }
        Update: {
          attendance?: Database["public"]["Enums"]["shift_attendance"]
          break_minutes?: number
          checked_in_at?: string | null
          checked_out_at?: string | null
          created_at?: string
          ends_at?: string
          id?: string
          meal_credit?: boolean
          org_id?: string
          role?: string | null
          roster_id?: string | null
          starts_at?: string
          venue_id?: string | null
          workforce_member_id?: string | null
          zone_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "shifts_roster_id_fkey"
            columns: ["roster_id"]
            isOneToOne: false
            referencedRelation: "rosters"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "shifts_venue_id_fkey"
            columns: ["venue_id"]
            isOneToOne: false
            referencedRelation: "venues"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "shifts_workforce_member_id_fkey"
            columns: ["workforce_member_id"]
            isOneToOne: false
            referencedRelation: "workforce_members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "shifts_zone_id_fkey"
            columns: ["zone_id"]
            isOneToOne: false
            referencedRelation: "venue_zones"
            referencedColumns: ["id"]
          },
        ]
      }
      site_plan_pins: {
        Row: {
          created_at: string
          created_by: string | null
          id: string
          label: string | null
          link_record_id: string | null
          link_record_type: string | null
          org_id: string
          pin_type: string
          site_plan_id: string
          x_pct: number
          y_pct: number
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          id?: string
          label?: string | null
          link_record_id?: string | null
          link_record_type?: string | null
          org_id: string
          pin_type: string
          site_plan_id: string
          x_pct: number
          y_pct: number
        }
        Update: {
          created_at?: string
          created_by?: string | null
          id?: string
          label?: string | null
          link_record_id?: string | null
          link_record_type?: string | null
          org_id?: string
          pin_type?: string
          site_plan_id?: string
          x_pct?: number
          y_pct?: number
        }
        Relationships: [
          {
            foreignKeyName: "site_plan_pins_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "site_plan_pins_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "orgs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "site_plan_pins_site_plan_id_fkey"
            columns: ["site_plan_id"]
            isOneToOne: false
            referencedRelation: "site_plans"
            referencedColumns: ["id"]
          },
        ]
      }
      site_plan_revisions: {
        Row: {
          created_at: string
          file_path: string
          id: string
          notes: string | null
          org_id: string
          revision_label: string
          site_plan_id: string
          uploaded_at: string
          uploaded_by: string | null
        }
        Insert: {
          created_at?: string
          file_path: string
          id?: string
          notes?: string | null
          org_id: string
          revision_label: string
          site_plan_id: string
          uploaded_at?: string
          uploaded_by?: string | null
        }
        Update: {
          created_at?: string
          file_path?: string
          id?: string
          notes?: string | null
          org_id?: string
          revision_label?: string
          site_plan_id?: string
          uploaded_at?: string
          uploaded_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "site_plan_revisions_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "orgs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "site_plan_revisions_site_plan_id_fkey"
            columns: ["site_plan_id"]
            isOneToOne: false
            referencedRelation: "site_plans"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "site_plan_revisions_uploaded_by_fkey"
            columns: ["uploaded_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      site_plans: {
        Row: {
          code: string
          created_at: string
          created_by: string | null
          current_revision_id: string | null
          discipline: string
          id: string
          notes: string | null
          org_id: string
          project_id: string | null
          title: string
          venue_id: string | null
        }
        Insert: {
          code: string
          created_at?: string
          created_by?: string | null
          current_revision_id?: string | null
          discipline?: string
          id?: string
          notes?: string | null
          org_id: string
          project_id?: string | null
          title: string
          venue_id?: string | null
        }
        Update: {
          code?: string
          created_at?: string
          created_by?: string | null
          current_revision_id?: string | null
          discipline?: string
          id?: string
          notes?: string | null
          org_id?: string
          project_id?: string | null
          title?: string
          venue_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "site_plans_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "site_plans_current_revision_fk"
            columns: ["current_revision_id"]
            isOneToOne: false
            referencedRelation: "site_plan_revisions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "site_plans_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "orgs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "site_plans_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "site_plans_venue_id_fkey"
            columns: ["venue_id"]
            isOneToOne: false
            referencedRelation: "venues"
            referencedColumns: ["id"]
          },
        ]
      }
      sponsor_entitlements: {
        Row: {
          created_at: string
          delivered: number
          due_by: string | null
          evidence_path: string | null
          id: string
          org_id: string
          quantity: number
          sponsor_client_id: string | null
          status: string
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          delivered?: number
          due_by?: string | null
          evidence_path?: string | null
          id?: string
          org_id: string
          quantity?: number
          sponsor_client_id?: string | null
          status?: string
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          delivered?: number
          due_by?: string | null
          evidence_path?: string | null
          id?: string
          org_id?: string
          quantity?: number
          sponsor_client_id?: string | null
          status?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      stage_plots: {
        Row: {
          created_at: string
          created_by: string | null
          deleted_at: string | null
          depth_ft: number | null
          elements: Json
          id: string
          name: string
          notes: string | null
          org_id: string
          project_id: string
          svg_url: string | null
          updated_at: string
          width_ft: number | null
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          depth_ft?: number | null
          elements?: Json
          id?: string
          name: string
          notes?: string | null
          org_id: string
          project_id: string
          svg_url?: string | null
          updated_at?: string
          width_ft?: number | null
        }
        Update: {
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          depth_ft?: number | null
          elements?: Json
          id?: string
          name?: string
          notes?: string | null
          org_id?: string
          project_id?: string
          svg_url?: string | null
          updated_at?: string
          width_ft?: number | null
        }
        Relationships: []
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
      submittal_revisions: {
        Row: {
          created_at: string
          file_path: string | null
          id: string
          org_id: string
          round: number
          stamp: string
          stamp_notes: string | null
          stamped_at: string | null
          stamped_by: string | null
          submittal_id: string
          submitted_at: string
          submitted_by: string | null
        }
        Insert: {
          created_at?: string
          file_path?: string | null
          id?: string
          org_id: string
          round: number
          stamp?: string
          stamp_notes?: string | null
          stamped_at?: string | null
          stamped_by?: string | null
          submittal_id: string
          submitted_at?: string
          submitted_by?: string | null
        }
        Update: {
          created_at?: string
          file_path?: string | null
          id?: string
          org_id?: string
          round?: number
          stamp?: string
          stamp_notes?: string | null
          stamped_at?: string | null
          stamped_by?: string | null
          submittal_id?: string
          submitted_at?: string
          submitted_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "submittal_revisions_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "orgs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "submittal_revisions_stamped_by_fkey"
            columns: ["stamped_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "submittal_revisions_submittal_id_fkey"
            columns: ["submittal_id"]
            isOneToOne: false
            referencedRelation: "submittals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "submittal_revisions_submitted_by_fkey"
            columns: ["submitted_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      submittals: {
        Row: {
          ball_in_court_id: string | null
          closed_at: string | null
          code: string
          created_at: string
          created_by: string | null
          current_round: number
          due_at: string | null
          id: string
          org_id: string
          project_id: string
          spec_section: string | null
          status: string
          submitted_at: string | null
          title: string
          vendor_id: string | null
        }
        Insert: {
          ball_in_court_id?: string | null
          closed_at?: string | null
          code: string
          created_at?: string
          created_by?: string | null
          current_round?: number
          due_at?: string | null
          id?: string
          org_id: string
          project_id: string
          spec_section?: string | null
          status?: string
          submitted_at?: string | null
          title: string
          vendor_id?: string | null
        }
        Update: {
          ball_in_court_id?: string | null
          closed_at?: string | null
          code?: string
          created_at?: string
          created_by?: string | null
          current_round?: number
          due_at?: string | null
          id?: string
          org_id?: string
          project_id?: string
          spec_section?: string | null
          status?: string
          submitted_at?: string | null
          title?: string
          vendor_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "submittals_ball_in_court_id_fkey"
            columns: ["ball_in_court_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "submittals_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "submittals_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "orgs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "submittals_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "submittals_vendor_id_fkey"
            columns: ["vendor_id"]
            isOneToOne: false
            referencedRelation: "vendors"
            referencedColumns: ["id"]
          },
        ]
      }
      sustainability_metrics: {
        Row: {
          created_at: string
          id: string
          kg_co2e: number
          method: string | null
          org_id: string
          period_end: string
          period_start: string
          scope: number
          source: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          kg_co2e?: number
          method?: string | null
          org_id: string
          period_end: string
          period_start: string
          scope?: number
          source?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          kg_co2e?: number
          method?: string | null
          org_id?: string
          period_end?: string
          period_start?: string
          scope?: number
          source?: string | null
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
      threats: {
        Row: {
          active: boolean
          classification: string
          code: string
          created_at: string
          description: string | null
          id: string
          likelihood: string
          org_id: string
          owner_id: string | null
          severity: string
          status: string
          title: string
          treatment: string
          updated_at: string
        }
        Insert: {
          active?: boolean
          classification?: string
          code: string
          created_at?: string
          description?: string | null
          id?: string
          likelihood: string
          org_id: string
          owner_id?: string | null
          severity: string
          status?: string
          title: string
          treatment?: string
          updated_at?: string
        }
        Update: {
          active?: boolean
          classification?: string
          code?: string
          created_at?: string
          description?: string | null
          id?: string
          likelihood?: string
          org_id?: string
          owner_id?: string | null
          severity?: string
          status?: string
          title?: string
          treatment?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "threats_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "orgs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "threats_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "users"
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
      ticket_types: {
        Row: {
          allocation: number
          channel: string
          created_at: string
          currency: string
          event_id: string | null
          id: string
          name: string
          org_id: string
          price_cents: number
          sold: number
        }
        Insert: {
          allocation?: number
          channel?: string
          created_at?: string
          currency?: string
          event_id?: string | null
          id?: string
          name: string
          org_id: string
          price_cents?: number
          sold?: number
        }
        Update: {
          allocation?: number
          channel?: string
          created_at?: string
          currency?: string
          event_id?: string | null
          id?: string
          name?: string
          org_id?: string
          price_cents?: number
          sold?: number
        }
        Relationships: []
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
          cost_code_id: string | null
          created_at: string
          description: string | null
          duration_minutes: number | null
          ended_at: string | null
          id: string
          org_id: string
          project_id: string | null
          rate_cents: number | null
          started_at: string
          updated_at: string
          user_id: string
        }
        Insert: {
          billable?: boolean
          cost_code_id?: string | null
          created_at?: string
          description?: string | null
          duration_minutes?: number | null
          ended_at?: string | null
          id?: string
          org_id: string
          project_id?: string | null
          rate_cents?: number | null
          started_at: string
          updated_at?: string
          user_id: string
        }
        Update: {
          billable?: boolean
          cost_code_id?: string | null
          created_at?: string
          description?: string | null
          duration_minutes?: number | null
          ended_at?: string | null
          id?: string
          org_id?: string
          project_id?: string | null
          rate_cents?: number | null
          started_at?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "time_entries_cost_code_id_fkey"
            columns: ["cost_code_id"]
            isOneToOne: false
            referencedRelation: "cost_codes"
            referencedColumns: ["id"]
          },
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
      trademarks: {
        Row: {
          created_at: string
          expires_on: string | null
          id: string
          jurisdiction: string | null
          mark: string
          org_id: string
          registered_on: string | null
          registration_no: string | null
          status: string
        }
        Insert: {
          created_at?: string
          expires_on?: string | null
          id?: string
          jurisdiction?: string | null
          mark: string
          org_id: string
          registered_on?: string | null
          registration_no?: string | null
          status?: string
        }
        Update: {
          created_at?: string
          expires_on?: string | null
          id?: string
          jurisdiction?: string | null
          mark?: string
          org_id?: string
          registered_on?: string | null
          registration_no?: string | null
          status?: string
        }
        Relationships: []
      }
      usage_events: {
        Row: {
          actor_id: string | null
          id: string
          metadata: Json
          metric: string
          occurred_at: string
          org_id: string
          quantity: number
          unit: string
        }
        Insert: {
          actor_id?: string | null
          id?: string
          metadata?: Json
          metric: string
          occurred_at?: string
          org_id: string
          quantity: number
          unit: string
        }
        Update: {
          actor_id?: string | null
          id?: string
          metadata?: Json
          metric?: string
          occurred_at?: string
          org_id?: string
          quantity?: number
          unit?: string
        }
        Relationships: []
      }
      usage_rollups: {
        Row: {
          bucket_duration_s: number
          bucket_start: string
          metric: string
          org_id: string
          quantity: number
          unit: string
          updated_at: string
        }
        Insert: {
          bucket_duration_s?: number
          bucket_start: string
          metric: string
          org_id: string
          quantity: number
          unit: string
          updated_at?: string
        }
        Update: {
          bucket_duration_s?: number
          bucket_start?: string
          metric?: string
          org_id?: string
          quantity?: number
          unit?: string
          updated_at?: string
        }
        Relationships: []
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
      vendor_prequalification_answers: {
        Row: {
          answer: string | null
          attachment_path: string | null
          created_at: string
          id: string
          org_id: string
          question_id: string
          score: number | null
          vendor_prequalification_id: string
        }
        Insert: {
          answer?: string | null
          attachment_path?: string | null
          created_at?: string
          id?: string
          org_id: string
          question_id: string
          score?: number | null
          vendor_prequalification_id: string
        }
        Update: {
          answer?: string | null
          attachment_path?: string | null
          created_at?: string
          id?: string
          org_id?: string
          question_id?: string
          score?: number | null
          vendor_prequalification_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "vendor_prequalification_answers_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "orgs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vendor_prequalification_answers_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "prequalification_questions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vendor_prequalification_answers_vendor_prequalification_id_fkey"
            columns: ["vendor_prequalification_id"]
            isOneToOne: false
            referencedRelation: "vendor_prequalifications"
            referencedColumns: ["id"]
          },
        ]
      }
      vendor_prequalifications: {
        Row: {
          approved_at: string | null
          approved_by: string | null
          created_at: string
          expires_at: string | null
          id: string
          notes: string | null
          org_id: string
          questionnaire_id: string
          score: number | null
          status: string
          submitted_at: string | null
          vendor_id: string
        }
        Insert: {
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string
          expires_at?: string | null
          id?: string
          notes?: string | null
          org_id: string
          questionnaire_id: string
          score?: number | null
          status?: string
          submitted_at?: string | null
          vendor_id: string
        }
        Update: {
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string
          expires_at?: string | null
          id?: string
          notes?: string | null
          org_id?: string
          questionnaire_id?: string
          score?: number | null
          status?: string
          submitted_at?: string | null
          vendor_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "vendor_prequalifications_approved_by_fkey"
            columns: ["approved_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vendor_prequalifications_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "orgs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vendor_prequalifications_questionnaire_id_fkey"
            columns: ["questionnaire_id"]
            isOneToOne: false
            referencedRelation: "prequalification_questionnaires"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vendor_prequalifications_vendor_id_fkey"
            columns: ["vendor_id"]
            isOneToOne: false
            referencedRelation: "vendors"
            referencedColumns: ["id"]
          },
        ]
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
      venue_build_log: {
        Row: {
          blockers: string | null
          created_at: string
          created_by: string | null
          id: string
          log_date: string
          org_id: string
          photos: Json
          summary: string
          trades_onsite: number | null
          venue_id: string
        }
        Insert: {
          blockers?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          log_date: string
          org_id: string
          photos?: Json
          summary: string
          trades_onsite?: number | null
          venue_id: string
        }
        Update: {
          blockers?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          log_date?: string
          org_id?: string
          photos?: Json
          summary?: string
          trades_onsite?: number | null
          venue_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "venue_build_log_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "venue_build_log_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "orgs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "venue_build_log_venue_id_fkey"
            columns: ["venue_id"]
            isOneToOne: false
            referencedRelation: "venues"
            referencedColumns: ["id"]
          },
        ]
      }
      venue_certifications: {
        Row: {
          certificate: string
          created_at: string
          expires_on: string | null
          file_path: string | null
          id: string
          issued_on: string | null
          issuer: string
          org_id: string
          venue_id: string
        }
        Insert: {
          certificate: string
          created_at?: string
          expires_on?: string | null
          file_path?: string | null
          id?: string
          issued_on?: string | null
          issuer: string
          org_id: string
          venue_id: string
        }
        Update: {
          certificate?: string
          created_at?: string
          expires_on?: string | null
          file_path?: string | null
          id?: string
          issued_on?: string | null
          issuer?: string
          org_id?: string
          venue_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "venue_certifications_venue_id_fkey"
            columns: ["venue_id"]
            isOneToOne: false
            referencedRelation: "venues"
            referencedColumns: ["id"]
          },
        ]
      }
      venue_closeout_items: {
        Row: {
          assignee_id: string | null
          category: string
          completed_at: string | null
          created_at: string
          created_by: string | null
          description: string
          due_at: string | null
          id: string
          notes: string | null
          org_id: string
          status: string
          updated_at: string
          venue_id: string
        }
        Insert: {
          assignee_id?: string | null
          category: string
          completed_at?: string | null
          created_at?: string
          created_by?: string | null
          description: string
          due_at?: string | null
          id?: string
          notes?: string | null
          org_id: string
          status?: string
          updated_at?: string
          venue_id: string
        }
        Update: {
          assignee_id?: string | null
          category?: string
          completed_at?: string | null
          created_at?: string
          created_by?: string | null
          description?: string
          due_at?: string | null
          id?: string
          notes?: string | null
          org_id?: string
          status?: string
          updated_at?: string
          venue_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "venue_closeout_items_assignee_id_fkey"
            columns: ["assignee_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "venue_closeout_items_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "venue_closeout_items_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "orgs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "venue_closeout_items_venue_id_fkey"
            columns: ["venue_id"]
            isOneToOne: false
            referencedRelation: "venues"
            referencedColumns: ["id"]
          },
        ]
      }
      venue_design_specs: {
        Row: {
          bom_requisition_id: string | null
          created_at: string
          created_by: string | null
          discipline: string
          file_path: string | null
          id: string
          notes: string | null
          org_id: string
          revision: string
          status: string
          title: string
          updated_at: string
          venue_id: string
        }
        Insert: {
          bom_requisition_id?: string | null
          created_at?: string
          created_by?: string | null
          discipline: string
          file_path?: string | null
          id?: string
          notes?: string | null
          org_id: string
          revision?: string
          status?: string
          title: string
          updated_at?: string
          venue_id: string
        }
        Update: {
          bom_requisition_id?: string | null
          created_at?: string
          created_by?: string | null
          discipline?: string
          file_path?: string | null
          id?: string
          notes?: string | null
          org_id?: string
          revision?: string
          status?: string
          title?: string
          updated_at?: string
          venue_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "venue_design_specs_bom_requisition_id_fkey"
            columns: ["bom_requisition_id"]
            isOneToOne: false
            referencedRelation: "requisitions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "venue_design_specs_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "venue_design_specs_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "orgs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "venue_design_specs_venue_id_fkey"
            columns: ["venue_id"]
            isOneToOne: false
            referencedRelation: "venues"
            referencedColumns: ["id"]
          },
        ]
      }
      venue_handover_items: {
        Row: {
          assignee_id: string | null
          category: string
          created_at: string
          created_by: string | null
          description: string
          due_at: string | null
          file_path: string | null
          id: string
          notes: string | null
          org_id: string
          resolved_at: string | null
          status: string
          updated_at: string
          venue_id: string
        }
        Insert: {
          assignee_id?: string | null
          category: string
          created_at?: string
          created_by?: string | null
          description: string
          due_at?: string | null
          file_path?: string | null
          id?: string
          notes?: string | null
          org_id: string
          resolved_at?: string | null
          status?: string
          updated_at?: string
          venue_id: string
        }
        Update: {
          assignee_id?: string | null
          category?: string
          created_at?: string
          created_by?: string | null
          description?: string
          due_at?: string | null
          file_path?: string | null
          id?: string
          notes?: string | null
          org_id?: string
          resolved_at?: string | null
          status?: string
          updated_at?: string
          venue_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "venue_handover_items_assignee_id_fkey"
            columns: ["assignee_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "venue_handover_items_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "venue_handover_items_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "orgs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "venue_handover_items_venue_id_fkey"
            columns: ["venue_id"]
            isOneToOne: false
            referencedRelation: "venues"
            referencedColumns: ["id"]
          },
        ]
      }
      venue_vop_sections: {
        Row: {
          approved_at: string | null
          approved_by: string | null
          body: string | null
          created_at: string
          id: string
          org_id: string
          section_key: string
          status: string
          title: string
          updated_at: string
          venue_id: string
        }
        Insert: {
          approved_at?: string | null
          approved_by?: string | null
          body?: string | null
          created_at?: string
          id?: string
          org_id: string
          section_key: string
          status?: string
          title: string
          updated_at?: string
          venue_id: string
        }
        Update: {
          approved_at?: string | null
          approved_by?: string | null
          body?: string | null
          created_at?: string
          id?: string
          org_id?: string
          section_key?: string
          status?: string
          title?: string
          updated_at?: string
          venue_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "venue_vop_sections_approved_by_fkey"
            columns: ["approved_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "venue_vop_sections_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "orgs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "venue_vop_sections_venue_id_fkey"
            columns: ["venue_id"]
            isOneToOne: false
            referencedRelation: "venues"
            referencedColumns: ["id"]
          },
        ]
      }
      venue_zones: {
        Row: {
          allowed_categories: Json
          code: string
          created_at: string
          id: string
          name: string
          org_id: string
          parent_zone_id: string | null
          venue_id: string
        }
        Insert: {
          allowed_categories?: Json
          code: string
          created_at?: string
          id?: string
          name: string
          org_id: string
          parent_zone_id?: string | null
          venue_id: string
        }
        Update: {
          allowed_categories?: Json
          code?: string
          created_at?: string
          id?: string
          name?: string
          org_id?: string
          parent_zone_id?: string | null
          venue_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "venue_zones_parent_zone_id_fkey"
            columns: ["parent_zone_id"]
            isOneToOne: false
            referencedRelation: "venue_zones"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "venue_zones_venue_id_fkey"
            columns: ["venue_id"]
            isOneToOne: false
            referencedRelation: "venues"
            referencedColumns: ["id"]
          },
        ]
      }
      venues: {
        Row: {
          capacity: number | null
          cluster: string | null
          created_at: string
          handover_state: Database["public"]["Enums"]["handover_state"]
          id: string
          kind: Database["public"]["Enums"]["venue_kind"]
          location_id: string | null
          metadata: Json
          name: string
          org_id: string
          project_id: string | null
          updated_at: string
        }
        Insert: {
          capacity?: number | null
          cluster?: string | null
          created_at?: string
          handover_state?: Database["public"]["Enums"]["handover_state"]
          id?: string
          kind?: Database["public"]["Enums"]["venue_kind"]
          location_id?: string | null
          metadata?: Json
          name: string
          org_id: string
          project_id?: string | null
          updated_at?: string
        }
        Update: {
          capacity?: number | null
          cluster?: string | null
          created_at?: string
          handover_state?: Database["public"]["Enums"]["handover_state"]
          id?: string
          kind?: Database["public"]["Enums"]["venue_kind"]
          location_id?: string | null
          metadata?: Json
          name?: string
          org_id?: string
          project_id?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      visa_cases: {
        Row: {
          created_at: string
          delegation_id: string | null
          id: string
          letter_path: string | null
          nationality: string | null
          org_id: string
          passport_no: string | null
          person_name: string
          status: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          delegation_id?: string | null
          id?: string
          letter_path?: string | null
          nationality?: string | null
          org_id: string
          passport_no?: string | null
          person_name: string
          status?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          delegation_id?: string | null
          id?: string
          letter_path?: string | null
          nationality?: string | null
          org_id?: string
          passport_no?: string | null
          person_name?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "visa_cases_delegation_id_fkey"
            columns: ["delegation_id"]
            isOneToOne: false
            referencedRelation: "delegations"
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
      webhook_deliveries: {
        Row: {
          attempts: number
          created_at: string
          delivered_at: string | null
          endpoint_id: string
          event_type: string
          id: string
          last_error: string | null
          last_status: number | null
          max_attempts: number
          next_attempt_at: string
          org_id: string
          payload: Json
          state: string
        }
        Insert: {
          attempts?: number
          created_at?: string
          delivered_at?: string | null
          endpoint_id: string
          event_type: string
          id?: string
          last_error?: string | null
          last_status?: number | null
          max_attempts?: number
          next_attempt_at?: string
          org_id: string
          payload: Json
          state?: string
        }
        Update: {
          attempts?: number
          created_at?: string
          delivered_at?: string | null
          endpoint_id?: string
          event_type?: string
          id?: string
          last_error?: string | null
          last_status?: number | null
          max_attempts?: number
          next_attempt_at?: string
          org_id?: string
          payload?: Json
          state?: string
        }
        Relationships: [
          {
            foreignKeyName: "webhook_deliveries_endpoint_id_fkey"
            columns: ["endpoint_id"]
            isOneToOne: false
            referencedRelation: "webhook_endpoints"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "webhook_deliveries_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "orgs"
            referencedColumns: ["id"]
          },
        ]
      }
      webhook_endpoints: {
        Row: {
          created_at: string
          created_by: string | null
          deleted_at: string | null
          description: string | null
          events: string[]
          failure_count: number
          id: string
          is_active: boolean
          last_delivery_at: string | null
          last_error: string | null
          org_id: string
          secret: string
          updated_at: string
          url: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          description?: string | null
          events?: string[]
          failure_count?: number
          id?: string
          is_active?: boolean
          last_delivery_at?: string | null
          last_error?: string | null
          org_id: string
          secret: string
          updated_at?: string
          url: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          description?: string | null
          events?: string[]
          failure_count?: number
          id?: string
          is_active?: boolean
          last_delivery_at?: string | null
          last_error?: string | null
          org_id?: string
          secret?: string
          updated_at?: string
          url?: string
        }
        Relationships: [
          {
            foreignKeyName: "webhook_endpoints_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "webhook_endpoints_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "orgs"
            referencedColumns: ["id"]
          },
        ]
      }
      work_order_broadcast_invites: {
        Row: {
          broadcast_id: string
          created_at: string
          id: string
          notes: string | null
          org_id: string
          responded_at: string | null
          status: string
          vendor_id: string
        }
        Insert: {
          broadcast_id: string
          created_at?: string
          id?: string
          notes?: string | null
          org_id: string
          responded_at?: string | null
          status?: string
          vendor_id: string
        }
        Update: {
          broadcast_id?: string
          created_at?: string
          id?: string
          notes?: string | null
          org_id?: string
          responded_at?: string | null
          status?: string
          vendor_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "work_order_broadcast_invites_broadcast_id_fkey"
            columns: ["broadcast_id"]
            isOneToOne: false
            referencedRelation: "work_order_broadcasts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "work_order_broadcast_invites_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "orgs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "work_order_broadcast_invites_vendor_id_fkey"
            columns: ["vendor_id"]
            isOneToOne: false
            referencedRelation: "vendors"
            referencedColumns: ["id"]
          },
        ]
      }
      work_order_broadcasts: {
        Row: {
          awarded_at: string | null
          awarded_by: string | null
          awarded_to_vendor_id: string | null
          budget_cents: number | null
          category: string | null
          code: string
          created_at: string
          created_by: string | null
          description: string | null
          id: string
          needed_by: string | null
          org_id: string
          project_id: string | null
          requisition_id: string | null
          status: string
          title: string
        }
        Insert: {
          awarded_at?: string | null
          awarded_by?: string | null
          awarded_to_vendor_id?: string | null
          budget_cents?: number | null
          category?: string | null
          code: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          needed_by?: string | null
          org_id: string
          project_id?: string | null
          requisition_id?: string | null
          status?: string
          title: string
        }
        Update: {
          awarded_at?: string | null
          awarded_by?: string | null
          awarded_to_vendor_id?: string | null
          budget_cents?: number | null
          category?: string | null
          code?: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          needed_by?: string | null
          org_id?: string
          project_id?: string | null
          requisition_id?: string | null
          status?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "work_order_broadcasts_awarded_by_fkey"
            columns: ["awarded_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "work_order_broadcasts_awarded_to_vendor_id_fkey"
            columns: ["awarded_to_vendor_id"]
            isOneToOne: false
            referencedRelation: "vendors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "work_order_broadcasts_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "work_order_broadcasts_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "orgs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "work_order_broadcasts_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "work_order_broadcasts_requisition_id_fkey"
            columns: ["requisition_id"]
            isOneToOne: false
            referencedRelation: "requisitions"
            referencedColumns: ["id"]
          },
        ]
      }
      workforce_deployments: {
        Row: {
          actual_fte: number
          created_at: string
          functional_area: string | null
          id: string
          org_id: string
          planned_fte: number
          shift_window: unknown
          venue_id: string
          zone_id: string | null
        }
        Insert: {
          actual_fte?: number
          created_at?: string
          functional_area?: string | null
          id?: string
          org_id: string
          planned_fte?: number
          shift_window?: unknown
          venue_id: string
          zone_id?: string | null
        }
        Update: {
          actual_fte?: number
          created_at?: string
          functional_area?: string | null
          id?: string
          org_id?: string
          planned_fte?: number
          shift_window?: unknown
          venue_id?: string
          zone_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "workforce_deployments_venue_id_fkey"
            columns: ["venue_id"]
            isOneToOne: false
            referencedRelation: "venues"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "workforce_deployments_zone_id_fkey"
            columns: ["zone_id"]
            isOneToOne: false
            referencedRelation: "venue_zones"
            referencedColumns: ["id"]
          },
        ]
      }
      workforce_members: {
        Row: {
          created_at: string
          email: string | null
          full_name: string
          id: string
          kind: Database["public"]["Enums"]["workforce_kind"]
          metadata: Json
          org_id: string
          phone: string | null
          role: string | null
          skills: Json
          updated_at: string
          user_id: string | null
          venue_id: string | null
        }
        Insert: {
          created_at?: string
          email?: string | null
          full_name: string
          id?: string
          kind?: Database["public"]["Enums"]["workforce_kind"]
          metadata?: Json
          org_id: string
          phone?: string | null
          role?: string | null
          skills?: Json
          updated_at?: string
          user_id?: string | null
          venue_id?: string | null
        }
        Update: {
          created_at?: string
          email?: string | null
          full_name?: string
          id?: string
          kind?: Database["public"]["Enums"]["workforce_kind"]
          metadata?: Json
          org_id?: string
          phone?: string | null
          role?: string | null
          skills?: Json
          updated_at?: string
          user_id?: string | null
          venue_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "workforce_members_venue_id_fkey"
            columns: ["venue_id"]
            isOneToOne: false
            referencedRelation: "venues"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      offer_letters_resolved: {
        Row: {
          accepted_at: string | null
          accepted_ip: unknown
          accepted_signature: string | null
          accepted_user_agent: string | null
          access_code: string | null
          classification:
            | Database["public"]["Enums"]["offer_letter_classification"]
            | null
          compensation_basis:
            | Database["public"]["Enums"]["compensation_basis"]
            | null
          created_at: string | null
          created_by: string | null
          crew_member_id: string | null
          decline_reason: string | null
          declined_at: string | null
          effective_compensation_cents: number | null
          effective_confidentiality: boolean | null
          effective_end: string | null
          effective_expectations: string | null
          effective_governing_law: string | null
          effective_inclusions: Json | null
          effective_lodging_provided: boolean | null
          effective_meals_provided: boolean | null
          effective_payment_schedule: string | null
          effective_per_diem_cents: number | null
          effective_start: string | null
          effective_terms: string | null
          effective_travel_provided: boolean | null
          employer: Database["public"]["Enums"]["offer_letter_employer"] | null
          engagement_days: number | null
          engagement_end: string | null
          engagement_start: string | null
          expectations_override: string | null
          extra_inclusions: Json | null
          first_viewed_at: string | null
          id: string | null
          last_viewed_at: string | null
          lodging_provided: boolean | null
          meals_provided: boolean | null
          org_id: string | null
          override_amount_cents: number | null
          override_per_diem_cents: number | null
          per_diem_rate_card_item_id: string | null
          per_diem_sku: string | null
          per_diem_unit_price_cents: number | null
          project_end_date: string | null
          project_id: string | null
          project_name: string | null
          project_slug: string | null
          project_start_date: string | null
          public_token: string | null
          rate_card_item_id: string | null
          rate_name: string | null
          rate_sku: string | null
          rate_unit_price_cents: number | null
          recipient_email: string | null
          recipient_name: string | null
          recipient_phone: string | null
          recipient_user_id: string | null
          reports_to_crew_member_id: string | null
          reports_to_email: string | null
          reports_to_name: string | null
          reports_to_phone: string | null
          role_department: string | null
          role_description: string | null
          role_id: string | null
          role_responsibilities: Json | null
          role_slug: string | null
          role_title: string | null
          sent_at: string | null
          signing_authority_email: string | null
          signing_authority_name: string | null
          snapshot: Json | null
          snapshot_at: string | null
          status: Database["public"]["Enums"]["offer_letter_status"] | null
          terms_override: string | null
          token_expires_at: string | null
          travel_provided: boolean | null
          updated_at: string | null
          venue_address: string | null
          venue_city: string | null
          venue_country: string | null
          venue_id: string | null
          venue_name: string | null
          venue_region: string | null
          view_count: number | null
          withdrawn_at: string | null
        }
        Relationships: [
          {
            foreignKeyName: "crew_members_user_id_fkey"
            columns: ["recipient_user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "offer_letters_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "offer_letters_crew_member_id_fkey"
            columns: ["crew_member_id"]
            isOneToOne: false
            referencedRelation: "crew_members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "offer_letters_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "orgs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "offer_letters_per_diem_rate_card_item_id_fkey"
            columns: ["per_diem_rate_card_item_id"]
            isOneToOne: false
            referencedRelation: "rate_card_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "offer_letters_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "offer_letters_rate_card_item_id_fkey"
            columns: ["rate_card_item_id"]
            isOneToOne: false
            referencedRelation: "rate_card_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "offer_letters_reports_to_crew_member_id_fkey"
            columns: ["reports_to_crew_member_id"]
            isOneToOne: false
            referencedRelation: "crew_members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "offer_letters_role_id_fkey"
            columns: ["role_id"]
            isOneToOne: false
            referencedRelation: "org_roles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "offer_letters_venue_id_fkey"
            columns: ["venue_id"]
            isOneToOne: false
            referencedRelation: "venues"
            referencedColumns: ["id"]
          },
        ]
      }
      v_action_items: {
        Row: {
          created_at: string | null
          due_at: string | null
          kind: string | null
          org_id: string | null
          owner_id: string | null
          priority: string | null
          project_id: string | null
          record_id: string | null
          status: string | null
          title: string | null
        }
        Relationships: []
      }
      v_budget_health: {
        Row: {
          budget_cents: number | null
          code: string | null
          committed_cents: number | null
          eac_cents: number | null
          forecast_cents: number | null
          id: string | null
          name: string | null
          org_id: string | null
          pct_spent: number | null
          project_id: string | null
          spent_cents: number | null
          variance_cents: number | null
        }
        Insert: {
          budget_cents?: number | null
          code?: string | null
          committed_cents?: number | null
          eac_cents?: never
          forecast_cents?: number | null
          id?: string | null
          name?: string | null
          org_id?: string | null
          pct_spent?: never
          project_id?: string | null
          spent_cents?: number | null
          variance_cents?: never
        }
        Update: {
          budget_cents?: number | null
          code?: string | null
          committed_cents?: number | null
          eac_cents?: never
          forecast_cents?: number | null
          id?: string | null
          name?: string | null
          org_id?: string | null
          pct_spent?: never
          project_id?: string | null
          spent_cents?: number | null
          variance_cents?: never
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
    }
    Functions: {
      accept_offer_letter: {
        Args: {
          p_code: string
          p_ip: unknown
          p_signature: string
          p_token: string
          p_user_agent: string
        }
        Returns: Json
      }
      auth_org_ids: { Args: never; Returns: string[] }
      auth_user_email: { Args: never; Returns: string }
      claim_jobs: {
        Args: { p_batch: number; p_visibility_s: number; p_worker: string }
        Returns: {
          attempts: number
          completed_at: string | null
          created_at: string
          dedup_key: string | null
          id: string
          last_error: string | null
          locked_by: string | null
          locked_until: string | null
          max_attempts: number
          org_id: string
          payload: Json
          run_at: string
          state: Database["public"]["Enums"]["job_state"]
          type: string
          updated_at: string
        }[]
        SetofOptions: {
          from: "*"
          to: "job_queue"
          isOneToOne: false
          isSetofReturn: true
        }
      }
      current_request_id: { Args: never; Returns: string }
      decline_offer_letter: {
        Args: { p_code: string; p_reason: string; p_token: string }
        Returns: Json
      }
      emit_notification: {
        Args: {
          p_body?: string
          p_event_type: string
          p_href?: string
          p_org_id: string
          p_payload?: Json
          p_title: string
          p_user_id: string
        }
        Returns: string
      }
      generate_offer_access_code: { Args: never; Returns: string }
      get_offer_letter_by_token: {
        Args: { p_code: string; p_token: string }
        Returns: Json
      }
      get_offer_letter_project_name: {
        Args: { p_code: string; p_token: string }
        Returns: string
      }
      has_org_role: {
        Args: { required: string[]; target_org: string }
        Returns: boolean
      }
      is_org_member: { Args: { target_org: string }; Returns: boolean }
      log_proposal_activity: {
        Args: {
          p_actor_id: string
          p_actor_label?: string
          p_kind: string
          p_meta?: Json
          p_org_id: string
          p_proposal_id: string
          p_summary?: string
          p_target_id?: string
          p_target_kind?: string
        }
        Returns: string
      }
      proposal_org_id: { Args: { p_id: string }; Returns: string }
      reclaim_stuck_jobs: { Args: never; Returns: number }
      record_offer_letter_view: {
        Args: { p_code: string; p_token: string }
        Returns: undefined
      }
      seed_cornbread_abbey_road: {
        Args: { p_org_slug?: string }
        Returns: string
      }
      seed_salvage_city_ssot: { Args: { p_org_slug?: string }; Returns: number }
    }
    Enums: {
      accreditation_state:
        | "applied"
        | "vetting"
        | "approved"
        | "issued"
        | "suspended"
        | "revoked"
        | "expired"
      approval_state: "pending" | "signed" | "declined" | "expired"
      change_order_state:
        | "draft"
        | "requested"
        | "priced"
        | "client_review"
        | "approved"
        | "rejected"
        | "withdrawn"
      compensation_basis:
        | "per_day"
        | "per_show_day"
        | "flat_fee"
        | "hourly"
        | "tbd"
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
      dispatch_fleet: "t1" | "t2" | "t3" | "media" | "workforce" | "spectator"
      dsar_kind:
        | "access"
        | "deletion"
        | "correction"
        | "portability"
        | "objection"
      dsar_status:
        | "received"
        | "verifying"
        | "in_progress"
        | "fulfilled"
        | "rejected"
      equipment_status:
        | "available"
        | "reserved"
        | "in_use"
        | "maintenance"
        | "retired"
      event_status: "draft" | "scheduled" | "live" | "complete" | "cancelled"
      expense_status: "pending" | "approved" | "rejected" | "reimbursed"
      export_kind: "csv" | "json" | "xlsx" | "zip" | "project_archive"
      export_status: "pending" | "running" | "done" | "failed"
      guide_persona:
        | "artist"
        | "vendor"
        | "client"
        | "sponsor"
        | "guest"
        | "crew"
        | "staff"
        | "custom"
      handover_state:
        | "not_started"
        | "inspection"
        | "snag"
        | "sign_off"
        | "accepted"
        | "closeout"
      incident_severity: "near_miss" | "minor" | "major" | "critical"
      incident_status: "open" | "investigating" | "resolved" | "closed"
      invoice_status: "draft" | "sent" | "paid" | "overdue" | "voided"
      job_state: "pending" | "running" | "done" | "failed" | "dead"
      lead_stage:
        | "new"
        | "qualified"
        | "contacted"
        | "proposal"
        | "won"
        | "lost"
      offer_letter_classification: "w2" | "1099" | "agency" | "intern"
      offer_letter_employer: "ghxstship" | "five_senses" | "joint"
      offer_letter_status:
        | "draft"
        | "sent"
        | "viewed"
        | "accepted"
        | "declined"
        | "withdrawn"
        | "expired"
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
      proposal_phase_status:
        | "locked"
        | "active"
        | "in_review"
        | "approved"
        | "complete"
      proposal_status:
        | "draft"
        | "sent"
        | "approved"
        | "rejected"
        | "expired"
        | "signed"
      raid_kind: "risk" | "assumption" | "issue" | "dependency"
      req_status: "draft" | "submitted" | "approved" | "rejected" | "converted"
      revision_state:
        | "open"
        | "client_review"
        | "approved"
        | "changes_requested"
        | "rejected"
        | "withdrawn"
      risk_impact: "insignificant" | "minor" | "moderate" | "major" | "severe"
      risk_likelihood:
        | "rare"
        | "unlikely"
        | "possible"
        | "likely"
        | "almost_certain"
      risk_status: "open" | "mitigating" | "accepted" | "closed"
      roster_state: "draft" | "published" | "locked"
      shift_attendance:
        | "scheduled"
        | "checked_in"
        | "on_break"
        | "checked_out"
        | "no_show"
      task_status: "todo" | "in_progress" | "blocked" | "review" | "done"
      ticket_status: "issued" | "transferred" | "scanned" | "voided"
      tier: "access" | "core" | "professional" | "enterprise"
      venue_kind:
        | "competition"
        | "training"
        | "live_site"
        | "ibc"
        | "mpc"
        | "village"
        | "support"
      vetting_state: "pending" | "in_progress" | "clear" | "flagged" | "failed"
      workforce_kind: "paid_staff" | "volunteer" | "contractor" | "official"
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
      accreditation_state: [
        "applied",
        "vetting",
        "approved",
        "issued",
        "suspended",
        "revoked",
        "expired",
      ],
      approval_state: ["pending", "signed", "declined", "expired"],
      change_order_state: [
        "draft",
        "requested",
        "priced",
        "client_review",
        "approved",
        "rejected",
        "withdrawn",
      ],
      compensation_basis: [
        "per_day",
        "per_show_day",
        "flat_fee",
        "hourly",
        "tbd",
      ],
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
      dispatch_fleet: ["t1", "t2", "t3", "media", "workforce", "spectator"],
      dsar_kind: [
        "access",
        "deletion",
        "correction",
        "portability",
        "objection",
      ],
      dsar_status: [
        "received",
        "verifying",
        "in_progress",
        "fulfilled",
        "rejected",
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
      export_kind: ["csv", "json", "xlsx", "zip", "project_archive"],
      export_status: ["pending", "running", "done", "failed"],
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
      handover_state: [
        "not_started",
        "inspection",
        "snag",
        "sign_off",
        "accepted",
        "closeout",
      ],
      incident_severity: ["near_miss", "minor", "major", "critical"],
      incident_status: ["open", "investigating", "resolved", "closed"],
      invoice_status: ["draft", "sent", "paid", "overdue", "voided"],
      job_state: ["pending", "running", "done", "failed", "dead"],
      lead_stage: ["new", "qualified", "contacted", "proposal", "won", "lost"],
      offer_letter_classification: ["w2", "1099", "agency", "intern"],
      offer_letter_employer: ["ghxstship", "five_senses", "joint"],
      offer_letter_status: [
        "draft",
        "sent",
        "viewed",
        "accepted",
        "declined",
        "withdrawn",
        "expired",
      ],
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
      proposal_phase_status: [
        "locked",
        "active",
        "in_review",
        "approved",
        "complete",
      ],
      proposal_status: [
        "draft",
        "sent",
        "approved",
        "rejected",
        "expired",
        "signed",
      ],
      raid_kind: ["risk", "assumption", "issue", "dependency"],
      req_status: ["draft", "submitted", "approved", "rejected", "converted"],
      revision_state: [
        "open",
        "client_review",
        "approved",
        "changes_requested",
        "rejected",
        "withdrawn",
      ],
      risk_impact: ["insignificant", "minor", "moderate", "major", "severe"],
      risk_likelihood: [
        "rare",
        "unlikely",
        "possible",
        "likely",
        "almost_certain",
      ],
      risk_status: ["open", "mitigating", "accepted", "closed"],
      roster_state: ["draft", "published", "locked"],
      shift_attendance: [
        "scheduled",
        "checked_in",
        "on_break",
        "checked_out",
        "no_show",
      ],
      task_status: ["todo", "in_progress", "blocked", "review", "done"],
      ticket_status: ["issued", "transferred", "scanned", "voided"],
      tier: ["access", "core", "professional", "enterprise"],
      venue_kind: [
        "competition",
        "training",
        "live_site",
        "ibc",
        "mpc",
        "village",
        "support",
      ],
      vetting_state: ["pending", "in_progress", "clear", "flagged", "failed"],
      workforce_kind: ["paid_staff", "volunteer", "contractor", "official"],
    },
  },
} as const
