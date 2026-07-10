import { z } from 'zod'

const publicSupabaseConfigSchema = z
  .object({
    url: z.string().url(),
    publishableKey: z.string().min(1),
  })
  .strict()

export type PublicSupabaseConfig = z.infer<typeof publicSupabaseConfigSchema>

export function parsePublicSupabaseConfig(
  input: unknown
): PublicSupabaseConfig {
  if (typeof input === 'object' && input !== null && 'serviceRoleKey' in input) {
    throw new Error('serviceRoleKey is server-only')
  }

  return publicSupabaseConfigSchema.parse(input)
}