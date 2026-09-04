/**
 * EntityCrud — pre-generated CRUD + overlay plumbing for the dashboard.
 * Compose it; NEVER re-roll dialog state, submit handlers, an overlay stack
 * or a RecordOverlayHost in the page — this file owns all of it.
 *
 * API at a glance:
 *   const data = useDashboardData();
 *   const crud = useEntityCrud(data, {
 *     // optional — the ONE semantic slot on the overlay: the record's next
 *     // workflow step. Return undefined for types without one.
 *     footer: (top) => top.type === 'kursverwaltung'
 *       ? { label: …, onClick: () => … }
 *       : undefined,
 *   });
 *
 *   `top.type` is the SAME camelCase key as `crud.<entity>` — one spelling
 *   per entity, everywhere in this API.
 *   …
 *   crud.kursverwaltung.openCreate({ …defaults })   // create dialog, prefilled — defaults are
 *                                       // shape-tolerant: bare lookup keys / record ids are fine
 *   crud.kursverwaltung.openEdit(record)            // edit dialog (recordId + defaults wired)
 *   crud.kursverwaltung.openDetail(record)          // record overlay — pass the RAW record,
 *                                       // enrichment is resolved inside
 *   crud.overlay                         // RecordOverlayStack<OverlayItem> for drills:
 *                                       // push / pop / replace / close
 *   crud.enriched.kursverwaltung              // the display-ready array for EVERY entity —
 *                                       // Enriched* where relations exist, the raw array
 *                                       // otherwise. Reuse these; never call enrich*()
 *                                       // in the page, and never guess which entity has
 *                                       // one: they all do.
 *   {crud.surfaces}                      // render ONCE at the end of the page JSX:
 *                                       // all entity dialogs + the overlay host
 *
 * Built in (do NOT re-implement): optimistic update + Rückgängig counter-write
 * on edit, fetchAll-on-error, edit-from-overlay, and per-entity overlay bodies
 * (RecordHeader + <{Entity}Details> with every relation reachable and the
 * contextual "+" prefilled). Drag writes (onEventDrop/onCardMove) stay YOURS:
 * optimistic setter first, PATCH in background, undoToast with counter-write.
 *
 * Overlay content per entity (the host renders these — you never compose
 * Details blocks yourself):
 *   kursverwaltung: kursname, beschreibung, kursdatum, ort, max_teilnehmer  ·  ← mitglieder_kursanmeldung (list + contextual +) · ← kursanmeldung_fuer_interessenten (list + contextual +)
 *   mitgliederverwaltung: vorname, nachname, geburtsdatum, email, telefon, strasse, hausnummer, postleitzahl, …  ·  ← mitglieder_kursanmeldung (list + contextual +)
 *   mitglieder_kursanmeldung: mitglied, kurs, anmerkungen  ·  → mitgliederverwaltung · → kursverwaltung
 *   kursanmeldung_fuer_interessenten: kurs, vorname, nachname, email, telefon  ·  → kursverwaltung
 */
import { useState, useMemo, type ReactNode } from 'react';
import type { Kursverwaltung, Mitgliederverwaltung, MitgliederKursanmeldung, KursanmeldungFuerInteressenten } from '@/types/app';
import { APP_IDS } from '@/types/app';
import { LivingAppsService, createRecordUrl } from '@/services/livingAppsService';
import { enrichMitgliederKursanmeldung, enrichKursanmeldungFuerInteressenten } from '@/lib/enrich';
import type { EnrichedMitgliederKursanmeldung, EnrichedKursanmeldungFuerInteressenten } from '@/types/enriched';
import { useDashboardData } from '@/hooks/useDashboardData';
import {
  useRecordOverlayStack, RecordOverlayHost, RecordHeader,
  type RecordOverlayStack,
} from '@/components/widgets/RecordView';
import { KursverwaltungDialog, type KursverwaltungDialogDefaults } from '@/components/dialogs/KursverwaltungDialog';
import { KursverwaltungDetails } from '@/components/details/KursverwaltungDetails';
import { MitgliederverwaltungDialog, type MitgliederverwaltungDialogDefaults } from '@/components/dialogs/MitgliederverwaltungDialog';
import { MitgliederverwaltungDetails } from '@/components/details/MitgliederverwaltungDetails';
import { MitgliederKursanmeldungDialog, type MitgliederKursanmeldungDialogDefaults } from '@/components/dialogs/MitgliederKursanmeldungDialog';
import { MitgliederKursanmeldungDetails } from '@/components/details/MitgliederKursanmeldungDetails';
import { KursanmeldungFuerInteressentenDialog, type KursanmeldungFuerInteressentenDialogDefaults } from '@/components/dialogs/KursanmeldungFuerInteressentenDialog';
import { KursanmeldungFuerInteressentenDetails } from '@/components/details/KursanmeldungFuerInteressentenDetails';
import { AI_PHOTO_SCAN, AI_PHOTO_LOCATION } from '@/config/ai-features';
import { t, appLabel } from '@/i18n';
import { undoToast } from '@/lib/polish';
import { formatDate } from '@/lib/formatters';

// The overlay union — one branch per entity, `record` typed the way the data
// flows: Enriched* where enrichment exists, the raw record type otherwise.
// The host resolves enrichment itself; pages pass raw records everywhere.
export type OverlayItem =
  | { type: 'kursverwaltung'; record: Kursverwaltung }
  | { type: 'mitgliederverwaltung'; record: Mitgliederverwaltung }
  | { type: 'mitgliederKursanmeldung'; record: EnrichedMitgliederKursanmeldung }
  | { type: 'kursanmeldungFuerInteressenten'; record: EnrichedKursanmeldungFuerInteressenten };

/** The useDashboardData() return — pass it in, never re-fetch inside. */
export type EntityCrudData = ReturnType<typeof useDashboardData>;

export interface EntityCrudOptions {
  /** Per-type overlay footer — the record's next workflow step. */
  footer?: (top: OverlayItem) => ReactNode | { label: ReactNode; onClick: () => void } | undefined;
  placement?: 'side' | 'center';
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

export interface EntityCrudApi<TRecord, TDefaults> {
  /** Open the create dialog, optionally prefilled (shape-tolerant defaults). */
  openCreate: (defaults?: TDefaults) => void;
  /** Open the edit dialog for a record (recordId + defaults are wired). */
  openEdit: (record: TRecord) => void;
  /** Open the record overlay (raw record is fine — enrichment resolved inside). */
  openDetail: (record: TRecord) => void;
}

export interface EntityCrud {
  /** The overlay stack for drills: push / pop / replace / close. */
  overlay: RecordOverlayStack<OverlayItem>;
  /** Render ONCE at the end of the page JSX — all dialogs + the overlay host. */
  surfaces: ReactNode;
  kursverwaltung: EntityCrudApi<Kursverwaltung, KursverwaltungDialogDefaults>;
  mitgliederverwaltung: EntityCrudApi<Mitgliederverwaltung, MitgliederverwaltungDialogDefaults>;
  mitgliederKursanmeldung: EntityCrudApi<MitgliederKursanmeldung, MitgliederKursanmeldungDialogDefaults>;
  kursanmeldungFuerInteressenten: EntityCrudApi<KursanmeldungFuerInteressenten, KursanmeldungFuerInteressentenDialogDefaults>;
  /** The display-ready array per entity: Enriched* where an enrich function
   *  exists, the raw array otherwise. One key per entity so no page has to
   *  know which is which. Reuse these; never re-enrich in the page. */
  enriched: { kursverwaltung: Kursverwaltung[]; mitgliederverwaltung: Mitgliederverwaltung[]; mitgliederKursanmeldung: EnrichedMitgliederKursanmeldung[]; kursanmeldungFuerInteressenten: EnrichedKursanmeldungFuerInteressenten[] };
}

export function useEntityCrud(data: EntityCrudData, options?: EntityCrudOptions): EntityCrud {
  const overlay = useRecordOverlayStack<OverlayItem>();
  const [kursverwaltungDialog, setKursverwaltungDialog] = useState<{ defaults?: KursverwaltungDialogDefaults; editing?: Kursverwaltung } | null>(null);
  const [mitgliederverwaltungDialog, setMitgliederverwaltungDialog] = useState<{ defaults?: MitgliederverwaltungDialogDefaults; editing?: Mitgliederverwaltung } | null>(null);
  const [mitgliederKursanmeldungDialog, setMitgliederKursanmeldungDialog] = useState<{ defaults?: MitgliederKursanmeldungDialogDefaults; editing?: MitgliederKursanmeldung } | null>(null);
  const [kursanmeldungFuerInteressentenDialog, setKursanmeldungFuerInteressentenDialog] = useState<{ defaults?: KursanmeldungFuerInteressentenDialogDefaults; editing?: KursanmeldungFuerInteressenten } | null>(null);
  const enrichedMitgliederKursanmeldung = useMemo(() => enrichMitgliederKursanmeldung(data.mitgliederKursanmeldung, { mitgliederverwaltungMap: data.mitgliederverwaltungMap, kursverwaltungMap: data.kursverwaltungMap }), [data.mitgliederKursanmeldung, data.mitgliederverwaltungMap, data.kursverwaltungMap]);
  const enrichedKursanmeldungFuerInteressenten = useMemo(() => enrichKursanmeldungFuerInteressenten(data.kursanmeldungFuerInteressenten, { kursverwaltungMap: data.kursverwaltungMap }), [data.kursanmeldungFuerInteressenten, data.kursverwaltungMap]);

  function detailKursverwaltung(record: Kursverwaltung, push = false) {
    const item: OverlayItem = { type: 'kursverwaltung', record };
    if (push) overlay.push(item); else overlay.replace(item);
  }

  async function submitKursverwaltung(fields: Kursverwaltung['fields']) {
    const editing = kursverwaltungDialog?.editing;
    if (editing) {
      const prev = editing;
      data.setKursverwaltung(list => list.map(r => (r.record_id === editing.record_id ? { ...r, fields } : r)));
      try {
        await LivingAppsService.updateKursverwaltungEntry(editing.record_id, fields);
      } catch (err) {
        data.fetchAll();
        throw err;
      }
      undoToast(`${appLabel('kursverwaltung')} — ${t('crud_updated')}`, async () => {
        data.setKursverwaltung(list => list.map(r => (r.record_id === prev.record_id ? prev : r)));
        try { await LivingAppsService.updateKursverwaltungEntry(prev.record_id, prev.fields); } catch { data.fetchAll(); }
      });
    } else {
      await LivingAppsService.createKursverwaltungEntry(fields);
      undoToast(`${appLabel('kursverwaltung')} — ${t('crud_created')}`);
      data.fetchAll();
    }
  }

  function detailMitgliederverwaltung(record: Mitgliederverwaltung, push = false) {
    const item: OverlayItem = { type: 'mitgliederverwaltung', record };
    if (push) overlay.push(item); else overlay.replace(item);
  }

  async function submitMitgliederverwaltung(fields: Mitgliederverwaltung['fields']) {
    const editing = mitgliederverwaltungDialog?.editing;
    if (editing) {
      const prev = editing;
      data.setMitgliederverwaltung(list => list.map(r => (r.record_id === editing.record_id ? { ...r, fields } : r)));
      try {
        await LivingAppsService.updateMitgliederverwaltungEntry(editing.record_id, fields);
      } catch (err) {
        data.fetchAll();
        throw err;
      }
      undoToast(`${appLabel('mitgliederverwaltung')} — ${t('crud_updated')}`, async () => {
        data.setMitgliederverwaltung(list => list.map(r => (r.record_id === prev.record_id ? prev : r)));
        try { await LivingAppsService.updateMitgliederverwaltungEntry(prev.record_id, prev.fields); } catch { data.fetchAll(); }
      });
    } else {
      await LivingAppsService.createMitgliederverwaltungEntry(fields);
      undoToast(`${appLabel('mitgliederverwaltung')} — ${t('crud_created')}`);
      data.fetchAll();
    }
  }

  function detailMitgliederKursanmeldung(record: MitgliederKursanmeldung, push = false) {
    const rec = enrichedMitgliederKursanmeldung.find(r => r.record_id === record.record_id);
    if (!rec) return;
    const item: OverlayItem = { type: 'mitgliederKursanmeldung', record: rec };
    if (push) overlay.push(item); else overlay.replace(item);
  }

  async function submitMitgliederKursanmeldung(fields: MitgliederKursanmeldung['fields']) {
    const editing = mitgliederKursanmeldungDialog?.editing;
    if (editing) {
      const prev = editing;
      data.setMitgliederKursanmeldung(list => list.map(r => (r.record_id === editing.record_id ? { ...r, fields } : r)));
      try {
        await LivingAppsService.updateMitgliederKursanmeldungEntry(editing.record_id, fields);
      } catch (err) {
        data.fetchAll();
        throw err;
      }
      undoToast(`${appLabel('mitglieder_kursanmeldung')} — ${t('crud_updated')}`, async () => {
        data.setMitgliederKursanmeldung(list => list.map(r => (r.record_id === prev.record_id ? prev : r)));
        try { await LivingAppsService.updateMitgliederKursanmeldungEntry(prev.record_id, prev.fields); } catch { data.fetchAll(); }
      });
    } else {
      await LivingAppsService.createMitgliederKursanmeldungEntry(fields);
      undoToast(`${appLabel('mitglieder_kursanmeldung')} — ${t('crud_created')}`);
      data.fetchAll();
    }
  }

  function detailKursanmeldungFuerInteressenten(record: KursanmeldungFuerInteressenten, push = false) {
    const rec = enrichedKursanmeldungFuerInteressenten.find(r => r.record_id === record.record_id);
    if (!rec) return;
    const item: OverlayItem = { type: 'kursanmeldungFuerInteressenten', record: rec };
    if (push) overlay.push(item); else overlay.replace(item);
  }

  async function submitKursanmeldungFuerInteressenten(fields: KursanmeldungFuerInteressenten['fields']) {
    const editing = kursanmeldungFuerInteressentenDialog?.editing;
    if (editing) {
      const prev = editing;
      data.setKursanmeldungFuerInteressenten(list => list.map(r => (r.record_id === editing.record_id ? { ...r, fields } : r)));
      try {
        await LivingAppsService.updateKursanmeldungFuerInteressentenEntry(editing.record_id, fields);
      } catch (err) {
        data.fetchAll();
        throw err;
      }
      undoToast(`${appLabel('kursanmeldung_fuer_interessenten')} — ${t('crud_updated')}`, async () => {
        data.setKursanmeldungFuerInteressenten(list => list.map(r => (r.record_id === prev.record_id ? prev : r)));
        try { await LivingAppsService.updateKursanmeldungFuerInteressentenEntry(prev.record_id, prev.fields); } catch { data.fetchAll(); }
      });
    } else {
      await LivingAppsService.createKursanmeldungFuerInteressentenEntry(fields);
      undoToast(`${appLabel('kursanmeldung_fuer_interessenten')} — ${t('crud_created')}`);
      data.fetchAll();
    }
  }

  const surfaces = (
    <>
      <KursverwaltungDialog
        open={kursverwaltungDialog !== null}
        onClose={() => setKursverwaltungDialog(null)}
        onSubmit={submitKursverwaltung}
        defaultValues={kursverwaltungDialog?.defaults}
        recordId={kursverwaltungDialog?.editing?.record_id}
        enablePhotoScan={AI_PHOTO_SCAN['Kursverwaltung']}
        enablePhotoLocation={AI_PHOTO_LOCATION['Kursverwaltung']}
      />
      <MitgliederverwaltungDialog
        open={mitgliederverwaltungDialog !== null}
        onClose={() => setMitgliederverwaltungDialog(null)}
        onSubmit={submitMitgliederverwaltung}
        defaultValues={mitgliederverwaltungDialog?.defaults}
        recordId={mitgliederverwaltungDialog?.editing?.record_id}
        enablePhotoScan={AI_PHOTO_SCAN['Mitgliederverwaltung']}
        enablePhotoLocation={AI_PHOTO_LOCATION['Mitgliederverwaltung']}
      />
      <MitgliederKursanmeldungDialog
        open={mitgliederKursanmeldungDialog !== null}
        onClose={() => setMitgliederKursanmeldungDialog(null)}
        onSubmit={submitMitgliederKursanmeldung}
        defaultValues={mitgliederKursanmeldungDialog?.defaults}
        recordId={mitgliederKursanmeldungDialog?.editing?.record_id}
        mitgliederverwaltungList={data.mitgliederverwaltung}
        kursverwaltungList={data.kursverwaltung}
        enablePhotoScan={AI_PHOTO_SCAN['MitgliederKursanmeldung']}
        enablePhotoLocation={AI_PHOTO_LOCATION['MitgliederKursanmeldung']}
      />
      <KursanmeldungFuerInteressentenDialog
        open={kursanmeldungFuerInteressentenDialog !== null}
        onClose={() => setKursanmeldungFuerInteressentenDialog(null)}
        onSubmit={submitKursanmeldungFuerInteressenten}
        defaultValues={kursanmeldungFuerInteressentenDialog?.defaults}
        recordId={kursanmeldungFuerInteressentenDialog?.editing?.record_id}
        kursverwaltungList={data.kursverwaltung}
        enablePhotoScan={AI_PHOTO_SCAN['KursanmeldungFuerInteressenten']}
        enablePhotoLocation={AI_PHOTO_LOCATION['KursanmeldungFuerInteressenten']}
      />
      <RecordOverlayHost
        overlay={overlay}
        placement={options?.placement}
        size={options?.size}
        footer={options?.footer}
        render={(top) => {
          if (top.type === 'kursverwaltung') {
            return (
              <>
                <RecordHeader title={top.record.fields.kursname ?? appLabel('kursverwaltung')} subtitle={top.record.fields.kursdatum ? formatDate(top.record.fields.kursdatum) : undefined} />
                <KursverwaltungDetails
                  record={top.record}
                  mitgliederKursanmeldungList={data.mitgliederKursanmeldung}
                  onOpenMitgliederKursanmeldung={(r) => detailMitgliederKursanmeldung(r, true)}
                  onAddMitgliederKursanmeldung={() => setMitgliederKursanmeldungDialog({ defaults: { kurs: createRecordUrl(APP_IDS.KURSVERWALTUNG, top.record.record_id) } })}
                  kursanmeldungFuerInteressentenList={data.kursanmeldungFuerInteressenten}
                  onOpenKursanmeldungFuerInteressenten={(r) => detailKursanmeldungFuerInteressenten(r, true)}
                  onAddKursanmeldungFuerInteressenten={() => setKursanmeldungFuerInteressentenDialog({ defaults: { kurs: createRecordUrl(APP_IDS.KURSVERWALTUNG, top.record.record_id) } })}
                />
              </>
            );
          }
          if (top.type === 'mitgliederverwaltung') {
            return (
              <>
                <RecordHeader title={top.record.fields.vorname ?? appLabel('mitgliederverwaltung')} subtitle={top.record.fields.geburtsdatum ? formatDate(top.record.fields.geburtsdatum) : undefined} />
                <MitgliederverwaltungDetails
                  record={top.record}
                  mitgliederKursanmeldungList={data.mitgliederKursanmeldung}
                  onOpenMitgliederKursanmeldung={(r) => detailMitgliederKursanmeldung(r, true)}
                  onAddMitgliederKursanmeldung={() => setMitgliederKursanmeldungDialog({ defaults: { mitglied: createRecordUrl(APP_IDS.MITGLIEDERVERWALTUNG, top.record.record_id) } })}
                />
              </>
            );
          }
          if (top.type === 'mitgliederKursanmeldung') {
            return (
              <>
                <RecordHeader title={appLabel('mitglieder_kursanmeldung')} subtitle={undefined} />
                <MitgliederKursanmeldungDetails
                  record={top.record}
                  mitgliederverwaltungList={data.mitgliederverwaltung}
                  onOpenMitgliederverwaltung={(r) => detailMitgliederverwaltung(r, true)}
                  kursverwaltungList={data.kursverwaltung}
                  onOpenKursverwaltung={(r) => detailKursverwaltung(r, true)}
                />
              </>
            );
          }
          if (top.type === 'kursanmeldungFuerInteressenten') {
            return (
              <>
                <RecordHeader title={top.record.fields.vorname ?? appLabel('kursanmeldung_fuer_interessenten')} subtitle={undefined} />
                <KursanmeldungFuerInteressentenDetails
                  record={top.record}
                  kursverwaltungList={data.kursverwaltung}
                  onOpenKursverwaltung={(r) => detailKursverwaltung(r, true)}
                />
              </>
            );
          }
          return null;
        }}
        onEdit={(top) => {
          overlay.close();
          if (top.type === 'kursverwaltung') setKursverwaltungDialog({ editing: top.record, defaults: top.record.fields });
          if (top.type === 'mitgliederverwaltung') setMitgliederverwaltungDialog({ editing: top.record, defaults: top.record.fields });
          if (top.type === 'mitgliederKursanmeldung') setMitgliederKursanmeldungDialog({ editing: top.record, defaults: top.record.fields });
          if (top.type === 'kursanmeldungFuerInteressenten') setKursanmeldungFuerInteressentenDialog({ editing: top.record, defaults: top.record.fields });
        }}
      />
    </>
  );

  return {
    overlay,
    surfaces,
    kursverwaltung: {
      openCreate: (defaults?: KursverwaltungDialogDefaults) => setKursverwaltungDialog({ defaults }),
      openEdit: (record: Kursverwaltung) => setKursverwaltungDialog({ editing: record, defaults: record.fields }),
      openDetail: (record: Kursverwaltung) => detailKursverwaltung(record, false),
    },
    mitgliederverwaltung: {
      openCreate: (defaults?: MitgliederverwaltungDialogDefaults) => setMitgliederverwaltungDialog({ defaults }),
      openEdit: (record: Mitgliederverwaltung) => setMitgliederverwaltungDialog({ editing: record, defaults: record.fields }),
      openDetail: (record: Mitgliederverwaltung) => detailMitgliederverwaltung(record, false),
    },
    mitgliederKursanmeldung: {
      openCreate: (defaults?: MitgliederKursanmeldungDialogDefaults) => setMitgliederKursanmeldungDialog({ defaults }),
      openEdit: (record: MitgliederKursanmeldung) => setMitgliederKursanmeldungDialog({ editing: record, defaults: record.fields }),
      openDetail: (record: MitgliederKursanmeldung) => detailMitgliederKursanmeldung(record, false),
    },
    kursanmeldungFuerInteressenten: {
      openCreate: (defaults?: KursanmeldungFuerInteressentenDialogDefaults) => setKursanmeldungFuerInteressentenDialog({ defaults }),
      openEdit: (record: KursanmeldungFuerInteressenten) => setKursanmeldungFuerInteressentenDialog({ editing: record, defaults: record.fields }),
      openDetail: (record: KursanmeldungFuerInteressenten) => detailKursanmeldungFuerInteressenten(record, false),
    },
    enriched: { kursverwaltung: data.kursverwaltung, mitgliederverwaltung: data.mitgliederverwaltung, mitgliederKursanmeldung: enrichedMitgliederKursanmeldung, kursanmeldungFuerInteressenten: enrichedKursanmeldungFuerInteressenten },
  };
}
