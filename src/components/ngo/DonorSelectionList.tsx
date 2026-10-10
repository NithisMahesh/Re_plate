import React from 'react';
import { FoodDonation } from '../../types/surplusLink';
import { Sparkles, Route, AlertCircle } from 'lucide-react';
import { Button } from '../shared/Button';
import { Card } from '../shared/Card';
import { EmptyState } from '../shared/EmptyState';
import { useToast } from '../shared/Toast';

interface DonorSelectionListProps {
  donations: FoodDonation[];
  selectedDonationIds: string[];
  onToggleDonation: (id: string) => void;
  onSelectAll: () => void;
  onDeselectAll: () => void;
  onLoadDemoBatch: () => void;
  onGeneratePlan: () => void;
  isGenerating: boolean;
  vanCapacity: number;
}

export const DonorSelectionList: React.FC<DonorSelectionListProps> = ({
  donations,
  selectedDonationIds,
  onToggleDonation,
  onSelectAll,
  onDeselectAll,
  onLoadDemoBatch,
  onGeneratePlan,
  isGenerating,
  vanCapacity,
}) => {
  const toast = useToast();
  const selectedDonations = donations.filter((d) => selectedDonationIds.includes(d.id));
  const totalPortions = selectedDonations.reduce(
    (sum, d) => sum + (d.confirmedPortions ?? d.portions ?? 0),
    0
  );

  const percentCapacity = Math.min(100, Math.round((totalPortions / vanCapacity) * 100));
  const isOverCapacity = totalPortions > vanCapacity;

  const handleLoadDemo = () => {
    onLoadDemoBatch();
    toast.info('Loaded demo confirmed donors into pool');
  };

  return (
    <Card
      title={`Confirmed Surplus Donors (${donations.length})`}
      subtitle="Select donors to include in the collection circuit"
      action={
        donations.length === 0 ? (
          <Button
            variant="secondary"
            size="sm"
            icon={<Sparkles className="h-3.5 w-3.5 text-amber-500" />}
            onClick={handleLoadDemo}
          >
            Load demo donors
          </Button>
        ) : (
          <div className="flex items-center gap-2 text-xs">
            <button
              type="button"
              onClick={onSelectAll}
              className="text-emerald-700 hover:text-emerald-800 font-semibold underline px-1 py-1 cursor-pointer"
            >
              Select all
            </button>
            <span className="text-slate-300">·</span>
            <button
              type="button"
              onClick={onDeselectAll}
              className="text-slate-500 hover:text-slate-700 font-semibold underline px-1 py-1 cursor-pointer"
            >
              Clear
            </button>
          </div>
        )
      }
    >
      <div className="space-y-4">
        {/* Van Capacity Progress Bar */}
        <div className="space-y-2 bg-slate-50 border border-slate-200/80 rounded-xl p-3.5">
          <div className="flex items-center justify-between text-xs font-semibold">
            <span className="text-slate-700 flex items-center gap-1.5">
              Van Load vs. Capacity
              {isOverCapacity && (
                <span className="text-rose-700 font-semibold flex items-center gap-1">
                  <AlertCircle className="h-3.5 w-3.5" /> Over capacity ({totalPortions} portions)
                </span>
              )}
            </span>
            <span
              className={
                isOverCapacity
                  ? 'text-rose-700 font-bold'
                  : totalPortions > 0
                  ? 'text-emerald-700 font-bold'
                  : 'text-slate-500 font-semibold'
              }
            >
              {totalPortions} / {vanCapacity} portions ({percentCapacity}%)
            </span>
          </div>

          {/* Progress Bar - turns red over 60 */}
          <div className="h-2.5 w-full bg-slate-200 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-200 ${
                isOverCapacity
                  ? 'bg-rose-600'
                  : totalPortions > 45
                  ? 'bg-amber-500'
                  : 'bg-emerald-600'
              }`}
              style={{ width: `${Math.min(100, (totalPortions / vanCapacity) * 100)}%` }}
            />
          </div>
        </div>

        {/* Compact Donation List with Checkboxes */}
        {donations.length === 0 ? (
          <EmptyState
            title="No confirmed donors"
            description="No confirmed surplus donations are currently waiting in the pool."
            actionLabel="Load Demo Donors"
            onAction={handleLoadDemo}
            actionIcon={<Sparkles className="h-4 w-4 text-amber-500" />}
          />
        ) : (
          <div className="divide-y divide-slate-100 max-h-72 overflow-y-auto pr-1">
            {donations.map((d) => {
              const isChecked = selectedDonationIds.includes(d.id);
              const portions = d.confirmedPortions ?? d.portions ?? 0;
              return (
                <label
                  key={d.id}
                  className={`flex items-center justify-between py-2.5 px-3 rounded-xl cursor-pointer transition-colors duration-150 ${
                    isChecked ? 'bg-emerald-50/50' : 'hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={() => onToggleDonation(d.id)}
                      className="w-4 h-4 text-emerald-600 border-slate-300 rounded focus:ring-emerald-500 cursor-pointer accent-emerald-600"
                    />
                    <div className="min-w-0">
                      <div className="text-xs font-semibold text-slate-900 truncate">{d.providerName}</div>
                      <div className="text-xs text-slate-500 truncate max-w-[200px] sm:max-w-xs">
                        {d.foodItem} · By {d.collectionDeadline}
                      </div>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-lg border border-emerald-200">
                      {portions} portions
                    </span>
                  </div>
                </label>
              );
            })}
          </div>
        )}

        {/* Primary Action Button */}
        <Button
          variant="primary"
          size="lg"
          fullWidth
          disabled={selectedDonationIds.length === 0 || isGenerating}
          isLoading={isGenerating}
          icon={<Route className="h-4 w-4" />}
          onClick={onGeneratePlan}
        >
          {isGenerating ? 'Generating collection plan...' : 'Generate collection plan'}
        </Button>
      </div>
    </Card>
  );
};
