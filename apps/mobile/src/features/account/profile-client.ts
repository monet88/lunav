/**
 * Minimal owner-scoped profiles read/write seam. PromiseLike matches Supabase's
 * thenable Postgrest builders without coupling to generated table types.
 */
export interface ProfileClient {
  from: (table: 'profiles') => {
    select: (columns?: string) => {
      eq: (
        column: 'id',
        value: string
      ) => {
        single: () => PromiseLike<{ data: unknown; error: unknown | null }>
      }
    }
    update: (values: { display_name: string | null }) => {
      eq: (
        column: 'id',
        value: string
      ) => {
        select: () => {
          single: () => PromiseLike<{ data: unknown; error: unknown | null }>
        }
      }
    }
  }
}

/**
 * Narrow a shared Supabase client to the owner-scoped profiles surface used by
 * account load/update. Single cast site keeps route wiring free of double-casts.
 */
export function asProfileClient(client: {
  from: (table: string) => unknown
}): ProfileClient {
  return client as ProfileClient
}
