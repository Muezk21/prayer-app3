import React, { useState } from "react";

const SideMenu: React.FC = () => {
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
            {/* Move your existing controls here */}
            <label className="flex items-center gap-2">
              <input type="checkbox" className="accent-brand-gold" />
              24h Clock
            </label>
            <label className="flex items-center gap-2">
              <input type="checkbox" className="accent-brand-gold" />
              Prayer Reminders
            </label>
          </div>
        </div>
      </div>
    </>
  );
};

export default SideMenu;
