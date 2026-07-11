import { describe, expect, test } from 'vitest'
import { parseProfile, parseProfileUpdate } from './profile.js'

const profileRow = {
  id: '8a7c3f86-84dd-4cbc-9fa4-1edca1e84dd8',
  display_name: 'Nguyen An',
  created_at: '2026-07-11T10:30:00.000Z',
  updated_at: '2026-07-11T10:30:00.000Z',
}

describe('parseProfile', () => {
  test('returns the application profile shape from a database row', () => {
    expect(parseProfile(profileRow)).toEqual({
      userId: profileRow.id,
      displayName: 'Nguyen An',
      createdAt: profileRow.created_at,
      updatedAt: profileRow.updated_at,
    })
  })

  test('accepts PostgreSQL timestamps with offsets and microseconds', () => {
    const timestamp = '2026-07-11T12:19:29.964376+00:00'

    expect(
      parseProfile({
        ...profileRow,
        created_at: timestamp,
        updated_at: timestamp,
      })
    ).toMatchObject({ createdAt: timestamp, updatedAt: timestamp })
  })

  test('accepts a profile without a display name', () => {
    expect(parseProfile({ ...profileRow, display_name: null }).displayName).toBeNull()
  })

  test.each([
    ' Nguyen An',
    'Nguyen An ',
    '\t',
    '\u0085Nguyen An',
    'Nguyen An\uFEFF',
  ]) (
    'rejects a non-canonical persisted display name %j',
    (displayName) => {
      expect(() =>
        parseProfile({ ...profileRow, display_name: displayName })
      ).toThrow()
    }
  )

  test('rejects a malformed owner identifier', () => {
    expect(() => parseProfile({ ...profileRow, id: 'not-a-uuid' })).toThrow()
  })

  test('rejects malformed server timestamps', () => {
    expect(() =>
      parseProfile({ ...profileRow, updated_at: 'not-a-datetime' })
    ).toThrow()
  })
})

describe('parseProfileUpdate', () => {
  test('trims the only editable profile field', () => {
    expect(parseProfileUpdate({ displayName: '  Nguyen An  ' })).toEqual({
      displayName: 'Nguyen An',
    })
  })

  test('normalizes an empty display name to null', () => {
    expect(parseProfileUpdate({ displayName: '   ' })).toEqual({
      displayName: null,
    })
  })

  test.each(['\u0085Nguyen An\u0085', '\uFEFFNguyen An\uFEFF'])(
    'normalizes explicit Unicode boundary whitespace %j',
    (displayName) => {
      expect(parseProfileUpdate({ displayName })).toEqual({
        displayName: 'Nguyen An',
      })
    }
  )

  test('rejects display names longer than 100 characters', () => {
    expect(() => parseProfileUpdate({ displayName: 'a'.repeat(101) })).toThrow()
  })

  test('counts display name length by Unicode code points', () => {
    expect(parseProfileUpdate({ displayName: '😀'.repeat(100) })).toEqual({
      displayName: '😀'.repeat(100),
    })
    expect(() => parseProfileUpdate({ displayName: '😀'.repeat(101) })).toThrow()
    expect(parseProfile({ ...profileRow, display_name: '😀'.repeat(100) })).toMatchObject(
      { displayName: '😀'.repeat(100) }
    )
    expect(() =>
      parseProfile({ ...profileRow, display_name: '😀'.repeat(101) })
    ).toThrow()
  })

  test.each([
    ['userId', { displayName: 'Nguyen An', userId: profileRow.id }],
    ['database id', { displayName: 'Nguyen An', id: profileRow.id }],
    ['created timestamp', { displayName: 'Nguyen An', createdAt: profileRow.created_at }],
    ['updated timestamp', { displayName: 'Nguyen An', updatedAt: profileRow.updated_at }],
  ])('rejects client-supplied %s', (_label, input) => {
    expect(() => parseProfileUpdate(input)).toThrow()
  })
})