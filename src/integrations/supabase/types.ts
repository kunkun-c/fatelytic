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
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      readings: {
        Row: {
          id: string
          user_id: string
          full_name: string
          date_of_birth: string
          gender: string | null
          life_path_number: number
          expression_number: number
          soul_urge_number: number
          result_json: Json
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          full_name: string
          date_of_birth: string
          gender?: string | null
          life_path_number: number
          expression_number: number
          soul_urge_number: number
          result_json: Json
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          full_name?: string
          date_of_birth?: string
          gender?: string | null
          life_path_number?: number
          expression_number?: number
          soul_urge_number?: number
          result_json?: Json
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "readings_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      profiles: {
        Row: {
          id: string
          user_id: string
          full_name: string
          date_of_birth: string
          lunar_date_of_birth: string
          time_of_birth: string | null
          place_of_birth: string
          gender: string | null
          ziwei_chart_json: Json | null
          ziwei_chart_image_url: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          full_name: string
          date_of_birth: string
          lunar_date_of_birth: string
          time_of_birth?: string | null
          place_of_birth: string
          gender?: string | null
          ziwei_chart_json?: Json | null
          ziwei_chart_image_url?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          full_name?: string
          date_of_birth?: string
          lunar_date_of_birth?: string
          time_of_birth?: string | null
          place_of_birth?: string
          gender?: string | null
          ziwei_chart_json?: Json | null
          ziwei_chart_image_url?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "profiles_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      numerology_readings: {
        Row: {
          id: string
          user_id: string
          full_name: string
          date_of_birth: string
          gender: string | null
          life_path_number: number
          expression_number: number
          soul_urge_number: number
          result_json: Json
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          full_name: string
          date_of_birth: string
          gender?: string | null
          life_path_number: number
          expression_number: number
          soul_urge_number: number
          result_json: Json
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          full_name?: string
          date_of_birth?: string
          gender?: string | null
          life_path_number?: number
          expression_number?: number
          soul_urge_number?: number
          result_json?: Json
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "numerology_readings_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      eastern_readings: {
        Row: {
          id: string
          user_id: string
          input_json: Json
          result_json: Json
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          input_json: Json
          result_json: Json
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          input_json?: Json
          result_json?: Json
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "eastern_readings_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      western_readings: {
        Row: {
          id: string
          user_id: string
          input_json: Json
          result_json: Json
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          input_json: Json
          result_json: Json
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          input_json?: Json
          result_json?: Json
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "western_readings_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      tarot_readings: {
        Row: {
          id: string
          user_id: string
          input_json: Json
          result_json: Json
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          input_json: Json
          result_json: Json
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          input_json?: Json
          result_json?: Json
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "tarot_readings_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      iching_readings: {
        Row: {
          id: string
          user_id: string
          input_json: Json
          result_json: Json
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          input_json: Json
          result_json: Json
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          input_json?: Json
          result_json?: Json
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "iching_readings_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      career_readings: {
        Row: {
          id: string
          user_id: string
          input_json: Json
          result_json: Json
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          input_json: Json
          result_json: Json
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          input_json?: Json
          result_json?: Json
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "career_readings_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }

      chat_sessions: {
        Row: {
          id: string
          user_id: string
          module: string
          reading_id: string | null
          context_json: Json | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          module: string
          reading_id?: string | null
          context_json?: Json | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          module?: string
          reading_id?: string | null
          context_json?: Json | null
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "chat_sessions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chat_sessions_reading_id_fkey"
            columns: ["reading_id"]
            isOneToOne: false
            referencedRelation: "eastern_readings"
            referencedColumns: ["id"]
          }
        ]
      }

      chat_messages: {
        Row: {
          id: string
          session_id: string
          role: string
          content: string
          created_at: string
        }
        Insert: {
          id?: string
          session_id: string
          role: string
          content: string
          created_at?: string
        }
        Update: {
          id?: string
          session_id?: string
          role?: string
          content?: string
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "chat_messages_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "chat_sessions"
            referencedColumns: ["id"]
          }
        ]
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
    Enums: {},
  },
} as const
