import React, { useState } from 'react';
import { Button } from './Button';
import { GeneratedAsset } from '../types';
import { resolveIPFS } from '../services/storage';

interface BuyModalProps {
  isOpen: boolean;
  onClose: () => void;
  asset: GeneratedAsset | null;
  onConfirm: (asset: GeneratedAsset) => Promise<void>;
}

export const BuyModal: React.FC<BuyModalProps> = ({ isOpen, onClose, asset, onConfirm }) => {
  const [loading, setLoading] = useState(false);

  if (!isOpen || !asset) return null;

  const handleConfirm = async () => {
    setLoading(true);
    try {
      await onConfirm(asset);
      onClose();
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const imageSrc = resolveIPFS(asset.image) || '';

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/80 backdrop-blur-sm transition-opacity"
        onClick={!loading ? onClose : undefined}
      ></div>

      {/* Modal Content */}
      <div className="relative bg-[#0a0a0a] border border-white/10 rounded-2xl p-0 max-w-lg w-full shadow-[0_0_50px_rgba(255,255,255,0.05)] overflow-hidden">
        
        {/* Header */}
        <div className="p-6 border-b border-white/5 flex justify-between items-center">
            <h2 className="text-xl font-bold text-white font-display">Checkout</h2>
            <button onClick={onClose} disabled={loading} className="text-neutral-500 hover:text-white transition-colors">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
            </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-6">
            
            {/* Item Summary */}
            <div className="flex gap-4">
                <div className="w-20 h-20 rounded-lg overflow-hidden bg-neutral-900 border border-white/10 shrink-0">
                    <img src={imageSrc} alt={asset.metadata.name} className="w-full h-full object-cover" />
                </div>
                <div className="flex flex-col justify-center">
                    <span className="text-xs text-neutral-500 uppercase font-bold tracking-wider">{asset.org}</span>
                    <h3 className="text-lg font-bold text-white leading-tight">{asset.metadata.name}</h3>
                    <span className="text-sm text-neutral-400 mt-1">{asset.metadata.ticker}</span>
                </div>
            </div>

            <div className="h-[1px] bg-white/5 w-full"></div>

            {/* Price Breakdown */}
            <div className="space-y-3">
                <div className="flex justify-between items-center text-sm">
                    <span className="text-neutral-400">Item Price</span>
                    <span className="text-white font-mono">{asset.price} ETH</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                    <span className="text-neutral-400">Protocol Fee</span>
                    <span className="text-white font-mono">0.00 ETH</span>
                </div>
                <div className="flex justify-between items-center text-sm pt-2 border-t border-white/5">
                    <span className="font-bold text-white">Total</span>
                    <div className="text-right">
                        <span className="block text-xl font-bold text-indigo-400 font-mono">{asset.price} ETH</span>
                    </div>
                </div>
            </div>
        </div>

        {/* Footer */}
        <div className="p-6 pt-2 bg-white/5 border-t border-white/5">
            <Button 
                onClick={handleConfirm} 
                variant="primary" 
                className="w-full py-4 text-sm uppercase tracking-widest bg-indigo-600 hover:bg-indigo-500 border-none text-white shadow-[0_0_20px_rgba(79,70,229,0.3)]"
                isLoading={loading}
            >
                Confirm Purchase
            </Button>
        </div>
      </div>
    </div>
  );
};