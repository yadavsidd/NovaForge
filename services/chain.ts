import { ethers } from "ethers";
import { GeneratedAsset, AirdropMetadata, Organization } from "../types";
import { uploadToIPFS, resolveIPFS } from "./storage";
import { CONTRACT_ADDRESSES, NFT_ABI, MARKETPLACE_ABI, TARGET_CHAIN_ID, TARGET_CHAIN_NAME } from "./web3-config";

// --- Types for Window.ethereum ---
declare global {
  interface Window {
    ethereum: any;
  }
}

// --- MOCK DATA (Fallback) ---
const MOCK_INVENTORY: GeneratedAsset[] = [
  {
      id: "0",
      metadata: { name: "Obsidian Core", ticker: "OBS", description: "Genesis Block Artifact", rarity: "Legendary" },
      image: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=1000&auto=format&fit=crop",
      org: "Obsidian Syndicate",
      timestamp: Date.now(),
      price: "0.05",
      owner: null,
      isListed: true
  }
];

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

export const fetchOrganizations = async (): Promise<Organization[]> => {
  return [
    "Obsidian Syndicate",
    "Nexus Prime",
    "Aegis Vanguard",
    "Cipher Architects",
    "Terraform Grid"
  ];
};

/**
 * 100% ON-CHAIN INVENTORY FETCH
 * Scans the blockchain for Transfer events to build the user's inventory.
 * No database required.
 */
export const fetchUserInventory = async (): Promise<GeneratedAsset[]> => {
  // If contracts aren't configured, return mock data for UI demo
  if (CONTRACT_ADDRESSES.nft === "0x0000000000000000000000000000000000000000") {
    console.warn("Contracts not deployed. Using Mock Data.");
    return MOCK_INVENTORY;
  }

  if (!window.ethereum) return [];

  try {
    const provider = new ethers.BrowserProvider(window.ethereum);
    const signer = await provider.getSigner().catch(() => null);
    
    if (!signer) return []; 
    const address = await signer.getAddress();
    
    const nftContract = new ethers.Contract(CONTRACT_ADDRESSES.nft, NFT_ABI, provider);

    // 1. Find all "Transfer" events where 'to' is the current user
    const filter = nftContract.filters.Transfer(null, address);
    const events = await nftContract.queryFilter(filter);
    
    // 2. Get unique Token IDs from these events
    const uniqueTokenIds = new Set<string>();
    const assets: GeneratedAsset[] = [];

    // Reverse order to show newest first
    for (let i = events.length - 1; i >= 0; i--) {
      const tokenId = (events[i] as any).args[2].toString();
      
      if (uniqueTokenIds.has(tokenId)) continue;
      uniqueTokenIds.add(tokenId);

      try {
        // 3. Verify current ownership (user might have sold it since receiving it)
        const currentOwner = await nftContract.ownerOf(tokenId);
        if (currentOwner.toLowerCase() !== address.toLowerCase()) continue;

        // 4. Fetch Token URI & Metadata from IPFS
        const tokenUri = await nftContract.tokenURI(tokenId);
        const resolvedUri = resolveIPFS(tokenUri);

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
            org: metadata.attributes?.find((a: any) => a.trait_type === "Organization")?.value || "Unknown",
            timestamp: Date.now(),
            price: "0",
            owner: address,
            isListed: false
          });
        }
      } catch (err) {
        console.warn(`Failed to load token ${tokenId}`, err);
      }
    }

    return assets;
  } catch (e) {
    console.error("Failed to fetch on-chain inventory:", e);
    return MOCK_INVENTORY;
  }
};

export const fetchUpcomingDrops = async () => {
  return [
    { id: "drop_1", name: "CyberDeck DAO", date: "2d 14h" },
    { id: "drop_2", name: "Neon Pulse", date: "5d 09h" }
  ];
};

/**
 * REAL MINT FUNCTION
 * 1. Uploads to IPFS (Real Pinata)
 * 2. Calls Mint on Sepolia
 */
export const mintToken = async (
  org: Organization, 
  metadata: AirdropMetadata, 
  image: string,
  ownerAddress: string
): Promise<GeneratedAsset> => {
  
  // 1. IPFS Upload
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

  // 2. Blockchain Transaction
  console.log("Initiating Transaction...");
  const provider = new ethers.BrowserProvider(window.ethereum);
  const signer = await provider.getSigner();
  
  if (CONTRACT_ADDRESSES.nft === "0x0000000000000000000000000000000000000000") {
    alert("Contract address not set! Check services/web3-config.ts");
    throw new Error("Contracts not deployed");
  }

  const nftContract = new ethers.Contract(CONTRACT_ADDRESSES.nft, NFT_ABI, signer);

  // Call mint(to, uri)
  const tx = await nftContract.mint(ownerAddress, metadataCid);
  console.log("Tx Hash:", tx.hash);
  
  await tx.wait();

  return {
    id: tx.hash,
    metadata: metadata,
    image: image, 
    org: org,
    timestamp: Date.now(),
    price: "0",
    owner: ownerAddress,
    isListed: false
  };
};

export const buyAsset = async (assetId: string, buyerAddress: string): Promise<void> => {
  const provider = new ethers.BrowserProvider(window.ethereum);
  const signer = await provider.getSigner();
  const marketplace = new ethers.Contract(CONTRACT_ADDRESSES.marketplace, MARKETPLACE_ABI, signer);

  if (assetId.length > 10 && isNaN(Number(assetId))) {
    alert("This is a demo artifact (Mock ID). Real on-chain buying requires a minted Item ID.");
    return;
  }

  const priceInWei = ethers.parseEther("0.01"); 
  const tx = await marketplace.buyNFT(assetId, { value: priceInWei });
  await tx.wait();
};

export const listAsset = async (assetId: string, price: string): Promise<void> => {
   if (assetId.length > 10 && isNaN(Number(assetId))) {
    alert("Cannot list demo artifacts on real chain. Mint a new token first.");
    return;
  }

  const provider = new ethers.BrowserProvider(window.ethereum);
  const signer = await provider.getSigner();
  
  const nftContract = new ethers.Contract(CONTRACT_ADDRESSES.nft, NFT_ABI, signer);
  const marketplace = new ethers.Contract(CONTRACT_ADDRESSES.marketplace, MARKETPLACE_ABI, signer);

  // 1. Approve Marketplace
  console.log("Approving Marketplace...");
  const approvalTx = await nftContract.approve(CONTRACT_ADDRESSES.marketplace, assetId);
  await approvalTx.wait();

  // 2. List Item
  console.log("Listing Item...");
  const priceInWei = ethers.parseEther(price);
  const tx = await marketplace.listNFT(CONTRACT_ADDRESSES.nft, assetId, priceInWei);
  await tx.wait();
};

export const deployProtocol = async (name: string, ticker: string): Promise<Organization> => {
  return name;
};

export const registerForDrop = async (dropId: string): Promise<boolean> => {
  const provider = new ethers.BrowserProvider(window.ethereum);
  const signer = await provider.getSigner();
  await signer.signMessage(`Registering for drop: ${dropId}`);
  return true;
};