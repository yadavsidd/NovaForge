export interface AirdropMetadata {
  name: string;
  ticker: string;
  description: string;
  rarity: "Common" | "Rare" | "Epic" | "Legendary";
}

export interface AuctionData {
  auctionId: string;
  endTime: number;
  highestBid: string;
  highestBidder: string;
  active: boolean;
}

export interface GeneratedAsset {
  id: string; // Unique identifier from chain
  metadata: AirdropMetadata;
  image: string | null;
  org: string;
  timestamp: number;
  price: string; // In ETH
  owner: string | null; // The address currently holding the token (Wallet or Marketplace Contract)
  seller: string | null; // If listed/auctioned, this is the address of the user selling it
  isListed: boolean;
  auction?: AuctionData | null; // If present, this item is being auctioned
}

export interface ActivityItem {
  id: string;
  type: 'MINT' | 'LIST' | 'SALE' | 'AUCTION_START' | 'BID';
  itemName: string;
  price?: string;
  from: string;
  to: string;
  timestamp: number;
  txHash: string;
}

export type Organization = string;