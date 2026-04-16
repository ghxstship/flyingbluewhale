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
      acts: {
        Row: {
          artist_name: string
          created_at: string
          id: string
          metadata: Json
          name: string
          project_id: string
          set_time_end: string | null
          set_time_start: string | null
          sort_order: number
          space_id: string | null
          status: string
        }
        Insert: {
          artist_name: string
          created_at?: string
          id?: string
          metadata?: Json
          name: string
          project_id: string
          set_time_end?: string | null
          set_time_start?: string | null
          sort_order?: number
          space_id?: string | null
          status?: string
        }
        Update: {
          artist_name?: string
          created_at?: string
          id?: string
          metadata?: Json
          name?: string
          project_id?: string
          set_time_end?: string | null
          set_time_start?: string | null
          sort_order?: number
          space_id?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "acts_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "acts_space_id_fkey"
            columns: ["space_id"]
            isOneToOne: false
            referencedRelation: "spaces"
            referencedColumns: ["id"]
          },
        ]
      }
      advance_categories: {
        Row: {
          description: string | null
          group_id: string
          id: string
          name: string
          slug: string
          sort_order: number
        }
        Insert: {
          description?: string | null
          group_id: string
          id?: string
          name: string
          slug: string
          sort_order?: number
        }
        Update: {
          description?: string | null
          group_id?: string
          id?: string
          name?: string
          slug?: string
          sort_order?: number
        }
        Relationships: [
          {
            foreignKeyName: "advance_categories_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "advance_category_groups"
            referencedColumns: ["id"]
          },
        ]
      }
      advance_category_groups: {
        Row: {
          description: string | null
          id: string
          name: string
          slug: string
          sort_order: number
        }
        Insert: {
          description?: string | null
          id?: string
          name: string
          slug: string
          sort_order?: number
        }
        Update: {
          description?: string | null
          id?: string
          name?: string
          slug?: string
          sort_order?: number
        }
        Relationships: []
      }
      advance_items: {
        Row: {
          created_at: string
          daily_rate: number | null
          description: string | null
          id: string
          image_url: string | null
          is_active: boolean
          manufacturer: string | null
          model: string | null
          name: string
          power_watts: number | null
          purchase_price: number | null
          sku: string | null
          slug: string
          specifications: Json
          subcategory_id: string
          unit: string
          updated_at: string
          visibility_tags: string[]
          weekly_rate: number | null
          weight_kg: number | null
        }
        Insert: {
          created_at?: string
          daily_rate?: number | null
          description?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean
          manufacturer?: string | null
          model?: string | null
          name: string
          power_watts?: number | null
          purchase_price?: number | null
          sku?: string | null
          slug: string
          specifications?: Json
          subcategory_id: string
          unit?: string
          updated_at?: string
          visibility_tags?: string[]
          weekly_rate?: number | null
          weight_kg?: number | null
        }
        Update: {
          created_at?: string
          daily_rate?: number | null
          description?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean
          manufacturer?: string | null
          model?: string | null
          name?: string
          power_watts?: number | null
          purchase_price?: number | null
          sku?: string | null
          slug?: string
          specifications?: Json
          subcategory_id?: string
          unit?: string
          updated_at?: string
          visibility_tags?: string[]
          weekly_rate?: number | null
          weight_kg?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "advance_items_subcategory_id_fkey"
            columns: ["subcategory_id"]
            isOneToOne: false
            referencedRelation: "advance_subcategories"
            referencedColumns: ["id"]
          },
        ]
      }
      advance_subcategories: {
        Row: {
          category_id: string
          description: string | null
          id: string
          name: string
          slug: string
          sort_order: number
        }
        Insert: {
          category_id: string
          description?: string | null
          id?: string
          name: string
          slug: string
          sort_order?: number
        }
        Update: {
          category_id?: string
          description?: string | null
          id?: string
          name?: string
          slug?: string
          sort_order?: number
        }
        Relationships: [
          {
            foreignKeyName: "advance_subcategories_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "advance_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      catalog_item_allocations: {
        Row: {
          allocated_by: string
          created_at: string
          id: string
          item_id: string
          notes: string | null
          project_id: string
          quantity: number
          space_id: string | null
          state: Database["public"]["Enums"]["allocation_state"]
          updated_at: string
        }
        Insert: {
          allocated_by: string
          created_at?: string
          id?: string
          item_id: string
          notes?: string | null
          project_id: string
          quantity?: number
          space_id?: string | null
          state?: Database["public"]["Enums"]["allocation_state"]
          updated_at?: string
        }
        Update: {
          allocated_by?: string
          created_at?: string
          id?: string
          item_id?: string
          notes?: string | null
          project_id?: string
          quantity?: number
          space_id?: string | null
          state?: Database["public"]["Enums"]["allocation_state"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "catalog_item_allocations_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "advance_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "catalog_item_allocations_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "catalog_item_allocations_space_id_fkey"
            columns: ["space_id"]
            isOneToOne: false
            referencedRelation: "spaces"
            referencedColumns: ["id"]
          },
        ]
      }
      catalog_item_fitment: {
        Row: {
          budget_tier: string | null
          certification: string[]
          event_type: string[]
          id: string
          indoor_outdoor: string[]
          item_id: string
          max_capacity: number | null
          min_capacity: number | null
          power_phase: string | null
          venue_type: string[]
          weather: string[]
          weight_class: string | null
        }
        Insert: {
          budget_tier?: string | null
          certification?: string[]
          event_type?: string[]
          id?: string
          indoor_outdoor?: string[]
          item_id: string
          max_capacity?: number | null
          min_capacity?: number | null
          power_phase?: string | null
          venue_type?: string[]
          weather?: string[]
          weight_class?: string | null
        }
        Update: {
          budget_tier?: string | null
          certification?: string[]
          event_type?: string[]
          id?: string
          indoor_outdoor?: string[]
          item_id?: string
          max_capacity?: number | null
          min_capacity?: number | null
          power_phase?: string | null
          venue_type?: string[]
          weather?: string[]
          weight_class?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "catalog_item_fitment_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "advance_items"
            referencedColumns: ["id"]
          },
        ]
      }
      catalog_item_interchange: {
        Row: {
          compatibility_score: number
          id: string
          item_a_id: string
          item_b_id: string
          notes: string | null
          relationship_type: string
        }
        Insert: {
          compatibility_score?: number
          id?: string
          item_a_id: string
          item_b_id: string
          notes?: string | null
          relationship_type?: string
        }
        Update: {
          compatibility_score?: number
          id?: string
          item_a_id?: string
          item_b_id?: string
          notes?: string | null
          relationship_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "catalog_item_interchange_item_a_id_fkey"
            columns: ["item_a_id"]
            isOneToOne: false
            referencedRelation: "advance_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "catalog_item_interchange_item_b_id_fkey"
            columns: ["item_b_id"]
            isOneToOne: false
            referencedRelation: "advance_items"
            referencedColumns: ["id"]
          },
        ]
      }
      catalog_item_inventory: {
        Row: {
          id: string
          item_id: string
          quantity_available: number
          quantity_owned: number
          updated_at: string
          warehouse_location: string | null
        }
        Insert: {
          id?: string
          item_id: string
          quantity_available?: number
          quantity_owned?: number
          updated_at?: string
          warehouse_location?: string | null
        }
        Update: {
          id?: string
          item_id?: string
          quantity_available?: number
          quantity_owned?: number
          updated_at?: string
          warehouse_location?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "catalog_item_inventory_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: true
            referencedRelation: "advance_items"
            referencedColumns: ["id"]
          },
        ]
      }
      catalog_item_supersession: {
        Row: {
          discontinued_item_id: string
          effective_date: string
          id: string
          notes: string | null
          replacement_item_id: string
        }
        Insert: {
          discontinued_item_id: string
          effective_date?: string
          id?: string
          notes?: string | null
          replacement_item_id: string
        }
        Update: {
          discontinued_item_id?: string
          effective_date?: string
          id?: string
          notes?: string | null
          replacement_item_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "catalog_item_supersession_discontinued_item_id_fkey"
            columns: ["discontinued_item_id"]
            isOneToOne: false
            referencedRelation: "advance_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "catalog_item_supersession_replacement_item_id_fkey"
            columns: ["replacement_item_id"]
            isOneToOne: false
            referencedRelation: "advance_items"
            referencedColumns: ["id"]
          },
        ]
      }
      catering_allocations: {
        Row: {
          created_at: string
          dietary_requirements: Json
          group_id: string | null
          group_type: string
          id: string
          meal_plan_id: string
          person_id: string | null
          quantity: number
          status: Database["public"]["Enums"]["catering_alloc_status"]
        }
        Insert: {
          created_at?: string
          dietary_requirements?: Json
          group_id?: string | null
          group_type: string
          id?: string
          meal_plan_id: string
          person_id?: string | null
          quantity?: number
          status?: Database["public"]["Enums"]["catering_alloc_status"]
        }
        Update: {
          created_at?: string
          dietary_requirements?: Json
          group_id?: string | null
          group_type?: string
          id?: string
          meal_plan_id?: string
          person_id?: string | null
          quantity?: number
          status?: Database["public"]["Enums"]["catering_alloc_status"]
        }
        Relationships: [
          {
            foreignKeyName: "catering_allocations_meal_plan_id_fkey"
            columns: ["meal_plan_id"]
            isOneToOne: false
            referencedRelation: "catering_meal_plans"
            referencedColumns: ["id"]
          },
        ]
      }
      catering_check_ins: {
        Row: {
          allocation_id: string
          checked_in_at: string
          checked_in_by: string
          id: string
        }
        Insert: {
          allocation_id: string
          checked_in_at?: string
          checked_in_by: string
          id?: string
        }
        Update: {
          allocation_id?: string
          checked_in_at?: string
          checked_in_by?: string
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "catering_check_ins_allocation_id_fkey"
            columns: ["allocation_id"]
            isOneToOne: false
            referencedRelation: "catering_allocations"
            referencedColumns: ["id"]
          },
        ]
      }
      catering_meal_plans: {
        Row: {
          capacity: number
          cost_per_person: number | null
          created_at: string
          date: string
          dietary_options: Json
          id: string
          location: string
          meal_name: string
          project_id: string
          time: string
          updated_at: string
        }
        Insert: {
          capacity?: number
          cost_per_person?: number | null
          created_at?: string
          date: string
          dietary_options?: Json
          id?: string
          location: string
          meal_name: string
          project_id: string
          time: string
          updated_at?: string
        }
        Update: {
          capacity?: number
          cost_per_person?: number | null
          created_at?: string
          date?: string
          dietary_options?: Json
          id?: string
          location?: string
          meal_name?: string
          project_id?: string
          time?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "catering_meal_plans_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      cms_pages: {
        Row: {
          blocks: Json
          created_at: string
          id: string
          project_id: string
          published: boolean
          slug: string
          title: string
          track: Database["public"]["Enums"]["portal_track"]
          updated_at: string
          version: number
          visibility_tags: string[]
        }
        Insert: {
          blocks?: Json
          created_at?: string
          id?: string
          project_id: string
          published?: boolean
          slug: string
          title: string
          track: Database["public"]["Enums"]["portal_track"]
          updated_at?: string
          version?: number
          visibility_tags?: string[]
        }
        Update: {
          blocks?: Json
          created_at?: string
          id?: string
          project_id?: string
          published?: boolean
          slug?: string
          title?: string
          track?: Database["public"]["Enums"]["portal_track"]
          updated_at?: string
          version?: number
          visibility_tags?: string[]
        }
        Relationships: [
          {
            foreignKeyName: "cms_pages_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      cms_revisions: {
        Row: {
          blocks: Json
          edited_at: string
          edited_by: string
          id: string
          page_id: string
          version: number
        }
        Insert: {
          blocks: Json
          edited_at?: string
          edited_by: string
          id?: string
          page_id: string
          version: number
        }
        Update: {
          blocks?: Json
          edited_at?: string
          edited_by?: string
          id?: string
          page_id?: string
          version?: number
        }
        Relationships: [
          {
            foreignKeyName: "cms_revisions_page_id_fkey"
            columns: ["page_id"]
            isOneToOne: false
            referencedRelation: "cms_pages"
            referencedColumns: ["id"]
          },
        ]
      }
      credential_badge_templates: {
        Row: {
          branding: Json
          created_at: string
          fields: string[]
          id: string
          layout: Json
          name: string
          project_id: string
          version: number
        }
        Insert: {
          branding?: Json
          created_at?: string
          fields?: string[]
          id?: string
          layout?: Json
          name: string
          project_id: string
          version?: number
        }
        Update: {
          branding?: Json
          created_at?: string
          fields?: string[]
          id?: string
          layout?: Json
          name?: string
          project_id?: string
          version?: number
        }
        Relationships: [
          {
            foreignKeyName: "credential_badge_templates_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      credential_badges: {
        Row: {
          barcode_data: string | null
          created_at: string
          id: string
          order_id: string
          person_id: string | null
          person_name: string | null
          photo_uri: string | null
          print_status: Database["public"]["Enums"]["credential_print_status"]
          qr_data: string | null
          template_id: string | null
        }
        Insert: {
          barcode_data?: string | null
          created_at?: string
          id?: string
          order_id: string
          person_id?: string | null
          person_name?: string | null
          photo_uri?: string | null
          print_status?: Database["public"]["Enums"]["credential_print_status"]
          qr_data?: string | null
          template_id?: string | null
        }
        Update: {
          barcode_data?: string | null
          created_at?: string
          id?: string
          order_id?: string
          person_id?: string | null
          person_name?: string | null
          photo_uri?: string | null
          print_status?: Database["public"]["Enums"]["credential_print_status"]
          qr_data?: string | null
          template_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "credential_badges_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "credential_orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "credential_badges_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "credential_badge_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      credential_check_ins: {
        Row: {
          checked_in_at: string
          checked_in_by: string
          credential_order_id: string
          id: string
          location: string | null
          method: Database["public"]["Enums"]["check_in_method"]
          notes: string | null
        }
        Insert: {
          checked_in_at?: string
          checked_in_by: string
          credential_order_id: string
          id?: string
          location?: string | null
          method?: Database["public"]["Enums"]["check_in_method"]
          notes?: string | null
        }
        Update: {
          checked_in_at?: string
          checked_in_by?: string
          credential_order_id?: string
          id?: string
          location?: string | null
          method?: Database["public"]["Enums"]["check_in_method"]
          notes?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "credential_check_ins_credential_order_id_fkey"
            columns: ["credential_order_id"]
            isOneToOne: false
            referencedRelation: "credential_orders"
            referencedColumns: ["id"]
          },
        ]
      }
      credential_orders: {
        Row: {
          approved_at: string | null
          approved_by: string | null
          created_at: string
          credential_type_id: string
          group_name: string | null
          id: string
          notes: string | null
          project_id: string
          quantity: number
          requested_at: string
          status: Database["public"]["Enums"]["credential_order_status"]
          user_id: string | null
        }
        Insert: {
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string
          credential_type_id: string
          group_name?: string | null
          id?: string
          notes?: string | null
          project_id: string
          quantity?: number
          requested_at?: string
          status?: Database["public"]["Enums"]["credential_order_status"]
          user_id?: string | null
        }
        Update: {
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string
          credential_type_id?: string
          group_name?: string | null
          id?: string
          notes?: string | null
          project_id?: string
          quantity?: number
          requested_at?: string
          status?: Database["public"]["Enums"]["credential_order_status"]
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "credential_orders_credential_type_id_fkey"
            columns: ["credential_type_id"]
            isOneToOne: false
            referencedRelation: "credential_types"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "credential_orders_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      credential_type_zones: {
        Row: {
          credential_type_id: string
          id: string
          zone_id: string
        }
        Insert: {
          credential_type_id: string
          id?: string
          zone_id: string
        }
        Update: {
          credential_type_id?: string
          id?: string
          zone_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "credential_type_zones_credential_type_id_fkey"
            columns: ["credential_type_id"]
            isOneToOne: false
            referencedRelation: "credential_types"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "credential_type_zones_zone_id_fkey"
            columns: ["zone_id"]
            isOneToOne: false
            referencedRelation: "credential_zones"
            referencedColumns: ["id"]
          },
        ]
      }
      credential_types: {
        Row: {
          color: string
          created_at: string
          id: string
          name: string
          project_id: string
          quantity_limit: number | null
          settings: Json
          sort_order: number
        }
        Insert: {
          color?: string
          created_at?: string
          id?: string
          name: string
          project_id: string
          quantity_limit?: number | null
          settings?: Json
          sort_order?: number
        }
        Update: {
          color?: string
          created_at?: string
          id?: string
          name?: string
          project_id?: string
          quantity_limit?: number | null
          settings?: Json
          sort_order?: number
        }
        Relationships: [
          {
            foreignKeyName: "credential_types_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      credential_zones: {
        Row: {
          access_level: string
          created_at: string
          description: string | null
          id: string
          name: string
          project_id: string
          sort_order: number
        }
        Insert: {
          access_level?: string
          created_at?: string
          description?: string | null
          id?: string
          name: string
          project_id: string
          sort_order?: number
        }
        Update: {
          access_level?: string
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          project_id?: string
          sort_order?: number
        }
        Relationships: [
          {
            foreignKeyName: "credential_zones_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
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
          user_id: string
        }
        Insert: {
          body: string
          created_at?: string
          deliverable_id: string
          id?: string
          user_id: string
        }
        Update: {
          body?: string
          created_at?: string
          deliverable_id?: string
          id?: string
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
          act_id: string | null
          created_at: string
          data: Json
          deadline: string | null
          id: string
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
          act_id?: string | null
          created_at?: string
          data?: Json
          deadline?: string | null
          id?: string
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
          act_id?: string | null
          created_at?: string
          data?: Json
          deadline?: string | null
          id?: string
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
            foreignKeyName: "deliverables_act_id_fkey"
            columns: ["act_id"]
            isOneToOne: false
            referencedRelation: "acts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "deliverables_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      notification_log: {
        Row: {
          body: string | null
          channel: Database["public"]["Enums"]["notification_channel"]
          delivery_status: string
          id: string
          metadata: Json
          project_id: string | null
          provider_message_id: string | null
          recipient_email: string | null
          recipient_id: string | null
          recipient_phone: string | null
          sent_at: string
          subject: string | null
          template_id: string | null
        }
        Insert: {
          body?: string | null
          channel: Database["public"]["Enums"]["notification_channel"]
          delivery_status?: string
          id?: string
          metadata?: Json
          project_id?: string | null
          provider_message_id?: string | null
          recipient_email?: string | null
          recipient_id?: string | null
          recipient_phone?: string | null
          sent_at?: string
          subject?: string | null
          template_id?: string | null
        }
        Update: {
          body?: string | null
          channel?: Database["public"]["Enums"]["notification_channel"]
          delivery_status?: string
          id?: string
          metadata?: Json
          project_id?: string | null
          provider_message_id?: string | null
          recipient_email?: string | null
          recipient_id?: string | null
          recipient_phone?: string | null
          sent_at?: string
          subject?: string | null
          template_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "notification_log_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notification_log_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "notification_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      notification_templates: {
        Row: {
          body_template: string
          channel: Database["public"]["Enums"]["notification_channel"]
          created_at: string
          id: string
          is_active: boolean
          name: string
          organization_id: string | null
          project_id: string | null
          subject: string | null
          trigger_event: string | null
          updated_at: string
        }
        Insert: {
          body_template: string
          channel?: Database["public"]["Enums"]["notification_channel"]
          created_at?: string
          id?: string
          is_active?: boolean
          name: string
          organization_id?: string | null
          project_id?: string | null
          subject?: string | null
          trigger_event?: string | null
          updated_at?: string
        }
        Update: {
          body_template?: string
          channel?: Database["public"]["Enums"]["notification_channel"]
          created_at?: string
          id?: string
          is_active?: boolean
          name?: string
          organization_id?: string | null
          project_id?: string | null
          subject?: string | null
          trigger_event?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "notification_templates_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notification_templates_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      organization_members: {
        Row: {
          created_at: string
          id: string
          organization_id: string
          role: Database["public"]["Enums"]["platform_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          organization_id: string
          role?: Database["public"]["Enums"]["platform_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          organization_id?: string
          role?: Database["public"]["Enums"]["platform_role"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "organization_members_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      organizations: {
        Row: {
          created_at: string
          id: string
          logo_url: string | null
          name: string
          settings: Json
          slug: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          logo_url?: string | null
          name: string
          settings?: Json
          slug: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          logo_url?: string | null
          name?: string
          settings?: Json
          slug?: string
          updated_at?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          display_name: string | null
          full_name: string | null
          id: string
          metadata: Json
          phone: string | null
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          full_name?: string | null
          id: string
          metadata?: Json
          phone?: string | null
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          full_name?: string | null
          id?: string
          metadata?: Json
          phone?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      project_members: {
        Row: {
          created_at: string
          id: string
          invited_by: string | null
          project_id: string
          role: Database["public"]["Enums"]["platform_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          invited_by?: string | null
          project_id: string
          role: Database["public"]["Enums"]["platform_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          invited_by?: string | null
          project_id?: string
          role?: Database["public"]["Enums"]["platform_role"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_members_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      project_templates: {
        Row: {
          config: Json
          created_at: string
          created_by: string
          description: string | null
          features: string[]
          id: string
          is_system: boolean
          name: string
          organization_id: string | null
          space_defaults: Json
          updated_at: string
          venue_defaults: Json | null
        }
        Insert: {
          config?: Json
          created_at?: string
          created_by: string
          description?: string | null
          features?: string[]
          id?: string
          is_system?: boolean
          name: string
          organization_id?: string | null
          space_defaults?: Json
          updated_at?: string
          venue_defaults?: Json | null
        }
        Update: {
          config?: Json
          created_at?: string
          created_by?: string
          description?: string | null
          features?: string[]
          id?: string
          is_system?: boolean
          name?: string
          organization_id?: string | null
          space_defaults?: Json
          updated_at?: string
          venue_defaults?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "project_templates_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      projects: {
        Row: {
          created_at: string
          end_date: string | null
          features: string[]
          id: string
          name: string
          organization_id: string
          settings: Json
          slug: string
          start_date: string | null
          status: Database["public"]["Enums"]["project_status"]
          type: Database["public"]["Enums"]["project_type"]
          updated_at: string
          venue: Json | null
        }
        Insert: {
          created_at?: string
          end_date?: string | null
          features?: string[]
          id?: string
          name: string
          organization_id: string
          settings?: Json
          slug: string
          start_date?: string | null
          status?: Database["public"]["Enums"]["project_status"]
          type?: Database["public"]["Enums"]["project_type"]
          updated_at?: string
          venue?: Json | null
        }
        Update: {
          created_at?: string
          end_date?: string | null
          features?: string[]
          id?: string
          name?: string
          organization_id?: string
          settings?: Json
          slug?: string
          start_date?: string | null
          status?: Database["public"]["Enums"]["project_status"]
          type?: Database["public"]["Enums"]["project_type"]
          updated_at?: string
          venue?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "projects_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      spaces: {
        Row: {
          backline: Json | null
          capacity: number | null
          created_at: string
          id: string
          name: string
          project_id: string
          settings: Json
          sort_order: number
          type: string
        }
        Insert: {
          backline?: Json | null
          capacity?: number | null
          created_at?: string
          id?: string
          name: string
          project_id: string
          settings?: Json
          sort_order?: number
          type?: string
        }
        Update: {
          backline?: Json | null
          capacity?: number | null
          created_at?: string
          id?: string
          name?: string
          project_id?: string
          settings?: Json
          sort_order?: number
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "spaces_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      submission_templates: {
        Row: {
          created_at: string
          created_by: string
          defaults: Json
          deliverable_type: Database["public"]["Enums"]["deliverable_type"]
          description: string | null
          id: string
          is_system: boolean
          name: string
          organization_id: string | null
          schema: Json
          scope: Database["public"]["Enums"]["template_scope"]
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by: string
          defaults?: Json
          deliverable_type: Database["public"]["Enums"]["deliverable_type"]
          description?: string | null
          id?: string
          is_system?: boolean
          name: string
          organization_id?: string | null
          schema?: Json
          scope?: Database["public"]["Enums"]["template_scope"]
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string
          defaults?: Json
          deliverable_type?: Database["public"]["Enums"]["deliverable_type"]
          description?: string | null
          id?: string
          is_system?: boolean
          name?: string
          organization_id?: string | null
          schema?: Json
          scope?: Database["public"]["Enums"]["template_scope"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "submission_templates_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      is_internal_on_project: { Args: { proj_id: string }; Returns: boolean }
      is_org_member: { Args: { org_id: string }; Returns: boolean }
      is_project_member: { Args: { proj_id: string }; Returns: boolean }
      is_talent_on_project: { Args: { proj_id: string }; Returns: boolean }
      user_org_role: {
        Args: { org_id: string }
        Returns: Database["public"]["Enums"]["platform_role"]
      }
      user_project_role: {
        Args: { proj_id: string }
        Returns: Database["public"]["Enums"]["platform_role"]
      }
    }
    Enums: {
      allocation_state:
        | "reserved"
        | "confirmed"
        | "in_transit"
        | "on_site"
        | "returned"
        | "maintenance"
      catering_alloc_status: "allocated" | "confirmed" | "checked_in"
      check_in_method: "scan" | "manual"
      credential_order_status:
        | "requested"
        | "approved"
        | "denied"
        | "issued"
        | "picked_up"
        | "revoked"
      credential_print_status: "pending" | "queued" | "printed" | "reprinting"
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
      notification_channel: "email" | "sms"
      platform_role:
        | "developer"
        | "owner"
        | "admin"
        | "team_member"
        | "talent_management"
        | "talent_performer"
        | "talent_crew"
        | "vendor"
        | "client"
        | "sponsor"
        | "industry_guest"
      portal_track: "artist" | "production" | "sponsor" | "guest" | "client"
      project_status: "draft" | "active" | "completed" | "archived"
      project_type: "talent_advance" | "production_advance" | "hybrid"
      template_scope: "personal" | "org" | "global"
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
      allocation_state: [
        "reserved",
        "confirmed",
        "in_transit",
        "on_site",
        "returned",
        "maintenance",
      ],
      catering_alloc_status: ["allocated", "confirmed", "checked_in"],
      check_in_method: ["scan", "manual"],
      credential_order_status: [
        "requested",
        "approved",
        "denied",
        "issued",
        "picked_up",
        "revoked",
      ],
      credential_print_status: ["pending", "queued", "printed", "reprinting"],
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
      notification_channel: ["email", "sms"],
      platform_role: [
        "developer",
        "owner",
        "admin",
        "team_member",
        "talent_management",
        "talent_performer",
        "talent_crew",
        "vendor",
        "client",
        "sponsor",
        "industry_guest",
      ],
      portal_track: ["artist", "production", "sponsor", "guest", "client"],
      project_status: ["draft", "active", "completed", "archived"],
      project_type: ["talent_advance", "production_advance", "hybrid"],
      template_scope: ["personal", "org", "global"],
    },
  },
} as const
