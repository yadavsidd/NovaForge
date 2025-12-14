import { ethers } from "ethers";
import { GeneratedAsset, AirdropMetadata, Organization, ActivityItem, AuctionData } from "../types";
import { uploadToIPFS, resolveIPFS } from "./storage";
import { CONTRACT_ADDRESSES, NFT_ABI, MARKETPLACE_ABI, TARGET_CHAIN_ID, TARGET_CHAIN_NAME, NFT_BYTECODE } from "./web3-config";

// --- Types for Window.ethereum ---
declare global {
  interface Window {
    ethereum: any;
  }
}

// Track the active NFT contract
// We default to the Hardcoded config, but allow local storage override if the user deploys a NEW contract via UI.
const STORAGE_KEY_NFT = 'nova_active_nft';
let activeNftAddress = localStorage.getItem(STORAGE_KEY_NFT) || CONTRACT_ADDRESSES.nft;

// Track active Marketplace contract
const STORAGE_KEY_MARKETPLACE = 'nova_active_marketplace';
let activeMarketplaceAddress = localStorage.getItem(STORAGE_KEY_MARKETPLACE) || CONTRACT_ADDRESSES.marketplace;

export const getMarketplaceAddress = () => {
  return activeMarketplaceAddress;
};

export const setMarketplaceAddress = (address: string) => {
  if (!ethers.isAddress(address)) {
      throw new Error("Invalid Ethereum Address");
  }
  activeMarketplaceAddress = address;
  localStorage.setItem(STORAGE_KEY_MARKETPLACE, address);
};

// --- REAL BLOCKCHAIN FUNCTIONS ---

export const connectWallet = async (): Promise<string> => {
  if (!window.ethereum) throw new Error("No crypto wallet found. Please install MetaMask.");
  
  const provider = new ethers.BrowserProvider(window.ethereum);
  
  // 1. Request Account Access
  const accounts = await provider.send("eth_requestAccounts", []);
  
  // 2. Check Network & Switch to Sepolia if needed
  const network = await provider.getNetwork();
  if (network.chainId.toString() !== BigInt(TARGET_CHAIN_ID).toString()) {
    try {
      await window.ethereum.request({
        method: "wallet_switchEthereumChain",
        params: [{ chainId: TARGET_CHAIN_ID }],
      });
    } catch (switchError: any) {
      if (switchError.code === 4902) {
         alert(`Please add ${TARGET_CHAIN_NAME} to your wallet manually.`);
      }
      throw switchError;
    }
  }

  return accounts[0];
};

/**
 * Loads the name of the current active contract from the blockchain.
 */
export const fetchOrganizations = async (): Promise<Organization[]> => {
  if (!activeNftAddress || activeNftAddress === "0x0000000000000000000000000000000000000000") {
    return [];
  }

  if (!window.ethereum) return [];

  try {
    const provider = new ethers.BrowserProvider(window.ethereum);
    // Minimal ABI to get name
    const contract = new ethers.Contract(activeNftAddress, ["function name() view returns (string)"], provider);
    const name = await contract.name();
    return [name];
  } catch (e) {
    console.warn("Failed to fetch contract name", e);
    // Fallback if contract is not deployed or valid
    return ["Unknown Contract"];
  }
};

/**
 * Switch the active collection to a specific address
 */
export const loadCollection = async (address: string): Promise<string> => {
  if (!ethers.isAddress(address)) throw new Error("Invalid address format");
  
  const provider = new ethers.BrowserProvider(window.ethereum);
  const contract = new ethers.Contract(address, ["function name() view returns (string)"], provider);
  
  try {
    const name = await contract.name();
    activeNftAddress = address;
    localStorage.setItem(STORAGE_KEY_NFT, address);
    return name;
  } catch (e) {
    throw new Error("Could not load contract. Ensure it is a valid ERC721 on Sepolia.");
  }
};

/**
 * 100% ON-CHAIN INVENTORY FETCH
 */
export const fetchUserInventory = async (): Promise<GeneratedAsset[]> => {
  if (!window.ethereum) return [];
  // Basic validation to ensure we have a valid contract to query
  if (!activeNftAddress || activeNftAddress === ethers.ZeroAddress) return [];

  try {
    const provider = new ethers.BrowserProvider(window.ethereum);
    const nftContract = new ethers.Contract(activeNftAddress, NFT_ABI, provider);
    
    // 1. Fetch ALL Transfer events. This reconstructs the entire history of the collection.
    const filter = nftContract.filters.Transfer(null, null);
    const events = await nftContract.queryFilter(filter); 
    
    const uniqueTokenIds = new Set<string>();
    const assets: GeneratedAsset[] = [];
    const contractName = await nftContract.name().catch(() => "Collection");

    const marketplaceAddrLower = activeMarketplaceAddress ? activeMarketplaceAddress.toLowerCase() : "";

    // 2. Fetch Listing AND Auction Data if Marketplace is active
    const listingsMap = new Map<string, { price: string, seller: string }>();
    const auctionsMap = new Map<string, AuctionData & { seller: string }>();
    
    if (activeMarketplaceAddress && activeMarketplaceAddress !== ethers.ZeroAddress) {
        try {
            const marketplace = new ethers.Contract(activeMarketplaceAddress, MARKETPLACE_ABI, provider);
            
            // --- Fixed Listings ---
            const listFilter = marketplace.filters.ItemListed(null, activeNftAddress);
            const listEvents = await marketplace.queryFilter(listFilter);
            for (const e of listEvents) {
                const args = (e as any).args;
                // ItemListed(itemId, nftContract, tokenId, price, seller)
                const tId = args[2].toString();
                listingsMap.set(tId, { 
                  price: ethers.formatEther(args[3]),
                  seller: args[4]
                });
            }

            // --- Auctions ---
            // AuctionCreated(auctionId, nftContract, tokenId, minPrice, endTime, seller)
            const auctionFilter = marketplace.filters.AuctionCreated(null, activeNftAddress);
            const auctionEvents = await marketplace.queryFilter(auctionFilter);
            
            // We also need Bids to find highest bid
            const bidFilter = marketplace.filters.NewBid();
            const bidEvents = await marketplace.queryFilter(bidFilter);

            // We need AuctionEnded to filter out closed auctions
            const endedFilter = marketplace.filters.AuctionEnded();
            const endedEvents = await marketplace.queryFilter(endedFilter);
            const endedAuctionIds = new Set(endedEvents.map((e: any) => e.args[0].toString()));

            for (const e of auctionEvents) {
                const args = (e as any).args;
                const auctionId = args[0].toString();
                const tId = args[2].toString();

                if (endedAuctionIds.has(auctionId)) continue; // Skip ended auctions

                // Find highest bid for this auction
                let highestBid = args[3]; // start with minPrice
                let highestBidder = ethers.ZeroAddress;
                
                // Process bids for this auction
                const relevantBids = bidEvents.filter((b: any) => b.args[0].toString() === auctionId);
                if (relevantBids.length > 0) {
                    const lastBid = relevantBids[relevantBids.length - 1];
                    highestBidder = (lastBid as any).args[1];
                    highestBid = (lastBid as any).args[2];
                }

                auctionsMap.set(tId, {
                    auctionId: auctionId,
                    endTime: Number(args[4]),
                    highestBid: ethers.formatEther(highestBid),
                    highestBidder: highestBidder,
                    active: true,
                    seller: args[5]
                });
            }

        } catch (err) {
            console.warn("Could not fetch marketplace data", err);
        }
    }

    // Iterate BACKWARDS (Newest first)
    for (let i = events.length - 1; i >= 0; i--) {
      const tokenId = (events[i] as any).args[2].toString();
      
      // Deduplicate: We only want the latest state of each token
      if (uniqueTokenIds.has(tokenId)) continue;
      uniqueTokenIds.add(tokenId);

      try {
        const tokenUri = await nftContract.tokenURI(tokenId);
        const resolvedUri = resolveIPFS(tokenUri);
        const owner = await nftContract.ownerOf(tokenId);

        let isListed = false;
        let price = "0";
        let seller = null;
        let auctionInfo: AuctionData | null = null;

        // Check if marketplace owns it
        if (marketplaceAddrLower && owner.toLowerCase() === marketplaceAddrLower && marketplaceAddrLower !== ethers.ZeroAddress.toLowerCase()) {
           // It's in the marketplace contract. Is it a Fixed Listing or an Auction?
           
           // Check Auction First (Prioritize Auction if exists)
           const auc = auctionsMap.get(tokenId);
           if (auc) {
               isListed = true;
               price = auc.highestBid; // Display current bid as price
               seller = auc.seller;
               auctionInfo = {
                   auctionId: auc.auctionId,
                   endTime: auc.endTime,
                   highestBid: auc.highestBid,
                   highestBidder: auc.highestBidder,
                   active: true
               };
           } else {
               // Check Fixed Listing
               const listing = listingsMap.get(tokenId);
               if (listing) {
                 isListed = true;
                 price = listing.price;
                 seller = listing.seller;
               }
           }
        }

        if (resolvedUri) {
          const metaRes = await fetch(resolvedUri);
          const metadata = await metaRes.json();
          
          assets.push({
            id: tokenId,
            metadata: {
              name: metadata.name,
              ticker: metadata.ticker || "NFT",
              description: metadata.description,
              rarity: metadata.rarity || "Common"
            },
            image: metadata.image,
            org: contractName, 
            timestamp: (await (events[i] as any).getBlock()).timestamp * 1000,
            price: price,
            owner: owner,
            seller: seller,
            isListed: isListed,
            auction: auctionInfo
          });
        }
      } catch (err) {
        console.warn(`Failed to load token ${tokenId}`, err);
      }
    }
    
    return assets;
  } catch (e) {
    console.error("Failed to fetch on-chain inventory:", e);
    return [];
  }
};

/**
 * Fetch recent market activity
 */
export const fetchMarketActivity = async (): Promise<ActivityItem[]> => {
  if (activeMarketplaceAddress === ethers.ZeroAddress) return [];
  if (!window.ethereum) return [];

  try {
    const provider = new ethers.BrowserProvider(window.ethereum);
    const marketplace = new ethers.Contract(activeMarketplaceAddress, MARKETPLACE_ABI, provider);
    
    const soldFilter = marketplace.filters.ItemSold();
    const soldEvents = await marketplace.queryFilter(soldFilter);

    // Also fetch NewBid events for "Activity"
    const bidFilter = marketplace.filters.NewBid();
    const bidEvents = await marketplace.queryFilter(bidFilter);

    const sales = await Promise.all(soldEvents.map(async (e: any) => {
       const block = await e.getBlock();
       return {
         id: e.transactionHash,
         type: 'SALE',
         itemName: `Asset #${e.args[2]}`, 
         price: ethers.formatEther(e.args[3]),
         from: 'Marketplace',
         to: e.args[4],
         timestamp: block.timestamp * 1000,
         txHash: e.transactionHash
       };
    }));

    const bids = await Promise.all(bidEvents.map(async (e: any) => {
        const block = await e.getBlock();
        return {
          id: e.transactionHash,
          type: 'BID',
          itemName: `Auction #${e.args[0]}`,
          price: ethers.formatEther(e.args[2]),
          from: e.args[1],
          to: 'Marketplace',
          timestamp: block.timestamp * 1000,
          txHash: e.transactionHash
        };
     }));

    const all = [...sales, ...bids].sort((a,b) => b.timestamp - a.timestamp);
    return all as ActivityItem[];
  } catch (e) {
    console.error("Error fetching activity", e);
    return [];
  }
}

export const mintToken = async (
  org: Organization, 
  metadata: AirdropMetadata, 
  image: string,
  ownerAddress: string
): Promise<GeneratedAsset> => {
  
  const imageCid = await uploadToIPFS(image);
  
  const finalMetadata = {
    ...metadata,
    image: imageCid,
    attributes: [
      { trait_type: "Organization", value: org },
      { trait_type: "Rarity", value: metadata.rarity }
    ]
  };
  const metadataCid = await uploadToIPFS(JSON.stringify(finalMetadata));

  console.log("Initiating Mint Transaction...");
  const provider = new ethers.BrowserProvider(window.ethereum);
  const signer = await provider.getSigner();
  
  if (!activeNftAddress || activeNftAddress === ethers.ZeroAddress) {
    throw new Error("No Contract Deployed. Please Create a Collection first.");
  }

  const nftContract = new ethers.Contract(activeNftAddress, NFT_ABI, signer);

  const tx = await nftContract.mint(ownerAddress, metadataCid);
  await tx.wait();

  return {
    id: "pending_" + Date.now(),
    metadata: metadata,
    image: image, 
    org: org,
    timestamp: Date.now(),
    price: "0",
    owner: ownerAddress,
    seller: null,
    isListed: false
  };
};

export const buyAsset = async (tokenId: string, price: string): Promise<void> => {
  if (activeMarketplaceAddress === ethers.ZeroAddress) throw new Error("No Marketplace Configured");
  const provider = new ethers.BrowserProvider(window.ethereum);
  const signer = await provider.getSigner();
  const marketplace = new ethers.Contract(activeMarketplaceAddress, MARKETPLACE_ABI, signer);

  // We need to find the itemId mapping for this tokenId from events
  const filter = marketplace.filters.ItemListed();
  const events = await marketplace.queryFilter(filter);
  let itemId = null;
  for (let i = events.length - 1; i >= 0; i--) {
      const e = events[i] as any;
      if (e.args[2].toString() === tokenId) { 
          itemId = e.args[0]; 
          break;
      }
  }

  if (!itemId) throw new Error("Item ID not found");

  const priceInWei = ethers.parseEther(price); 
  const tx = await marketplace.buyNFT(itemId, { value: priceInWei });
  await tx.wait();
};

export const listAsset = async (assetId: string, price: string): Promise<void> => {
  if (activeMarketplaceAddress === ethers.ZeroAddress) throw new Error("No Marketplace Configured");
  const provider = new ethers.BrowserProvider(window.ethereum);
  const signer = await provider.getSigner();
  const nftContract = new ethers.Contract(activeNftAddress, NFT_ABI, signer);
  const marketplace = new ethers.Contract(activeMarketplaceAddress, MARKETPLACE_ABI, signer);

  // Approval Flow
  const isApproved = await nftContract.isApprovedForAll(await signer.getAddress(), activeMarketplaceAddress);
  if (!isApproved) {
      const tx = await nftContract.approve(activeMarketplaceAddress, assetId);
      await tx.wait();
  }

  const priceInWei = ethers.parseEther(price);
  const tx = await marketplace.listNFT(activeNftAddress, assetId, priceInWei);
  await tx.wait();
};

export const createAuction = async (assetId: string, minPrice: string, durationSeconds: number): Promise<void> => {
  if (activeMarketplaceAddress === ethers.ZeroAddress) throw new Error("No Marketplace Configured");
  const provider = new ethers.BrowserProvider(window.ethereum);
  const signer = await provider.getSigner();
  const nftContract = new ethers.Contract(activeNftAddress, NFT_ABI, signer);
  const marketplace = new ethers.Contract(activeMarketplaceAddress, MARKETPLACE_ABI, signer);

  const isApproved = await nftContract.isApprovedForAll(await signer.getAddress(), activeMarketplaceAddress);
  if (!isApproved) {
      const tx = await nftContract.approve(activeMarketplaceAddress, assetId);
      await tx.wait();
  }

  const priceInWei = ethers.parseEther(minPrice);
  const tx = await marketplace.createAuction(activeNftAddress, assetId, priceInWei, durationSeconds);
  await tx.wait();
};

export const placeBid = async (auctionId: string, amount: string): Promise<void> => {
  if (activeMarketplaceAddress === ethers.ZeroAddress) throw new Error("No Marketplace Configured");
  const provider = new ethers.BrowserProvider(window.ethereum);
  const signer = await provider.getSigner();
  const marketplace = new ethers.Contract(activeMarketplaceAddress, MARKETPLACE_ABI, signer);

  const val = ethers.parseEther(amount);
  const tx = await marketplace.placeBid(auctionId, { value: val });
  await tx.wait();
};

export const endAuction = async (auctionId: string): Promise<void> => {
  if (activeMarketplaceAddress === ethers.ZeroAddress) throw new Error("No Marketplace Configured");
  const provider = new ethers.BrowserProvider(window.ethereum);
  const signer = await provider.getSigner();
  const marketplace = new ethers.Contract(activeMarketplaceAddress, MARKETPLACE_ABI, signer);

  const tx = await marketplace.endAuction(auctionId);
  await tx.wait();
};

export const deployProtocol = async (name: string, ticker: string): Promise<Organization> => {
  if (!NFT_BYTECODE || (NFT_BYTECODE as string) === "0x") {
    alert("Cannot deploy: Bytecode missing in config. See README to fix.");
    throw new Error("Bytecode missing");
  }
  const provider = new ethers.BrowserProvider(window.ethereum);
  const signer = await provider.getSigner();
  const factory = new ethers.ContractFactory(NFT_ABI, NFT_BYTECODE, signer);
  const contract = await factory.deploy(); 
  await contract.waitForDeployment();
  const address = await contract.getAddress();
  activeNftAddress = address;
  localStorage.setItem(STORAGE_KEY_NFT, address);
  return name;
};