import React, { useState } from 'react';
import { Button } from './Button';
import { GeneratedAsset } from '../types';
import { resolveIPFS } from '../services/storage';

interface ListModalProps {
  isOpen: boolean;
  onClose: () => void;
  asset: GeneratedAsset | null;
  onConfirm: (asset: GeneratedAsset, price: string, isAuction?: boolean, duration?: number) => Promise<void>;
}

export const ListModal: React.FC<ListModalProps> = ({ isOpen, onClose, asset, onConfirm }) => {
  const [mode, setMode] = useState<'fixed' | 'auction'>('fixed');
  const [price, setPrice] = useState('');
  const [duration, setDuration] = useState('24'); // Hours
  const [loading, setLoading] = useState(false);

  if (!isOpen || !asset) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!price) return;
    setLoading(true);
    try {
      if (mode === 'fixed') {
        await onConfirm(asset, price, false);
      } else {
        const durationSec = parseFloat(duration) * 3600;
        await onConfirm(asset, price, true, durationSec);
      }
      onClose();
      setPrice('');
      setDuration('24');
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const imageSrc = resolveIPFS(asset.image) || '';

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div 
        className="absolute inset-0 bg-black/80 backdrop-blur-sm transition-opacity"
        onClick={!loading ? onClose : undefined}
      ></div>

      <div className="relative bg-[#0a0a0a] border border-white/10 rounded-2xl p-0 max-w-md w-full shadow-[0_0_50px_rgba(255,255,255,0.05)] overflow-hidden">
        
        <div className="p-6 border-b border-white/5 flex justify-between items-center">
            <h2 className="text-xl font-bold text-white font-display">Sell Item</h2>
            <button onClick={onClose} disabled={loading} className="text-neutral-500 hover:text-white transition-colors">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
            </button>
        </div>

        <div className="p-6">
            <div className="flex gap-4 mb-6 bg-white/5 p-3 rounded-xl border border-white/5">
                <div className="w-16 h-16 rounded-lg overflow-hidden bg-neutral-900 shrink-0">
                    <img src={imageSrc} alt={asset.metadata.name} className="w-full h-full object-cover" />
                </div>
                <div>
                    <h3 className="text-white font-bold">{asset.metadata.name}</h3>
                    <div className="mt-1 text-[10px] bg-neutral-800 text-neutral-300 px-1.5 py-0.5 rounded inline-block border border-white/10">
                        {asset.metadata.rarity}
                    </div>
                </div>
            </div>

            {/* Tabs */}
            <div className="flex bg-neutral-900 rounded-lg p-1 mb-6">
                <button 
                  onClick={() => setMode('fixed')}
                  className={`flex-1 py-2 text-xs font-bold uppercase tracking-wider rounded-md transition-all ${
                    mode === 'fixed' ? 'bg-indigo-600 text-white shadow-lg' : 'text-neutral-500 hover:text-white'
                  }`}
                >
                  Fixed Price
                </button>
                <button 
                  onClick={() => setMode('auction')}
                  className={`flex-1 py-2 text-xs font-bold uppercase tracking-wider rounded-md transition-all ${
                    mode === 'auction' ? 'bg-indigo-600 text-white shadow-lg' : 'text-neutral-500 hover:text-white'
                  }`}
                >
                  Timed Auction
                </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                  <label className="block text-xs font-bold text-neutral-500 uppercase tracking-wider mb-2">
                    {mode === 'fixed' ? 'Listing Price (ETH)' : 'Starting Bid (ETH)'}
                  </label>
                  <div className="relative">
                      <input 
                      type="number" 
                      step="0.0001"
                      min="0"
                      value={price}
                      onChange={(e) => setPrice(e.target.value)}
                      placeholder="0.05"
                      className="w-full bg-[#111] border border-white/10 rounded-lg pl-4 pr-12 py-3 text-white focus:outline-none focus:border-indigo-500 transition-colors placeholder-neutral-700 font-mono text-lg"
                      autoFocus
                      />
                      <span className="absolute right-4 top-4 text-neutral-500 font-bold text-xs">ETH</span>
                  </div>
              </div>

              {mode === 'auction' && (
                 <div>
                    <label className="block text-xs font-bold text-neutral-500 uppercase tracking-wider mb-2">
                        Duration (Hours)
                    </label>
                    <input 
                      type="number"
                      min="1"
                      max="168"
                      value={duration}
                      onChange={(e) => setDuration(e.target.value)}
                      className="w-full bg-[#111] border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-indigo-500 transition-colors font-mono"
                    />
                    <div className="flex justify-between mt-2">
                       {[1, 6, 24, 48].map(h => (
                          <button 
                            type="button"
                            key={h} 
                            onClick={() => setDuration(h.toString())}
                            className="text-[10px] bg-neutral-800 text-neutral-400 px-3 py-1 rounded hover:bg-neutral-700 hover:text-white transition-colors"
                          >
                            {h}h
                          </button>
                       ))}
                    </div>
                 </div>
              )}

              <p className="mt-2 text-[10px] text-neutral-500">
                  {mode === 'fixed' 
                    ? "Listing will transfer your NFT to the marketplace contract."
                    : "Auction will lock your NFT until the timer ends and a bid is accepted."}
              </p>

              <div className="pt-2">
                  <Button 
                      type="submit" 
                      variant="primary" 
                      className="w-full bg-indigo-600 border-none text-white hover:bg-indigo-500 py-4"
                      isLoading={loading}
                      disabled={!price}
                  >
                  {mode === 'fixed' ? 'List Item' : 'Start Auction'}
                  </Button>
              </div>
            </form>
        </div>
      </div>
    </div>
  );
};