import { useEffect, useMemo, useState } from 'react';
import { PublicShell } from '@/components/PublicShell';
import {
  loadPublicPagesConfig,
  listPublicRecords,
  prepareChallenge,
  PageUnavailableError,
  type PublicPagesConfig,
  type PublicPageConfig,
  type PublicRecordResult,
} from '@/lib/publicClient';
import { useStepForm, useJourneySubmit } from '@/lib/journey';
import { createPublicPort } from '@/lib/journey/publicPort';
import { IntentWizardShell, WizardStep } from '@/components/blocks/IntentWizardShell';
import { EntitySelectStep, type SelectItem } from '@/components/blocks/EntitySelectStep';
import { SummaryStep } from '@/components/blocks/SummaryStep';
import { SuccessStep } from '@/components/blocks/SuccessStep';
import { StepNav } from '@/components/blocks/StepNav';
import { Field } from '@/components/blocks/Field';
import { Input } from '@/components/ui/input';
import { tx, dateFnsLocale } from '@/i18n';
import { format } from 'date-fns';

const KURS_APP_ID = '6a8ffd8f3c521d7f844024a3';

interface KursRecord {
  id: string;
  kursname: string;
  kursdatum: string | null;
  ort: string | null;
  max_teilnehmer: number | null;
}

function parseKurs(id: string, r: PublicRecordResult): KursRecord {
  return {
    id: r.id ?? id,
    kursname: (r.fields.kursname as string) ?? '',
    kursdatum: (r.fields.kursdatum as string) ?? null,
    ort: (r.fields.ort as string) ?? null,
    max_teilnehmer: (r.fields.max_teilnehmer as number) ?? null,
  };
}

function formatKursdatum(dt: string | null): string {
  if (!dt) return '';
  try {
    const d = new Date(dt);
    return format(d, "EEEE, d. MMMM yyyy 'um' HH:mm 'Uhr'", { locale: dateFnsLocale() });
  } catch {
    return dt;
  }
}

function kursToSelectItem(k: KursRecord): SelectItem {
  const stats: SelectItem['stats'] = [];
  if (k.max_teilnehmer != null) {
    stats.push({ label: tx('Max. Teilnehmer'), value: k.max_teilnehmer });
  }
  if (k.ort) {
    stats.push({ label: tx('Ort'), value: k.ort });
  }
  return {
    id: k.id,
    title: k.kursname,
    subtitle: k.kursdatum ? formatKursdatum(k.kursdatum) : undefined,
    stats,
  };
}

export default function Kursanmeldung() {
  const [cfg, setCfg] = useState<PublicPagesConfig | null>(null);
  const [page, setPage] = useState<PublicPageConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [kurse, setKurse] = useState<KursRecord[]>([]);
  const [kurseLoading, setKurseLoading] = useState(false);
  const [step, setStep] = useState(1);

  useEffect(() => {
    loadPublicPagesConfig('kursanmeldung').then(c => {
      setCfg(c);
      setPage(c?.pages['kursanmeldung'] ?? null);
      setLoading(false);
    });
  }, []);

  useEffect(() => {
    if (!cfg || !page) return;
    setKurseLoading(true);
    listPublicRecords(cfg, page, { appId: KURS_APP_ID, limit: 500 })
      .then(result => {
        const items = Object.entries(result).map(([id, r]) => parseKurs(id, r));
        // Nur zukünftige Kurse anzeigen, sortiert nach Datum
        const now = Date.now();
        const upcoming = items
          .filter(k => k.kursdatum ? new Date(k.kursdatum).getTime() >= now : true)
          .sort((a, b) => {
            if (!a.kursdatum) return 1;
            if (!b.kursdatum) return -1;
            return new Date(a.kursdatum).getTime() - new Date(b.kursdatum).getTime();
          });
        setKurse(upcoming);
      })
      .catch(() => {
        setKurse([]);
      })
      .finally(() => setKurseLoading(false));
  }, [cfg, page]);

  const port = useMemo(() => cfg && page ? createPublicPort(cfg, page) : null, [cfg, page]);

  const anmeldung = useStepForm('kursanmeldung_fuer_interessenten', {
    fields: ['kurs', 'vorname', 'nachname', 'email', 'telefon'],
    required: {
      kurs: true,
      vorname: true,
      nachname: true,
      email: true,
      telefon: false,
    },
    steps: {
      kurs: 1,
      vorname: 2,
      nachname: 2,
      email: 2,
      telefon: 2,
    },
    autoComplete: true,
  });

  const submit = useJourneySubmit(
    port ?? { door: 'public', list: async () => [], count: async () => null, get: async () => null, create: async () => { throw new Error(tx('not ready')); }, ref: () => '' },
    [{ key: 'anmeldung', entity: 'kursanmeldung_fuer_interessenten', form: anmeldung, primary: true }],
    { draftKey: 'kursanmeldung' },
  );

  const selectedKursId = anmeldung.get('kurs') as string | null;
  const selectedKurs = kurse.find(k => k.id === selectedKursId);

  const handleKursSelect = (id: string) => {
    const k = kurse.find(kk => kk.id === id);
    anmeldung.set('kurs', id, k?.kursname ?? id);
  };

  const handleFirstFocus = () => {
    if (!cfg || !page) return;
    const ep = page.endpoints?.find(e => e.op === 'create');
    if (ep) {
      prepareChallenge(cfg, page, 'POST', `/apps/${page.app_id}/records`);
    }
  };

  const restart = () => {
    anmeldung.reset();
    submit.reset();
    setStep(1);
  };

  if (loading || (!cfg && !loading)) {
    return <PublicShell loading={loading} unavailable={!loading && !cfg} />;
  }

  if (!page) {
    return <PublicShell unavailable />;
  }

  const selectItems: SelectItem[] = kurse.map(kursToSelectItem);

  return (
    <PublicShell
      title={tx('Kursanmeldung')}
      description={tx('Jetzt einen Kurs auswählen und anmelden — ganz ohne Login.')}
    >
      <div onFocus={step === 2 ? handleFirstFocus : undefined}>
        <IntentWizardShell
          currentStep={step}
          onStepChange={setStep}
          back={false}
          forms={[anmeldung]}
          draftKey="kursanmeldung"
        >
          <WizardStep
            label={tx('Kurs wählen')}
            description={tx('Wähle den Kurs aus, für den du dich anmelden möchtest.')}
          >
            <Field form={anmeldung} name="kurs">
              <EntitySelectStep
                items={selectItems}
                loading={kurseLoading}
                onSelect={handleKursSelect}
                selectedId={selectedKursId}
                searchPlaceholder={tx('Kurs suchen …')}
                emptyText={tx('Keine Kurse verfügbar')}
                avatar="none"
                columns={1}
                id={anmeldung.fieldId('kurs')}
                invalid={anmeldung.record('kurs').invalid}
              />
            </Field>
            {selectedKurs && (
              <div className="rounded-2xl border border-primary/30 bg-primary/5 px-4 py-3 text-sm space-y-1">
                <p className="font-medium text-foreground">{selectedKurs.kursname}</p>
                {selectedKurs.kursdatum && (
                  <p className="text-muted-foreground">{formatKursdatum(selectedKurs.kursdatum)}</p>
                )}
                {selectedKurs.ort && (
                  <p className="text-muted-foreground">{selectedKurs.ort}</p>
                )}
                {selectedKurs.max_teilnehmer != null && (
                  <p className="text-muted-foreground">
                    {tx('Max.')} {selectedKurs.max_teilnehmer} {tx('Teilnehmer')}
                  </p>
                )}
              </div>
            )}
            <StepNav
              hideBack
              onNext={() => {
                if (!selectedKursId) {
                  anmeldung.validate(['kurs']);
                  return false;
                }
                return true;
              }}
              nextStepLabel={tx('Persönliche Daten')}
            />
          </WizardStep>

          <WizardStep
            label={tx('Persönliche Daten')}
            description={tx('Trage deine Kontaktdaten ein, damit wir dich erreichen können.')}
          >
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Field form={anmeldung} name="vorname">
                  <Input {...anmeldung.field('vorname')} placeholder={tx('z. B. Maria')} />
                </Field>
                <Field form={anmeldung} name="nachname">
                  <Input {...anmeldung.field('nachname')} placeholder={tx('z. B. Mustermann')} />
                </Field>
              </div>
              <Field form={anmeldung} name="email">
                <Input {...anmeldung.field('email')} placeholder={tx('mail@beispiel.de')} />
              </Field>
              <Field form={anmeldung} name="telefon" hint={tx('Optional — falls wir Rückfragen haben.')}>
                <Input {...anmeldung.field('telefon')} placeholder={tx('z. B. +49 123 456789')} />
              </Field>
            </div>
            <StepNav
              onNext={() => anmeldung.validate(['vorname', 'nachname', 'email'])}
              nextStepLabel={tx('Überprüfen')}
            />
          </WizardStep>

          <WizardStep label={tx('Überprüfen')}>
            {!submit.result && (
              <SummaryStep
                forms={[anmeldung]}
                submit={submit}
                whatHappensNext={tx('Wir melden uns nach Eingang deiner Anmeldung per E-Mail bei dir.')}
              />
            )}
          </WizardStep>

          {submit.result && (
            <SuccessStep
              result={submit.result}
              forms={[anmeldung]}
              whatHappensNext={tx('Du erhältst in Kürze eine Bestätigung per E-Mail. Wir freuen uns auf dich!')}
              next={[{ label: tx('Weitere Anmeldung'), onClick: restart }]}
            />
          )}
        </IntentWizardShell>
      </div>
    </PublicShell>
  );
}
