import React, { useState } from 'react';
import { Organization } from '../types';

interface SidebarProps {
  availableOrgs: Organization[];
  selectedOrg: string | null;
  onSelectOrg: (org: string | null) => void;
  onImportOrg: (address: string) => Promise<void>;
  currentView: 'market' | 'owned';
  onNavigate: (view: 'market' | 'owned') => void;
  walletConnected: boolean;
}

export const Sidebar: React.FC<SidebarProps> = ({ 
  availableOrgs, 
  selectedOrg, 
  onSelectOrg, 
  onImportOrg,
  currentView,
  onNavigate,
  walletConnected
}) => {
  const [importAddress, setImportAddress] = useState('');
  const [loadingImport, setLoadingImport] = useState(false);

  const handleImport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!importAddress) return;
    setLoadingImport(true);
    try {
        await onImportOrg(importAddress);
        setImportAddress('');
    } catch(e) {
        alert("Failed to load contract");
    } finally {
        setLoadingImport(false);
    }
  };

  return (
    <aside className="w-80 hidden lg:flex flex-col h-[calc(100vh-80px)] sticky top-20 border-r border-white/5 bg-[#080808] p-8 space-y-10 overflow-y-auto">
      
      {/* Main Navigation */}
      <div>
        <h3 className="text-xs font-bold text-neutral-500 uppercase tracking-widest mb-4">Discover</h3>
        <div className="space-y-2">
            <button
                onClick={() => onNavigate('market')}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200 ${
                    currentView === 'market' 
                    ? 'bg-indigo-600 text-white shadow-[0_0_20px_rgba(79,70,229,0.3)]' 
                    : 'text-neutral-400 hover:text-white hover:bg-white/5'
                }`}
            >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
                Marketplace
            </button>
            <button
                onClick={() => onNavigate('owned')}
                disabled={!walletConnected}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200 ${
                    currentView === 'owned' 
                    ? 'bg-indigo-600 text-white shadow-[0_0_20px_rgba(79,70,229,0.3)]' 
                    : walletConnected ? 'text-neutral-400 hover:text-white hover:bg-white/5' : 'text-neutral-600 cursor-not-allowed opacity-50'
                }`}
            >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                </svg>
                My Portfolio
            </button>
        </div>
      </div>

      {/* Active Collection */}
      <div>
        <h3 className="text-xs font-bold text-neutral-500 uppercase tracking-widest mb-6">Collections</h3>
        <div className="space-y-2">
          {availableOrgs.length > 0 ? (
             availableOrgs.map(org => {
                const isActive = selectedOrg === org;
                return (
                  <button
                    key={org}
                    onClick={() => onSelectOrg(org)}
                    className={`w-full group flex items-center justify-between px-4 py-3 rounded-lg text-sm transition-all duration-300 ${
                      isActive 
                        ? 'bg-white/10 text-white border border-white/5' 
                        : 'text-neutral-400 hover:bg-white/5 hover:text-white border border-transparent'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                       <div className={`w-2 h-2 rounded-full transition-colors ${isActive ? 'bg-indigo-500' : 'bg-neutral-700 group-hover:bg-white'}`}></div>
                       <span className="font-medium">{org}</span>
                    </div>
                  </button>
                )
             })
          ) : (
             <div className="text-sm text-neutral-600 italic px-2">
                No collection loaded.
             </div>
          )}
        </div>
      </div>

      {/* Import Tool */}
      <div>
        <h3 className="text-xs font-bold text-neutral-500 uppercase tracking-widest mb-4">Import Contract</h3>
        <form onSubmit={handleImport} className="space-y-3">
           <input 
              type="text" 
              value={importAddress}
              onChange={(e) => setImportAddress(e.target.value)}
              placeholder="0x..."
              className="w-full bg-[#111] border border-white/10 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500 placeholder-neutral-600 font-mono"
           />
           <button 
              type="submit"
              disabled={loadingImport || !importAddress}
              className="w-full bg-white/5 hover:bg-white/10 text-white text-xs font-bold uppercase tracking-wider py-2 rounded-lg transition-colors disabled:opacity-50"
           >
              {loadingImport ? "Loading..." : "Load Address"}
           </button>
        </form>
        <p className="text-[10px] text-neutral-600 mt-2 leading-relaxed">
            Paste an ERC-721 contract address deployed on Sepolia to view and interact with it.
        </p>
      </div>

       {/* Network Status */}
       <div className="pt-6 mt-auto border-t border-white/10">
         <div className="flex items-center justify-between text-xs text-neutral-500">
            <span className="flex items-center gap-2">
              <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
              Sepolia Testnet
            </span>
            <span>Live</span>
         </div>
      </div>
    </aside>
  );
};