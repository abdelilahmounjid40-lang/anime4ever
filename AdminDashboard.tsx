import React, { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { useAuth } from '../contexts/AuthContext';
import { Plus, Edit, Film, ListVideo, MonitorPlay } from 'lucide-react';

const capitalize = (str: string) => str.charAt(0).toUpperCase() + str.slice(1);

export function AdminDashboard() {
  const { isAdmin, loading } = useAuth();
  const [activeTab, setActiveTab] = useState('animes');
  const [data, setData] = useState<any[]>([]);
  const [animesList, setAnimesList] = useState<any[]>([]);
  const [formData, setFormData] = useState<any>({});
  const [isEditing, setIsEditing] = useState(false);
  
  // Stats
  const [stats, setStats] = useState({ animes: 0, episodes: 0, ads: 0 });

  const fetchData = async (collectionName: string) => {
    try {
      const snapshot = await getDocs(collection(db, collectionName));
      setData(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    } catch (error) { 
      handleFirestoreError(error, OperationType.LIST, collectionName);
    }
  };

  const fetchStats = async () => {
    try {
      const animesSnap = await getDocs(collection(db, 'animes'));
      const episodesSnap = await getDocs(collection(db, 'episodes'));
      const adsSnap = await getDocs(collection(db, 'ads'));
      
      setStats({
        animes: animesSnap.size,
        episodes: episodesSnap.size,
        ads: adsSnap.size
      });
      setAnimesList(animesSnap.docs.map(doc => ({ id: doc.id, title: doc.data().title })));
    } catch (error) { 
      handleFirestoreError(error, OperationType.LIST, 'stats');
    }
  };

  useEffect(() => {
    if (isAdmin) {
      fetchData(activeTab);
      fetchStats();
    }
  }, [activeTab, isAdmin]);

  if (loading) return <div className="min-h-screen bg-[#0f0f0f] text-white flex items-center justify-center">Loading...</div>;
  if (!isAdmin) return <Navigate to="/" />;

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setFormData((prev: any) => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : type === 'number' ? Number(value) : value
    }));
  };

  const extractCleanIframeSrc = (val: string) => {
    const srcMatch = val.match(/src=["'](.*?)["']/);
    if (srcMatch && srcMatch[1]) {
      return srcMatch[1];
    }
    return val;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      let submitData = { ...formData };
      
      // Clean videoUrl if it's an episode
      if (activeTab === 'episodes' && submitData.videoUrl) {
        submitData.videoUrl = extractCleanIframeSrc(submitData.videoUrl);
      }

      if (isEditing && formData.id) {
        await updateDoc(doc(db, activeTab, formData.id), { ...submitData, updatedAt: new Date().toISOString() });
      } else {
        await addDoc(collection(db, activeTab), { ...submitData, createdAt: new Date().toISOString() });
      }
      setFormData({}); setIsEditing(false); fetchData(activeTab); fetchStats();
    } catch (error) { 
      handleFirestoreError(error, isEditing ? OperationType.UPDATE : OperationType.CREATE, activeTab);
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm("Are you sure you want to delete this item?")) {
      try { 
        await deleteDoc(doc(db, activeTab, id)); 
        fetchData(activeTab); 
        fetchStats(); 
      } catch (error) { 
        handleFirestoreError(error, OperationType.DELETE, `${activeTab}/${id}`);
      }
    }
  };

  const renderFormFields = () => {
    switch (activeTab) {
      case 'animes':
        return (
          <>
            <input type="text" name="title" placeholder="Title" value={formData.title || ''} onChange={handleInputChange} className="w-full p-3 bg-[#1a1a1a] rounded border border-white/10 text-white mb-4 focus:border-red-500 focus:outline-none" required />
            <textarea name="description" placeholder="Description" value={formData.description || ''} onChange={handleInputChange} className="w-full p-3 bg-[#1a1a1a] rounded border border-white/10 text-white mb-4 focus:border-red-500 focus:outline-none h-32" required />
            <input type="text" name="thumbnail" placeholder="Thumbnail URL (16:9)" value={formData.thumbnail || ''} onChange={handleInputChange} className="w-full p-3 bg-[#1a1a1a] rounded border border-white/10 text-white mb-4 focus:border-red-500 focus:outline-none" required />
            <input type="text" name="coverImage" placeholder="Cover Image URL (Optional)" value={formData.coverImage || ''} onChange={handleInputChange} className="w-full p-3 bg-[#1a1a1a] rounded border border-white/10 text-white mb-4 focus:border-red-500 focus:outline-none" />
            <input type="number" name="releaseYear" placeholder="Release Year" value={formData.releaseYear || ''} onChange={handleInputChange} className="w-full p-3 bg-[#1a1a1a] rounded border border-white/10 text-white mb-4 focus:border-red-500 focus:outline-none" />
            <select name="status" value={formData.status || 'Ongoing'} onChange={handleInputChange} className="w-full p-3 bg-[#1a1a1a] rounded border border-white/10 text-white mb-4 focus:border-red-500 focus:outline-none">
              <option value="Ongoing">Ongoing</option>
              <option value="Completed">Completed</option>
            </select>
          </>
        );
      case 'episodes':
        return (
          <>
            <select name="animeId" value={formData.animeId || ''} onChange={handleInputChange} className="w-full p-3 bg-[#1a1a1a] rounded border border-white/10 text-white mb-4 focus:border-red-500 focus:outline-none" required>
              <option value="" disabled>Select Anime</option>
              {animesList.map(anime => <option key={anime.id} value={anime.id}>{anime.title}</option>)}
            </select>
            <input type="text" name="title" placeholder="Episode Title" value={formData.title || ''} onChange={handleInputChange} className="w-full p-3 bg-[#1a1a1a] rounded border border-white/10 text-white mb-4 focus:border-red-500 focus:outline-none" required />
            <input type="number" name="episodeNumber" placeholder="Episode Number" value={formData.episodeNumber || ''} onChange={handleInputChange} className="w-full p-3 bg-[#1a1a1a] rounded border border-white/10 text-white mb-4 focus:border-red-500 focus:outline-none" required />
            <textarea name="description" placeholder="Description" value={formData.description || ''} onChange={handleInputChange} className="w-full p-3 bg-[#1a1a1a] rounded border border-white/10 text-white mb-4 focus:border-red-500 focus:outline-none" />
            
            <div className="mb-4">
              <label className="block text-sm font-bold text-gray-300 mb-2">iframe Code (REQUIRED)</label>
              <textarea 
                name="videoUrl" 
                placeholder='Paste full iframe here: <iframe src="https://www.youtube.com/embed/..." allowfullscreen></iframe>' 
                value={formData.videoUrl || ''} 
                onChange={(e) => {
                  setFormData((prev: any) => ({ ...prev, videoUrl: e.target.value }));
                }} 
                className="w-full p-3 bg-[#1a1a1a] rounded border border-white/10 text-white focus:border-red-500 focus:outline-none h-24 font-mono text-sm" required 
              />
              {formData.videoUrl && (
                <div className="mt-2 p-3 bg-red-500/10 rounded border border-red-500/20">
                  <p className="text-xs text-red-400 mb-1 font-bold">Extracted Source URL (Will be saved):</p>
                  <p className="text-sm text-white break-all font-mono">{extractCleanIframeSrc(formData.videoUrl)}</p>
                </div>
              )}
            </div>

            <input type="text" name="thumbnail" placeholder="Thumbnail URL (Optional)" value={formData.thumbnail || ''} onChange={handleInputChange} className="w-full p-3 bg-[#1a1a1a] rounded border border-white/10 text-white mb-4 focus:border-red-500 focus:outline-none" />
          </>
        );
      case 'ads':
        return (
          <>
            <input type="text" name="title" placeholder="Ad Title" value={formData.title || ''} onChange={handleInputChange} className="w-full p-3 bg-[#1a1a1a] rounded border border-white/10 text-white mb-4 focus:border-red-500 focus:outline-none" required />
            <select name="type" value={formData.type || 'video'} onChange={handleInputChange} className="w-full p-3 bg-[#1a1a1a] rounded border border-white/10 text-white mb-4 focus:border-red-500 focus:outline-none">
              <option value="video">Video</option>
              <option value="image">Image</option>
              <option value="iframe">Iframe</option>
            </select>
            <input type="text" name="url" placeholder="Ad Media URL" value={formData.url || ''} onChange={handleInputChange} className="w-full p-3 bg-[#1a1a1a] rounded border border-white/10 text-white mb-4 focus:border-red-500 focus:outline-none" required />
            <input type="text" name="targetUrl" placeholder="Target Click URL" value={formData.targetUrl || ''} onChange={handleInputChange} className="w-full p-3 bg-[#1a1a1a] rounded border border-white/10 text-white mb-4 focus:border-red-500 focus:outline-none" />
            <label className="flex items-center gap-2 text-white mb-4 p-3 bg-[#1a1a1a] rounded border border-white/10 cursor-pointer">
              <input type="checkbox" name="active" checked={formData.active || false} onChange={handleInputChange} className="w-5 h-5 accent-red-500" /> Active
            </label>
          </>
        );
      default: return null;
    }
  };

  return (
    <div className="min-h-screen bg-[#0f0f0f] text-white pt-20 pb-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-bold mb-8 text-white">Admin Dashboard</h1>
        
        {/* Stats Section */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-[#1a1a1a] p-6 rounded-xl border border-white/5 flex items-center gap-4">
            <div className="p-4 bg-red-500/10 rounded-lg"><Film className="w-8 h-8 text-red-500" /></div>
            <div>
              <p className="text-gray-400 text-sm">Total Animes</p>
              <p className="text-2xl font-bold">{stats.animes}</p>
            </div>
          </div>
          <div className="bg-[#1a1a1a] p-6 rounded-xl border border-white/5 flex items-center gap-4">
            <div className="p-4 bg-blue-500/10 rounded-lg"><ListVideo className="w-8 h-8 text-blue-500" /></div>
            <div>
              <p className="text-gray-400 text-sm">Total Episodes</p>
              <p className="text-2xl font-bold">{stats.episodes}</p>
            </div>
          </div>
          <div className="bg-[#1a1a1a] p-6 rounded-xl border border-white/5 flex items-center gap-4">
            <div className="p-4 bg-green-500/10 rounded-lg"><MonitorPlay className="w-8 h-8 text-green-500" /></div>
            <div>
              <p className="text-gray-400 text-sm">Active Ads</p>
              <p className="text-2xl font-bold">{stats.ads}</p>
            </div>
          </div>
        </div>

        <div className="flex gap-4 mb-8 border-b border-white/10 pb-4 overflow-x-auto custom-scrollbar">
          {['animes', 'episodes', 'ads'].map(tab => (
            <button key={tab} onClick={() => { setActiveTab(tab); setFormData({}); setIsEditing(false); }} className={`px-6 py-2.5 rounded-md font-medium capitalize whitespace-nowrap transition-colors ${activeTab === tab ? 'bg-red-600 text-white' : 'bg-[#1a1a1a] text-gray-400 hover:bg-[#2a2a2a]'}`}>
              {tab.replace(/([A-Z])/g, ' $1').trim()}
            </button>
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="bg-[#1a1a1a] p-6 rounded-xl border border-white/5 h-fit shadow-lg">
            <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
              {isEditing ? <Edit className="w-5 h-5 text-red-500" /> : <Plus className="w-5 h-5 text-red-500" />}
              {isEditing ? 'Edit' : 'Add New'} {capitalize(activeTab.slice(0, -1))}
            </h2>
            <form onSubmit={handleSubmit}>
              {renderFormFields()}
              <div className="flex gap-4 mt-6">
                <button type="submit" className="flex-1 bg-red-600 text-white py-3 rounded-md font-bold hover:bg-red-500 transition-colors shadow-[0_0_15px_rgba(220,38,38,0.3)] hover:shadow-[0_0_20px_rgba(220,38,38,0.5)]">
                  {isEditing ? 'Update' : 'Save'}
                </button>
                {isEditing && (
                  <button type="button" onClick={() => { setIsEditing(false); setFormData({}); }} className="flex-1 bg-[#2a2a2a] text-white py-3 rounded-md font-bold hover:bg-[#3a3a3a] transition-colors">
                    Cancel
                  </button>
                )}
              </div>
            </form>
          </div>
          <div className="lg:col-span-2 bg-[#1a1a1a] p-6 rounded-xl border border-white/5 shadow-lg">
            <h2 className="text-xl font-bold mb-6 capitalize">Manage {capitalize(activeTab.replace(/([A-Z])/g, ' $1').trim())}</h2>
            <div className="overflow-x-auto custom-scrollbar">
              <table className="w-full text-left border-collapse min-w-[600px]">
                <thead>
                  <tr className="border-b border-white/10 text-gray-400 bg-black/20">
                    <th className="py-4 px-4 font-medium">Title/Name</th>
                    <th className="py-4 px-4 font-medium">ID</th>
                    <th className="py-4 px-4 font-medium text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {data.length === 0 ? (
                    <tr><td colSpan={3} className="py-12 text-center text-gray-500">No data found.</td></tr>
                  ) : (
                    data.map(item => (
                      <tr key={item.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                        <td className="py-4 px-4 font-medium">{item.title || item.name}</td>
                        <td className="py-4 px-4 text-sm text-gray-500 font-mono">{item.id}</td>
                        <td className="py-4 px-4 text-right">
                          <button onClick={() => { setFormData(item); setIsEditing(true); }} className="text-red-400 hover:text-red-300 mr-4 transition-colors font-medium">Edit</button>
                          <button onClick={() => handleDelete(item.id)} className="text-gray-500 hover:text-red-500 transition-colors font-medium">Delete</button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
      <style>{`
        .custom-scrollbar::-webkit-scrollbar { height: 6px; width: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #333; border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #555; }
      `}</style>
    </div>
  );
}
