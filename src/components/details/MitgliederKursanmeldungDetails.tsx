import type { MitgliederKursanmeldung, Mitgliederverwaltung, Kursverwaltung } from '@/types/app';
import { APP_IDS } from '@/types/app';
import { extractRecordId } from '@/services/livingAppsService';
import {
  RecordSection, RecordField, RecordRelation, RecordAttachments,
} from '@/components/widgets/RecordView';
import { t, appLabel, fieldLabel } from '@/i18n';

export interface MitgliederKursanmeldungDetailsProps {
  /** Der Record — enriched oder roh; alle Felder werden hier gerendert. */
  record: MitgliederKursanmeldung;
  /** N:1-Ziel „Mitgliederverwaltung": volle Liste (Hook-Array) — der Block löst Name + Schlüsselfelder selbst auf. */
  mitgliederverwaltungList: Mitgliederverwaltung[];
  /** Klick auf die Mitgliederverwaltung-Relation → overlay.push auf dessen Detail. */
  onOpenMitgliederverwaltung?: (record: Mitgliederverwaltung) => void;
  /** N:1-Ziel „Kursverwaltung": volle Liste (Hook-Array) — der Block löst Name + Schlüsselfelder selbst auf. */
  kursverwaltungList: Kursverwaltung[];
  /** Klick auf die Kursverwaltung-Relation → overlay.push auf dessen Detail. */
  onOpenKursverwaltung?: (record: Kursverwaltung) => void;
}

export function MitgliederKursanmeldungDetails({
  record,
  mitgliederverwaltungList,
  onOpenMitgliederverwaltung,
  kursverwaltungList,
  onOpenKursverwaltung,
}: MitgliederKursanmeldungDetailsProps) {
  const mitgliedTarget = mitgliederverwaltungList.find(r => r.record_id === extractRecordId(record.fields.mitglied));
  const kursTarget = kursverwaltungList.find(r => r.record_id === extractRecordId(record.fields.kurs));
  return (
    <>
      <RecordSection title={t('details')} cols={2}>
        <RecordField label={fieldLabel('mitglieder_kursanmeldung', 'anmerkungen')} value={record.fields.anmerkungen} format="longtext" className="md:col-span-2" />
      </RecordSection>

      {/* N:1 — verknüpfte Records: IMMER klickbar, nie eine Text-Sackgasse. */}
      <RecordSection title={t('relations')} cols={2}>
        <RecordRelation
          label={fieldLabel('mitglieder_kursanmeldung', 'mitglied')}
          name={mitgliedTarget?.fields.vorname ?? '—'}
          meta={[mitgliedTarget?.fields.email, mitgliedTarget?.fields.telefon].filter(Boolean).join(' · ') || undefined}
          onClick={mitgliedTarget && onOpenMitgliederverwaltung ? () => onOpenMitgliederverwaltung!(mitgliedTarget!) : undefined}
        />
        <RecordRelation
          label={fieldLabel('mitglieder_kursanmeldung', 'kurs')}
          name={kursTarget?.fields.kursname ?? '—'}
          meta={[kursTarget?.fields.ort].filter(Boolean).join(' · ') || undefined}
          onClick={kursTarget && onOpenKursverwaltung ? () => onOpenKursverwaltung!(kursTarget!) : undefined}
        />
      </RecordSection>

      <RecordAttachments appId={APP_IDS.MITGLIEDER_KURSANMELDUNG} recordId={record.record_id} />
    </>
  );
}
