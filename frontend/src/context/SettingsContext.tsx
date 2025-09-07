import React, { createContext, useContext, useState, useEffect } from "react";
import { DateTime } from "luxon";

type Madhab = "Hanafi" | "Shafi";

interface Location {
  lat: number;
  lon: number;
  tz: string;
  label?: string;
}

interface SettingsContextType {
  use24h: boolean;
  setUse24h: (val: boolean) => void;

  notifOn: boolean;
  setNotifOn: (val: boolean) => void;

  method: string;
  setMethod: (val: string) => void;

  madhab: Madhab;
  setMadhab: (val: Madhab) => void;

  location: Location | null;
  setLocation: (val: Location | null) => void;

  date: string;
  setDate: (val: string) => void;

  query: string;
  setQuery: (val: string) => void;

  recentLocations: Location[];
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export const SettingsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [use24h, setUse24h] = useState(() => JSON.parse(localStorage.getItem("use24h") || "false"));
  const [notifOn, setNotifOn] = useState(() => JSON.parse(localStorage.getItem("notifOn") || "false"));
  const [method, setMethod] = useState(localStorage.getItem("method") || "ISNA (North America)");
  const [madhab, setMadhab] = useState<Madhab>(localStorage.getItem("madhab") as Madhab || "Hanafi");
  const [location, setLocation] = useState<Location | null>(null);
  const [date, setDate] = useState(DateTime.now().toISODate());
  const [query, setQuery] = useState("");
  const [recentLocations, setRecentLocations] = useState<Location[]>([]);

  useEffect(() => {
  if (location) {
    setRecentLocations(prev => {
      const exists = prev.find(l => l.label === location.label);
      if (exists) return prev;
      const updated = [location, ...prev].slice(0, 5);
      localStorage.setItem('recentLocations', JSON.stringify(updated));
      return updated;
    });
  }
}, [location]);


  useEffect(() => {
    localStorage.setItem("use24h", JSON.stringify(use24h));
    localStorage.setItem("notifOn", JSON.stringify(notifOn));
    localStorage.setItem("method", method);
    localStorage.setItem("madhab", madhab);
  }, [use24h, notifOn, method, madhab]);

  return (
    <SettingsContext.Provider
      value={{
        use24h,
        setUse24h,
        notifOn,
        setNotifOn,
        method,
        setMethod,
        madhab,
        setMadhab,
        location,
        setLocation,
        date,
        setDate,
        query,
        setQuery,
        recentLocations,
      }}
    >
      {children}
    </SettingsContext.Provider>
  );
};

export const useSettings = () => {
  const ctx = useContext(SettingsContext);
  if (!ctx) throw new Error("useSettings must be used inside SettingsProvider");
  return ctx;
};
