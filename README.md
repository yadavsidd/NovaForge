# NovaForge ⚒️

NovaForge is a fully decentralized marketplace for creating and trading digital artifacts. 
**No Database. No Backend. 100% On-Chain & IPFS.**

This application is designed to run without a centralized server. All asset metadata is stored on IPFS, and ownership state is managed by smart contracts on the Ethereum Sepolia Testnet.

## 📦 Architecture

- **Frontend**: React + Vite (hosted via Vercel/Netlify/IPFS)
- **Blockchain**: Ethereum Sepolia (Solidity Smart Contracts)
- **Storage**: IPFS (Pinata/NFT.Storage) for images and JSON metadata
- **Identity**: MetaMask (Web3 Injection)

**There is no database.** The application reads directly from the blockchain or uses standard indexing patterns.

## 🚀 Getting Started

### 1. Prerequisites
- **Node.js** (v18+)
- **MetaMask Wallet** installed
- **Sepolia ETH** (Get it from [Google Sepolia Faucet](https://cloud.google.com/application/web3/faucet/ethereum/sepolia))

### 2. Installation

```bash
npm install
npm run dev
```

---

## 🔗 Connect to Blockchain (Deploy Contracts)

To enable real on-chain functionality (Minting, Buying, Listing), you must deploy your own smart contracts and connect them to the frontend.

### Step 1: Create Smart Contracts

You need two contracts: `NovaNFT.sol` (ERC-721) and `NovaMarketplace.sol`.

**A. NovaNFT.sol**
*Secure Implementation: Includes `Ownable` to ensure only the deployer can mint.*
```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract NovaNFT is ERC721URIStorage, Ownable {
    uint256 private _nextTokenId;

    // Sets the deployer as the initial owner
    constructor() ERC721("NovaForge", "NOVA") Ownable(msg.sender) {}

    // restricted with onlyOwner modifier
    function mint(address recipient, string memory tokenURI) public onlyOwner returns (uint256) {
        uint256 tokenId = _nextTokenId++;
        _mint(recipient, tokenId);
        _setTokenURI(tokenId, tokenURI);
        return tokenId;
    }
}
```

**B. NovaMarketplace.sol**
*Secure Implementation: Checks-Effects-Interactions pattern to prevent reentrancy.*
```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

contract NovaMarketplace is ReentrancyGuard {
    struct Item {
        uint256 itemId;
        address nftContract;
        uint256 tokenId;
        address payable seller;
        address owner;
        uint256 price;
        bool sold;
    }

    mapping(uint256 => Item) public items;
    uint256 public itemCount;

    event ItemListed(uint256 indexed itemId, address indexed nftContract, uint256 tokenId, uint256 price, address indexed seller);
    event ItemSold(uint256 indexed itemId, address indexed nftContract, uint256 tokenId, uint256 price, address indexed buyer);

    function listNFT(address _nftContract, uint256 _tokenId, uint256 _price) external nonReentrant {
        require(_price > 0, "Price must be at least 1 wei");
        require(_nftContract != address(0), "Invalid contract address");
        
        IERC721 nft = IERC721(_nftContract);
        require(nft.ownerOf(_tokenId) == msg.sender, "Not the owner");
        require(nft.isApprovedForAll(msg.sender, address(this)) || nft.getApproved(_tokenId) == address(this), "Marketplace not approved");

        itemCount++;
        
        // Transfer NFT to marketplace
        nft.transferFrom(msg.sender, address(this), _tokenId);
        
        items[itemCount] = Item(
            itemCount,
            _nftContract,
            _tokenId,
            payable(msg.sender),
            address(0),
            _price,
            false
        );

        emit ItemListed(itemCount, _nftContract, _tokenId, _price, msg.sender);
    }

    function buyNFT(uint256 _itemId) external payable nonReentrant {
        uint256 price = items[_itemId].price;
        uint256 tokenId = items[_itemId].tokenId;
        address nftContract = items[_itemId].nftContract;

        require(msg.value == price, "Please submit the asking price");
        require(!items[_itemId].sold, "Item already sold");
        
        // EFFECTS (Update state BEFORE external calls)
        items[_itemId].owner = msg.sender;
        items[_itemId].sold = true;
        
        // INTERACTIONS
        // 1. Pay the seller
        (bool success, ) = items[_itemId].seller.call{value: msg.value}("");
        require(success, "Transfer to seller failed");

        // 2. Transfer NFT to buyer
        IERC721(nftContract).transferFrom(address(this), msg.sender, tokenId);

        emit ItemSold(_itemId, nftContract, tokenId, price, msg.sender);
    }
}
```

### Step 2: Deploy via Remix IDE

1. Go to [Remix Ethereum IDE](https://remix.ethereum.org/).
2. Create the two files above in the `contracts` folder.
3. Compile both files.
4. **Deploy `NovaNFT`** first.
   - Environment: `Injected Provider - MetaMask` (Ensure you are on Sepolia).
   - Click Deploy.
   - **Copy the Contract Address**.
5. **Deploy `NovaMarketplace`**.
   - Click Deploy.
   - **Copy the Contract Address**.

### Step 3: Configure Frontend

Open `services/web3-config.ts` in this project and paste your new addresses:

```typescript
export const CONTRACT_ADDRESSES = {
  nft: "0xYourNftContractAddress...", 
  marketplace: "0xYourMarketplaceContractAddress..."
};
```

---

## 📡 IPFS Storage Configuration

This project requires an IPFS gateway to store images and metadata without a backend database.

1. **Sign up** for [Pinata](https://www.pinata.cloud/) (Free tier).
2. **Get API Keys** (JWT).
3. Update `services/storage.ts` to use the real Pinata API instead of the simulation code provided in the starter template.

*Note: The default code runs in simulation mode so the UI works immediately, but files are not actually persisted to IPFS until you uncomment the Pinata integration code.*