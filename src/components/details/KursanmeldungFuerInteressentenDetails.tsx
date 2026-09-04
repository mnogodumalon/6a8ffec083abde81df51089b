import type { KursanmeldungFuerInteressenten, Kursverwaltung } from '@/types/app';
import { APP_IDS } from '@/types/app';
import { extractRecordId } from '@/services/livingAppsService';
import {
  RecordSection, RecordField, RecordRelation, RecordAttachments,
} from '@/components/widgets/RecordView';
import { t, appLabel, fieldLabel } from '@/i18n';

export interface KursanmeldungFuerInteressentenDetailsProps {
  /** Der Record — enriched oder roh; alle Felder werden hier gerendert. */
  record: KursanmeldungFuerInteressenten;
  /** N:1-Ziel „Kursverwaltung": volle Liste (Hook-Array) — der Block löst Name + Schlüsselfelder selbst auf. */
  kursverwaltungList: Kursverwaltung[];
  /** Klick auf die Kursverwaltung-Relation → overlay.push auf dessen Detail. */
  onOpenKursverwaltung?: (record: Kursverwaltung) => void;
}

export function KursanmeldungFuerInteressentenDetails({
  record,
  kursverwaltungList,
  onOpenKursverwaltung,
}: KursanmeldungFuerInteressentenDetailsProps) {
  const kursTarget = kursverwaltungList.find(r => r.record_id === extractRecordId(record.fields.kurs));
  return (
    <>
      <RecordSection title={t('details')} cols={2}>
        <RecordField label={fieldLabel('kursanmeldung_fuer_interessenten', 'vorname')} value={record.fields.vorname} format="text" />
        <RecordField label={fieldLabel('kursanmeldung_fuer_interessenten', 'nachname')} value={record.fields.nachname} format="text" />
        <RecordField label={fieldLabel('kursanmeldung_fuer_interessenten', 'email')} value={record.fields.email} format="email" />
        <RecordField label={fieldLabel('kursanmeldung_fuer_interessenten', 'telefon')} value={record.fields.telefon} format="text" />
      </RecordSection>

      {/* N:1 — verknüpfte Records: IMMER klickbar, nie eine Text-Sackgasse. */}
      <RecordSection title={t('relations')} cols={1}>
        <RecordRelation
          label={fieldLabel('kursanmeldung_fuer_interessenten', 'kurs')}
          name={kursTarget?.fields.kursname ?? '—'}
          meta={[kursTarget?.fields.ort].filter(Boolean).join(' · ') || undefined}
          onClick={kursTarget && onOpenKursverwaltung ? () => onOpenKursverwaltung!(kursTarget!) : undefined}
        />
      </RecordSection>

      <RecordAttachments appId={APP_IDS.KURSANMELDUNG_FUER_INTERESSENTEN} recordId={record.record_id} />
    </>
  );
}
