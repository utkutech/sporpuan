import React, { useState, useRef } from 'react';
import { SportsEvent, SportsCategory } from '../types';
import { X, CheckCircle2, Calendar, MapPin, Ticket, Trophy, Upload, Image as ImageIcon, Trash2, RefreshCw, Sparkles, Check, Edit3, Save, Eye, EyeOff } from 'lucide-react';
import { DEFAULT_COVERS, getCoverImage } from "../lib/coverUtils";

interface EditEventModalProps {
  event: SportsEvent;
  onClose: () => void;
  onUpdateEvent: (updatedEvent: SportsEvent) => void;
  categories: SportsCategory[];
}

export const EditEventModal: React.FC<EditEventModalProps> = ({
  event,
  onClose,
  onUpdateEvent,
  categories,
}) => {
  const [title, setTitle] = useState(event.title);
  const [category, setCategory] = useState<SportsCategory>(event.category);
  const [city, setCity] = useState(event.city);
  const [venue, setVenue] = useState(event.venue);
  const [date, setDate] = useState(event.date);
  const [time, setTime] = useState(event.time);
  const [organizer, setOrganizer] = useState(event.organizer);
  const [description, setDescription] = useState(event.summary || '');
  const [ticketUrl, setTicketUrl] = useState(event.ticketUrl || '');
  const [image, setImage] = useState(event.image);
  const [isActive, setIsActive] = useState<boolean>(event.isActive !== false);
  const [isCustomUploaded, setIsCustomUploaded] = useState(false);
  const [showCoverSelector, setShowCoverSelector] = useState(false);
  const [isProcessingImage, setIsProcessingImage] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Standardize uploaded image to fixed 16:9 ratio (1200x675 pixels) via HTML Canvas
  const processAndStandardizeImage = (file: File) => {
    if (!file.type.startsWith('image/')) {
      alert('Lütfen geçerli bir görsel dosyası (PNG, JPG, WEBP) seçiniz.');
      return;
    }

    setIsProcessingImage(true);

    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const TARGET_WIDTH = 1200;
        const TARGET_HEIGHT = 675;

        const canvas = document.createElement('canvas');
        canvas.width = TARGET_WIDTH;
        canvas.height = TARGET_HEIGHT;
        const ctx = canvas.getContext('2d');

        if (ctx) {
          const scale = Math.max(TARGET_WIDTH / img.width, TARGET_HEIGHT / img.height);
          const x = (TARGET_WIDTH - img.width * scale) / 2;
          const y = (TARGET_HEIGHT - img.height * scale) / 2;

          ctx.fillStyle = '#0f172a';
          ctx.fillRect(0, 0, TARGET_WIDTH, TARGET_HEIGHT);
          ctx.drawImage(img, x, y, img.width * scale, img.height * scale);

          const standardizedDataUrl = canvas.toDataURL('image/jpeg', 0.88);
          setImage(standardizedDataUrl);
          setIsCustomUploaded(true);
        } else {
          setImage(e.target?.result as string);
          setIsCustomUploaded(true);
        }
        setIsProcessingImage(false);
      };
      img.onerror = () => {
        alert('Görsel yüklenirken bir hata oluştu.');
        setIsProcessingImage(false);
      };
      img.src = e.target?.result as string;
    };
    reader.onerror = () => {
      alert('Dosya okunamadı.');
      setIsProcessingImage(false);
    };
    reader.readAsDataURL(file);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processAndStandardizeImage(e.target.files[0]);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processAndStandardizeImage(e.dataTransfer.files[0]);
    }
  };

  const handleResetImage = () => {
    setImage(event.image);
    setIsCustomUploaded(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const updatedEvent: SportsEvent = {
      ...event,
      title: (title || '').trim(),
      category,
      city: (city || '').trim(),
      venue: (venue || '').trim(),
      date: (date || '').trim(),
      time: (time || '').trim(),
      organizer: (organizer || '').trim() || event.organizer,
      summary: (description || '').trim() || event.summary,
      ticketUrl: (ticketUrl || '').trim() || event.ticketUrl,
      image,
      isActive,
    };

    onUpdateEvent(updatedEvent);
    setSubmitted(true);

    setTimeout(() => {
      onClose();
    }, 1200);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in">
      <div className="bg-white border border-slate-200 rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold shadow-xs">
              <Edit3 className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-extrabold text-slate-900">Etkinliği Düzenle</h3>
              <p className="text-xs text-slate-500 font-medium">
                "{event.title}" detaylarını güncelleyin
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-200 rounded-xl transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {submitted ? (
            <div className="py-12 text-center space-y-3">
              <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-inner">
                <CheckCircle2 className="w-10 h-10" />
              </div>
              <h4 className="text-xl font-bold text-slate-900">Etkinlik Başarıyla Güncellendi!</h4>
              <p className="text-sm text-slate-500 max-w-sm mx-auto">
                Değişiklikler sporpuan veritabanına ve harita konumlarına başarıyla işlendi.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              {/* Event Title */}
              <div className="space-y-1">
                <label className="font-bold text-slate-700 block">Etkinlik Başlığı *</label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="örn: Fenerbahçe - Galatasaray Derbisi"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-600 font-medium"
                />
              </div>

              {/* Category & City */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-slate-700 block">Kategori *</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as SportsCategory)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-slate-900 focus:outline-none focus:border-blue-600 font-medium"
                  >
                    {categories.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-700 block">Şehir *</label>
                  <input
                    type="text"
                    required
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    placeholder="örn: İstanbul, İzmir, Ankara"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-600 font-medium"
                  />
                </div>
              </div>

              {/* Venue & Organizer */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-slate-700 block">Saha / Tesis / Stadyum *</label>
                  <input
                    type="text"
                    required
                    value={venue}
                    onChange={(e) => setVenue(e.target.value)}
                    placeholder="örn: Ülker Stadyumu / Sinan Erdem Spor Salonu"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-600 font-medium"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-700 block">Organizatör / Kulüp</label>
                  <input
                    type="text"
                    value={organizer}
                    onChange={(e) => setOrganizer(e.target.value)}
                    placeholder="örn: Türkiye Basketbol Federasyonu"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-600 font-medium"
                  />
                </div>
              </div>

              {/* Date & Time */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-slate-700 block">Tarih *</label>
                  <input
                    type="text"
                    required
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    placeholder="örn: 15 Ekim 2026"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-600 font-medium"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-700 block">Saat</label>
                  <input
                    type="text"
                    value={time}
                    onChange={(e) => setTime(e.target.value)}
                    placeholder="örn: 19:00"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-600 font-medium"
                  />
                </div>
              </div>

              {/* Event Image Upload Section */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="font-bold text-slate-700 block">Etkinlik Görseli</label>
                  <span className="text-[10px] font-semibold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                    Standart 16:9 (1200x675 px)
                  </span>
                </div>

                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="hidden"
                />

                <div className="flex flex-col gap-2">
                <div
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className={`relative border-2 border-dashed rounded-2xl p-4 transition cursor-pointer text-center overflow-hidden flex flex-col items-center justify-center min-h-[160px] ${
                    isDragging
                      ? 'border-blue-600 bg-blue-50/80'
                      : 'border-slate-300 hover:border-blue-500 bg-slate-50 hover:bg-slate-100/80'
                  }`}
                >
                  {isProcessingImage ? (
                    <div className="py-6 flex flex-col items-center gap-2 text-blue-600">
                      <RefreshCw className="w-6 h-6 animate-spin" />
                      <span className="font-bold text-xs">Görsel İşleniyor & 16:9 Boyutlandırılıyor...</span>
                    </div>
                  ) : (
                    <div className="w-full space-y-3">
                      <div className="relative w-full aspect-[16/9] rounded-xl overflow-hidden border border-slate-200 bg-slate-900 group shadow-2xs">
                        <img referrerPolicy="no-referrer"
                          src={image || undefined}
                          alt="Etkinlik Görseli Önizleme"
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                        <div className="absolute inset-0 bg-slate-900/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                          <span className="bg-white/90 text-slate-900 font-bold px-3 py-1.5 rounded-lg text-xs flex items-center gap-1.5 shadow-md">
                            <Upload className="w-3.5 h-3.5 text-blue-600" />
                            Görseli Değiştir
                          </span>
                        </div>

                        <div className="absolute bottom-2 right-2 bg-slate-950/80 backdrop-blur-xs text-white text-[10px] font-mono px-2 py-0.5 rounded border border-slate-700 flex items-center gap-1">
                          <Sparkles className="w-3 h-3 text-blue-400" />
                          <span>16:9 Standart</span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between px-1 text-[11px]">
                        <span className="text-slate-500 font-medium flex items-center gap-1">
                          <ImageIcon className="w-3.5 h-3.5 text-blue-600" />
                          Yeni görsel sürükleyin veya tıkla değiştirın
                        </span>

                        {isCustomUploaded && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleResetImage();
                            }}
                            className="text-rose-600 hover:text-rose-700 font-bold flex items-center gap-1 bg-rose-50 hover:bg-rose-100 px-2 py-1 rounded-md transition"
                          >
                            <Trash2 className="w-3 h-3" />
                            Eskiye Dön
                          </button>
                        )}
                      </div>
                    </div>
                  )}
                </div>
                
                {/* Standard Covers Toggle */}
                <div className="flex justify-end mt-1">
                  <button
                    type="button"
                    onClick={() => setShowCoverSelector(!showCoverSelector)}
                    className="text-[11px] font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    {showCoverSelector ? 'Standart Kapakları Gizle' : 'Standart Kapak Seç'}
                  </button>
                </div>
                
                {/* Standard Covers List */}
                {showCoverSelector && (
                  <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 mt-2">
                    {DEFAULT_COVERS.map(cover => (
                      <button
                        key={cover.id}
                        type="button"
                        onClick={() => {
                          setImage(getCoverImage(cover.id));
                          setIsCustomUploaded(true);
                          setShowCoverSelector(false);
                        }}
                        className="relative group aspect-[16/9] rounded-lg overflow-hidden border-2 border-transparent hover:border-blue-500 focus:border-blue-500 transition-all focus:outline-none"
                      >
                        <div className="absolute inset-0 w-full h-full" style={{ background: cover.gradient }}></div>
                        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 bg-black/40 transition-opacity">
                          <span className="text-[9px] font-bold text-white px-2 py-1 bg-black/50 rounded-full">{cover.name}</span>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
              </div>

              {/* Description */}
              <div className="space-y-1">
                <label className="font-bold text-slate-700 block">Etkinlik Açıklaması / Özeti</label>
                <textarea
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Etkinlik hakkında önemli detaylar..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-600 font-medium"
                />
              </div>

              {/* Yayın Durumu (Yayından Kaldır / Gizle / Yayına Al) */}
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl flex flex-wrap items-center justify-between gap-3 shadow-2xs">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-extrabold text-slate-800 text-xs">Yayın Durumu</span>
                    <span className={`px-2 py-0.5 text-[10px] font-bold rounded-full ${isActive ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
                      {isActive ? 'Yayında' : 'Yayından Kaldırıldı (Gizli)'}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 font-medium mt-0.5">
                    {isActive 
                      ? 'Tesis tüm ziyaretçilere açık ve listelerde görünür.' 
                      : 'Tesis yayından kaldırıldı (gizlendi). Sadece yöneticiler görebilir.'}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => setIsActive(!isActive)}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shrink-0 ${
                    isActive
                      ? 'bg-amber-100 text-amber-800 hover:bg-amber-200 border border-amber-300'
                      : 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200 border border-emerald-300'
                  }`}
                >
                  {isActive ? (
                    <>
                      <EyeOff className="w-4 h-4 text-amber-600" />
                      <span>Yayından Kaldır (Gizle)</span>
                    </>
                  ) : (
                    <>
                      <Eye className="w-4 h-4 text-emerald-600" />
                      <span>Yayına Al (Göster)</span>
                    </>
                  )}
                </button>
              </div>

              {/* Submit Buttons */}
              <div className="pt-2 flex items-center justify-end gap-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2.5 text-slate-600 hover:bg-slate-100 font-bold rounded-xl transition"
                >
                  İptal
                </button>
                <button
                  type="submit"
                  className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-extrabold rounded-xl transition shadow-md shadow-blue-200"
                >
                  <Save className="w-4 h-4" />
                  <span>Değişiklikleri Kaydet</span>
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
