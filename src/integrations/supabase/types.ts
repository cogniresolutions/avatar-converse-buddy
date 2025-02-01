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
      api_keys: {
        Row: {
          created_at: string
          expires_at: string | null
          id: string
          ip_whitelist: string[] | null
          is_active: boolean | null
          key_hash: string
          last_used_at: string | null
          name: string | null
          persona_id: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string
          expires_at?: string | null
          id?: string
          ip_whitelist?: string[] | null
          is_active?: boolean | null
          key_hash: string
          last_used_at?: string | null
          name?: string | null
          persona_id?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string
          expires_at?: string | null
          id?: string
          ip_whitelist?: string[] | null
          is_active?: boolean | null
          key_hash?: string
          last_used_at?: string | null
          name?: string | null
          persona_id?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "api_keys_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      api_monitoring: {
        Row: {
          created_at: string | null
          endpoint: string
          error_message: string | null
          id: string
          response_time: number | null
          status: string
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          endpoint: string
          error_message?: string | null
          id?: string
          response_time?: number | null
          status: string
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          endpoint?: string
          error_message?: string | null
          id?: string
          response_time?: number | null
          status?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "api_monitoring_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      conversation_sessions: {
        Row: {
          conversation_id: string | null
          created_at: string
          id: string
          metadata: Json | null
          session_type: string | null
          status: string | null
          updated_at: string
        }
        Insert: {
          conversation_id?: string | null
          created_at?: string
          id?: string
          metadata?: Json | null
          session_type?: string | null
          status?: string | null
          updated_at?: string
        }
        Update: {
          conversation_id?: string | null
          created_at?: string
          id?: string
          metadata?: Json | null
          session_type?: string | null
          status?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "conversation_sessions_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      conversations: {
        Row: {
          context: string | null
          created_at: string
          id: string
          persona_id: string | null
          status: string | null
          title: string | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          context?: string | null
          created_at?: string
          id?: string
          persona_id?: string | null
          status?: string | null
          title?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          context?: string | null
          created_at?: string
          id?: string
          persona_id?: string | null
          status?: string | null
          title?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "conversations_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      emotion_analysis: {
        Row: {
          analysis_timestamp: string | null
          background_objects: Json | null
          created_at: string
          emotion_data: Json | null
          environment_context: Json | null
          environment_data: Json | null
          id: string
          persona_id: string | null
          scene_description: string | null
          user_id: string | null
        }
        Insert: {
          analysis_timestamp?: string | null
          background_objects?: Json | null
          created_at?: string
          emotion_data?: Json | null
          environment_context?: Json | null
          environment_data?: Json | null
          id?: string
          persona_id?: string | null
          scene_description?: string | null
          user_id?: string | null
        }
        Update: {
          analysis_timestamp?: string | null
          background_objects?: Json | null
          created_at?: string
          emotion_data?: Json | null
          environment_context?: Json | null
          environment_data?: Json | null
          id?: string
          persona_id?: string | null
          scene_description?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "emotion_analysis_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      mood_aggregations: {
        Row: {
          average_mood: number | null
          created_at: string
          dominant_mood: string | null
          id: string
          location_name: string
          location_type: string
          total_entries: number | null
          updated_at: string
        }
        Insert: {
          average_mood?: number | null
          created_at?: string
          dominant_mood?: string | null
          id?: string
          location_name: string
          location_type: string
          total_entries?: number | null
          updated_at?: string
        }
        Update: {
          average_mood?: number | null
          created_at?: string
          dominant_mood?: string | null
          id?: string
          location_name?: string
          location_type?: string
          total_entries?: number | null
          updated_at?: string
        }
        Relationships: []
      }
      mood_challenges: {
        Row: {
          created_at: string
          description: string | null
          end_date: string
          id: string
          location_name: string | null
          location_type: string | null
          participants_count: number | null
          start_date: string
          target_mood: string
          title: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          end_date: string
          id?: string
          location_name?: string | null
          location_type?: string | null
          participants_count?: number | null
          start_date: string
          target_mood: string
          title: string
        }
        Update: {
          created_at?: string
          description?: string | null
          end_date?: string
          id?: string
          location_name?: string | null
          location_type?: string | null
          participants_count?: number | null
          start_date?: string
          target_mood?: string
          title?: string
        }
        Relationships: []
      }
      mood_entries: {
        Row: {
          confidence: number
          created_at: string
          id: string
          mood: string
          notes: string | null
          source: string
          user_id: string
        }
        Insert: {
          confidence: number
          created_at?: string
          id?: string
          mood: string
          notes?: string | null
          source: string
          user_id: string
        }
        Update: {
          confidence?: number
          created_at?: string
          id?: string
          mood?: string
          notes?: string | null
          source?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "mood_entries_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      mood_locations: {
        Row: {
          created_at: string
          id: string
          latitude: number | null
          location_grid_id: string | null
          longitude: number | null
          mood_entry_id: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          latitude?: number | null
          location_grid_id?: string | null
          longitude?: number | null
          mood_entry_id?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          latitude?: number | null
          location_grid_id?: string | null
          longitude?: number | null
          mood_entry_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "mood_locations_mood_entry_id_fkey"
            columns: ["mood_entry_id"]
            isOneToOne: false
            referencedRelation: "mood_entries"
            referencedColumns: ["id"]
          },
        ]
      }
      mood_recommendations: {
        Row: {
          created_at: string
          id: string
          mood_pattern: string
          recommendation: string
        }
        Insert: {
          created_at?: string
          id?: string
          mood_pattern: string
          recommendation: string
        }
        Update: {
          created_at?: string
          id?: string
          mood_pattern?: string
          recommendation?: string
        }
        Relationships: []
      }
      music_sources: {
        Row: {
          age_range: unknown | null
          artist: string | null
          created_at: string
          description: string | null
          id: string
          language: string
          mood_tags: string[]
          platform: string
          title: string
          url: string
        }
        Insert: {
          age_range?: unknown | null
          artist?: string | null
          created_at?: string
          description?: string | null
          id?: string
          language: string
          mood_tags: string[]
          platform: string
          title: string
          url: string
        }
        Update: {
          age_range?: unknown | null
          artist?: string | null
          created_at?: string
          description?: string | null
          id?: string
          language?: string
          mood_tags?: string[]
          platform?: string
          title?: string
          url?: string
        }
        Relationships: []
      }
      persona_training_materials: {
        Row: {
          analysis_results: Json | null
          file_name: string
          file_path: string
          file_size: number
          file_type: string
          id: string
          replica_id: string | null
          status: string | null
          uploaded_at: string
          user_id: string | null
        }
        Insert: {
          analysis_results?: Json | null
          file_name: string
          file_path: string
          file_size: number
          file_type: string
          id?: string
          replica_id?: string | null
          status?: string | null
          uploaded_at?: string
          user_id?: string | null
        }
        Update: {
          analysis_results?: Json | null
          file_name?: string
          file_path?: string
          file_size?: number
          file_type?: string
          id?: string
          replica_id?: string | null
          status?: string | null
          uploaded_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "persona_training_materials_replica_id_fkey"
            columns: ["replica_id"]
            isOneToOne: false
            referencedRelation: "replicas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "persona_training_materials_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          birth_date: string | null
          created_at: string
          id: string
          music_preferences: Json | null
          preferred_language: string | null
          updated_at: string
          username: string | null
        }
        Insert: {
          avatar_url?: string | null
          birth_date?: string | null
          created_at?: string
          id: string
          music_preferences?: Json | null
          preferred_language?: string | null
          updated_at?: string
          username?: string | null
        }
        Update: {
          avatar_url?: string | null
          birth_date?: string | null
          created_at?: string
          id?: string
          music_preferences?: Json | null
          preferred_language?: string | null
          updated_at?: string
          username?: string | null
        }
        Relationships: []
      }
      recommendations: {
        Row: {
          age_range: unknown | null
          created_at: string
          description: string | null
          id: string
          language: string
          mood_tags: string[] | null
          title: string
          type: string
        }
        Insert: {
          age_range?: unknown | null
          created_at?: string
          description?: string | null
          id?: string
          language?: string
          mood_tags?: string[] | null
          title: string
          type: string
        }
        Update: {
          age_range?: unknown | null
          created_at?: string
          description?: string | null
          id?: string
          language?: string
          mood_tags?: string[] | null
          title?: string
          type?: string
        }
        Relationships: []
      }
      replicas: {
        Row: {
          avatar_url: string | null
          created_at: string
          description: string | null
          id: string
          name: string
          status: string | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          description?: string | null
          id?: string
          name: string
          status?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          status?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "personas_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      tavus_sessions: {
        Row: {
          conversation_id: string
          created_at: string
          id: string
          is_active: boolean | null
          last_checked_at: string
          participants: Json | null
          session_type: string | null
          status: string
          updated_at: string
          user_id: string | null
          video_call_id: string | null
        }
        Insert: {
          conversation_id: string
          created_at?: string
          id?: string
          is_active?: boolean | null
          last_checked_at?: string
          participants?: Json | null
          session_type?: string | null
          status?: string
          updated_at?: string
          user_id?: string | null
          video_call_id?: string | null
        }
        Update: {
          conversation_id?: string
          created_at?: string
          id?: string
          is_active?: boolean | null
          last_checked_at?: string
          participants?: Json | null
          session_type?: string | null
          status?: string
          updated_at?: string
          user_id?: string | null
          video_call_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tavus_sessions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      training_sessions: {
        Row: {
          created_at: string
          description: string | null
          id: string
          title: string
          transcript: string | null
          updated_at: string
          user_id: string | null
          video_url: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          title: string
          transcript?: string | null
          updated_at?: string
          user_id?: string | null
          video_url: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          title?: string
          transcript?: string | null
          updated_at?: string
          user_id?: string | null
          video_url?: string
        }
        Relationships: []
      }
      training_videos: {
        Row: {
          analysis_feedback: Json | null
          consent_url: string | null
          created_at: string
          duration: number | null
          id: string
          processing_status: string | null
          replica_id: string | null
          status: string | null
          user_id: string | null
          video_url: string
        }
        Insert: {
          analysis_feedback?: Json | null
          consent_url?: string | null
          created_at?: string
          duration?: number | null
          id?: string
          processing_status?: string | null
          replica_id?: string | null
          status?: string | null
          user_id?: string | null
          video_url: string
        }
        Update: {
          analysis_feedback?: Json | null
          consent_url?: string | null
          created_at?: string
          duration?: number | null
          id?: string
          processing_status?: string | null
          replica_id?: string | null
          status?: string | null
          user_id?: string | null
          video_url?: string
        }
        Relationships: [
          {
            foreignKeyName: "training_videos_replica_id_fkey"
            columns: ["replica_id"]
            isOneToOne: false
            referencedRelation: "replicas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "training_videos_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_achievements: {
        Row: {
          achieved_at: string
          achievement_name: string
          achievement_type: string
          id: string
          user_id: string
        }
        Insert: {
          achieved_at?: string
          achievement_name: string
          achievement_type: string
          id?: string
          user_id: string
        }
        Update: {
          achieved_at?: string
          achievement_name?: string
          achievement_type?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_achievements_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_screenshots: {
        Row: {
          analysis_data: Json | null
          created_at: string
          file_path: string
          id: string
          session_id: string | null
          user_id: string
        }
        Insert: {
          analysis_data?: Json | null
          created_at?: string
          file_path: string
          id?: string
          session_id?: string | null
          user_id: string
        }
        Update: {
          analysis_data?: Json | null
          created_at?: string
          file_path?: string
          id?: string
          session_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_screenshots_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "tavus_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      video_processing_segments: {
        Row: {
          created_at: string
          expression_data: Json | null
          id: string
          processing_error: string | null
          processing_logs: Json | null
          processing_progress: number | null
          segment_end: number
          segment_start: number
          status: string | null
          training_video_id: string
          updated_at: string
          voice_data: Json | null
        }
        Insert: {
          created_at?: string
          expression_data?: Json | null
          id?: string
          processing_error?: string | null
          processing_logs?: Json | null
          processing_progress?: number | null
          segment_end: number
          segment_start: number
          status?: string | null
          training_video_id: string
          updated_at?: string
          voice_data?: Json | null
        }
        Update: {
          created_at?: string
          expression_data?: Json | null
          id?: string
          processing_error?: string | null
          processing_logs?: Json | null
          processing_progress?: number | null
          segment_end?: number
          segment_start?: number
          status?: string | null
          training_video_id?: string
          updated_at?: string
          voice_data?: Json | null
        }
        Relationships: []
      }
      video_templates: {
        Row: {
          background_url: string | null
          created_at: string
          description: string | null
          effects_config: Json | null
          id: string
          is_public: boolean | null
          name: string
          preview_url: string | null
          processing_settings: Json | null
          template_type: string | null
          updated_at: string
          usage_count: number | null
          user_id: string | null
          variables: Json | null
        }
        Insert: {
          background_url?: string | null
          created_at?: string
          description?: string | null
          effects_config?: Json | null
          id?: string
          is_public?: boolean | null
          name: string
          preview_url?: string | null
          processing_settings?: Json | null
          template_type?: string | null
          updated_at?: string
          usage_count?: number | null
          user_id?: string | null
          variables?: Json | null
        }
        Update: {
          background_url?: string | null
          created_at?: string
          description?: string | null
          effects_config?: Json | null
          id?: string
          is_public?: boolean | null
          name?: string
          preview_url?: string | null
          processing_settings?: Json | null
          template_type?: string | null
          updated_at?: string
          usage_count?: number | null
          user_id?: string | null
          variables?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "video_templates_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      voice_cloning_configs: {
        Row: {
          created_at: string
          id: string
          model_settings: Json | null
          model_type: string
          persona_id: string | null
          training_progress: number | null
          training_status: string | null
          updated_at: string
          user_id: string | null
          voice_samples: Json | null
          voice_settings: Json | null
        }
        Insert: {
          created_at?: string
          id?: string
          model_settings?: Json | null
          model_type: string
          persona_id?: string | null
          training_progress?: number | null
          training_status?: string | null
          updated_at?: string
          user_id?: string | null
          voice_samples?: Json | null
          voice_settings?: Json | null
        }
        Update: {
          created_at?: string
          id?: string
          model_settings?: Json | null
          model_type?: string
          persona_id?: string | null
          training_progress?: number | null
          training_status?: string | null
          updated_at?: string
          user_id?: string | null
          voice_samples?: Json | null
          voice_settings?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "voice_cloning_configs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      voice_mappings: {
        Row: {
          azure_voice_name: string
          created_at: string
          display_name: string
          gender: string
          id: string
          language_code: string
          voice_style: string
        }
        Insert: {
          azure_voice_name: string
          created_at?: string
          display_name: string
          gender: string
          id?: string
          language_code: string
          voice_style: string
        }
        Update: {
          azure_voice_name?: string
          created_at?: string
          display_name?: string
          gender?: string
          id?: string
          language_code?: string
          voice_style?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      cleanup_old_screenshots: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      generate_location_grid_id: {
        Args: {
          lat: number
          lon: number
        }
        Returns: string
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type PublicSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  PublicTableNameOrOptions extends
    | keyof (PublicSchema["Tables"] & PublicSchema["Views"])
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
        Database[PublicTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
      Database[PublicTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : PublicTableNameOrOptions extends keyof (PublicSchema["Tables"] &
        PublicSchema["Views"])
    ? (PublicSchema["Tables"] &
        PublicSchema["Views"])[PublicTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  PublicEnumNameOrOptions extends
    | keyof PublicSchema["Enums"]
    | { schema: keyof Database },
  EnumName extends PublicEnumNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = PublicEnumNameOrOptions extends { schema: keyof Database }
  ? Database[PublicEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : PublicEnumNameOrOptions extends keyof PublicSchema["Enums"]
    ? PublicSchema["Enums"][PublicEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof PublicSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof PublicSchema["CompositeTypes"]
    ? PublicSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never
