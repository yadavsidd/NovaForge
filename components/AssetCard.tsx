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

  // You are the owner if you hold it in wallet OR you are the seller listed on marketplace
  const isOwner = currentUser && (asset.owner?.toLowerCase() === currentUser.toLowerCase() || asset.seller?.toLowerCase() === currentUser.toLowerCase());
  
  const isForSale = asset.isListed;
  const displayImage = resolveIPFS(asset.image);

  const handleAction = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsProcessing(true);
    try {
      if (isOwner) {
        if (!isForSale) await onList(asset);
        // If it is for sale and I am the owner (seller), I cannot "Cancel Listing" easily with current contract logic 
        // without buying it back or having a specific cancel function. 
        // For now, we disable the button if listed by owner.
      } else {
        if (isForSale) await onBuy(asset);
      }
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="group relative flex flex-col bg-[#111] rounded-2xl overflow-hidden border border-white/5 shadow-sm hover:shadow-[0_4px_20px_rgba(0,0,0,0.5)] hover:-translate-y-1 transition-all duration-300 cursor-pointer">
      
      {/* Top Overlay Badges */}
      <div className="absolute top-3 left-3 z-10 flex gap-2">
         {asset.metadata.rarity !== 'Common' && (
             <div className="backdrop-blur-md shadow-lg">
                <RarityBadge rarity={asset.metadata.rarity} />
             </div>
         )}
      </div>

      {/* Image Container */}
      <div className="relative aspect-square overflow-hidden bg-neutral-900">
        {displayImage ? (
          <img 
            src={displayImage} 
            alt={asset.metadata.name} 
            className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-110"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
             <div className="w-10 h-10 border-2 border-white/10 border-t-white rounded-full animate-spin"></div>
          </div>
        )}
        
        {/* Buy/List Button - Appears on Hover */}
        <div className="absolute inset-x-0 bottom-0 p-3 translate-y-full group-hover:translate-y-0 transition-transform duration-300 bg-gradient-to-t from-black/80 to-transparent pt-12 flex justify-center">
           <button 
             onClick={handleAction}
             disabled={isProcessing || (isOwner && isForSale) || (!isOwner && !isForSale)}
             className={`w-full py-3 rounded-xl text-sm font-bold shadow-lg backdrop-blur-md transition-all ${
               isOwner 
                 ? isForSale 
                    ? 'bg-neutral-800 text-neutral-400 cursor-default'
                    : 'bg-white text-black hover:bg-neutral-200'
                 : isForSale 
                   ? 'bg-indigo-600 text-white hover:bg-indigo-500'
                   : 'hidden'
             }`}
           >
             {isProcessing 
                ? "Processing..." 
                : isOwner 
                    ? (isForSale ? "Listed on Market" : "List Item") 
                    : "Buy Now"}
           </button>
        </div>
      </div>

      {/* Card Details Footer */}
      <div className="p-4 flex flex-col gap-3">
        <div>
           <div className="flex items-center justify-between mb-1">
             <span className="text-[11px] font-bold text-neutral-500 uppercase tracking-wide truncate pr-2">{asset.org}</span>
             {isOwner && <span className="text-[10px] bg-neutral-800 text-neutral-300 px-1.5 py-0.5 rounded">YOU</span>}
           </div>
           <h3 className="text-white font-display font-semibold text-sm truncate leading-tight">{asset.metadata.name}</h3>
        </div>

        {/* Price Section */}
        <div className="bg-white/5 rounded-lg p-3 flex justify-between items-end">
            <div className="flex flex-col">
                <span className="text-[10px] text-neutral-500 font-medium mb-0.5">Price</span>
                <div className="flex items-baseline gap-1">
                    {isForSale ? (
                        <>
                            <span className="text-sm font-bold text-white">{asset.price}</span>
                            <span className="text-xs text-neutral-400">ETH</span>
                        </>
                    ) : (
                        <span className="text-xs text-neutral-500 italic">Unlisted</span>
                    )}
                </div>
            </div>
            {/* Last Sale Mock Data */}
            <div className="flex flex-col items-end text-right">
                <span className="text-[10px] text-neutral-500 font-medium mb-0.5">Last Sale</span>
                <span className="text-xs text-neutral-400 font-mono">{(parseFloat(asset.price) * 0.8).toFixed(2)} ETH</span>
            </div>
        </div>
      </div>
    </div>
  );
};