export function anonymizeUserName(name: string): string {
  if (!name) return 'K*** Ö***';
  if (name.includes('*')) return name; // already anonymized
  const parts = name.trim().split(/\s+/);
  return parts
    .map((part) => {
      if (part.length <= 1) return part + '***';
      return part.charAt(0) + '*'.repeat(Math.max(part.length - 1, 3));
    })
    .join(' ');
}
