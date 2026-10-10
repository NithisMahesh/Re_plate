import {
  NGO,
  Provider,
  FoodDonation,
  TripPlan,
  TripStop,
  CollectionPlan,
} from '../types/surplusLink';

/**
 * Calculates Haversine great-circle distance between two GPS coordinates in kilometers
 */
export function haversineDistanceKm(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371; // Earth's radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Number((R * c).toFixed(2));
}

/**
 * Fetches real road distance, duration, and GeoJSON polyline geometry from public OSRM API
 * Note: OSRM expects coordinates in lon,lat order!
 */
async function fetchOsrmRoute(
  coords: { lat: number; lng: number }[]
): Promise<{
  distanceKm: number;
  durationMins: number;
  polyline: [number, number][];
  success: boolean;
}> {
  try {
    const coordString = coords.map((c) => `${c.lng},${c.lat}`).join(';');
    const url = `https://router.project-osrm.org/route/v1/driving/${coordString}?overview=full&geometries=geojson`;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 6000); // 6s timeout

    const res = await fetch(url, { signal: controller.signal });
    clearTimeout(timeoutId);

    if (!res.ok) throw new Error(`OSRM HTTP error: ${res.status}`);
    const data = await res.json();

    if (data.code === 'Ok' && data.routes && data.routes.length > 0) {
      const route = data.routes[0];
      const distanceKm = Number((route.distance / 1000).toFixed(1));
      const durationMins = Math.round(route.duration / 60);
      // OSRM returns GeoJSON coordinates as [lng, lat] -> convert to Leaflet [lat, lng]
      const polyline: [number, number][] = route.geometry.coordinates.map(
        ([lng, lat]: [number, number]) => [lat, lng]
      );

      return {
        distanceKm,
        durationMins,
        polyline,
        success: true,
      };
    }
    throw new Error('OSRM route not found');
  } catch (err) {
    console.warn('OSRM routing failed or timed out, falling back to Haversine estimate:', err);
    return {
      distanceKm: 0,
      durationMins: 0,
      polyline: [],
      success: false,
    };
  }
}

/**
 * Main Collection Planning Engine
 */
export async function generateCollectionPlan(
  confirmedDonations: FoodDonation[],
  providers: Provider[],
  ngo: NGO
): Promise<CollectionPlan> {
  const providerMap = new Map(providers.map((p) => [p.id, p]));
  const capacityMax = ngo.vanCapacityPortions; // 60 portions
  const now = Date.now();

  // 1. FILTER CONFIRMED DONATIONS: Exclude any whose deadline can't be met
  const validCandidates: {
    donation: FoodDonation;
    provider: Provider;
    distanceFromNgo: number;
  }[] = [];

  let excludedCount = 0;

  for (const d of confirmedDonations) {
    if (d.status !== 'Confirmed') continue;
    const provider = providerMap.get(d.providerId);
    if (!provider) continue;

    // Check deadline: must have at least 15 minutes buffer
    const remainingMs = d.deadlineTimestamp - now;
    if (remainingMs < 15 * 60 * 1000) {
      excludedCount++;
      continue;
    }

    const distFromNgo = haversineDistanceKm(ngo.lat, ngo.lng, provider.lat, provider.lng);
    validCandidates.push({ donation: d, provider, distanceFromNgo: distFromNgo });
  }

  // 2. GROUP RESPECTING VAN CAPACITY (60 portions)
  // Greedy strategy: prefer nearest donors to NGO first, never exceed capacity
  validCandidates.sort((a, b) => a.distanceFromNgo - b.distanceFromNgo);

  const tripGroups: (typeof validCandidates)[] = [];
  const unassigned = [...validCandidates];

  while (unassigned.length > 0) {
    const currentTrip: typeof validCandidates = [];
    let currentPortions = 0;

    let i = 0;
    while (i < unassigned.length) {
      const candidate = unassigned[i];
      if (currentPortions + candidate.donation.portions <= capacityMax) {
        currentTrip.push(candidate);
        currentPortions += candidate.donation.portions;
        unassigned.splice(i, 1);
      } else {
        i++;
      }
    }

    // Safety fallback: if a single donation alone exceeds capacityMax, isolate it
    if (currentTrip.length === 0 && unassigned.length > 0) {
      currentTrip.push(unassigned.shift()!);
    }

    tripGroups.push(currentTrip);
  }

  // 3. FOR EACH TRIP: ORDER STOPS WITH NEAREST-NEIGHBOR HEURISTIC
  // Start from NGO base -> visit nearest unvisited stop -> ... -> return to NGO
  const trips: TripPlan[] = [];

  for (let tripIdx = 0; tripIdx < tripGroups.length; tripIdx++) {
    const group = tripGroups[tripIdx];
    const unvisited = [...group];
    let currentLocation = { lat: ngo.lat, lng: ngo.lng };
    const orderedStops: typeof group = [];

    while (unvisited.length > 0) {
      let nearestIdx = 0;
      let minDistance = Infinity;

      for (let j = 0; j < unvisited.length; j++) {
        const d = haversineDistanceKm(
          currentLocation.lat,
          currentLocation.lng,
          unvisited[j].provider.lat,
          unvisited[j].provider.lng
        );
        if (d < minDistance) {
          minDistance = d;
          nearestIdx = j;
        }
      }

      const nextStop = unvisited.splice(nearestIdx, 1)[0];
      orderedStops.push(nextStop);
      currentLocation = { lat: nextStop.provider.lat, lng: nextStop.provider.lng };
    }

    // Prepare full route coordinates [NGO -> Stop1 -> Stop2 -> ... -> NGO]
    const fullRouteCoords = [
      { lat: ngo.lat, lng: ngo.lng },
      ...orderedStops.map((s) => ({ lat: s.provider.lat, lng: s.provider.lng })),
      { lat: ngo.lat, lng: ngo.lng },
    ];

    // 4. GET ROAD DISTANCE & DURATION FROM OSRM (OR FALLBACK TO HAVERSINE)
    const osrmResult = await fetchOsrmRoute(fullRouteCoords);

    let routeDistanceKm = 0;
    let routeDurationMins = 0;
    let polylineCoords: [number, number][] = [];
    let isEstimated = false;

    if (osrmResult.success) {
      routeDistanceKm = osrmResult.distanceKm;
      // Duration = driving duration + 6 mins loading per stop
      routeDurationMins = osrmResult.durationMins + orderedStops.length * 6;
      polylineCoords = osrmResult.polyline;
      isEstimated = false;
    } else {
      // Fallback: Haversine distance with 1.35 urban road circuity factor
      let straightDist = 0;
      for (let k = 0; k < fullRouteCoords.length - 1; k++) {
        straightDist += haversineDistanceKm(
          fullRouteCoords[k].lat,
          fullRouteCoords[k].lng,
          fullRouteCoords[k + 1].lat,
          fullRouteCoords[k + 1].lng
        );
      }
      routeDistanceKm = Number((straightDist * 1.35).toFixed(1));
      // Average city speed 25 km/h + 6 mins loading per stop
      routeDurationMins = Math.round((routeDistanceKm / 25) * 60) + orderedStops.length * 6;
      polylineCoords = fullRouteCoords.map((c) => [c.lat, c.lng]);
      isEstimated = true;
    }

    // 5. COMPARE SEPARATE ROUND TRIPS VS COMBINED ROUTE
    // Separate trips: 2 * distance from NGO to provider * 1.35 road factor
    let separateTripsDistanceKm = 0;
    orderedStops.forEach((s) => {
      const oneWayKm = haversineDistanceKm(ngo.lat, ngo.lng, s.provider.lat, s.provider.lng);
      separateTripsDistanceKm += oneWayKm * 2 * 1.35;
    });
    separateTripsDistanceKm = Number(separateTripsDistanceKm.toFixed(1));

    const distanceSavedKm = Math.max(
      0,
      Number((separateTripsDistanceKm - routeDistanceKm).toFixed(1))
    );
    const distanceSavedPercent =
      separateTripsDistanceKm > 0
        ? Math.round((distanceSavedKm / separateTripsDistanceKm) * 100)
        : 0;

    // 6. BUILD TRIP STOPS WITH DEADLINE VERIFICATION
    let cumulativeMins = 0;
    let prevLoc = { lat: ngo.lat, lng: ngo.lng };
    let allDeadlinesMet = true;

    const tripStops: TripStop[] = orderedStops.map((item, idx) => {
      const legDist = haversineDistanceKm(
        prevLoc.lat,
        prevLoc.lng,
        item.provider.lat,
        item.provider.lng
      );
      // ~2.5 mins per km + 6 mins loading per stop
      const legTravelMins = Math.round(legDist * 1.35 * 2.4) + 6;
      cumulativeMins += legTravelMins;
      prevLoc = { lat: item.provider.lat, lng: item.provider.lng };

      const arrivalTimeMs = now + cumulativeMins * 60 * 1000;
      const isMet = arrivalTimeMs <= item.donation.deadlineTimestamp;
      if (!isMet) allDeadlinesMet = false;

      return {
        stopOrder: idx + 1,
        providerId: item.provider.id,
        providerName: item.provider.name,
        providerType: item.provider.type,
        address: item.provider.address,
        lat: item.provider.lat,
        lng: item.provider.lng,
        donationId: item.donation.id,
        foodItem: item.donation.foodItem,
        portions: item.donation.portions,
        collectionDeadline: item.donation.collectionDeadline,
        deadlineTimestamp: item.donation.deadlineTimestamp,
        verificationOtp: item.donation.verificationOtp,
        estimatedArrivalMinutesFromStart: cumulativeMins,
        isDeadlineMet: isMet,
      };
    });

    const tripTotalPortions = tripStops.reduce((sum, s) => sum + s.portions, 0);

    trips.push({
      tripNumber: tripIdx + 1,
      stops: tripStops,
      totalPortions: tripTotalPortions,
      capacityMax,
      distanceKm: routeDistanceKm,
      durationMins: routeDurationMins,
      isEstimatedDistance: isEstimated,
      polylineCoordinates: polylineCoords,
      separateTripsDistanceKm,
      distanceSavedKm,
      distanceSavedPercent,
      allDeadlinesMet,
    });
  }

  const grandTotalPortions = trips.reduce((sum, t) => sum + t.totalPortions, 0);
  const grandTotalDistanceKm = Number(
    trips.reduce((sum, t) => sum + t.distanceKm, 0).toFixed(1)
  );
  const grandSeparateDistance = trips.reduce((sum, t) => sum + t.separateTripsDistanceKm, 0);
  const grandDistanceSaved = Math.max(
    0,
    Number((grandSeparateDistance - grandTotalDistanceKm).toFixed(1))
  );
  const grandDistanceSavedPercent =
    grandSeparateDistance > 0
      ? Math.round((grandDistanceSaved / grandSeparateDistance) * 100)
      : 0;

  return {
    id: `plan-${Date.now()}`,
    createdAt: new Date().toISOString(),
    trips,
    totalPortions: grandTotalPortions,
    totalDistanceKm: grandTotalDistanceKm,
    totalDistanceSavedKm: grandDistanceSaved,
    totalDistanceSavedPercent: grandDistanceSavedPercent,
    totalDonorsCount: validCandidates.length,
    excludedCount,
  };
}
