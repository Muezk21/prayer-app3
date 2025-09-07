import { useMemo } from 'react';
import { DateTime } from 'luxon';
import { Coordinates, PrayerTimes } from 'adhan';
import { useSettings } from '../context/SettingsContext';
import { makeParams } from '../utils/adhan';

export const usePrayerTimes = () => {
  const { location, date, method, madhab } = useSettings();

  const coords = useMemo(() => {
    if (!location) return null;
    return new Coordinates(location.lat, location.lon);
  }, [location]);

  const times = useMemo(() => {
    if (!coords || !location) return null;
    const d = DateTime.fromISO(date).setZone(location.tz || 'UTC');
    const jsDate = new Date(d.year, d.month - 1, d.day);
    try {
      const params = makeParams(method, madhab);
      return new PrayerTimes(coords, jsDate, params);
    } catch {
      return null;
    }
  }, [coords, date, method, madhab, location?.tz]);

  return times;
};
