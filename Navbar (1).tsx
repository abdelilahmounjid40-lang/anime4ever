import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { PlaySquare, Shield, LogOut, LogIn, Search } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

export function Navbar() {
  const { user, isAdmin, signInWithGoogle, logout } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const navigate = useNavigate();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/?search=${encodeURIComponent(searchQuery.trim())}`);
    } else {
      navigate('/');
    }
  };

  return (
    <nav className="fixed top-0 w-full z-50 bg-[#0f0f0f]/90 backdrop-blur-md border-b border-white/5">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-4 md:gap-8">
            <Link to="/" className="flex items-center gap-2 group">
              <PlaySquare className="w-8 h-8 text-red-600 group-hover:text-red-500 transition-colors" />
              <span className="text-xl font-bold text-white tracking-tight hidden sm:block">Anime4Ever</span>
            </Link>
            
            <form onSubmit={handleSearch} className="relative hidden md:block">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input 
                type="text" 
                placeholder="Search anime..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-[#1a1a1a] border border-white/10 text-white text-sm rounded-full pl-10 pr-4 py-2 focus:outline-none focus:border-red-500 w-64 transition-all"
              />
            </form>
          </div>
          
          <div className="flex items-center gap-4">
            {isAdmin && (
              <Link to="/admin" className="flex items-center gap-2 px-3 py-1.5 rounded-md bg-red-600/10 text-red-500 hover:bg-red-600/20 transition-colors text-sm font-medium border border-red-500/30">
                <Shield className="w-4 h-4" /> <span className="hidden sm:inline">Admin</span>
              </Link>
            )}
            {user ? (
              <div className="flex items-center gap-4">
                <img src={user.photoURL || ''} alt={user.displayName || 'User'} className="w-8 h-8 rounded-full border border-red-500/30" />
                <button onClick={logout} className="text-gray-400 hover:text-white transition-colors"><LogOut className="w-5 h-5" /></button>
              </div>
            ) : (
              <button onClick={signInWithGoogle} className="flex items-center gap-2 px-4 py-2 rounded-md bg-red-600 text-white hover:bg-red-500 transition-colors text-sm font-medium shadow-[0_0_15px_rgba(220,38,38,0.3)] hover:shadow-[0_0_20px_rgba(220,38,38,0.5)]">
                <LogIn className="w-4 h-4" /> Sign In
              </button>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
