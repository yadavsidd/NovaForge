import React, { useState, useRef } from 'react';
import { Button } from './Button';
import { AirdropMetadata } from '../types';

interface MintModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: AirdropMetadata, imageBase64: string) => Promise<void>;
  selectedOrg: string;
}

export const MintModal: React.FC<MintModalProps> = ({ isOpen, onClose, onSubmit, selectedOrg }) => {
  const [name, setName] = useState('');
  const [ticker, setTicker] = useState('');
  const [description, setDescription] = useState('');
  const [rarity, setRarity] = useState<"Common" | "Rare" | "Epic" | "Legendary">("Common");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !ticker || !description || !previewUrl) return;

    setLoading(true);
    try {
      const metadata: AirdropMetadata = {
        name,
        ticker: ticker.toUpperCase(),
        description,
        rarity
      };
      await onSubmit(metadata, previewUrl);
      onClose();
      // Reset form
      setName('');
      setTicker('');
      setDescription('');
      setRarity('Common');
      setImageFile(null);
      setPreviewUrl(null);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div 
        className="absolute inset-0 bg-black/80 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      ></div>

      <div className="relative bg-black border border-white/20 rounded-2xl p-8 max-w-2xl w-full shadow-[0_0_50px_rgba(255,255,255,0.1)] flex flex-col md:flex-row gap-8">
        
        {/* Left Col: Image Upload */}
        <div className="w-full md:w-1/3 space-y-4">
            <div 
                className={`aspect-square rounded-xl border-2 border-dashed flex flex-col items-center justify-center cursor-pointer transition-all overflow-hidden relative ${previewUrl ? 'border-white/50 bg-black' : 'border-neutral-700 hover:border-white hover:bg-white/5'}`}
                onClick={() => fileInputRef.current?.click()}
            >
                {previewUrl ? (
                    <img src={previewUrl} alt="Preview" className="w-full h-full object-cover" />
                ) : (
                    <>
                        <svg className="w-8 h-8 text-neutral-500 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                        <span className="text-xs text-neutral-500 font-bold uppercase tracking-wider">Upload Image</span>
                    </>
                )}
                <input 
                    ref={fileInputRef} 
                    type="file" 
                    accept="image/*" 
                    className="hidden" 
                    onChange={handleFileChange}
                />
            </div>
            {previewUrl && (
                <button 
                    onClick={(e) => { e.stopPropagation(); fileInputRef.current?.click(); }}
                    className="w-full text-xs text-neutral-400 hover:text-white underline text-center"
                >
                    Change Image
                </button>
            )}
        </div>

        {/* Right Col: Metadata Form */}
        <div className="flex-1">
            <div className="mb-6 flex justify-between items-start">
                <div>
                    <h2 className="text-2xl font-bold text-white uppercase tracking-tight">Create Artifact</h2>
                    <p className="text-neutral-400 mt-1 text-sm">Mint a new asset to the <span className="text-white font-bold">{selectedOrg}</span> collection.</p>
                </div>
                <button onClick={onClose} className="text-neutral-500 hover:text-white">
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-3 gap-4">
                <div className="col-span-2">
                    <label className="block text-[10px] font-bold text-neutral-500 uppercase tracking-wider mb-2">Artifact Name</label>
                    <input 
                    type="text" 
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Quantum Key"
                    className="w-full bg-neutral-900 border border-neutral-800 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-white transition-colors placeholder-neutral-700 text-sm"
                    />
                </div>
                <div>
                    <label className="block text-[10px] font-bold text-neutral-500 uppercase tracking-wider mb-2">Ticker</label>
                    <input 
                    type="text" 
                    value={ticker}
                    onChange={(e) => setTicker(e.target.value)}
                    placeholder="KEY"
                    maxLength={5}
                    className="w-full bg-neutral-900 border border-neutral-800 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-white transition-colors placeholder-neutral-700 text-sm font-mono uppercase"
                    />
                </div>
            </div>

            <div>
                <label className="block text-[10px] font-bold text-neutral-500 uppercase tracking-wider mb-2">Description</label>
                <textarea 
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe the utility or lore of this artifact..."
                rows={3}
                className="w-full bg-neutral-900 border border-neutral-800 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-white transition-colors placeholder-neutral-700 text-sm resize-none"
                />
            </div>

            <div>
                <label className="block text-[10px] font-bold text-neutral-500 uppercase tracking-wider mb-2">Rarity Tier</label>
                <div className="grid grid-cols-4 gap-2">
                    {["Common", "Rare", "Epic", "Legendary"].map((r) => (
                        <button
                            key={r}
                            type="button"
                            onClick={() => setRarity(r as any)}
                            className={`text-[10px] font-bold uppercase py-2 rounded border transition-all ${
                                rarity === r 
                                ? 'bg-white text-black border-white' 
                                : 'bg-black text-neutral-500 border-neutral-800 hover:border-neutral-600'
                            }`}
                        >
                            {r}
                        </button>
                    ))}
                </div>
            </div>

            <div className="pt-4">
                <Button 
                    type="submit" 
                    variant="primary" 
                    className="w-full uppercase tracking-widest h-12"
                    isLoading={loading}
                    disabled={!name || !ticker || !description || !previewUrl}
                >
                Mint to Blockchain
                </Button>
            </div>
            </form>
        </div>
      </div>
    </div>
  );
};