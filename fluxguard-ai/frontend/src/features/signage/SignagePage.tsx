import { useEffect, useState } from 'react';
import { api } from '@/services/api';
import type { BackendEvent } from '@/services/api';
import { getActiveEventId, useSimulationState } from '@/features/simulation/simulationStore';
import { RoleGuard } from '@/features/auth';

interface SignageGuidance {
  guidanceId: string;
  alertId: string;
  audienceRole: string;
  severity: string;
  headline: string;
  actions: string[];
  expiresAt: string;
  payload?: {
    shortMessage?: string;
  };
  status: string;
}

const SIGNAGE_TRANSLATIONS: Record<string, Record<string, string>> = {
  fr: {
    'Live Stadium Signage Console': 'Console de signalisation du stade en direct',
    'Simulated active LED display boards located throughout Lucusa Stadium. Real-time approved safety instructions are pushed instantly to these displays.':
      "Simulateur de panneaux d'affichage LED actifs situés dans le stade. Les consignes de sécurité approuvées en temps réel sont diffusées instantanément.",
    'Safety Broadcast Active': 'Diffusion de sécurité active',
    'Normal Operations': 'Opérations normales',
    'Safety Directives': 'Directives de sécurité',
    Language: 'Langue',
    'Display ID': "ID de l'affichage",
    Expires: 'Expire à',
    'Status: Steady': 'Statut: Stable',
    'Clear Test': 'Effacer le test',
    'Trigger Mock Alert': "Déclencher l'alerte test",
    'Test Panel': 'Panneau de test de diffusion',
    'Select Target Screen': "Sélectionner l'écran cible",
    'Operations running within safe capacity limits. Maintain standard flow rates.':
      'Opérations dans les limites de capacité sûres. Maintenir les débits de flux standard.',
    // Directives
    'Reroute traffic from congested areas': 'Rediriger le trafic des zones encombrées',
    'High density warning at East Concourse': 'Alerte haute densité au hall Est',
    'North Gate capacity warning': 'Avertissement de capacité à la porte Nord',
    'Gate C bottleneck detected': "Goulot d'étranglement detected à la porte C",
    'Detour Gate C flow to West Entrance': "Détourner le flux de la porte C vers l'entrée Ouest",
    'Move additional stewards to Gate C':
      'Déplacer des agents de seguridad adicionales vers la porte C',
    'Reroute incoming Gate C arrivals to West Entrance':
      "Rediriger les arrivées de la porte C vers l'entrée Ouest",
  },
  es: {
    'Live Stadium Signage Console': 'Consola de señalización del estadio en vivo',
    'Simulated active LED display boards located throughout Lucusa Stadium. Real-time approved safety instructions are pushed instantly to these displays.':
      'Tableros de visualización LED activos simulados ubicados en todo el estadio. Las instrucciones de seguridad aprobadas se envían al instante.',
    'Safety Broadcast Active': 'Difusión de seguridad activa',
    'Normal Operations': 'Operaciones normales',
    'Safety Directives': 'Directivas de seguridad',
    Language: 'Idioma',
    'Display ID': 'ID de la pantalla',
    Expires: 'Expira a',
    'Status: Steady': 'Estado: Estable',
    'Clear Test': 'Limpiar prueba',
    'Trigger Mock Alert': 'Activar alerta de prueba',
    'Test Panel': 'Panel de prueba de difusión',
    'Select Target Screen': 'Seleccionar pantalla de destino',
    'Operations running within safe capacity limits. Maintain standard flow rates.':
      'Operaciones ejecutándose dentro de límites de capacidad seguros. Mantener tasas de flujo estándar.',
    // Directives
    'Reroute traffic from congested areas': 'Redirigir tráfico de áreas congestionadas',
    'High density warning at East Concourse': 'Advertencia de alta densidad en Concourse Este',
    'North Gate capacity warning': 'Advertencia de capacidad de Puerta Norte',
    'Gate C bottleneck detected': 'Embotellamiento detectado en Puerta C',
    'Detour Gate C flow to West Entrance': 'Desviar flujo de Puerta C a Entrada Oeste',
    'Move additional stewards to Gate C': 'Mover personal de seguridad adicional a Puerta C',
    'Reroute incoming Gate C arrivals to West Entrance':
      'Redirigir llegadas entrantes de Puerta C a Entrada Oeste',
  },
  de: {
    'Live Stadium Signage Console': 'Live-Stadionbeschilderungskonsole',
    'Simulated active LED display boards located throughout Lucusa Stadium. Real-time approved safety instructions are pushed instantly to these displays.':
      'Simulierte aktive LED-Anzeigetafeln im gesamten Lucusa-Stadion. Approved Sicherheitsanweisungen werden in Echtzeit gesendet.',
    'Safety Broadcast Active': 'Sicherheitsübertragung aktiv',
    'Normal Operations': 'Normaler Betrieb',
    'Safety Directives': 'Sicherheitsrichtlinien',
    Language: 'Sprache',
    'Display ID': 'Anzeige-ID',
    Expires: 'Läuft ab am',
    'Status: Steady': 'Status: Stabil',
    'Clear Test': 'Test löschen',
    'Trigger Mock Alert': 'Testalarm auslösen',
    'Test Panel': 'Übertragungstestpanel',
    'Select Target Screen': 'Zielbildschirm auswählen',
    'Operations running within safe capacity limits. Maintain standard flow rates.':
      'Betrieb läuft in sicheren Kapazitätsgrenzen. Normale Durchflussraten beibehalten.',
    // Directives
    'Reroute traffic from congested areas': 'Verkehr von überlasteten Bereichen umleiten',
    'High density warning at East Concourse': 'Warnung vor hoher Dichte im Ost-Korridor',
    'North Gate capacity warning': 'Nordtor-Kapazitätswarnung',
    'Gate C bottleneck detected': 'Engpass an Tor C erkannt',
    'Detour Gate C flow to West Entrance': 'Verkehr von Tor C zum Westeingang umleiten',
    'Move additional stewards to Gate C': 'Zusätzliche Ordner zu Tor C verlegen',
    'Reroute incoming Gate C arrivals to West Entrance':
      'Leiten Sie ankommende Besucher von Tor C zum Westeingang um',
  },
};

export function SignagePage() {
  const state = useSimulationState();
  const activeEventId = getActiveEventId();
  const [approvedDirectives, setApprovedDirectives] = useState<SignageGuidance[]>([]);
  const [lang, setLang] = useState<'en' | 'fr' | 'es' | 'de'>('en');
  const [activeEvent, setActiveEvent] = useState<BackendEvent | null>(null);

  // Interactive Test Panel State
  const [testTargetZone, setTestTargetZone] = useState<string>('');
  const [testDirective, setTestDirective] = useState<SignageGuidance | null>(null);

  useEffect(() => {
    const fetchEventInfo = async () => {
      try {
        const events = await api.fetchEvents();
        const currentEvent = events.find((e) => e.id === activeEventId);
        if (currentEvent) {
          setActiveEvent(currentEvent);
        }
      } catch (err) {
        console.warn('Failed to load event details', err);
      }
    };
    fetchEventInfo();
  }, [activeEventId]);

  useEffect(() => {
    const loadDirectives = async () => {
      try {
        const response = await api.getActiveGuidance(activeEventId);
        setApprovedDirectives(response);
      } catch (err) {
        console.error('Failed to load active approved guidance', err);
      }
    };
    loadDirectives();

    const wsUrl = api.getWebSocketUrl(activeEventId);
    const ws = new WebSocket(wsUrl);

    ws.onmessage = (event) => {
      try {
        const frame = JSON.parse(event.data);
        const { type, data } = frame;

        if (type === 'guidance_approved') {
          setApprovedDirectives((prev) => {
            const filtered = prev.filter((d) => d.guidanceId !== data.guidanceId);
            return [...filtered, data];
          });
        } else if (type === 'guidance_rejected') {
          setApprovedDirectives((prev) => prev.filter((d) => d.guidanceId !== data.guidanceId));
        }
      } catch (err) {
        console.error('Signage socket parsing failed', err);
      }
    };

    return () => {
      ws.close();
    };
  }, [activeEventId]);

  // Translate helper
  const t = (text: string): string => {
    if (lang === 'en') return text;
    return SIGNAGE_TRANSLATIONS[lang]?.[text] || text;
  };

  const getWelcomeText = (venueName: string): string => {
    if (lang === 'fr') return `Bienvenue à ${venueName}`;
    if (lang === 'es') return `Bienvenido a ${venueName}`;
    if (lang === 'de') return `Willkommen im ${venueName}`;
    return `Welcome to ${venueName}`;
  };

  // Map approved guidance to zone IDs
  const guidanceByZone: Record<string, SignageGuidance> = {};
  approvedDirectives.forEach((g) => {
    if (!g || !g.alertId) return;
    const matchEvent = state.events.find(
      (e) => e && e.id && e.id.toLowerCase() === g.alertId.toLowerCase(),
    );
    if (matchEvent) {
      guidanceByZone[matchEvent.zoneId] = g;
    }
  });

  // Inject active test mock if present
  if (testDirective && testTargetZone) {
    guidanceByZone[testTargetZone] = testDirective;
  }

  // Generate dynamic zones list from simulation state
  const activeVenueName = activeEvent?.name.split(' - ')[0] || 'Venue';
  const zonesList = state.zones.map((zone) => ({
    id: zone.id,
    label: `${zone.name} - Screen Display`,
  }));

  // Setup default test zone selection on load
  useEffect(() => {
    if (zonesList.length > 0 && !testTargetZone) {
      setTestTargetZone(zonesList[0].id);
    }
  }, [zonesList, testTargetZone]);

  const triggerMockAlert = () => {
    const mock: SignageGuidance = {
      guidanceId: 'mock-id-999',
      alertId: 'mock-alert-999',
      audienceRole: 'fans',
      severity: 'critical',
      headline: 'Reroute traffic from congested areas',
      actions: [
        'Detour Gate C flow to West Entrance',
        'Reroute incoming Gate C arrivals to West Entrance',
      ],
      expiresAt: new Date(Date.now() + 600000).toISOString(),
      payload: {
        shortMessage: 'High density warning at East Concourse. Reroute via West Gate.',
      },
      status: 'APPROVED',
    };
    setTestDirective(mock);
  };

  const clearTest = () => {
    setTestDirective(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4 border-b border-white/5 pb-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-ink">
            {t('Live Stadium Signage Console')}
          </h1>
          <p className="mt-2 text-sm text-ink-muted leading-relaxed max-w-2xl">
            {t(
              'Simulated active LED display boards located throughout Lucusa Stadium. Real-time approved safety instructions are pushed instantly to these displays.',
            )}
          </p>
        </div>

        {/* Multi-language Selector */}
        <div className="flex items-center gap-2 rounded-xl bg-white/5 border border-white/5 px-3 py-2">
          <span className="text-xs text-ink-muted font-bold font-mono uppercase">
            {t('Language')}:
          </span>
          <select
            aria-label="Language Selector"
            value={lang}
            onChange={(e) => setLang(e.target.value as 'en' | 'fr' | 'es' | 'de')}
            className="bg-transparent border-0 text-xs font-bold text-brand-primary p-0 pr-6 focus:ring-0 cursor-pointer"
          >
            <option value="en">English (EN)</option>
            <option value="fr">Français (FR)</option>
            <option value="es">Español (ES)</option>
            <option value="de">Deutsch (DE)</option>
          </select>
        </div>
      </div>

      {/* Interactive Display Broadcast Test Panel */}
      <RoleGuard
        allowedRoles={['STADIUM_MANAGER', 'SECURITY_SUPERVISOR', 'SUPER_ADMIN']}
        fallback={
          <div className="rounded-2xl border border-white/5 bg-surface-elevated/20 p-5 backdrop-blur flex flex-wrap items-center justify-between gap-4">
            <div className="space-y-1">
              <h3 className="text-sm font-bold text-ink">🛠️ {t('Test Panel')}</h3>
              <p className="text-xs text-ink-muted">
                ⚠ Security clearance required to override stadium LED displays.
              </p>
            </div>
          </div>
        }
      >
        <div className="rounded-2xl border border-white/5 bg-surface-elevated/20 p-5 backdrop-blur flex flex-wrap items-center justify-between gap-4">
          <div className="space-y-1">
            <h3 className="text-sm font-bold text-ink">🛠️ {t('Test Panel')}</h3>
            <p className="text-xs text-ink-muted">
              Simulate and override safety messages on a chosen LED monitor.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2">
              <span className="text-xs text-ink-muted font-mono">{t('Select Target Screen')}:</span>
              <select
                aria-label="Target Screen Selector"
                value={testTargetZone}
                onChange={(e) => setTestTargetZone(e.target.value)}
                className="rounded bg-slate-900 border border-white/10 text-xs text-ink px-2.5 py-1.5 focus:ring-0 focus:ring-offset-0 cursor-pointer"
              >
                {zonesList.map((z) => (
                  <option key={z.id} value={z.id}>
                    {z.label.replace('Screen Display', '')}
                  </option>
                ))}
              </select>
            </div>
            <button
              onClick={triggerMockAlert}
              className="rounded bg-brand-primary/10 border border-brand-primary/20 text-brand-primary px-3 py-1.5 text-xs font-bold hover:bg-brand-primary/20 transition-all"
            >
              {t('Trigger Mock Alert')}
            </button>
            {testDirective && (
              <button
                onClick={clearTest}
                className="rounded bg-rose-500/10 border border-rose-500/20 text-rose-400 px-3 py-1.5 text-xs font-bold hover:bg-rose-500/20 transition-all"
              >
                {t('Clear Test')}
              </button>
            )}
          </div>
        </div>
      </RoleGuard>

      {/* Screen Displays Grid */}
      <div className="grid gap-6 sm:grid-cols-2">
        {zonesList.map((z) => {
          const activeGuidance = guidanceByZone[z.id];
          const hasGuidance = !!activeGuidance;
          const severity = activeGuidance?.severity || 'low';

          return (
            <div
              key={z.id}
              className="relative overflow-hidden rounded-xl border border-white/10 bg-slate-950 p-6 shadow-2xl transition-all duration-300 hover:border-white/20"
            >
              {/* Glowing Status Border */}
              <div
                className={`absolute inset-x-0 top-0 h-1 transition-all duration-300 ${
                  severity === 'critical'
                    ? 'bg-red-500 shadow-[0_2px_10px_#ef4444]'
                    : severity === 'high'
                      ? 'bg-amber-500 shadow-[0_2px_10px_#f59e0b]'
                      : 'bg-emerald-500 shadow-[0_2px_10px_#10b981]'
                }`}
              />

              <div className="flex items-center justify-between border-b border-white/5 pb-4">
                <span className="text-xs font-black uppercase tracking-wider text-ink-muted">
                  {z.label.replace('Screen Display', 'Screen')}
                </span>
                <span
                  className={`inline-flex items-center rounded px-2 py-0.5 text-[9px] font-black uppercase tracking-wider ${
                    severity === 'critical'
                      ? 'bg-red-950 text-red-400 border border-red-800/40 animate-pulse'
                      : severity === 'high'
                        ? 'bg-amber-950 text-amber-400 border border-amber-800/40'
                        : 'bg-emerald-950 text-emerald-400 border border-emerald-800/40'
                  }`}
                >
                  {hasGuidance ? t('Safety Broadcast Active') : t('Normal Operations')}
                </span>
              </div>

              <div className="mt-6 flex min-h-[160px] flex-col justify-between">
                {hasGuidance ? (
                  <div className="space-y-4">
                    <h2
                      className={`text-lg font-black tracking-tight ${
                        severity === 'critical'
                          ? 'text-red-400'
                          : severity === 'high'
                            ? 'text-amber-400'
                            : 'text-sky-400'
                      }`}
                    >
                      ⚠️ {t(activeGuidance.headline)}
                    </h2>
                    <p className="text-sm text-ink-muted leading-relaxed font-mono">
                      {t(activeGuidance.payload?.shortMessage || activeGuidance.headline)}
                    </p>

                    {activeGuidance.actions && activeGuidance.actions.length > 0 && (
                      <div className="rounded bg-white/5 border border-white/5 p-3">
                        <span className="text-[10px] font-black uppercase tracking-wider text-brand-primary block mb-2">
                          {t('Safety Directives')}
                        </span>
                        <ul className="list-disc list-inside space-y-1 text-xs text-ink-muted font-sans">
                          {activeGuidance.actions.map((act: string) => (
                            <li key={act}>{t(act)}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center text-center space-y-3 py-6 animate-fade-in">
                    <div className="h-10 w-10 rounded-full bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20">
                      <span className="text-emerald-400 text-sm font-bold">✓</span>
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-ink">
                        {getWelcomeText(activeVenueName)}
                      </h3>
                      <p className="text-xs text-ink-muted mt-1 max-w-[280px]">
                        {t(
                          'Operations running within safe capacity limits. Maintain standard flow rates.',
                        )}
                      </p>
                    </div>
                  </div>
                )}

                <div className="mt-6 border-t border-white/5 pt-4 flex items-center justify-between text-[10px] text-ink-muted font-mono">
                  <span>
                    {t('Display ID')}: {z.id.toUpperCase()}-LED
                  </span>
                  <span>
                    {hasGuidance && activeGuidance.expiresAt
                      ? `${t('Expires')}: ${new Date(activeGuidance.expiresAt).toLocaleTimeString()}`
                      : t('Status: Steady')}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
