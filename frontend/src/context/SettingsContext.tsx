import React, { createContext, useContext, useState } from "react";

type Madhab = "Hanafi" | "Shafi";
type Method = "Umm al-Qura" | "ISNA" | "MWL";

interface SettingsContextType {
  clockFormat: "12h" | "24h";
  toggleClockFormat: () => void;

  madhab: Madhab;
  setMadhab: (m: Madhab) => void;

  method: Method;
  setMethod: (m: Method) => void;

  location: string;
  setLocation: (loc: string) => void;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export const SettingsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [clockFormat, setClockFormat] = useState<"12h" | "24h">("12h");
  const [madhab, setMadhab] = useState<Madhab>("Hanafi");
  const [method, setMethod] = useState<Method>("ISNA");
  const [location, setLocation] = useState<string>("Auto");

  const toggleClockFormat = () =>
    setClockFormat((prev) => (prev === "12h" ? "24h" : "12h"));

  return (
    <SettingsContext.Provider
      value={{
        clockFormat,
        toggleClockFormat,
        madhab,
        setMadhab,
        method,
        setMethod,
        location,
        setLocation,
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
