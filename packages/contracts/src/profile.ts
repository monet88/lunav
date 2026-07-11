import { z } from 'zod'

const DISPLAY_NAME_MAX_LENGTH = 100
const DISPLAY_NAME_BOUNDARY_WHITESPACE = new Set([
  ...'\t\n\v\f\r ',
  ...[133, 160, 5760, 8192, 8193, 8194, 8195, 8196, 8197, 8198, 8199, 8200, 8201,
    8202, 8232, 8233, 8239, 8287, 12288, 65279].map((codePoint) =>
    String.fromCodePoint(codePoint)
  ),
])

function trimDisplayName(value: string): string {
  let start = 0
  let end = value.length

  while (start < end && DISPLAY_NAME_BOUNDARY_WHITESPACE.has(value[start]!)) {
    start += 1
  }

  while (end > start && DISPLAY_NAME_BOUNDARY_WHITESPACE.has(value[end - 1]!)) {
    end -= 1
  }

  return value.slice(start, end)
}

function hasValidDisplayNameLength(value: string): boolean {
  return Array.from(value).length <= DISPLAY_NAME_MAX_LENGTH
}

function hasNoNullCharacter(value: string): boolean {
  return !value.includes('\u0000')
}

const profileDisplayNameSchema = z
  .string()
  .min(1)
  .refine(hasNoNullCharacter)
  .refine(hasValidDisplayNameLength)
  .refine((value) => value === trimDisplayName(value))
  .nullable()

const profileUpdateDisplayNameSchema = z
  .string()
  .transform(trimDisplayName)
  .pipe(
    z.string().refine(hasNoNullCharacter).refine(hasValidDisplayNameLength)
  )
  .transform((value) => (value.length === 0 ? null : value))
  .nullable()

const profileRowSchema = z.object({
  id: z.uuid(),
  display_name: profileDisplayNameSchema,
  created_at: z.iso.datetime({ offset: true }),
  updated_at: z.iso.datetime({ offset: true }),
})

const profileUpdateSchema = z
  .object({
    displayName: profileUpdateDisplayNameSchema,
  })
  .strict()

export type Profile = {
  userId: string
  displayName: string | null
  createdAt: string
  updatedAt: string
}

export type ProfileUpdate = {
  displayName: string | null
}

export function parseProfile(input: unknown): Profile {
  const profile = profileRowSchema.parse(input)

  return {
    userId: profile.id,
    displayName: profile.display_name,
    createdAt: profile.created_at,
    updatedAt: profile.updated_at,
  }
}

export function parseProfileUpdate(input: unknown): ProfileUpdate {
  return profileUpdateSchema.parse(input)
}