import React from 'react';
import { Link } from 'react-router-dom';
import { getEventDetailUrl } from '../lib/categoryUtils';
import { SportsEvent } from '../types';
import { getScoreBadgeColor, getScoreLabel, CATEGORY_CRITERIA_MAP, getCriterionScore } from '../lib/scoreUtils';
import { 
  MapPin, 
  Calendar, 
  MessageSquare, 
  BadgeCheck, 
  Ticket, 
  Star, 
  ChevronRight,
  Sparkles,
  Trophy,
  Heart
} from 'lucide-react';

interface EventCardProps {
  isFavorite?: boolean;
  onToggleFavorite?: (event: SportsEvent, e: React.MouseEvent) => void;
  event: SportsEvent;
  onSelectEvent: (event: SportsEvent) => void;
  onRateClick: (event: SportsEvent, e: React.MouseEvent) => void;
}

export const EventCard: React.FC<EventCardProps> = ({
  isFavorite = false,
  onToggleFavorite,
  event,
  onSelectEvent,
  onRateClick,
}) => {
  const scoreBadge = getScoreBadgeColor(event.overallScore);

  return (
    <Link
      to={getEventDetailUrl(event)}
      className="group bg-white dark:bg-slate-900 hover:bg-slate-50/80 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 hover:border-blue-400 dark:hover:border-blue-500 rounded-2xl overflow-hidden shadow-xs hover:shadow-md transition-all duration-300 flex flex-col cursor-pointer transform hover:-translate-y-1"
    >
      {/* Top Image Banner */}
      <div className="relative h-48 w-full overflow-hidden bg-slate-100 dark:bg-slate-800">
        <img referrerPolicy="no-referrer"
          src={event.image || ''}
          alt={event.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          loading="lazy"
        />
        <div className="absolute inset-0 bg-slate-950/20 group-hover:bg-slate-950/10 transition-colors" />

        {/* Category Badge Top Left */}
        <div className="absolute top-3 left-3 flex items-center gap-1.5 bg-white/95 dark:bg-slate-900/90 text-blue-800 dark:text-blue-300 border border-blue-200 dark:border-blue-800 px-2.5 py-1 rounded-lg text-xs font-bold shadow-xs">
          <Trophy className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
          <span>{event.category}</span>
        </div>

        
        {/* Sporpuan Rating Badge Top Right */}
        <div className="absolute top-3 right-3 flex items-center gap-1.5">
          <div className="px-3 py-1.5 rounded-xl text-sm font-black tracking-tight shadow-md flex items-center gap-1 bg-blue-600 dark:bg-blue-500 text-white border border-blue-500 dark:border-blue-400">
            <Star className="w-4 h-4 fill-amber-300 text-amber-300" />
            <span>{event.overallScore.toFixed(1)}</span>
            <span className="text-[10px] font-normal opacity-90">/10</span>
          </div>
        </div>
      </div>

      {/* Card Content Body */}
      <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
        
        <div>
          {/* Organizer Info & Source Provider */}
          <div className="flex items-center justify-between gap-1.5 text-xs text-slate-500 dark:text-slate-400 mb-1.5">
            <div className="flex items-center gap-1.5 truncate">
              <span className="font-semibold text-slate-800 dark:text-slate-200 truncate max-w-[200px]">
                {event.organizer?.toLowerCase().includes('google maps') ? 'Doğrulanmış Spor Tesisi' : event.organizer}
              </span>
              {event.organizerVerified && (
                <BadgeCheck className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0" title="Onaylı Tesis" />
              )}
            </div>
          </div>

          {/* Title */}
          <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors line-clamp-2 leading-snug">
            {event.title}
          </h3>

          {/* Date & Venue */}
          <div className="mt-2.5 space-y-1 text-xs text-slate-600 dark:text-slate-300">
            <div className="flex items-center gap-2">
              <Calendar className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400 shrink-0" />
              <span className="font-medium">{event.date} {event.time && `• ${event.time}`}</span>
            </div>
            <div className="flex items-center gap-2">
              <MapPin className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400 shrink-0" />
              <span className="truncate font-medium">{event.venue}</span>
            </div>
          </div>
        </div>

        {/* Tags */}
        <div className="flex flex-wrap gap-1.5">
          {event.tags
            .filter(tag => !tag.toLowerCase().includes('google maps') && !tag.toLowerCase().includes('firebase') && !tag.toLowerCase().includes('firestore'))
            .slice(0, 2)
            .map((tag) => (
            <span
              key={tag}
              className="text-[10px] font-medium bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 px-2 py-0.5 rounded-md border border-slate-200 dark:border-slate-700"
            >
              #{tag}
            </span>
          ))}
        </div>

        {/* Footer Actions */}
        <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2">
          
          <div className="flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400">
            <div className="flex items-center gap-1 font-semibold text-slate-700 dark:text-slate-300">
              <MessageSquare className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
              <span>{event.reviewCount} Yorum</span>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onRateClick(event, e);
              }}
              className="px-2.5 py-1.5 text-xs font-bold bg-blue-600 dark:bg-blue-500 text-white hover:bg-blue-700 dark:hover:bg-blue-600 rounded-lg transition-colors shadow-2xs"
            >
              Puanla
            </button>
            <div className="p-1.5 text-slate-400 dark:text-slate-500 group-hover:text-blue-500 dark:group-hover:text-blue-400 group-hover:translate-x-1 transition-all">
              <ChevronRight className="w-4 h-4" />
            </div>
          </div>

        </div>

      </div>
    </Link>
  );
};
