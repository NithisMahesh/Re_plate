import React from 'react';
import { TripPlan } from '../../types/surplusLink';
import { CheckCircle2, Clock } from 'lucide-react';
import { Button } from '../shared/Button';
import { StatusChip } from '../shared/StatusChip';
import { useToast } from '../shared/Toast';

interface TripPlanCardProps {
  trip: TripPlan;
  onAcceptTrip: (trip: TripPlan) => void;
  isAlreadyAccepted?: boolean;
}

export const TripPlanCard: React.FC<TripPlanCardProps> = ({
  trip,
  onAcceptTrip,
  isAlreadyAccepted = false,
}) => {
  const toast = useToast();

  const handleAccept = () => {
    onAcceptTrip(trip);
    toast.success(`Trip #${trip.tripNumber} accepted! Assigned to driver.`);
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 p-5 sm:p-6 shadow-xs space-y-4 transition-all duration-150">
      {/* Trip Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-bold text-sm shadow-xs shadow-emerald-600/30">
            T{trip.tripNumber}
          </div>
          <div>
            <h4 className="text-base font-semibold text-slate-900">Trip #{trip.tripNumber}</h4>
            <p className="text-xs text-slate-500 mt-0.5">
              {trip.stops.length} stops · {trip.distanceKm} km · ~{trip.durationMins} mins · {trip.totalPortions} portions
            </p>
          </div>
        </div>

        {/* Saved Distance & Accept Button */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="bg-emerald-50 border border-emerald-200/80 px-3 py-1.5 rounded-xl text-emerald-900 text-xs font-semibold">
            Saved {trip.distanceSavedKm} km vs separate trips (estimate)
          </div>

          {!isAlreadyAccepted ? (
            <Button
              variant="primary"
              size="md"
              icon={<CheckCircle2 className="h-4 w-4" />}
              onClick={handleAccept}
            >
              Accept trip
            </Button>
          ) : (
            <StatusChip variant="done">
              Trip accepted
            </StatusChip>
          )}
        </div>
      </div>

      {/* Stops in Order */}
      <div className="space-y-2">
        <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">
          Stops in order ({trip.stops.length}):
        </span>

        <div className="space-y-2">
          {trip.stops.map((stop, idx) => {
            const isDeadlineMet = stop.isDeadlineMet !== false;
            return (
              <div
                key={stop.donationId}
                className="bg-slate-50 border border-slate-200/80 rounded-xl p-3 flex items-center justify-between text-xs"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <span className="w-6 h-6 rounded-full bg-slate-900 text-white text-xs font-bold flex items-center justify-center shrink-0">
                    {idx + 1}
                  </span>
                  <div className="min-w-0">
                    <div className="font-semibold text-slate-900 truncate">{stop.providerName}</div>
                    <div className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                      <Clock className="h-3.5 w-3.5 text-slate-400" />
                      <span>Deadline: {stop.collectionDeadline}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 sm:gap-3 shrink-0">
                  <span className="font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200 text-xs">
                    {stop.portions} portions
                  </span>

                  {/* Green or red deadline check */}
                  {isDeadlineMet ? (
                    <StatusChip variant="done">
                      On time
                    </StatusChip>
                  ) : (
                    <StatusChip variant="failed">
                      Tight deadline
                    </StatusChip>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
