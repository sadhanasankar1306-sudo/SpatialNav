import React from 'react';
import { Volume2, VolumeX, Eye, ShieldAlert, Sparkles } from 'lucide-react';

interface AccessibleHeaderProps {
  activeTab: 'nav' | 'vision' | 'code' | 'research' | 'tests';
  onSelectTab: (tab: 'nav' | 'vision' | 'code' | 'research' | 'tests') => void;
  isMuted: boolean;
  onToggleMute: () => void;
  isHighContrast: boolean;
  onToggleHighContrast: () => void;
  speechEnabled: boolean;
  onToggleSpeech: () => void;
}

export const AccessibleHeader: React.FC<AccessibleHeaderProps> = ({
  activeTab,
  onSelectTab,
  isMuted,
  onToggleMute,
  isHighContrast,
  onToggleHighContrast,
  speechEnabled,
  onToggleSpeech,
}) => {
  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-800 bg-[#0c0f14]/95 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-8 px-4 sm:px-6">
        {/* Zone 1: Single text wordmark as per Top Bar Contract */}
        <div className="flex items-center gap-3 shrink-0">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-yellow-400 text-slate-950 font-bold text-lg">
            S
          </div>
          <span className="text-lg font-bold tracking-tight text-white whitespace-nowrap">
            SpatialNav AI
          </span>
        </div>

        {/* Zone 2: 4-5 single-line clean text navigation tabs */}
        <nav className="hidden md:flex items-center gap-6 text-sm font-medium">
          <button
            onClick={() => onSelectTab('nav')}
            className={`whitespace-nowrap transition-colors py-1 ${
              activeTab === 'nav'
                ? 'text-yellow-400 border-b-2 border-yellow-400 font-semibold'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Spatial Navigation
          </button>
          <button
            onClick={() => onSelectTab('vision')}
            className={`whitespace-nowrap transition-colors py-1 ${
              activeTab === 'vision'
                ? 'text-yellow-400 border-b-2 border-yellow-400 font-semibold'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Vision & Depth Map
          </button>
          <button
            onClick={() => onSelectTab('code')}
            className={`whitespace-nowrap transition-colors py-1 ${
              activeTab === 'code'
                ? 'text-yellow-400 border-b-2 border-yellow-400 font-semibold'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Android Project Hub
          </button>
          <button
            onClick={() => onSelectTab('research')}
            className={`whitespace-nowrap transition-colors py-1 ${
              activeTab === 'research'
                ? 'text-yellow-400 border-b-2 border-yellow-400 font-semibold'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Research & Methodology
          </button>
          <button
            onClick={() => onSelectTab('tests')}
            className={`whitespace-nowrap transition-colors py-1 ${
              activeTab === 'tests'
                ? 'text-yellow-400 border-b-2 border-yellow-400 font-semibold'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Validation Tests
          </button>
        </nav>

        {/* Zone 3: Primary action & accessibility toggles */}
        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={onToggleSpeech}
            title="Toggle Voice Speech Guidance"
            className={`flex h-10 items-center gap-2 rounded-lg px-3 text-xs font-semibold transition-colors ${
              speechEnabled
                ? 'bg-slate-800 text-yellow-400 border border-yellow-400/30'
                : 'bg-slate-900 text-slate-400 hover:text-white'
            }`}
            aria-label={speechEnabled ? 'Disable speech guidance' : 'Enable speech guidance'}
          >
            <Sparkles className="h-4 w-4" />
            <span className="hidden sm:inline">Voice {speechEnabled ? 'ON' : 'OFF'}</span>
          </button>

          <button
            onClick={onToggleHighContrast}
            title="Toggle WCAG AAA High Contrast Theme"
            className={`flex h-10 items-center gap-2 rounded-lg px-3 text-xs font-semibold transition-colors ${
              isHighContrast
                ? 'bg-yellow-400 text-slate-950 shadow-sm'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
            aria-label="Toggle high contrast"
          >
            <Eye className="h-4 w-4" />
            <span className="hidden sm:inline">High Contrast</span>
          </button>

          <button
            onClick={onToggleMute}
            className={`flex h-10 items-center gap-2 rounded-lg px-4 text-xs font-bold transition-all ${
              isMuted
                ? 'bg-rose-600 text-white hover:bg-rose-500'
                : 'bg-slate-800 text-white hover:bg-slate-700'
            }`}
            aria-label={isMuted ? 'Unmute spatial audio' : 'Emergency mute all audio'}
          >
            {isMuted ? <VolumeX className="h-4 w-4 text-white" /> : <Volume2 className="h-4 w-4 text-yellow-400" />}
            <span>{isMuted ? 'MUTED' : 'MUTE'}</span>
          </button>
        </div>
      </div>

      {/* Mobile nav drawer tabs */}
      <div className="flex md:hidden overflow-x-auto px-4 py-2 border-t border-slate-800/80 gap-3 text-xs scrollbar-none">
        <button
          onClick={() => onSelectTab('nav')}
          className={`whitespace-nowrap py-1.5 px-3 rounded-md font-medium ${
            activeTab === 'nav' ? 'bg-yellow-400 text-slate-950' : 'bg-slate-800 text-slate-300'
          }`}
        >
          Navigation
        </button>
        <button
          onClick={() => onSelectTab('vision')}
          className={`whitespace-nowrap py-1.5 px-3 rounded-md font-medium ${
            activeTab === 'vision' ? 'bg-yellow-400 text-slate-950' : 'bg-slate-800 text-slate-300'
          }`}
        >
          Vision & Depth
        </button>
        <button
          onClick={() => onSelectTab('code')}
          className={`whitespace-nowrap py-1.5 px-3 rounded-md font-medium ${
            activeTab === 'code' ? 'bg-yellow-400 text-slate-950' : 'bg-slate-800 text-slate-300'
          }`}
        >
          Android Hub
        </button>
        <button
          onClick={() => onSelectTab('research')}
          className={`whitespace-nowrap py-1.5 px-3 rounded-md font-medium ${
            activeTab === 'research' ? 'bg-yellow-400 text-slate-950' : 'bg-slate-800 text-slate-300'
          }`}
        >
          Research & Math
        </button>
        <button
          onClick={() => onSelectTab('tests')}
          className={`whitespace-nowrap py-1.5 px-3 rounded-md font-medium ${
            activeTab === 'tests' ? 'bg-yellow-400 text-slate-950' : 'bg-slate-800 text-slate-300'
          }`}
        >
          Tests
        </button>
      </div>
    </header>
  );
};
