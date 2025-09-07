import React, { useState } from "react";
import { useEffect } from 'react';
import { useSettings } from '../context/SettingsContext';

const SideMenu: React.FC = () => {
  const {
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
    query,
    setQuery,
    date,
    setDate
  } = useSettings();

  const [open, setOpen] = useState(false);

  const handleSearch = async () => {
  if (!query.trim()) return;

  try {
    const res = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
    const data = await res.json();

    if (!Array.isArray(data) || data.length === 0) {
      alert('No results found. Try a different location.');
      return;
    }

    const first = data[0];
    setLocation({
      lat: parseFloat(first.lat),
      lon: parseFloat(first.lon),
      tz: Intl.DateTimeFormat().resolvedOptions().timeZone,
      label: first.display_name
    });
  } catch (err) {
    alert('Failed to connect to location service.');
    console.error(err);
  }
};


const METHODS = {
  'ISNA (North America)': 'ISNA (North America)',
  'Muslim World League': 'Muslim World League',
  'Umm al-Qura (Makkah)': 'Umm al-Qura (Makkah)',
  'Egyptian General Authority': 'Egyptian General Authority',
  'Dubai': 'Dubai',
  'Kuwait': 'Kuwait',
  'Qatar': 'Qatar',
  'Singapore': 'Singapore',
  'Tehran': 'Tehran',
  'Turkey': 'Turkey'
};

useEffect(() => {
  const delay = setTimeout(() => {
    if (query.trim()) handleSearch();
  }, 500); // 500ms debounce

  return () => clearTimeout(delay);
}, [query]);

useEffect(() => {
  const delay = setTimeout(() => {
    if (query.trim()) handleSearch();
  }, 500); // 500ms debounce

  return () => clearTimeout(delay);
}, [query]);


  return (
    <>
      {/* Click outside overlay */}
      {open && (
        <div 
          className="fixed inset-0 z-30" 
          onClick={() => setOpen(false)}
        />
      )}
      
      {/* Toggle Button */}
      <button
        onClick={() => setOpen(!open)}
        className={`fixed font-bold top-4 right-4 z-50 text-brand-green bg-brand-gold py-2 rounded-lg transition-all duration-300 hover:bg-yellow-400 flex items-center justify-center ${
          open ? "w-56 text-center px-10" : "px-4"
        }`}
      >
        {open ? "Settings" : "☰" }
      </button>

      {/* Side Drawer */}
      <div
        className={`fixed top-0 right-0 h-full w-64 bg-brand-white text-brand-green shadow-xl transform transition-transform duration-300 z-40 ${
          open ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="p-6 pt-16">
          <div className="flex flex-col gap-4">

            {/* Clock Format Toggle */}
            <label className="flex items-center gap-2 hover:scale-105 transition-all duration-300 p-2 rounded cursor-pointer hover:outline hover:outline-2 hover:outline-amber-400 hover:bg-amber-100/30">
              <input
                type="checkbox"
                checked={use24h}
                onChange={(e) => setUse24h(e.target.checked)}
                className="accent-brand-gold hover:scale-110 transition-all duration-300 hover:outline hover:outline-2 hover:outline-amber-400"
              />
              24h Clock
            </label>

            {/* Prayer Reminders */}
            <label className="flex items-center gap-2 hover:scale-105 transition-all duration-300 p-2 rounded cursor-pointer hover:outline hover:outline-2 hover:outline-amber-400 hover:bg-amber-100/30">
              <input
                type="checkbox"
                checked={notifOn}
                onChange={(e) => setNotifOn(e.target.checked)}
                className="accent-brand-gold hover:scale-110 transition-all duration-300 hover:outline hover:outline-2 hover:outline-amber-400"
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
              <label className="block font-semibold mb-1">Where are you located?</label>
              <div className="flex flex-col gap-2 mb-2">
                <input
                  type="text"
                  placeholder="Search city"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                  className="border rounded p-2 w-full"
                />
                <button onClick={handleSearch} 
                className="w-full py-2 bg-brand-gold text-brand-green font-semibold rounded hover:bg-yellow-400 transition-colors"
                >
                  Find
                </button>
              </div>
            </div>

            {/* Date Picker */}
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
