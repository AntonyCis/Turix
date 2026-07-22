import { createContext, useCallback, useContext, useEffect, useState } from 'react';

const TravelPlannerContext = createContext(null);
const SAVED_KEY = 'turix_saved_trips';

function readSavedTrips() {
  try {
    return JSON.parse(localStorage.getItem(SAVED_KEY)) || [];
  } catch {
    return [];
  }
}

export function TravelPlannerProvider({ children }) {
  const [savedTrips, setSavedTrips] = useState(readSavedTrips);
  const [compareTrips, setCompareTrips] = useState([]);

  useEffect(() => {
    localStorage.setItem(SAVED_KEY, JSON.stringify(savedTrips));
  }, [savedTrips]);

  const toggleSaved = useCallback((trip) => {
    setSavedTrips((current) => current.some((item) => item.id === trip.id)
      ? current.filter((item) => item.id !== trip.id)
      : [...current, trip]);
  }, []);

  const toggleCompare = useCallback((trip) => {
    setCompareTrips((current) => {
      if (current.some((item) => item.id === trip.id)) return current.filter((item) => item.id !== trip.id);
      if (current.length === 3) return current;
      return [...current, trip];
    });
  }, []);

  const isSaved = useCallback((tripId) => savedTrips.some((trip) => trip.id === tripId), [savedTrips]);
  const isCompared = useCallback((tripId) => compareTrips.some((trip) => trip.id === tripId), [compareTrips]);

  return (
    <TravelPlannerContext.Provider value={{ savedTrips, compareTrips, toggleSaved, toggleCompare, isSaved, isCompared, clearCompare: () => setCompareTrips([]) }}>
      {children}
    </TravelPlannerContext.Provider>
  );
}

export function useTravelPlanner() {
  const context = useContext(TravelPlannerContext);
  if (!context) throw new Error('useTravelPlanner must be used within TravelPlannerProvider');
  return context;
}
