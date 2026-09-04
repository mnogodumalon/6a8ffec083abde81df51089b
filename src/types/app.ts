import { lookupLabel } from '@/i18n';

// AUTOMATICALLY GENERATED TYPES - DO NOT EDIT

export type LookupValue = { key: string; label: string };
/** A raw record URL (applookup reference). NEVER render this directly
 *  in JSX — it is a URL, not a display value. Show the enriched `*Name`
 *  field or resolve it via the entity map instead. Assignable to/from
 *  string everywhere; the `& {}` keeps the alias NAME visible in tsc
 *  error messages (a plain primitive alias gets normalized away). */
export type RecordUrl = string & {};
export type GeoLocation = { lat: number; long: number; info?: string };

export type AttachmentType = 'file' | 'note' | 'url' | 'json';
export interface Attachment {
  id: string;
  type: AttachmentType;
  label: string | null;
  value: string | null;
  active: boolean;
  createdat?: string | null;
  updatedat?: string | null;
}

export interface AttachmentInput {
  type: AttachmentType;
  label?: string;
  value: string;
  active?: boolean;
}

export interface Kursverwaltung {
  record_id: string;
  /** The API field. */
  created_at: string;
  updated_at: string | null;
  /** Alias of created_at, filled by the read helpers. The API sends
   *  snake_case only — reading `createdat` off a raw record yields
   *  undefined, which type-checks and then crashes at runtime. */
  createdat: string;
  updatedat: string | null;
  fields: {
    kursname?: string;
    beschreibung?: string;
    kursdatum?: string; // Format: YYYY-MM-DD oder ISO String
    ort?: string;
    max_teilnehmer?: number;
  };
}

export interface Mitgliederverwaltung {
  record_id: string;
  /** The API field. */
  created_at: string;
  updated_at: string | null;
  /** Alias of created_at, filled by the read helpers. The API sends
   *  snake_case only — reading `createdat` off a raw record yields
   *  undefined, which type-checks and then crashes at runtime. */
  createdat: string;
  updatedat: string | null;
  fields: {
    vorname?: string;
    nachname?: string;
    geburtsdatum?: string; // Format: YYYY-MM-DD oder ISO String
    email?: string;
    telefon?: string;
    strasse?: string;
    hausnummer?: string;
    postleitzahl?: string;
    ort?: string;
    beitragsart?: LookupValue;
    mitgliedschaft_von?: string; // Format: YYYY-MM-DD oder ISO String
    mitgliedschaft_bis?: string; // Format: YYYY-MM-DD oder ISO String
    bemerkungen?: string;
  };
}

export interface MitgliederKursanmeldung {
  record_id: string;
  /** The API field. */
  created_at: string;
  updated_at: string | null;
  /** Alias of created_at, filled by the read helpers. The API sends
   *  snake_case only — reading `createdat` off a raw record yields
   *  undefined, which type-checks and then crashes at runtime. */
  createdat: string;
  updatedat: string | null;
  fields: {
    mitglied?: RecordUrl; // applookup -> URL zu 'Mitgliederverwaltung' Record
    kurs?: RecordUrl; // applookup -> URL zu 'Kursverwaltung' Record
    anmerkungen?: string;
  };
}

export interface KursanmeldungFuerInteressenten {
  record_id: string;
  /** The API field. */
  created_at: string;
  updated_at: string | null;
  /** Alias of created_at, filled by the read helpers. The API sends
   *  snake_case only — reading `createdat` off a raw record yields
   *  undefined, which type-checks and then crashes at runtime. */
  createdat: string;
  updatedat: string | null;
  fields: {
    kurs?: RecordUrl; // applookup -> URL zu 'Kursverwaltung' Record
    vorname?: string;
    nachname?: string;
    email?: string;
    telefon?: string;
  };
}

export const APP_IDS = {
  KURSVERWALTUNG: '6a8ffd8f3c521d7f844024a3',
  MITGLIEDERVERWALTUNG: '6a8ffd927dd69a8d9165d82d',
  MITGLIEDER_KURSANMELDUNG: '6a8ffd932ea90c3303c5e8ae',
  KURSANMELDUNG_FUER_INTERESSENTEN: '6a8ffd93524c819c1820f8e3',
} as const;


export const LOOKUP_OPTIONS: Record<string, Record<string, {key: string, label: string}[]>> = {
  'mitgliederverwaltung': {
    beitragsart: [{ key: "foerdermitglied", get label() { return lookupLabel('mitgliederverwaltung', 'beitragsart', "foerdermitglied") ?? "Fördermitglied"; } }, { key: "jugendmitglied", get label() { return lookupLabel('mitgliederverwaltung', 'beitragsart', "jugendmitglied") ?? "Jugendmitglied"; } }, { key: "ehrenmitglied", get label() { return lookupLabel('mitgliederverwaltung', 'beitragsart', "ehrenmitglied") ?? "Ehrenmitglied"; } }, { key: "familienmitglied", get label() { return lookupLabel('mitgliederverwaltung', 'beitragsart', "familienmitglied") ?? "Familienmitglied"; } }, { key: "vollmitglied", get label() { return lookupLabel('mitgliederverwaltung', 'beitragsart', "vollmitglied") ?? "Vollmitglied"; } }],
  },
};

// Optimistic LookupValue writes: never re-type a label — resolve the schema
// option instead (its label is a locale-aware getter; falls back to the key).
// WRONG: status: { key: 'offen', label: 'Offen' }   (frozen in one language)
// RIGHT: status: lookupOption('<appKey>', 'status', 'offen')
export function lookupOption(app: string, field: string, key: string): LookupValue {
  return LOOKUP_OPTIONS[app]?.[field]?.find(o => o.key === key) ?? { key, label: key };
}

export const FIELD_TYPES: Record<string, Record<string, string>> = {
  'kursverwaltung': {
    'kursname': 'string/text',
    'beschreibung': 'string/textarea',
    'kursdatum': 'date/datetimeminute',
    'ort': 'string/text',
    'max_teilnehmer': 'number',
  },
  'mitgliederverwaltung': {
    'vorname': 'string/text',
    'nachname': 'string/text',
    'geburtsdatum': 'date/date',
    'email': 'string/email',
    'telefon': 'string/tel',
    'strasse': 'string/text',
    'hausnummer': 'string/text',
    'postleitzahl': 'string/text',
    'ort': 'string/text',
    'beitragsart': 'lookup/select',
    'mitgliedschaft_von': 'date/date',
    'mitgliedschaft_bis': 'date/date',
    'bemerkungen': 'string/textarea',
  },
  'mitglieder_kursanmeldung': {
    'mitglied': 'applookup/select',
    'kurs': 'applookup/select',
    'anmerkungen': 'string/textarea',
  },
  'kursanmeldung_fuer_interessenten': {
    'kurs': 'applookup/select',
    'vorname': 'string/text',
    'nachname': 'string/text',
    'email': 'string/email',
    'telefon': 'string/tel',
  },
};

export const HUB_TOPOLOGY: Record<string, { field: string; entity: string }[]> = {
};

type StripLookup<T> = {
  [K in keyof T]: T[K] extends LookupValue | undefined ? string | LookupValue | undefined
    : T[K] extends LookupValue[] | undefined ? string[] | LookupValue[] | undefined
    : T[K];
};

// Helper Types for creating new records (lookup fields as plain strings for API)
export type CreateKursverwaltung = StripLookup<Kursverwaltung['fields']>;
export type CreateMitgliederverwaltung = StripLookup<Mitgliederverwaltung['fields']>;
export type CreateMitgliederKursanmeldung = StripLookup<MitgliederKursanmeldung['fields']>;
export type CreateKursanmeldungFuerInteressenten = StripLookup<KursanmeldungFuerInteressenten['fields']>;