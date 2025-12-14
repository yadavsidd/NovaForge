import React, { useState } from 'react';
import { Button } from './Button';
import { GeneratedAsset } from '../types';

interface BidModalProps {
  isOpen: boolean;
  onClose: () => void;
  asset: GeneratedAsset | null;
  onBid: (asset: GeneratedAsset, amount: string) => Promise<void>;
}

export const BidModal: React.FC<BidModalProps> = ({ isOpen, onClose, asset, onBid }) => {
  const [bid, setBid] = useState('');
  const [loading, setLoading] = useState(false);

  if (!isOpen || !asset || !asset.auction) return null;

  const minBid = parseFloat(asset.auction.highestBid) * 1.05; // 5% increase min

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bid) return;
    setLoading(true);
    try {
      await onBid(asset, bid);
      onClose();
      setBid('');
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div 
        className="absolute inset-0 bg-black/80 backdrop-blur-sm transition-opacity"
        onClick={!loading ? onClose : undefined}
      ></div>

      <div className="relative bg-[#0a0a0a] border border-white/10 rounded-2xl p-6 max-w-sm w-full shadow-[0_0_50px_rgba(255,255,255,0.05)]">
         <h2 className="text-xl font-bold text-white mb-1">Place a Bid</h2>
         <p className="text-sm text-neutral-400 mb-6">You are betting on <span className="text-white">{asset.metadata.name}</span></p>

         <div className="mb-4 p-3 bg-white/5 rounded-lg border border-white/5 flex justify-between items-center">
            <span className="text-xs text-neutral-500 uppercase font-bold">Current Top Bid</span>
            <span className="text-lg font-mono text-white">{asset.auction.highestBid} ETH</span>
         </div>

         <form onSubmit={handleSubmit} className="space-y-4">
            <div>
                <label className="block text-xs font-bold text-neutral-500 uppercase tracking-wider mb-2">Your Bid (ETH)</label>
                <div className="relative">
                    <input 
                        type="number" 
                        step="0.0001"
                        min={minBid}
                        value={bid}
                        onChange={(e) => setBid(e.target.value)}
                        placeholder={minBid.toFixed(4)}
                        className="w-full bg-[#111] border border-white/10 rounded-lg pl-4 pr-12 py-3 text-white focus:outline-none focus:border-indigo-500 transition-colors placeholder-neutral-700 font-mono text-lg"
                        autoFocus
                    />
                    <span className="absolute right-4 top-4 text-neutral-500 font-bold text-xs">ETH</span>
                </div>
                <p className="mt-2 text-[10px] text-neutral-500">
                   Minimum bid is {minBid.toFixed(4)} ETH (5% increment).
                </p>
            </div>

            <Button 
                type="submit" 
                variant="primary" 
                className="w-full bg-indigo-600 border-none text-white hover:bg-indigo-500 py-3"
                isLoading={loading}
                disabled={!bid || parseFloat(bid) < minBid}
            >
                Place Bid
            </Button>
         </form>
      </div>
    </div>
  );
};