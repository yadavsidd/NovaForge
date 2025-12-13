import React, { useState, useEffect } from 'react';
import { GeneratedAsset, Organization, AirdropMetadata } from './types';
import { 
  fetchOrganizations, 
  fetchUserInventory, 
  fetchUpcomingDrops,
  mintToken, 
  connectWallet, 
  deployProtocol,
  buyAsset,
  listAsset,
  registerForDrop
} from './services/chain';
import { Button } from './components/Button';
import { AssetCard } from './components/AssetCard';
import { Navbar } from './components/Navbar';
import { Sidebar } from './components/Sidebar';
import { CreateDropModal } from './components/CreateDropModal';
import { MintModal } from './components/MintModal';

const App: React.FC = () => {
  // State from "Chain"
  const [availableOrgs, setAvailableOrgs] = useState<Organization[]>([]);
  const [inventory, setInventory] = useState<GeneratedAsset[]>([]);
  const [upcomingDrops, setUpcomingDrops] = useState<{ id: string, name: string, date: string }[]>([]);
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  
  // UI State
  const [selectedOrg, setSelectedOrg] = useState<string | null>(null);
  const [isDropModalOpen, setIsDropModalOpen] = useState(false);
  const [isMintModalOpen, setIsMintModalOpen] = useState(false);

  useEffect(() => {
    const initChainData = async () => {
      try {
        const [orgs, assets, drops] = await Promise.all([
          fetchOrganizations(),
          fetchUserInventory(),
          fetchUpcomingDrops()
        ]);
        setAvailableOrgs(orgs);
        setInventory(assets);
        setUpcomingDrops(drops);
        if (orgs.length > 0) setSelectedOrg(orgs[0]);
      } catch (e) {
        console.error("Failed to connect to chain", e);
      }
    };
    initChainData();
  }, []);

  const handleConnect = async () => {
    try {
      const address = await connectWallet();
      setWalletAddress(address);
    } catch (e) {
      console.error("User rejected connection", e);
    }
  };

  const handleDeployProtocol = async (name: string, ticker: string) => {
    if (!walletAddress) return;
    try {
      const newOrg = await deployProtocol(name, ticker);
      setAvailableOrgs(prev => [...prev, newOrg]);
      setSelectedOrg(newOrg);
    } catch (e) {
      console.error("Deployment failed", e);
    }
  };

  const handleManualMint = async (metadata: AirdropMetadata, imageBase64: string) => {
    if (!walletAddress || !selectedOrg) return;

    try {
      const newItem = await mintToken(selectedOrg, metadata, imageBase64, walletAddress);
      setInventory(prev => [newItem, ...prev]);
    } catch (error) {
      console.error(error);
      alert("Minting failed. Please check your wallet.");
    }
  };

  const handleBuyAsset = async (asset: GeneratedAsset) => {
    if (!walletAddress) {
      await handleConnect();
      return;
    }
    if (!asset.isListed) return;

    try {
      await buyAsset(asset.id, walletAddress);
      setInventory(prev => prev.map(item => 
        item.id === asset.id 
          ? { ...item, owner: walletAddress, isListed: false } 
          : item
      ));
    } catch (e) {
      console.error("Buy failed", e);
    }
  };

  const handleListAsset = async (asset: GeneratedAsset) => {
    if (!walletAddress) return;
    try {
      const newPrice = asset.isListed ? asset.price : (Math.random() + 0.1).toFixed(3);
      await listAsset(asset.id, newPrice);

      setInventory(prev => prev.map(item => 
        item.id === asset.id 
          ? { ...item, isListed: !item.isListed, price: newPrice } 
          : item
      ));
    } catch (e) {
      console.error("Listing failed", e);
    }
  };

  const handleRegisterDrop = async (dropId: string) => {
    if (!walletAddress) {
       await handleConnect();
       return;
    }
    try {
      await registerForDrop(dropId);
    } catch (e) {
      console.error("Drop registration failed", e);
    }
  };

  const filteredInventory = selectedOrg 
    ? inventory.filter(i => i.org === selectedOrg)
    : inventory;

  return (
    <div className="min-h-screen flex flex-col font-sans">
      <Navbar 
        walletAddress={walletAddress} 
        onConnect={handleConnect} 
        onCreateDrop={() => setIsDropModalOpen(true)}
      />

      <div className="flex flex-1 overflow-hidden">
        <Sidebar 
          availableOrgs={availableOrgs} 
          selectedOrg={selectedOrg} 
          onSelectOrg={setSelectedOrg} 
          upcomingDrops={upcomingDrops}
          onRegisterDrop={handleRegisterDrop}
        />

        <main className="flex-1 overflow-y-auto bg-transparent scroll-smooth">
          
          {/* Hero Header */}
          <div className="relative pt-20 pb-12 px-8 md:px-12 border-b border-white/5">
             <div className="absolute inset-0 bg-gradient-to-b from-indigo-900/10 to-transparent pointer-events-none"></div>
             
             <div className="relative z-10 max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-end gap-6">
                <div>
                   <div className="flex items-center gap-2 mb-4">
                      <span className="px-2 py-1 rounded border border-indigo-500/30 bg-indigo-500/10 text-indigo-300 text-[10px] font-bold uppercase tracking-wider">
                         Verification Live
                      </span>
                   </div>
                   <h1 className="text-5xl md:text-6xl font-display font-bold text-white mb-4 tracking-tight">
                      {selectedOrg || 'Marketplace'}
                   </h1>
                   <p className="text-neutral-400 max-w-xl text-lg leading-relaxed">
                      Discover, collect, and govern unique digital artifacts secured by the Sepolia testnet.
                   </p>
                </div>
                
                <div className="flex gap-4">
                   <div className="flex flex-col items-end px-6 border-r border-white/10">
                      <span className="text-3xl font-bold text-white font-display">12.5k</span>
                      <span className="text-xs text-neutral-500 uppercase tracking-widest font-bold">Items</span>
                   </div>
                   <div className="flex flex-col items-end px-6">
                      <span className="text-3xl font-bold text-white font-display">420</span>
                      <span className="text-xs text-neutral-500 uppercase tracking-widest font-bold">Owners</span>
                   </div>
                </div>
             </div>
          </div>

          {/* Content Area */}
          <div className="max-w-7xl mx-auto px-8 md:px-12 py-12">
            
            {/* Action Bar */}
            <div className="flex items-center justify-between mb-8">
               <h2 className="text-xl font-display font-bold text-white flex items-center gap-3">
                  Market Items
                  <span className="text-xs bg-white/10 text-white px-2 py-1 rounded-full">{filteredInventory.length}</span>
               </h2>
               
               <div className="flex gap-2">
                  <button onClick={() => walletAddress && setIsMintModalOpen(true)} className="flex items-center gap-2 bg-white text-black px-5 py-2.5 rounded-lg text-sm font-bold hover:bg-neutral-200 transition-colors">
                     <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                     </svg>
                     Create Item
                  </button>
               </div>
            </div>

            {/* Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
               {/* Upload Card */}
               <div 
                  onClick={() => walletAddress && setIsMintModalOpen(true)}
                  className="group relative border border-dashed border-white/10 bg-white/5 rounded-2xl flex flex-col items-center justify-center text-center cursor-pointer hover:bg-white/10 hover:border-white/30 transition-all min-h-[350px]"
               >
                  <div className="w-16 h-16 rounded-2xl bg-black border border-white/10 flex items-center justify-center mb-4 group-hover:scale-110 group-hover:border-white/50 transition-all shadow-xl">
                     <svg className="w-8 h-8 text-neutral-400 group-hover:text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4v16m8-8H4" />
                     </svg>
                  </div>
                  <h3 className="text-white font-bold text-lg">Mint New Asset</h3>
                  <p className="text-sm text-neutral-500 mt-2 max-w-[200px]">Create a new on-chain artifact for this collection</p>
               </div>

               {filteredInventory.map((asset) => (
                 <AssetCard 
                   key={asset.id} 
                   asset={asset} 
                   currentUser={walletAddress}
                   onBuy={handleBuyAsset}
                   onList={handleListAsset}
                 />
               ))}
            </div>
            
            <div className="mt-20 border-t border-white/5 pt-8 text-center text-neutral-600 text-sm">
               <p>Powered by Ethereum Sepolia • Secured by Solidity</p>
            </div>
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
    </div>
  );
};

export default App;