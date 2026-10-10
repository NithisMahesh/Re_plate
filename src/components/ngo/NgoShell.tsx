import React, { useState, useEffect } from 'react';
import { useSurplusLink } from '../../context/SurplusLinkContext';
import { CollectionPlan, TripPlan } from '../../types/surplusLink';
import { confirmedPool, ngoImpact } from '../../selectors';
import { generateCollectionPlan } from '../../utils/collectionPlanner';
import { NgoOverviewHeader } from './NgoOverviewHeader';
import { NgoTabBar, NgoTab } from './NgoTabBar';
import { DonorSelectionList } from './DonorSelectionList';
import { TripPlanCard } from './TripPlanCard';
import { PickupsTab } from './PickupsTab';
import { NgoImpactTab } from './NgoImpactTab';
import { NgoMap } from '../NgoMap';
import { useToast } from '../shared/Toast';

export const NgoShell: React.FC = () => {
  const {
    ngo,
    providers,
    donations,
    collections,
    acceptTripCollection,
    updateStopProgress,
    recordCollectionReceived,
    recordCollectionDistributed,
    loadDemoDonationsBatch,
  } = useSurplusLink();

  const toast = useToast();
  const [activeTab, setActiveTab] = useState<NgoTab>('plan');
  const [collectionPlan, setCollectionPlan] = useState<CollectionPlan | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [selectedDonationIds, setSelectedDonationIds] = useState<string[]>([]);

  // Confirmed pool strictly derived via selector
  const pool = confirmedPool({ donations });
  const poolIdsKey = pool.map((d) => d.id).sort().join(',');

  // Overall NGO impact strictly derived via selector
  const metrics = ngoImpact({ donations });

  // Sync selectedDonationIds with pool without infinite loop
  useEffect(() => {
    setSelectedDonationIds((prev) => {
      const valid = prev.filter((id) => pool.some((d) => d.id === id));
      if (valid.length === 0 && pool.length > 0) {
        return pool.map((d) => d.id);
      }
      if (valid.length === prev.length && valid.every((id, idx) => id === prev[idx])) {
        return prev;
      }
      return valid;
    });
  }, [poolIdsKey]);

  const handleToggleDonation = (id: string) => {
    setSelectedDonationIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const handleSelectAll = () => {
    setSelectedDonationIds(pool.map((d) => d.id));
  };

  const handleDeselectAll = () => {
    setSelectedDonationIds([]);
  };

  const handleGeneratePlan = async () => {
    const selectedDonations = pool.filter((d) => selectedDonationIds.includes(d.id));
    if (selectedDonations.length === 0) return;
    setIsGenerating(true);
    try {
      const plan = await generateCollectionPlan(selectedDonations, providers, ngo);
      setCollectionPlan(plan);
      toast.success(`Generated collection plan with ${plan.trips.length} trip(s)! Saved ~${plan.totalDistanceSavedKm} km`);
    } catch {
      toast.error('Failed to generate collection plan. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleAcceptTrip = (trip: TripPlan) => {
    acceptTripCollection(trip, ngo.vehicle.driverName);
    setActiveTab('pickups');
  };

  return (
    <div className="space-y-6">
      {/* 1. Hub Depot Profile & Nightly Quota Overview */}
      <NgoOverviewHeader ngo={ngo} metrics={metrics} />

      {/* 2. NGO Tabs Navigation (3 tabs: Plan, Pickups, Impact) */}
      <NgoTabBar
        activeTab={activeTab}
        onTabChange={setActiveTab}
        confirmedCount={pool.length}
        activeTripsCount={collections.length}
      />

      {/* 3. TAB 1: PLAN */}
      {activeTab === 'plan' && (
        <div className="space-y-6">
          {/* Map on top: 45vh on mobile, side-by-side or top on desktop */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Map Container: 45% screen height on mobile */}
            <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-200/80 overflow-hidden shadow-xs">
              <div className="p-3.5 border-b border-slate-100 flex items-center justify-between text-xs">
                <span className="font-semibold text-slate-900">Cluster Routing Map</span>
                <span className="text-slate-500">Madurai Depot & Provider Network</span>
              </div>
              <div className="h-[45vh] lg:h-[460px] w-full">
                <NgoMap
                  ngo={ngo}
                  providers={providers}
                  confirmedDonations={pool.filter((d) => selectedDonationIds.includes(d.id))}
                  trips={collectionPlan ? collectionPlan.trips : []}
                />
              </div>
            </div>

            {/* Beside on desktop, below on mobile: Donor list & Capacity */}
            <div className="lg:col-span-5">
              <DonorSelectionList
                donations={pool}
                selectedDonationIds={selectedDonationIds}
                onToggleDonation={handleToggleDonation}
                onSelectAll={handleSelectAll}
                onDeselectAll={handleDeselectAll}
                onLoadDemoBatch={loadDemoDonationsBatch}
                onGeneratePlan={handleGeneratePlan}
                isGenerating={isGenerating}
                vanCapacity={ngo.vanCapacityPortions}
              />
            </div>
          </div>

          {/* Generated Trips Cards */}
          {collectionPlan && collectionPlan.trips.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-semibold text-slate-900">
                  Generated Collection Trips ({collectionPlan.trips.length})
                </h3>
                <span className="text-xs text-emerald-800 font-semibold bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-full">
                  Saved {collectionPlan.totalDistanceSavedKm} km total vs separate trips
                </span>
              </div>

              <div className="grid grid-cols-1 gap-4">
                {collectionPlan.trips.map((trip) => {
                  const isAccepted = collections.some((c) => c.tripNumber === trip.tripNumber);
                  return (
                    <TripPlanCard
                      key={trip.tripNumber}
                      trip={trip}
                      onAcceptTrip={handleAcceptTrip}
                      isAlreadyAccepted={isAccepted}
                    />
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* 4. TAB 2: PICKUPS */}
      {activeTab === 'pickups' && (
        <PickupsTab
          collections={collections}
          donations={donations}
          providers={providers}
          onUpdateStopProgress={updateStopProgress}
          onGoToPlanTab={() => setActiveTab('plan')}
        />
      )}

      {/* 5. TAB 3: IMPACT */}
      {activeTab === 'impact' && (
        <NgoImpactTab
          ngo={ngo}
          metrics={metrics}
          collections={collections}
          donations={donations}
          onRecordReceived={recordCollectionReceived}
          onRecordDistributed={recordCollectionDistributed}
        />
      )}
    </div>
  );
};
