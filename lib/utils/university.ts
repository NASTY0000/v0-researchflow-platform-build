/**
 * Resolve a university_id value to a display name.
 * Some users have the full university name stored directly;
 * others have a UUID that joins to the universities table.
 * Pass the joined `university?.name` when available.
 */
export function resolveUniversityName(
  universityId: string | null | undefined,
  universityName?: string | null
): string {
  if (universityName) return universityName
  if (!universityId) return '—'
  // UUID format — couldn't resolve via join
  if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(universityId)) {
    return 'Unknown University'
  }
  return universityId
}
