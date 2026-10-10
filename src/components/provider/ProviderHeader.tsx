import React from 'react';
import { Provider } from '../../types/surplusLink';
import { Store, Building2, Utensils, SlidersHorizontal, ChevronDown } from 'lucide-react';
import { StatusChip } from '../shared/StatusChip';

interface ProviderHeaderProps {
  providers: Provider[];
  selectedProvider: Provider;
  onSelectProvider: (id: string) => void;
  statusText: string;
  statusVariant: 'ready' | 'scheduled' | 'collected' | 'delivered' | 'skipped' | 'idle';
  onOpenDemoTools: () => void;
  activeTab: 'tonight' | 'impact';
  setActiveTab: (tab: 'tonight' | 'impact') => void;
}

export const ProviderHeader: React.FC<ProviderHeaderProps> = ({
  providers,
  selectedProvider,
  onSelectProvider,
  statusText,
  statusVariant,
  onOpenDemoTools,
  activeTab,
  setActiveTab,
}) => {
  const getProviderIcon = (type: Provider['type']) => {
    switch (type) {
      case 'bakery':
        return <Store className="h-4 w-4 text-amber-500" />;
      case 'restaurant':
        return <Utensils className="h-4 w-4 text-emerald-600" />;
      case 'hostel_mess':
        return <Building2 className="h-4 w-4 text-sky-600" />;
    }
  };

  const mapStatusVariant = () => {
    switch (statusVariant) {
      case 'ready':
      case 'delivered':
        return 'done' as const;
      case 'scheduled':
        return 'in_progress' as const;
      case 'collected':
        return 'pending' as const;
      case 'skipped':
        return 'failed' as const;
      default:
        return 'neutral' as const;
    }
  };

  return (
    <div className="space-y-4">
      {/* Top Header Card */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-4 sm:p-5 shadow-xs transition-all duration-150">
        <div className="flex items-center justify-between gap-3">
          {/* Business identity */}
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center shrink-0">
              {getProviderIcon(selectedProvider.type)}
            </div>
            <div className="min-w-0">
              <div className="relative inline-flex items-center gap-1 group">
                <select
                  aria-label="Switch Food Provider"
                  value={selectedProvider.id}
                  onChange={(e) => onSelectProvider(e.target.value)}
                  className="font-semibold text-lg text-slate-900 bg-transparent pr-6 cursor-pointer focus:outline-hidden focus:ring-1 focus:ring-emerald-500 rounded-lg truncate appearance-none max-w-[200px] sm:max-w-md"
                >
                  {providers.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
                <ChevronDown className="h-4 w-4 text-slate-400 absolute right-0 pointer-events-none group-hover:text-slate-600 transition-colors duration-150" />
              </div>
              <div className="text-xs text-slate-500 flex items-center gap-1.5 leading-none mt-0.5">
                <span className="capitalize">{selectedProvider.type.replace('_', ' ')}</span>
                <span>·</span>
                <span>Closes {selectedProvider.closingTime}</span>
              </div>
            </div>
          </div>

          {/* Right: Status chip & Demo tools trigger */}
          <div className="flex items-center gap-2 shrink-0">
            <StatusChip variant={mapStatusVariant()}>
              {statusText}
            </StatusChip>
            <button
              onClick={onOpenDemoTools}
              title="Open Demo & Simulation Tools"
              className="min-h-[44px] min-w-[44px] p-2.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-colors duration-150 flex items-center justify-center border border-slate-200/80 cursor-pointer"
              aria-label="Open Demo Tools"
            >
              <SlidersHorizontal className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Two Tabs Only: "Tonight" and "Impact" */}
      <div className="flex bg-slate-100 p-1 rounded-2xl border border-slate-200/60">
        <button
          onClick={() => setActiveTab('tonight')}
          className={`flex-1 min-h-[44px] text-sm font-semibold rounded-xl transition-all duration-150 flex items-center justify-center gap-2 cursor-pointer ${
            activeTab === 'tonight'
              ? 'bg-white text-slate-900 shadow-2xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <span>Tonight</span>
        </button>
        <button
          onClick={() => setActiveTab('impact')}
          className={`flex-1 min-h-[44px] text-sm font-semibold rounded-xl transition-all duration-150 flex items-center justify-center gap-2 cursor-pointer ${
            activeTab === 'impact'
              ? 'bg-white text-slate-900 shadow-2xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <span>Impact</span>
        </button>
      </div>
    </div>
  );
};
