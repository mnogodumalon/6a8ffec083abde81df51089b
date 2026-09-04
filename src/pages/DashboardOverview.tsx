import type { DashboardData } from '@/hooks/useDashboardData';
import { useEntityCrud } from '@/components/EntityCrud';
import { tx, appLabel } from '@/i18n';
import { formatDate, formatDateTime } from '@/lib/formatters';
import { useClock, gruss, namen, undoToast } from '@/lib/polish';
import { StatStrip, StatStripItem } from '@/components/StatCard';
import { DashboardGrid } from '@/components/DashboardGrid';
import { WorkList } from '@/components/WorkList';
import { HeroBanner } from '@/components/HeroBanner';
import { CalendarWidget } from '@/components/widgets/CalendarWidget';
import type { CalendarEvent } from '@/components/widgets/CalendarWidget';
import { ChartWidget } from '@/components/widgets/ChartWidget';
import { dateFnsLocale } from '@/i18n';
import { format, parseISO, isFuture, isToday, addDays } from 'date-fns';
import { LivingAppsService } from '@/services/livingAppsService';
import { IconCalendar, IconUsers, IconClipboardList, IconUserPlus, IconAlertTriangle } from '@tabler/icons-react';
import { Button } from '@/components/ui/button';

export default function DashboardOverview({ data }: { data: DashboardData }) {
  const {
    kursverwaltung,
    mitgliederverwaltung,
    mitgliederKursanmeldung,
    kursanmeldungFuerInteressenten,
    kursverwaltungMap,
    setKursverwaltung,
    fetchAll,
  } = data;

  const crud = useEntityCrud(data);
  const enrichedMitgliederKursanmeldung = crud.enriched.mitgliederKursanmeldung;
  const enrichedKursanmeldungFuerInteressenten = crud.enriched.kursanmeldungFuerInteressenten;

  const clock = useClock();
  const today = format(clock, 'yyyy-MM-dd');

  // Kommende Kurse (ab heute)
  const upcomingKurse = kursverwaltung
    .filter(k => k.fields.kursdatum && k.fields.kursdatum >= today)
    .sort((a, b) => (a.fields.kursdatum ?? '') < (b.fields.kursdatum ?? '') ? -1 : 1);

  // Überfällige Kurse (in der Vergangenheit, ohne Anmeldungen entfernt — zeige solche mit wenig Anmeldungen)
  const overbooked = kursverwaltung.filter(k => {
    if (!k.fields.kursdatum || !k.fields.max_teilnehmer) return false;
    const anmeldungen = mitgliederKursanmeldung.filter(a => {
      const id = a.fields.kurs?.match(/([a-f0-9]{24})$/i)?.[1];
      return id === k.record_id;
    }).length + kursanmeldungFuerInteressenten.filter(a => {
      const id = a.fields.kurs?.match(/([a-f0-9]{24})$/i)?.[1];
      return id === k.record_id;
    }).length;
    return anmeldungen >= k.fields.max_teilnehmer;
  });

  // Neue Anmeldungen (letzte 7 Tage)
  const sevenDaysAgo = format(addDays(clock, -7), 'yyyy-MM-dd');
  const neueAnmeldungenMitglieder = enrichedMitgliederKursanmeldung.filter(
    a => a.createdat >= sevenDaysAgo
  );
  const neueAnmeldungenInteressenten = enrichedKursanmeldungFuerInteressenten.filter(
    a => a.createdat >= sevenDaysAgo
  );
  const alleNeueAnmeldungen = neueAnmeldungenMitglieder.length + neueAnmeldungenInteressenten.length;

  // Kursauslastung: Anmeldungsanzahl pro Kurs
  const anmeldungenProKurs = (kursId: string) => {
    const mitglieder = mitgliederKursanmeldung.filter(a =>
      a.fields.kurs?.includes(kursId)
    ).length;
    const interessenten = kursanmeldungFuerInteressenten.filter(a =>
      a.fields.kurs?.includes(kursId)
    ).length;
    return mitglieder + interessenten;
  };

  // CalendarWidget Events aus Kursen
  const calendarEvents: CalendarEvent[] = kursverwaltung
    .filter(k => !!k.fields.kursdatum)
    .map(k => {
      const belegung = anmeldungenProKurs(k.record_id);
      const maxTn = k.fields.max_teilnehmer ?? 0;
      const voll = maxTn > 0 && belegung >= maxTn;
      const fast = maxTn > 0 && belegung >= maxTn * 0.8;
      return {
        id: k.record_id,
        start: k.fields.kursdatum!,
        title: k.fields.kursname ?? tx('Unbekannter Kurs'),
        subtitle: maxTn > 0
          ? tx`${belegung}/${maxTn} Teilnehmer`
          : (k.fields.ort ?? undefined),
        tone: voll ? 'destructive' : fast ? 'warning' : 'default',
      } satisfies CalendarEvent;
    });

  // Kontext-Zeile
  const naechsterKurs = upcomingKurse[0];
  const contextLine = naechsterKurs
    ? (isToday(parseISO(naechsterKurs.fields.kursdatum!.slice(0, 10)))
        ? tx`Heute: ${naechsterKurs.fields.kursname ?? ''} — ${anmeldungenProKurs(naechsterKurs.record_id)} Anmeldungen`
        : tx`Nächster Kurs: ${naechsterKurs.fields.kursname ?? ''} am ${formatDate(naechsterKurs.fields.kursdatum)}`)
    : tx`${mitgliederverwaltung.length} Mitglieder, noch keine Kurse geplant`;

  // WorkList: Letzte Anmeldungen
  const recenteAnmeldungen = [
    ...neueAnmeldungenMitglieder.map(a => ({
      id: a.record_id,
      title: a.mitgliedName || tx('Mitglied'),
      subtitle: a.kursName,
      record: a,
      isMitglied: true as const,
    })),
    ...neueAnmeldungenInteressenten.map(a => ({
      id: a.record_id,
      title: `${a.fields.vorname ?? ''} ${a.fields.nachname ?? ''}`.trim() || tx('Interessent'),
      subtitle: a.kursName,
      record: a,
      isMitglied: false as const,
    })),
  ]
    .sort((x, y) => (y.record.createdat ?? '').localeCompare(x.record.createdat ?? ''))
    .slice(0, 8);

  // Überbuchungs-Banner
  const heroKurs = overbooked[0];
  const belegungHero = heroKurs ? anmeldungenProKurs(heroKurs.record_id) : 0;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-1">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">{gruss(clock)}</h1>
            <p className="text-muted-foreground text-sm mt-0.5">{contextLine}</p>
          </div>
          <Button onClick={() => crud.kursverwaltung.openCreate({})}>
            <IconCalendar size={16} className="shrink-0 mr-2" />
            {tx('Neuer Kurs')}
          </Button>
        </div>
      </div>

      <DashboardGrid
        variant="wide"
        hero={
          heroKurs && (
            <HeroBanner
              icon={<IconAlertTriangle size={18} />}
              action={{
                label: tx('Kurs öffnen'),
                onClick: () => crud.kursverwaltung.openDetail(heroKurs),
              }}
            >
              <b>{namen([heroKurs.fields.kursname ?? ''])}</b>
              {' '}
              {tx`ist ausgebucht (${belegungHero}/${heroKurs.fields.max_teilnehmer} Plätze)`}
            </HeroBanner>
          )
        }
        kpis={
          <StatStrip>
            <StatStripItem
              title={appLabel('kursverwaltung')}
              value={kursverwaltung.length}
              icon={<IconCalendar size={16} />}
            />
            <StatStripItem
              title={appLabel('mitgliederverwaltung')}
              value={mitgliederverwaltung.length}
              icon={<IconUsers size={16} />}
            />
            <StatStripItem
              title={tx('Anmeldungen (7 Tage)')}
              value={alleNeueAnmeldungen}
              icon={<IconUserPlus size={16} />}
              tone={alleNeueAnmeldungen > 0 ? 'success' : 'default'}
            />
            <StatStripItem
              title={tx('Kommende Kurse')}
              value={upcomingKurse.length}
              icon={<IconClipboardList size={16} />}
            />
          </StatStrip>
        }
        primary={
          <CalendarWidget
            events={calendarEvents}
            defaultView="month"
            locale={dateFnsLocale()}
            onEventClick={ev => {
              const kurs = kursverwaltungMap.get(ev.id);
              if (kurs) crud.kursverwaltung.openDetail(kurs);
            }}
            onEmptyClick={date => {
              const dateStr = format(date, "yyyy-MM-dd'T'HH:mm");
              crud.kursverwaltung.openCreate({ kursdatum: dateStr });
            }}
            onEventDrop={async (eventId, newStart) => {
              const kurs = kursverwaltungMap.get(eventId);
              if (!kurs) return;
              const prev = kurs.fields.kursdatum;
              setKursverwaltung(prev2 =>
                prev2.map(k =>
                  k.record_id === eventId
                    ? { ...k, fields: { ...k.fields, kursdatum: newStart } }
                    : k
                )
              );
              try {
                await LivingAppsService.updateKursverwaltungEntry(eventId, { kursdatum: newStart });
                undoToast(
                  tx`${kurs.fields.kursname ?? ''} — verschoben`,
                  async () => {
                    setKursverwaltung(prev2 =>
                      prev2.map(k =>
                        k.record_id === eventId
                          ? { ...k, fields: { ...k.fields, kursdatum: prev } }
                          : k
                      )
                    );
                    await LivingAppsService.updateKursverwaltungEntry(eventId, { kursdatum: prev });
                  }
                );
              } catch {
                fetchAll();
              }
            }}
          />
        }
        aside={
          <>
            <WorkList
              title={tx('Neue Anmeldungen (7 Tage)')}
              items={recenteAnmeldungen.map(a => ({
                id: a.id,
                title: a.title,
                secondLine: (
                  <span className="text-muted-foreground truncate">{a.subtitle}</span>
                ),
                action: {
                  label: tx('Öffnen'),
                  onClick: () => {
                    if (a.isMitglied) {
                      const rec = mitgliederKursanmeldung.find(x => x.record_id === a.id);
                      if (rec) crud.mitgliederKursanmeldung.openDetail(rec);
                    } else {
                      const rec = kursanmeldungFuerInteressenten.find(x => x.record_id === a.id);
                      if (rec) crud.kursanmeldungFuerInteressenten.openDetail(rec);
                    }
                  },
                },
              }))}
              onItemClick={id => {
                const mKa = mitgliederKursanmeldung.find(x => x.record_id === id);
                if (mKa) { crud.mitgliederKursanmeldung.openDetail(mKa); return; }
                const kFI = kursanmeldungFuerInteressenten.find(x => x.record_id === id);
                if (kFI) crud.kursanmeldungFuerInteressenten.openDetail(kFI);
              }}
              empty={{
                text: tx('Noch keine Anmeldungen in den letzten 7 Tagen'),
                action: {
                  label: tx('Anmeldung hinzufügen'),
                  onClick: () => crud.mitgliederKursanmeldung.openCreate({}),
                },
              }}
            />
            <ChartWidget
              title={tx('Anmeldungen pro Kurs')}
              rows={[
                ...mitgliederKursanmeldung.map(a => ({
                  id: `mk:${a.record_id}`,
                  data: { kursName: (kursverwaltungMap.get(a.fields.kurs?.match(/([a-f0-9]{24})$/i)?.[1] ?? '')?.fields.kursname ?? tx('Unbekannt')) },
                })),
                ...kursanmeldungFuerInteressenten.map(a => ({
                  id: `ki:${a.record_id}`,
                  data: { kursName: (kursverwaltungMap.get(a.fields.kurs?.match(/([a-f0-9]{24})$/i)?.[1] ?? '')?.fields.kursname ?? tx('Unbekannt')) },
                })),
              ]}
              dimension={{ kind: 'category', accessor: r => r.data.kursName }}
            />
          </>
        }
      />

      {crud.surfaces}
    </div>
  );
}
