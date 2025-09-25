export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  __InternalSupabase: {
    PostgrestVersion: "13.0.5";
  };
  public: {
    Tables: {
      eventos: {
        Row: {
          actor_method: string;
          actor_name: string;
          actor_role: string;
          checklist: Json;
          created_at: string;
          gps_lat: number | null;
          gps_lon: number | null;
          has_nc: boolean;
          id: string;
          nc_deadline: string | null;
          nc_responsable: string | null;
          notas: string;
          nuevo_estado: Database["public"]["Enums"]["visit_status"];
          pdf_path: string | null;
          snapshot_json: Json | null;
          tarea_id: string;
        };
        Insert: {
          actor_method: string;
          actor_name: string;
          actor_role: string;
          checklist?: Json;
          created_at?: string;
          gps_lat?: number | null;
          gps_lon?: number | null;
          has_nc?: boolean;
          id?: string;
          nc_deadline?: string | null;
          nc_responsable?: string | null;
          notas?: string;
          nuevo_estado: Database["public"]["Enums"]["visit_status"];
          pdf_path?: string | null;
          snapshot_json?: Json | null;
          tarea_id: string;
        };
        Update: {
          actor_method?: string;
          actor_name?: string;
          actor_role?: string;
          checklist?: Json;
          created_at?: string;
          gps_lat?: number | null;
          gps_lon?: number | null;
          has_nc?: boolean;
          id?: string;
          nc_deadline?: string | null;
          nc_responsable?: string | null;
          notas?: string;
          nuevo_estado?: Database["public"]["Enums"]["visit_status"];
          pdf_path?: string | null;
          snapshot_json?: Json | null;
          tarea_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "eventos_tarea_id_fkey";
            columns: ["tarea_id"];
            isOneToOne: false;
            referencedRelation: "tareas";
            referencedColumns: ["id"];
          }
        ];
      };
      leader_invites: {
        Row: {
          accepted_at: string | null;
          created_at: string;
          email: string;
          id: string;
          nombre: string;
          org_id: string;
          rol: string;
          status: string;
          token: string;
        };
        Insert: {
          accepted_at?: string | null;
          created_at?: string;
          email: string;
          id?: string;
          nombre: string;
          org_id: string;
          rol: string;
          status?: string;
          token?: string;
        };
        Update: {
          accepted_at?: string | null;
          created_at?: string;
          email?: string;
          id?: string;
          nombre?: string;
          org_id?: string;
          rol?: string;
          status?: string;
          token?: string;
        };
        Relationships: [
          {
            foreignKeyName: "leader_invites_org_id_fkey";
            columns: ["org_id"];
            isOneToOne: false;
            referencedRelation: "orgs";
            referencedColumns: ["id"];
          }
        ];
      };
      media: {
        Row: {
          created_at: string;
          evento_id: string;
          id: string;
          idx: number;
          kind: string;
          path: string;
        };
        Insert: {
          created_at?: string;
          evento_id: string;
          id?: string;
          idx?: number;
          kind: string;
          path: string;
        };
        Update: {
          created_at?: string;
          evento_id?: string;
          id?: string;
          idx?: number;
          kind?: string;
          path?: string;
        };
        Relationships: [
          {
            foreignKeyName: "media_evento_id_fkey";
            columns: ["evento_id"];
            isOneToOne: false;
            referencedRelation: "eventos";
            referencedColumns: ["id"];
          }
        ];
      };
      obras: {
        Row: {
          cliente: string | null;
          created_at: string;
          id: string;
          localizacion: string | null;
          nombre: string;
          org_id: string;
        };
        Insert: {
          cliente?: string | null;
          created_at?: string;
          id?: string;
          localizacion?: string | null;
          nombre: string;
          org_id: string;
        };
        Update: {
          cliente?: string | null;
          created_at?: string;
          id?: string;
          localizacion?: string | null;
          nombre?: string;
          org_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "obras_org_id_fkey";
            columns: ["org_id"];
            isOneToOne: false;
            referencedRelation: "orgs";
            referencedColumns: ["id"];
          }
        ];
      };
      orgs: {
        Row: {
          created_at: string;
          id: string;
          name: string;
          onboarding_completed: boolean;
          owner_user_id: string | null;
        };
        Insert: {
          created_at?: string;
          id?: string;
          name: string;
          onboarding_completed?: boolean;
          owner_user_id?: string | null;
        };
        Update: {
          created_at?: string;
          id?: string;
          name?: string;
          onboarding_completed?: boolean;
          owner_user_id?: string | null;
        };
        Relationships: [];
      };
      qr_tokens: {
        Row: {
          created_at: string;
          enabled: boolean;
          id: string;
          pin: string | null;
          ref_id: string;
          scope: string;
          token: string;
        };
        Insert: {
          created_at?: string;
          enabled?: boolean;
          id?: string;
          pin?: string | null;
          ref_id: string;
          scope: string;
          token: string;
        };
        Update: {
          created_at?: string;
          enabled?: boolean;
          id?: string;
          pin?: string | null;
          ref_id?: string;
          scope?: string;
          token?: string;
        };
        Relationships: [];
      };
      socios: {
        Row: {
          contacto: string | null;
          id: string;
          nombre: string;
          org_id: string;
          rol: string;
          status: string;
        };
        Insert: {
          contacto?: string | null;
          id?: string;
          nombre: string;
          org_id: string;
          rol?: string;
          status?: string;
        };
        Update: {
          contacto?: string | null;
          id?: string;
          nombre?: string;
          org_id?: string;
          rol?: string;
          status?: string;
        };
        Relationships: [
          {
            foreignKeyName: "socios_org_id_fkey";
            columns: ["org_id"];
            isOneToOne: false;
            referencedRelation: "orgs";
            referencedColumns: ["id"];
          }
        ];
      };
      tarea_precedencias: {
        Row: {
          depende_de: string;
          tarea_id: string;
        };
        Insert: {
          depende_de: string;
          tarea_id: string;
        };
        Update: {
          depende_de?: string;
          tarea_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "tarea_precedencias_depende_de_fkey";
            columns: ["depende_de"];
            isOneToOne: false;
            referencedRelation: "tareas";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "tarea_precedencias_tarea_id_fkey";
            columns: ["tarea_id"];
            isOneToOne: false;
            referencedRelation: "tareas";
            referencedColumns: ["id"];
          }
        ];
      };
      tareas: {
        Row: {
          created_at: string;
          descripcion: string;
          estado: Database["public"]["Enums"]["visit_status"];
          id: string;
          obra_id: string;
          referente_id: string | null;
          socio_ids: string[];
          tipo: string;
        };
        Insert: {
          created_at?: string;
          descripcion: string;
          estado?: Database["public"]["Enums"]["visit_status"];
          id?: string;
          obra_id: string;
          referente_id?: string | null;
          socio_ids?: string[];
          tipo: string;
        };
        Update: {
          created_at?: string;
          descripcion?: string;
          estado?: Database["public"]["Enums"]["visit_status"];
          id?: string;
          obra_id?: string;
          referente_id?: string | null;
          socio_ids?: string[];
          tipo?: string;
        };
        Relationships: [
          {
            foreignKeyName: "tareas_obra_id_fkey";
            columns: ["obra_id"];
            isOneToOne: false;
            referencedRelation: "obras";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "tareas_referente_id_fkey";
            columns: ["referente_id"];
            isOneToOne: false;
            referencedRelation: "socios";
            referencedColumns: ["id"];
          }
        ];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      visit_status: "pendiente" | "en_ejecucion" | "finalizado" | "validado";
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (Database["public"]["Tables"] & Database["public"]["Views"])
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
    ? keyof (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R;
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (Database["public"]["Tables"] &
        Database["public"]["Views"])
    ? (Database["public"]["Tables"] &
        Database["public"]["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R;
      }
      ? R
      : never
    : never;

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof Database["public"]["Tables"]
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I;
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof Database["public"]["Tables"]
    ? Database["public"]["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I;
      }
      ? I
      : never
    : never;

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof Database["public"]["Tables"]
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U;
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof Database["public"]["Tables"]
    ? Database["public"]["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U;
      }
      ? U
      : never
    : never;

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof Database["public"]["Enums"]
    | { schema: keyof Database },
  EnumName extends DefaultSchemaEnumNameOrOptions extends { schema: keyof Database }
    ? keyof Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof Database["public"]["Enums"]
    ? Database["public"]["Enums"][DefaultSchemaEnumNameOrOptions]
    : never;

export const Constants = {
  public: {
    Enums: {
      visit_status: ["pendiente", "en_ejecucion", "finalizado", "validado"],
    },
  },
} as const;
