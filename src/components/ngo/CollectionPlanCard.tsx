import React, { useState } from 'react';
import { TripPlan } from '../../types/surplusLink';
import { Truck, CheckCircle2, Clock, MapPin, ShieldCheck, Navigation } from 'lucide-react';

interface CollectionPlanCardProps {
  trip: TripPlan;
  defaultDriverName: string;
  onAcceptCollection: (trip: TripPlan, driverName: string) => void;
  isAlreadyAccepted?: boolean;
}

export const CollectionPlanCard: React.FC<CollectionPlanCardProps> = ({
  trip,
  defaultDriverName,
  onAcceptCollection,
  isAlreadyAccepted = false,
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [driverName, setDriverName] = useState(defaultDriverName);

  const percentCapacity = Math.round((trip.totalPortions / trip.capacityMax) * 100);

  const handleConfirm = () => {
    onAcceptCollection(trip, driverName.trim() || defaultDriverName);
    setIsModalOpen(false);
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-2xs space-y-4">
      {/* Trip Header & Route Distance Savings */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-orange-600 text-white flex items-center justify-center font-black text-sm">
            T{trip.tripNumber}
          </div>
          <div>
            <h4 className="text-sm font-bold text-slate-900">
              Trip #{trip.tripNumber} · Multi-Stop Circuit
            </h4>
            <p className="text-xs text-slate-500">
              {trip.stops.length} Stops · {trip.distanceKm} km · ~{trip.durationMins} mins
            </p>
          </div>
        </div>

        {/* Distance Savings vs Separate Trips */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-lg text-emerald-900 text-xs font-bold">
            Saved: {trip.distanceSavedKm} km ({trip.distanceSavedPercent}% less travel)
          </div>

          {!isAlreadyAccepted ? (
            <button
              type="button"
              onClick={() => setIsModalOpen(true)}
              className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition-all shadow-xs flex items-center gap-1.5"
            >
              <CheckCircle2 className="h-3.5 w-3.5" />
              Accept Collection
            </button>
          ) : (
            <span className="text-xs font-bold text-emerald-800 bg-emerald-100 px-3 py-1 rounded-lg">
              Collection Scheduled
            </span>
          )}
        </div>
      </div>

      {/* Van Load & Metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
        <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200">
          <span className="text-slate-400 block text-[10px] uppercase font-bold">Load Volume</span>
          <span className="font-bold text-slate-800">
            {trip.totalPortions} / {trip.capacityMax} portions ({percentCapacity}%)
          </span>
        </div>
        <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200">
          <span className="text-slate-400 block text-[10px] uppercase font-bold">Road Route</span>
          <span className="font-bold text-slate-800">{trip.distanceKm} km (OSRM)</span>
        </div>
        <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200">
          <span className="text-slate-400 block text-[10px] uppercase font-bold">Duration</span>
          <span className="font-bold text-slate-800">~{trip.durationMins} minutes</span>
        </div>
        <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200">
          <span className="text-slate-400 block text-[10px] uppercase font-bold">Independent Trips</span>
          <span className="font-bold text-slate-500 line-through">{trip.separateTripsDistanceKm} km</span>
        </div>
      </div>

      {/* Ordered Stops Manifest */}
      <div className="space-y-2 text-xs">
        <span className="font-bold text-slate-700 block text-[11px] uppercase">
          Optimized Circuit Order:
        </span>
        <div className="space-y-1.5">
          {trip.stops.map((stop) => (
            <div
              key={stop.donationId}
              className="bg-slate-50/80 border border-slate-200 rounded-lg p-2.5 flex items-center justify-between"
            >
              <div className="flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-slate-200 text-slate-700 flex items-center justify-center font-bold text-[10px]">
                  {stop.stopOrder}
                </span>
                <div>
                  <strong className="text-slate-900">{stop.providerName}</strong>
                  <span className="text-slate-500 ml-1.5">({stop.foodItem})</span>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <span className="font-bold text-emerald-700">{stop.portions} portions</span>
                <span className="text-slate-500 flex items-center gap-1">
                  <Clock className="h-3 w-3 text-slate-400" />
                  Due: {stop.collectionDeadline}
                </span>
                <span className="font-mono text-emerald-800 bg-emerald-50 px-1.5 py-0.2 rounded border border-emerald-200">
                  {stop.verificationOtp}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Modal: Confirm Accept Collection & Driver Assignment */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-5 space-y-4 shadow-2xl">
            <h4 className="text-sm font-bold text-slate-900">
              Schedule Collection Run · Trip #{trip.tripNumber}
            </h4>
            <div className="space-y-1.5 text-xs">
              <label className="block font-semibold text-slate-700">Assign Driver Name *</label>
              <input
                type="text"
                value={driverName}
                onChange={(e) => setDriverName(e.target.value)}
                placeholder="Driver Name"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm font-bold"
              />
              <p className="text-[11px] text-slate-500">
                Will dispatch {trip.totalPortions} portions across {trip.stops.length} stops to this driver.
              </p>
            </div>
            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirm}
                className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg shadow-xs"
              >
                Confirm & Dispatch Run
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
