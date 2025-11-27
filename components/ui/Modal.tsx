import React from 'react';
import { X } from 'lucide-react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}

export const Modal: React.FC<ModalProps> = ({ isOpen, onClose, title, children }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="bg-white border-[4px] border-black rounded-[2rem] shadow-cartoon-lg w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-300 relative">
        
        {/* Decorative header blob */}
        <div className="absolute top-0 left-0 w-full h-16 bg-accent/30 -z-10 transform -skew-y-2 origin-top-left"></div>

        <div className="flex justify-between items-center p-5 pt-6">
          <h3 className="text-2xl font-black text-slate-800 tracking-tight transform rotate-[-1deg]">{title}</h3>
          <button 
            onClick={onClose} 
            className="p-2 rounded-full bg-slate-100 hover:bg-red-100 text-slate-800 transition-colors border-2 border-black shadow-cartoon-sm hover:scale-105 active:scale-95"
          >
            <X size={20} strokeWidth={3} />
          </button>
        </div>
        <div className="p-6 pt-2">
          {children}
        </div>
      </div>
    </div>
  );
};