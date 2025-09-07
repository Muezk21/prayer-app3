import { CalculationMethod, Madhab, CalculationParameters } from 'adhan';

const factoryMap: Record<string, () => CalculationParameters> = {
  'Muslim World League': CalculationMethod.MuslimWorldLeague,
  'ISNA (North America)': CalculationMethod.NorthAmerica,
  'Umm al-Qura (Makkah)': CalculationMethod.UmmAlQura,
  'Egyptian General Authority': CalculationMethod.Egyptian,
  'Dubai': CalculationMethod.Dubai,
  'Kuwait': CalculationMethod.Kuwait,
  'Qatar': CalculationMethod.Qatar,
  'Singapore': CalculationMethod.Singapore,
  'Tehran': CalculationMethod.Tehran,
  'Turkey': CalculationMethod.Turkey,
};

export function makeParams(methodKey: string, madhabKey: 'Shafi' | 'Hanafi') {
  const params = (factoryMap[methodKey] || CalculationMethod.MuslimWorldLeague)();
  params.madhab = madhabKey === 'Hanafi' ? Madhab.Hanafi : Madhab.Shafi;
  // optionally set high-lat rules here
  return params;
}