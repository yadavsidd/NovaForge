import React, { useState } from 'react';
import { Button } from './Button';

interface CreateDropModalProps {
  isOpen: boolean;
  onClose: () => void;
  onDeploy: (name: string, ticker: string) => Promise<void>;
}

export const CreateDropModal: React.FC<CreateDropModalProps> = ({ isOpen, onClose, onDeploy }) => {
  const [name, setName] = useState('');
  const [ticker, setTicker] = useState('');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !ticker) return;

    setLoading(true);
    try {
      await onDeploy(name, ticker);
      onClose();
      setName('');
      setTicker('');
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/80 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      ></div>

      {/* Modal Content */}
      <div className="relative bg-black border border-white rounded-2xl p-8 max-w-md w-full shadow-[0_0_50px_rgba(255,255,255,0.1)]">
        <div className="absolute top-4 right-4">
          <button onClick={onClose} className="text-neutral-500 hover:text-white transition-colors">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="mb-6">
          <div className="w-12 h-12 rounded-full bg-white flex items-center justify-center mb-4">
            <svg className="w-6 h-6 text-black" fill="none" viewBox="0 0 24 24" stroke="currentColor">
               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-white uppercase tracking-tight">Create Collection</h2>
          <p className="text-neutral-400 mt-2 text-sm">Deploy a new NFT collection contract to the blockchain.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-neutral-500 uppercase tracking-wider mb-2">Collection Name</label>
            <input 
              type="text" 
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Neo Tokyo DAO"
              className="w-full bg-neutral-900 border border-neutral-800 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-white transition-colors placeholder-neutral-600"
              autoFocus
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-neutral-500 uppercase tracking-wider mb-2">Ticker Symbol</label>
            <input 
              type="text" 
              value={ticker}
              onChange={(e) => setTicker(e.target.value)}
              placeholder="e.g. NEO"
              maxLength={5}
              className="w-full bg-neutral-900 border border-neutral-800 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-white transition-colors placeholder-neutral-600 font-mono uppercase"
            />
          </div>

          <div className="pt-4">
             <Button 
                type="submit" 
                variant="primary" 
                className="w-full uppercase tracking-widest"
                isLoading={loading}
                disabled={!name || !ticker}
             >
               Create Collection
             </Button>
          </div>
        </form>
      </div>
    </div>
  );
};