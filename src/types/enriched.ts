import type { KursanmeldungFuerInteressenten, MitgliederKursanmeldung } from './app';

export type EnrichedMitgliederKursanmeldung = MitgliederKursanmeldung & {
  mitgliedName: string;
  kursName: string;
};

export type EnrichedKursanmeldungFuerInteressenten = KursanmeldungFuerInteressenten & {
  kursName: string;
};
