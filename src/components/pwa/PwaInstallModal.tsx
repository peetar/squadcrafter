import React, { useState } from 'react';
import { 
  Smartphone, 
  Share, 
  PlusSquare, 
  MoreVertical, 
  DownloadCloud, 
  X, 
  CheckCircle2, 
  WifiOff, 
  Sparkles
} from 'lucide-react';

interface PwaInstallModalProps {
  isOpen: boolean;
  onClose: () => void;
  deferredPrompt?: any;
  onNativeInstallPrompt?: () => void;
}

export const PwaInstallModal: React.FC<PwaInstallModalProps> = ({
  isOpen,
  onClose,
  deferredPrompt,
  onNativeInstallPrompt,
}) => {
  // Detect OS for default tab
  const isIOSDevice = typeof navigator !== 'undefined' && /iPad|iPhone|iPod/.test(navigator.userAgent);
  const [platform, setPlatform] = useState<'ios' | 'android'>(isIOSDevice ? 'ios' : 'android');

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-xs p-3 animate-in fade-in duration-200">
      <div 
        className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 bg-slate-950/80 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-500 flex items-center justify-center text-white shadow-md text-xl">
              📲
            </div>
            <div>
              <h3 className="font-extrabold text-white text-base leading-tight">Install App (PWA)</h3>
              <p className="text-[11px] text-emerald-400 font-medium">Add to Home Screen for Matchday</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Benefits Pill */}
        <div className="bg-emerald-950/40 border-b border-emerald-900/40 px-4 py-2.5 flex items-center gap-3 text-xs text-emerald-300">
          <Sparkles className="w-4 h-4 text-emerald-400 flex-shrink-0" />
          <span className="leading-tight">
            Installs instantly like a native app. Works <strong>100% offline</strong> at soccer fields with no cell service!
          </span>
        </div>

        {/* Platform Selector Tabs */}
        <div className="p-4 pb-2">
          <div className="flex p-1 bg-slate-950 rounded-2xl border border-slate-800">
            <button
              onClick={() => setPlatform('ios')}
              className={`flex-1 py-2 text-xs font-black rounded-xl transition flex items-center justify-center gap-1.5 ${
                platform === 'ios'
                  ? 'bg-slate-800 text-white shadow'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <span>🍎 iPhone / iPad</span>
            </button>
            <button
              onClick={() => setPlatform('android')}
              className={`flex-1 py-2 text-xs font-black rounded-xl transition flex items-center justify-center gap-1.5 ${
                platform === 'android'
                  ? 'bg-emerald-700 text-white shadow'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <span>🤖 Android / Chrome</span>
            </button>
          </div>
        </div>

        {/* Tab Content */}
        <div className="px-5 py-3 overflow-y-auto space-y-4 flex-1 text-xs text-slate-300">
          {platform === 'ios' ? (
            <div className="space-y-3.5">
              <div className="flex items-start gap-3 bg-slate-950/60 p-3 rounded-2xl border border-slate-800">
                <div className="w-7 h-7 rounded-xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400 font-bold flex-shrink-0">
                  1
                </div>
                <div>
                  <div className="font-bold text-white mb-0.5">Open in Safari</div>
                  <p className="text-slate-400 text-[11px] leading-relaxed">
                    Make sure you are viewing this page in <strong>Safari</strong> on iOS (Apple requires Safari for Home Screen apps).
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 bg-slate-950/60 p-3 rounded-2xl border border-slate-800">
                <div className="w-7 h-7 rounded-xl bg-emerald-600/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400 font-bold flex-shrink-0">
                  2
                </div>
                <div>
                  <div className="font-bold text-white mb-0.5 flex items-center gap-1.5">
                    <span>Tap the Share button</span>
                    <Share className="w-3.5 h-3.5 text-blue-400 inline" />
                  </div>
                  <p className="text-slate-400 text-[11px] leading-relaxed">
                    At the bottom of your Safari screen (or top on iPad), tap the square icon with an arrow pointing up.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 bg-slate-950/60 p-3 rounded-2xl border border-slate-800">
                <div className="w-7 h-7 rounded-xl bg-purple-600/20 border border-purple-500/30 flex items-center justify-center text-purple-400 font-bold flex-shrink-0">
                  3
                </div>
                <div>
                  <div className="font-bold text-white mb-0.5 flex items-center gap-1.5">
                    <span>Choose "Add to Home Screen"</span>
                    <PlusSquare className="w-3.5 h-3.5 text-purple-400 inline" />
                  </div>
                  <p className="text-slate-400 text-[11px] leading-relaxed">
                    Scroll down through the share sheet options and tap <strong>Add to Home Screen</strong>, then tap <strong>Add</strong> at top right.
                  </p>
                </div>
              </div>

              <div className="p-3 bg-slate-950/80 rounded-2xl border border-slate-800 flex items-center gap-3">
                <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0" />
                <span className="text-[11px] text-slate-300">
                  SquadCrafter will appear on your home screen with its app icon and launches full screen without browser URL bars!
                </span>
              </div>
            </div>
          ) : (
            <div className="space-y-3.5">
              {/* Native install banner if available */}
              {deferredPrompt && (
                <div className="p-3.5 bg-emerald-950/60 border border-emerald-600/50 rounded-2xl space-y-2">
                  <div className="font-black text-emerald-300 text-xs flex items-center gap-1.5">
                    <DownloadCloud className="w-4 h-4 text-emerald-400" />
                    <span>Quick 1-Tap Install Available!</span>
                  </div>
                  <p className="text-[11px] text-emerald-200/90 leading-relaxed">
                    Your browser supports 1-tap installation right now.
                  </p>
                  <button
                    onClick={onNativeInstallPrompt}
                    className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 active:scale-98 text-white font-extrabold text-xs rounded-xl shadow transition flex items-center justify-center gap-1.5"
                  >
                    <DownloadCloud className="w-4 h-4" />
                    <span>Install SquadCrafter Now</span>
                  </button>
                </div>
              )}

              <div className="flex items-start gap-3 bg-slate-950/60 p-3 rounded-2xl border border-slate-800">
                <div className="w-7 h-7 rounded-xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400 font-bold flex-shrink-0">
                  1
                </div>
                <div>
                  <div className="font-bold text-white mb-0.5 flex items-center gap-1.5">
                    <span>Tap Menu (3 dots)</span>
                    <MoreVertical className="w-3.5 h-3.5 text-slate-300 inline" />
                  </div>
                  <p className="text-slate-400 text-[11px] leading-relaxed">
                    In Chrome or Samsung Internet, tap the three dots in the top right corner.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 bg-slate-950/60 p-3 rounded-2xl border border-slate-800">
                <div className="w-7 h-7 rounded-xl bg-emerald-600/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400 font-bold flex-shrink-0">
                  2
                </div>
                <div>
                  <div className="font-bold text-white mb-0.5 flex items-center gap-1.5">
                    <span>Select "Install app" or "Add to Home Screen"</span>
                  </div>
                  <p className="text-slate-400 text-[11px] leading-relaxed">
                    Tap <strong>Install app</strong> (or <strong>Add to Home screen</strong>) from the menu list.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 bg-slate-950/60 p-3 rounded-2xl border border-slate-800">
                <div className="w-7 h-7 rounded-xl bg-purple-600/20 border border-purple-500/30 flex items-center justify-center text-purple-400 font-bold flex-shrink-0">
                  3
                </div>
                <div>
                  <div className="font-bold text-white mb-0.5">Confirm Install</div>
                  <p className="text-slate-400 text-[11px] leading-relaxed">
                    Tap <strong>Install</strong> on the prompt. It will download the app icon to your app drawer and home screen.
                  </p>
                </div>
              </div>

              <div className="p-3 bg-slate-950/80 rounded-2xl border border-slate-800 flex items-center gap-3">
                <WifiOff className="w-5 h-5 text-emerald-400 flex-shrink-0" />
                <span className="text-[11px] text-slate-300">
                  Once installed, SquadCrafter opens in full screen with fast offline caching for game day!
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-950/90 border-t border-slate-800 flex items-center justify-between gap-3">
          <div className="text-[11px] text-slate-400 flex items-center gap-1.5">
            <Smartphone className="w-3.5 h-3.5 text-slate-500" />
            <span>Works on any modern phone</span>
          </div>
          <button
            onClick={onClose}
            className="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 active:scale-95 text-white font-extrabold text-xs rounded-xl transition"
          >
            Got It
          </button>
        </div>
      </div>
    </div>
  );
};
