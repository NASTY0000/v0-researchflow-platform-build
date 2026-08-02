const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

/**
 * Get a display-ready university name from a profile object.
 * Prefers the joined `university.name`, falls back to `university_id` if it's
 * not a UUID (i.e. the name was stored directly), returns '' otherwise.
 */
export function getUniversityName(
  profile: {
    university_id?: string | null
    university?: { name?: string | null } | null
  }
): string {
  if (profile.university?.name) return profile.university.name
  const uid = profile.university_id
  if (!uid) return ''
  if (UUID_RE.test(uid)) return ''
  return uid
}

/**
 * Legacy helper, pass the joined name explicitly when available.
 * Returns a fallback string ('-') instead of empty string.
 */
export function resolveUniversityName(
  universityId: string | null | undefined,
  universityName?: string | null
): string {
  if (universityName) return universityName
  if (!universityId) return '-'
  if (UUID_RE.test(universityId)) return 'Unknown University'
  return universityId
}
