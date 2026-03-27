import React, { useState, useEffect, useRef } from 'react';
import { useParams, useSearchParams, Link } from 'react-router-dom';
import { collection, getDocs, query, where, orderBy, doc, getDoc } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { Play, ChevronLeft, ChevronRight, AlertTriangle, AlertCircle, Info, ListVideo, Calendar, Star } from 'lucide-react';
import { EpisodeCardSkeleton } from '../components/Skeleton';
import { AdBanner } from '../components/AdBanner';

export function AnimeDetails() {
  const { id } = useParams<{ id: string }>();
  const [searchParams, setSearchParams] = useSearchParams();
  const [anime, setAnime] = useState<any | null>(null);
  const [episodes, setEpisodes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [iframeFailed, setIframeFailed] = useState(false);
  const [showPreAd, setShowPreAd] = useState(false);
  
  const currentEpisodeId = searchParams.get('episode');
  const activeEpisode = episodes.find(ep => ep.id === currentEpisodeId) || episodes[0];
  const activeEpisodeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    setIframeFailed(false);
    if (activeEpisode) {
      setShowPreAd(true);
      const timer = setTimeout(() => setShowPreAd(false), 5000); // 5 seconds pre-roll ad simulation
      return () => clearTimeout(timer);
    }
  }, [activeEpisode?.id]);

  useEffect(() => {
    if (activeEpisodeRef.current) {
      activeEpisodeRef.current.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }, [activeEpisode?.id]);

  const getCleanVideoUrl = (url: string) => {
    if (!url) return '';
    
    // If the admin pasted the iframe code directly into the DB somehow, extract it
    const srcMatch = url.match(/src=["'](.*?)["']/);
    let cleanUrl = srcMatch && srcMatch[1] ? srcMatch[1] : url;

    try {
      // Auto convert youtube watch to embed
      if (cleanUrl.includes('youtube.com/watch?v=')) {
        const urlObj = new URL(cleanUrl);
        const videoId = urlObj.searchParams.get('v');
        if (videoId) return `https://www.youtube.com/embed/${videoId}`;
      }
      if (cleanUrl.includes('youtu.be/')) {
        const videoId = cleanUrl.split('youtu.be/')[1].split('?')[0];
        if (videoId) return `https://www.youtube.com/embed/${videoId}`;
      }
    } catch (e) {
      // Ignore URL parsing errors and return the cleaned URL as is
    }
    
    return cleanUrl;
  };

  const isValidUrl = (url: string) => {
    if (!url) return false;
    try { new URL(getCleanVideoUrl(url)); return true; } catch { return false; }
  };

  useEffect(() => {
    const fetchAnimeAndEpisodes = async () => {
      if (!id) return;
      try {
        const animeSnap = await getDoc(doc(db, 'animes', id));
        if (animeSnap.exists()) setAnime({ id: animeSnap.id, ...animeSnap.data() });

        const q = query(collection(db, 'episodes'), where('animeId', '==', id), orderBy('episodeNumber', 'asc'));
        const episodesSnap = await getDocs(q);
        const eps = episodesSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setEpisodes(eps);
        
        // Auto select first episode if none selected
        if (!currentEpisodeId && eps.length > 0) {
          setSearchParams({ episode: eps[0].id });
        }
      } catch (error) {
        handleFirestoreError(error, OperationType.GET, `animes/${id}`);
      } finally {
        setLoading(false);
      }
    };
    fetchAnimeAndEpisodes();
  }, [id, currentEpisodeId, setSearchParams]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0f0f0f] text-white pt-20 pb-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="h-[60vh] bg-[#1a1a1a] animate-pulse rounded-xl mb-8"></div>
          <div className="flex flex-col md:flex-row gap-8">
            <div className="w-full md:w-2/3 space-y-4">
              <div className="h-8 bg-[#1a1a1a] animate-pulse rounded w-1/2"></div>
              <div className="h-4 bg-[#1a1a1a] animate-pulse rounded w-full"></div>
            </div>
            <div className="w-full md:w-1/3 space-y-4">
              {[...Array(5)].map((_, i) => <EpisodeCardSkeleton key={i} />)}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!anime) return <div className="min-h-screen bg-[#0f0f0f] text-white flex items-center justify-center">Anime not found.</div>;

  const currentIndex = episodes.findIndex(ep => ep.id === activeEpisode?.id);
  const prevEpisode = currentIndex > 0 ? episodes[currentIndex - 1] : null;
  const nextEpisode = currentIndex < episodes.length - 1 ? episodes[currentIndex + 1] : null;

  return (
    <div className="min-h-screen bg-[#0f0f0f] text-white pt-16 pb-20">
      <div className="bg-black w-full">
        <div className="max-w-7xl mx-auto">
          {activeEpisode ? (
            <div className="aspect-video w-full bg-black relative shadow-2xl group">
              {showPreAd ? (
                <div className="w-full h-full absolute top-0 left-0 z-20 flex flex-col items-center justify-center bg-[#1a1a1a]">
                  <p className="text-gray-400 mb-4">Advertisement</p>
                  <div className="w-16 h-16 border-4 border-red-500 border-t-transparent rounded-full animate-spin"></div>
                  <p className="mt-4 text-sm text-gray-500">Video will play shortly...</p>
                </div>
              ) : !isValidUrl(activeEpisode.videoUrl) ? (
                <div className="w-full h-full absolute top-0 left-0 z-10 flex flex-col items-center justify-center bg-[#1a1a1a] overflow-hidden">
                  <div className="relative z-20 flex flex-col items-center gap-4 text-center p-6 max-w-lg">
                    <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mb-2">
                      <AlertCircle className="w-8 h-8 text-red-500" />
                    </div>
                    <div>
                      <h3 className="text-2xl font-bold text-white mb-2">Invalid video source</h3>
                      <p className="text-gray-400 text-sm">The video source URL for this episode is missing or invalid.</p>
                    </div>
                  </div>
                </div>
              ) : !iframeFailed ? (
                <iframe 
                  src={getCleanVideoUrl(activeEpisode.videoUrl)} 
                  className="w-full h-full absolute top-0 left-0 z-10"
                  allowFullScreen 
                  allow="autoplay; fullscreen; encrypted-media"
                  sandbox="allow-same-origin allow-scripts allow-presentation"
                  loading="lazy"
                  onError={() => setIframeFailed(true)}
                ></iframe>
              ) : (
                <div className="w-full h-full absolute top-0 left-0 z-10 flex flex-col items-center justify-center bg-[#1a1a1a] overflow-hidden">
                  <img src={activeEpisode.thumbnail || anime.thumbnail || 'https://via.placeholder.com/1280x720?text=No+Image'} alt="Fallback" className="absolute inset-0 w-full h-full object-cover opacity-20 blur-sm scale-105" />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#0f0f0f] via-[#0f0f0f]/80 to-[#0f0f0f]/40"></div>
                  <div className="relative z-20 flex flex-col items-center gap-4 text-center p-6 max-w-lg">
                    <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mb-2">
                      <AlertTriangle className="w-8 h-8 text-yellow-500" />
                    </div>
                    <div>
                      <h3 className="text-2xl font-bold text-white mb-2">Video not loading</h3>
                      <p className="text-gray-400 text-sm">The embedded video player failed to load or is blocked by your browser.</p>
                    </div>
                    <button onClick={() => setIframeFailed(false)} className="mt-6 flex items-center gap-2 bg-red-600 text-white px-8 py-3 rounded-md font-bold hover:bg-red-500 transition-all shadow-[0_0_15px_rgba(220,38,38,0.4)] hover:shadow-[0_0_25px_rgba(220,38,38,0.6)] hover:scale-105">
                      Retry Loading
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="aspect-video w-full bg-[#1a1a1a] flex items-center justify-center flex-col gap-4">
              <Play className="w-16 h-16 text-gray-600" />
              <p className="text-gray-400">No episodes available yet</p>
            </div>
          )}
          
          {activeEpisode && (
            <div className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-[#1a1a1a] border-b border-white/5 gap-4">
              <div className="flex items-center gap-4">
                <h2 className="text-lg font-bold">Episode {activeEpisode.episodeNumber}: {activeEpisode.title}</h2>
              </div>
              <div className="flex items-center gap-2 self-end sm:self-auto">
                <button onClick={() => prevEpisode && setSearchParams({ episode: prevEpisode.id })} disabled={!prevEpisode} className="flex items-center gap-1 px-3 py-2 rounded bg-white/5 hover:bg-white/10 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm font-medium">
                  <ChevronLeft className="w-5 h-5" /> Prev
                </button>
                <button onClick={() => nextEpisode && setSearchParams({ episode: nextEpisode.id })} disabled={!nextEpisode} className="flex items-center gap-1 px-3 py-2 rounded bg-red-600 hover:bg-red-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm font-medium">
                  Next <ChevronRight className="w-5 h-5" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8">
        <AdBanner />
        <div className="flex flex-col lg:flex-row gap-8 mt-8">
          <div className="w-full lg:w-2/3">
            <div className="flex flex-col md:flex-row gap-6">
              <img src={anime.thumbnail || 'https://via.placeholder.com/300x450?text=No+Image'} alt={anime.title} className="w-48 rounded-lg shadow-lg object-cover hidden md:block" loading="lazy" />
              <div>
                <h1 className="text-3xl md:text-4xl font-bold mb-2">{anime.title}</h1>
                <div className="flex flex-wrap items-center gap-4 text-sm text-gray-400 mb-6">
                  <span className="flex items-center gap-1"><Calendar className="w-4 h-4" /> {anime.releaseYear}</span>
                  <span className="flex items-center gap-1 text-red-400"><Star className="w-4 h-4 fill-current" /> {anime.status}</span>
                  <span className="bg-white/10 px-2 py-0.5 rounded text-white">HD</span>
                  <span className="bg-red-600/20 text-red-400 px-2 py-0.5 rounded font-medium">{episodes.length} Episodes</span>
                </div>
                <div className="bg-[#1a1a1a] p-4 rounded-lg border border-white/5 mb-6">
                  <h3 className="text-lg font-bold mb-2 flex items-center gap-2"><Info className="w-5 h-5 text-red-500" /> Synopsis</h3>
                  <p className="text-gray-300 leading-relaxed">{anime.description}</p>
                </div>
              </div>
            </div>
          </div>

          <div className="w-full lg:w-1/3">
            <div className="bg-[#1a1a1a] rounded-lg border border-white/5 overflow-hidden flex flex-col h-[600px]">
              <div className="p-4 border-b border-white/5 bg-[#0f0f0f]/50 flex items-center justify-between sticky top-0 z-10">
                <h3 className="text-lg font-bold flex items-center gap-2"><ListVideo className="w-5 h-5 text-red-500" /> Episodes ({episodes.length})</h3>
              </div>
              <div className="overflow-y-auto flex-1 p-2 space-y-2 custom-scrollbar">
                {episodes.length === 0 ? (
                  <p className="text-gray-500 text-center py-8">No episodes found.</p>
                ) : (
                  episodes.map((ep) => {
                    const isActive = activeEpisode?.id === ep.id;
                    return (
                      <button 
                        key={ep.id} 
                        ref={isActive ? activeEpisodeRef : null}
                        onClick={() => setSearchParams({ episode: ep.id })} 
                        className={`w-full text-left flex gap-3 p-2 rounded-lg transition-all ${isActive ? 'bg-red-600/20 border border-red-500/50' : 'hover:bg-white/5 border border-transparent'}`}
                      >
                        <div className="relative w-28 aspect-video flex-shrink-0 rounded overflow-hidden bg-black">
                          <img src={ep.thumbnail || anime.thumbnail || 'https://via.placeholder.com/300x170?text=No+Image'} alt={ep.title} className="w-full h-full object-cover opacity-80" loading="lazy" />
                          {isActive && <div className="absolute inset-0 flex items-center justify-center bg-black/40"><Play className="w-6 h-6 text-red-500 fill-current" /></div>}
                        </div>
                        <div className="flex flex-col justify-center overflow-hidden">
                          <span className={`text-xs font-bold mb-1 ${isActive ? 'text-red-400' : 'text-gray-400'}`}>Episode {ep.episodeNumber}</span>
                          <span className={`text-sm line-clamp-2 ${isActive ? 'text-white font-medium' : 'text-gray-300'}`}>{ep.title}</span>
                        </div>
                      </button>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #333; border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #555; }
      `}</style>
    </div>
  );
}
