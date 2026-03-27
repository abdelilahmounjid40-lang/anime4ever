import React, { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { collection, getDocs, query, orderBy, limit } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { Play, TrendingUp, Clock, Star } from 'lucide-react';
import { AnimeCardSkeleton } from '../components/Skeleton';
import { AdBanner } from '../components/AdBanner';

export function Home() {
  const [trendingAnimes, setTrendingAnimes] = useState<any[]>([]);
  const [latestEpisodes, setLatestEpisodes] = useState<any[]>([]);
  const [popularAnimes, setPopularAnimes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchParams] = useSearchParams();
  const searchQuery = searchParams.get('search')?.toLowerCase() || '';

  useEffect(() => {
    const fetchHomeData = async () => {
      try {
        const animesQ = query(collection(db, 'animes'), orderBy('createdAt', 'desc'));
        const animesSnap = await getDocs(animesQ);
        const allAnimes = animesSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        
        setTrendingAnimes(allAnimes.slice(0, 5));
        setPopularAnimes(allAnimes.slice(0, 12));

        const episodesQ = query(collection(db, 'episodes'), orderBy('createdAt', 'desc'), limit(12));
        const episodesSnap = await getDocs(episodesQ);
        
        const eps = episodesSnap.docs.map(doc => {
          const epData = doc.data();
          const parentAnime = allAnimes.find(a => a.id === epData.animeId) as any;
          return {
            id: doc.id,
            ...epData,
            animeTitle: parentAnime?.title || 'Unknown Anime',
            animeThumbnail: parentAnime?.thumbnail || epData.thumbnail
          };
        });
        setLatestEpisodes(eps);
      } catch (error) {
        handleFirestoreError(error, OperationType.LIST, 'animes/episodes');
      } finally {
        setLoading(false);
      }
    };
    fetchHomeData();
  }, []);

  const filteredAnimes = popularAnimes.filter(anime => 
    anime.title?.toLowerCase().includes(searchQuery) || 
    anime.description?.toLowerCase().includes(searchQuery)
  );

  const featuredAnime = trendingAnimes[0];

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0f0f0f] text-white pt-20 pb-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="h-[50vh] bg-[#1a1a1a] animate-pulse rounded-xl mb-12"></div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
            {[...Array(10)].map((_, i) => <AnimeCardSkeleton key={i} />)}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0f0f0f] text-white pb-20">
      {!searchQuery && featuredAnime && (
        <div className="relative h-[70vh] w-full mb-12">
          <div className="absolute inset-0">
            <img src={featuredAnime.coverImage || featuredAnime.thumbnail} alt={featuredAnime.title} className="w-full h-full object-cover opacity-60" loading="lazy" />
            <div className="absolute inset-0 bg-gradient-to-t from-[#0f0f0f] via-[#0f0f0f]/40 to-transparent"></div>
            <div className="absolute inset-0 bg-gradient-to-r from-[#0f0f0f] via-[#0f0f0f]/80 to-transparent"></div>
          </div>
          <div className="absolute bottom-0 left-0 w-full p-8 md:p-16 max-w-7xl mx-auto flex flex-col justify-end h-full">
            <span className="text-red-500 font-bold tracking-widest text-sm mb-2 uppercase flex items-center gap-2">
              <TrendingUp className="w-4 h-4" /> #1 Trending
            </span>
            <h1 className="text-4xl md:text-6xl font-bold mb-4 drop-shadow-lg">{featuredAnime.title}</h1>
            <div className="flex items-center gap-4 text-sm text-gray-300 mb-6 font-medium">
              <span className="bg-white/10 px-2 py-1 rounded text-white">{featuredAnime.releaseYear}</span>
              <span className="text-red-400">{featuredAnime.status}</span>
              <span className="border border-gray-600 px-1.5 py-0.5 rounded text-xs">HD</span>
            </div>
            <p className="max-w-2xl text-lg text-gray-300 mb-8 line-clamp-3 drop-shadow-md">{featuredAnime.description}</p>
            <Link to={`/anime/${featuredAnime.id}`} className="flex items-center gap-2 bg-red-600 text-white px-8 py-3 rounded-md font-bold hover:bg-red-500 transition-all shadow-[0_0_15px_rgba(220,38,38,0.4)] hover:shadow-[0_0_25px_rgba(220,38,38,0.6)] hover:scale-105 w-fit">
              <Play className="w-5 h-5 fill-current" /> Watch Now
            </Link>
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-16 pt-20">
        {searchQuery ? (
          <section>
            <h2 className="text-2xl font-bold text-white mb-6">Search Results for "{searchQuery}"</h2>
            {filteredAnimes.length === 0 ? (
              <div className="text-gray-500 py-10">No animes found.</div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 md:gap-6">
                {filteredAnimes.map((anime) => (
                  <Link to={`/anime/${anime.id}`} key={anime.id} className="group relative rounded-lg overflow-hidden bg-[#1a1a1a] transition-all duration-300 hover:scale-105 hover:shadow-[0_0_20px_rgba(220,38,38,0.3)] hover:z-10 cursor-pointer">
                    <div className="aspect-[16/9] w-full">
                      <img src={anime.thumbnail || 'https://via.placeholder.com/300x170?text=No+Image'} alt={anime.title} className="w-full h-full object-cover" loading="lazy" />
                    </div>
                    <div className="p-3">
                      <h3 className="text-white font-bold text-sm leading-tight mb-1 line-clamp-1">{anime.title}</h3>
                      <div className="flex items-center gap-2 text-xs text-gray-400">
                        <span>{anime.releaseYear}</span>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </section>
        ) : (
          <>
            <section>
              <div className="flex items-center gap-2 mb-6">
                <Clock className="w-6 h-6 text-red-500" />
                <h2 className="text-2xl font-bold text-white">Latest Episodes</h2>
              </div>
              {latestEpisodes.length === 0 ? (
                <div className="text-gray-500 py-10">No episodes available yet.</div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 md:gap-6">
                  {latestEpisodes.map((ep) => (
                    <Link to={`/anime/${ep.animeId}?episode=${ep.id}`} key={ep.id} className="group relative flex flex-col gap-2">
                      <div className="relative aspect-[16/9] w-full rounded-lg overflow-hidden bg-[#1a1a1a] shadow-lg">
                        <img src={ep.thumbnail || ep.animeThumbnail || 'https://via.placeholder.com/300x170?text=No+Image'} alt={ep.title} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" loading="lazy" />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                          <Play className="w-10 h-10 text-white fill-current drop-shadow-lg" />
                        </div>
                        <div className="absolute top-2 right-2 bg-red-600 text-white text-[10px] font-bold px-1.5 py-0.5 rounded shadow-md">
                          NEW
                        </div>
                        <div className="absolute bottom-2 left-2 bg-black/80 text-white text-xs font-bold px-2 py-1 rounded shadow-md">
                          EP {ep.episodeNumber}
                        </div>
                      </div>
                      <div>
                        <h3 className="text-white font-medium text-sm line-clamp-1 group-hover:text-red-400 transition-colors">{ep.animeTitle}</h3>
                        <p className="text-xs text-gray-400 line-clamp-1">{ep.title}</p>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </section>

            <AdBanner />

            <section>
              <div className="flex items-center gap-2 mb-6">
                <Star className="w-6 h-6 text-red-500" />
                <h2 className="text-2xl font-bold text-white">Popular Anime</h2>
              </div>
              {popularAnimes.length === 0 ? (
                <div className="text-gray-500 py-10">No animes available yet.</div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 md:gap-6">
                  {popularAnimes.map((anime) => (
                    <Link to={`/anime/${anime.id}`} key={anime.id} className="group relative rounded-lg overflow-hidden bg-[#1a1a1a] transition-all duration-300 hover:scale-105 hover:shadow-[0_0_20px_rgba(220,38,38,0.3)] hover:z-10 cursor-pointer">
                      <div className="aspect-[16/9] w-full">
                        <img src={anime.thumbnail || 'https://via.placeholder.com/300x170?text=No+Image'} alt={anime.title} className="w-full h-full object-cover" loading="lazy" />
                      </div>
                      <div className="p-3">
                        <h3 className="text-white font-bold text-sm leading-tight mb-1 line-clamp-1">{anime.title}</h3>
                        <div className="flex items-center gap-2 text-xs text-gray-400">
                          <span>{anime.releaseYear}</span>
                          <span className="text-red-400 font-medium ml-auto">{anime.status}</span>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </section>
          </>
        )}
      </div>
    </div>
  );
}
