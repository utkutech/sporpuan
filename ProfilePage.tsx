import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { SportsEvent, UserProfile } from '../types';
import { SEOHead } from '../components/SEOHead';
import { Avatar } from '../components/Avatar';
import { Star, Award, MessageSquare, ArrowLeft } from 'lucide-react';

interface ProfilePageProps {
  events: SportsEvent[];
  currentUser: UserProfile | null;
}

export const ProfilePage: React.FC<ProfilePageProps> = ({ events, currentUser }) => {
  const navigate = useNavigate();

  const userReviews = useMemo(() => {
    if (!currentUser) return [];
    
    const reviews: { eventTitle: string, review: any, eventId: string }[] = [];
    events.forEach(event => {
      event.reviews.forEach(review => {
        if (review.userName === currentUser.name) {
          reviews.push({ eventTitle: event.title, review, eventId: event.id });
        }
      });
    });
    return reviews;
  }, [events, currentUser]);

  const totalPoints = userReviews.length * 20;

  React.useEffect(() => {
    if (!currentUser) {
      navigate('/');
    }
  }, [currentUser, navigate]);

  if (!currentUser) {
    return null;
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full flex-1">
      <SEOHead title="Profilim" description="Profil detaylarınız, puanlarınız ve yorumlarınız." />
      
      <div className="flex items-center gap-4 mb-8">
        <button onClick={() => navigate('/')} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition">
          <ArrowLeft className="w-6 h-6 text-slate-700 dark:text-slate-300" />
        </button>
        <h1 className="text-3xl font-black text-slate-900 dark:text-white">Profilim</h1>
      </div>

      {/* User Card */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-6 mb-8">
        <Avatar src={currentUser.avatar} name={currentUser.name} className="w-20 h-20 rounded-2xl object-cover" />
        <div className="flex-1">
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white">{currentUser.name}</h2>
          <p className="text-slate-600 dark:text-slate-400">{currentUser.email}</p>
        </div>
        <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-2xl border border-blue-100 dark:border-blue-800 text-center">
          <div className="text-blue-600 dark:text-blue-400 font-black text-3xl">{totalPoints}</div>
          <div className="text-blue-800 dark:text-blue-200 font-bold text-sm">SporPuan</div>
        </div>
      </div>

      {/* Reviews Section */}
      <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-4">Değerlendirmelerim</h3>
      <div className="space-y-4">
        {userReviews.length === 0 ? (
          <div className="text-center py-10 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-dashed border-slate-300 dark:border-slate-700">
            <MessageSquare className="w-10 h-10 text-slate-400 mx-auto mb-2" />
            <p className="text-slate-600 dark:text-slate-400">Henüz bir değerlendirme yapmadınız.</p>
          </div>
        ) : (
          userReviews.map((item, index) => (
            <div key={index} className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
              <div className="flex justify-between items-start mb-3">
                <div>
                  <h4 className="font-bold text-slate-900 dark:text-white">{item.eventTitle}</h4>
                  <p className="text-xs text-slate-500">{item.review.date}</p>
                </div>
                <div className="flex items-center bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400 px-3 py-1 rounded-full font-black text-sm">
                  <Star className="w-4 h-4 fill-current mr-1" />
                  {item.review.overallScore.toFixed(1)}
                </div>
              </div>
              <p className="text-slate-700 dark:text-slate-300 mb-4">{item.review.comment}</p>
              
              {item.review.adminReply && (
                <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-xl border border-slate-100 dark:border-slate-700 mt-2">
                  <div className="text-xs font-bold text-blue-600 dark:text-blue-400 mb-1 uppercase tracking-wide">Tesis Yanıtı</div>
                  <p className="text-sm text-slate-600 dark:text-slate-400">{item.review.adminReply}</p>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};
