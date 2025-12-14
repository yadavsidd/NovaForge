import React, { useState, useEffect } from 'react';
import { Button } from './Button';
import { getMarketplaceAddress, setMarketplaceAddress } from '../services/chain';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose, onSave }) => {
  const [address, setAddress] = useState('');

  useEffect(() => {
    if (isOpen) {
        setAddress(getMarketplaceAddress() || '');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    try {
        setMarketplaceAddress(address);
        onSave();
        onClose();
    } catch (e) {
        alert("Invalid Address Format");
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/80 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      ></div>

      {/* Modal Content */}
      <div className="relative bg-[#111] border border-white/10 rounded-2xl p-8 max-w-md w-full shadow-[0_0_50px_rgba(255,255,255,0.05)]">
        <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold text-white uppercase tracking-tight">App Configuration</h2>
            <button onClick={onClose} className="text-neutral-500 hover:text-white">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
            </button>
        </div>

        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-neutral-500 uppercase tracking-wider mb-2">Marketplace Contract Address</label>
            <input 
              type="text" 
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="0x..."
              className="w-full bg-[#080808] border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-indigo-500 transition-colors placeholder-neutral-700 font-mono text-sm"
            />
            <p className="mt-2 text-[10px] text-neutral-500 leading-relaxed">
                Required for buying and listing items. Deploy `NovaMarketplace.sol` on Sepolia and paste the address here.
            </p>
          </div>

          <div className="pt-4 flex gap-3">
             <Button 
                type="button" 
                variant="secondary"
                className="w-full"
                onClick={onClose}
             >
               Cancel
             </Button>
             <Button 
                type="submit" 
                variant="primary" 
                className="w-full bg-indigo-600 border-none text-white hover:bg-indigo-500"
                disabled={!address}
             >
               Save Config
             </Button>
          </div>
        </form>
      </div>
    </div>
  );
};