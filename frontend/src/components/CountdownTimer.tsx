import React, { useEffect, useState } from 'react';
import { DateTime, Duration } from 'luxon';

interface CountdownTimerProps {
  nextPrayerName: string;
  nextPrayerTime: DateTime;
}

const CountdownTimer: React.FC<CountdownTimerProps> = ({ nextPrayerName, nextPrayerTime }) => {
  const [remaining, setRemaining] = useState<Duration | null>(null);

  useEffect(() => {
    if (!nextPrayerTime) {
      setRemaining(null);
      return;
    }

    const updateRemainingTime = () => {
      const now = DateTime.now().setZone(nextPrayerTime.zone);
      const diff = nextPrayerTime.diff(now);

      if (diff.as('seconds') > 0) {
        setRemaining(diff);
      } else {
        setRemaining(null);
      }
    };

    updateRemainingTime(); // Run once immediately
    const interval = setInterval(updateRemainingTime, 1000);

    return () => clearInterval(interval);
  }, [nextPrayerTime]);

  if (!remaining) {
    return (
      <div className="text-center p-6 rounded-2xl shadow-lg bg-brand-green-light mb-4">
        <h2 className="text-xl text-brand-white/80">Time until {nextPrayerName}</h2>
        <div className="text-5xl font-bold text-brand-gold">Calculating...</div>
      </div>
    );
  }

  const { hours, minutes, seconds } = remaining.toObject();

  return (
    <div className="text-center p-6 rounded-2xl shadow-lg bg-brand-green-light mb-4">
      <h2 className="text-xl text-brand-white/80">Time until {nextPrayerName}</h2>
      <div className="text-5xl font-bold text-brand-gold">
        {String(Math.floor(hours ?? 0)).padStart(2, '0')}:
        {String(Math.floor(minutes ?? 0)).padStart(2, '0')}:
        {String(Math.floor(seconds ?? 0)).padStart(2, '0')}
      </div>
    </div>
  );
};

export default CountdownTimer;