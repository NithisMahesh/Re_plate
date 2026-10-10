import React from 'react';
import { FoodDonation } from '../../types/surplusLink';
import { Sparkles, Route, Clock, ShieldCheck, PlusCircle } from 'lucide-react';

interface ConfirmedPoolTableProps {
  confirmedDonations: FoodDonation[];
  onLoadDemoBatch: () => void;
  onGenerateRoutes: () => void;
  isGenerating: boolean;
}

export const ConfirmedPoolTable: React.FC<ConfirmedPoolTableProps> = ({
  confirmedDonations,
  onLoadDemoBatch,
  onGenerateRoutes,
  isGenerating,
}) => {
  const totalPortions = confirmedDonations.reduce(
    (sum, d) => sum + (d.confirmedPortions ?? d.portions ?? 0),
    0
  );

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-2xs space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-bold text-slate-900">
              Confirmed Surplus Pool ({confirmedDonations.length} Pending Collections)
            </h3>
            <span className="text-xs font-bold text-emerald-800 bg-emerald-100 px-2.5 py-0.5 rounded-full">
              {totalPortions} Portions
            </span>
          </div>
          <p className="text-xs text-slate-500">
            Surplus confirmed by kitchen supervisors awaiting van route scheduling.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onLoadDemoBatch}
            className="px-3 py-1.5 border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors"
          >
            <Sparkles className="h-3.5 w-3.5 text-amber-600" />
            <span>Load Demo Batch (5 Donors)</span>
          </button>

          <button
            type="button"
            disabled={confirmedDonations.length === 0 || isGenerating}
            onClick={onGenerateRoutes}
            className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 shadow-xs ${
              confirmedDonations.length > 0 && !isGenerating
                ? 'bg-orange-600 hover:bg-orange-700 text-white'
                : 'bg-slate-200 text-slate-400 cursor-not-allowed'
            }`}
          >
            <Route className="h-3.5 w-3.5" />
            <span>{isGenerating ? 'Routing via OSRM...' : 'Generate Optimized Routes'}</span>
          </button>
        </div>
      </div>

      {confirmedDonations.length === 0 ? (
        <div className="text-center py-8 text-xs text-slate-400 space-y-2">
          <p>No confirmed surplus donations currently waiting in the pool.</p>
          <p className="text-[11px] text-slate-500">
            Switch to the <strong>Food Provider</strong> role to submit surplus or click <strong>"Load Demo Batch"</strong> above.
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 text-slate-400 uppercase text-[10px] font-bold">
                <th className="py-2 pr-3">Donor</th>
                <th className="py-2 px-3">Surplus Food Item</th>
                <th className="py-2 px-3">Portions</th>
                <th className="py-2 px-3">Category</th>
                <th className="py-2 px-3">Storage</th>
                <th className="py-2 px-3">Pickup Deadline</th>
                <th className="py-2 pl-3">OTP</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {confirmedDonations.map((d) => (
                <tr key={d.id} className="hover:bg-slate-50/80">
                  <td className="py-2.5 pr-3 font-bold text-slate-900">{d.providerName}</td>
                  <td className="py-2.5 px-3 text-slate-800">{d.foodItem}</td>
                  <td className="py-2.5 px-3 font-black text-emerald-700 text-sm">
                    {d.confirmedPortions ?? d.portions}
                  </td>
                  <td className="py-2.5 px-3 text-slate-500 capitalize">{d.category.replace('_', ' ')}</td>
                  <td className="py-2.5 px-3 text-slate-500 capitalize">{d.storageType.replace('_', ' ')}</td>
                  <td className="py-2.5 px-3 text-slate-700 font-semibold">{d.collectionDeadline}</td>
                  <td className="py-2.5 pl-3 font-mono font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 w-fit">
                    {d.verificationOtp}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
