export function getDefaultAvatar(identifier: string): string {
  const colors = [
    { start: '#3B82F6', end: '#2563EB', star: '#FFFFFF', check: '#2563EB' }, // Blue
    { start: '#10B981', end: '#059669', star: '#FFFFFF', check: '#059669' }, // Emerald
    { start: '#F43F5E', end: '#E11D48', star: '#FFFFFF', check: '#E11D48' }, // Rose
    { start: '#F59E0B', end: '#D97706', star: '#FFFFFF', check: '#D97706' }, // Amber
    { start: '#8B5CF6', end: '#7C3AED', star: '#FFFFFF', check: '#7C3AED' }, // Violet
    { start: '#06B6D4', end: '#0284C7', star: '#FFFFFF', check: '#0284C7' }, // Cyan
    { start: '#EC4899', end: '#DB2777', star: '#FFFFFF', check: '#DB2777' }, // Pink
    { start: '#14B8A6', end: '#0D9488', star: '#FFFFFF', check: '#0D9488' }, // Teal
    { start: '#F97316', end: '#EA580C', star: '#FFFFFF', check: '#EA580C' }, // Orange
    { start: '#6366F1', end: '#4F46E5', star: '#FFFFFF', check: '#4F46E5' }, // Indigo
  ];

  const safeIdentifier = identifier || 'User';
  let hash = 0;
  for (let i = 0; i < safeIdentifier.length; i++) {
    hash = safeIdentifier.charCodeAt(i) + ((hash << 5) - hash);
  }
  const colorIndex = Math.abs(hash) % colors.length;
  const c = colors[colorIndex];

  // Star polygon and check polyline from lucide
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
    <defs>
      <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="${c.start}" />
        <stop offset="100%" stop-color="${c.end}" />
      </linearGradient>
    </defs>
    <rect width="100" height="100" fill="url(#grad)" />
    <g transform="translate(25, 25) scale(2.08)">
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" fill="${c.star}" stroke="${c.star}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
      <path d="M8 12.5L11 15.5L16 9" stroke="${c.check}" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
    </g>
  </svg>`;
  
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg.trim())}`;
}
