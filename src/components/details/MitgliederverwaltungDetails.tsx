import type { Mitgliederverwaltung, MitgliederKursanmeldung } from '@/types/app';
import { APP_IDS } from '@/types/app';
import { extractRecordId } from '@/services/livingAppsService';
import {
  RecordSection, RecordField, RecordRelation, RecordAttachments,
} from '@/components/widgets/RecordView';
import { t, appLabel, fieldLabel } from '@/i18n';
import { SatelliteSection } from '@/components/SatelliteSection';

export interface MitgliederverwaltungDetailsProps {
  /** Der Record — enriched oder roh; alle Felder werden hier gerendert. */
  record: Mitgliederverwaltung;
  /** 1:N „Mitglieder-Kursanmeldung" (mitglied): VOLLE Liste — der Block filtert auf diesen Record. */
  mitgliederKursanmeldungList: MitgliederKursanmeldung[];
  /** Zeilen-Klick → overlay.push auf das MitgliederKursanmeldung-Detail (nie der Edit-Dialog). */
  onOpenMitgliederKursanmeldung: (record: MitgliederKursanmeldung) => void;
  /** Kontextuelles „+": öffnet den MitgliederKursanmeldung-Dialog mit diesem Record vorgesetzt. */
  onAddMitgliederKursanmeldung: () => void;
}

export function MitgliederverwaltungDetails({
  record,
  mitgliederKursanmeldungList,
  onOpenMitgliederKursanmeldung,
  onAddMitgliederKursanmeldung,
}: MitgliederverwaltungDetailsProps) {
  return (
    <>
      <RecordSection title={t('details')} cols={2}>
        <RecordField label={fieldLabel('mitgliederverwaltung', 'vorname')} value={record.fields.vorname} format="text" />
        <RecordField label={fieldLabel('mitgliederverwaltung', 'nachname')} value={record.fields.nachname} format="text" />
        <RecordField label={fieldLabel('mitgliederverwaltung', 'geburtsdatum')} value={record.fields.geburtsdatum} format="date" />
        <RecordField label={fieldLabel('mitgliederverwaltung', 'email')} value={record.fields.email} format="email" />
        <RecordField label={fieldLabel('mitgliederverwaltung', 'telefon')} value={record.fields.telefon} format="text" />
        <RecordField label={fieldLabel('mitgliederverwaltung', 'strasse')} value={record.fields.strasse} format="text" />
        <RecordField label={fieldLabel('mitgliederverwaltung', 'hausnummer')} value={record.fields.hausnummer} format="text" />
        <RecordField label={fieldLabel('mitgliederverwaltung', 'postleitzahl')} value={record.fields.postleitzahl} format="text" />
        <RecordField label={fieldLabel('mitgliederverwaltung', 'ort')} value={record.fields.ort} format="text" />
        <RecordField label={fieldLabel('mitgliederverwaltung', 'beitragsart')} value={record.fields.beitragsart} format="pill" />
        <RecordField label={fieldLabel('mitgliederverwaltung', 'mitgliedschaft_von')} value={record.fields.mitgliedschaft_von} format="date" />
        <RecordField label={fieldLabel('mitgliederverwaltung', 'mitgliedschaft_bis')} value={record.fields.mitgliedschaft_bis} format="date" />
        <RecordField label={fieldLabel('mitgliederverwaltung', 'bemerkungen')} value={record.fields.bemerkungen} format="longtext" className="md:col-span-2" />
      </RecordSection>

      <SatelliteSection
        title={appLabel('mitglieder_kursanmeldung')}
        items={mitgliederKursanmeldungList.filter(r => extractRecordId(r.fields.mitglied) === record.record_id)}
        map={() => ({ name: appLabel('mitglieder_kursanmeldung'), meta: undefined })}
        onOpen={onOpenMitgliederKursanmeldung}
        onAdd={onAddMitgliederKursanmeldung}
        getKey={r => r.record_id}
      />

      <RecordAttachments appId={APP_IDS.MITGLIEDERVERWALTUNG} recordId={record.record_id} />
    </>
  );
}
