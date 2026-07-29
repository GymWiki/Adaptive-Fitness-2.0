export type Database = {
  public: {
    Views: Record<string, never>
    Functions: Record<string, never>
    Tables: {
      profiles: {
        Row: {
          id: string
          display_name: string | null
          created_at: string
        }
        Insert: {
          id: string
          display_name?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          display_name?: string | null
          created_at?: string
        }
        Relationships: []
      }
      exercises: {
        Row: {
          id: string
          user_id: string | null
          name: string
          muscle_group: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id?: string | null
          name: string
          muscle_group?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string | null
          name?: string
          muscle_group?: string | null
          created_at?: string
        }
        Relationships: []
      }
      workouts: {
        Row: {
          id: string
          user_id: string
          name: string | null
          performed_at: string
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          name?: string | null
          performed_at?: string
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          name?: string | null
          performed_at?: string
          created_at?: string
        }
        Relationships: []
      }
      workout_sets: {
        Row: {
          id: string
          workout_id: string
          exercise_id: string
          set_order: number
          weight_kg: number
          reps: number
          created_at: string
        }
        Insert: {
          id?: string
          workout_id: string
          exercise_id: string
          set_order?: number
          weight_kg: number
          reps: number
          created_at?: string
        }
        Update: {
          id?: string
          workout_id?: string
          exercise_id?: string
          set_order?: number
          weight_kg?: number
          reps?: number
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'workout_sets_exercise_id_fkey'
            columns: ['exercise_id']
            isOneToOne: false
            referencedRelation: 'exercises'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'workout_sets_workout_id_fkey'
            columns: ['workout_id']
            isOneToOne: false
            referencedRelation: 'workouts'
            referencedColumns: ['id']
          },
        ]
      }
    }
  }
}
