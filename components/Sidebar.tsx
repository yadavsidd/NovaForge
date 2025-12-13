import React, { useState } from 'react';
import { Organization } from '../types';

interface SidebarProps {
  availableOrgs: Organization[];
  selectedOrg: string | null;
  onSelectOrg: (org: string) => void;
  upcomingDrops: { id: string, name: string, date: string }[];
  onRegisterDrop: (id: string) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ 
  availableOrgs, 
  selectedOrg, 
  onSelectOrg, 
  upcomingDrops,
  onRegisterDrop
}) => {
  const [registeredDrops, setRegisteredDrops] = useState<string[]>([]);

  const handleRegister = (id: string) => {
    onRegisterDrop(id);
    setRegisteredDrops(prev => [...prev, id]);
  };

  return (
    <aside className="w-80 hidden lg:flex flex-col h-[calc(100vh-80px)] sticky top-20 border-r border-white/5 bg-[#080808] p-8 space-y-10 overflow-y-auto">
      
      {/* Collections */}
      <div>
        <h3 className="text-xs font-bold text-neutral-500 uppercase tracking-widest mb-6">Protocols</h3>
        <div className="space-y-2">
          {availableOrgs.map(org => {
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
          })}
        </div>
      </div>

      {/* Drops */}
      <div>
        <h3 className="text-xs font-bold text-neutral-500 uppercase tracking-widest mb-6">Drop Calender</h3>
        <div className="space-y-4">
          {upcomingDrops.map(drop => {
             const isRegistered = registeredDrops.includes(drop.id);
             return (
              <div key={drop.id} className="glass-panel p-4 rounded-xl transition-all hover:border-white/20">
                <div className="flex justify-between items-start mb-3">
                  <span className="text-sm font-semibold text-white">{drop.name}</span>
                  <span className="text-[10px] text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded border border-indigo-500/20 font-mono">{drop.date}</span>
                </div>
                <button 
                  onClick={() => !isRegistered && handleRegister(drop.id)}
                  disabled={isRegistered}
                  className={`w-full text-center text-[10px] font-bold uppercase tracking-wider py-2 rounded-lg transition-all ${
                    isRegistered 
                      ? 'bg-neutral-800 text-neutral-400 cursor-default' 
                      : 'bg-white text-black hover:bg-neutral-200'
                  }`}
                >
                  {isRegistered ? "Registered" : "Allowlist"}
                </button>
              </div>
             );
          })}
        </div>
      </div>

       {/* Network Status */}
       <div className="pt-6 mt-auto border-t border-white/10">
         <div className="flex items-center justify-between text-xs text-neutral-500">
            <span className="flex items-center gap-2">
              <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
              Sepolia Testnet
            </span>
            <span>Block 19.2M</span>
         </div>
      </div>
    </aside>
  );
};