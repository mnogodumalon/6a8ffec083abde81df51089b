import type { EnrichedKursanmeldungFuerInteressenten, EnrichedMitgliederKursanmeldung } from '@/types/enriched';
import type { KursanmeldungFuerInteressenten, Kursverwaltung, MitgliederKursanmeldung, Mitgliederverwaltung } from '@/types/app';
import { extractRecordId } from '@/services/livingAppsService';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function resolveDisplay(url: unknown, map: Map<string, any>, ...fields: string[]): string {
  if (!url) return '';
  const id = extractRecordId(url);
  if (!id) return '';
  const r = map.get(id);
  if (!r) return '';
  return fields.map(f => String(r.fields[f] ?? '')).join(' ').trim();
}

interface MitgliederKursanmeldungMaps {
  mitgliederverwaltungMap: Map<string, Mitgliederverwaltung>;
  kursverwaltungMap: Map<string, Kursverwaltung>;
}

export function enrichMitgliederKursanmeldung(
  mitgliederKursanmeldung: MitgliederKursanmeldung[],
  maps: MitgliederKursanmeldungMaps
): EnrichedMitgliederKursanmeldung[] {
  return mitgliederKursanmeldung.map(r => ({
    ...r,
    mitgliedName: resolveDisplay(r.fields.mitglied, maps.mitgliederverwaltungMap, 'vorname', 'nachname'),
    kursName: resolveDisplay(r.fields.kurs, maps.kursverwaltungMap, 'kursname'),
  }));
}

interface KursanmeldungFuerInteressentenMaps {
  kursverwaltungMap: Map<string, Kursverwaltung>;
}

export function enrichKursanmeldungFuerInteressenten(
  kursanmeldungFuerInteressenten: KursanmeldungFuerInteressenten[],
  maps: KursanmeldungFuerInteressentenMaps
): EnrichedKursanmeldungFuerInteressenten[] {
  return kursanmeldungFuerInteressenten.map(r => ({
    ...r,
    kursName: resolveDisplay(r.fields.kurs, maps.kursverwaltungMap, 'kursname'),
  }));
}
