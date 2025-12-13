import React from 'react';
import { Button } from './Button';

interface NavbarProps {
  walletAddress: string | null;
  onConnect: () => void;
  onCreateDrop: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ walletAddress, onConnect, onCreateDrop }) => {
  return (
    <nav className="sticky top-0 z-40 h-20 px-6 md:px-12 flex items-center justify-between bg-[#080808]/80 backdrop-blur-xl border-b border-white/5">
      {/* Brand */}
      <div className="flex items-center gap-4 group cursor-pointer">
        <div className="relative w-10 h-10 flex items-center justify-center bg-white text-black rounded-xl shadow-[0_0_20px_rgba(255,255,255,0.2)] group-hover:shadow-[0_0_30px_rgba(255,255,255,0.4)] transition-all duration-500">
           <svg viewBox="0 0 24 24" fill="none" className="w-6 h-6" stroke="currentColor" strokeWidth="2.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
        </div>
        <span className="text-xl font-display font-bold tracking-tight text-white group-hover:text-indigo-300 transition-colors">NovaForge</span>
      </div>

      {/* Center Nav */}
      <div className="hidden lg:flex items-center gap-8 absolute left-1/2 transform -translate-x-1/2">
         {['Governance', 'Bounties', 'Documentation', 'Analytics'].map((item) => (
           <a key={item} href="#" className="text-sm font-medium text-neutral-400 hover:text-white transition-colors relative group">
             {item}
             <span className="absolute -bottom-1 left-0 w-0 h-[1px] bg-indigo-500 transition-all group-hover:w-full"></span>
           </a>
         ))}
      </div>

      {/* Actions */}
      <div className="flex items-center gap-4">
        {walletAddress && (
          <button 
            onClick={onCreateDrop}
            className="hidden sm:flex items-center gap-2 text-sm font-medium text-neutral-400 hover:text-white transition-colors px-4 py-2 rounded-lg hover:bg-white/5"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            <span>Deploy</span>
          </button>
        )}

        {walletAddress ? (
          <div className="flex items-center gap-3 bg-white/5 border border-white/10 rounded-full pl-2 pr-4 py-1.5 hover:border-white/20 transition-all">
             <div className="w-8 h-8 rounded-full bg-indigo-500/20 flex items-center justify-center border border-indigo-500/30">
                <div className="w-2 h-2 bg-indigo-500 rounded-full animate-pulse"></div>
             </div>
             <div className="flex flex-col">
               <span className="text-xs font-bold text-white leading-none font-mono">{walletAddress.slice(0, 6)}...{walletAddress.slice(-4)}</span>
             </div>
          </div>
        ) : (
          <Button 
            variant="primary" 
            className="h-10 px-6 text-sm font-bold tracking-wide rounded-full"
            onClick={onConnect}
          >
            Connect Wallet
          </Button>
        )}
      </div>
    </nav>
  );
};