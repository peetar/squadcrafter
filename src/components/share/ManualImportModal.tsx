import React, { useState } from 'react';
import { extractPayloadFromInput, SharePayload } from '../../utils/shareCompression';
import { Download, AlertCircle, X, ArrowRight } from 'lucide-react';

interface ManualImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPayloadExtracted: (payload: SharePayload) => void;
}

export const ManualImportModal: React.FC<ManualImportModalProps> = ({
  isOpen,
  onClose,
  onPayloadExtracted,
}) => {
  const [inputText, setInputText] = useState('');
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleProcess = () => {
    setError(null);
    const trimmed = inputText.trim();
    if (!trimmed) {
      setError('Please paste a SquadCrafter transfer link or code.');
      return;
    }

    const payload = extractPayloadFromInput(trimmed);
    if (!payload) {
      setError('Invalid transfer code or link. Please ensure the full code was copied.');
      return;
    }

    onPayloadExtracted(payload);
    setInputText('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-sm overflow-hidden shadow-2xl flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <Download className="w-4 h-4 text-emerald-400" />
            <h3 className="text-sm font-black text-white">Import from Link or Code</h3>
          </div>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-white rounded-lg">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 space-y-4">
          <p className="text-xs text-slate-400 leading-relaxed">
            Paste a SquadCrafter share link (e.g. from WhatsApp/SMS) or compressed transfer code below:
          </p>

          <textarea
            value={inputText}
            onChange={e => {
              setInputText(e.target.value);
              setError(null);
            }}
            placeholder="https://squadcrafter.vercel.app/#import=H4sIAAA... or raw code"
            rows={3}
            className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500 rounded-xl p-2.5 text-xs font-mono text-slate-200 resize-none outline-none"
          />

          {error && (
            <div className="flex items-center gap-1.5 text-xs text-red-400 bg-red-950/40 border border-red-900/60 p-2 rounded-xl">
              <AlertCircle className="w-3.5 h-3.5 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="flex items-center gap-2 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs rounded-xl"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleProcess}
              className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs rounded-xl shadow flex items-center justify-center gap-1"
            >
              <span>Verify & Preview</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
