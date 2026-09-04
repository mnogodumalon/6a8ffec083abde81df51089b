import type { Kursverwaltung, MitgliederKursanmeldung, KursanmeldungFuerInteressenten } from '@/types/app';
import { APP_IDS } from '@/types/app';
import { extractRecordId } from '@/services/livingAppsService';
import {
  RecordSection, RecordField, RecordRelation, RecordAttachments,
} from '@/components/widgets/RecordView';
import { t, appLabel, fieldLabel } from '@/i18n';
import { SatelliteSection } from '@/components/SatelliteSection';

export interface KursverwaltungDetailsProps {
  /** Der Record — enriched oder roh; alle Felder werden hier gerendert. */
  record: Kursverwaltung;
  /** 1:N „Mitglieder-Kursanmeldung" (kurs): VOLLE Liste — der Block filtert auf diesen Record. */
  mitgliederKursanmeldungList: MitgliederKursanmeldung[];
  /** Zeilen-Klick → overlay.push auf das MitgliederKursanmeldung-Detail (nie der Edit-Dialog). */
  onOpenMitgliederKursanmeldung: (record: MitgliederKursanmeldung) => void;
  /** Kontextuelles „+": öffnet den MitgliederKursanmeldung-Dialog mit diesem Record vorgesetzt. */
  onAddMitgliederKursanmeldung: () => void;
  /** 1:N „Kursanmeldung für Interessenten" (kurs): VOLLE Liste — der Block filtert auf diesen Record. */
  kursanmeldungFuerInteressentenList: KursanmeldungFuerInteressenten[];
  /** Zeilen-Klick → overlay.push auf das KursanmeldungFuerInteressenten-Detail (nie der Edit-Dialog). */
  onOpenKursanmeldungFuerInteressenten: (record: KursanmeldungFuerInteressenten) => void;
  /** Kontextuelles „+": öffnet den KursanmeldungFuerInteressenten-Dialog mit diesem Record vorgesetzt. */
  onAddKursanmeldungFuerInteressenten: () => void;
}

export function KursverwaltungDetails({
  record,
  mitgliederKursanmeldungList,
  onOpenMitgliederKursanmeldung,
  onAddMitgliederKursanmeldung,
  kursanmeldungFuerInteressentenList,
  onOpenKursanmeldungFuerInteressenten,
  onAddKursanmeldungFuerInteressenten,
}: KursverwaltungDetailsProps) {
  return (
    <>
      <RecordSection title={t('details')} cols={2}>
        <RecordField label={fieldLabel('kursverwaltung', 'kursname')} value={record.fields.kursname} format="text" />
        <RecordField label={fieldLabel('kursverwaltung', 'beschreibung')} value={record.fields.beschreibung} format="longtext" className="md:col-span-2" />
        <RecordField label={fieldLabel('kursverwaltung', 'kursdatum')} value={record.fields.kursdatum} format="datetime" />
        <RecordField label={fieldLabel('kursverwaltung', 'ort')} value={record.fields.ort} format="text" />
        <RecordField label={fieldLabel('kursverwaltung', 'max_teilnehmer')} value={record.fields.max_teilnehmer} format="text" />
      </RecordSection>

      <SatelliteSection
        title={appLabel('mitglieder_kursanmeldung')}
        items={mitgliederKursanmeldungList.filter(r => extractRecordId(r.fields.kurs) === record.record_id)}
        map={() => ({ name: appLabel('mitglieder_kursanmeldung'), meta: undefined })}
        onOpen={onOpenMitgliederKursanmeldung}
        onAdd={onAddMitgliederKursanmeldung}
        getKey={r => r.record_id}
      />

      <SatelliteSection
        title={appLabel('kursanmeldung_fuer_interessenten')}
        items={kursanmeldungFuerInteressentenList.filter(r => extractRecordId(r.fields.kurs) === record.record_id)}
        map={r => ({ name: r.fields.vorname ?? appLabel('kursanmeldung_fuer_interessenten'), meta: undefined })}
        onOpen={onOpenKursanmeldungFuerInteressenten}
        onAdd={onAddKursanmeldungFuerInteressenten}
        getKey={r => r.record_id}
      />

      <RecordAttachments appId={APP_IDS.KURSVERWALTUNG} recordId={record.record_id} />
    </>
  );
}
