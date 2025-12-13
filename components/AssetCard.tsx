import React, { useState } from 'react';
import { GeneratedAsset } from '../types';
import { RarityBadge } from './RarityBadge';
import { resolveIPFS } from '../services/storage';

interface AssetCardProps {
  asset: GeneratedAsset;
  currentUser: string | null;
  onBuy: (asset: GeneratedAsset) => void;
  onList: (asset: GeneratedAsset) => void;
}

export const AssetCard: React.FC<AssetCardProps> = ({ asset, currentUser, onBuy, onList }) => {
  const [isProcessing, setIsProcessing] = useState(false);

  const isOwner = currentUser && asset.owner === currentUser;
  const isForSale = asset.isListed;
  const displayImage = resolveIPFS(asset.image);

  const handleAction = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsProcessing(true);
    try {
      if (isOwner) {
        if (!isForSale) await onList(asset);
      } else {
        if (isForSale) await onBuy(asset);
      }
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="group relative flex flex-col bg-[#111] border border-white/5 rounded-2xl overflow-hidden hover:border-white/20 hover:shadow-[0_0_30px_rgba(0,0,0,0.5)] transition-all duration-300">
      
      {/* Top Overlay */}
      <div className="absolute top-3 left-3 z-10 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
         <RarityBadge rarity={asset.metadata.rarity} />
      </div>

      {isOwner && (
        <div className="absolute top-3 right-3 z-10">
          <span className="bg-black/60 backdrop-blur-md border border-white/10 text-white text-[10px] font-bold px-2 py-1 rounded-full flex items-center gap-1">
            <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full"></span>
            OWNED
          </span>
        </div>
      )}

      {/* Image Container */}
      <div className="relative aspect-square overflow-hidden bg-neutral-900">
        {displayImage ? (
          <img 
            src={displayImage} 
            alt={asset.metadata.name} 
            className="w-full h-full object-cover grayscale opacity-80 group-hover:grayscale-0 group-hover:opacity-100 group-hover:scale-105 transition-all duration-500 ease-out"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
             <div className="w-10 h-10 border-2 border-white/10 border-t-white rounded-full animate-spin"></div>
          </div>
        )}
        
        {/* Action Button - Slide Up on Hover */}
        <div className="absolute inset-x-0 bottom-0 p-4 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out bg-gradient-to-t from-black/90 to-transparent pt-12">
           <button 
             onClick={handleAction}
             disabled={isProcessing || (!isOwner && !isForSale)}
             className={`w-full py-3 rounded-lg text-xs font-bold uppercase tracking-wider backdrop-blur-md border transition-all ${
               isOwner 
                 ? 'bg-white text-black border-white hover:bg-neutral-200'
                 : isForSale 
                   ? 'bg-indigo-600 text-white border-indigo-500 hover:bg-indigo-500'
                   : 'bg-neutral-800/50 text-neutral-500 border-neutral-700 cursor-not-allowed'
             }`}
           >
             {isProcessing ? "Processing..." : isOwner ? (isForSale ? "Cancel Listing" : "List Item") : (isForSale ? `Buy for ${asset.price} ETH` : "Not Listed")}
           </button>
        </div>
      </div>

      {/* Details */}
      <div className="p-4 bg-[#111] flex flex-col gap-1 relative z-20">
        <div className="flex items-center justify-between">
           <span className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest">{asset.org}</span>
           <span className={`text-[10px] font-mono ${isForSale ? 'text-green-400' : 'text-neutral-600'}`}>
              {isForSale ? '● LIVE' : '● HELD'}
           </span>
        </div>
        <h3 className="text-white font-display font-medium text-lg leading-tight truncate">{asset.metadata.name}</h3>
        <div className="flex items-baseline gap-1 mt-1">
           {isForSale ? (
             <>
                <span className="text-sm font-bold text-white">{asset.price}</span>
                <span className="text-xs text-neutral-500">ETH</span>
             </>
           ) : (
             <span className="text-xs text-neutral-600 italic">Unlisted</span>
           )}
        </div>
      </div>
    </div>
  );
};