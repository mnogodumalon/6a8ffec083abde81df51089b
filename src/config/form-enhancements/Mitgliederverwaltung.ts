import type { FormEnhancements } from './types';

export const formEnhancements: FormEnhancements = {
  fieldOrder: [{ row: ['vorname', 'nachname'] }, 'geburtsdatum', 'email', 'telefon', { row: ['strasse', 'hausnummer'], cols: '2fr 1fr' }, { row: ['postleitzahl', 'ort'], cols: '1fr 2fr' }, 'beitragsart', { row: ['mitgliedschaft_von', 'mitgliedschaft_bis'] }, 'bemerkungen'],
  defaults: {
    'mitgliedschaft_von': { kind: 'today' },
    'mitgliedschaft_bis': { kind: 'todayOffset', days: 365 },
    'beitragsart': { kind: 'lookup', key: 'vollmitglied', label: 'Vollmitglied' },
  },
  computed: {},
};

export const computedDeps: Record<string, string[]> = {};
export const computedApplookupRefs: Record<string, {lookupKey: string}[]> = {};
