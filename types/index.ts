export interface AirdropMetadata {
  name: string;
  ticker: string;
  description: string;
  rarity: "Common" | "Rare" | "Epic" | "Legendary";
}

export interface GeneratedAsset {
  id: string; // Unique identifier from chain
  metadata: AirdropMetadata;
  image: string | null;
  org: string;
  timestamp: number;
  price: string; // In ETH
  owner: string | null; // null = marketplace/protocol owned, string = wallet address
  isListed: boolean;
}

export type Organization = string;