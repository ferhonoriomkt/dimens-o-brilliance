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
      crm_audit_log: {
        Row: {
          action: string
          created_at: string
          id: string
          new_data: Json | null
          old_data: Json | null
          record_id: string | null
          table_name: string
          user_id: string | null
        }
        Insert: {
          action: string
          created_at?: string
          id?: string
          new_data?: Json | null
          old_data?: Json | null
          record_id?: string | null
          table_name: string
          user_id?: string | null
        }
        Update: {
          action?: string
          created_at?: string
          id?: string
          new_data?: Json | null
          old_data?: Json | null
          record_id?: string | null
          table_name?: string
          user_id?: string | null
        }
        Relationships: []
      }
      crm_fase_template_itens: {
        Row: {
          created_at: string
          descricao: string | null
          id: string
          nome: string
          ordem: number
          template_id: string
        }
        Insert: {
          created_at?: string
          descricao?: string | null
          id?: string
          nome: string
          ordem?: number
          template_id: string
        }
        Update: {
          created_at?: string
          descricao?: string | null
          id?: string
          nome?: string
          ordem?: number
          template_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "crm_fase_template_itens_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "crm_fase_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      crm_fase_templates: {
        Row: {
          created_at: string
          created_by: string | null
          descricao: string | null
          id: string
          is_global: boolean
          nome: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          descricao?: string | null
          id?: string
          is_global?: boolean
          nome: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          descricao?: string | null
          id?: string
          is_global?: boolean
          nome?: string
          updated_at?: string
        }
        Relationships: []
      }
      crm_fases: {
        Row: {
          created_at: string
          descricao: string | null
          id: string
          nome: string
          ordem: number
          projeto_id: string
          template_id: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          descricao?: string | null
          id?: string
          nome: string
          ordem?: number
          projeto_id: string
          template_id?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          descricao?: string | null
          id?: string
          nome?: string
          ordem?: number
          projeto_id?: string
          template_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "crm_fases_projeto_id_fkey"
            columns: ["projeto_id"]
            isOneToOne: false
            referencedRelation: "crm_projetos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crm_fases_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "crm_fase_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      crm_item_custos: {
        Row: {
          created_at: string
          custo_previsto: number
          custo_real: number | null
          item_id: string
          observacoes: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          custo_previsto?: number
          custo_real?: number | null
          item_id: string
          observacoes?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          custo_previsto?: number
          custo_real?: number | null
          item_id?: string
          observacoes?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "crm_item_custos_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: true
            referencedRelation: "crm_planejamento_itens"
            referencedColumns: ["id"]
          },
        ]
      }
      crm_obra_financeiro: {
        Row: {
          created_at: string
          obra_id: string
          observacoes: string | null
          updated_at: string
          valor_contrato: number
        }
        Insert: {
          created_at?: string
          obra_id: string
          observacoes?: string | null
          updated_at?: string
          valor_contrato?: number
        }
        Update: {
          created_at?: string
          obra_id?: string
          observacoes?: string | null
          updated_at?: string
          valor_contrato?: number
        }
        Relationships: [
          {
            foreignKeyName: "crm_obra_financeiro_obra_id_fkey"
            columns: ["obra_id"]
            isOneToOne: true
            referencedRelation: "crm_obras"
            referencedColumns: ["id"]
          },
        ]
      }
      crm_obra_membros: {
        Row: {
          can_view_financial: boolean
          created_at: string
          id: string
          obra_id: string
          papel: Database["public"]["Enums"]["crm_membro_papel"]
          user_id: string
        }
        Insert: {
          can_view_financial?: boolean
          created_at?: string
          id?: string
          obra_id: string
          papel: Database["public"]["Enums"]["crm_membro_papel"]
          user_id: string
        }
        Update: {
          can_view_financial?: boolean
          created_at?: string
          id?: string
          obra_id?: string
          papel?: Database["public"]["Enums"]["crm_membro_papel"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "crm_obra_membros_obra_id_fkey"
            columns: ["obra_id"]
            isOneToOne: false
            referencedRelation: "crm_obras"
            referencedColumns: ["id"]
          },
        ]
      }
      crm_obras: {
        Row: {
          cliente_email: string | null
          cliente_nome: string | null
          cover_image_url: string | null
          created_at: string
          created_by: string | null
          data_fim_prevista: string | null
          data_inicio_prevista: string | null
          endereco: string | null
          escopo: string | null
          id: string
          nome: string
          status: Database["public"]["Enums"]["crm_obra_status"]
          updated_at: string
        }
        Insert: {
          cliente_email?: string | null
          cliente_nome?: string | null
          cover_image_url?: string | null
          created_at?: string
          created_by?: string | null
          data_fim_prevista?: string | null
          data_inicio_prevista?: string | null
          endereco?: string | null
          escopo?: string | null
          id?: string
          nome: string
          status?: Database["public"]["Enums"]["crm_obra_status"]
          updated_at?: string
        }
        Update: {
          cliente_email?: string | null
          cliente_nome?: string | null
          cover_image_url?: string | null
          created_at?: string
          created_by?: string | null
          data_fim_prevista?: string | null
          data_inicio_prevista?: string | null
          endereco?: string | null
          escopo?: string | null
          id?: string
          nome?: string
          status?: Database["public"]["Enums"]["crm_obra_status"]
          updated_at?: string
        }
        Relationships: []
      }
      crm_planejamento_itens: {
        Row: {
          completed_at: string | null
          created_at: string
          created_by: string | null
          data_fim: string | null
          data_inicio: string | null
          descricao: string | null
          equipe: string | null
          fase_id: string | null
          id: string
          nome: string
          ordem: number
          projeto_id: string
          quantidade: number
          responsavel_user_id: string | null
          servico_relacionado_id: string | null
          status: Database["public"]["Enums"]["crm_item_status"]
          tipo: Database["public"]["Enums"]["crm_item_tipo"]
          unidade: string | null
          updated_at: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          created_by?: string | null
          data_fim?: string | null
          data_inicio?: string | null
          descricao?: string | null
          equipe?: string | null
          fase_id?: string | null
          id?: string
          nome: string
          ordem?: number
          projeto_id: string
          quantidade?: number
          responsavel_user_id?: string | null
          servico_relacionado_id?: string | null
          status?: Database["public"]["Enums"]["crm_item_status"]
          tipo: Database["public"]["Enums"]["crm_item_tipo"]
          unidade?: string | null
          updated_at?: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          created_by?: string | null
          data_fim?: string | null
          data_inicio?: string | null
          descricao?: string | null
          equipe?: string | null
          fase_id?: string | null
          id?: string
          nome?: string
          ordem?: number
          projeto_id?: string
          quantidade?: number
          responsavel_user_id?: string | null
          servico_relacionado_id?: string | null
          status?: Database["public"]["Enums"]["crm_item_status"]
          tipo?: Database["public"]["Enums"]["crm_item_tipo"]
          unidade?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "crm_planejamento_itens_fase_id_fkey"
            columns: ["fase_id"]
            isOneToOne: false
            referencedRelation: "crm_fases"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crm_planejamento_itens_projeto_id_fkey"
            columns: ["projeto_id"]
            isOneToOne: false
            referencedRelation: "crm_projetos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crm_planejamento_itens_servico_relacionado_id_fkey"
            columns: ["servico_relacionado_id"]
            isOneToOne: false
            referencedRelation: "crm_planejamento_itens"
            referencedColumns: ["id"]
          },
        ]
      }
      crm_projetos: {
        Row: {
          created_at: string
          created_by: string | null
          descricao: string | null
          escopo: string | null
          id: string
          nome: string
          obra_id: string
          ordem: number
          status: Database["public"]["Enums"]["crm_obra_status"]
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          descricao?: string | null
          escopo?: string | null
          id?: string
          nome: string
          obra_id: string
          ordem?: number
          status?: Database["public"]["Enums"]["crm_obra_status"]
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          descricao?: string | null
          escopo?: string | null
          id?: string
          nome?: string
          obra_id?: string
          ordem?: number
          status?: Database["public"]["Enums"]["crm_obra_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "crm_projetos_obra_id_fkey"
            columns: ["obra_id"]
            isOneToOne: false
            referencedRelation: "crm_obras"
            referencedColumns: ["id"]
          },
        ]
      }
      crm_recebiveis: {
        Row: {
          created_at: string
          created_by: string | null
          data_prevista: string | null
          data_recebimento: string | null
          descricao: string
          id: string
          obra_id: string
          status: Database["public"]["Enums"]["crm_recebivel_status"]
          updated_at: string
          valor: number
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          data_prevista?: string | null
          data_recebimento?: string | null
          descricao: string
          id?: string
          obra_id: string
          status?: Database["public"]["Enums"]["crm_recebivel_status"]
          updated_at?: string
          valor?: number
        }
        Update: {
          created_at?: string
          created_by?: string | null
          data_prevista?: string | null
          data_recebimento?: string | null
          descricao?: string
          id?: string
          obra_id?: string
          status?: Database["public"]["Enums"]["crm_recebivel_status"]
          updated_at?: string
          valor?: number
        }
        Relationships: [
          {
            foreignKeyName: "crm_recebiveis_obra_id_fkey"
            columns: ["obra_id"]
            isOneToOne: false
            referencedRelation: "crm_obras"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          display_name: string | null
          id: string
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          id: string
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          id?: string
          updated_at?: string
        }
        Relationships: []
      }
      project_images: {
        Row: {
          caption: string | null
          created_at: string
          id: string
          image_url: string
          project_id: string
          sort_order: number
        }
        Insert: {
          caption?: string | null
          created_at?: string
          id?: string
          image_url: string
          project_id: string
          sort_order?: number
        }
        Update: {
          caption?: string | null
          created_at?: string
          id?: string
          image_url?: string
          project_id?: string
          sort_order?: number
        }
        Relationships: [
          {
            foreignKeyName: "project_images_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      projects: {
        Row: {
          category: string | null
          cover_image_url: string | null
          created_at: string
          created_by: string | null
          description: string | null
          id: string
          location: string | null
          published: boolean
          slug: string
          sort_order: number
          title: string
          updated_at: string
          year: number | null
        }
        Insert: {
          category?: string | null
          cover_image_url?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          location?: string | null
          published?: boolean
          slug: string
          sort_order?: number
          title: string
          updated_at?: string
          year?: number | null
        }
        Update: {
          category?: string | null
          cover_image_url?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          location?: string | null
          published?: boolean
          slug?: string
          sort_order?: number
          title?: string
          updated_at?: string
          year?: number | null
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      can_view_obra_financial: { Args: { _obra_id: string }; Returns: boolean }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_crm_admin: { Args: never; Returns: boolean }
      is_obra_coordenador: { Args: { _obra_id: string }; Returns: boolean }
      is_obra_member: { Args: { _obra_id: string }; Returns: boolean }
      obra_id_of_item: { Args: { _item_id: string }; Returns: string }
      obra_id_of_projeto: { Args: { _projeto_id: string }; Returns: string }
    }
    Enums: {
      app_role: "admin" | "cliente" | "coordenador" | "colaborador"
      crm_item_status: "definido" | "planejado" | "concluido"
      crm_item_tipo: "servico" | "materia_prima"
      crm_membro_papel: "coordenador" | "colaborador" | "cliente"
      crm_obra_status:
        | "planejamento"
        | "em_andamento"
        | "pausada"
        | "concluida"
        | "cancelada"
      crm_recebivel_status: "previsto" | "faturado" | "recebido" | "cancelado"
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
      app_role: ["admin", "cliente", "coordenador", "colaborador"],
      crm_item_status: ["definido", "planejado", "concluido"],
      crm_item_tipo: ["servico", "materia_prima"],
      crm_membro_papel: ["coordenador", "colaborador", "cliente"],
      crm_obra_status: [
        "planejamento",
        "em_andamento",
        "pausada",
        "concluida",
        "cancelada",
      ],
      crm_recebivel_status: ["previsto", "faturado", "recebido", "cancelado"],
    },
  },
} as const
