import React from 'react';
import { useSettings } from '../context/SettingsContext';

const Header: React.FC = () => {
  const {
    use24h,
    notifOn,
    method,
    madhab,
    location
  } = useSettings();

  return (
    <header className="w-full px-4 py-3 bg-brand-gold text-brand-green flex justify-between items-center shadow-md">
      <div className="font-bold text-lg">Prayer App</div>
      <div className="text-sm flex gap-4 items-center">
        <span>{use24h ? '24h' : '12h'} Clock</span>
        <span>Reminders: {notifOn ? 'On' : 'Off'}</span>
        <span>Method: {method}</span>
        <span>Madhab: {madhab}</span>
        <span>{location?.label || 'Locating...'}</span>
      </div>
    </header>
  );
};

export default Header;
