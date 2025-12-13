import React from 'react';

interface RarityBadgeProps {
  rarity: string;
}

export const RarityBadge: React.FC<RarityBadgeProps> = ({ rarity }) => {
  // Monochrome hierarchy
  const colors = {
    Common: "bg-black text-neutral-500 border-neutral-800",
    Rare: "bg-neutral-900 text-neutral-300 border-neutral-600",
    Epic: "bg-neutral-800 text-white border-neutral-400",
    Legendary: "bg-white text-black border-white shadow-[0_0_10px_rgba(255,255,255,0.4)]",
  };
  const colorClass = colors[rarity as keyof typeof colors] || colors.Common;

  return (
    <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${colorClass} uppercase tracking-wider`}>
      {rarity}
    </span>
  );
};