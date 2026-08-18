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
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      canvas_budget_group_tasks: {
        Row: {
          budget_group_id: string
          created_at: string
          id: string
          obra_id: string
          org_id: string | null
          task_node_id: string
        }
        Insert: {
          budget_group_id: string
          created_at?: string
          id?: string
          obra_id: string
          org_id?: string | null
          task_node_id: string
        }
        Update: {
          budget_group_id?: string
          created_at?: string
          id?: string
          obra_id?: string
          org_id?: string | null
          task_node_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "canvas_budget_group_tasks_budget_group_id_fkey"
            columns: ["budget_group_id"]
            isOneToOne: false
            referencedRelation: "canvas_budget_groups"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "canvas_budget_group_tasks_obra_id_fkey"
            columns: ["obra_id"]
            isOneToOne: false
            referencedRelation: "obras"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "canvas_budget_group_tasks_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizaciones"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "canvas_budget_group_tasks_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "canvas_budget_group_tasks_task_node_id_fkey"
            columns: ["task_node_id"]
            isOneToOne: false
            referencedRelation: "canvas_nodes"
            referencedColumns: ["id"]
          },
        ]
      }
      canvas_budget_groups: {
        Row: {
          approved_at: string | null
          bolsa_publicada: boolean
          change_window_notes: string | null
          change_window_opened_at: string | null
          change_window_status: string
          created_at: string
          description: string | null
          id: string
          mensaje_socio_borrador: string | null
          name: string
          obra_id: string
          org_id: string | null
          pliego_publicado_at: string | null
          publicado_a_agenda: boolean
          scheduled_socio_id: string | null
          status: string
          updated_at: string
        }
        Insert: {
          approved_at?: string | null
          bolsa_publicada?: boolean
          change_window_notes?: string | null
          change_window_opened_at?: string | null
          change_window_status?: string
          created_at?: string
          description?: string | null
          id?: string
          mensaje_socio_borrador?: string | null
          name: string
          obra_id: string
          org_id?: string | null
          pliego_publicado_at?: string | null
          publicado_a_agenda?: boolean
          scheduled_socio_id?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          approved_at?: string | null
          bolsa_publicada?: boolean
          change_window_notes?: string | null
          change_window_opened_at?: string | null
          change_window_status?: string
          created_at?: string
          description?: string | null
          id?: string
          mensaje_socio_borrador?: string | null
          name?: string
          obra_id?: string
          org_id?: string | null
          pliego_publicado_at?: string | null
          publicado_a_agenda?: boolean
          scheduled_socio_id?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "canvas_budget_groups_obra_id_fkey"
            columns: ["obra_id"]
            isOneToOne: false
            referencedRelation: "obras"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "canvas_budget_groups_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizaciones"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "canvas_budget_groups_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "canvas_budget_groups_scheduled_socio_id_fkey"
            columns: ["scheduled_socio_id"]
            isOneToOne: false
            referencedRelation: "socios"
            referencedColumns: ["id"]
          },
        ]
      }
      canvas_edges: {
        Row: {
          created_at: string
          id: string
          is_critical: boolean
          lag_days: number
          metadata: Json
          obra_id: string
          org_id: string | null
          source_node_id: string
          target_node_id: string
          type: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_critical?: boolean
          lag_days?: number
          metadata?: Json
          obra_id: string
          org_id?: string | null
          source_node_id: string
          target_node_id: string
          type?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          is_critical?: boolean
          lag_days?: number
          metadata?: Json
          obra_id?: string
          org_id?: string | null
          source_node_id?: string
          target_node_id?: string
          type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "canvas_edges_obra_id_fkey"
            columns: ["obra_id"]
            isOneToOne: false
            referencedRelation: "obras"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "canvas_edges_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizaciones"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "canvas_edges_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "canvas_edges_source_node_id_fkey"
            columns: ["source_node_id"]
            isOneToOne: false
            referencedRelation: "canvas_nodes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "canvas_edges_target_node_id_fkey"
            columns: ["target_node_id"]
            isOneToOne: false
            referencedRelation: "canvas_nodes"
            referencedColumns: ["id"]
          },
        ]
      }
      canvas_nodes: {
        Row: {
          budget_group_id: string | null
          created_at: string
          description: string | null
          executor_kind: string | null
          executor_ref: string | null
          from_node_id: string | null
          graph_status: string | null
          id: string
          is_critical: boolean
          is_summary: boolean
          metadata: Json
          obra_id: string
          org_id: string | null
          parent_id: string | null
          planned_duration_days: number | null
          position_x: number | null
          position_y: number | null
          progress: number | null
          project_outline_level: number | null
          project_outline_number: string | null
          project_source: string | null
          project_uid: string | null
          sort_order: number | null
          status: string | null
          t_components: Json | null
          t_formula_id: string | null
          t_value: number | null
          title: string
          to_node_id: string | null
          transform_kind: string | null
          type: string
          updated_at: string
        }
        Insert: {
          budget_group_id?: string | null
          created_at?: string
          description?: string | null
          executor_kind?: string | null
          executor_ref?: string | null
          from_node_id?: string | null
          graph_status?: string | null
          id?: string
          is_critical?: boolean
          is_summary?: boolean
          metadata?: Json
          obra_id: string
          org_id?: string | null
          parent_id?: string | null
          planned_duration_days?: number | null
          position_x?: number | null
          position_y?: number | null
          progress?: number | null
          project_outline_level?: number | null
          project_outline_number?: string | null
          project_source?: string | null
          project_uid?: string | null
          sort_order?: number | null
          status?: string | null
          t_components?: Json | null
          t_formula_id?: string | null
          t_value?: number | null
          title: string
          to_node_id?: string | null
          transform_kind?: string | null
          type: string
          updated_at?: string
        }
        Update: {
          budget_group_id?: string | null
          created_at?: string
          description?: string | null
          executor_kind?: string | null
          executor_ref?: string | null
          from_node_id?: string | null
          graph_status?: string | null
          id?: string
          is_critical?: boolean
          is_summary?: boolean
          metadata?: Json
          obra_id?: string
          org_id?: string | null
          parent_id?: string | null
          planned_duration_days?: number | null
          position_x?: number | null
          position_y?: number | null
          progress?: number | null
          project_outline_level?: number | null
          project_outline_number?: string | null
          project_source?: string | null
          project_uid?: string | null
          sort_order?: number | null
          status?: string | null
          t_components?: Json | null
          t_formula_id?: string | null
          t_value?: number | null
          title?: string
          to_node_id?: string | null
          transform_kind?: string | null
          type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "canvas_nodes_budget_group_id_fkey"
            columns: ["budget_group_id"]
            isOneToOne: false
            referencedRelation: "canvas_budget_groups"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "canvas_nodes_from_node_id_fkey"
            columns: ["from_node_id"]
            isOneToOne: false
            referencedRelation: "canvas_nodes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "canvas_nodes_obra_id_fkey"
            columns: ["obra_id"]
            isOneToOne: false
            referencedRelation: "obras"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "canvas_nodes_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizaciones"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "canvas_nodes_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "canvas_nodes_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "canvas_nodes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "canvas_nodes_to_node_id_fkey"
            columns: ["to_node_id"]
            isOneToOne: false
            referencedRelation: "canvas_nodes"
            referencedColumns: ["id"]
          },
        ]
      }
      canvas_task_checklist_items: {
        Row: {
          created_at: string
          done: boolean
          id: string
          obra_id: string
          org_id: string | null
          sort_order: number | null
          task_node_id: string
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          done?: boolean
          id?: string
          obra_id: string
          org_id?: string | null
          sort_order?: number | null
          task_node_id: string
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          done?: boolean
          id?: string
          obra_id?: string
          org_id?: string | null
          sort_order?: number | null
          task_node_id?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "canvas_task_checklist_items_obra_id_fkey"
            columns: ["obra_id"]
            isOneToOne: false
            referencedRelation: "obras"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "canvas_task_checklist_items_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizaciones"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "canvas_task_checklist_items_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "canvas_task_checklist_items_task_node_id_fkey"
            columns: ["task_node_id"]
            isOneToOne: false
            referencedRelation: "canvas_nodes"
            referencedColumns: ["id"]
          },
        ]
      }
      canvas_task_templates: {
        Row: {
          autor_user_id: string | null
          created_at: string
          descripcion: string | null
          id: string
          nombre: string
          obra_product_kind: string
          org_id: string | null
          slug: string
          updated_at: string
          visibilidad: string
        }
        Insert: {
          autor_user_id?: string | null
          created_at?: string
          descripcion?: string | null
          id?: string
          nombre: string
          obra_product_kind: string
          org_id?: string | null
          slug: string
          updated_at?: string
          visibilidad?: string
        }
        Update: {
          autor_user_id?: string | null
          created_at?: string
          descripcion?: string | null
          id?: string
          nombre?: string
          obra_product_kind?: string
          org_id?: string | null
          slug?: string
          updated_at?: string
          visibilidad?: string
        }
        Relationships: [
          {
            foreignKeyName: "canvas_task_templates_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizaciones"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "canvas_task_templates_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      canvas_template_connections: {
        Row: {
          id: string
          source_task_id: string
          target_task_id: string
          template_id: string
          tipo_conexion: string
        }
        Insert: {
          id?: string
          source_task_id: string
          target_task_id: string
          template_id: string
          tipo_conexion?: string
        }
        Update: {
          id?: string
          source_task_id?: string
          target_task_id?: string
          template_id?: string
          tipo_conexion?: string
        }
        Relationships: [
          {
            foreignKeyName: "canvas_template_connections_source_task_id_fkey"
            columns: ["source_task_id"]
            isOneToOne: false
            referencedRelation: "canvas_template_tasks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "canvas_template_connections_target_task_id_fkey"
            columns: ["target_task_id"]
            isOneToOne: false
            referencedRelation: "canvas_template_tasks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "canvas_template_connections_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "canvas_task_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      canvas_template_tasks: {
        Row: {
          descripcion: string | null
          duracion_estimada_dias: number
          id: string
          metadata: Json
          orden: number
          template_id: string
          tipo: string
          titulo: string
        }
        Insert: {
          descripcion?: string | null
          duracion_estimada_dias?: number
          id?: string
          metadata?: Json
          orden: number
          template_id: string
          tipo?: string
          titulo: string
        }
        Update: {
          descripcion?: string | null
          duracion_estimada_dias?: number
          id?: string
          metadata?: Json
          orden?: number
          template_id?: string
          tipo?: string
          titulo?: string
        }
        Relationships: [
          {
            foreignKeyName: "canvas_template_tasks_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "canvas_task_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      categorias_legajo: {
        Row: {
          descripcion: string | null
          id: string
          nombre: string
          orden: number
        }
        Insert: {
          descripcion?: string | null
          id: string
          nombre: string
          orden: number
        }
        Update: {
          descripcion?: string | null
          id?: string
          nombre?: string
          orden?: number
        }
        Relationships: []
      }
      cliente_socio_agenda: {
        Row: {
          alias: string | null
          created_at: string
          estado: string
          id: string
          metodo: string
          notas: string | null
          org_id: string
          socio_id: string
          source_socio_id: string | null
          updated_at: string
        }
        Insert: {
          alias?: string | null
          created_at?: string
          estado?: string
          id?: string
          metodo: string
          notas?: string | null
          org_id: string
          socio_id: string
          source_socio_id?: string | null
          updated_at?: string
        }
        Update: {
          alias?: string | null
          created_at?: string
          estado?: string
          id?: string
          metodo?: string
          notas?: string | null
          org_id?: string
          socio_id?: string
          source_socio_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "cliente_socio_agenda_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizaciones"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cliente_socio_agenda_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cliente_socio_agenda_socio_id_fkey"
            columns: ["socio_id"]
            isOneToOne: false
            referencedRelation: "socios"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cliente_socio_agenda_source_socio_id_fkey"
            columns: ["source_socio_id"]
            isOneToOne: false
            referencedRelation: "socios"
            referencedColumns: ["id"]
          },
        ]
      }
      cliente_wallet_movimientos: {
        Row: {
          created_at: string
          descripcion: string | null
          estado: Database["public"]["Enums"]["cliente_wallet_movimiento_estado"]
          id: string
          metadata: Json
          monto: number
          mp_payment_id: string | null
          mp_preference_id: string | null
          org_id: string
          referencia_id: string | null
          referencia_tipo: string | null
          tipo: Database["public"]["Enums"]["cliente_wallet_movimiento_tipo"]
          wallet_id: string
        }
        Insert: {
          created_at?: string
          descripcion?: string | null
          estado?: Database["public"]["Enums"]["cliente_wallet_movimiento_estado"]
          id?: string
          metadata?: Json
          monto: number
          mp_payment_id?: string | null
          mp_preference_id?: string | null
          org_id: string
          referencia_id?: string | null
          referencia_tipo?: string | null
          tipo: Database["public"]["Enums"]["cliente_wallet_movimiento_tipo"]
          wallet_id: string
        }
        Update: {
          created_at?: string
          descripcion?: string | null
          estado?: Database["public"]["Enums"]["cliente_wallet_movimiento_estado"]
          id?: string
          metadata?: Json
          monto?: number
          mp_payment_id?: string | null
          mp_preference_id?: string | null
          org_id?: string
          referencia_id?: string | null
          referencia_tipo?: string | null
          tipo?: Database["public"]["Enums"]["cliente_wallet_movimiento_tipo"]
          wallet_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "cliente_wallet_movimientos_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizaciones"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cliente_wallet_movimientos_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cliente_wallet_movimientos_wallet_id_fkey"
            columns: ["wallet_id"]
            isOneToOne: false
            referencedRelation: "cliente_wallets"
            referencedColumns: ["id"]
          },
        ]
      }
      cliente_wallets: {
        Row: {
          cliente_user_id: string | null
          created_at: string
          id: string
          metadata: Json
          moneda: string
          org_id: string
          saldo_disponible: number
          saldo_reservado: number
          updated_at: string
        }
        Insert: {
          cliente_user_id?: string | null
          created_at?: string
          id?: string
          metadata?: Json
          moneda?: string
          org_id: string
          saldo_disponible?: number
          saldo_reservado?: number
          updated_at?: string
        }
        Update: {
          cliente_user_id?: string | null
          created_at?: string
          id?: string
          metadata?: Json
          moneda?: string
          org_id?: string
          saldo_disponible?: number
          saldo_reservado?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "cliente_wallets_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: true
            referencedRelation: "organizaciones"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cliente_wallets_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: true
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      cuadrilla_socios: {
        Row: {
          activo: boolean | null
          cuadrilla_id: string
          fecha_ingreso: string | null
          id: string
          rol_en_cuadrilla: string | null
          socio_id: string
        }
        Insert: {
          activo?: boolean | null
          cuadrilla_id: string
          fecha_ingreso?: string | null
          id?: string
          rol_en_cuadrilla?: string | null
          socio_id: string
        }
        Update: {
          activo?: boolean | null
          cuadrilla_id?: string
          fecha_ingreso?: string | null
          id?: string
          rol_en_cuadrilla?: string | null
          socio_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "cuadrilla_socios_cuadrilla_id_fkey"
            columns: ["cuadrilla_id"]
            isOneToOne: false
            referencedRelation: "cuadrillas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cuadrilla_socios_socio_id_fkey"
            columns: ["socio_id"]
            isOneToOne: false
            referencedRelation: "socios"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_cuadrilla_socios_cuadrilla"
            columns: ["cuadrilla_id"]
            isOneToOne: false
            referencedRelation: "cuadrillas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_cuadrilla_socios_socio"
            columns: ["socio_id"]
            isOneToOne: false
            referencedRelation: "socios"
            referencedColumns: ["id"]
          },
        ]
      }
      cuadrillas: {
        Row: {
          created_at: string | null
          email_encargado: string | null
          encargado: string | null
          especialidad: string
          estado: string | null
          id: string
          nombre: string
          obra_id: string | null
          org_id: string
          telefono_encargado: string | null
          updated_at: string | null
          whatsapp_encargado: string | null
        }
        Insert: {
          created_at?: string | null
          email_encargado?: string | null
          encargado?: string | null
          especialidad: string
          estado?: string | null
          id?: string
          nombre: string
          obra_id?: string | null
          org_id: string
          telefono_encargado?: string | null
          updated_at?: string | null
          whatsapp_encargado?: string | null
        }
        Update: {
          created_at?: string | null
          email_encargado?: string | null
          encargado?: string | null
          especialidad?: string
          estado?: string | null
          id?: string
          nombre?: string
          obra_id?: string | null
          org_id?: string
          telefono_encargado?: string | null
          updated_at?: string | null
          whatsapp_encargado?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "cuadrillas_obra_id_fkey"
            columns: ["obra_id"]
            isOneToOne: false
            referencedRelation: "obras"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cuadrillas_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizaciones"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cuadrillas_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      documentos_legajo: {
        Row: {
          categoria: string
          created_at: string | null
          descripcion: string | null
          id: string
          nombre_archivo: string
          obra_id: string
          url: string
        }
        Insert: {
          categoria: string
          created_at?: string | null
          descripcion?: string | null
          id?: string
          nombre_archivo: string
          obra_id: string
          url: string
        }
        Update: {
          categoria?: string
          created_at?: string | null
          descripcion?: string | null
          id?: string
          nombre_archivo?: string
          obra_id?: string
          url?: string
        }
        Relationships: []
      }
      elementos: {
        Row: {
          cantidad: number
          categoria: string
          costo_unitario: number | null
          created_at: string | null
          descripcion: string | null
          duracion_estimada: number | null
          id: string
          nombre: string
          obra_id: string
          orden: number | null
          plantilla_elemento_id: string | null
          subcategoria: string | null
          unidad: string
          updated_at: string | null
        }
        Insert: {
          cantidad?: number
          categoria: string
          costo_unitario?: number | null
          created_at?: string | null
          descripcion?: string | null
          duracion_estimada?: number | null
          id?: string
          nombre: string
          obra_id: string
          orden?: number | null
          plantilla_elemento_id?: string | null
          subcategoria?: string | null
          unidad: string
          updated_at?: string | null
        }
        Update: {
          cantidad?: number
          categoria?: string
          costo_unitario?: number | null
          created_at?: string | null
          descripcion?: string | null
          duracion_estimada?: number | null
          id?: string
          nombre?: string
          obra_id?: string
          orden?: number | null
          plantilla_elemento_id?: string | null
          subcategoria?: string | null
          unidad?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "elementos_obra_id_fkey"
            columns: ["obra_id"]
            isOneToOne: false
            referencedRelation: "obras"
            referencedColumns: ["id"]
          },
        ]
      }
      escrow_transacciones: {
        Row: {
          cliente_id: string | null
          created_at: string
          estado: Database["public"]["Enums"]["escrow_estado"]
          fecha_deposito: string | null
          fecha_liberacion: string | null
          fecha_reembolso: string | null
          id: string
          moneda: string
          monto_comision: number
          monto_socio: number
          monto_total: number
          mp_payment_id: string | null
          mp_preference_id: string | null
          mp_raw_payload: Json | null
          mp_status: string | null
          org_id: string
          origen: string | null
          proveedor: string
          socio_id: string
          tarea_id: string
          updated_at: string
        }
        Insert: {
          cliente_id?: string | null
          created_at?: string
          estado?: Database["public"]["Enums"]["escrow_estado"]
          fecha_deposito?: string | null
          fecha_liberacion?: string | null
          fecha_reembolso?: string | null
          id?: string
          moneda?: string
          monto_comision: number
          monto_socio: number
          monto_total: number
          mp_payment_id?: string | null
          mp_preference_id?: string | null
          mp_raw_payload?: Json | null
          mp_status?: string | null
          org_id: string
          origen?: string | null
          proveedor?: string
          socio_id: string
          tarea_id: string
          updated_at?: string
        }
        Update: {
          cliente_id?: string | null
          created_at?: string
          estado?: Database["public"]["Enums"]["escrow_estado"]
          fecha_deposito?: string | null
          fecha_liberacion?: string | null
          fecha_reembolso?: string | null
          id?: string
          moneda?: string
          monto_comision?: number
          monto_socio?: number
          monto_total?: number
          mp_payment_id?: string | null
          mp_preference_id?: string | null
          mp_raw_payload?: Json | null
          mp_status?: string | null
          org_id?: string
          origen?: string | null
          proveedor?: string
          socio_id?: string
          tarea_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "escrow_org_fk"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizaciones"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "escrow_org_fk"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "escrow_socio_fk"
            columns: ["socio_id"]
            isOneToOne: false
            referencedRelation: "socios"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "escrow_tarea_fk"
            columns: ["tarea_id"]
            isOneToOne: false
            referencedRelation: "tareas"
            referencedColumns: ["id"]
          },
        ]
      }
      eventos: {
        Row: {
          actor_method: string | null
          actor_name: string | null
          actor_role: string | null
          checklist: Json | null
          created_at: string | null
          descripcion: string | null
          fecha: string | null
          gps_lat: number | null
          gps_lon: number | null
          has_nc: boolean | null
          id: string
          nc_deadline: string | null
          nc_responsable: string | null
          notas: string | null
          nuevo_estado: string | null
          obra_id: string | null
          org_id: string
          pdf_path: string | null
          snapshot_json: Json | null
          tarea_id: string | null
          tipo: string | null
        }
        Insert: {
          actor_method?: string | null
          actor_name?: string | null
          actor_role?: string | null
          checklist?: Json | null
          created_at?: string | null
          descripcion?: string | null
          fecha?: string | null
          gps_lat?: number | null
          gps_lon?: number | null
          has_nc?: boolean | null
          id?: string
          nc_deadline?: string | null
          nc_responsable?: string | null
          notas?: string | null
          nuevo_estado?: string | null
          obra_id?: string | null
          org_id: string
          pdf_path?: string | null
          snapshot_json?: Json | null
          tarea_id?: string | null
          tipo?: string | null
        }
        Update: {
          actor_method?: string | null
          actor_name?: string | null
          actor_role?: string | null
          checklist?: Json | null
          created_at?: string | null
          descripcion?: string | null
          fecha?: string | null
          gps_lat?: number | null
          gps_lon?: number | null
          has_nc?: boolean | null
          id?: string
          nc_deadline?: string | null
          nc_responsable?: string | null
          notas?: string | null
          nuevo_estado?: string | null
          obra_id?: string | null
          org_id?: string
          pdf_path?: string | null
          snapshot_json?: Json | null
          tarea_id?: string | null
          tipo?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "eventos_obra_id_fkey"
            columns: ["obra_id"]
            isOneToOne: false
            referencedRelation: "obras"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "eventos_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizaciones"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "eventos_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "eventos_tarea_id_fkey"
            columns: ["tarea_id"]
            isOneToOne: false
            referencedRelation: "tareas"
            referencedColumns: ["id"]
          },
        ]
      }
      jornadas_socio: {
        Row: {
          created_at: string
          fecha: string
          hora_fin: string | null
          hora_inicio: string | null
          id: string
          obra_id: string
          socio_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          fecha?: string
          hora_fin?: string | null
          hora_inicio?: string | null
          id?: string
          obra_id: string
          socio_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          fecha?: string
          hora_fin?: string | null
          hora_inicio?: string | null
          id?: string
          obra_id?: string
          socio_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "jornadas_socio_obra_id_fkey"
            columns: ["obra_id"]
            isOneToOne: false
            referencedRelation: "obras"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "jornadas_socio_socio_id_fkey"
            columns: ["socio_id"]
            isOneToOne: false
            referencedRelation: "socios"
            referencedColumns: ["id"]
          },
        ]
      }
      leader_invites: {
        Row: {
          accepted_at: string | null
          created_at: string
          email: string
          id: string
          nombre: string
          org_id: string
          rol: string
          status: string
          token: string
        }
        Insert: {
          accepted_at?: string | null
          created_at?: string
          email: string
          id?: string
          nombre?: string
          org_id: string
          rol?: string
          status?: string
          token?: string
        }
        Update: {
          accepted_at?: string | null
          created_at?: string
          email?: string
          id?: string
          nombre?: string
          org_id?: string
          rol?: string
          status?: string
          token?: string
        }
        Relationships: [
          {
            foreignKeyName: "leader_invites_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizaciones"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leader_invites_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      media: {
        Row: {
          created_at: string | null
          evento_id: string
          id: string
          idx: number
          kind: string
          path: string
        }
        Insert: {
          created_at?: string | null
          evento_id: string
          id?: string
          idx?: number
          kind: string
          path: string
        }
        Update: {
          created_at?: string | null
          evento_id?: string
          id?: string
          idx?: number
          kind?: string
          path?: string
        }
        Relationships: [
          {
            foreignKeyName: "media_evento_id_fkey"
            columns: ["evento_id"]
            isOneToOne: false
            referencedRelation: "eventos"
            referencedColumns: ["id"]
          },
        ]
      }
      mensajes: {
        Row: {
          contenido: string
          created_at: string | null
          destinatario_id: string | null
          destinatario_tipo: string | null
          id: string
          leido: boolean | null
          obra_id: string | null
          org_id: string | null
          remitente_id: string | null
          remitente_tipo: string | null
          tipo: string | null
        }
        Insert: {
          contenido: string
          created_at?: string | null
          destinatario_id?: string | null
          destinatario_tipo?: string | null
          id?: string
          leido?: boolean | null
          obra_id?: string | null
          org_id?: string | null
          remitente_id?: string | null
          remitente_tipo?: string | null
          tipo?: string | null
        }
        Update: {
          contenido?: string
          created_at?: string | null
          destinatario_id?: string | null
          destinatario_tipo?: string | null
          id?: string
          leido?: boolean | null
          obra_id?: string | null
          org_id?: string | null
          remitente_id?: string | null
          remitente_tipo?: string | null
          tipo?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "mensajes_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizaciones"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mensajes_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      notificaciones: {
        Row: {
          created_at: string | null
          destinatario_id: string | null
          id: string
          leida: boolean | null
          mensaje: string
          obra_id: string | null
          org_id: string | null
          remitente_id: string | null
          socio_id: string | null
          tarea_id: string | null
          tipo: string | null
          titulo: string
        }
        Insert: {
          created_at?: string | null
          destinatario_id?: string | null
          id?: string
          leida?: boolean | null
          mensaje: string
          obra_id?: string | null
          org_id?: string | null
          remitente_id?: string | null
          socio_id?: string | null
          tarea_id?: string | null
          tipo?: string | null
          titulo: string
        }
        Update: {
          created_at?: string | null
          destinatario_id?: string | null
          id?: string
          leida?: boolean | null
          mensaje?: string
          obra_id?: string | null
          org_id?: string | null
          remitente_id?: string | null
          socio_id?: string | null
          tarea_id?: string | null
          tipo?: string | null
          titulo?: string
        }
        Relationships: [
          {
            foreignKeyName: "notificaciones_obra_id_fkey"
            columns: ["obra_id"]
            isOneToOne: false
            referencedRelation: "obras"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notificaciones_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizaciones"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notificaciones_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notificaciones_socio_id_fkey"
            columns: ["socio_id"]
            isOneToOne: false
            referencedRelation: "socios"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notificaciones_tarea_id_fkey"
            columns: ["tarea_id"]
            isOneToOne: false
            referencedRelation: "tareas"
            referencedColumns: ["id"]
          },
        ]
      }
      obra_check_blocks: {
        Row: {
          budget_group_client_id: string | null
          client_id: string
          contact_id: string | null
          created_at: string
          fase: string | null
          id: string
          nombre: string
          orden: number
          rubro: string | null
          session_id: string
        }
        Insert: {
          budget_group_client_id?: string | null
          client_id: string
          contact_id?: string | null
          created_at?: string
          fase?: string | null
          id?: string
          nombre: string
          orden?: number
          rubro?: string | null
          session_id: string
        }
        Update: {
          budget_group_client_id?: string | null
          client_id?: string
          contact_id?: string | null
          created_at?: string
          fase?: string | null
          id?: string
          nombre?: string
          orden?: number
          rubro?: string | null
          session_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "obra_check_blocks_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "obra_check_contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "obra_check_blocks_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "obra_check_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      obra_check_budget_groups: {
        Row: {
          client_id: string
          created_at: string
          id: string
          kind: string
          nombre: string
          orden: number
          parent_client_id: string | null
          session_id: string
        }
        Insert: {
          client_id: string
          created_at?: string
          id?: string
          kind?: string
          nombre: string
          orden?: number
          parent_client_id?: string | null
          session_id: string
        }
        Update: {
          client_id?: string
          created_at?: string
          id?: string
          kind?: string
          nombre?: string
          orden?: number
          parent_client_id?: string | null
          session_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "obra_check_budget_groups_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "obra_check_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      obra_check_contacts: {
        Row: {
          created_at: string
          id: string
          nombre: string
          rubro: string | null
          session_id: string
          telefono: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          nombre: string
          rubro?: string | null
          session_id: string
          telefono?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          nombre?: string
          rubro?: string | null
          session_id?: string
          telefono?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "obra_check_contacts_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "obra_check_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      obra_check_events: {
        Row: {
          created_at: string
          id: string
          payload: Json
          session_id: string | null
          tipo: string
        }
        Insert: {
          created_at?: string
          id?: string
          payload?: Json
          session_id?: string | null
          tipo: string
        }
        Update: {
          created_at?: string
          id?: string
          payload?: Json
          session_id?: string | null
          tipo?: string
        }
        Relationships: [
          {
            foreignKeyName: "obra_check_events_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "obra_check_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      obra_check_form_responses: {
        Row: {
          acepta_contacto: boolean
          created_at: string
          detalle_json: Json | null
          email: string | null
          empresa: string | null
          id: string
          invite_id: string
          mensaje: string | null
          nombre: string
          notified_requester_at: string | null
          rubro: string | null
          session_id: string
          telefono: string | null
          view_token: string | null
        }
        Insert: {
          acepta_contacto?: boolean
          created_at?: string
          detalle_json?: Json | null
          email?: string | null
          empresa?: string | null
          id?: string
          invite_id: string
          mensaje?: string | null
          nombre: string
          notified_requester_at?: string | null
          rubro?: string | null
          session_id: string
          telefono?: string | null
          view_token?: string | null
        }
        Update: {
          acepta_contacto?: boolean
          created_at?: string
          detalle_json?: Json | null
          email?: string | null
          empresa?: string | null
          id?: string
          invite_id?: string
          mensaje?: string | null
          nombre?: string
          notified_requester_at?: string | null
          rubro?: string | null
          session_id?: string
          telefono?: string | null
          view_token?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "obra_check_form_responses_invite_id_fkey"
            columns: ["invite_id"]
            isOneToOne: false
            referencedRelation: "obra_check_invites"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "obra_check_form_responses_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "obra_check_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      obra_check_invites: {
        Row: {
          block_client_id: string
          contact_id: string | null
          created_at: string
          expires_at: string
          id: string
          responded_at: string | null
          session_id: string
          tipo: string
          token: string
        }
        Insert: {
          block_client_id: string
          contact_id?: string | null
          created_at?: string
          expires_at?: string
          id?: string
          responded_at?: string | null
          session_id: string
          tipo: string
          token: string
        }
        Update: {
          block_client_id?: string
          contact_id?: string | null
          created_at?: string
          expires_at?: string
          id?: string
          responded_at?: string | null
          session_id?: string
          tipo?: string
          token?: string
        }
        Relationships: [
          {
            foreignKeyName: "obra_check_invites_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "obra_check_contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "obra_check_invites_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "obra_check_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      obra_check_planos: {
        Row: {
          created_at: string
          file_name: string
          id: string
          mime: string
          session_id: string
          size_bytes: number
          storage_path: string
        }
        Insert: {
          created_at?: string
          file_name: string
          id?: string
          mime: string
          session_id: string
          size_bytes?: number
          storage_path: string
        }
        Update: {
          created_at?: string
          file_name?: string
          id?: string
          mime?: string
          session_id?: string
          size_bytes?: number
          storage_path?: string
        }
        Relationships: [
          {
            foreignKeyName: "obra_check_planos_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "obra_check_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      obra_check_sessions: {
        Row: {
          completion_email_sent_at: string | null
          consent_patrones: boolean
          consent_procesamiento: boolean
          consent_version: string | null
          created_at: string
          email: string | null
          empresa: string | null
          id: string
          inbox_token: string | null
          last_activity_at: string
          metros_cuadrados: number | null
          session_token: string
          tipo_obra: string | null
        }
        Insert: {
          completion_email_sent_at?: string | null
          consent_patrones?: boolean
          consent_procesamiento?: boolean
          consent_version?: string | null
          created_at?: string
          email?: string | null
          empresa?: string | null
          id?: string
          inbox_token?: string | null
          last_activity_at?: string
          metros_cuadrados?: number | null
          session_token?: string
          tipo_obra?: string | null
        }
        Update: {
          completion_email_sent_at?: string | null
          consent_patrones?: boolean
          consent_procesamiento?: boolean
          consent_version?: string | null
          created_at?: string
          email?: string | null
          empresa?: string | null
          id?: string
          inbox_token?: string | null
          last_activity_at?: string
          metros_cuadrados?: number | null
          session_token?: string
          tipo_obra?: string | null
        }
        Relationships: []
      }
      obra_check_tasks: {
        Row: {
          block_client_id: string | null
          cantidad: number | null
          client_id: string
          contact_id: string | null
          created_at: string
          duracion_dias: number | null
          es_critica: boolean | null
          fase: string | null
          fila_origen: number | null
          fin: string | null
          id: string
          inicio: string | null
          nombre: string
          orden: number
          origen: string
          predecesoras: string[]
          responsable_label: string | null
          rubro: string | null
          session_id: string
          unidad: string | null
        }
        Insert: {
          block_client_id?: string | null
          cantidad?: number | null
          client_id: string
          contact_id?: string | null
          created_at?: string
          duracion_dias?: number | null
          es_critica?: boolean | null
          fase?: string | null
          fila_origen?: number | null
          fin?: string | null
          id?: string
          inicio?: string | null
          nombre: string
          orden?: number
          origen?: string
          predecesoras?: string[]
          responsable_label?: string | null
          rubro?: string | null
          session_id: string
          unidad?: string | null
        }
        Update: {
          block_client_id?: string | null
          cantidad?: number | null
          client_id?: string
          contact_id?: string | null
          created_at?: string
          duracion_dias?: number | null
          es_critica?: boolean | null
          fase?: string | null
          fila_origen?: number | null
          fin?: string | null
          id?: string
          inicio?: string | null
          nombre?: string
          orden?: number
          origen?: string
          predecesoras?: string[]
          responsable_label?: string | null
          rubro?: string | null
          session_id?: string
          unidad?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "obra_check_tasks_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "obra_check_contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "obra_check_tasks_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "obra_check_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      obra_check_wa_messages: {
        Row: {
          block_client_id: string | null
          contact_id: string | null
          generado_at: string
          id: string
          session_id: string
          texto: string
          tipo: string
        }
        Insert: {
          block_client_id?: string | null
          contact_id?: string | null
          generado_at?: string
          id?: string
          session_id: string
          texto: string
          tipo: string
        }
        Update: {
          block_client_id?: string | null
          contact_id?: string | null
          generado_at?: string
          id?: string
          session_id?: string
          texto?: string
          tipo?: string
        }
        Relationships: [
          {
            foreignKeyName: "obra_check_wa_messages_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "obra_check_contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "obra_check_wa_messages_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "obra_check_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      obras: {
        Row: {
          activation_discount_usd: number | null
          activation_m2: number | null
          activation_payment_plan: string | null
          activation_price_per_m2_usd: number | null
          activation_status: string | null
          activation_total_usd: number | null
          address: string | null
          canvas_depth_config: Json | null
          canvas_project_kind: string | null
          canvas_template_slug: string | null
          canvas_ui: Json
          created_at: string | null
          estado: string | null
          graph_mode: string
          id: string
          latitud: number | null
          longitud: number | null
          m2_estimados: number | null
          name: string
          objetivo_texto: string | null
          obra_product_kind: string | null
          org_id: string
          plantas: number | null
          propietario: string | null
          superficies: Json | null
          terreno: number | null
          tipo_obra: string | null
          updated_at: string | null
        }
        Insert: {
          activation_discount_usd?: number | null
          activation_m2?: number | null
          activation_payment_plan?: string | null
          activation_price_per_m2_usd?: number | null
          activation_status?: string | null
          activation_total_usd?: number | null
          address?: string | null
          canvas_depth_config?: Json | null
          canvas_project_kind?: string | null
          canvas_template_slug?: string | null
          canvas_ui?: Json
          created_at?: string | null
          estado?: string | null
          graph_mode?: string
          id?: string
          latitud?: number | null
          longitud?: number | null
          m2_estimados?: number | null
          name: string
          objetivo_texto?: string | null
          obra_product_kind?: string | null
          org_id: string
          plantas?: number | null
          propietario?: string | null
          superficies?: Json | null
          terreno?: number | null
          tipo_obra?: string | null
          updated_at?: string | null
        }
        Update: {
          activation_discount_usd?: number | null
          activation_m2?: number | null
          activation_payment_plan?: string | null
          activation_price_per_m2_usd?: number | null
          activation_status?: string | null
          activation_total_usd?: number | null
          address?: string | null
          canvas_depth_config?: Json | null
          canvas_project_kind?: string | null
          canvas_template_slug?: string | null
          canvas_ui?: Json
          created_at?: string | null
          estado?: string | null
          graph_mode?: string
          id?: string
          latitud?: number | null
          longitud?: number | null
          m2_estimados?: number | null
          name?: string
          objetivo_texto?: string | null
          obra_product_kind?: string | null
          org_id?: string
          plantas?: number | null
          propietario?: string | null
          superficies?: Json | null
          terreno?: number | null
          tipo_obra?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "obras_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizaciones"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "obras_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      organizations: {
        Row: {
          address: string | null
          avatar_url: string | null
          created_at: string | null
          cuit: string | null
          id: string
          name: string
          plan_actual: string
          user_id: string | null
        }
        Insert: {
          address?: string | null
          avatar_url?: string | null
          created_at?: string | null
          cuit?: string | null
          id?: string
          name: string
          plan_actual?: string
          user_id?: string | null
        }
        Update: {
          address?: string | null
          avatar_url?: string | null
          created_at?: string | null
          cuit?: string | null
          id?: string
          name?: string
          plan_actual?: string
          user_id?: string | null
        }
        Relationships: []
      }
      presupuesto_solicitudes_cambio: {
        Row: {
          created_at: string
          estado: string
          id: string
          monto_actual: number
          monto_propuesto: number
          motivo: string
          presupuesto_id: string
          respuesta_cliente: string | null
          socio_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          estado?: string
          id?: string
          monto_actual: number
          monto_propuesto: number
          motivo: string
          presupuesto_id: string
          respuesta_cliente?: string | null
          socio_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          estado?: string
          id?: string
          monto_actual?: number
          monto_propuesto?: number
          motivo?: string
          presupuesto_id?: string
          respuesta_cliente?: string | null
          socio_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "presupuesto_solicitudes_cambio_presupuesto_id_fkey"
            columns: ["presupuesto_id"]
            isOneToOne: false
            referencedRelation: "tareas_presupuestos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "presupuesto_solicitudes_cambio_socio_id_fkey"
            columns: ["socio_id"]
            isOneToOne: false
            referencedRelation: "socios"
            referencedColumns: ["id"]
          },
        ]
      }
      qr_tokens: {
        Row: {
          created_at: string
          enabled: boolean
          id: string
          ref_id: string
          scope: string
          token: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          enabled?: boolean
          id?: string
          ref_id: string
          scope: string
          token: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          enabled?: boolean
          id?: string
          ref_id?: string
          scope?: string
          token?: string
          updated_at?: string
        }
        Relationships: []
      }
      socio_metodos_retiro: {
        Row: {
          activo: boolean
          alias: string | null
          banco: string | null
          cbu: string | null
          created_at: string
          cvu: string | null
          es_principal: boolean
          id: string
          mercado_pago_alias: string | null
          mercado_pago_cvu: string | null
          socio_id: string
          tipo: string
          titular: string
          updated_at: string
        }
        Insert: {
          activo?: boolean
          alias?: string | null
          banco?: string | null
          cbu?: string | null
          created_at?: string
          cvu?: string | null
          es_principal?: boolean
          id?: string
          mercado_pago_alias?: string | null
          mercado_pago_cvu?: string | null
          socio_id: string
          tipo?: string
          titular: string
          updated_at?: string
        }
        Update: {
          activo?: boolean
          alias?: string | null
          banco?: string | null
          cbu?: string | null
          created_at?: string
          cvu?: string | null
          es_principal?: boolean
          id?: string
          mercado_pago_alias?: string | null
          mercado_pago_cvu?: string | null
          socio_id?: string
          tipo?: string
          titular?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "socio_metodos_retiro_socio_id_fkey"
            columns: ["socio_id"]
            isOneToOne: false
            referencedRelation: "socios"
            referencedColumns: ["id"]
          },
        ]
      }
      socio_retiros: {
        Row: {
          created_at: string
          estado: string
          id: string
          metadata: Json | null
          metodo_retiro_id: string | null
          monto: number
          processed_at: string | null
          socio_id: string
          tipo: string
          wallet_movimiento_id: string | null
        }
        Insert: {
          created_at?: string
          estado?: string
          id?: string
          metadata?: Json | null
          metodo_retiro_id?: string | null
          monto: number
          processed_at?: string | null
          socio_id: string
          tipo: string
          wallet_movimiento_id?: string | null
        }
        Update: {
          created_at?: string
          estado?: string
          id?: string
          metadata?: Json | null
          metodo_retiro_id?: string | null
          monto?: number
          processed_at?: string | null
          socio_id?: string
          tipo?: string
          wallet_movimiento_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "socio_retiros_metodo_retiro_id_fkey"
            columns: ["metodo_retiro_id"]
            isOneToOne: false
            referencedRelation: "socio_metodos_retiro"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "socio_retiros_socio_id_fkey"
            columns: ["socio_id"]
            isOneToOne: false
            referencedRelation: "socios"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "socio_retiros_wallet_movimiento_id_fkey"
            columns: ["wallet_movimiento_id"]
            isOneToOne: false
            referencedRelation: "wallet_movimientos"
            referencedColumns: ["id"]
          },
        ]
      }
      socio_suspensiones: {
        Row: {
          fin: string | null
          id: string
          inicio: string
          motivo: string
          saldo_al_momento: number
          socio_id: string
          wallet_saldo_id: string
        }
        Insert: {
          fin?: string | null
          id?: string
          inicio?: string
          motivo?: string
          saldo_al_momento: number
          socio_id: string
          wallet_saldo_id: string
        }
        Update: {
          fin?: string | null
          id?: string
          inicio?: string
          motivo?: string
          saldo_al_momento?: number
          socio_id?: string
          wallet_saldo_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "socio_suspensiones_socio_id_fkey"
            columns: ["socio_id"]
            isOneToOne: false
            referencedRelation: "socios"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "socio_suspensiones_wallet_saldo_id_fkey"
            columns: ["wallet_saldo_id"]
            isOneToOne: false
            referencedRelation: "wallet_saldos"
            referencedColumns: ["id"]
          },
        ]
      }
      socios: {
        Row: {
          created_at: string | null
          email: string | null
          especialidad: string | null
          estado: string | null
          id: string
          nombre: string | null
          org_id: string | null
          public_codigo: string | null
          telefono: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          email?: string | null
          especialidad?: string | null
          estado?: string | null
          id?: string
          nombre?: string | null
          org_id?: string | null
          public_codigo?: string | null
          telefono?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          email?: string | null
          especialidad?: string | null
          estado?: string | null
          id?: string
          nombre?: string | null
          org_id?: string | null
          public_codigo?: string | null
          telefono?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "socios_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizaciones"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "socios_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      tarea_precedencias: {
        Row: {
          created_at: string | null
          depende_de: string | null
          id: string
          lag_dias: number | null
          pos_x: number | null
          pos_y: number | null
          tarea_id: string | null
          tipo_dependencia: string | null
        }
        Insert: {
          created_at?: string | null
          depende_de?: string | null
          id?: string
          lag_dias?: number | null
          pos_x?: number | null
          pos_y?: number | null
          tarea_id?: string | null
          tipo_dependencia?: string | null
        }
        Update: {
          created_at?: string | null
          depende_de?: string | null
          id?: string
          lag_dias?: number | null
          pos_x?: number | null
          pos_y?: number | null
          tarea_id?: string | null
          tipo_dependencia?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tarea_precedencias_depende_de_fkey"
            columns: ["depende_de"]
            isOneToOne: false
            referencedRelation: "tareas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tarea_precedencias_tarea_id_fkey"
            columns: ["tarea_id"]
            isOneToOne: false
            referencedRelation: "tareas"
            referencedColumns: ["id"]
          },
        ]
      }
      tareas: {
        Row: {
          avance: number | null
          bloques_planificados: number
          canvas_node_id: string | null
          costo_presupuestado: number | null
          created_at: string | null
          cuadrilla_id: string | null
          descripcion: string | null
          dias_presupuesto: number
          ef: number | null
          elemento_id: string | null
          es: number | null
          estado: Database["public"]["Enums"]["tarea_estado_oficial"]
          etapa: string | null
          fecha_fin: string | null
          fecha_fin_estimada: string | null
          fecha_fin_real: string | null
          fecha_inicio: string | null
          fecha_inicio_estimada: string | null
          fecha_inicio_real: string | null
          fecha_validacion: string | null
          float: number | null
          id: string
          is_critical: boolean | null
          lf: number | null
          ls: number | null
          obra_id: string
          org_id: string
          prioridad: string | null
          published_from_canvas_at: string | null
          responsable: string | null
          responsable_socio_id: string | null
          source: string | null
          title: string
          updated_at: string | null
          validado_por: string | null
        }
        Insert: {
          avance?: number | null
          bloques_planificados: number
          canvas_node_id?: string | null
          costo_presupuestado?: number | null
          created_at?: string | null
          cuadrilla_id?: string | null
          descripcion?: string | null
          dias_presupuesto: number
          ef?: number | null
          elemento_id?: string | null
          es?: number | null
          estado?: Database["public"]["Enums"]["tarea_estado_oficial"]
          etapa?: string | null
          fecha_fin?: string | null
          fecha_fin_estimada?: string | null
          fecha_fin_real?: string | null
          fecha_inicio?: string | null
          fecha_inicio_estimada?: string | null
          fecha_inicio_real?: string | null
          fecha_validacion?: string | null
          float?: number | null
          id?: string
          is_critical?: boolean | null
          lf?: number | null
          ls?: number | null
          obra_id: string
          org_id: string
          prioridad?: string | null
          published_from_canvas_at?: string | null
          responsable?: string | null
          responsable_socio_id?: string | null
          source?: string | null
          title: string
          updated_at?: string | null
          validado_por?: string | null
        }
        Update: {
          avance?: number | null
          bloques_planificados?: number
          canvas_node_id?: string | null
          costo_presupuestado?: number | null
          created_at?: string | null
          cuadrilla_id?: string | null
          descripcion?: string | null
          dias_presupuesto?: number
          ef?: number | null
          elemento_id?: string | null
          es?: number | null
          estado?: Database["public"]["Enums"]["tarea_estado_oficial"]
          etapa?: string | null
          fecha_fin?: string | null
          fecha_fin_estimada?: string | null
          fecha_fin_real?: string | null
          fecha_inicio?: string | null
          fecha_inicio_estimada?: string | null
          fecha_inicio_real?: string | null
          fecha_validacion?: string | null
          float?: number | null
          id?: string
          is_critical?: boolean | null
          lf?: number | null
          ls?: number | null
          obra_id?: string
          org_id?: string
          prioridad?: string | null
          published_from_canvas_at?: string | null
          responsable?: string | null
          responsable_socio_id?: string | null
          source?: string | null
          title?: string
          updated_at?: string | null
          validado_por?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tareas_canvas_node_id_fkey"
            columns: ["canvas_node_id"]
            isOneToOne: false
            referencedRelation: "canvas_nodes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tareas_elemento_id_fkey"
            columns: ["elemento_id"]
            isOneToOne: false
            referencedRelation: "elementos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tareas_obra_id_fkey"
            columns: ["obra_id"]
            isOneToOne: false
            referencedRelation: "obras"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tareas_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizaciones"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tareas_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tareas_responsable_socio_id_fkey"
            columns: ["responsable_socio_id"]
            isOneToOne: false
            referencedRelation: "socios"
            referencedColumns: ["id"]
          },
        ]
      }
      tareas_estados: {
        Row: {
          actor_id: string | null
          actor_tipo: string | null
          created_at: string
          estado_anterior: string | null
          estado_nuevo: string | null
          id: string
          motivo: string | null
          tarea_id: string
        }
        Insert: {
          actor_id?: string | null
          actor_tipo?: string | null
          created_at?: string
          estado_anterior?: string | null
          estado_nuevo?: string | null
          id?: string
          motivo?: string | null
          tarea_id: string
        }
        Update: {
          actor_id?: string | null
          actor_tipo?: string | null
          created_at?: string
          estado_anterior?: string | null
          estado_nuevo?: string | null
          id?: string
          motivo?: string | null
          tarea_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "tareas_estados_tarea_id_fkey"
            columns: ["tarea_id"]
            isOneToOne: false
            referencedRelation: "tareas"
            referencedColumns: ["id"]
          },
        ]
      }
      tareas_eventos: {
        Row: {
          actor_id: string | null
          actor_tipo: string | null
          created_at: string
          estado_anterior: string | null
          estado_nuevo: string | null
          id: string
          metadata: Json | null
          tarea_id: string
        }
        Insert: {
          actor_id?: string | null
          actor_tipo?: string | null
          created_at?: string
          estado_anterior?: string | null
          estado_nuevo?: string | null
          id?: string
          metadata?: Json | null
          tarea_id: string
        }
        Update: {
          actor_id?: string | null
          actor_tipo?: string | null
          created_at?: string
          estado_anterior?: string | null
          estado_nuevo?: string | null
          id?: string
          metadata?: Json | null
          tarea_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "tareas_eventos_tarea_id_fkey"
            columns: ["tarea_id"]
            isOneToOne: false
            referencedRelation: "tareas"
            referencedColumns: ["id"]
          },
        ]
      }
      tareas_presupuestos: {
        Row: {
          cantidad: number | null
          created_at: string | null
          dias_reales: number | null
          estado: string | null
          id: string
          moneda: string | null
          monto: number
          notas: string | null
          socio_id: string | null
          tarea_id: string | null
          unidad: string | null
          updated_at: string | null
        }
        Insert: {
          cantidad?: number | null
          created_at?: string | null
          dias_reales?: number | null
          estado?: string | null
          id?: string
          moneda?: string | null
          monto: number
          notas?: string | null
          socio_id?: string | null
          tarea_id?: string | null
          unidad?: string | null
          updated_at?: string | null
        }
        Update: {
          cantidad?: number | null
          created_at?: string | null
          dias_reales?: number | null
          estado?: string | null
          id?: string
          moneda?: string | null
          monto?: number
          notas?: string | null
          socio_id?: string | null
          tarea_id?: string | null
          unidad?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tareas_presupuestos_tarea_id_fkey"
            columns: ["tarea_id"]
            isOneToOne: false
            referencedRelation: "tareas"
            referencedColumns: ["id"]
          },
        ]
      }
      tareas_subtareas: {
        Row: {
          bloque_index: number
          cantidad: number
          created_at: string
          estado: Database["public"]["Enums"]["tarea_subtarea_estado_oficial"]
          evidencia_cargada: boolean
          evidencia_obligatoria: boolean
          evidencia_url: string | null
          fecha: string | null
          fecha_validacion: string | null
          hora_fin: string | null
          hora_inicio: string | null
          id: string
          monto_estimado: number | null
          monto_validado: number | null
          orden: number
          presupuesto_id: string | null
          problemas: string | null
          socio_id: string | null
          tarea_id: string
          unidad: string
          updated_at: string
          validado_en_obra_at: string | null
          validado_en_obra_por: string | null
          validado_por: string | null
          video_url: string | null
        }
        Insert: {
          bloque_index: number
          cantidad: number
          created_at?: string
          estado?: Database["public"]["Enums"]["tarea_subtarea_estado_oficial"]
          evidencia_cargada?: boolean
          evidencia_obligatoria?: boolean
          evidencia_url?: string | null
          fecha?: string | null
          fecha_validacion?: string | null
          hora_fin?: string | null
          hora_inicio?: string | null
          id?: string
          monto_estimado?: number | null
          monto_validado?: number | null
          orden: number
          presupuesto_id?: string | null
          problemas?: string | null
          socio_id?: string | null
          tarea_id: string
          unidad: string
          updated_at?: string
          validado_en_obra_at?: string | null
          validado_en_obra_por?: string | null
          validado_por?: string | null
          video_url?: string | null
        }
        Update: {
          bloque_index?: number
          cantidad?: number
          created_at?: string
          estado?: Database["public"]["Enums"]["tarea_subtarea_estado_oficial"]
          evidencia_cargada?: boolean
          evidencia_obligatoria?: boolean
          evidencia_url?: string | null
          fecha?: string | null
          fecha_validacion?: string | null
          hora_fin?: string | null
          hora_inicio?: string | null
          id?: string
          monto_estimado?: number | null
          monto_validado?: number | null
          orden?: number
          presupuesto_id?: string | null
          problemas?: string | null
          socio_id?: string | null
          tarea_id?: string
          unidad?: string
          updated_at?: string
          validado_en_obra_at?: string | null
          validado_en_obra_por?: string | null
          validado_por?: string | null
          video_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tareas_subtareas_presupuesto_id_fkey"
            columns: ["presupuesto_id"]
            isOneToOne: false
            referencedRelation: "tareas_presupuestos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tareas_subtareas_socio_id_fkey"
            columns: ["socio_id"]
            isOneToOne: false
            referencedRelation: "socios"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tareas_subtareas_tarea_id_fkey"
            columns: ["tarea_id"]
            isOneToOne: false
            referencedRelation: "tareas"
            referencedColumns: ["id"]
          },
        ]
      }
      wallet_movimientos: {
        Row: {
          concepto: string
          created_at: string
          escrow_id: string | null
          estado: string
          id: string
          monto: number
          origen: string
          owner_id: string
          owner_tipo: string
          presupuesto_id: string | null
          tarea_id: string | null
          tipo: string
        }
        Insert: {
          concepto: string
          created_at?: string
          escrow_id?: string | null
          estado?: string
          id?: string
          monto: number
          origen?: string
          owner_id: string
          owner_tipo: string
          presupuesto_id?: string | null
          tarea_id?: string | null
          tipo: string
        }
        Update: {
          concepto?: string
          created_at?: string
          escrow_id?: string | null
          estado?: string
          id?: string
          monto?: number
          origen?: string
          owner_id?: string
          owner_tipo?: string
          presupuesto_id?: string | null
          tarea_id?: string | null
          tipo?: string
        }
        Relationships: [
          {
            foreignKeyName: "wallet_movimientos_escrow_fk"
            columns: ["escrow_id"]
            isOneToOne: false
            referencedRelation: "escrow_transacciones"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "wallet_movimientos_presupuesto_id_fkey"
            columns: ["presupuesto_id"]
            isOneToOne: false
            referencedRelation: "tareas_presupuestos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "wallet_movimientos_tarea_id_fkey"
            columns: ["tarea_id"]
            isOneToOne: false
            referencedRelation: "tareas"
            referencedColumns: ["id"]
          },
        ]
      }
      wallet_saldos: {
        Row: {
          id: string
          limite_sobregiro: number
          moneda: string
          owner_id: string
          owner_tipo: string
          proxima_liquidacion_at: string | null
          saldo_actual: number
          saldo_pendiente: number
          suspendido: boolean
          suspendido_desde: string | null
          ultima_liquidacion_at: string | null
          updated_at: string
        }
        Insert: {
          id?: string
          limite_sobregiro?: number
          moneda?: string
          owner_id: string
          owner_tipo: string
          proxima_liquidacion_at?: string | null
          saldo_actual?: number
          saldo_pendiente?: number
          suspendido?: boolean
          suspendido_desde?: string | null
          ultima_liquidacion_at?: string | null
          updated_at?: string
        }
        Update: {
          id?: string
          limite_sobregiro?: number
          moneda?: string
          owner_id?: string
          owner_tipo?: string
          proxima_liquidacion_at?: string | null
          saldo_actual?: number
          saldo_pendiente?: number
          suspendido?: boolean
          suspendido_desde?: string | null
          ultima_liquidacion_at?: string | null
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      organizaciones: {
        Row: {
          address: string | null
          avatar_url: string | null
          created_at: string | null
          cuit: string | null
          id: string | null
          name: string | null
          nombre: string | null
          owner_user_id: string | null
          plan_actual: string | null
          user_id: string | null
        }
        Insert: {
          address?: string | null
          avatar_url?: string | null
          created_at?: string | null
          cuit?: string | null
          id?: string | null
          name?: string | null
          nombre?: string | null
          owner_user_id?: string | null
          plan_actual?: string | null
          user_id?: string | null
        }
        Update: {
          address?: string | null
          avatar_url?: string | null
          created_at?: string | null
          cuit?: string | null
          id?: string | null
          name?: string | null
          nombre?: string | null
          owner_user_id?: string | null
          plan_actual?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      cliente_wallet_acreditar_manual: {
        Args: {
          p_cliente_user_id: string
          p_descripcion?: string
          p_monto: number
          p_org_id: string
        }
        Returns: {
          cliente_user_id: string | null
          created_at: string
          id: string
          metadata: Json
          moneda: string
          org_id: string
          saldo_disponible: number
          saldo_reservado: number
          updated_at: string
        }
        SetofOptions: {
          from: "*"
          to: "cliente_wallets"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      cliente_wallet_devolver_reserva: {
        Args: {
          p_descripcion?: string
          p_org_id: string
          p_referencia_id: string
        }
        Returns: {
          cliente_user_id: string | null
          created_at: string
          id: string
          metadata: Json
          moneda: string
          org_id: string
          saldo_disponible: number
          saldo_reservado: number
          updated_at: string
        }
        SetofOptions: {
          from: "*"
          to: "cliente_wallets"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      cliente_wallet_liberar_tarea: {
        Args: {
          p_descripcion?: string
          p_monto_comision?: number
          p_monto_pago: number
          p_monto_total: number
          p_org_id: string
          p_socio_id: string
          p_tarea_id: string
        }
        Returns: {
          cliente_user_id: string | null
          created_at: string
          id: string
          metadata: Json
          moneda: string
          org_id: string
          saldo_disponible: number
          saldo_reservado: number
          updated_at: string
        }
        SetofOptions: {
          from: "*"
          to: "cliente_wallets"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      cliente_wallet_reservar_tarea: {
        Args: {
          p_cliente_user_id: string
          p_descripcion?: string
          p_monto: number
          p_org_id: string
          p_tarea_id: string
        }
        Returns: {
          cliente_user_id: string | null
          created_at: string
          id: string
          metadata: Json
          moneda: string
          org_id: string
          saldo_disponible: number
          saldo_reservado: number
          updated_at: string
        }
        SetofOptions: {
          from: "*"
          to: "cliente_wallets"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      ensure_cliente_wallet: {
        Args: { p_cliente_user_id?: string; p_org_id: string }
        Returns: {
          cliente_user_id: string | null
          created_at: string
          id: string
          metadata: Json
          moneda: string
          org_id: string
          saldo_disponible: number
          saldo_reservado: number
          updated_at: string
        }
        SetofOptions: {
          from: "*"
          to: "cliente_wallets"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      grows_generate_public_code: { Args: never; Returns: string }
    }
    Enums: {
      cliente_wallet_movimiento_estado:
        | "pendiente"
        | "confirmado"
        | "rechazado"
        | "cancelado"
        | "revertido"
      cliente_wallet_movimiento_tipo:
        | "CARGA_SALDO"
        | "RESERVA_TAREA"
        | "LIBERACION_PAGO"
        | "DEVOLUCION_RESERVA"
        | "COMISION_GROWS"
        | "AJUSTE_MANUAL"
      escrow_estado:
        | "pendiente"
        | "retenido"
        | "liberado"
        | "reembolsado"
        | "cancelado"
        | "fallido"
        | "expirado"
      tarea_estado:
        | "pendiente"
        | "en_ejecucion"
        | "finalizado"
        | "validado"
        | "rechazado"
      tarea_estado_oficial:
        | "pendiente"
        | "en_progreso"
        | "para_validar"
        | "validada"
        | "rechazada"
      tarea_subtarea_estado_oficial:
        | "pendiente"
        | "en_progreso"
        | "para_validar"
        | "validado"
        | "rechazado"
      wallet_metodo_pago: "EFECTIVO" | "ONLINE"
      wallet_movimiento_estado: "pendiente" | "completado" | "cancelado"
      wallet_movimiento_tipo: "CREDITO" | "DEBITO"
      wallet_owner_tipo: "SOCIO" | "ORG"
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
      cliente_wallet_movimiento_estado: [
        "pendiente",
        "confirmado",
        "rechazado",
        "cancelado",
        "revertido",
      ],
      cliente_wallet_movimiento_tipo: [
        "CARGA_SALDO",
        "RESERVA_TAREA",
        "LIBERACION_PAGO",
        "DEVOLUCION_RESERVA",
        "COMISION_GROWS",
        "AJUSTE_MANUAL",
      ],
      escrow_estado: [
        "pendiente",
        "retenido",
        "liberado",
        "reembolsado",
        "cancelado",
        "fallido",
        "expirado",
      ],
      tarea_estado: [
        "pendiente",
        "en_ejecucion",
        "finalizado",
        "validado",
        "rechazado",
      ],
      tarea_estado_oficial: [
        "pendiente",
        "en_progreso",
        "para_validar",
        "validada",
        "rechazada",
      ],
      tarea_subtarea_estado_oficial: [
        "pendiente",
        "en_progreso",
        "para_validar",
        "validado",
        "rechazado",
      ],
      wallet_metodo_pago: ["EFECTIVO", "ONLINE"],
      wallet_movimiento_estado: ["pendiente", "completado", "cancelado"],
      wallet_movimiento_tipo: ["CREDITO", "DEBITO"],
      wallet_owner_tipo: ["SOCIO", "ORG"],
    },
  },
} as const
