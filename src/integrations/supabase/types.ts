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
      argeplan_consultaplanos: {
        Row: {
          cidade: string | null
          cnpj_obrigatorio: boolean | null
          coparticipacao: string | null
          destaque: string | null
          faixa_etaria_max: number | null
          faixa_etaria_min: number | null
          id: string
          nome_plano: string | null
          operadora: string | null
          valor: number | null
        }
        Insert: {
          cidade?: string | null
          cnpj_obrigatorio?: boolean | null
          coparticipacao?: string | null
          destaque?: string | null
          faixa_etaria_max?: number | null
          faixa_etaria_min?: number | null
          id?: string
          nome_plano?: string | null
          operadora?: string | null
          valor?: number | null
        }
        Update: {
          cidade?: string | null
          cnpj_obrigatorio?: boolean | null
          coparticipacao?: string | null
          destaque?: string | null
          faixa_etaria_max?: number | null
          faixa_etaria_min?: number | null
          id?: string
          nome_plano?: string | null
          operadora?: string | null
          valor?: number | null
        }
        Relationships: []
      }
      argeplan_crm: {
        Row: {
          canal_origem: string | null
          cidade: string
          data_entrada: string | null
          email: string
          estado: string
          id: number
          nome: string
          plano_odonto: boolean | null
          plano_saude: boolean | null
          score_engajamento: number | null
          seguro_auto: boolean | null
          telefone: string
          ultima_interacao: string | null
          whats_contact: string | null
        }
        Insert: {
          canal_origem?: string | null
          cidade: string
          data_entrada?: string | null
          email: string
          estado: string
          id: number
          nome: string
          plano_odonto?: boolean | null
          plano_saude?: boolean | null
          score_engajamento?: number | null
          seguro_auto?: boolean | null
          telefone: string
          ultima_interacao?: string | null
          whats_contact?: string | null
        }
        Update: {
          canal_origem?: string | null
          cidade?: string
          data_entrada?: string | null
          email?: string
          estado?: string
          id?: number
          nome?: string
          plano_odonto?: boolean | null
          plano_saude?: boolean | null
          score_engajamento?: number | null
          seguro_auto?: boolean | null
          telefone?: string
          ultima_interacao?: string | null
          whats_contact?: string | null
        }
        Relationships: []
      }
      argeplan_ddd_cidade: {
        Row: {
          cidade: string
          conhecidapor: string | null
          ddd: number
          estado: string
          uf: string
        }
        Insert: {
          cidade: string
          conhecidapor?: string | null
          ddd: number
          estado: string
          uf: string
        }
        Update: {
          cidade?: string
          conhecidapor?: string | null
          ddd?: number
          estado?: string
          uf?: string
        }
        Relationships: []
      }
      argeplan_interacoes_lola: {
        Row: {
          canal: string | null
          cidade: string | null
          created_at: string | null
          data_utc: string | null
          estado: string | null
          finalizou_etapa: boolean | null
          id: string
          idade: number | null
          interacao_n: number | null
          mensagem_lola: string | null
          mensagem_usuario: string | null
          nome_lead: string | null
          remote_jid: string | null
          session_expired: boolean | null
          session_id: string | null
          session_start_utc: string | null
          status: string | null
          telefone: string | null
          tem_cnpj: boolean | null
          timestamp: number | null
        }
        Insert: {
          canal?: string | null
          cidade?: string | null
          created_at?: string | null
          data_utc?: string | null
          estado?: string | null
          finalizou_etapa?: boolean | null
          id?: string
          idade?: number | null
          interacao_n?: number | null
          mensagem_lola?: string | null
          mensagem_usuario?: string | null
          nome_lead?: string | null
          remote_jid?: string | null
          session_expired?: boolean | null
          session_id?: string | null
          session_start_utc?: string | null
          status?: string | null
          telefone?: string | null
          tem_cnpj?: boolean | null
          timestamp?: number | null
        }
        Update: {
          canal?: string | null
          cidade?: string | null
          created_at?: string | null
          data_utc?: string | null
          estado?: string | null
          finalizou_etapa?: boolean | null
          id?: string
          idade?: number | null
          interacao_n?: number | null
          mensagem_lola?: string | null
          mensagem_usuario?: string | null
          nome_lead?: string | null
          remote_jid?: string | null
          session_expired?: boolean | null
          session_id?: string | null
          session_start_utc?: string | null
          status?: string | null
          telefone?: string | null
          tem_cnpj?: boolean | null
          timestamp?: number | null
        }
        Relationships: []
      }
      jocrosscorretores: {
        Row: {
          conversation: string | null
          created_at: string
          email: string | null
          id: number
          Idade: string | null
          nome: string | null
          PlanoParaVoceFamiliaEmpresa: string | null
          PossuiPlanoDeSaude: string | null
          remoteJid: string | null
          source: string | null
        }
        Insert: {
          conversation?: string | null
          created_at?: string
          email?: string | null
          id?: number
          Idade?: string | null
          nome?: string | null
          PlanoParaVoceFamiliaEmpresa?: string | null
          PossuiPlanoDeSaude?: string | null
          remoteJid?: string | null
          source?: string | null
        }
        Update: {
          conversation?: string | null
          created_at?: string
          email?: string | null
          id?: number
          Idade?: string | null
          nome?: string | null
          PlanoParaVoceFamiliaEmpresa?: string | null
          PossuiPlanoDeSaude?: string | null
          remoteJid?: string | null
          source?: string | null
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
