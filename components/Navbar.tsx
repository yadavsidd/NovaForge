import React from 'react';
import { Button } from './Button';

interface NavbarProps {
  walletAddress: string | null;
  onConnect: () => void;
  onCreateDrop: () => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
}

export const Navbar: React.FC<NavbarProps> = ({ walletAddress, onConnect, onCreateDrop, searchQuery, onSearchChange }) => {
  return (
    <nav className="sticky top-0 z-40 h-[72px] px-6 md:px-8 flex items-center justify-between bg-[#080808]/90 backdrop-blur-xl border-b border-white/5">
      {/* Brand */}
      <div className="flex items-center gap-3 group cursor-pointer mr-8">
        <div className="relative w-8 h-8 flex items-center justify-center bg-indigo-600 rounded-lg shadow-lg group-hover:scale-105 transition-all">
           <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5 text-white" stroke="currentColor" strokeWidth="2.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
        </div>
        <span className="text-xl font-display font-bold tracking-tight text-white">NovaForge</span>
      </div>

      {/* Global Search Bar */}
      <div className="flex-1 max-w-2xl hidden md:block mx-4">
        <div className="relative group">
           <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
             <svg className="h-5 w-5 text-neutral-500 group-focus-within:text-white transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
             </svg>
           </div>
           <input 
             type="text"
             value={searchQuery}
             onChange={(e) => onSearchChange(e.target.value)}
             className="block w-full pl-10 pr-3 py-2.5 border border-white/10 rounded-xl leading-5 bg-white/5 text-neutral-300 placeholder-neutral-500 focus:outline-none focus:bg-black focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm transition-all shadow-inner"
             placeholder="Search items..."
           />
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-3">
        {walletAddress && (
          <button 
            onClick={onCreateDrop}
            className="flex items-center gap-2 px-4 h-10 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 transition-colors"
            title="Deploy Contract"
          >
             <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            <span className="text-sm font-bold text-white hidden lg:block">Create Collection</span>
          </button>
        )}

        {walletAddress ? (
          <div className="flex items-center gap-3 bg-white/5 border border-white/10 rounded-full pl-2 pr-4 py-1.5 hover:bg-white/10 transition-all cursor-pointer">
             <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-600 flex items-center justify-center border border-white/20 shadow-inner">
             </div>
             <div className="flex flex-col">
               <span className="text-sm font-bold text-white leading-none font-mono">{walletAddress.slice(0, 4)}...{walletAddress.slice(-4)}</span>
             </div>
          </div>
        ) : (
          <Button 
            variant="primary" 
            className="h-10 px-6 text-sm font-bold tracking-wide rounded-xl"
            onClick={onConnect}
          >
            Connect Wallet
          </Button>
        )}
      </div>
    </nav>
  );
};