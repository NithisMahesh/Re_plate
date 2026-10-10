import React from 'react';
import { NGO } from '../../types/surplusLink';
import { ImpactMetrics } from '../../types/surplusLink';
import { ImpactFunnelCard } from '../ImpactFunnelCard';
import { Users, HeartHandshake, ShieldCheck } from 'lucide-react';

interface NgoImpactDashboardProps {
  ngo: NGO;
  metrics: ImpactMetrics;
}

export const NgoImpactDashboard: React.FC<NgoImpactDashboardProps> = ({
  ngo,
  metrics,
}) => {
  const percentQuota = Math.min(
    100,
    Math.round((metrics.distributed / (ngo.nightlyPeopleFed || 80)) * 100)
  );

  return (
    <div className="space-y-6">
      {/* 4-Stage Recharts Funnel Card */}
      <ImpactFunnelCard
        metrics={metrics}
        title={`${ngo.name} Overall Operations Impact`}
        subtitle="Tracking aggregate surplus across all 15 cluster providers from kitchen verification to community dining distribution."
        entityName={ngo.name}
        isProviderView={false}
      />

      {/* Target Beneficiary Card */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-2xs space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 text-orange-600" />
            <h4 className="text-sm font-bold text-slate-900">
              Nightly Feeding Target Progress
            </h4>
          </div>
          <span className="text-xs font-bold text-orange-800 bg-orange-100 px-2.5 py-0.5 rounded-full">
            {metrics.distributed} / {ngo.nightlyPeopleFed} meals ({percentQuota}%)
          </span>
        </div>

        <div className="space-y-2 text-xs">
          <div className="flex justify-between text-slate-600">
            <span>Goripalayam Community Center & Night Shelters</span>
            <span className="font-bold">{percentQuota}% Complete</span>
          </div>
          <div className="h-3 w-full bg-slate-100 rounded-full overflow-hidden">
            <div
              className="bg-orange-500 h-full rounded-full transition-all duration-500"
              style={{ width: `${percentQuota}%` }}
            />
          </div>
          <p className="text-[11px] text-slate-500 pt-1">
            * Note: Only portions actually received at the depot and served to beneficiaries are tallied. Undistributed portions held in thermal storage are strictly excluded from the meals-served metric.
          </p>
        </div>
      </div>
    </div>
  );
};
