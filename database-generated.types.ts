export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      adventWords: {
        Row: {
          day: number
          word: string
        }
        Insert: {
          day?: number
          word: string
        }
        Update: {
          day?: number
          word?: string
        }
        Relationships: []
      }
      leaderboard: {
        Row: {
          points: number
          userId: string
          year: number
        }
        Insert: {
          points: number
          userId: string
          year: number
        }
        Update: {
          points?: number
          userId?: string
          year?: number
        }
        Relationships: [
          {
            foreignKeyName: "leaderboard_userId_fkey"
            columns: ["userId"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["userId"]
          }
        ]
      }
      managedRoles: {
        Row: {
          createdBy: string
          description: string
          id: number
          name: string
          roleId: string
        }
        Insert: {
          createdBy: string
          description: string
          id?: number
          name: string
          roleId: string
        }
        Update: {
          createdBy?: string
          description?: string
          id?: number
          name?: string
          roleId?: string
        }
        Relationships: []
      }
      namedChannels: {
        Row: {
          channelId: string
          id: number
          shortName: string
        }
        Insert: {
          channelId: string
          id?: number
          shortName: string
        }
        Update: {
          channelId?: string
          id?: number
          shortName?: string
        }
        Relationships: []
      }
      namedRoles: {
        Row: {
          id: number
          roleId: string
          shortName: string
        }
        Insert: {
          id?: number
          roleId: string
          shortName: string
        }
        Update: {
          id?: number
          roleId?: string
          shortName?: string
        }
        Relationships: []
      }
      pointRequests: {
        Row: {
          actionMessageId: string | null
          cleared: boolean
          created_at: string
          id: number
          requestMessageId: string
          userId: string
        }
        Insert: {
          actionMessageId?: string | null
          cleared?: boolean
          created_at?: string
          id?: number
          requestMessageId: string
          userId: string
        }
        Update: {
          actionMessageId?: string | null
          cleared?: boolean
          created_at?: string
          id?: number
          requestMessageId?: string
          userId?: string
        }
        Relationships: []
      }
      raffle: {
        Row: {
          userId: string
        }
        Insert: {
          userId: string
        }
        Update: {
          userId?: string
        }
        Relationships: [
          {
            foreignKeyName: "raffle_userId_fkey"
            columns: ["userId"]
            isOneToOne: true
            referencedRelation: "users"
            referencedColumns: ["userId"]
          }
        ]
      }
      ranks: {
        Row: {
          color: string
          id: number
          minPoints: number
          name: string
          roleId: string
        }
        Insert: {
          color: string
          id?: number
          minPoints: number
          name: string
          roleId: string
        }
        Update: {
          color?: string
          id?: number
          minPoints?: number
          name?: string
          roleId?: string
        }
        Relationships: []
      }
      santaLetters: {
        Row: {
          address: string
          content: string
          matcheeId: string | null
          region: Database["public"]["Enums"]["santaRegion"]
          userId: string
        }
        Insert: {
          address: string
          content: string
          matcheeId?: string | null
          region: Database["public"]["Enums"]["santaRegion"]
          userId: string
        }
        Update: {
          address?: string
          content?: string
          matcheeId?: string | null
          region?: Database["public"]["Enums"]["santaRegion"]
          userId?: string
        }
        Relationships: []
      }
      santaLetters_2022: {
        Row: {
          content: string
          matcheeId: string | null
          postCount: number
          region: Database["public"]["Enums"]["santaRegion"]
          userId: string
        }
        Insert: {
          content: string
          matcheeId?: string | null
          postCount: number
          region: Database["public"]["Enums"]["santaRegion"]
          userId: string
        }
        Update: {
          content?: string
          matcheeId?: string | null
          postCount?: number
          region?: Database["public"]["Enums"]["santaRegion"]
          userId?: string
        }
        Relationships: []
      }
      users: {
        Row: {
          canParticipateInSecretSanta: boolean | null
          displayName: string
          rankId: number | null
          userId: string
        }
        Insert: {
          canParticipateInSecretSanta?: boolean | null
          displayName: string
          rankId?: number | null
          userId: string
        }
        Update: {
          canParticipateInSecretSanta?: boolean | null
          displayName?: string
          rankId?: number | null
          userId?: string
        }
        Relationships: [
          {
            foreignKeyName: "users_rankId_fkey"
            columns: ["rankId"]
            isOneToOne: false
            referencedRelation: "ranks"
            referencedColumns: ["id"]
          }
        ]
      }
    }
    Views: {
      lifetime: {
        Row: {
          points: number | null
          userId: string | null
        }
        Relationships: [
          {
            foreignKeyName: "leaderboard_userId_fkey"
            columns: ["userId"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["userId"]
          }
        ]
      }
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      santaRegion: "na" | "eu" | "any"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  storage: {
    Tables: {
      buckets: {
        Row: {
          allowed_mime_types: string[] | null
          avif_autodetection: boolean | null
          created_at: string | null
          file_size_limit: number | null
          id: string
          name: string
          owner: string | null
          owner_id: string | null
          public: boolean | null
          updated_at: string | null
        }
        Insert: {
          allowed_mime_types?: string[] | null
          avif_autodetection?: boolean | null
          created_at?: string | null
          file_size_limit?: number | null
          id: string
          name: string
          owner?: string | null
          owner_id?: string | null
          public?: boolean | null
          updated_at?: string | null
        }
        Update: {
          allowed_mime_types?: string[] | null
          avif_autodetection?: boolean | null
          created_at?: string | null
          file_size_limit?: number | null
          id?: string
          name?: string
          owner?: string | null
          owner_id?: string | null
          public?: boolean | null
          updated_at?: string | null
        }
        Relationships: []
      }
      migrations: {
        Row: {
          executed_at: string | null
          hash: string
          id: number
          name: string
        }
        Insert: {
          executed_at?: string | null
          hash: string
          id: number
          name: string
        }
        Update: {
          executed_at?: string | null
          hash?: string
          id?: number
          name?: string
        }
        Relationships: []
      }
      objects: {
        Row: {
          bucket_id: string | null
          created_at: string | null
          id: string
          last_accessed_at: string | null
          metadata: Json | null
          name: string | null
          owner: string | null
          owner_id: string | null
          path_tokens: string[] | null
          updated_at: string | null
          version: string | null
        }
        Insert: {
          bucket_id?: string | null
          created_at?: string | null
          id?: string
          last_accessed_at?: string | null
          metadata?: Json | null
          name?: string | null
          owner?: string | null
          owner_id?: string | null
          path_tokens?: string[] | null
          updated_at?: string | null
          version?: string | null
        }
        Update: {
          bucket_id?: string | null
          created_at?: string | null
          id?: string
          last_accessed_at?: string | null
          metadata?: Json | null
          name?: string | null
          owner?: string | null
          owner_id?: string | null
          path_tokens?: string[] | null
          updated_at?: string | null
          version?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "objects_bucketId_fkey"
            columns: ["bucket_id"]
            isOneToOne: false
            referencedRelation: "buckets"
            referencedColumns: ["id"]
          }
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      can_insert_object: {
        Args: {
          bucketid: string
          name: string
          owner: string
          metadata: Json
        }
        Returns: undefined
      }
      extension: {
        Args: {
          name: string
        }
        Returns: string
      }
      filename: {
        Args: {
          name: string
        }
        Returns: string
      }
      foldername: {
        Args: {
          name: string
        }
        Returns: unknown
      }
      get_size_by_bucket: {
        Args: Record<PropertyKey, never>
        Returns: {
          size: number
          bucket_id: string
        }[]
      }
      search: {
        Args: {
          prefix: string
          bucketname: string
          limits?: number
          levels?: number
          offsets?: number
          search?: string
          sortcolumn?: string
          sortorder?: string
        }
        Returns: {
          name: string
          id: string
          updated_at: string
          created_at: string
          last_accessed_at: string
          metadata: Json
        }[]
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

export type Tables<
  PublicTableNameOrOptions extends
    | keyof (Database["public"]["Tables"] & Database["public"]["Views"])
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
        Database[PublicTableNameOrOptions["schema"]]["Views"])
    : never = never
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
      Database[PublicTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : PublicTableNameOrOptions extends keyof (Database["public"]["Tables"] &
      Database["public"]["Views"])
  ? (Database["public"]["Tables"] &
      Database["public"]["Views"])[PublicTableNameOrOptions] extends {
      Row: infer R
    }
    ? R
    : never
  : never

export type TablesInsert<
  PublicTableNameOrOptions extends
    | keyof Database["public"]["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : PublicTableNameOrOptions extends keyof Database["public"]["Tables"]
  ? Database["public"]["Tables"][PublicTableNameOrOptions] extends {
      Insert: infer I
    }
    ? I
    : never
  : never

export type TablesUpdate<
  PublicTableNameOrOptions extends
    | keyof Database["public"]["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : PublicTableNameOrOptions extends keyof Database["public"]["Tables"]
  ? Database["public"]["Tables"][PublicTableNameOrOptions] extends {
      Update: infer U
    }
    ? U
    : never
  : never

export type Enums<
  PublicEnumNameOrOptions extends
    | keyof Database["public"]["Enums"]
    | { schema: keyof Database },
  EnumName extends PublicEnumNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicEnumNameOrOptions["schema"]]["Enums"]
    : never = never
> = PublicEnumNameOrOptions extends { schema: keyof Database }
  ? Database[PublicEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : PublicEnumNameOrOptions extends keyof Database["public"]["Enums"]
  ? Database["public"]["Enums"][PublicEnumNameOrOptions]
  : never

