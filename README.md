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

To enable real on-chain functionality (Minting, Buying, Listing, Auctions), you must deploy your own smart contracts and connect them to the frontend.

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
*Secure Implementation: Supports Fixed Price Listings AND Auctions.*
```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

contract NovaMarketplace is ReentrancyGuard {
    // --- STATE ---
    struct Listing {
        uint256 itemId;
        address nftContract;
        uint256 tokenId;
        address payable seller;
        address owner;
        uint256 price;
        bool sold;
    }

    struct Auction {
        uint256 auctionId;
        address nftContract;
        uint256 tokenId;
        address payable seller;
        uint256 highestBid;
        address payable highestBidder;
        uint256 endTime;
        bool active;
        bool ended;
    }

    mapping(uint256 => Listing) public listings;
    mapping(uint256 => Auction) public auctions;
    
    uint256 public listingCount;
    uint256 public auctionCount;

    // --- EVENTS ---
    event ItemListed(uint256 indexed itemId, address indexed nftContract, uint256 tokenId, uint256 price, address seller);
    event ItemSold(uint256 indexed itemId, address indexed nftContract, uint256 tokenId, uint256 price, address indexed buyer);
    
    event AuctionCreated(uint256 indexed auctionId, address indexed nftContract, uint256 tokenId, uint256 minPrice, uint256 endTime, address seller);
    event NewBid(uint256 indexed auctionId, address indexed bidder, uint256 amount);
    event AuctionEnded(uint256 indexed auctionId, address winner, uint256 amount);

    // --- FIXED PRICE LOGIC ---
    function listNFT(address _nftContract, uint256 _tokenId, uint256 _price) external nonReentrant {
        require(_price > 0, "Price must be > 0");
        IERC721(_nftContract).transferFrom(msg.sender, address(this), _tokenId);

        listingCount++;
        listings[listingCount] = Listing(listingCount, _nftContract, _tokenId, payable(msg.sender), address(0), _price, false);
        emit ItemListed(listingCount, _nftContract, _tokenId, _price, msg.sender);
    }

    function buyNFT(uint256 _itemId) external payable nonReentrant {
        Listing storage item = listings[_itemId];
        require(msg.value == item.price, "Incorrect price");
        require(!item.sold, "Already sold");

        item.sold = true;
        item.owner = msg.sender;
        
        item.seller.transfer(msg.value);
        IERC721(item.nftContract).transferFrom(address(this), msg.sender, item.tokenId);

        emit ItemSold(_itemId, item.nftContract, item.tokenId, item.price, msg.sender);
    }

    // --- AUCTION LOGIC ---
    function createAuction(address _nftContract, uint256 _tokenId, uint256 _minPrice, uint256 _durationSeconds) external nonReentrant {
        require(_durationSeconds >= 60, "Duration too short");
        IERC721(_nftContract).transferFrom(msg.sender, address(this), _tokenId);

        auctionCount++;
        auctions[auctionCount] = Auction({
            auctionId: auctionCount,
            nftContract: _nftContract,
            tokenId: _tokenId,
            seller: payable(msg.sender),
            highestBid: _minPrice,
            highestBidder: payable(address(0)),
            endTime: block.timestamp + _durationSeconds,
            active: true,
            ended: false
        });

        emit AuctionCreated(auctionCount, _nftContract, _tokenId, _minPrice, block.timestamp + _durationSeconds, msg.sender);
    }

    function placeBid(uint256 _auctionId) external payable nonReentrant {
        Auction storage auction = auctions[_auctionId];
        require(auction.active, "Auction not active");
        require(block.timestamp < auction.endTime, "Auction ended");
        require(msg.value > auction.highestBid, "Bid too low");

        // Refund previous highest bidder
        if (auction.highestBidder != address(0)) {
            auction.highestBidder.transfer(auction.highestBid);
        }

        auction.highestBid = msg.value;
        auction.highestBidder = payable(msg.sender);

        emit NewBid(_auctionId, msg.sender, msg.value);
    }

    function endAuction(uint256 _auctionId) external nonReentrant {
        Auction storage auction = auctions[_auctionId];
        require(auction.active, "Not active");
        require(block.timestamp >= auction.endTime, "Not ended yet");
        require(!auction.ended, "Already ended");

        auction.ended = true;
        auction.active = false;

        if (auction.highestBidder != address(0)) {
            // Transfer NFT to winner, funds to seller
            IERC721(auction.nftContract).transferFrom(address(this), auction.highestBidder, auction.tokenId);
            auction.seller.transfer(auction.highestBid);
        } else {
            // No bids, return item to seller
            IERC721(auction.nftContract).transferFrom(address(this), auction.seller, auction.tokenId);
        }

        emit AuctionEnded(_auctionId, auction.highestBidder, auction.highestBid);
    }
}
```

### Step 2: Deploy via Remix IDE

1. Go to [Remix Ethereum IDE](https://remix.ethereum.org/).
2. Create the two files above in the `contracts` folder.
3. Compile both files.
4. **Deploy `NovaMarketplace`**.
   - Environment: `Injected Provider - MetaMask` (Ensure you are on Sepolia).
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

### Step 4: Enable UI Deployment (Optional)

Paste the bytecode of `NovaNFT.sol` into `services/web3-config.ts` to allow creating collections from the UI.

---

## 📡 IPFS Storage Configuration

This project requires an IPFS gateway to store images and metadata without a backend database.

1. **Sign up** for [Pinata](https://www.pinata.cloud/) (Free tier).
2. **Get API Keys** (JWT).
3. Update `services/storage.ts` to use the real Pinata API instead of the simulation code provided in the starter template.