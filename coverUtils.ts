export const DEFAULT_COVERS = [
  { id: 'cover-1', name: 'Minimal Mavi', bg: '#0F172A', gradient: 'linear-gradient(135deg, #1E3A8A 0%, #0F172A 100%)', text: '#3B82F6' },
  { id: 'cover-2', name: 'Canlı Turuncu', bg: '#431407', gradient: 'linear-gradient(135deg, #9A3412 0%, #431407 100%)', text: '#F97316' },
  { id: 'cover-3', name: 'Zümrüt Yeşili', bg: '#064E3B', gradient: 'linear-gradient(135deg, #059669 0%, #064E3B 100%)', text: '#10B981' },
  { id: 'cover-4', name: 'Koyu Mor', bg: '#2E1065', gradient: 'linear-gradient(135deg, #6D28D9 0%, #2E1065 100%)', text: '#8B5CF6' },
  { id: 'cover-5', name: 'Gece Mavisi', bg: '#082F49', gradient: 'linear-gradient(135deg, #0284C7 0%, #082F49 100%)', text: '#38BDF8' },
  { id: 'cover-6', name: 'Şarap Kırmızısı', bg: '#4C0519', gradient: 'linear-gradient(135deg, #E11D48 0%, #4C0519 100%)', text: '#FB7185' },
  { id: 'cover-7', name: 'Metalik Gri', bg: '#1E293B', gradient: 'linear-gradient(135deg, #475569 0%, #1E293B 100%)', text: '#94A3B8' },
  { id: 'cover-8', name: 'Koyu Altın', bg: '#451A03', gradient: 'linear-gradient(135deg, #D97706 0%, #451A03 100%)', text: '#FBBF24' },
  { id: 'cover-9', name: 'Modern Siyah', bg: '#000000', gradient: 'linear-gradient(135deg, #27272A 0%, #000000 100%)', text: '#A1A1AA' },
  { id: 'cover-10', name: 'Enerjik Pembe', bg: '#500724', gradient: 'linear-gradient(135deg, #BE185D 0%, #500724 100%)', text: '#F472B6' },
  { id: 'cover-11', name: 'Orman Yeşili', bg: '#14532D', gradient: 'linear-gradient(135deg, #15803D 0%, #14532D 100%)', text: '#4ADE80' },
  { id: 'cover-12', name: 'Lacivert', bg: '#172554', gradient: 'linear-gradient(135deg, #1D4ED8 0%, #172554 100%)', text: '#60A5FA' },
];

export function getCoverImage(coverId: string): string {
  const cover = DEFAULT_COVERS.find(c => c.id === coverId) || DEFAULT_COVERS[0];
  
  // Extract hex colors from linear-gradient strings for simple SVG gradients
  const colorMatch = cover.gradient.match(/#([0-9A-Fa-f]{6})\b/g);
  const color1 = colorMatch && colorMatch.length > 0 ? colorMatch[0] : '#333333';
  const color2 = colorMatch && colorMatch.length > 1 ? colorMatch[1] : '#111111';

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 675" width="1200" height="675">
    <defs>
      <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="${color1}" />
        <stop offset="100%" stop-color="${color2}" />
      </linearGradient>
      <pattern id="pattern" width="60" height="60" patternUnits="userSpaceOnUse">
        <circle cx="30" cy="30" r="1.5" fill="#ffffff" fill-opacity="0.07" />
      </pattern>
    </defs>
    <rect width="100%" height="100%" fill="url(#grad)" />
    <rect width="100%" height="100%" fill="url(#pattern)" />
    
    <g transform="translate(600, 337.5)">
      <!-- Sporpuan Logo Icon -->
      <g transform="translate(-140, -40) scale(4)">
        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" fill="${cover.text}" opacity="0.9" />
        <path d="M8 12.5L11 15.5L16 9" stroke="#ffffff" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
      </g>
      <!-- Text -->
      <text x="0" y="30" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-weight="900" font-size="80" fill="#ffffff" letter-spacing="-2" text-anchor="middle" opacity="0.95">SPORPUAN</text>
      <text x="0" y="80" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-weight="600" font-size="24" fill="${cover.text}" letter-spacing="4" text-anchor="middle" opacity="0.8">ONAYLI TESİS PROFİLİ</text>
    </g>
  </svg>`;

  return `data:image/svg+xml;utf8,${encodeURIComponent(svg.trim())}`;
}
