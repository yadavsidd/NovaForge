// --------------------------------------------------------
// ⚠️ IMPORTANT: UPDATE THESE ADDRESSES AFTER DEPLOYING ⚠️
// --------------------------------------------------------
export const CONTRACT_ADDRESSES = {
  // Replace these strings with your deployed contract addresses from Remix
  nft: "0x50e12AB40Af6E862664530842bB33C293E0Af0a1", 
  marketplace: "0xcFE2956809f7AAA0a49A8CFc7870120832E26234"
};

export const NFT_ABI = [
  "function mint(address to, string memory uri) public returns (uint256)",
  "function approve(address to, uint256 tokenId) public",
  "function tokenURI(uint256 tokenId) public view returns (string)",
  "function ownerOf(uint256 tokenId) public view returns (address)"
];

export const MARKETPLACE_ABI = [
  "function listNFT(address nftContract, uint256 tokenId, uint256 price) external",
  "function buyNFT(uint256 itemId) external payable",
  "event ItemListed(uint256 indexed itemId, address indexed nftContract, uint256 tokenId, uint256 price, address seller)",
  "event ItemSold(uint256 indexed itemId, address indexed buyer, uint256 price)"
];

// Chain ID for Sepolia (11155111)
export const TARGET_CHAIN_ID = "0xaa36a7"; 
export const TARGET_CHAIN_NAME = "Sepolia Testnet";