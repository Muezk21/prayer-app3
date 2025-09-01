import React, { useState } from "react";

type SideMenuProps = {
  use24h: boolean;
  setUse24h: (val: boolean) => void;
  notifOn: boolean;
  setNotifOn: (val: boolean) => void;
  method: string;
  setMethod: (val: string) => void;
  madhab: "Hanafi" | "Shafi";
  setMadhab: (val: "Hanafi" | "Shafi") => void;
  loc: any;
  setLoc: (val: any) => void;
  query: string;                    
  setQuery: (val: string) => void;  
  handleSearch: () => void;         
  date: string;                     
  setDate: (val: string) => void;
};

const METHODS = {
  'Muslim World League': 'Muslim World League',
  'ISNA (North America)': 'ISNA (North America)',
  'Umm al-Qura (Makkah)': 'Umm al-Qura (Makkah)',
  'Egyptian General Authority': 'Egyptian General Authority',
  'Dubai': 'Dubai',
  'Kuwait': 'Kuwait',
  'Qatar': 'Qatar',
  'Singapore': 'Singapore',
  'Tehran': 'Tehran',
  'Turkey': 'Turkey'
};


const SideMenu: React.FC<SideMenuProps> = ({
  use24h,
  setUse24h,
  notifOn,
  setNotifOn,
  method,
  setMethod,
  madhab,
  setMadhab,
  loc,
  setLoc,
  query,
  setQuery,
  handleSearch,
  date,
  setDate,
}) => {
  const [open, setOpen] = useState(false);

  return (
    <>
      {/* Toggle Button */}
      <button
        onClick={() => setOpen(!open)}
        className="fixed top-4 right-4 z-50 bg-brand-gold text-brand-green px-4 py-2 rounded-lg shadow-lg"
      >
        ☰ Settings
      </button>

      {/* Side Drawer */}
      <div
        className={`fixed top-0 right-0 h-full w-64 bg-brand-white text-brand-green shadow-xl transform transition-transform duration-300 z-40 ${
          open ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="p-6">
          <h2 className="text-xl font-bold mb-4">Settings</h2>
          <div className="flex flex-col gap-4">

            {/* Clock Format Toggle */}
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={use24h}
                onChange={(e) => setUse24h(e.target.checked)}
                className="accent-brand-gold"
              />
              24h Clock
            </label>

            {/* Prayer Reminders */}
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={notifOn}
                onChange={(e) => setNotifOn(e.target.checked)}
                className="accent-brand-gold"
              />
              Prayer Reminders
            </label>

            {/* Calculation Method */}
            <div>
              <label className="block font-semibold mb-1">Calculation Method</label>
              <select
                value={method}
                onChange={(e) => setMethod(e.target.value)}
                className="border rounded p-1 w-full"
              >
                {Object.keys(METHODS).map(k => (
                  <option key={k} value={k}>{k}</option>
                ))}
              </select>
            </div>

            {/* Madhab */}
            <div>
              <label className="block font-semibold mb-1">Asr Madhab</label>
              <select
                value={madhab}
                onChange={(e) => setMadhab(e.target.value as "Hanafi" | "Shafi")}
                className="border rounded p-1 w-full"
              >
                <option value="Hanafi">Hanafi</option>
                <option value="Shafi">Shafi</option>
              </select>
            </div>

            {/* Location Search */}
            <div>
              <label className="block font-semibold mb-1">Location Search</label>
              <input
                type="text"
                placeholder="Enter city"
                value={loc?.label || ""}
                onChange={(e) =>
                  setLoc({ ...loc, label: e.target.value })
                }
                className="border rounded p-1 w-full"
              />
            </div>

            <div>
              <label className="block font-semibold mb-1">Location Search</label>
              <div className="flex gap-2 mb-2">
                <input
                  type="text"
                  placeholder="Search city"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  className="border rounded p-1 flex-1"
                />
                <button onClick={handleSearch} className="px-3 py-1 bg-brand-gold text-brand-green rounded">
                  Find
                </button>
              </div>
            </div>

            <div>
              <label className="block font-semibold mb-1">Date</label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="border rounded p-1 w-full"
              />
            </div>
                   
          </div>
        </div>
      </div>
    </>
  );
};

export default SideMenu;
