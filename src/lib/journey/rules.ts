/**
 * Field rules — GENERATED from the app metadata. Do not edit.
 *
 * The mechanical truth about every field: what kind it is, whether the
 * platform's base view marks it required, which lookup keys exist, where an
 * applookup points, what the label is. `useStepForm` validates against these
 * rules and phrases its messages with the real labels; `toWirePayload` uses
 * them to shape the create payload; `SHAPES` tells a page which input FORM
 * fits the data (a date pair wants a calendar, not two fields) — it is a
 * signal, not a gate.
 */
import { appLabel, fieldLabel, lookupLabel } from '@/i18n';
import { LOOKUP_OPTIONS } from '@/types/app';

export type EntityKey = 'kursverwaltung' | 'mitgliederverwaltung' | 'mitglieder_kursanmeldung' | 'kursanmeldung_fuer_interessenten';

/** The text fields of each entity — what a search may run over (generated;
 *  `never` for an entity without text of its own, e.g. a link table). */
export interface StringFields {
  "kursverwaltung": "kursname" | "beschreibung" | "ort";
  "mitgliederverwaltung": "vorname" | "nachname" | "email" | "telefon" | "strasse" | "hausnummer" | "postleitzahl" | "ort" | "bemerkungen";
  "mitglieder_kursanmeldung": "anmerkungen";
  "kursanmeldung_fuer_interessenten": "vorname" | "nachname" | "email" | "telefon";
}
export type StringFieldKey<E extends EntityKey> = E extends keyof StringFields ? StringFields[E] : never;

export type FieldKind =
  | 'text'
  | 'textarea'
  | 'email'
  | 'tel'
  | 'url'
  | 'number'
  | 'bool'
  | 'date'
  | 'datetime'
  | 'lookup'
  | 'multilookup'
  | 'record'
  | 'multirecord'
  | 'file'
  | 'geo';

export interface FieldRule {
  key: string;
  fulltype: string;
  kind: FieldKind;
  /** From the app's base view. A public page may override this per field. */
  required: boolean;
  /** Build-time label — `labelOf()` prefers the runtime i18n bundle. */
  label: string;
  /** Whether a journey may write it (`file` is upload-only, never via a journey). */
  writable: boolean;
  maxLength?: number;
  /** lookup / multilookup: the ONLY valid write values. */
  options?: string[];
  /** record / multirecord: the target app (always) and its entity key (when inside this appgroup). */
  targetAppId?: string;
  targetEntity?: EntityKey;
  format?: 'currency';
  /** HTML autocomplete token derived from the field name (given-name, email, tel, …). */
  autoComplete?: string;
}

export interface EntityInfo {
  key: EntityKey;
  appId: string;
  label: string;
  /** PascalCase plural — `get<pascal>()` on the service. */
  pascal: string;
  /** The single-record suffix — `create<single>()` on the service. */
  single: string;
}

/** Input-form signals per entity: which data shape each field (pair) has.
 *  `range`  — two date fields that form a stay/period → AvailabilityRangePicker
 *  `choice` — a lookup with few options → ChoiceGroup pills instead of a select
 *  `record` — an applookup → EntitySelectStep with search, never a raw id field
 *  `stock`  — a quantity that has a stock/capacity counterpart → show it, warn on overshoot */
export type Shape =
  | { kind: 'range'; from: string; to: string }
  | { kind: 'choice'; field: string; count: number }
  | { kind: 'record'; field: string; targetEntity?: EntityKey }
  | { kind: 'stock'; field: string };

export const ENTITIES: Record<EntityKey, EntityInfo> = {
  "kursverwaltung": {
    "key": "kursverwaltung",
    "appId": "6a8ffd8f3c521d7f844024a3",
    "label": "Kursverwaltung",
    "pascal": "Kursverwaltung",
    "single": "KursverwaltungEntry"
  },
  "mitgliederverwaltung": {
    "key": "mitgliederverwaltung",
    "appId": "6a8ffd927dd69a8d9165d82d",
    "label": "Mitgliederverwaltung",
    "pascal": "Mitgliederverwaltung",
    "single": "MitgliederverwaltungEntry"
  },
  "mitglieder_kursanmeldung": {
    "key": "mitglieder_kursanmeldung",
    "appId": "6a8ffd932ea90c3303c5e8ae",
    "label": "Mitglieder-Kursanmeldung",
    "pascal": "MitgliederKursanmeldung",
    "single": "MitgliederKursanmeldungEntry"
  },
  "kursanmeldung_fuer_interessenten": {
    "key": "kursanmeldung_fuer_interessenten",
    "appId": "6a8ffd93524c819c1820f8e3",
    "label": "Kursanmeldung für Interessenten",
    "pascal": "KursanmeldungFuerInteressenten",
    "single": "KursanmeldungFuerInteressentenEntry"
  }
};

export const FIELD_RULES: Record<EntityKey, Record<string, FieldRule>> = {
  "kursverwaltung": {
    "kursname": {
      "key": "kursname",
      "fulltype": "string/text",
      "kind": "text",
      "required": true,
      "label": "Kursname",
      "writable": true,
      "maxLength": 4000
    },
    "beschreibung": {
      "key": "beschreibung",
      "fulltype": "string/textarea",
      "kind": "textarea",
      "required": false,
      "label": "Beschreibung",
      "writable": true
    },
    "kursdatum": {
      "key": "kursdatum",
      "fulltype": "date/datetimeminute",
      "kind": "datetime",
      "required": true,
      "label": "Kursdatum und Uhrzeit",
      "writable": true
    },
    "ort": {
      "key": "ort",
      "fulltype": "string/text",
      "kind": "text",
      "required": false,
      "label": "Veranstaltungsort",
      "writable": true,
      "maxLength": 4000,
      "autoComplete": "address-level2"
    },
    "max_teilnehmer": {
      "key": "max_teilnehmer",
      "fulltype": "number",
      "kind": "number",
      "required": false,
      "label": "Maximale Teilnehmerzahl",
      "writable": true
    }
  },
  "mitgliederverwaltung": {
    "vorname": {
      "key": "vorname",
      "fulltype": "string/text",
      "kind": "text",
      "required": true,
      "label": "Vorname",
      "writable": true,
      "maxLength": 4000,
      "autoComplete": "given-name"
    },
    "nachname": {
      "key": "nachname",
      "fulltype": "string/text",
      "kind": "text",
      "required": true,
      "label": "Nachname",
      "writable": true,
      "maxLength": 4000,
      "autoComplete": "family-name"
    },
    "geburtsdatum": {
      "key": "geburtsdatum",
      "fulltype": "date/date",
      "kind": "date",
      "required": false,
      "label": "Geburtsdatum",
      "writable": true,
      "autoComplete": "bday"
    },
    "email": {
      "key": "email",
      "fulltype": "string/email",
      "kind": "email",
      "required": false,
      "label": "E-Mail-Adresse",
      "writable": true,
      "autoComplete": "email"
    },
    "telefon": {
      "key": "telefon",
      "fulltype": "string/tel",
      "kind": "tel",
      "required": false,
      "label": "Telefonnummer",
      "writable": true,
      "autoComplete": "tel"
    },
    "strasse": {
      "key": "strasse",
      "fulltype": "string/text",
      "kind": "text",
      "required": false,
      "label": "Straße",
      "writable": true,
      "maxLength": 4000,
      "autoComplete": "address-line1"
    },
    "hausnummer": {
      "key": "hausnummer",
      "fulltype": "string/text",
      "kind": "text",
      "required": false,
      "label": "Hausnummer",
      "writable": true,
      "maxLength": 4000
    },
    "postleitzahl": {
      "key": "postleitzahl",
      "fulltype": "string/text",
      "kind": "text",
      "required": false,
      "label": "Postleitzahl",
      "writable": true,
      "maxLength": 4000,
      "autoComplete": "postal-code"
    },
    "ort": {
      "key": "ort",
      "fulltype": "string/text",
      "kind": "text",
      "required": false,
      "label": "Ort",
      "writable": true,
      "maxLength": 4000,
      "autoComplete": "address-level2"
    },
    "beitragsart": {
      "key": "beitragsart",
      "fulltype": "lookup/select",
      "kind": "lookup",
      "required": true,
      "label": "Beitragsart",
      "writable": true,
      "options": [
        "foerdermitglied",
        "jugendmitglied",
        "ehrenmitglied",
        "familienmitglied",
        "vollmitglied"
      ]
    },
    "mitgliedschaft_von": {
      "key": "mitgliedschaft_von",
      "fulltype": "date/date",
      "kind": "date",
      "required": true,
      "label": "Mitgliedschaft gültig von",
      "writable": true
    },
    "mitgliedschaft_bis": {
      "key": "mitgliedschaft_bis",
      "fulltype": "date/date",
      "kind": "date",
      "required": false,
      "label": "Mitgliedschaft gültig bis",
      "writable": true
    },
    "bemerkungen": {
      "key": "bemerkungen",
      "fulltype": "string/textarea",
      "kind": "textarea",
      "required": false,
      "label": "Bemerkungen",
      "writable": true
    }
  },
  "mitglieder_kursanmeldung": {
    "mitglied": {
      "key": "mitglied",
      "fulltype": "applookup/select",
      "kind": "record",
      "required": true,
      "label": "Mitglied",
      "writable": true,
      "targetAppId": "6a8ffd927dd69a8d9165d82d",
      "targetEntity": "mitgliederverwaltung"
    },
    "kurs": {
      "key": "kurs",
      "fulltype": "applookup/select",
      "kind": "record",
      "required": true,
      "label": "Kurs",
      "writable": true,
      "targetAppId": "6a8ffd8f3c521d7f844024a3",
      "targetEntity": "kursverwaltung"
    },
    "anmerkungen": {
      "key": "anmerkungen",
      "fulltype": "string/textarea",
      "kind": "textarea",
      "required": false,
      "label": "Anmerkungen",
      "writable": true
    }
  },
  "kursanmeldung_fuer_interessenten": {
    "kurs": {
      "key": "kurs",
      "fulltype": "applookup/select",
      "kind": "record",
      "required": true,
      "label": "Kurs",
      "writable": true,
      "targetAppId": "6a8ffd8f3c521d7f844024a3",
      "targetEntity": "kursverwaltung"
    },
    "vorname": {
      "key": "vorname",
      "fulltype": "string/text",
      "kind": "text",
      "required": true,
      "label": "Vorname",
      "writable": true,
      "maxLength": 4000,
      "autoComplete": "given-name"
    },
    "nachname": {
      "key": "nachname",
      "fulltype": "string/text",
      "kind": "text",
      "required": true,
      "label": "Nachname",
      "writable": true,
      "maxLength": 4000,
      "autoComplete": "family-name"
    },
    "email": {
      "key": "email",
      "fulltype": "string/email",
      "kind": "email",
      "required": true,
      "label": "E-Mail-Adresse",
      "writable": true,
      "autoComplete": "email"
    },
    "telefon": {
      "key": "telefon",
      "fulltype": "string/tel",
      "kind": "tel",
      "required": false,
      "label": "Telefonnummer",
      "writable": true,
      "autoComplete": "tel"
    }
  }
};

export const SHAPES: Record<EntityKey, Shape[]> = {
  "kursverwaltung": [],
  "mitgliederverwaltung": [
    {
      "kind": "range",
      "from": "mitgliedschaft_von",
      "to": "mitgliedschaft_bis"
    },
    {
      "kind": "choice",
      "field": "beitragsart",
      "count": 5
    }
  ],
  "mitglieder_kursanmeldung": [
    {
      "kind": "record",
      "field": "mitglied",
      "targetEntity": "mitgliederverwaltung"
    },
    {
      "kind": "record",
      "field": "kurs",
      "targetEntity": "kursverwaltung"
    }
  ],
  "kursanmeldung_fuer_interessenten": [
    {
      "kind": "record",
      "field": "kurs",
      "targetEntity": "kursverwaltung"
    }
  ]
};

export function ruleOf(entity: EntityKey, key: string): FieldRule | undefined {
  return FIELD_RULES[entity]?.[key];
}

/** The field label as the user sees it — runtime bundle first, generated label second. */
export function labelOf(entity: EntityKey, key: string): string {
  const fromBundle = fieldLabel(entity, key);
  if (fromBundle !== key) return fromBundle;
  return ruleOf(entity, key)?.label ?? key;
}

export function entityLabel(entity: EntityKey): string {
  const fromBundle = appLabel(entity);
  if (fromBundle !== entity) return fromBundle;
  return ENTITIES[entity]?.label ?? entity;
}

/** Lookup options with runtime labels — the only legitimate source of `{key,label}` pairs. */
export function optionsOf(entity: EntityKey, key: string): Array<{ key: string; label: string }> {
  const generated = (LOOKUP_OPTIONS as Record<string, Record<string, Array<{ key: string; label: string }>>>)[entity]?.[key];
  if (generated && generated.length) return generated.map(o => ({ key: o.key, label: o.label }));
  const keys = ruleOf(entity, key)?.options ?? [];
  return keys.map(k => ({ key: k, label: lookupLabel(entity, key, k) ?? k }));
}

export function isEmptyValue(v: unknown): boolean {
  if (v === undefined || v === null) return true;
  if (typeof v === 'string') return v.trim() === '';
  if (Array.isArray(v)) return v.length === 0;
  if (typeof v === 'object' && 'from' in (v as object) && 'to' in (v as object)) {
    const r = v as { from: unknown; to: unknown };
    return isEmptyValue(r.from) && isEmptyValue(r.to);
  }
  return false;
}
