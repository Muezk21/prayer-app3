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

  // Use shiftTo to ensure we get proper values
  const duration = remaining.shiftTo('hours', 'minutes', 'seconds');
  const hours = Math.floor(duration.hours || 0);
  const minutes = Math.floor(duration.minutes || 0);
  const seconds = Math.floor(duration.seconds || 0);

  return (
    <div className="text-center p-6 rounded-2xl shadow-lg bg-brand-green-light mb-4">
      <h2 className="text-xl text-white">Time until {nextPrayerName}</h2>
      <div className="text-5xl font-bold text-red-600">
        {String(hours).padStart(2, '0')}:
        {String(minutes).padStart(2, '0')}:
        {String(seconds).padStart(2, '0')}
      </div>
      <div className="text-sm text-white">
        Next prayer at {nextPrayerTime.toFormat('h:mm a')}
      </div>
    </div>
  );
};

export default CountdownTimer;