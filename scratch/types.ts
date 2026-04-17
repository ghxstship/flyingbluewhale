export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          extensions?: Json
          operationName?: string
          query?: string
          variables?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      activations: {
        Row: {
          budget_overhead: number
          created_at: string
          deleted_at: string | null
          description: string | null
          id: string
          metadata: Json
          name: string
          organization_id: string
          slug: string
          sort_order: number
          status: Database["public"]["Enums"]["production_level_status"]
          type: Database["public"]["Enums"]["activation_type"]
          updated_at: string
          zone_id: string
        }
        Insert: {
          budget_overhead?: number
          created_at?: string
          deleted_at?: string | null
          description?: string | null
          id?: string
          metadata?: Json
          name: string
          organization_id: string
          slug: string
          sort_order?: number
          status?: Database["public"]["Enums"]["production_level_status"]
          type?: Database["public"]["Enums"]["activation_type"]
          updated_at?: string
          zone_id: string
        }
        Update: {
          budget_overhead?: number
          created_at?: string
          deleted_at?: string | null
          description?: string | null
          id?: string
          metadata?: Json
          name?: string
          organization_id?: string
          slug?: string
          sort_order?: number
          status?: Database["public"]["Enums"]["production_level_status"]
          type?: Database["public"]["Enums"]["activation_type"]
          updated_at?: string
          zone_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "activations_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "activations_zone_id_fkey"
            columns: ["zone_id"]
            isOneToOne: false
            referencedRelation: "hierarchy_item_catalog_view"
            referencedColumns: ["zone_id"]
          },
          {
            foreignKeyName: "activations_zone_id_fkey"
            columns: ["zone_id"]
            isOneToOne: false
            referencedRelation: "zones"
            referencedColumns: ["id"]
          },
        ]
      }
      acts: {
        Row: {
          activation_id: string | null
          artist_name: string
          created_at: string
          event_id: string | null
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
          activation_id?: string | null
          artist_name: string
          created_at?: string
          event_id?: string | null
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
          activation_id?: string | null
          artist_name?: string
          created_at?: string
          event_id?: string | null
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
            foreignKeyName: "acts_activation_id_fkey"
            columns: ["activation_id"]
            isOneToOne: false
            referencedRelation: "activations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "acts_activation_id_fkey"
            columns: ["activation_id"]
            isOneToOne: false
            referencedRelation: "hierarchy_item_catalog_view"
            referencedColumns: ["activation_id"]
          },
          {
            foreignKeyName: "acts_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "acts_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "hierarchy_item_catalog_view"
            referencedColumns: ["event_id"]
          },
          {
            foreignKeyName: "acts_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "hierarchy_item_catalog_view"
            referencedColumns: ["project_id"]
          },
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
          {
            foreignKeyName: "advance_categories_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "hierarchy_item_catalog_view"
            referencedColumns: ["group_id"]
          },
        ]
      }
      advance_category_groups: {
        Row: {
          color: string | null
          description: string | null
          id: string
          name: string
          slug: string
          sort_order: number
        }
        Insert: {
          color?: string | null
          description?: string | null
          id?: string
          name: string
          slug: string
          sort_order?: number
        }
        Update: {
          color?: string | null
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
          {
            foreignKeyName: "advance_items_subcategory_id_fkey"
            columns: ["subcategory_id"]
            isOneToOne: false
            referencedRelation: "hierarchy_item_catalog_view"
            referencedColumns: ["subcategory_id"]
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
          {
            foreignKeyName: "advance_subcategories_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "hierarchy_item_catalog_view"
            referencedColumns: ["category_id"]
          },
        ]
      }
      approval_actions: {
        Row: {
          action: string
          comment: string | null
          entity_id: string
          entity_type: string
          id: string
          performed_at: string
          performed_by: string
          project_id: string
        }
        Insert: {
          action: string
          comment?: string | null
          entity_id: string
          entity_type: string
          id?: string
          performed_at?: string
          performed_by: string
          project_id: string
        }
        Update: {
          action?: string
          comment?: string | null
          entity_id?: string
          entity_type?: string
          id?: string
          performed_at?: string
          performed_by?: string
          project_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "approval_actions_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "hierarchy_item_catalog_view"
            referencedColumns: ["project_id"]
          },
          {
            foreignKeyName: "approval_actions_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      asset_events: {
        Row: {
          allocation_id: string | null
          asset_id: string
          condition_after: string | null
          condition_before: string | null
          event_type: string
          from_holder_id: string | null
          from_location_id: string | null
          id: string
          metadata: Json
          notes: string | null
          project_id: string | null
          recorded_at: string
          recorded_by: string
          to_holder_id: string | null
          to_location_id: string | null
        }
        Insert: {
          allocation_id?: string | null
          asset_id: string
          condition_after?: string | null
          condition_before?: string | null
          event_type: string
          from_holder_id?: string | null
          from_location_id?: string | null
          id?: string
          metadata?: Json
          notes?: string | null
          project_id?: string | null
          recorded_at?: string
          recorded_by: string
          to_holder_id?: string | null
          to_location_id?: string | null
        }
        Update: {
          allocation_id?: string | null
          asset_id?: string
          condition_after?: string | null
          condition_before?: string | null
          event_type?: string
          from_holder_id?: string | null
          from_location_id?: string | null
          id?: string
          metadata?: Json
          notes?: string | null
          project_id?: string | null
          recorded_at?: string
          recorded_by?: string
          to_holder_id?: string | null
          to_location_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "asset_events_allocation_id_fkey"
            columns: ["allocation_id"]
            isOneToOne: false
            referencedRelation: "catalog_item_allocations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "asset_events_asset_id_fkey"
            columns: ["asset_id"]
            isOneToOne: false
            referencedRelation: "asset_instances"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "asset_events_from_location_id_fkey"
            columns: ["from_location_id"]
            isOneToOne: false
            referencedRelation: "locations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "asset_events_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "hierarchy_item_catalog_view"
            referencedColumns: ["project_id"]
          },
          {
            foreignKeyName: "asset_events_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "asset_events_to_location_id_fkey"
            columns: ["to_location_id"]
            isOneToOne: false
            referencedRelation: "locations"
            referencedColumns: ["id"]
          },
        ]
      }
      asset_instances: {
        Row: {
          asset_tag: string
          barcode: string | null
          condition: string
          created_at: string
          current_holder_id: string | null
          current_project_id: string | null
          id: string
          item_id: string
          last_maintenance_at: string | null
          location_id: string | null
          metadata: Json
          next_maintenance_at: string | null
          notes: string | null
          organization_id: string
          purchase_date: string | null
          purchase_order_id: string | null
          purchase_price: number | null
          retirement_date: string | null
          retirement_reason: string | null
          rfid: string | null
          serial_number: string | null
          status: Database["public"]["Enums"]["asset_status"]
          updated_at: string
          warranty_expires: string | null
        }
        Insert: {
          asset_tag: string
          barcode?: string | null
          condition?: string
          created_at?: string
          current_holder_id?: string | null
          current_project_id?: string | null
          id?: string
          item_id: string
          last_maintenance_at?: string | null
          location_id?: string | null
          metadata?: Json
          next_maintenance_at?: string | null
          notes?: string | null
          organization_id: string
          purchase_date?: string | null
          purchase_order_id?: string | null
          purchase_price?: number | null
          retirement_date?: string | null
          retirement_reason?: string | null
          rfid?: string | null
          serial_number?: string | null
          status?: Database["public"]["Enums"]["asset_status"]
          updated_at?: string
          warranty_expires?: string | null
        }
        Update: {
          asset_tag?: string
          barcode?: string | null
          condition?: string
          created_at?: string
          current_holder_id?: string | null
          current_project_id?: string | null
          id?: string
          item_id?: string
          last_maintenance_at?: string | null
          location_id?: string | null
          metadata?: Json
          next_maintenance_at?: string | null
          notes?: string | null
          organization_id?: string
          purchase_date?: string | null
          purchase_order_id?: string | null
          purchase_price?: number | null
          retirement_date?: string | null
          retirement_reason?: string | null
          rfid?: string | null
          serial_number?: string | null
          status?: Database["public"]["Enums"]["asset_status"]
          updated_at?: string
          warranty_expires?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "asset_instances_current_project_id_fkey"
            columns: ["current_project_id"]
            isOneToOne: false
            referencedRelation: "hierarchy_item_catalog_view"
            referencedColumns: ["project_id"]
          },
          {
            foreignKeyName: "asset_instances_current_project_id_fkey"
            columns: ["current_project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "asset_instances_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "advance_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "asset_instances_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "hierarchy_item_catalog_view"
            referencedColumns: ["catalog_item_id"]
          },
          {
            foreignKeyName: "asset_instances_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "locations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "asset_instances_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "asset_instances_purchase_order_id_fkey"
            columns: ["purchase_order_id"]
            isOneToOne: false
            referencedRelation: "purchase_orders"
            referencedColumns: ["id"]
          },
        ]
      }
      audit_log: {
        Row: {
          action: string
          actor_id: string | null
          created_at: string
          entity_id: string
          entity_type: string
          id: string
          metadata: Json
          new_state: Json | null
          old_state: Json | null
          organization_id: string | null
          project_id: string | null
        }
        Insert: {
          action: string
          actor_id?: string | null
          created_at?: string
          entity_id: string
          entity_type: string
          id?: string
          metadata?: Json
          new_state?: Json | null
          old_state?: Json | null
          organization_id?: string | null
          project_id?: string | null
        }
        Update: {
          action?: string
          actor_id?: string | null
          created_at?: string
          entity_id?: string
          entity_type?: string
          id?: string
          metadata?: Json
          new_state?: Json | null
          old_state?: Json | null
          organization_id?: string | null
          project_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "audit_log_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "audit_log_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "hierarchy_item_catalog_view"
            referencedColumns: ["project_id"]
          },
          {
            foreignKeyName: "audit_log_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      catalog_item_allocations: {
        Row: {
          allocated_by: string
          asset_instance_id: string | null
          barcode: string | null
          checked_in_by: string | null
          checked_out_by: string | null
          component_id: string | null
          created_at: string
          holder_email: string | null
          holder_entity_id: string | null
          holder_entity_type: string | null
          id: string
          item_id: string
          location_id: string | null
          notes: string | null
          pickup_at: string | null
          project_id: string
          quantity: number
          return_at: string | null
          return_condition: string | null
          return_notes: string | null
          space_id: string | null
          state: Database["public"]["Enums"]["allocation_state"]
          updated_at: string
        }
        Insert: {
          allocated_by: string
          asset_instance_id?: string | null
          barcode?: string | null
          checked_in_by?: string | null
          checked_out_by?: string | null
          component_id?: string | null
          created_at?: string
          holder_email?: string | null
          holder_entity_id?: string | null
          holder_entity_type?: string | null
          id?: string
          item_id: string
          location_id?: string | null
          notes?: string | null
          pickup_at?: string | null
          project_id: string
          quantity?: number
          return_at?: string | null
          return_condition?: string | null
          return_notes?: string | null
          space_id?: string | null
          state?: Database["public"]["Enums"]["allocation_state"]
          updated_at?: string
        }
        Update: {
          allocated_by?: string
          asset_instance_id?: string | null
          barcode?: string | null
          checked_in_by?: string | null
          checked_out_by?: string | null
          component_id?: string | null
          created_at?: string
          holder_email?: string | null
          holder_entity_id?: string | null
          holder_entity_type?: string | null
          id?: string
          item_id?: string
          location_id?: string | null
          notes?: string | null
          pickup_at?: string | null
          project_id?: string
          quantity?: number
          return_at?: string | null
          return_condition?: string | null
          return_notes?: string | null
          space_id?: string | null
          state?: Database["public"]["Enums"]["allocation_state"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "catalog_item_allocations_asset_instance_id_fkey"
            columns: ["asset_instance_id"]
            isOneToOne: false
            referencedRelation: "asset_instances"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "catalog_item_allocations_component_id_fkey"
            columns: ["component_id"]
            isOneToOne: false
            referencedRelation: "components"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "catalog_item_allocations_component_id_fkey"
            columns: ["component_id"]
            isOneToOne: false
            referencedRelation: "hierarchy_item_catalog_view"
            referencedColumns: ["component_id"]
          },
          {
            foreignKeyName: "catalog_item_allocations_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "advance_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "catalog_item_allocations_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "hierarchy_item_catalog_view"
            referencedColumns: ["catalog_item_id"]
          },
          {
            foreignKeyName: "catalog_item_allocations_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "locations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "catalog_item_allocations_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "hierarchy_item_catalog_view"
            referencedColumns: ["project_id"]
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
          {
            foreignKeyName: "catalog_item_fitment_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "hierarchy_item_catalog_view"
            referencedColumns: ["catalog_item_id"]
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
            foreignKeyName: "catalog_item_interchange_item_a_id_fkey"
            columns: ["item_a_id"]
            isOneToOne: false
            referencedRelation: "hierarchy_item_catalog_view"
            referencedColumns: ["catalog_item_id"]
          },
          {
            foreignKeyName: "catalog_item_interchange_item_b_id_fkey"
            columns: ["item_b_id"]
            isOneToOne: false
            referencedRelation: "advance_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "catalog_item_interchange_item_b_id_fkey"
            columns: ["item_b_id"]
            isOneToOne: false
            referencedRelation: "hierarchy_item_catalog_view"
            referencedColumns: ["catalog_item_id"]
          },
        ]
      }
      catalog_item_inventory: {
        Row: {
          bin_location: string | null
          id: string
          item_id: string
          last_count_at: string | null
          last_count_by: string | null
          location_id: string | null
          quantity_available: number
          quantity_owned: number
          reorder_point: number | null
          reorder_quantity: number | null
          updated_at: string
          warehouse_location: string | null
        }
        Insert: {
          bin_location?: string | null
          id?: string
          item_id: string
          last_count_at?: string | null
          last_count_by?: string | null
          location_id?: string | null
          quantity_available?: number
          quantity_owned?: number
          reorder_point?: number | null
          reorder_quantity?: number | null
          updated_at?: string
          warehouse_location?: string | null
        }
        Update: {
          bin_location?: string | null
          id?: string
          item_id?: string
          last_count_at?: string | null
          last_count_by?: string | null
          location_id?: string | null
          quantity_available?: number
          quantity_owned?: number
          reorder_point?: number | null
          reorder_quantity?: number | null
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
          {
            foreignKeyName: "catalog_item_inventory_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: true
            referencedRelation: "hierarchy_item_catalog_view"
            referencedColumns: ["catalog_item_id"]
          },
          {
            foreignKeyName: "catalog_item_inventory_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "locations"
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
            foreignKeyName: "catalog_item_supersession_discontinued_item_id_fkey"
            columns: ["discontinued_item_id"]
            isOneToOne: false
            referencedRelation: "hierarchy_item_catalog_view"
            referencedColumns: ["catalog_item_id"]
          },
          {
            foreignKeyName: "catalog_item_supersession_replacement_item_id_fkey"
            columns: ["replacement_item_id"]
            isOneToOne: false
            referencedRelation: "advance_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "catalog_item_supersession_replacement_item_id_fkey"
            columns: ["replacement_item_id"]
            isOneToOne: false
            referencedRelation: "hierarchy_item_catalog_view"
            referencedColumns: ["catalog_item_id"]
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
          location_id: string | null
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
          location_id?: string | null
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
          location_id?: string | null
          meal_name?: string
          project_id?: string
          time?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "catering_meal_plans_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "locations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "catering_meal_plans_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "hierarchy_item_catalog_view"
            referencedColumns: ["project_id"]
          },
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
            referencedRelation: "hierarchy_item_catalog_view"
            referencedColumns: ["project_id"]
          },
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
      component_items: {
        Row: {
          assigned_by: string | null
          component_id: string
          created_at: string
          deleted_at: string | null
          id: string
          item_id: string
          notes: string | null
          quantity: number
          status: Database["public"]["Enums"]["production_level_status"]
          unit_cost: number | null
          updated_at: string
        }
        Insert: {
          assigned_by?: string | null
          component_id: string
          created_at?: string
          deleted_at?: string | null
          id?: string
          item_id: string
          notes?: string | null
          quantity?: number
          status?: Database["public"]["Enums"]["production_level_status"]
          unit_cost?: number | null
          updated_at?: string
        }
        Update: {
          assigned_by?: string | null
          component_id?: string
          created_at?: string
          deleted_at?: string | null
          id?: string
          item_id?: string
          notes?: string | null
          quantity?: number
          status?: Database["public"]["Enums"]["production_level_status"]
          unit_cost?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "component_items_component_id_fkey"
            columns: ["component_id"]
            isOneToOne: false
            referencedRelation: "components"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "component_items_component_id_fkey"
            columns: ["component_id"]
            isOneToOne: false
            referencedRelation: "hierarchy_item_catalog_view"
            referencedColumns: ["component_id"]
          },
          {
            foreignKeyName: "component_items_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "advance_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "component_items_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "hierarchy_item_catalog_view"
            referencedColumns: ["catalog_item_id"]
          },
        ]
      }
      components: {
        Row: {
          activation_id: string
          budget_overhead: number
          created_at: string
          deleted_at: string | null
          description: string | null
          id: string
          metadata: Json
          name: string
          organization_id: string
          slug: string
          sort_order: number
          status: Database["public"]["Enums"]["production_level_status"]
          type: Database["public"]["Enums"]["component_type"]
          updated_at: string
        }
        Insert: {
          activation_id: string
          budget_overhead?: number
          created_at?: string
          deleted_at?: string | null
          description?: string | null
          id?: string
          metadata?: Json
          name: string
          organization_id: string
          slug: string
          sort_order?: number
          status?: Database["public"]["Enums"]["production_level_status"]
          type?: Database["public"]["Enums"]["component_type"]
          updated_at?: string
        }
        Update: {
          activation_id?: string
          budget_overhead?: number
          created_at?: string
          deleted_at?: string | null
          description?: string | null
          id?: string
          metadata?: Json
          name?: string
          organization_id?: string
          slug?: string
          sort_order?: number
          status?: Database["public"]["Enums"]["production_level_status"]
          type?: Database["public"]["Enums"]["component_type"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "components_activation_id_fkey"
            columns: ["activation_id"]
            isOneToOne: false
            referencedRelation: "activations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "components_activation_id_fkey"
            columns: ["activation_id"]
            isOneToOne: false
            referencedRelation: "hierarchy_item_catalog_view"
            referencedColumns: ["activation_id"]
          },
          {
            foreignKeyName: "components_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
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
            referencedRelation: "hierarchy_item_catalog_view"
            referencedColumns: ["project_id"]
          },
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
          badge_url: string | null
          barcode_data: string | null
          created_at: string
          expires_at: string | null
          id: string
          is_revoked: boolean
          issued_at: string | null
          order_id: string
          person_id: string | null
          person_name: string | null
          photo_uri: string | null
          print_status: Database["public"]["Enums"]["credential_print_status"]
          qr_data: string | null
          template_id: string | null
        }
        Insert: {
          badge_url?: string | null
          barcode_data?: string | null
          created_at?: string
          expires_at?: string | null
          id?: string
          is_revoked?: boolean
          issued_at?: string | null
          order_id: string
          person_id?: string | null
          person_name?: string | null
          photo_uri?: string | null
          print_status?: Database["public"]["Enums"]["credential_print_status"]
          qr_data?: string | null
          template_id?: string | null
        }
        Update: {
          badge_url?: string | null
          barcode_data?: string | null
          created_at?: string
          expires_at?: string | null
          id?: string
          is_revoked?: boolean
          issued_at?: string | null
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
          location_id: string | null
          method: Database["public"]["Enums"]["check_in_method"]
          notes: string | null
        }
        Insert: {
          checked_in_at?: string
          checked_in_by: string
          credential_order_id: string
          id?: string
          location_id?: string | null
          method?: Database["public"]["Enums"]["check_in_method"]
          notes?: string | null
        }
        Update: {
          checked_in_at?: string
          checked_in_by?: string
          credential_order_id?: string
          id?: string
          location_id?: string | null
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
          {
            foreignKeyName: "credential_check_ins_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "locations"
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
          denied_at: string | null
          denied_by: string | null
          group_name: string | null
          id: string
          issued_at: string | null
          issued_by: string | null
          notes: string | null
          picked_up_at: string | null
          project_id: string
          quantity: number
          requested_at: string
          revocation_reason: string | null
          revoked_at: string | null
          revoked_by: string | null
          status: Database["public"]["Enums"]["credential_order_status"]
          user_id: string | null
        }
        Insert: {
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string
          credential_type_id: string
          denied_at?: string | null
          denied_by?: string | null
          group_name?: string | null
          id?: string
          issued_at?: string | null
          issued_by?: string | null
          notes?: string | null
          picked_up_at?: string | null
          project_id: string
          quantity?: number
          requested_at?: string
          revocation_reason?: string | null
          revoked_at?: string | null
          revoked_by?: string | null
          status?: Database["public"]["Enums"]["credential_order_status"]
          user_id?: string | null
        }
        Update: {
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string
          credential_type_id?: string
          denied_at?: string | null
          denied_by?: string | null
          group_name?: string | null
          id?: string
          issued_at?: string | null
          issued_by?: string | null
          notes?: string | null
          picked_up_at?: string | null
          project_id?: string
          quantity?: number
          requested_at?: string
          revocation_reason?: string | null
          revoked_at?: string | null
          revoked_by?: string | null
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
            referencedRelation: "hierarchy_item_catalog_view"
            referencedColumns: ["project_id"]
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
            referencedRelation: "hierarchy_item_catalog_view"
            referencedColumns: ["project_id"]
          },
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
            referencedRelation: "hierarchy_item_catalog_view"
            referencedColumns: ["project_id"]
          },
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
            referencedRelation: "hierarchy_item_catalog_view"
            referencedColumns: ["project_id"]
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
      documents: {
        Row: {
          created_at: string
          entity_id: string
          entity_type: string
          file_name: string
          file_size_bytes: number | null
          file_url: string
          id: string
          metadata: Json
          mime_type: string | null
          notes: string | null
          organization_id: string
          project_id: string | null
          thumbnail_url: string | null
          type: string
          uploaded_by: string
        }
        Insert: {
          created_at?: string
          entity_id: string
          entity_type: string
          file_name: string
          file_size_bytes?: number | null
          file_url: string
          id?: string
          metadata?: Json
          mime_type?: string | null
          notes?: string | null
          organization_id: string
          project_id?: string | null
          thumbnail_url?: string | null
          type: string
          uploaded_by: string
        }
        Update: {
          created_at?: string
          entity_id?: string
          entity_type?: string
          file_name?: string
          file_size_bytes?: number | null
          file_url?: string
          id?: string
          metadata?: Json
          mime_type?: string | null
          notes?: string | null
          organization_id?: string
          project_id?: string | null
          thumbnail_url?: string | null
          type?: string
          uploaded_by?: string
        }
        Relationships: [
          {
            foreignKeyName: "documents_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "documents_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "hierarchy_item_catalog_view"
            referencedColumns: ["project_id"]
          },
          {
            foreignKeyName: "documents_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      entity_asset_links: {
        Row: {
          allocation_id: string | null
          asset_instance_id: string | null
          created_at: string
          id: string
          item_id: string
          link_type: string
          linked_at: string
          linked_by: string | null
          notes: string | null
          project_id: string
          quantity: number
          source_id: string
          source_type: string
          unlinked_at: string | null
          unlinked_by: string | null
        }
        Insert: {
          allocation_id?: string | null
          asset_instance_id?: string | null
          created_at?: string
          id?: string
          item_id: string
          link_type?: string
          linked_at?: string
          linked_by?: string | null
          notes?: string | null
          project_id: string
          quantity?: number
          source_id: string
          source_type: string
          unlinked_at?: string | null
          unlinked_by?: string | null
        }
        Update: {
          allocation_id?: string | null
          asset_instance_id?: string | null
          created_at?: string
          id?: string
          item_id?: string
          link_type?: string
          linked_at?: string
          linked_by?: string | null
          notes?: string | null
          project_id?: string
          quantity?: number
          source_id?: string
          source_type?: string
          unlinked_at?: string | null
          unlinked_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "entity_asset_links_allocation_id_fkey"
            columns: ["allocation_id"]
            isOneToOne: false
            referencedRelation: "catalog_item_allocations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "entity_asset_links_asset_instance_id_fkey"
            columns: ["asset_instance_id"]
            isOneToOne: false
            referencedRelation: "asset_instances"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "entity_asset_links_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "advance_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "entity_asset_links_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "hierarchy_item_catalog_view"
            referencedColumns: ["catalog_item_id"]
          },
          {
            foreignKeyName: "entity_asset_links_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "hierarchy_item_catalog_view"
            referencedColumns: ["project_id"]
          },
          {
            foreignKeyName: "entity_asset_links_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      events: {
        Row: {
          budget_overhead: number
          created_at: string
          deleted_at: string | null
          description: string | null
          end_date: string | null
          id: string
          load_in_date: string | null
          metadata: Json
          name: string
          organization_id: string
          project_id: string
          slug: string
          sort_order: number
          start_date: string | null
          status: Database["public"]["Enums"]["production_level_status"]
          strike_date: string | null
          updated_at: string
          venue_id: string | null
        }
        Insert: {
          budget_overhead?: number
          created_at?: string
          deleted_at?: string | null
          description?: string | null
          end_date?: string | null
          id?: string
          load_in_date?: string | null
          metadata?: Json
          name: string
          organization_id: string
          project_id: string
          slug: string
          sort_order?: number
          start_date?: string | null
          status?: Database["public"]["Enums"]["production_level_status"]
          strike_date?: string | null
          updated_at?: string
          venue_id?: string | null
        }
        Update: {
          budget_overhead?: number
          created_at?: string
          deleted_at?: string | null
          description?: string | null
          end_date?: string | null
          id?: string
          load_in_date?: string | null
          metadata?: Json
          name?: string
          organization_id?: string
          project_id?: string
          slug?: string
          sort_order?: number
          start_date?: string | null
          status?: Database["public"]["Enums"]["production_level_status"]
          strike_date?: string | null
          updated_at?: string
          venue_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "events_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "events_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "hierarchy_item_catalog_view"
            referencedColumns: ["project_id"]
          },
          {
            foreignKeyName: "events_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "events_venue_id_fkey"
            columns: ["venue_id"]
            isOneToOne: false
            referencedRelation: "locations"
            referencedColumns: ["id"]
          },
        ]
      }
      fulfillment_order_items: {
        Row: {
          allocation_id: string
          condition_on_receive: string | null
          created_at: string
          id: string
          item_id: string
          notes: string | null
          order_id: string
          packed: boolean
          packed_at: string | null
          packed_by: string | null
          quantity: number
          received: boolean
          received_at: string | null
          received_by: string | null
        }
        Insert: {
          allocation_id: string
          condition_on_receive?: string | null
          created_at?: string
          id?: string
          item_id: string
          notes?: string | null
          order_id: string
          packed?: boolean
          packed_at?: string | null
          packed_by?: string | null
          quantity?: number
          received?: boolean
          received_at?: string | null
          received_by?: string | null
        }
        Update: {
          allocation_id?: string
          condition_on_receive?: string | null
          created_at?: string
          id?: string
          item_id?: string
          notes?: string | null
          order_id?: string
          packed?: boolean
          packed_at?: string | null
          packed_by?: string | null
          quantity?: number
          received?: boolean
          received_at?: string | null
          received_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fulfillment_order_items_allocation_id_fkey"
            columns: ["allocation_id"]
            isOneToOne: false
            referencedRelation: "catalog_item_allocations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fulfillment_order_items_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "advance_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fulfillment_order_items_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "hierarchy_item_catalog_view"
            referencedColumns: ["catalog_item_id"]
          },
          {
            foreignKeyName: "fulfillment_order_items_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "fulfillment_orders"
            referencedColumns: ["id"]
          },
        ]
      }
      fulfillment_orders: {
        Row: {
          completed_at: string | null
          created_at: string
          created_by: string
          delivered_at: string | null
          destination: string | null
          destination_location_id: string | null
          id: string
          notes: string | null
          origin_entity_id: string | null
          origin_entity_type: string | null
          origin_location_id: string | null
          project_id: string
          reference_number: string | null
          scheduled_at: string | null
          shipment_id: string | null
          shipped_at: string | null
          shipping_details: Json
          shipping_method: string | null
          status: string
          total_items: number
          total_weight_kg: number | null
          type: string
          updated_at: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          created_by: string
          delivered_at?: string | null
          destination?: string | null
          destination_location_id?: string | null
          id?: string
          notes?: string | null
          origin_entity_id?: string | null
          origin_entity_type?: string | null
          origin_location_id?: string | null
          project_id: string
          reference_number?: string | null
          scheduled_at?: string | null
          shipment_id?: string | null
          shipped_at?: string | null
          shipping_details?: Json
          shipping_method?: string | null
          status?: string
          total_items?: number
          total_weight_kg?: number | null
          type?: string
          updated_at?: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          created_by?: string
          delivered_at?: string | null
          destination?: string | null
          destination_location_id?: string | null
          id?: string
          notes?: string | null
          origin_entity_id?: string | null
          origin_entity_type?: string | null
          origin_location_id?: string | null
          project_id?: string
          reference_number?: string | null
          scheduled_at?: string | null
          shipment_id?: string | null
          shipped_at?: string | null
          shipping_details?: Json
          shipping_method?: string | null
          status?: string
          total_items?: number
          total_weight_kg?: number | null
          type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "fulfillment_orders_destination_location_id_fkey"
            columns: ["destination_location_id"]
            isOneToOne: false
            referencedRelation: "locations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fulfillment_orders_origin_location_id_fkey"
            columns: ["origin_location_id"]
            isOneToOne: false
            referencedRelation: "locations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fulfillment_orders_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "hierarchy_item_catalog_view"
            referencedColumns: ["project_id"]
          },
          {
            foreignKeyName: "fulfillment_orders_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fulfillment_orders_shipment_id_fkey"
            columns: ["shipment_id"]
            isOneToOne: false
            referencedRelation: "shipments"
            referencedColumns: ["id"]
          },
        ]
      }
      hierarchy_tasks: {
        Row: {
          activation_id: string | null
          assigned_by: string | null
          assigned_to: string | null
          completed_at: string | null
          completed_by: string | null
          component_id: string | null
          created_at: string
          deleted_at: string | null
          description: string | null
          due_date: string | null
          event_id: string | null
          id: string
          is_gate: boolean
          organization_id: string
          priority: number
          project_id: string | null
          sort_order: number
          status: Database["public"]["Enums"]["task_status"]
          title: string
          updated_at: string
          zone_id: string | null
        }
        Insert: {
          activation_id?: string | null
          assigned_by?: string | null
          assigned_to?: string | null
          completed_at?: string | null
          completed_by?: string | null
          component_id?: string | null
          created_at?: string
          deleted_at?: string | null
          description?: string | null
          due_date?: string | null
          event_id?: string | null
          id?: string
          is_gate?: boolean
          organization_id: string
          priority?: number
          project_id?: string | null
          sort_order?: number
          status?: Database["public"]["Enums"]["task_status"]
          title: string
          updated_at?: string
          zone_id?: string | null
        }
        Update: {
          activation_id?: string | null
          assigned_by?: string | null
          assigned_to?: string | null
          completed_at?: string | null
          completed_by?: string | null
          component_id?: string | null
          created_at?: string
          deleted_at?: string | null
          description?: string | null
          due_date?: string | null
          event_id?: string | null
          id?: string
          is_gate?: boolean
          organization_id?: string
          priority?: number
          project_id?: string | null
          sort_order?: number
          status?: Database["public"]["Enums"]["task_status"]
          title?: string
          updated_at?: string
          zone_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "hierarchy_tasks_activation_id_fkey"
            columns: ["activation_id"]
            isOneToOne: false
            referencedRelation: "activations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "hierarchy_tasks_activation_id_fkey"
            columns: ["activation_id"]
            isOneToOne: false
            referencedRelation: "hierarchy_item_catalog_view"
            referencedColumns: ["activation_id"]
          },
          {
            foreignKeyName: "hierarchy_tasks_component_id_fkey"
            columns: ["component_id"]
            isOneToOne: false
            referencedRelation: "components"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "hierarchy_tasks_component_id_fkey"
            columns: ["component_id"]
            isOneToOne: false
            referencedRelation: "hierarchy_item_catalog_view"
            referencedColumns: ["component_id"]
          },
          {
            foreignKeyName: "hierarchy_tasks_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "hierarchy_tasks_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "hierarchy_item_catalog_view"
            referencedColumns: ["event_id"]
          },
          {
            foreignKeyName: "hierarchy_tasks_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "hierarchy_tasks_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "hierarchy_item_catalog_view"
            referencedColumns: ["project_id"]
          },
          {
            foreignKeyName: "hierarchy_tasks_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "hierarchy_tasks_zone_id_fkey"
            columns: ["zone_id"]
            isOneToOne: false
            referencedRelation: "hierarchy_item_catalog_view"
            referencedColumns: ["zone_id"]
          },
          {
            foreignKeyName: "hierarchy_tasks_zone_id_fkey"
            columns: ["zone_id"]
            isOneToOne: false
            referencedRelation: "zones"
            referencedColumns: ["id"]
          },
        ]
      }
      locations: {
        Row: {
          address: Json
          capacity: Json
          contact: Json
          created_at: string
          id: string
          is_active: boolean
          metadata: Json
          name: string
          organization_id: string
          parent_id: string | null
          project_id: string | null
          slug: string
          type: string
          updated_at: string
        }
        Insert: {
          address?: Json
          capacity?: Json
          contact?: Json
          created_at?: string
          id?: string
          is_active?: boolean
          metadata?: Json
          name: string
          organization_id: string
          parent_id?: string | null
          project_id?: string | null
          slug: string
          type: string
          updated_at?: string
        }
        Update: {
          address?: Json
          capacity?: Json
          contact?: Json
          created_at?: string
          id?: string
          is_active?: boolean
          metadata?: Json
          name?: string
          organization_id?: string
          parent_id?: string | null
          project_id?: string | null
          slug?: string
          type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "locations_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "locations_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "locations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "locations_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "hierarchy_item_catalog_view"
            referencedColumns: ["project_id"]
          },
          {
            foreignKeyName: "locations_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      logistics_schedule_items: {
        Row: {
          allocation_id: string | null
          asset_instance_id: string | null
          created_at: string
          description: string
          id: string
          item_id: string | null
          notes: string | null
          picked_up: boolean
          picked_up_at: string | null
          quantity: number
          schedule_id: string
        }
        Insert: {
          allocation_id?: string | null
          asset_instance_id?: string | null
          created_at?: string
          description: string
          id?: string
          item_id?: string | null
          notes?: string | null
          picked_up?: boolean
          picked_up_at?: string | null
          quantity?: number
          schedule_id: string
        }
        Update: {
          allocation_id?: string | null
          asset_instance_id?: string | null
          created_at?: string
          description?: string
          id?: string
          item_id?: string | null
          notes?: string | null
          picked_up?: boolean
          picked_up_at?: string | null
          quantity?: number
          schedule_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "logistics_schedule_items_allocation_id_fkey"
            columns: ["allocation_id"]
            isOneToOne: false
            referencedRelation: "catalog_item_allocations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "logistics_schedule_items_asset_instance_id_fkey"
            columns: ["asset_instance_id"]
            isOneToOne: false
            referencedRelation: "asset_instances"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "logistics_schedule_items_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "advance_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "logistics_schedule_items_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "hierarchy_item_catalog_view"
            referencedColumns: ["catalog_item_id"]
          },
          {
            foreignKeyName: "logistics_schedule_items_schedule_id_fkey"
            columns: ["schedule_id"]
            isOneToOne: false
            referencedRelation: "logistics_schedules"
            referencedColumns: ["id"]
          },
        ]
      }
      logistics_schedules: {
        Row: {
          actual_end: string | null
          actual_start: string | null
          assigned_to: string | null
          created_at: string
          created_by: string
          description: string | null
          destination_location_id: string | null
          dock_assignment: string | null
          driver_company: string | null
          driver_name: string | null
          driver_phone: string | null
          fulfillment_order_id: string | null
          gate_code: string | null
          id: string
          item_count: number | null
          item_summary: string | null
          metadata: Json
          notes: string | null
          origin_location_id: string | null
          pod_notes: string | null
          priority: string
          project_id: string
          reference_number: string
          requested_by: string
          scheduled_window_end: string
          scheduled_window_start: string
          shipment_id: string | null
          signature_url: string | null
          status: Database["public"]["Enums"]["schedule_status"]
          title: string
          type: Database["public"]["Enums"]["schedule_type"]
          updated_at: string
          vehicle_description: string | null
          vehicle_plate: string | null
          verified_at: string | null
          verified_by: string | null
        }
        Insert: {
          actual_end?: string | null
          actual_start?: string | null
          assigned_to?: string | null
          created_at?: string
          created_by: string
          description?: string | null
          destination_location_id?: string | null
          dock_assignment?: string | null
          driver_company?: string | null
          driver_name?: string | null
          driver_phone?: string | null
          fulfillment_order_id?: string | null
          gate_code?: string | null
          id?: string
          item_count?: number | null
          item_summary?: string | null
          metadata?: Json
          notes?: string | null
          origin_location_id?: string | null
          pod_notes?: string | null
          priority?: string
          project_id: string
          reference_number: string
          requested_by: string
          scheduled_window_end: string
          scheduled_window_start: string
          shipment_id?: string | null
          signature_url?: string | null
          status?: Database["public"]["Enums"]["schedule_status"]
          title: string
          type: Database["public"]["Enums"]["schedule_type"]
          updated_at?: string
          vehicle_description?: string | null
          vehicle_plate?: string | null
          verified_at?: string | null
          verified_by?: string | null
        }
        Update: {
          actual_end?: string | null
          actual_start?: string | null
          assigned_to?: string | null
          created_at?: string
          created_by?: string
          description?: string | null
          destination_location_id?: string | null
          dock_assignment?: string | null
          driver_company?: string | null
          driver_name?: string | null
          driver_phone?: string | null
          fulfillment_order_id?: string | null
          gate_code?: string | null
          id?: string
          item_count?: number | null
          item_summary?: string | null
          metadata?: Json
          notes?: string | null
          origin_location_id?: string | null
          pod_notes?: string | null
          priority?: string
          project_id?: string
          reference_number?: string
          requested_by?: string
          scheduled_window_end?: string
          scheduled_window_start?: string
          shipment_id?: string | null
          signature_url?: string | null
          status?: Database["public"]["Enums"]["schedule_status"]
          title?: string
          type?: Database["public"]["Enums"]["schedule_type"]
          updated_at?: string
          vehicle_description?: string | null
          vehicle_plate?: string | null
          verified_at?: string | null
          verified_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "logistics_schedules_destination_location_id_fkey"
            columns: ["destination_location_id"]
            isOneToOne: false
            referencedRelation: "locations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "logistics_schedules_fulfillment_order_id_fkey"
            columns: ["fulfillment_order_id"]
            isOneToOne: false
            referencedRelation: "fulfillment_orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "logistics_schedules_origin_location_id_fkey"
            columns: ["origin_location_id"]
            isOneToOne: false
            referencedRelation: "locations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "logistics_schedules_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "hierarchy_item_catalog_view"
            referencedColumns: ["project_id"]
          },
          {
            foreignKeyName: "logistics_schedules_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "logistics_schedules_shipment_id_fkey"
            columns: ["shipment_id"]
            isOneToOne: false
            referencedRelation: "shipments"
            referencedColumns: ["id"]
          },
        ]
      }
      lost_found_reports: {
        Row: {
          allocation_id: string | null
          asset_instance_id: string | null
          category: string
          claim_description: string | null
          claimed_at: string | null
          claimed_by_email: string | null
          claimed_by_name: string | null
          claimed_by_phone: string | null
          claimed_by_user_id: string | null
          created_at: string
          created_by: string
          disposal_date: string | null
          estimated_value: number | null
          found_at: string | null
          found_by_email: string | null
          found_by_name: string | null
          found_by_phone: string | null
          found_by_user_id: string | null
          found_location_id: string | null
          id: string
          identifying_features: string | null
          item_brand: string | null
          item_color: string | null
          item_description: string
          last_seen_description: string | null
          lost_at_approx: string | null
          lost_location_id: string | null
          metadata: Json
          notes: string | null
          project_id: string
          reference_number: string
          resolution: string | null
          resolution_notes: string | null
          resolved_at: string | null
          resolved_by: string | null
          shipment_id: string | null
          shipping_address: Json | null
          status: Database["public"]["Enums"]["lf_status"]
          storage_location_id: string | null
          type: Database["public"]["Enums"]["lf_type"]
          updated_at: string
          verification_method: string | null
          verification_notes: string | null
          verified_at: string | null
          verified_by: string | null
        }
        Insert: {
          allocation_id?: string | null
          asset_instance_id?: string | null
          category?: string
          claim_description?: string | null
          claimed_at?: string | null
          claimed_by_email?: string | null
          claimed_by_name?: string | null
          claimed_by_phone?: string | null
          claimed_by_user_id?: string | null
          created_at?: string
          created_by: string
          disposal_date?: string | null
          estimated_value?: number | null
          found_at?: string | null
          found_by_email?: string | null
          found_by_name?: string | null
          found_by_phone?: string | null
          found_by_user_id?: string | null
          found_location_id?: string | null
          id?: string
          identifying_features?: string | null
          item_brand?: string | null
          item_color?: string | null
          item_description: string
          last_seen_description?: string | null
          lost_at_approx?: string | null
          lost_location_id?: string | null
          metadata?: Json
          notes?: string | null
          project_id: string
          reference_number: string
          resolution?: string | null
          resolution_notes?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
          shipment_id?: string | null
          shipping_address?: Json | null
          status?: Database["public"]["Enums"]["lf_status"]
          storage_location_id?: string | null
          type: Database["public"]["Enums"]["lf_type"]
          updated_at?: string
          verification_method?: string | null
          verification_notes?: string | null
          verified_at?: string | null
          verified_by?: string | null
        }
        Update: {
          allocation_id?: string | null
          asset_instance_id?: string | null
          category?: string
          claim_description?: string | null
          claimed_at?: string | null
          claimed_by_email?: string | null
          claimed_by_name?: string | null
          claimed_by_phone?: string | null
          claimed_by_user_id?: string | null
          created_at?: string
          created_by?: string
          disposal_date?: string | null
          estimated_value?: number | null
          found_at?: string | null
          found_by_email?: string | null
          found_by_name?: string | null
          found_by_phone?: string | null
          found_by_user_id?: string | null
          found_location_id?: string | null
          id?: string
          identifying_features?: string | null
          item_brand?: string | null
          item_color?: string | null
          item_description?: string
          last_seen_description?: string | null
          lost_at_approx?: string | null
          lost_location_id?: string | null
          metadata?: Json
          notes?: string | null
          project_id?: string
          reference_number?: string
          resolution?: string | null
          resolution_notes?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
          shipment_id?: string | null
          shipping_address?: Json | null
          status?: Database["public"]["Enums"]["lf_status"]
          storage_location_id?: string | null
          type?: Database["public"]["Enums"]["lf_type"]
          updated_at?: string
          verification_method?: string | null
          verification_notes?: string | null
          verified_at?: string | null
          verified_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "lost_found_reports_allocation_id_fkey"
            columns: ["allocation_id"]
            isOneToOne: false
            referencedRelation: "catalog_item_allocations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lost_found_reports_asset_instance_id_fkey"
            columns: ["asset_instance_id"]
            isOneToOne: false
            referencedRelation: "asset_instances"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lost_found_reports_found_location_id_fkey"
            columns: ["found_location_id"]
            isOneToOne: false
            referencedRelation: "locations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lost_found_reports_lost_location_id_fkey"
            columns: ["lost_location_id"]
            isOneToOne: false
            referencedRelation: "locations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lost_found_reports_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "hierarchy_item_catalog_view"
            referencedColumns: ["project_id"]
          },
          {
            foreignKeyName: "lost_found_reports_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lost_found_reports_shipment_id_fkey"
            columns: ["shipment_id"]
            isOneToOne: false
            referencedRelation: "shipments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lost_found_reports_storage_location_id_fkey"
            columns: ["storage_location_id"]
            isOneToOne: false
            referencedRelation: "locations"
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
            referencedRelation: "hierarchy_item_catalog_view"
            referencedColumns: ["project_id"]
          },
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
            referencedRelation: "hierarchy_item_catalog_view"
            referencedColumns: ["project_id"]
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
      notification_trigger_rules: {
        Row: {
          cooldown_minutes: number | null
          created_at: string
          id: string
          is_active: boolean
          organization_id: string | null
          project_id: string | null
          recipient_filter: Json
          template_id: string
          trigger_event: string
          updated_at: string
        }
        Insert: {
          cooldown_minutes?: number | null
          created_at?: string
          id?: string
          is_active?: boolean
          organization_id?: string | null
          project_id?: string | null
          recipient_filter?: Json
          template_id: string
          trigger_event: string
          updated_at?: string
        }
        Update: {
          cooldown_minutes?: number | null
          created_at?: string
          id?: string
          is_active?: boolean
          organization_id?: string | null
          project_id?: string | null
          recipient_filter?: Json
          template_id?: string
          trigger_event?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "notification_trigger_rules_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notification_trigger_rules_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "hierarchy_item_catalog_view"
            referencedColumns: ["project_id"]
          },
          {
            foreignKeyName: "notification_trigger_rules_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notification_trigger_rules_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "notification_templates"
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
            referencedRelation: "hierarchy_item_catalog_view"
            referencedColumns: ["project_id"]
          },
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
          budget_overhead: number
          client_id: string | null
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
          timezone: string
          type: Database["public"]["Enums"]["project_type"]
          updated_at: string
          venue_id: string | null
        }
        Insert: {
          budget_overhead?: number
          client_id?: string | null
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
          timezone?: string
          type?: Database["public"]["Enums"]["project_type"]
          updated_at?: string
          venue_id?: string | null
        }
        Update: {
          budget_overhead?: number
          client_id?: string | null
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
          timezone?: string
          type?: Database["public"]["Enums"]["project_type"]
          updated_at?: string
          venue_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "projects_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "projects_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "projects_venue_id_fkey"
            columns: ["venue_id"]
            isOneToOne: false
            referencedRelation: "locations"
            referencedColumns: ["id"]
          },
        ]
      }
      purchase_order_items: {
        Row: {
          created_at: string
          description: string
          id: string
          item_id: string | null
          line_number: number
          line_total: number | null
          notes: string | null
          po_id: string
          quantity_ordered: number
          quantity_received: number
          sku: string | null
          unit_cost: number
        }
        Insert: {
          created_at?: string
          description: string
          id?: string
          item_id?: string | null
          line_number?: number
          line_total?: number | null
          notes?: string | null
          po_id: string
          quantity_ordered: number
          quantity_received?: number
          sku?: string | null
          unit_cost?: number
        }
        Update: {
          created_at?: string
          description?: string
          id?: string
          item_id?: string | null
          line_number?: number
          line_total?: number | null
          notes?: string | null
          po_id?: string
          quantity_ordered?: number
          quantity_received?: number
          sku?: string | null
          unit_cost?: number
        }
        Relationships: [
          {
            foreignKeyName: "purchase_order_items_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "advance_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "purchase_order_items_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "hierarchy_item_catalog_view"
            referencedColumns: ["catalog_item_id"]
          },
          {
            foreignKeyName: "purchase_order_items_po_id_fkey"
            columns: ["po_id"]
            isOneToOne: false
            referencedRelation: "purchase_orders"
            referencedColumns: ["id"]
          },
        ]
      }
      purchase_orders: {
        Row: {
          approved_at: string | null
          approved_by: string | null
          cancellation_reason: string | null
          cancelled_at: string | null
          cancelled_by: string | null
          created_at: string
          created_by: string
          currency: string
          expected_delivery: string | null
          id: string
          internal_notes: string | null
          notes: string | null
          order_date: string
          payment_terms: string | null
          po_number: string
          project_id: string
          shipping_address_id: string | null
          shipping_cost: number
          status: Database["public"]["Enums"]["po_status"]
          submitted_at: string | null
          subtotal: number
          tax: number
          total: number
          updated_at: string
          vendor_id: string | null
        }
        Insert: {
          approved_at?: string | null
          approved_by?: string | null
          cancellation_reason?: string | null
          cancelled_at?: string | null
          cancelled_by?: string | null
          created_at?: string
          created_by: string
          currency?: string
          expected_delivery?: string | null
          id?: string
          internal_notes?: string | null
          notes?: string | null
          order_date?: string
          payment_terms?: string | null
          po_number: string
          project_id: string
          shipping_address_id?: string | null
          shipping_cost?: number
          status?: Database["public"]["Enums"]["po_status"]
          submitted_at?: string | null
          subtotal?: number
          tax?: number
          total?: number
          updated_at?: string
          vendor_id?: string | null
        }
        Update: {
          approved_at?: string | null
          approved_by?: string | null
          cancellation_reason?: string | null
          cancelled_at?: string | null
          cancelled_by?: string | null
          created_at?: string
          created_by?: string
          currency?: string
          expected_delivery?: string | null
          id?: string
          internal_notes?: string | null
          notes?: string | null
          order_date?: string
          payment_terms?: string | null
          po_number?: string
          project_id?: string
          shipping_address_id?: string | null
          shipping_cost?: number
          status?: Database["public"]["Enums"]["po_status"]
          submitted_at?: string | null
          subtotal?: number
          tax?: number
          total?: number
          updated_at?: string
          vendor_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "purchase_orders_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "hierarchy_item_catalog_view"
            referencedColumns: ["project_id"]
          },
          {
            foreignKeyName: "purchase_orders_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "purchase_orders_shipping_address_id_fkey"
            columns: ["shipping_address_id"]
            isOneToOne: false
            referencedRelation: "locations"
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
      receiving_record_items: {
        Row: {
          condition: string
          created_at: string
          description: string
          id: string
          inspected_by: string | null
          item_id: string | null
          notes: string | null
          po_item_id: string | null
          quantity_damaged: number
          quantity_expected: number
          quantity_missing: number
          quantity_received: number
          receiving_id: string
        }
        Insert: {
          condition?: string
          created_at?: string
          description: string
          id?: string
          inspected_by?: string | null
          item_id?: string | null
          notes?: string | null
          po_item_id?: string | null
          quantity_damaged?: number
          quantity_expected?: number
          quantity_missing?: number
          quantity_received?: number
          receiving_id: string
        }
        Update: {
          condition?: string
          created_at?: string
          description?: string
          id?: string
          inspected_by?: string | null
          item_id?: string | null
          notes?: string | null
          po_item_id?: string | null
          quantity_damaged?: number
          quantity_expected?: number
          quantity_missing?: number
          quantity_received?: number
          receiving_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "receiving_record_items_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "advance_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "receiving_record_items_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "hierarchy_item_catalog_view"
            referencedColumns: ["catalog_item_id"]
          },
          {
            foreignKeyName: "receiving_record_items_po_item_id_fkey"
            columns: ["po_item_id"]
            isOneToOne: false
            referencedRelation: "purchase_order_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "receiving_record_items_receiving_id_fkey"
            columns: ["receiving_id"]
            isOneToOne: false
            referencedRelation: "receiving_records"
            referencedColumns: ["id"]
          },
        ]
      }
      receiving_records: {
        Row: {
          carrier_name: string | null
          created_at: string
          created_by: string
          id: string
          inspected_at: string | null
          inspected_by: string | null
          location_id: string
          notes: string | null
          po_id: string | null
          project_id: string
          received_at: string | null
          received_by: string | null
          reference_number: string
          source: string
          status: Database["public"]["Enums"]["receiving_status"]
          tracking_number: string | null
          updated_at: string
          vendor_id: string | null
        }
        Insert: {
          carrier_name?: string | null
          created_at?: string
          created_by: string
          id?: string
          inspected_at?: string | null
          inspected_by?: string | null
          location_id: string
          notes?: string | null
          po_id?: string | null
          project_id: string
          received_at?: string | null
          received_by?: string | null
          reference_number: string
          source?: string
          status?: Database["public"]["Enums"]["receiving_status"]
          tracking_number?: string | null
          updated_at?: string
          vendor_id?: string | null
        }
        Update: {
          carrier_name?: string | null
          created_at?: string
          created_by?: string
          id?: string
          inspected_at?: string | null
          inspected_by?: string | null
          location_id?: string
          notes?: string | null
          po_id?: string | null
          project_id?: string
          received_at?: string | null
          received_by?: string | null
          reference_number?: string
          source?: string
          status?: Database["public"]["Enums"]["receiving_status"]
          tracking_number?: string | null
          updated_at?: string
          vendor_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "receiving_records_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "locations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "receiving_records_po_id_fkey"
            columns: ["po_id"]
            isOneToOne: false
            referencedRelation: "purchase_orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "receiving_records_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "hierarchy_item_catalog_view"
            referencedColumns: ["project_id"]
          },
          {
            foreignKeyName: "receiving_records_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "receiving_records_vendor_id_fkey"
            columns: ["vendor_id"]
            isOneToOne: false
            referencedRelation: "vendors"
            referencedColumns: ["id"]
          },
        ]
      }
      schedule_entries: {
        Row: {
          all_day: boolean
          assigned_to: string | null
          category: Database["public"]["Enums"]["schedule_entry_category"]
          color: string | null
          created_at: string
          ends_at: string | null
          icon: string | null
          id: string
          is_cancelled: boolean
          location_id: string | null
          metadata: Json
          priority: string | null
          project_id: string
          recurrence_parent_id: string | null
          rrule: string | null
          rrule_until: string | null
          source_field: string
          source_id: string | null
          source_type: Database["public"]["Enums"]["schedule_entry_source"]
          space_id: string | null
          starts_at: string
          status: string | null
          subtitle: string | null
          title: string
          updated_at: string
          visibility: string[]
        }
        Insert: {
          all_day?: boolean
          assigned_to?: string | null
          category: Database["public"]["Enums"]["schedule_entry_category"]
          color?: string | null
          created_at?: string
          ends_at?: string | null
          icon?: string | null
          id?: string
          is_cancelled?: boolean
          location_id?: string | null
          metadata?: Json
          priority?: string | null
          project_id: string
          recurrence_parent_id?: string | null
          rrule?: string | null
          rrule_until?: string | null
          source_field: string
          source_id?: string | null
          source_type: Database["public"]["Enums"]["schedule_entry_source"]
          space_id?: string | null
          starts_at: string
          status?: string | null
          subtitle?: string | null
          title: string
          updated_at?: string
          visibility?: string[]
        }
        Update: {
          all_day?: boolean
          assigned_to?: string | null
          category?: Database["public"]["Enums"]["schedule_entry_category"]
          color?: string | null
          created_at?: string
          ends_at?: string | null
          icon?: string | null
          id?: string
          is_cancelled?: boolean
          location_id?: string | null
          metadata?: Json
          priority?: string | null
          project_id?: string
          recurrence_parent_id?: string | null
          rrule?: string | null
          rrule_until?: string | null
          source_field?: string
          source_id?: string | null
          source_type?: Database["public"]["Enums"]["schedule_entry_source"]
          space_id?: string | null
          starts_at?: string
          status?: string | null
          subtitle?: string | null
          title?: string
          updated_at?: string
          visibility?: string[]
        }
        Relationships: [
          {
            foreignKeyName: "schedule_entries_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "locations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "schedule_entries_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "hierarchy_item_catalog_view"
            referencedColumns: ["project_id"]
          },
          {
            foreignKeyName: "schedule_entries_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "schedule_entries_recurrence_parent_id_fkey"
            columns: ["recurrence_parent_id"]
            isOneToOne: false
            referencedRelation: "schedule_entries"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "schedule_entries_recurrence_parent_id_fkey"
            columns: ["recurrence_parent_id"]
            isOneToOne: false
            referencedRelation: "v_master_schedule"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "schedule_entries_space_id_fkey"
            columns: ["space_id"]
            isOneToOne: false
            referencedRelation: "spaces"
            referencedColumns: ["id"]
          },
        ]
      }
      schedule_reminders: {
        Row: {
          channel: string
          created_at: string
          id: string
          is_sent: boolean
          lead_minutes: number
          recipient_id: string | null
          schedule_entry_id: string
          sent_at: string | null
        }
        Insert: {
          channel?: string
          created_at?: string
          id?: string
          is_sent?: boolean
          lead_minutes?: number
          recipient_id?: string | null
          schedule_entry_id: string
          sent_at?: string | null
        }
        Update: {
          channel?: string
          created_at?: string
          id?: string
          is_sent?: boolean
          lead_minutes?: number
          recipient_id?: string | null
          schedule_entry_id?: string
          sent_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "schedule_reminders_schedule_entry_id_fkey"
            columns: ["schedule_entry_id"]
            isOneToOne: false
            referencedRelation: "schedule_entries"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "schedule_reminders_schedule_entry_id_fkey"
            columns: ["schedule_entry_id"]
            isOneToOne: false
            referencedRelation: "v_master_schedule"
            referencedColumns: ["id"]
          },
        ]
      }
      shipment_events: {
        Row: {
          city: string | null
          description: string | null
          id: string
          location: string | null
          recorded_at: string
          recorded_by: string | null
          shipment_id: string
          source: string
          state: string | null
          status: Database["public"]["Enums"]["shipment_status"]
        }
        Insert: {
          city?: string | null
          description?: string | null
          id?: string
          location?: string | null
          recorded_at?: string
          recorded_by?: string | null
          shipment_id: string
          source?: string
          state?: string | null
          status: Database["public"]["Enums"]["shipment_status"]
        }
        Update: {
          city?: string | null
          description?: string | null
          id?: string
          location?: string | null
          recorded_at?: string
          recorded_by?: string | null
          shipment_id?: string
          source?: string
          state?: string | null
          status?: Database["public"]["Enums"]["shipment_status"]
        }
        Relationships: [
          {
            foreignKeyName: "shipment_events_shipment_id_fkey"
            columns: ["shipment_id"]
            isOneToOne: false
            referencedRelation: "shipments"
            referencedColumns: ["id"]
          },
        ]
      }
      shipments: {
        Row: {
          actual_delivery_at: string | null
          actual_pickup_at: string | null
          bol_number: string | null
          carrier_id: string | null
          carrier_name: string | null
          cost: number | null
          created_at: string
          created_by: string
          destination_address: Json
          destination_location_id: string | null
          dimensions: Json | null
          direction: Database["public"]["Enums"]["shipment_direction"]
          estimated_delivery_at: string | null
          freight_class: string | null
          fulfillment_order_id: string | null
          id: string
          insurance_value: number | null
          metadata: Json
          notes: string | null
          organization_id: string
          origin_address: Json
          origin_location_id: string | null
          pallet_count: number | null
          piece_count: number | null
          po_id: string | null
          pro_number: string | null
          project_id: string | null
          reference_number: string
          scheduled_delivery_at: string | null
          scheduled_pickup_at: string | null
          service_level: string | null
          signature_url: string | null
          signed_by: string | null
          special_instructions: string | null
          status: Database["public"]["Enums"]["shipment_status"]
          tracking_number: string | null
          tracking_url: string | null
          updated_at: string
          weight_kg: number | null
        }
        Insert: {
          actual_delivery_at?: string | null
          actual_pickup_at?: string | null
          bol_number?: string | null
          carrier_id?: string | null
          carrier_name?: string | null
          cost?: number | null
          created_at?: string
          created_by: string
          destination_address?: Json
          destination_location_id?: string | null
          dimensions?: Json | null
          direction: Database["public"]["Enums"]["shipment_direction"]
          estimated_delivery_at?: string | null
          freight_class?: string | null
          fulfillment_order_id?: string | null
          id?: string
          insurance_value?: number | null
          metadata?: Json
          notes?: string | null
          organization_id: string
          origin_address?: Json
          origin_location_id?: string | null
          pallet_count?: number | null
          piece_count?: number | null
          po_id?: string | null
          pro_number?: string | null
          project_id?: string | null
          reference_number: string
          scheduled_delivery_at?: string | null
          scheduled_pickup_at?: string | null
          service_level?: string | null
          signature_url?: string | null
          signed_by?: string | null
          special_instructions?: string | null
          status?: Database["public"]["Enums"]["shipment_status"]
          tracking_number?: string | null
          tracking_url?: string | null
          updated_at?: string
          weight_kg?: number | null
        }
        Update: {
          actual_delivery_at?: string | null
          actual_pickup_at?: string | null
          bol_number?: string | null
          carrier_id?: string | null
          carrier_name?: string | null
          cost?: number | null
          created_at?: string
          created_by?: string
          destination_address?: Json
          destination_location_id?: string | null
          dimensions?: Json | null
          direction?: Database["public"]["Enums"]["shipment_direction"]
          estimated_delivery_at?: string | null
          freight_class?: string | null
          fulfillment_order_id?: string | null
          id?: string
          insurance_value?: number | null
          metadata?: Json
          notes?: string | null
          organization_id?: string
          origin_address?: Json
          origin_location_id?: string | null
          pallet_count?: number | null
          piece_count?: number | null
          po_id?: string | null
          pro_number?: string | null
          project_id?: string | null
          reference_number?: string
          scheduled_delivery_at?: string | null
          scheduled_pickup_at?: string | null
          service_level?: string | null
          signature_url?: string | null
          signed_by?: string | null
          special_instructions?: string | null
          status?: Database["public"]["Enums"]["shipment_status"]
          tracking_number?: string | null
          tracking_url?: string | null
          updated_at?: string
          weight_kg?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "shipments_carrier_id_fkey"
            columns: ["carrier_id"]
            isOneToOne: false
            referencedRelation: "vendors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "shipments_destination_location_id_fkey"
            columns: ["destination_location_id"]
            isOneToOne: false
            referencedRelation: "locations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "shipments_fulfillment_order_id_fkey"
            columns: ["fulfillment_order_id"]
            isOneToOne: false
            referencedRelation: "fulfillment_orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "shipments_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "shipments_origin_location_id_fkey"
            columns: ["origin_location_id"]
            isOneToOne: false
            referencedRelation: "locations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "shipments_po_id_fkey"
            columns: ["po_id"]
            isOneToOne: false
            referencedRelation: "purchase_orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "shipments_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "hierarchy_item_catalog_view"
            referencedColumns: ["project_id"]
          },
          {
            foreignKeyName: "shipments_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
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
          location_id: string | null
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
          location_id?: string | null
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
          location_id?: string | null
          name?: string
          project_id?: string
          settings?: Json
          sort_order?: number
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "spaces_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "locations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "spaces_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "hierarchy_item_catalog_view"
            referencedColumns: ["project_id"]
          },
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
      ticket_promo_codes: {
        Row: {
          code: string
          created_at: string
          discount_type: string
          discount_value: number
          id: string
          project_id: string
          tier_id: string | null
          usage_count: number
          usage_limit: number | null
          valid_from: string | null
          valid_until: string | null
        }
        Insert: {
          code: string
          created_at?: string
          discount_type?: string
          discount_value?: number
          id?: string
          project_id: string
          tier_id?: string | null
          usage_count?: number
          usage_limit?: number | null
          valid_from?: string | null
          valid_until?: string | null
        }
        Update: {
          code?: string
          created_at?: string
          discount_type?: string
          discount_value?: number
          id?: string
          project_id?: string
          tier_id?: string | null
          usage_count?: number
          usage_limit?: number | null
          valid_from?: string | null
          valid_until?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ticket_promo_codes_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "hierarchy_item_catalog_view"
            referencedColumns: ["project_id"]
          },
          {
            foreignKeyName: "ticket_promo_codes_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ticket_promo_codes_tier_id_fkey"
            columns: ["tier_id"]
            isOneToOne: false
            referencedRelation: "ticket_tiers"
            referencedColumns: ["id"]
          },
        ]
      }
      ticket_scans: {
        Row: {
          id: string
          location_id: string | null
          method: Database["public"]["Enums"]["check_in_method"]
          notes: string | null
          result: string
          scanned_at: string
          scanned_by: string
          ticket_id: string
        }
        Insert: {
          id?: string
          location_id?: string | null
          method?: Database["public"]["Enums"]["check_in_method"]
          notes?: string | null
          result?: string
          scanned_at?: string
          scanned_by: string
          ticket_id: string
        }
        Update: {
          id?: string
          location_id?: string | null
          method?: Database["public"]["Enums"]["check_in_method"]
          notes?: string | null
          result?: string
          scanned_at?: string
          scanned_by?: string
          ticket_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ticket_scans_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "locations"
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
      ticket_tiers: {
        Row: {
          capacity: number | null
          created_at: string
          currency: string
          description: string | null
          id: string
          name: string
          price_cents: number
          project_id: string
          sale_end: string | null
          sale_start: string | null
          settings: Json
          sort_order: number
        }
        Insert: {
          capacity?: number | null
          created_at?: string
          currency?: string
          description?: string | null
          id?: string
          name: string
          price_cents?: number
          project_id: string
          sale_end?: string | null
          sale_start?: string | null
          settings?: Json
          sort_order?: number
        }
        Update: {
          capacity?: number | null
          created_at?: string
          currency?: string
          description?: string | null
          id?: string
          name?: string
          price_cents?: number
          project_id?: string
          sale_end?: string | null
          sale_start?: string | null
          settings?: Json
          sort_order?: number
        }
        Relationships: [
          {
            foreignKeyName: "ticket_tiers_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "hierarchy_item_catalog_view"
            referencedColumns: ["project_id"]
          },
          {
            foreignKeyName: "ticket_tiers_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      ticket_transfers: {
        Row: {
          from_email: string | null
          from_user_id: string | null
          id: string
          initiated_by: string | null
          ticket_id: string
          to_email: string
          to_user_id: string | null
          transferred_at: string
        }
        Insert: {
          from_email?: string | null
          from_user_id?: string | null
          id?: string
          initiated_by?: string | null
          ticket_id: string
          to_email: string
          to_user_id?: string | null
          transferred_at?: string
        }
        Update: {
          from_email?: string | null
          from_user_id?: string | null
          id?: string
          initiated_by?: string | null
          ticket_id?: string
          to_email?: string
          to_user_id?: string | null
          transferred_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "ticket_transfers_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "tickets"
            referencedColumns: ["id"]
          },
        ]
      }
      tickets: {
        Row: {
          barcode_data: string | null
          created_at: string
          holder_email: string | null
          holder_name: string | null
          holder_user_id: string | null
          id: string
          metadata: Json
          order_reference: string | null
          project_id: string
          purchased_at: string | null
          qr_data: string | null
          scanned_at: string | null
          scanned_by: string | null
          status: Database["public"]["Enums"]["ticket_status"]
          tier_id: string
        }
        Insert: {
          barcode_data?: string | null
          created_at?: string
          holder_email?: string | null
          holder_name?: string | null
          holder_user_id?: string | null
          id?: string
          metadata?: Json
          order_reference?: string | null
          project_id: string
          purchased_at?: string | null
          qr_data?: string | null
          scanned_at?: string | null
          scanned_by?: string | null
          status?: Database["public"]["Enums"]["ticket_status"]
          tier_id: string
        }
        Update: {
          barcode_data?: string | null
          created_at?: string
          holder_email?: string | null
          holder_name?: string | null
          holder_user_id?: string | null
          id?: string
          metadata?: Json
          order_reference?: string | null
          project_id?: string
          purchased_at?: string | null
          qr_data?: string | null
          scanned_at?: string | null
          scanned_by?: string | null
          status?: Database["public"]["Enums"]["ticket_status"]
          tier_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "tickets_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "hierarchy_item_catalog_view"
            referencedColumns: ["project_id"]
          },
          {
            foreignKeyName: "tickets_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tickets_tier_id_fkey"
            columns: ["tier_id"]
            isOneToOne: false
            referencedRelation: "ticket_tiers"
            referencedColumns: ["id"]
          },
        ]
      }
      vendor_contacts: {
        Row: {
          created_at: string
          email: string | null
          id: string
          is_primary: boolean
          name: string
          notes: string | null
          phone: string | null
          title: string | null
          vendor_id: string
        }
        Insert: {
          created_at?: string
          email?: string | null
          id?: string
          is_primary?: boolean
          name: string
          notes?: string | null
          phone?: string | null
          title?: string | null
          vendor_id: string
        }
        Update: {
          created_at?: string
          email?: string | null
          id?: string
          is_primary?: boolean
          name?: string
          notes?: string | null
          phone?: string | null
          title?: string | null
          vendor_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "vendor_contacts_vendor_id_fkey"
            columns: ["vendor_id"]
            isOneToOne: false
            referencedRelation: "vendors"
            referencedColumns: ["id"]
          },
        ]
      }
      vendors: {
        Row: {
          address: Json
          contact: Json
          created_at: string
          id: string
          is_active: boolean
          metadata: Json
          name: string
          notes: string | null
          organization_id: string
          payment_terms: string | null
          rating: number | null
          slug: string
          tax_id: string | null
          type: string
          updated_at: string
          website: string | null
        }
        Insert: {
          address?: Json
          contact?: Json
          created_at?: string
          id?: string
          is_active?: boolean
          metadata?: Json
          name: string
          notes?: string | null
          organization_id: string
          payment_terms?: string | null
          rating?: number | null
          slug: string
          tax_id?: string | null
          type?: string
          updated_at?: string
          website?: string | null
        }
        Update: {
          address?: Json
          contact?: Json
          created_at?: string
          id?: string
          is_active?: boolean
          metadata?: Json
          name?: string
          notes?: string | null
          organization_id?: string
          payment_terms?: string | null
          rating?: number | null
          slug?: string
          tax_id?: string | null
          type?: string
          updated_at?: string
          website?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "vendors_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      zones: {
        Row: {
          budget_overhead: number
          capacity: number | null
          created_at: string
          deleted_at: string | null
          description: string | null
          event_id: string
          id: string
          location_id: string | null
          metadata: Json
          name: string
          organization_id: string
          slug: string
          sort_order: number
          status: Database["public"]["Enums"]["production_level_status"]
          type: Database["public"]["Enums"]["zone_type"]
          updated_at: string
        }
        Insert: {
          budget_overhead?: number
          capacity?: number | null
          created_at?: string
          deleted_at?: string | null
          description?: string | null
          event_id: string
          id?: string
          location_id?: string | null
          metadata?: Json
          name: string
          organization_id: string
          slug: string
          sort_order?: number
          status?: Database["public"]["Enums"]["production_level_status"]
          type?: Database["public"]["Enums"]["zone_type"]
          updated_at?: string
        }
        Update: {
          budget_overhead?: number
          capacity?: number | null
          created_at?: string
          deleted_at?: string | null
          description?: string | null
          event_id?: string
          id?: string
          location_id?: string | null
          metadata?: Json
          name?: string
          organization_id?: string
          slug?: string
          sort_order?: number
          status?: Database["public"]["Enums"]["production_level_status"]
          type?: Database["public"]["Enums"]["zone_type"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "zones_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "zones_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "hierarchy_item_catalog_view"
            referencedColumns: ["event_id"]
          },
          {
            foreignKeyName: "zones_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "locations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "zones_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      hierarchy_item_catalog_view: {
        Row: {
          activation_id: string | null
          activation_name: string | null
          activation_type: Database["public"]["Enums"]["activation_type"] | null
          catalog_item_id: string | null
          category_id: string | null
          category_name: string | null
          category_slug: string | null
          component_id: string | null
          component_item_id: string | null
          component_name: string | null
          component_type: Database["public"]["Enums"]["component_type"] | null
          event_id: string | null
          event_name: string | null
          group_color: string | null
          group_id: string | null
          group_name: string | null
          group_slug: string | null
          item_name: string | null
          item_slug: string | null
          item_status:
            | Database["public"]["Enums"]["production_level_status"]
            | null
          line_total: number | null
          manufacturer: string | null
          model: string | null
          organization_id: string | null
          project_id: string | null
          project_name: string | null
          quantity: number | null
          subcategory_id: string | null
          subcategory_name: string | null
          subcategory_slug: string | null
          unit: string | null
          unit_cost: number | null
          zone_id: string | null
          zone_name: string | null
          zone_type: Database["public"]["Enums"]["zone_type"] | null
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
      v_master_schedule: {
        Row: {
          all_day: boolean | null
          assigned_to: string | null
          assignee_name: string | null
          category:
            | Database["public"]["Enums"]["schedule_entry_category"]
            | null
          color: string | null
          created_at: string | null
          ends_at: string | null
          icon: string | null
          id: string | null
          is_cancelled: boolean | null
          is_recurring: boolean | null
          location_id: string | null
          location_name: string | null
          metadata: Json | null
          pending_reminders: number | null
          priority: string | null
          project_id: string | null
          project_name: string | null
          project_slug: string | null
          project_timezone: string | null
          recurrence_parent_id: string | null
          rrule: string | null
          rrule_until: string | null
          source_field: string | null
          source_id: string | null
          source_type:
            | Database["public"]["Enums"]["schedule_entry_source"]
            | null
          space_id: string | null
          space_name: string | null
          starts_at: string | null
          status: string | null
          subtitle: string | null
          title: string | null
          updated_at: string | null
          visibility: string[] | null
        }
        Relationships: [
          {
            foreignKeyName: "schedule_entries_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "locations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "schedule_entries_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "hierarchy_item_catalog_view"
            referencedColumns: ["project_id"]
          },
          {
            foreignKeyName: "schedule_entries_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "schedule_entries_recurrence_parent_id_fkey"
            columns: ["recurrence_parent_id"]
            isOneToOne: false
            referencedRelation: "schedule_entries"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "schedule_entries_recurrence_parent_id_fkey"
            columns: ["recurrence_parent_id"]
            isOneToOne: false
            referencedRelation: "v_master_schedule"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "schedule_entries_space_id_fkey"
            columns: ["space_id"]
            isOneToOne: false
            referencedRelation: "spaces"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      activation_project_id: { Args: { aid: string }; Returns: string }
      budget_rollup: {
        Args: { p_project_id: string }
        Returns: {
          item_cost: number
          level: string
          level_id: string
          level_name: string
          overhead: number
          parent_id: string
          total_cost: number
        }[]
      }
      component_project_id: { Args: { cid: string }; Returns: string }
      detect_schedule_conflicts: {
        Args: {
          p_ends_at: string
          p_exclude_id?: string
          p_location_id?: string
          p_project_id: string
          p_space_id?: string
          p_starts_at: string
        }
        Returns: {
          all_day: boolean
          assigned_to: string | null
          category: Database["public"]["Enums"]["schedule_entry_category"]
          color: string | null
          created_at: string
          ends_at: string | null
          icon: string | null
          id: string
          is_cancelled: boolean
          location_id: string | null
          metadata: Json
          priority: string | null
          project_id: string
          recurrence_parent_id: string | null
          rrule: string | null
          rrule_until: string | null
          source_field: string
          source_id: string | null
          source_type: Database["public"]["Enums"]["schedule_entry_source"]
          space_id: string | null
          starts_at: string
          status: string | null
          subtitle: string | null
          title: string
          updated_at: string
          visibility: string[]
        }[]
        SetofOptions: {
          from: "*"
          to: "schedule_entries"
          isOneToOne: false
          isSetofReturn: true
        }
      }
      event_project_id: { Args: { eid: string }; Returns: string }
      expand_recurrence: {
        Args: { p_occurrences: string[]; p_parent_id: string }
        Returns: number
      }
      is_internal_on_project: { Args: { proj_id: string }; Returns: boolean }
      is_org_member: { Args: { org_id: string }; Returns: boolean }
      is_project_member: { Args: { proj_id: string }; Returns: boolean }
      is_talent_on_project: { Args: { proj_id: string }; Returns: boolean }
      process_schedule_reminders: { Args: never; Returns: number }
      user_org_role: {
        Args: { org_id: string }
        Returns: Database["public"]["Enums"]["platform_role"]
      }
      user_project_role: {
        Args: { proj_id: string }
        Returns: Database["public"]["Enums"]["platform_role"]
      }
      zone_project_id: { Args: { zid: string }; Returns: string }
    }
    Enums: {
      activation_type:
        | "performance"
        | "sampling"
        | "photo_op"
        | "installation"
        | "service"
        | "retail"
        | "registration"
        | "lounge"
        | "dining"
        | "bar"
        | "custom"
      allocation_state:
        | "reserved"
        | "confirmed"
        | "in_transit"
        | "on_site"
        | "checked_out"
        | "returned"
        | "maintenance"
      asset_status:
        | "available"
        | "allocated"
        | "checked_out"
        | "in_transit"
        | "maintenance"
        | "lost"
        | "retired"
      catering_alloc_status: "allocated" | "confirmed" | "checked_in"
      check_in_method: "scan" | "manual"
      component_type:
        | "buildable"
        | "scenic"
        | "technical"
        | "service"
        | "furniture"
        | "signage"
        | "infrastructure"
        | "custom"
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
      lf_status:
        | "reported"
        | "cataloged"
        | "claimed"
        | "verified"
        | "returned"
        | "shipped"
        | "unclaimed"
        | "disposed"
      lf_type: "lost" | "found"
      notification_channel: "email" | "sms" | "in_app"
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
        | "collaborator"
        | "executive"
        | "production"
        | "management"
        | "crew"
        | "staff"
        | "talent"
        | "press"
        | "guest"
        | "attendee"
      po_status:
        | "draft"
        | "submitted"
        | "acknowledged"
        | "partially_received"
        | "received"
        | "closed"
        | "cancelled"
      portal_track:
        | "artist"
        | "production"
        | "sponsor"
        | "guest"
        | "client"
        | "press"
        | "attendee"
        | "talent"
        | "crew"
        | "staff"
        | "management"
      production_level_status:
        | "draft"
        | "advancing"
        | "confirmed"
        | "locked"
        | "complete"
        | "archived"
      project_status: "draft" | "active" | "completed" | "archived"
      project_type: "talent_advance" | "production_advance" | "hybrid"
      receiving_status: "scheduled" | "in_progress" | "completed" | "disputed"
      schedule_entry_category:
        | "show"
        | "production"
        | "logistics"
        | "catering"
        | "deadline"
        | "credential"
        | "ticketing"
        | "meeting"
        | "inspection"
        | "milestone"
        | "shift"
        | "hours_of_operation"
      schedule_entry_source:
        | "project"
        | "act"
        | "deliverable"
        | "catering_meal_plan"
        | "credential_order"
        | "credential_badge"
        | "fulfillment_order"
        | "logistics_schedule"
        | "purchase_order"
        | "receiving_record"
        | "shipment"
        | "ticket_tier"
        | "ticket_promo_code"
        | "location"
        | "manual"
      schedule_status:
        | "requested"
        | "scheduled"
        | "confirmed"
        | "in_progress"
        | "completed"
        | "cancelled"
        | "no_show"
      schedule_type:
        | "pickup"
        | "delivery"
        | "transfer"
        | "vendor_return"
        | "will_call"
      shipment_direction: "inbound" | "outbound" | "inter_location"
      shipment_status:
        | "booked"
        | "label_created"
        | "picked_up"
        | "in_transit"
        | "out_for_delivery"
        | "delivered"
        | "exception"
        | "cancelled"
      task_status:
        | "pending"
        | "in_progress"
        | "completed"
        | "blocked"
        | "cancelled"
      template_scope: "personal" | "org" | "global"
      ticket_status:
        | "reserved"
        | "purchased"
        | "confirmed"
        | "transferred"
        | "scanned"
        | "used"
        | "refunded"
        | "voided"
      zone_type:
        | "stage"
        | "vip"
        | "ga"
        | "perimeter"
        | "foh"
        | "boh"
        | "entrance"
        | "food_court"
        | "merch"
        | "medical"
        | "production_compound"
        | "parking"
        | "custom"
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
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {
      activation_type: [
        "performance",
        "sampling",
        "photo_op",
        "installation",
        "service",
        "retail",
        "registration",
        "lounge",
        "dining",
        "bar",
        "custom",
      ],
      allocation_state: [
        "reserved",
        "confirmed",
        "in_transit",
        "on_site",
        "checked_out",
        "returned",
        "maintenance",
      ],
      asset_status: [
        "available",
        "allocated",
        "checked_out",
        "in_transit",
        "maintenance",
        "lost",
        "retired",
      ],
      catering_alloc_status: ["allocated", "confirmed", "checked_in"],
      check_in_method: ["scan", "manual"],
      component_type: [
        "buildable",
        "scenic",
        "technical",
        "service",
        "furniture",
        "signage",
        "infrastructure",
        "custom",
      ],
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
      lf_status: [
        "reported",
        "cataloged",
        "claimed",
        "verified",
        "returned",
        "shipped",
        "unclaimed",
        "disposed",
      ],
      lf_type: ["lost", "found"],
      notification_channel: ["email", "sms", "in_app"],
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
        "collaborator",
        "executive",
        "production",
        "management",
        "crew",
        "staff",
        "talent",
        "press",
        "guest",
        "attendee",
      ],
      po_status: [
        "draft",
        "submitted",
        "acknowledged",
        "partially_received",
        "received",
        "closed",
        "cancelled",
      ],
      portal_track: [
        "artist",
        "production",
        "sponsor",
        "guest",
        "client",
        "press",
        "attendee",
        "talent",
        "crew",
        "staff",
        "management",
      ],
      production_level_status: [
        "draft",
        "advancing",
        "confirmed",
        "locked",
        "complete",
        "archived",
      ],
      project_status: ["draft", "active", "completed", "archived"],
      project_type: ["talent_advance", "production_advance", "hybrid"],
      receiving_status: ["scheduled", "in_progress", "completed", "disputed"],
      schedule_entry_category: [
        "show",
        "production",
        "logistics",
        "catering",
        "deadline",
        "credential",
        "ticketing",
        "meeting",
        "inspection",
        "milestone",
        "shift",
        "hours_of_operation",
      ],
      schedule_entry_source: [
        "project",
        "act",
        "deliverable",
        "catering_meal_plan",
        "credential_order",
        "credential_badge",
        "fulfillment_order",
        "logistics_schedule",
        "purchase_order",
        "receiving_record",
        "shipment",
        "ticket_tier",
        "ticket_promo_code",
        "location",
        "manual",
      ],
      schedule_status: [
        "requested",
        "scheduled",
        "confirmed",
        "in_progress",
        "completed",
        "cancelled",
        "no_show",
      ],
      schedule_type: [
        "pickup",
        "delivery",
        "transfer",
        "vendor_return",
        "will_call",
      ],
      shipment_direction: ["inbound", "outbound", "inter_location"],
      shipment_status: [
        "booked",
        "label_created",
        "picked_up",
        "in_transit",
        "out_for_delivery",
        "delivered",
        "exception",
        "cancelled",
      ],
      task_status: [
        "pending",
        "in_progress",
        "completed",
        "blocked",
        "cancelled",
      ],
      template_scope: ["personal", "org", "global"],
      ticket_status: [
        "reserved",
        "purchased",
        "confirmed",
        "transferred",
        "scanned",
        "used",
        "refunded",
        "voided",
      ],
      zone_type: [
        "stage",
        "vip",
        "ga",
        "perimeter",
        "foh",
        "boh",
        "entrance",
        "food_court",
        "merch",
        "medical",
        "production_compound",
        "parking",
        "custom",
      ],
    },
  },
} as const

