// Hand-written to match supabase/migrations/0001_init.sql.
// Once the Supabase project is linked, replace with:
//   npx supabase gen types typescript --project-id <id> > src/lib/supabase/types.ts

export type MemberRole = "member" | "admin";
export type EventFormat = "swiss" | "round_robin";
export type EventStatus = "draft" | "active" | "completed";
export type PairingResult = "pending" | "white" | "black" | "draw";
export type RoomStatus = "waiting" | "active" | "finished";

type Table<Row, Insert, Update = Partial<Insert>> = {
  Row: Row;
  Insert: Insert;
  Update: Update;
  Relationships: [];
};

export interface Database {
  public: {
    Tables: {
      profiles: Table<
        {
          id: string;
          full_name: string;
          email: string;
          role: MemberRole;
          rating: number;
          created_at: string;
        },
        {
          id: string;
          full_name: string;
          email: string;
          role?: MemberRole;
          rating?: number;
          created_at?: string;
        }
      >;
      events: Table<
        {
          id: string;
          name: string;
          event_date: string;
          format: EventFormat;
          status: EventStatus;
          created_by: string;
          created_at: string;
        },
        {
          id?: string;
          name: string;
          event_date: string;
          format?: EventFormat;
          status?: EventStatus;
          created_by: string;
          created_at?: string;
        }
      >;
      event_registrations: Table<
        {
          event_id: string;
          profile_id: string;
          registered_at: string;
        },
        {
          event_id: string;
          profile_id: string;
          registered_at?: string;
        }
      >;
      rounds: Table<
        {
          id: string;
          event_id: string;
          round_number: number;
          created_at: string;
        },
        {
          id?: string;
          event_id: string;
          round_number: number;
          created_at?: string;
        }
      >;
      pairings: Table<
        {
          id: string;
          round_id: string;
          white_id: string | null;
          black_id: string | null;
          result: PairingResult;
          created_at: string;
        },
        {
          id?: string;
          round_id: string;
          white_id?: string | null;
          black_id?: string | null;
          result?: PairingResult;
          created_at?: string;
        }
      >;
      ladder_history: Table<
        {
          id: string;
          profile_id: string;
          event_id: string | null;
          rating_before: number;
          rating_after: number;
          created_at: string;
        },
        {
          id?: string;
          profile_id: string;
          event_id?: string | null;
          rating_before: number;
          rating_after: number;
          created_at?: string;
        }
      >;
      game_rooms: Table<
        {
          id: string;
          room_code: string;
          fen: string;
          pgn: string;
          white_id: string | null;
          black_id: string | null;
          status: RoomStatus;
          created_at: string;
        },
        {
          id?: string;
          room_code: string;
          fen?: string;
          pgn?: string;
          white_id?: string | null;
          black_id?: string | null;
          status?: RoomStatus;
          created_at?: string;
        }
      >;
      officers: Table<
        {
          id: string;
          role: string;
          name: string | null;
          photo_url: string | null;
          sort_order: number;
          created_at: string;
        },
        {
          id?: string;
          role: string;
          name?: string | null;
          photo_url?: string | null;
          sort_order?: number;
          created_at?: string;
        }
      >;
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
  };
}
