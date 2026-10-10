import React, { createContext, useContext, useReducer, useEffect, useState } from 'react';
import {
  ActiveRole,
  CollegeAnchor,
  Provider,
  ProviderDefaults,
  NGO,
  FoodDonation,
  DonationStatus,
  TripPlan,
  Collection,
  StopProgressStatus,
  InAppNotification,
} from '../types/surplusLink';
import {
  COLLEGE_ANCHOR,
  SEED_PROVIDERS,
  SEED_NGO,
  SEED_INITIAL_DONATIONS,
  SEED_INITIAL_COLLECTIONS,
} from '../data/surplusLinkData';
import { SurplusLinkState, collectionTotals } from '../selectors';

const STORAGE_KEY = 'surpluslink_madurai_state_v3';

// Action Types
type Action =
  | {
      type: 'ADD_DONATION';
      payload: Omit<FoodDonation, 'id' | 'createdAt' | 'status' | 'verificationOtp'>;
    }
  | {
      type: 'UPDATE_DONATION_STATUS';
      payload: { donationId: string; status: DonationStatus };
    }
  | {
      type: 'CREATE_COLLECTION';
      payload: { trip: TripPlan; driverName: string };
    }
  | {
      type: 'UPDATE_STOP_PROGRESS';
      payload: {
        collectionId: string;
        donationId: string;
        newStatus: StopProgressStatus;
        actualQty?: number;
        failReason?: string;
      };
    }
  | {
      type: 'RECORD_COLLECTION_RECEIVED';
      payload: { collectionId: string; quantityReceived: number };
    }
  | {
      type: 'RECORD_COLLECTION_DISTRIBUTED';
      payload: { collectionId: string; quantityDistributed: number; notes?: string };
    }
  | {
      type: 'LOAD_DEMO_DONATIONS';
    }
  | {
      type: 'DISMISS_NOTIFICATION';
      payload: { notificationId: string };
    }
  | {
      type: 'UPDATE_PROVIDER_DEFAULTS';
      payload: { providerId: string; defaults: Partial<ProviderDefaults> };
    }
  | {
      type: 'SKIP_TONIGHT_DONATION';
      payload: { providerId: string };
    }
  | {
      type: 'UNSKIP_TONIGHT_DONATION';
      payload: { providerId: string };
    }
  | {
      type: 'RESET_DEMO_DATA';
    };

const initialDefaultState: SurplusLinkState = {
  providers: SEED_PROVIDERS,
  ngo: SEED_NGO,
  donations: SEED_INITIAL_DONATIONS,
  collections: SEED_INITIAL_COLLECTIONS,
  notifications: [],
};

function loadInitialState(): SurplusLinkState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return initialDefaultState;
    const parsed = JSON.parse(raw);
    if (
      Array.isArray(parsed.donations) &&
      Array.isArray(parsed.collections) &&
      Array.isArray(parsed.providers) &&
      parsed.ngo
    ) {
      return {
        providers: parsed.providers || SEED_PROVIDERS,
        ngo: parsed.ngo || SEED_NGO,
        donations: parsed.donations,
        collections: parsed.collections,
        notifications: Array.isArray(parsed.notifications) ? parsed.notifications : [],
      };
    }
    return initialDefaultState;
  } catch (err) {
    console.warn('Failed to load SurplusLink state from localStorage, using seed data:', err);
    return initialDefaultState;
  }
}

function surplusLinkReducer(state: SurplusLinkState, action: Action): SurplusLinkState {
  switch (action.type) {
    case 'ADD_DONATION': {
      const confirmed = action.payload.confirmedPortions ?? action.payload.portions ?? 0;
      const newDonation: FoodDonation = {
        ...action.payload,
        id: `don-${Date.now()}`,
        confirmedPortions: confirmed,
        portions: confirmed,
        verificationOtp: String(Math.floor(1000 + Math.random() * 9000)),
        status: 'Confirmed',
        createdAt: new Date().toISOString(),
      };
      return {
        ...state,
        donations: [newDonation, ...state.donations],
      };
    }

    case 'UPDATE_DONATION_STATUS': {
      return {
        ...state,
        donations: state.donations.map((d) =>
          d.id === action.payload.donationId ? { ...d, status: action.payload.status } : d
        ),
      };
    }

    case 'CREATE_COLLECTION': {
      const { trip, driverName } = action.payload;
      const collectionId = `coll-${Date.now()}`;
      const now = new Date();

      const stopProgress: Collection['stopProgress'] = {};
      const newNotifications: InAppNotification[] = [];

      trip.stops.forEach((s) => {
        const arrivalDate = new Date(now.getTime() + s.estimatedArrivalMinutesFromStart * 60 * 1000);
        const arrivalHours = String(arrivalDate.getHours()).padStart(2, '0');
        const arrivalMins = String(arrivalDate.getMinutes()).padStart(2, '0');
        const arrivalTimeFormatted = `${arrivalHours}:${arrivalMins}`;

        stopProgress[s.donationId] = {
          status: 'Pending',
          estimatedArrivalMinutesFromStart: s.estimatedArrivalMinutesFromStart,
          estimatedArrivalTimeFormatted: arrivalTimeFormatted,
        };

        newNotifications.push({
          id: `notif-${Date.now()}-${s.providerId}`,
          targetRole: 'provider',
          targetProviderId: s.providerId,
          title: 'Van Pickup Scheduled!',
          message: `${driverName.trim() || state.ngo.vehicle.driverName} is scheduled to pick up "${s.foodItem}" (${s.portions} portions) at approximately ${arrivalTimeFormatted}.`,
          type: 'info',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          relatedCollectionId: collectionId,
        });
      });

      const newCollection: Collection = {
        id: collectionId,
        tripNumber: trip.tripNumber,
        driver: {
          name: driverName.trim() || state.ngo.vehicle.driverName,
          phone: state.ngo.vehicle.driverPhone,
        },
        donationIds: trip.stops.map((s) => s.donationId),
        route: {
          distanceKm: trip.distanceKm,
          durationMins: trip.durationMins,
          polyline: trip.polylineCoordinates,
          isEstimatedDistance: trip.isEstimatedDistance,
          separateTripsDistanceKm: trip.separateTripsDistanceKm,
          distanceSavedKm: trip.distanceSavedKm,
          distanceSavedPercent: trip.distanceSavedPercent,
        },
        status: 'Scheduled',
        stopProgress,
        scheduledAt: new Date().toISOString(),
      };

      newNotifications.unshift({
        id: `notif-${Date.now()}-ngo`,
        targetRole: 'ngo',
        title: `Trip ${trip.tripNumber} Collection Scheduled`,
        message: `${newCollection.driver.name} assigned to collect ${trip.totalPortions} portions across ${trip.stops.length} stops.`,
        type: 'success',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        relatedCollectionId: collectionId,
      });

      const updatedDonations = state.donations.map((d) => {
        if (stopProgress[d.id]) {
          return {
            ...d,
            status: 'Scheduled' as DonationStatus,
            scheduledCollectionId: collectionId,
            scheduledTripNumber: trip.tripNumber,
            driverName: newCollection.driver.name,
            estimatedPickupTime: stopProgress[d.id].estimatedArrivalTimeFormatted,
          };
        }
        return d;
      });

      return {
        ...state,
        collections: [newCollection, ...state.collections],
        donations: updatedDonations,
        notifications: [...newNotifications, ...state.notifications],
      };
    }

    case 'UPDATE_STOP_PROGRESS': {
      const { collectionId, donationId, newStatus, actualQty, failReason } = action.payload;
      const targetCollection = state.collections.find((c) => c.id === collectionId);
      if (!targetCollection) return state;

      const targetDonation = state.donations.find((d) => d.id === donationId);
      const confirmedQty = targetDonation ? (targetDonation.confirmedPortions ?? targetDonation.portions) : 0;
      const actual = actualQty ?? confirmedQty;
      const discrepancy = actual - confirmedQty;
      const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

      // 1. Update stopProgress map on collection
      const existingProgress = targetCollection.stopProgress[donationId] || { status: 'Pending' };
      const updatedProgress = {
        ...existingProgress,
        status: newStatus,
        collectedAt: newStatus === 'Collected' ? new Date().toISOString() : existingProgress.collectedAt,
        failReason: newStatus === 'Failed' ? failReason || 'Unable to collect surplus' : existingProgress.failReason,
      };

      const newStopProgress = {
        ...targetCollection.stopProgress,
        [donationId]: updatedProgress,
      };

      // Determine updated collection status
      const stopStatuses = targetCollection.donationIds.map((id) => newStopProgress[id]?.status || 'Pending');
      const allCollected = stopStatuses.every((s) => s === 'Collected');
      const anyFailed = stopStatuses.some((s) => s === 'Failed');
      const anyInProgress = stopStatuses.some((s) => s === 'En route' || s === 'Arrived');

      let colStatus: Collection['status'] = 'In Progress';
      if (allCollected) colStatus = 'Completed';
      else if (anyFailed && !anyInProgress) colStatus = 'Partially Failed';

      const updatedCollections = state.collections.map((c) => {
        if (c.id !== collectionId) return c;
        return {
          ...c,
          status: colStatus,
          stopProgress: newStopProgress,
          completedAt: colStatus === 'Completed' ? new Date().toISOString() : c.completedAt,
        };
      });

      // 2. Update donation quantities and status
      const updatedDonations = state.donations.map((d) => {
        if (d.id !== donationId) return d;

        if (newStatus === 'Collected') {
          return {
            ...d,
            status: 'Collected' as DonationStatus,
            collectedPortions: actual,
          };
        }

        if (newStatus === 'Failed') {
          return {
            ...d,
            status: 'Failed' as DonationStatus,
            failureReason: failReason || 'Collection failed',
          };
        }

        return {
          ...d,
          status: newStatus as DonationStatus,
        };
      });

      // 3. Notifications on discrepancy or failure
      const newNotifications: InAppNotification[] = [];
      const foodItemName = targetDonation?.foodItem || 'Surplus Item';
      const providerId = targetDonation?.providerId;

      if (newStatus === 'Collected' && discrepancy !== 0) {
        newNotifications.push({
          id: `notif-${Date.now()}-discrepancy`,
          targetRole: 'all',
          targetProviderId: providerId,
          title: `Quantity Discrepancy Noted (${discrepancy > 0 ? `+${discrepancy}` : discrepancy} Portions)`,
          message: `At stop "${foodItemName}": Confirmed ${confirmedQty} portions, but driver recorded ${actual} actual portions.`,
          type: 'warning',
          timestamp: timeStr,
          relatedCollectionId: collectionId,
        });
      }

      if (newStatus === 'Failed') {
        newNotifications.push(
          {
            id: `notif-${Date.now()}-failed-prov`,
            targetRole: 'provider',
            targetProviderId: providerId,
            title: `Pickup Failed: ${foodItemName}`,
            message: `The driver was unable to collect this surplus. Reason: "${failReason || 'Unknown'}". Your surplus has been unassigned and is eligible for replanning.`,
            type: 'error',
            timestamp: timeStr,
            relatedCollectionId: collectionId,
          },
          {
            id: `notif-${Date.now()}-failed-ngo`,
            targetRole: 'ngo',
            title: `Pickup Failed: ${foodItemName}`,
            message: `Pickup failed (${failReason}). ${confirmedQty} portions capacity freed up in van. Remaining route stops continue as scheduled.`,
            type: 'warning',
            timestamp: timeStr,
            relatedCollectionId: collectionId,
          }
        );
      }

      return {
        ...state,
        collections: updatedCollections,
        donations: updatedDonations,
        notifications: [...newNotifications, ...state.notifications],
      };
    }

    case 'RECORD_COLLECTION_RECEIVED': {
      const { collectionId, quantityReceived } = action.payload;
      const targetColl = state.collections.find((c) => c.id === collectionId);
      if (!targetColl) return state;

      const nowIso = new Date().toISOString();
      const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

      // Compute total collected portions for this collection
      const collectedDonations = state.donations.filter(
        (d) => targetColl.donationIds.includes(d.id) && (d.status === 'Collected' || d.status === 'Received' || d.status === 'Distributed')
      );
      const totalCollected = collectedDonations.reduce((sum, d) => sum + (d.collectedPortions || d.confirmedPortions || 0), 0) || 1;

      // Update constituent donations: assign receivedPortions and status
      const updatedDonations = state.donations.map((d) => {
        if (!targetColl.donationIds.includes(d.id)) return d;
        if (d.status !== 'Collected' && d.status !== 'Received' && d.status !== 'Distributed') return d;

        const stopCollected = d.collectedPortions || d.confirmedPortions || 0;
        const stopReceived = Math.round(((stopCollected / totalCollected) * quantityReceived) * 10) / 10;

        return {
          ...d,
          status: (d.status === 'Distributed' ? 'Distributed' : 'Received') as DonationStatus,
          receivedPortions: stopReceived,
          receivedAt: nowIso,
        };
      });

      const notif: InAppNotification = {
        id: `notif-${Date.now()}-intake-ngo`,
        targetRole: 'ngo',
        title: `Intake Verified: ${quantityReceived} Portions Received`,
        message: `Trip food intake logged at NGO hub. Ready for evening meal distribution.`,
        type: 'success',
        timestamp: timeStr,
        relatedCollectionId: collectionId,
      };

      return {
        ...state,
        donations: updatedDonations,
        notifications: [notif, ...state.notifications],
      };
    }

    case 'RECORD_COLLECTION_DISTRIBUTED': {
      const { collectionId, quantityDistributed, notes } = action.payload;
      const targetColl = state.collections.find((c) => c.id === collectionId);
      if (!targetColl) return state;

      const nowIso = new Date().toISOString();
      const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

      const collectedDonations = state.donations.filter(
        (d) => targetColl.donationIds.includes(d.id) && (d.status === 'Collected' || d.status === 'Received' || d.status === 'Distributed')
      );
      const totalCollected = collectedDonations.reduce((sum, d) => sum + (d.collectedPortions || d.confirmedPortions || 0), 0) || 1;

      const providerNotifs: InAppNotification[] = [];

      const updatedDonations = state.donations.map((d) => {
        if (!targetColl.donationIds.includes(d.id)) return d;
        if (d.status !== 'Collected' && d.status !== 'Received' && d.status !== 'Distributed') return d;

        const stopCollected = d.collectedPortions || d.confirmedPortions || 0;
        const stopDistributed = Math.round(((stopCollected / totalCollected) * quantityDistributed) * 10) / 10;

        providerNotifs.push({
          id: `notif-${Date.now()}-${d.providerId}-distrib`,
          targetRole: 'provider',
          targetProviderId: d.providerId,
          title: 'Verified Impact: Meals Distributed!',
          message: `Your donation helped provide ${stopDistributed} meals today.`,
          type: 'success',
          timestamp: timeStr,
          relatedCollectionId: collectionId,
        });

        return {
          ...d,
          status: 'Distributed' as DonationStatus,
          distributedPortions: stopDistributed,
          distributedAt: nowIso,
        };
      });

      const updatedCollections = state.collections.map((c) => {
        if (c.id !== collectionId) return c;
        return {
          ...c,
          distributionNotes: notes,
        };
      });

      const ngoNotif: InAppNotification = {
        id: `notif-${Date.now()}-distrib-ngo`,
        targetRole: 'ngo',
        title: `Distribution Recorded: ${quantityDistributed} Meals Served`,
        message: `Evening feeding complete! Beneficiaries fed tonight. Only distributed portions are tallied as meals served.`,
        type: 'success',
        timestamp: timeStr,
        relatedCollectionId: collectionId,
      };

      return {
        ...state,
        collections: updatedCollections,
        donations: updatedDonations,
        notifications: [ngoNotif, ...providerNotifs, ...state.notifications],
      };
    }

    case 'LOAD_DEMO_DONATIONS': {
      const now = Date.now();
      const demoItems: FoodDonation[] = [
        {
          id: `demo-${now}-1`,
          providerId: 'prov-b3',
          providerName: 'Annapoorna Bread & Biscuit Stall',
          providerType: 'bakery',
          foodItem: 'Fresh Coconut Buns & Milk Rusks',
          category: 'bakery_bread',
          confirmedPortions: 8,
          portions: 8,
          preparedQty: 40,
          soldQty: 31,
          discardQty: 1,
          storageType: 'room_temp',
          preparedTime: '18:30',
          collectionDeadline: '23:59',
          deadlineTimestamp: now + 180 * 60 * 1000,
          dietary: 'veg',
          verificationOtp: '3318',
          status: 'Confirmed',
          createdAt: new Date().toISOString(),
          notes: 'Packed in clean bread crates ready for quick loading.',
        },
        {
          id: `demo-${now}-2`,
          providerId: 'prov-b1',
          providerName: 'Sri Krishna Bakes & Confectionery',
          providerType: 'bakery',
          foodItem: 'Sandwich Bread Loaves & Vegetable Puffs',
          category: 'bakery_bread',
          confirmedPortions: 12,
          portions: 12,
          preparedQty: 55,
          soldQty: 41,
          discardQty: 2,
          storageType: 'room_temp',
          preparedTime: '18:00',
          collectionDeadline: '23:45',
          deadlineTimestamp: now + 160 * 60 * 1000,
          dietary: 'veg',
          verificationOtp: '5092',
          status: 'Confirmed',
          createdAt: new Date().toISOString(),
          notes: 'Sealed food-grade paper bags.',
        },
        {
          id: `demo-${now}-3`,
          providerId: 'prov-m1',
          providerName: 'Kaveri Boys Hostel Dining Mess',
          providerType: 'hostel_mess',
          foodItem: 'Steamed Ponni Rice, Sambar & Poriyal',
          category: 'rice_curry',
          confirmedPortions: 15,
          portions: 15,
          preparedQty: 95,
          soldQty: 77,
          discardQty: 3,
          storageType: 'hot_held',
          preparedTime: '20:15',
          collectionDeadline: '22:45',
          deadlineTimestamp: now + 90 * 60 * 1000,
          dietary: 'veg',
          verificationOtp: '8214',
          status: 'Confirmed',
          createdAt: new Date().toISOString(),
          notes: 'Hot food kept in insulated thermal vessels at >65°C.',
        },
        {
          id: `demo-${now}-4`,
          providerId: 'prov-r1',
          providerName: 'Murugan Idli Shop - College Road',
          providerType: 'restaurant',
          foodItem: 'Mallipoo Idlis, Medu Vada & Chutneys',
          category: 'snacks_tiffin',
          confirmedPortions: 20,
          portions: 20,
          preparedQty: 100,
          soldQty: 76,
          discardQty: 4,
          storageType: 'hot_held',
          preparedTime: '20:30',
          collectionDeadline: '23:00',
          deadlineTimestamp: now + 105 * 60 * 1000,
          dietary: 'veg',
          verificationOtp: '7412',
          status: 'Confirmed',
          createdAt: new Date().toISOString(),
          notes: 'Packed in thermal takeaway foil containers.',
        },
        {
          id: `demo-${now}-5`,
          providerId: 'prov-r4',
          providerName: 'Sree Sabarees Pure Vegetarian Bistro',
          providerType: 'restaurant',
          foodItem: 'Ghee Pongal, Kesari & Coconut Chutney',
          category: 'cooked_meal',
          confirmedPortions: 10,
          portions: 10,
          preparedQty: 60,
          soldQty: 48,
          discardQty: 2,
          storageType: 'hot_held',
          preparedTime: '20:45',
          collectionDeadline: '23:15',
          deadlineTimestamp: now + 120 * 60 * 1000,
          dietary: 'veg',
          verificationOtp: '9160',
          status: 'Confirmed',
          createdAt: new Date().toISOString(),
          notes: 'Hot-held in insulated soup warmers.',
        },
      ];

      return {
        ...state,
        donations: demoItems,
      };
    }

    case 'DISMISS_NOTIFICATION': {
      return {
        ...state,
        notifications: state.notifications.filter((n) => n.id !== action.payload.notificationId),
      };
    }

    case 'UPDATE_PROVIDER_DEFAULTS': {
      return {
        ...state,
        providers: state.providers.map((p) =>
          p.id === action.payload.providerId
            ? {
                ...p,
                defaults: {
                  ...(p.defaults as ProviderDefaults),
                  ...action.payload.defaults,
                },
              }
            : p
        ),
      };
    }

    case 'SKIP_TONIGHT_DONATION': {
      return {
        ...state,
        providers: state.providers.map((p) =>
          p.id === action.payload.providerId ? { ...p, isSkippedTonight: true } : p
        ),
        notifications: [
          {
            id: `notif-${Date.now()}`,
            targetRole: 'provider',
            targetProviderId: action.payload.providerId,
            title: 'No Surplus Tonight Logged',
            message: 'Recorded no surplus for tonight. Dispatchers and drivers notified.',
            type: 'info',
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          },
          ...state.notifications,
        ],
      };
    }

    case 'UNSKIP_TONIGHT_DONATION': {
      return {
        ...state,
        providers: state.providers.map((p) =>
          p.id === action.payload.providerId ? { ...p, isSkippedTonight: false } : p
        ),
      };
    }

    case 'RESET_DEMO_DATA': {
      return initialDefaultState;
    }

    default:
      return state;
  }
}

interface SurplusLinkContextType {
  state: SurplusLinkState;
  activeRole: ActiveRole;
  setActiveRole: (role: ActiveRole) => void;
  selectedProviderId: string;
  setSelectedProviderId: (id: string) => void;
  selectedProvider: Provider;
  college: CollegeAnchor;
  providers: Provider[];
  ngo: NGO;
  donations: FoodDonation[];
  collections: Collection[];
  notifications: InAppNotification[];

  // Mutator Actions
  addDonation: (
    donation: Omit<FoodDonation, 'id' | 'createdAt' | 'status' | 'verificationOtp'>
  ) => void;
  updateDonationStatus: (donationId: string, status: DonationStatus) => void;
  acceptTripCollection: (trip: TripPlan, driverName: string) => void;
  updateStopProgress: (
    collectionId: string,
    donationId: string,
    newStatus: StopProgressStatus,
    actualQty?: number,
    failReason?: string
  ) => void;
  recordCollectionReceived: (collectionId: string, quantityReceived: number) => void;
  recordCollectionDistributed: (
    collectionId: string,
    quantityDistributed: number,
    notes?: string
  ) => void;
  loadDemoDonationsBatch: () => void;
  dismissNotification: (notificationId: string) => void;
  updateProviderDefaults: (providerId: string, defaults: Partial<ProviderDefaults>) => void;
  skipTonightDonation: (providerId: string) => void;
  unskipTonightDonation: (providerId: string) => void;
  resetAllData: () => void;
}

const SurplusLinkContext = createContext<SurplusLinkContextType | undefined>(undefined);

export const SurplusLinkProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(surplusLinkReducer, undefined, loadInitialState);

  const [activeRole, setActiveRole] = useState<ActiveRole>('provider');
  const [selectedProviderId, setSelectedProviderId] = useState<string>(SEED_PROVIDERS[0].id);

  // Persist to localStorage with version key
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (e) {
      console.error('Storage error:', e);
    }
  }, [state]);

  const selectedProvider =
    state.providers.find((p) => p.id === selectedProviderId) || state.providers[0];

  const addDonation = (
    donation: Omit<FoodDonation, 'id' | 'createdAt' | 'status' | 'verificationOtp'>
  ) => {
    dispatch({ type: 'ADD_DONATION', payload: donation });
  };

  const updateDonationStatus = (donationId: string, status: DonationStatus) => {
    dispatch({ type: 'UPDATE_DONATION_STATUS', payload: { donationId, status } });
  };

  const acceptTripCollection = (trip: TripPlan, driverName: string) => {
    dispatch({ type: 'CREATE_COLLECTION', payload: { trip, driverName } });
  };

  const updateStopProgress = (
    collectionId: string,
    donationId: string,
    newStatus: StopProgressStatus,
    actualQty?: number,
    failReason?: string
  ) => {
    dispatch({
      type: 'UPDATE_STOP_PROGRESS',
      payload: { collectionId, donationId, newStatus, actualQty, failReason },
    });
  };

  const recordCollectionReceived = (collectionId: string, quantityReceived: number) => {
    dispatch({
      type: 'RECORD_COLLECTION_RECEIVED',
      payload: { collectionId, quantityReceived },
    });
  };

  const recordCollectionDistributed = (
    collectionId: string,
    quantityDistributed: number,
    notes?: string
  ) => {
    dispatch({
      type: 'RECORD_COLLECTION_DISTRIBUTED',
      payload: { collectionId, quantityDistributed, notes },
    });
  };

  const loadDemoDonationsBatch = () => {
    dispatch({ type: 'LOAD_DEMO_DONATIONS' });
  };

  const dismissNotification = (notificationId: string) => {
    dispatch({ type: 'DISMISS_NOTIFICATION', payload: { notificationId } });
  };

  const updateProviderDefaults = (
    providerId: string,
    defaults: Partial<ProviderDefaults>
  ) => {
    dispatch({ type: 'UPDATE_PROVIDER_DEFAULTS', payload: { providerId, defaults } });
  };

  const skipTonightDonation = (providerId: string) => {
    dispatch({ type: 'SKIP_TONIGHT_DONATION', payload: { providerId } });
  };

  const unskipTonightDonation = (providerId: string) => {
    dispatch({ type: 'UNSKIP_TONIGHT_DONATION', payload: { providerId } });
  };

  const resetAllData = () => {
    localStorage.removeItem(STORAGE_KEY);
    dispatch({ type: 'RESET_DEMO_DATA' });
    setSelectedProviderId(SEED_PROVIDERS[0].id);
    setActiveRole('provider');
  };

  return (
    <SurplusLinkContext.Provider
      value={{
        state,
        activeRole,
        setActiveRole,
        selectedProviderId,
        setSelectedProviderId,
        selectedProvider,
        college: COLLEGE_ANCHOR,
        providers: state.providers,
        ngo: state.ngo,
        donations: state.donations,
        collections: state.collections,
        notifications: state.notifications,
        addDonation,
        updateDonationStatus,
        acceptTripCollection,
        updateStopProgress,
        recordCollectionReceived,
        recordCollectionDistributed,
        loadDemoDonationsBatch,
        dismissNotification,
        updateProviderDefaults,
        skipTonightDonation,
        unskipTonightDonation,
        resetAllData,
      }}
    >
      {children}
    </SurplusLinkContext.Provider>
  );
};

export const useSurplusLink = () => {
  const context = useContext(SurplusLinkContext);
  if (!context) {
    throw new Error('useSurplusLink must be used within a SurplusLinkProvider');
  }
  return context;
};
