import type { FormEnhancements } from './types';

export const formEnhancements: FormEnhancements = {
  fieldOrder: ['kursname', 'kursdatum', 'ort', 'max_teilnehmer', 'beschreibung'],
  defaults: {
    'kursdatum': { kind: 'today', withTime: true },
    'max_teilnehmer': { kind: 'literal', value: 1 },
  },
  computed: {},
};

export const computedDeps: Record<string, string[]> = {};
export const computedApplookupRefs: Record<string, {lookupKey: string}[]> = {};
