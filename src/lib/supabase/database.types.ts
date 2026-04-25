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
          created_at: string
          description: string | null
          id: string
          location: string | null
          occurred_at: string
          org_id: string
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
          created_at?: string
          description?: string | null
          id?: string
          location?: string | null
          occurred_at?: string
          org_id: string
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
          created_at?: string
          description?: string | null
          id?: string
          location?: string | null
          occurred_at?: string
          org_id?: string
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
      org_roles: {
        Row: {
          created_at: string
          description: string | null
          id: string
          is_system: boolean
          label: string
          org_id: string
          permissions: string[]
          slug: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          is_system?: boolean
          label: string
          org_id: string
          permissions?: string[]
          slug: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          is_system?: boolean
          label?: string
          org_id?: string
          permissions?: string[]
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
      [_ in never]: never
    }
    Functions: {
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
      has_org_role: {
        Args: { required: string[]; target_org: string }
        Returns: boolean
      }
      is_org_member: { Args: { target_org: string }; Returns: boolean }
      proposal_org_id: { Args: { p_id: string }; Returns: string }
      reclaim_stuck_jobs: { Args: never; Returns: number }
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
      raid_kind: "risk" | "assumption" | "issue" | "dependency"
      req_status: "draft" | "submitted" | "approved" | "rejected" | "converted"
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
      raid_kind: ["risk", "assumption", "issue", "dependency"],
      req_status: ["draft", "submitted", "approved", "rejected", "converted"],
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
