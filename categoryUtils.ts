import { SportsCategory } from '../types';

/**
 * Automatically detects the appropriate SportsCategory based on title, description, and address keywords.
 */
export function detectCategory(
  title: string = '',
  description: string = '',
  address: string = '',
  currentCategory?: string
): SportsCategory {
  // If explicitly categorized as something specific other than generic default 'Spor Tesisleri', respect it if valid
  if (
    currentCategory &&
    currentCategory !== 'Tümü' &&
    currentCategory !== 'Spor Tesisleri' &&
    ['Spor Salonları', 'Spor Okulları', 'Spor Etkinlikleri'].includes(currentCategory)
  ) {
    return currentCategory as SportsCategory;
  }

  const text = `${title} ${description} ${address}`.toLowerCase();

  // 1. Spor Okulları (Academies, Youth Schools, Development Groups, Training Schools)
  if (
    text.includes('okul') ||
    text.includes('okulları') ||
    text.includes('akademi') ||
    text.includes('academy') ||
    text.includes('altyapı') ||
    text.includes('altyapısı') ||
    text.includes('gelişim grubu') ||
    text.includes('yaz okulu') ||
    text.includes('kış okulu') ||
    text.includes('çocuk kulübü')
  ) {
    return 'Spor Okulları';
  }

  // 2. Spor Salonları (Fitness Clubs, Gyms, Pilates, Studios, CrossFit, Fight Clubs, Bodybuilding)
  if (
    text.includes('macfit') ||
    text.includes('gym') ||
    text.includes('fitness') ||
    text.includes('fit ') ||
    text.includes(' fit') ||
    text.includes('salon') ||
    text.includes('salonu') ||
    text.includes('stüdyo') ||
    text.includes('studio') ||
    text.includes('crossfit') ||
    text.includes('pilates') ||
    text.includes('yoga') ||
    text.includes('vücut geliştirme') ||
    text.includes('boks') ||
    text.includes('fight') ||
    text.includes('spor salonu') ||
    text.includes('spa & fitness') ||
    text.includes('health club') ||
    text.includes('wellness')
  ) {
    return 'Spor Salonları';
  }

  // 3. Spor Etkinlikleri (Marathons, Races, Derbies, Matches, Tournaments, Cups, Championships, Runs)
  if (
    text.includes('maraton') ||
    text.includes('maratonu') ||
    text.includes('yarış') ||
    text.includes('yarışı') ||
    text.includes('etkinlik') ||
    text.includes('etkinliği') ||
    text.includes('turnuva') ||
    text.includes('turnuvası') ||
    text.includes('şampiyona') ||
    text.includes('şampiyonası') ||
    text.includes('kupa') ||
    text.includes('kupası') ||
    text.includes('derbi') ||
    text.includes('derbisi') ||
    text.includes('maçı') ||
    text.includes('maç ') ||
    text.includes('koşu') ||
    text.includes('gran fondo') ||
    text.includes('trail') ||
    text.includes('run')
  ) {
    return 'Spor Etkinlikleri';
  }

  // 4. Spor Tesisleri (Complexes, Stadiums, Fields, Courts, Pools, Arenas, Facilities)
  return 'Spor Tesisleri';
}

/**
 * Returns clean slug or ID for URL formatting
 */
export function getSlugOrId(event: { id: string; slug?: string; title?: string }): string {
  if (event.slug && event.slug.trim()) return event.slug.trim();
  if (event.title && event.title.trim()) {
    const generated = event.title
      .toLowerCase()
      .replace(/[^a-z0-9ğüşıöç]+/g, '-')
      .replace(/^-+|-+$/g, '');
    if (generated) return generated;
  }
  return event.id;
}

/**
 * Generates canonical, category-aware clean detail URLs
 * Spor Salonları -> /salon/macfit-kanyon
 * Spor Okulları -> /okul/fb-futbol-okulu
 * Spor Etkinlikleri -> /etkinlik/gs-fb-derbi-2026
 * Spor Tesisleri -> /tesis/sinan-erdem-salon
 */
export function getEventDetailUrl(event: { id: string; category?: string; slug?: string; title?: string }): string {
  const identifier = getSlugOrId(event);
  const cat = event.category || '';

  let categoryPrefix = 'tesis';
  if (cat === 'Spor Salonları') {
    categoryPrefix = 'salon';
  } else if (cat === 'Spor Okulları') {
    categoryPrefix = 'okul';
  } else if (cat === 'Spor Etkinlikleri') {
    categoryPrefix = 'etkinlik';
  } else {
    categoryPrefix = 'tesis';
  }

  return `/${categoryPrefix}/${encodeURIComponent(identifier)}`;
}

