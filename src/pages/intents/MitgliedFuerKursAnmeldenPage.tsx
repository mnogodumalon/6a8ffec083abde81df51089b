/**
 * Mitglied für Kurs anmelden — 3-Schritt-Wizard.
 * Steps: 1) Kurs wählen (mit Auslastungscheck) → 2) Mitglied wählen (bereits angemeldete ausschließen) → 3) Zusammenfassung & Speichern.
 * Reads: kursverwaltung, mitgliederverwaltung, mitglieder_kursanmeldung.
 * Writes: mitglieder_kursanmeldung (createMitgliederKursanmeldungEntry).
 * Composes: IntentWizardShell, WizardStep, EntitySelectStep, StepNav, SummaryStep, SuccessStep, BudgetTracker.
 */
import { useState, useEffect } from 'react';
import { IntentWizardShell, WizardStep } from '@/components/blocks/IntentWizardShell';
import { EntitySelectStep } from '@/components/blocks/EntitySelectStep';
import { StepNav } from '@/components/blocks/StepNav';
import { SummaryStep } from '@/components/blocks/SummaryStep';
import { SuccessStep } from '@/components/blocks/SuccessStep';
import { BudgetTracker } from '@/components/blocks/BudgetTracker';
import { useStepForm, useJourneySubmit, useRecordSearch, fieldText, fieldNumber, fieldDate, fieldRef } from '@/lib/journey';
import { servicePort } from '@/services/journeyPort';
import { APP_IDS } from '@/types/app';
import { createRecordUrl } from '@/services/livingAppsService';
import { LivingAppsService } from '@/services/livingAppsService';
import { tx } from '@/i18n';
import { formatDate, formatDateTime } from '@/lib/formatters';

export default function MitgliedFuerKursAnmeldenPage() {
  const [step, setStep] = useState(1);
  const [currentEnrollment, setCurrentEnrollment] = useState<number | null>(null);
  const [enrollmentLoading, setEnrollmentLoading] = useState(false);

  // Step 1: Kurs-Suche — alle Kurse sind gültige Ziele (kein Filter)
  const kurse = useRecordSearch(servicePort, 'kursverwaltung', {
    searchFields: ['kursname', 'ort'],
    toItem: k => {
      const datum = fieldDate(k, 'kursdatum');
      const maxTn = fieldNumber(k, 'max_teilnehmer');
      return {
        id: k.id,
        title: fieldText(k, 'kursname'),
        subtitle: fieldText(k, 'ort'),
        stats: [
          { label: tx('Datum'), value: datum ? formatDateTime(datum) : '—' },
          ...(maxTn != null ? [{ label: tx('Max. Plätze'), value: String(maxTn) }] : []),
        ],
      };
    },
  });

  // Formular für die Anmeldung (Step 1: kurs, Step 2: mitglied)
  const anmeldung = useStepForm('mitglieder_kursanmeldung', {
    steps: { kurs: 1, mitglied: 2 },
  });

  const selectedKursId = anmeldung.get('kurs') as string | undefined;
  const selectedMitgliedId = anmeldung.get('mitglied') as string | undefined;

  // Auslastung des gewählten Kurses laden
  useEffect(() => {
    if (!selectedKursId) {
      setCurrentEnrollment(null);
      return;
    }
    const kursUrl = createRecordUrl(APP_IDS.KURSVERWALTUNG, selectedKursId);
    setEnrollmentLoading(true);
    LivingAppsService.countMitgliederKursanmeldung(tx`'${kursUrl}' in str(r.v_kurs)`)
      .then(count => setCurrentEnrollment(count))
      .catch(() => setCurrentEnrollment(null))
      .finally(() => setEnrollmentLoading(false));
  }, [selectedKursId]);

  const selectedKursRecord = selectedKursId ? kurse.recordOf(selectedKursId) : undefined;
  const maxTeilnehmer = selectedKursRecord ? fieldNumber(selectedKursRecord, 'max_teilnehmer') : null;
  const isFull = maxTeilnehmer != null && currentEnrollment != null && currentEnrollment >= maxTeilnehmer;

  // Step 2: bereits angemeldete Mitglieder-IDs für den gewählten Kurs ermitteln
  const [alreadyRegisteredIds, setAlreadyRegisteredIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!selectedKursId) {
      setAlreadyRegisteredIds(new Set());
      return;
    }
    const kursUrl = createRecordUrl(APP_IDS.KURSVERWALTUNG, selectedKursId);
    servicePort.list('mitglieder_kursanmeldung', {
      filter: tx`'${kursUrl}' in str(r.v_kurs)`,
    }).then(rows => {
      const ids = new Set<string>();
      for (const r of rows) {
        const mid = fieldRef(r, 'mitglied');
        if (mid) ids.add(mid);
      }
      setAlreadyRegisteredIds(ids);
    }).catch(() => setAlreadyRegisteredIds(new Set()));
  }, [selectedKursId]);

  // Step 2: Mitglieder-Suche — bereits angemeldete ausschließen
  const mitglieder = useRecordSearch(servicePort, 'mitgliederverwaltung', {
    searchFields: ['vorname', 'nachname', 'email'],
    toItem: m => ({
      id: m.id,
      title: `${fieldText(m, 'vorname')} ${fieldText(m, 'nachname')}`.trim(),
      subtitle: fieldText(m, 'email'),
    }),
    where: m => !alreadyRegisteredIds.has(m.id),
  });

  // Plan: ein mitglieder_kursanmeldung-Record anlegen
  const submit = useJourneySubmit(servicePort, [
    {
      key: 'anmeldung',
      entity: 'mitglieder_kursanmeldung',
      form: anmeldung,
      primary: true,
      values: {
        mitglied: selectedMitgliedId ? createRecordUrl(APP_IDS.MITGLIEDERVERWALTUNG, selectedMitgliedId) : undefined,
        kurs: selectedKursId ? createRecordUrl(APP_IDS.KURSVERWALTUNG, selectedKursId) : undefined,
      },
    },
  ], { draftKey: 'mitglied-fuer-kurs-anmelden' });

  const restart = () => {
    submit.reset();
    anmeldung.reset();
    setStep(1);
    setCurrentEnrollment(null);
    setAlreadyRegisteredIds(new Set());
  };

  // Anzeigenamen für den SuccessStep
  const mitgliedLabel = selectedMitgliedId ? (mitglieder.labelOf(selectedMitgliedId) ?? '') : '';
  const kursLabel = selectedKursId ? (kurse.labelOf(selectedKursId) ?? '') : '';
  const kursDatum = selectedKursRecord ? fieldDate(selectedKursRecord, 'kursdatum') : null;

  return (
    <IntentWizardShell
      title={tx('Mitglied für Kurs anmelden')}
      currentStep={step}
      onStepChange={setStep}
      forms={[anmeldung]}
      draftKey="mitglied-fuer-kurs-anmelden"
      intro={{
        description: tx('Ein bestehendes Mitglied für einen Kurs anmelden.'),
        needs: [tx('Kurs'), tx('Mitglied')],
      }}
    >
      {/* Schritt 1: Kurs wählen */}
      <WizardStep
        label={tx('Kurs wählen')}
        description={tx('Einen Kurs aus der Liste auswählen.')}
      >
        <div className="space-y-4">
          <EntitySelectStep
            {...kurse.select}
            selectedId={anmeldung.get('kurs') as string | undefined}
            onSelect={id => {
              anmeldung.set('kurs', id, kurse.labelOf(id));
              setStep(2);
            }}
            searchPlaceholder={tx('Kurs suchen …')}
            emptyText={tx('Keine Kurse gefunden.')}
          />
          {selectedKursId && maxTeilnehmer != null && (
            <div className="px-1">
              <BudgetTracker
                format="count"
                unit={tx('Plätze')}
                budget={maxTeilnehmer}
                booked={currentEnrollment ?? 0}
                label={tx('Kursauslastung')}
              />
              {!enrollmentLoading && isFull && (
                <p className="mt-2 text-sm text-amber-600">
                  {tx('Dieser Kurs ist bereits voll. Du kannst trotzdem fortfahren — das Team entscheidet.')}
                </p>
              )}
            </div>
          )}
          {selectedKursId && (
            <StepNav
              onBack={() => setStep(1)}
              hideBack
              onNext={() => anmeldung.validate(['kurs'])}
              nextStepLabel={tx('Mitglied wählen')}
            />
          )}
        </div>
      </WizardStep>

      {/* Schritt 2: Mitglied wählen */}
      <WizardStep
        label={tx('Mitglied wählen')}
        description={tx('Ein Mitglied auswählen — bereits angemeldete werden ausgeblendet.')}
      >
        {!anmeldung.get('kurs') ? (
          <StepNav
            onBack={() => setStep(1)}
            nextDisabled
          >
            <p className="text-sm text-muted-foreground">
              {tx('Bitte zuerst einen Kurs in Schritt 1 wählen.')}
            </p>
          </StepNav>
        ) : (
          <EntitySelectStep
            {...mitglieder.select}
            selectedId={anmeldung.get('mitglied') as string | undefined}
            onSelect={id => {
              anmeldung.set('mitglied', id, mitglieder.labelOf(id));
              setStep(3);
            }}
            searchPlaceholder={tx('Mitglied suchen …')}
            emptyText={tx('Alle Mitglieder sind bereits für diesen Kurs angemeldet.')}
          />
        )}
      </WizardStep>

      {/* Schritt 3: Zusammenfassung & Speichern */}
      <WizardStep label={tx('Prüfen & Speichern')}>
        {!anmeldung.get('kurs') || !anmeldung.get('mitglied') ? (
          <StepNav
            onBack={() => setStep(anmeldung.get('kurs') ? 2 : 1)}
            nextDisabled
          >
            <p className="text-sm text-muted-foreground">
              {tx('Bitte Kurs und Mitglied in den vorherigen Schritten wählen.')}
            </p>
          </StepNav>
        ) : (
          !submit.done && (
            <SummaryStep
              forms={[anmeldung]}
              submit={submit}
              whatHappensNext={tx('Die Anmeldung wird sofort gespeichert und erscheint in der Kursübersicht.')}
              items={[
                ...(maxTeilnehmer != null && currentEnrollment != null
                  ? [{
                      key: '_auslastung',
                      label: tx('Kursauslastung'),
                      value: `${currentEnrollment} / ${maxTeilnehmer} ${tx('Plätze')}`,
                      keys: ['_auslastung'],
                      fieldId: '_auslastung',
                    }]
                  : []),
                ...(kursDatum
                  ? [{
                      key: '_kursdatum',
                      label: tx('Kursdatum'),
                      value: formatDateTime(kursDatum),
                      keys: ['_kursdatum'],
                      fieldId: '_kursdatum',
                    }]
                  : []),
              ]}
            />
          )
        )}
      </WizardStep>

      {submit.result && (
        <SuccessStep
          result={submit.result}
          forms={[anmeldung]}
          title={tx('Anmeldung erfolgreich')}
          whatHappensNext={
            mitgliedLabel && kursLabel
              ? tx(tx`${mitgliedLabel} wurde für „${kursLabel}"${kursDatum ? ` am ${formatDate(kursDatum)}` : ''} angemeldet.`)
              : tx('Die Anmeldung wurde gespeichert.')
          }
          next={[
            { label: tx('Weitere Anmeldung'), onClick: restart },
            { label: tx('Zum Dashboard'), href: '#/' },
          ]}
        />
      )}
    </IntentWizardShell>
  );
}
