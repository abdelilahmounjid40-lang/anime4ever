import React, { useState, useEffect } from 'react';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase';

export function AdBanner() {
  const [ad, setAd] = useState<any | null>(null);

  useEffect(() => {
    const fetchAd = async () => {
      try {
        const q = query(collection(db, 'ads'), where('active', '==', true));
        const snapshot = await getDocs(q);
        if (!snapshot.empty) {
          const ads = snapshot.docs
            .map(doc => ({ id: doc.id, ...doc.data() }))
            .filter((ad: any) => ['image', 'iframe'].includes(ad.type));
          
          if (ads.length > 0) {
            setAd(ads[Math.floor(Math.random() * ads.length)]);
          }
        }
      } catch (error) {
        handleFirestoreError(error, OperationType.LIST, 'ads');
      }
    };
    fetchAd();
  }, []);

  if (!ad) return null;

  return (
    <div className="w-full my-8 bg-[#181818] rounded-xl overflow-hidden border border-white/10 relative group">
      <div className="absolute top-2 right-2 bg-black/60 text-white text-[10px] px-2 py-1 rounded z-10">ADVERTISEMENT</div>
      {ad.type === 'image' ? (
        <a href={ad.targetUrl || '#'} target="_blank" rel="noopener noreferrer" className="block w-full">
          <img src={ad.url} alt={ad.title} className="w-full h-auto max-h-[250px] object-cover" loading="lazy" />
        </a>
      ) : (
        <div className="w-full aspect-[21/9] max-h-[250px]">
          <iframe src={ad.url} className="w-full h-full" title={ad.title} loading="lazy"></iframe>
        </div>
      )}
    </div>
  );
}
