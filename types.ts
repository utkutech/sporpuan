export interface FacilitySuggestion {
  id: string;
  facilityName: string;
  category: string;
  details: string;
  createdAt: string;
  status: 'pending' | 'reviewed';
}

export type UserRole = 'user' | 'organizer' | 'admin';

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatar?: string;
  organizationName?: string;
  title?: string;
  createdAt: string;
  requiresPasswordChange?: boolean;
  favorites?: string[];
}

export type SportsCategory = 
  | 'Tümü'
  | 'Spor Tesisleri'
  | 'Spor Salonları'
  | 'Spor Okulları'
  | 'Spor Etkinlikleri';

export interface RatingCriterion {
  [key: string]: number;
}

export interface Review {
  id: string;
  userName: string;
  userAvatar?: string;
  verifiedAttendee: boolean;
  date: string;
  overallScore: number;
  scores: RatingCriterion;
  comment: string;
  originalComment?: string;
  englishComment?: string;
  pros: string[];
  cons: string[];
  likes: number;
  userPhotos?: string[];
  verificationDocs?: { name: string; url: string; type: 'image' | 'document' }[];
  tags: string[];
  status?: 'published' | 'pending' | 'hidden';
  adminReply?: string;
  adminReplyDate?: string;
}

export interface CorporateApplication {
  id: string;
  refCode: string;
  facilityName: string;
  category: SportsCategory;
  city: string;
  district: string;
  address?: string;
  contactName: string;
  contactTitle?: string;
  contactEmail: string;
  contactPhone: string;
  website?: string;
  capacity?: string;
  amenities: string[];
  imageUrl?: string;
  description?: string;
  taxOffice?: string;
  taxNumber?: string;
  licenseNumber?: string;
  workingHours?: string;
  membershipFeeRange?: string;
  adminNotes?: string;
  publishedFacilityId?: string;
  createdAt: string;
  requiresPasswordChange?: boolean;
  favorites?: string[];
  status: 'pending' | 'approved' | 'rejected' | 'suspended';
}

export interface SportsEvent {
  id: string;
  title: string;
  slug: string;
  category: SportsCategory;
  city: string;
  venue: string;
  date: string;
  time?: string;
  organizer: string;
  organizerVerified: boolean;
  image: string;
  description: string;
  ticketPriceRange?: string;
  ticketUrl?: string;
  overallScore: number;
  ratingBreakdown: RatingCriterion;
  reviewCount: number;
  featured: boolean;
  tags: string[];
  reviews: Review[];
  isActive?: boolean;
  latitude?: number;
  longitude?: number;
  sourceProvider?: string;
  lastSyncedAt?: string;
  googlePlaceId?: string;
  aiSummary?: {
    tr: string;
    en: string;
    highlightsTr?: string[];
    highlightsEn?: string[];
  };
}
