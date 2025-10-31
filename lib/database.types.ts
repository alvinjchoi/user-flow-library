export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      projects: {
        Row: {
          id: string;
          name: string;
          description: string | null;
          color: string;
          avatar_url: string | null;
          share_token: string | null;
          is_public: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          description?: string | null;
          color?: string;
          avatar_url?: string | null;
          share_token?: string | null;
          is_public?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          description?: string | null;
          color?: string;
          avatar_url?: string | null;
          share_token?: string | null;
          is_public?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
      flows: {
        Row: {
          id: string;
          project_id: string;
          name: string;
          description: string | null;
          order_index: number;
          screen_count: number;
          parent_screen_id: string | null;
          parent_flow_id: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          project_id: string;
          name: string;
          description?: string | null;
          order_index?: number;
          screen_count?: number;
          parent_screen_id?: string | null;
          parent_flow_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          project_id?: string;
          name?: string;
          description?: string | null;
          order_index?: number;
          screen_count?: number;
          parent_screen_id?: string | null;
          parent_flow_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      screen_comments: {
        Row: {
          id: string;
          screen_id: string;
          user_id: string;
          user_name: string | null;
          user_avatar: string | null;
          x_position: number;
          y_position: number;
          comment_text: string;
          is_resolved: boolean;
          parent_comment_id: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          screen_id: string;
          user_id: string;
          user_name?: string | null;
          user_avatar?: string | null;
          x_position: number;
          y_position: number;
          comment_text: string;
          is_resolved?: boolean;
          parent_comment_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          screen_id?: string;
          user_id?: string;
          user_name?: string | null;
          user_avatar?: string | null;
          x_position?: number;
          y_position?: number;
          comment_text?: string;
          is_resolved?: boolean;
          parent_comment_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      screens: {
        Row: {
          id: string;
          flow_id: string;
          parent_id: string | null;
          title: string;
          display_name: string | null;
          screenshot_url: string | null;
          notes: string | null;
          order_index: number;
          level: number;
          path: string | null;
          tags: string[];
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          flow_id: string;
          parent_id?: string | null;
          title: string;
          display_name?: string | null;
          screenshot_url?: string | null;
          notes?: string | null;
          order_index?: number;
          level?: number;
          path?: string | null;
          tags?: string[];
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          flow_id?: string;
          parent_id?: string | null;
          title?: string;
          display_name?: string | null;
          screenshot_url?: string | null;
          notes?: string | null;
          order_index?: number;
          level?: number;
          path?: string | null;
          tags?: string[];
          created_at?: string;
          updated_at?: string;
        };
      };
      screen_inspirations: {
        Row: {
          id: string;
          screen_id: string;
          related_screen_id: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          screen_id: string;
          related_screen_id: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          screen_id?: string;
          related_screen_id?: string;
          created_at?: string;
        };
      };
    };
  };
}

export type Project = Database["public"]["Tables"]["projects"]["Row"];
export type Flow = Database["public"]["Tables"]["flows"]["Row"];
export type Screen = Database["public"]["Tables"]["screens"]["Row"];
export type ScreenInspiration =
  Database["public"]["Tables"]["screen_inspirations"]["Row"];
