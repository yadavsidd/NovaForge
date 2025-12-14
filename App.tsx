import React, { useState, useEffect } from 'react';
import { GeneratedAsset, Organization, AirdropMetadata, ActivityItem } from './types';
import { 
  fetchOrganizations, 
  fetchUserInventory, 
  fetchMarketActivity,
  mintToken, 
  connectWallet, 
  deployProtocol,
  buyAsset,
  listAsset,
  loadCollection
} from './services/chain';
import { Button } from './components/Button';
import { AssetCard } from './components/AssetCard';
import { Navbar } from './components/Navbar';
import { Sidebar } from './components/Sidebar';
import { Dropdown } from './components/Dropdown';
import { CreateDropModal } from './components/CreateDropModal';
import { MintModal } from './components/MintModal';
import { BuyModal } from './components/BuyModal';
import { ListModal } from './components/ListModal';

// --- Toast Component (Internal) ---
const Toast: React.FC<{ message: string; type: 'success' | 'error'; onClose: () => void }> = ({ message, type, onClose }) => {
  useEffect(() => {
    const timer = setTimeout(onClose, 5000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 px-6 py-4 rounded-xl border shadow-2xl backdrop-blur-md animate-slide-up ${
      type === 'success' ? 'bg-green-500/10 border-green-500/20 text-green-400' : 'bg-red-500/10 border-red-500/20 text-red-400'
    }`}>
      <span className={`w-2 h-2 rounded-full ${type === 'success' ? 'bg-green-500' : 'bg-red-500'} animate-pulse`}></span>
      <p className="text-sm font-medium">{message}</p>
      <button onClick={onClose} className="opacity-50 hover:opacity-100 ml-2">✕</button>
    </div>
  );
};

const App: React.FC = () => {
  // Chain Data
  const [availableOrgs, setAvailableOrgs] = useState<Organization[]>([]);
  const [inventory, setInventory] = useState<GeneratedAsset[]>([]);
  const [activity, setActivity] = useState<ActivityItem[]>([]);
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  
  // UI State
  const [selectedOrg, setSelectedOrg] = useState<string | null>(null);
  const [isDropModalOpen, setIsDropModalOpen] = useState(false);
  const [isMintModalOpen, setIsMintModalOpen] = useState(false);
  const [buyModalAsset, setBuyModalAsset] = useState<GeneratedAsset | null>(null);
  const [listModalAsset, setListModalAsset] = useState<GeneratedAsset | null>(null);
  const [viewMode, setViewMode] = useState<'items' | 'activity'>('items');
  const [navigationView, setNavigationView] = useState<'market' | 'owned'>('market');
  const [toast, setToast] = useState<{message: string, type: 'success'|'error'} | null>(null);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [rarityFilter, setRarityFilter] = useState('All');
  const [sortOrder, setSortOrder] = useState<'newest' | 'price_asc' | 'price_desc'>('newest');

  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ message, type });
  };

  const refreshData = async () => {
      try {
        const [orgs, assets, act] = await Promise.all([
          fetchOrganizations(),
          fetchUserInventory(),
          fetchMarketActivity()
        ]);
        setAvailableOrgs(orgs);
        // Auto-select first org if available
        if (orgs.length > 0 && !selectedOrg) setSelectedOrg(orgs[0]);
        setInventory(assets);
        setActivity(act);
      } catch (e) {
        console.error("Failed to connect to chain", e);
      }
  };

  useEffect(() => {
    refreshData();
  }, [selectedOrg]);

  const handleConnect = async () => {
    try {
      const address = await connectWallet();
      setWalletAddress(address);
      refreshData();
      showToast("Wallet Connected Successfully", "success");
    } catch (e) {
      console.error(e);
      showToast("Connection Rejected", "error");
    }
  };

  const handleDeployProtocol = async (name: string, ticker: string) => {
    if (!walletAddress) return;
    try {
      const newOrgName = await deployProtocol(name, ticker);
      setAvailableOrgs([newOrgName]);
      setSelectedOrg(newOrgName);
      await refreshData();
      showToast(`Collection ${name} Created`, "success");
    } catch (e) {
      showToast("Deployment Failed", "error");
    }
  };

  const handleImportCollection = async (address: string) => {
     try {
         const name = await loadCollection(address);
         setAvailableOrgs([name]);
         setSelectedOrg(name);
         await refreshData();
         showToast("Collection Loaded", "success");
     } catch (e) {
         showToast("Invalid Contract Address", "error");
     }
  };

  const handleManualMint = async (metadata: AirdropMetadata, imageBase64: string) => {
    if (!walletAddress) return;
    const targetOrg = selectedOrg || availableOrgs[0];
    if (!targetOrg) {
        showToast("No collection loaded", "error");
        return;
    }

    try {
      const newItem = await mintToken(targetOrg, metadata, imageBase64, walletAddress);
      setInventory(prev => [newItem, ...prev]);
      showToast("Asset Minted Successfully", "success");
    } catch (error) {
      console.error(error);
      showToast("Minting Failed", "error");
    }
  };

  const openBuyModal = async (asset: GeneratedAsset) => {
    if (!walletAddress) {
      await handleConnect();
      return;
    }
    if (!asset.isListed) return;
    setBuyModalAsset(asset);
  };

  const handleConfirmBuy = async (asset: GeneratedAsset) => {
    if (!walletAddress) return;

    try {
      await buyAsset(asset.id, asset.price);
      setInventory(prev => prev.map(item => 
        item.id === asset.id 
          ? { ...item, owner: walletAddress, isListed: false, seller: null } 
          : item
      ));
      showToast(`Successfully bought ${asset.metadata.name}`, "success");
    } catch (e: any) {
      console.error("Buy failed", e);
      showToast(e.message || "Purchase Failed", "error");
    }
  };

  const handleListAsset = async (asset: GeneratedAsset) => {
    if (!walletAddress) return;
    
    if (asset.isListed) {
        showToast("Delisting is not supported. Please buy the item back.", "error");
    } else {
        setListModalAsset(asset);
    }
  };

  const handleConfirmListing = async (asset: GeneratedAsset, price: string) => {
      if (!walletAddress) return;
      try {
          await listAsset(asset.id, price);
          setInventory(prev => prev.map(item => 
              item.id === asset.id 
              ? { ...item, isListed: true, price: price, seller: walletAddress } 
              : item
          ));
          showToast(`Item listed for ${price} ETH`, "success");
      } catch (e: any) {
          console.error("Listing failed", e);
          showToast(e.message || "Listing Failed", "error");
      }
  };

  // --- Derived State & Computations ---
  const filteredInventory = inventory.filter(i => {
    // 1. Filter by View Mode (Market vs Owned)
    if (navigationView === 'owned') {
        if (!walletAddress) return false;
        
        // Check if I own it physically OR if I am selling it (so it's technically owned by market, but I listed it)
        const isOwner = i.owner?.toLowerCase() === walletAddress.toLowerCase();
        const isSeller = i.seller?.toLowerCase() === walletAddress.toLowerCase();
        
        if (!isOwner && !isSeller) {
            return false;
        }
    }

    // 2. Search
    const matchesSearch = i.metadata.name.toLowerCase().includes(searchQuery.toLowerCase()) || i.metadata.ticker.toLowerCase().includes(searchQuery.toLowerCase());
    
    // 3. Rarity
    const matchesRarity = rarityFilter === 'All' ? true : i.metadata.rarity === rarityFilter;
    
    return matchesSearch && matchesRarity;
  });

  const sortedInventory = [...filteredInventory].sort((a, b) => {
    if (sortOrder === 'newest') return b.timestamp - a.timestamp;
    if (sortOrder === 'price_asc') return parseFloat(a.price) - parseFloat(b.price);
    if (sortOrder === 'price_desc') return parseFloat(b.price) - parseFloat(a.price);
    return 0;
  });

  const floorPrice = inventory
    .filter(i => i.isListed)
    .reduce((min, i) => Math.min(min, parseFloat(i.price)), 999);
  
  const displayFloor = floorPrice === 999 ? '-' : floorPrice.toFixed(3);
  const totalVolume = activity.length * 0.05; 

  const handleNavigationChange = (view: 'market' | 'owned') => {
      setNavigationView(view);
      setViewMode('items'); // Ensure we are on items view if switching nav
  };

  return (
    <div className="min-h-screen flex flex-col font-sans bg-[#080808]">
      <Navbar 
        walletAddress={walletAddress} 
        onConnect={handleConnect} 
        onCreateDrop={() => setIsDropModalOpen(true)}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
      />

      <div className="flex flex-1 overflow-hidden">
        <Sidebar 
          availableOrgs={availableOrgs} 
          selectedOrg={selectedOrg} 
          onSelectOrg={setSelectedOrg} 
          onImportOrg={handleImportCollection}
          currentView={navigationView}
          onNavigate={handleNavigationChange}
          walletConnected={!!walletAddress}
        />

        <main className="flex-1 overflow-y-auto bg-transparent scroll-smooth">
          
          {/* Featured Hero Section */}
          <div className="relative h-[300px] md:h-[400px] w-full overflow-hidden bg-black">
             {/* Background Image */}
             <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1639322537228-f710d846310a?q=80&w=2000&auto=format&fit=crop')] bg-cover bg-center opacity-40"></div>
             <div className="absolute inset-0 bg-gradient-to-t from-[#080808] via-transparent to-transparent"></div>
             
             <div className="relative z-10 h-full max-w-7xl mx-auto px-8 md:px-12 flex flex-col justify-end pb-12">
                <div className="flex items-end gap-6 animate-fade-in-up">
                    {/* Collection Icon */}
                    <div className="h-24 w-24 md:h-32 md:w-32 rounded-2xl border-4 border-white/20 shadow-2xl overflow-hidden bg-neutral-900 shrink-0 flex items-center justify-center">
                         {selectedOrg ? (
                            <img 
                                src="https://images.unsplash.com/photo-1618172193763-c511deb635ca?q=80&w=400&auto=format&fit=crop" 
                                alt="Collection Icon" 
                                className="w-full h-full object-cover" 
                            />
                         ) : (
                             <div className="bg-neutral-800 w-full h-full flex items-center justify-center">
                                 <svg className="w-8 h-8 text-neutral-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                 </svg>
                             </div>
                         )}
                    </div>
                    <div className="mb-2">
                        <div className="flex items-center gap-3 mb-2">
                            {navigationView === 'owned' && <span className="text-xs font-bold bg-indigo-600 text-white px-2 py-0.5 rounded uppercase tracking-wider">My Portfolio</span>}
                            {navigationView === 'market' && <span className="text-xs font-bold bg-white/10 text-white px-2 py-0.5 rounded uppercase tracking-wider">Marketplace</span>}
                        </div>
                        <h1 className="text-4xl md:text-5xl font-display font-bold text-white mb-2 shadow-sm drop-shadow-lg">
                             {navigationView === 'owned' ? "Siddhant's Wallet" : (selectedOrg || 'No Collection Loaded')}
                        </h1>
                        {selectedOrg && (
                          <div className="flex items-center gap-4 text-white/90">
                             <span className="flex items-center gap-1.5">
                                <span className="text-neutral-400 text-sm">Contract</span> 
                                <span className="font-bold border-b border-white/30">Verified</span>
                             </span>
                             <button onClick={() => setIsMintModalOpen(true)} className="bg-indigo-600 hover:bg-indigo-500 px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider transition-colors ml-4 shadow-[0_0_15px_rgba(79,70,229,0.4)]">
                                + Mint Item
                             </button>
                          </div>
                        )}
                    </div>
                </div>
             </div>
          </div>

          <div className="max-w-7xl mx-auto px-8 md:px-12 py-8">
            
            {/* Stats Bar */}
            {selectedOrg && (
             <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                 {[
                    { label: 'Floor Price', value: `${displayFloor} ETH` },
                    { label: 'Total Volume', value: `${totalVolume.toFixed(2)} ETH` },
                    { label: 'Items', value: filteredInventory.length.toString() },
                    { label: 'Owners', value: Math.floor(inventory.length * 0.7).toString() }
                 ].map((stat) => (
                    <div key={stat.label} className="bg-white/5 border border-white/5 rounded-xl p-4 hover:bg-white/10 transition-colors cursor-default">
                        <div className="text-xs text-neutral-500 uppercase font-bold tracking-wider mb-1">{stat.label}</div>
                        <div className="text-xl md:text-2xl font-mono font-bold text-white">{stat.value}</div>
                    </div>
                 ))}
             </div>
            )}

            {viewMode === 'items' ? (
              <>
                {/* Filter Toolbar */}
                <div className="sticky top-0 z-20 bg-[#080808]/90 backdrop-blur-xl py-4 mb-6 flex flex-wrap gap-4 items-center justify-between border-b border-white/5">
                  <div className="flex items-center gap-2">
                     <span className="text-white font-bold text-lg">{filteredInventory.length} Items</span>
                     {searchQuery && <span className="text-neutral-500 text-sm">matching "{searchQuery}"</span>}
                  </div>

                  <div className="flex items-center gap-3">
                    <Dropdown
                        value={rarityFilter}
                        onChange={setRarityFilter}
                        options={[
                            { label: 'All Rarities', value: 'All' },
                            { label: 'Common', value: 'Common' },
                            { label: 'Rare', value: 'Rare' },
                            { label: 'Epic', value: 'Epic' },
                            { label: 'Legendary', value: 'Legendary' },
                        ]}
                        icon={
                            <svg className="w-4 h-4 text-neutral-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                            </svg>
                        }
                    />

                    <div className="h-6 w-[1px] bg-white/10 mx-1"></div>

                    <Dropdown
                        value={sortOrder}
                        onChange={(val) => setSortOrder(val as any)}
                        options={[
                            { label: 'Recently Listed', value: 'newest' },
                            { label: 'Price: Low to High', value: 'price_asc' },
                            { label: 'Price: High to Low', value: 'price_desc' },
                        ]}
                        icon={
                            <svg className="w-4 h-4 text-neutral-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4h13M3 8h9m-9 4h6m4 0l4-4m0 0l4 4m-4-4v12" />
                            </svg>
                        }
                    />

                     <button 
                        onClick={() => setViewMode('activity')}
                        className="bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white hover:bg-white/10 transition-colors font-bold flex items-center gap-2"
                     >
                        <svg className="w-4 h-4 text-neutral-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                             <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                        </svg>
                        Activity
                     </button>
                  </div>
                </div>

                {/* Grid */}
                {sortedInventory.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-6 pb-20">
                    {sortedInventory.map((asset) => (
                      <AssetCard 
                        key={asset.id} 
                        asset={asset} 
                        currentUser={walletAddress}
                        onBuy={openBuyModal}
                        onList={handleListAsset}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-20 text-neutral-500">
                    {selectedOrg ? (
                        <>
                            <div className="w-16 h-16 border border-neutral-800 rounded-full flex items-center justify-center mb-4">
                                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                                </svg>
                            </div>
                            <p className="mb-4">
                                {navigationView === 'owned' 
                                  ? "You don't own any items in this collection." 
                                  : "No items found in this collection."}
                            </p>
                            {navigationView === 'market' && <Button onClick={() => setIsMintModalOpen(true)}>Mint First Item</Button>}
                        </>
                    ) : (
                        <>
                             <p className="text-lg text-white mb-2">Welcome to NovaForge.</p>
                             <p className="max-w-md text-center">To get started, please <span className="text-white font-bold">Import a Contract</span> using the sidebar or <span className="text-white font-bold">Create a Collection</span>.</p>
                        </>
                    )}
                  </div>
                )}
              </>
            ) : (
              /* Activity Feed */
              <div className="flex flex-col gap-6">
                 <div className="flex items-center justify-between mb-4">
                     <h2 className="text-2xl font-bold text-white">Market Activity</h2>
                     <button onClick={() => setViewMode('items')} className="text-sm text-indigo-400 hover:text-indigo-300">Back to Items</button>
                 </div>
                 <div className="bg-[#111] border border-white/5 rounded-xl overflow-hidden">
                    <div className="grid grid-cols-5 bg-white/5 p-4 text-xs font-bold text-neutral-400 uppercase tracking-wider">
                       <div className="col-span-2">Item</div>
                       <div>Price</div>
                       <div>From/To</div>
                       <div className="text-right">Time</div>
                    </div>
                    {activity.length > 0 ? (
                       activity.map((item) => (
                          <div key={item.id} className="grid grid-cols-5 p-4 border-t border-white/5 hover:bg-white/5 transition-colors items-center group">
                             <div className="col-span-2 flex items-center gap-4">
                                <div className="w-10 h-10 bg-neutral-800 rounded-lg flex items-center justify-center text-lg shadow-inner">
                                   {item.type === 'SALE' ? '🛒' : '✨'}
                                </div>
                                <div>
                                   <div className="text-white font-bold group-hover:text-indigo-400 transition-colors">{item.itemName}</div>
                                   <div className="text-xs text-neutral-500 font-mono">{item.type}</div>
                                </div>
                             </div>
                             <div className="font-mono text-white font-bold">{item.price ? `${item.price} ETH` : '-'}</div>
                             <div className="text-xs font-mono text-indigo-400">
                                <span className="text-neutral-500">From: </span>{item.from === 'Null' ? 'NullAddress' : item.from.slice(0,6)}
                             </div>
                             <div className="text-right text-xs text-neutral-500">
                                {new Date(item.timestamp).toLocaleDateString()}
                             </div>
                          </div>
                       ))
                    ) : (
                       <div className="p-8 text-center text-neutral-500 text-sm">No recent activity recorded on-chain.</div>
                    )}
                 </div>
              </div>
            )}
            
          </div>
        </main>
      </div>

      <CreateDropModal 
        isOpen={isDropModalOpen}
        onClose={() => setIsDropModalOpen(false)}
        onDeploy={handleDeployProtocol}
      />

      <MintModal 
        isOpen={isMintModalOpen}
        onClose={() => setIsMintModalOpen(false)}
        onSubmit={handleManualMint}
        selectedOrg={selectedOrg || 'Unknown'} 
      />

      <BuyModal
        isOpen={!!buyModalAsset}
        onClose={() => setBuyModalAsset(null)}
        asset={buyModalAsset}
        onConfirm={handleConfirmBuy}
      />

      <ListModal
        isOpen={!!listModalAsset}
        onClose={() => setListModalAsset(null)}
        asset={listModalAsset}
        onConfirm={handleConfirmListing}
      />

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
};

export default App;