import React, { useEffect, useState } from 'react';
import { DateTime, Duration } from 'luxon';

interface CountdownTimerProps {
  nextPrayerName: string;
  nextPrayerTime: DateTime;
  onCountdownFinished: () => void;
}

const CountdownTimer: React.FC<CountdownTimerProps> = ({ nextPrayerName, nextPrayerTime, onCountdownFinished }) => {
  const [remaining, setRemaining] = useState<Duration | null>(null);

  useEffect(() => {
    if (!nextPrayerTime || !nextPrayerTime.isValid) {
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
        // Add a small delay to prevent a race condition on recalculation
        onCountdownFinished();
      }
    };

    updateRemainingTime(); // Run once immediately
    const interval = setInterval(updateRemainingTime, 1000);

    return () => clearInterval(interval);
  }, [nextPrayerTime, onCountdownFinished]);

  if (!remaining) {
    return (
      <div className="text-center p-6 rounded-2xl border border-brand-gold/30 mb-4">
        <h2 className="text-xl text-brand-white/80">Time until {nextPrayerName}</h2>
        <div className="text-5xl font-bold text-brand-gold">Calculating...</div>
      </div>
    );
  }

  const totalSeconds = Math.floor(remaining.as('seconds'));
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;


  return (
    <div className="text-center p-6 rounded-2xl border border-brand-gold mb-4">
      <h2 className="text-xl text-brand-white/80">Time until {nextPrayerName}</h2>
      <div className="text-5xl font-bold text-brand-gold">
        {String(hours).padStart(2, '0')}:
        {String(minutes).padStart(2, '0')}:
        {String(seconds).padStart(2, '0')}
      </div>
    </div>
  );
};

export default CountdownTimer;