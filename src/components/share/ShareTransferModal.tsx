import React, { useState, useEffect } from 'react';
import { 
  SharePayload, 
  generateShareUrl, 
  generateQrCodeDataUrl, 
  compressPayload 
} from '../../utils/shareCompression';
import { X, QrCode, Copy, Check, Share2, Smartphone, ShieldCheck, ChevronDown, ChevronUp } from 'lucide-react';

interface ShareTransferModalProps {
  isOpen: boolean;
  onClose: () => void;
  payload: SharePayload | null;
}

export const ShareTransferModal: React.FC<ShareTransferModalProps> = ({
  isOpen,
  onClose,
  payload,
}) => {
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const [qrError, setQrError] = useState<string | null>(null);
  const [shareUrl, setShareUrl] = useState<string>('');
  const [compressedCode, setCompressedCode] = useState<string>('');
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);
  const [showRawCode, setShowRawCode] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!isOpen || !payload) {
      setQrDataUrl(null);
      setQrError(null);
      setShareUrl('');
      setCompressedCode('');
      setIsLoading(false);
      return;
    }

    let isMounted = true;
    setIsLoading(true);
    setQrError(null);

    try {
      const url = generateShareUrl(payload);
      const code = compressPayload(payload);
      setShareUrl(url);
      setCompressedCode(code);

      generateQrCodeDataUrl(url).then(dataUrl => {
        if (isMounted) {
          setQrDataUrl(dataUrl);
          setQrError(null);
          setIsLoading(false);
        }
      }).catch(err => {
        console.error('Failed to generate QR code:', err);
        if (isMounted) {
          setQrError('This backup contains too much data to fit into a single QR Code image. Use the "Copy Transfer Link" or "Export File" button below instead!');
          setIsLoading(false);
        }
      });
    } catch (e) {
      console.error('Error generating share link:', e);
      if (isMounted) {
        setQrError('Failed to encode transfer payload.');
        setIsLoading(false);
      }
    }

    return () => {
      isMounted = false;
    };
  }, [isOpen, payload]);

  if (!isOpen || !payload) return null;

  const isTeam = payload.type === 'team';
  const title = isTeam ? `Transfer ${payload.team.name}` : 'Transfer Full Backup';
  const subtitle = isTeam 
    ? `${payload.team.players.length} players • ${payload.team.defaultPlayerCount}v${payload.team.defaultPlayerCount}`
    : `${payload.data.teams.length} teams • full local storage data`;

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2200);
    } catch {
      // Fallback prompt
      window.prompt('Copy this transfer link:', shareUrl);
    }
  };

  const handleCopyRawCode = async () => {
    try {
      await navigator.clipboard.writeText(compressedCode);
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2200);
    } catch {
      window.prompt('Copy this transfer code:', compressedCode);
    }
  };

  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `SquadCrafter - ${title}`,
          text: `Import ${isTeam ? `team "${payload.team.name}"` : 'SquadCrafter roster backup'} on your phone:`,
          url: shareUrl,
        });
      } catch (err) {
        if ((err as Error).name !== 'AbortError') {
          console.error('Native share failed:', err);
        }
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-md overflow-hidden shadow-2xl flex flex-col max-h-[92vh]">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-emerald-600/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center">
              <QrCode className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-black text-white leading-tight">
                {title}
              </h3>
              <p className="text-[11px] text-slate-400 leading-tight">
                {subtitle}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 overflow-y-auto space-y-4 text-center">
          {/* QR Code Container */}
          <div className="relative mx-auto w-72 h-72 sm:w-80 sm:h-80 bg-white p-4 rounded-3xl shadow-2xl flex items-center justify-center border-4 border-white">
            {isLoading ? (
              <div className="flex flex-col items-center gap-2 text-slate-500 text-xs">
                <div className="w-6 h-6 border-2 border-slate-400 border-t-emerald-600 rounded-full animate-spin" />
                <span>Generating QR Code...</span>
              </div>
            ) : qrError ? (
              <div className="flex flex-col items-center justify-center text-center p-4 text-slate-800 space-y-2">
                <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-600 flex items-center justify-center text-2xl mx-auto">
                  ⚠️
                </div>
                <div className="font-extrabold text-xs text-slate-900 leading-tight">Data Exceeds QR Code Size</div>
                <p className="text-[10px] text-slate-600 leading-tight">
                  This entire multi-team backup is too large for an optical QR code. Tap <strong>Copy Transfer Link</strong> or <strong>Share via App</strong> below to send it to your phone!
                </p>
              </div>
            ) : qrDataUrl ? (
              <img 
                src={qrDataUrl} 
                alt="SquadCrafter Transfer QR Code" 
                className="w-full h-full object-contain rounded-lg"
              />
            ) : null}
          </div>

          {/* Quick Scan Instructions */}
          <div className="flex items-center justify-center gap-2 text-xs font-semibold text-emerald-400 bg-emerald-950/40 border border-emerald-800/60 py-2 px-3 rounded-xl">
            <Smartphone className="w-4 h-4 shrink-0" />
            <span>Point your phone's camera to import instantly</span>
          </div>

          <p className="text-[11px] text-slate-400 leading-relaxed px-2">
            No accounts or server uploads needed. The entire team roster is compressed directly inside the QR code and loads instantly in your phone's browser.
          </p>

          {/* Actions: Copy Link & Native Share */}
          <div className="flex flex-col gap-2 pt-1">
            <button
              onClick={handleCopyLink}
              className={`w-full py-2.5 px-4 font-extrabold text-xs rounded-xl shadow flex items-center justify-center gap-2 transition active:scale-95 ${
                copiedLink 
                  ? 'bg-emerald-600 text-white' 
                  : 'bg-slate-800 hover:bg-slate-750 text-slate-200 border border-slate-700'
              }`}
            >
              {copiedLink ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedLink ? 'Transfer Link Copied!' : 'Copy Transfer Link (Text / WhatsApp)'}</span>
            </button>

            {typeof navigator !== 'undefined' && 'share' in navigator && (
              <button
                onClick={handleNativeShare}
                className="w-full py-2 px-4 bg-blue-600 hover:bg-blue-500 text-white font-extrabold text-xs rounded-xl shadow flex items-center justify-center gap-2 transition active:scale-95"
              >
                <Share2 className="w-3.5 h-3.5" />
                <span>Share via App...</span>
              </button>
            )}
          </div>

          {/* Raw Transfer Code Accordion (Fallback) */}
          <div className="pt-1 border-t border-slate-800/80 text-left">
            <button
              type="button"
              onClick={() => setShowRawCode(!showRawCode)}
              className="w-full flex items-center justify-between text-[11px] font-bold text-slate-400 hover:text-slate-300 py-1"
            >
              <span>Need raw code or link?</span>
              {showRawCode ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
            </button>

            {showRawCode && (
              <div className="space-y-2 mt-2">
                <div className="relative">
                  <textarea
                    readOnly
                    value={compressedCode}
                    rows={2}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2 text-[10px] font-mono text-slate-400 resize-none break-all"
                  />
                  <button
                    onClick={handleCopyRawCode}
                    className="absolute top-1.5 right-1.5 px-2 py-0.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-[9px] font-bold rounded-md border border-slate-700"
                  >
                    {copiedCode ? 'Copied' : 'Copy'}
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Security & Offline Guarantee */}
          <div className="flex items-center justify-center gap-1.5 text-[10px] text-slate-500 pt-1">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-500/70" />
            <span>Direct device-to-device • 100% private</span>
          </div>
        </div>
      </div>
    </div>
  );
};
