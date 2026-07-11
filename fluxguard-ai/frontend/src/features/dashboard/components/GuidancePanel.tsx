import { useState } from 'react';
import { Badge, Panel } from '@/components/ui';
import type { GuidanceRecommendation } from '../types/dashboard';

export interface GuidancePanelProps {
  guidance: GuidanceRecommendation;
  onApprove?: () => void;
  onReject?: () => void;
}

const FRONTEND_TRANSLATIONS: Record<string, Record<string, string>> = {
  es: {
    'Expect slow movement near': 'Se espera movimiento lento cerca de',
    'Follow signs to nearest open exit.': 'Siga las señales hacia la salida abierta más cercana.',
    'Observe crowd density at': 'Observe la densidad de la multitud en',
    'Report backlogs to control room': 'Informar retrasos a la sala de control',
    'Hold incoming flow and redirect visitors away from':
      'Detenga el flujo de entrada y redirija a los visitantes lejos de',
    'Redirect incoming visitors to lower-density zones near':
      'Redirigir a los visitantes entrantes a zonas de menor densidad cerca de',
    Monitor: 'Monitorear',
    'and prepare volunteer support if density continues rising':
      'y preparar el apoyo de voluntarios si la densidad sigue aumentando',
    'Maintain normal monitoring for': 'Mantener el monitoreo normal para',
    'Recommended actions': 'Acciones recomendadas',
    'Operational guidance': 'Guía operativa',
    'Simulated AI recommendation': 'Recomendación de IA simulada',
    'Broadcast Active': 'Transmisión activa',
    'Archived / Rejected': 'Archivado / Rechazado',
    'Awaiting Operator Approval': 'En espera de aprobación del operador',
    'Approve Broadcast': 'Aprobar transmisión',
    'Reject Directive': 'Rechazar directiva',
    'Stadium operations are within safe parameters. No high risk hotspots detected.':
      'Las operaciones del estadio están dentro de los parámetros seguros. No se detectaron puntos críticos de alto riesgo.',
    'Continue routine entry/exit monitoring.':
      'Continuar con el monitoreo rutinario de entrada y salida.',
    'Balance entry and exit flow for': 'Equilibrar el flujo de entrada y salida para',
    'Maintain active zone monitoring.': 'Mantener el monitoreo activo de la zona.',
    'Reassess zone posture on the next simulation interval.':
      'Volver a evaluar la postura de la zona en el siguiente intervalo de simulación.',
  },
  fr: {
    'Expect slow movement near': 'Attendez-vous à un mouvement lent près de',
    'Follow signs to nearest open exit.':
      'Suivre les panneaux vers la sortie ouverte la plus proche.',
    'Observe crowd density at': 'Observer la densité de la foule à',
    'Report backlogs to control room': 'Signaler les encombrements à la salle de contrôle',
    'Hold incoming flow and redirect visitors away from':
      'Retenir le flux entrant et rediriger les visiteurs loin de',
    'Redirect incoming visitors to lower-density zones near':
      'Rediriger les visiteurs entrants vers des zones de densité inférieure près de',
    Monitor: 'Surveiller',
    'and prepare volunteer support if density continues rising':
      "et préparer le soutien des bénévoles si la densité continue d'augmenter",
    'Maintain normal monitoring for': 'Maintenir la surveillance normale pour',
    'Recommended actions': 'Actions recommandées',
    'Operational guidance': 'Directives opérationnelles',
    'Simulated AI recommendation': 'Recommandation IA simulée',
    'Broadcast Active': 'Diffusion active',
    'Archived / Rejected': 'Archivé / Rejeté',
    'Awaiting Operator Approval': "En attente d'approbation",
    'Approve Broadcast': 'Approuver la diffusion',
    'Reject Directive': 'Rejeter la directive',
    'Stadium operations are within safe parameters. No high risk hotspots detected.':
      'Les opérations du stade sont dans des paramètres sûrs. Aucun point chaud à risque détecté.',
    'Continue routine entry/exit monitoring.':
      'Continuer la surveillance de routine des entrées/sorties.',
    'Balance entry and exit flow for': "Équilibrer le flux d'entrée et de sortie pour",
    'Maintain active zone monitoring.': 'Maintenir une surveillance active de la zone.',
    'Reassess zone posture on the next simulation interval.':
      'Réévaluer la posture de la zone au prochain intervalle.',
  },
  de: {
    'Expect slow movement near': 'Erwarten Sie langsame Bewegung in der Nähe von',
    'Follow signs to nearest open exit.':
      'Folgen Sie den Schildern zum nächsten geöffneten Ausgang.',
    'Observe crowd density at': 'Beobachten Sie die Menschendichte bei',
    'Report backlogs to control room': 'Rückstände an den Kontrollraum melden',
    'Hold incoming flow and redirect visitors away from':
      'Eingehenden Fluss anhalten und Besucher wegleiten von',
    'Redirect incoming visitors to lower-density zones near':
      'Leiten Sie ankommende Besucher in Zonen mit geringerer Dichte um nahe',
    Monitor: 'Überwachen Sie',
    'and prepare volunteer support if density continues rising':
      'und bereiten Sie Unterstützung durch Freiwillige vor, falls die Dichte weiter steigt',
    'Maintain normal monitoring for': 'Normale Überwachung beibehalten für',
    'Recommended actions': 'Empfohlene Maßnahmen',
    'Operational guidance': 'Betriebliche Richtlinien',
    'Simulated AI recommendation': 'Simulierte KI-Empfehlung',
    'Broadcast Active': 'Übertragung aktiv',
    'Archived / Rejected': 'Archiviert / Abgelehnt',
    'Awaiting Operator Approval': 'Wartet auf Genehmigung',
    'Approve Broadcast': 'Sendung genehmigen',
    'Reject Directive': 'Richtlinie ablehnen',
    'Stadium operations are within safe parameters. No high risk hotspots detected.':
      'Der Stadionbetrieb liegt im sicheren Bereich. Keine Hochrisiko-Hotspots erkannt.',
    'Continue routine entry/exit monitoring.': 'Routinemäßige Ein-/Ausgangsüberwachung fortsetzen.',
    'Balance entry and exit flow for': 'Gleichen Sie Ein- und Auslassfluss aus für',
    'Maintain active zone monitoring.': 'Aktive Zonenüberwachung beibehalten.',
    'Reassess zone posture on the next simulation interval.':
      'Bewerten Sie die Zonenhaltung im nächsten Intervall neu.',
  },
};

function translate(text: string, lang: string): string {
  if (lang === 'en' || !FRONTEND_TRANSLATIONS[lang]) {
    return text;
  }
  const dict = FRONTEND_TRANSLATIONS[lang];
  if (dict[text]) {
    return dict[text];
  }
  for (const key of Object.keys(dict)) {
    if (text.startsWith(key)) {
      const rest = text.substring(key.length);
      return `${dict[key]}${rest}`;
    }
  }
  return text;
}

export function GuidancePanel({ guidance, onApprove, onReject }: GuidancePanelProps) {
  const [lang, setLang] = useState<'en' | 'es' | 'fr' | 'de'>('en');
  const status = guidance.status || 'PENDING_APPROVAL';

  const translatedHeadline = translate(guidance.headline || 'Simulated AI recommendation', lang);
  const translatedMessage = translate(guidance.message, lang);
  const translatedActions = guidance.recommendedActions.map((action) => translate(action, lang));

  return (
    <Panel
      eyebrow={translate('Operational guidance', lang)}
      title={translatedHeadline}
      aria-label="Guidance panel"
    >
      <div className="space-y-4">
        {/* Language Selection Buttons */}
        <div className="flex justify-end gap-1.5 border-b border-white/5 pb-2 text-xs">
          <span className="text-ink-muted self-center mr-1">Language:</span>
          {(['en', 'es', 'fr', 'de'] as const).map((l) => (
            <button
              key={l}
              onClick={() => setLang(l)}
              className={`px-2 py-0.5 rounded text-[10px] uppercase font-bold tracking-wider transition-all ${
                lang === l
                  ? 'bg-brand-primary text-slate-950 font-black'
                  : 'bg-white/5 border border-white/10 text-ink-muted hover:bg-white/10'
              }`}
            >
              {l}
            </button>
          ))}
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <p className="max-w-2xl text-sm leading-6 text-ink-muted">{translatedMessage}</p>
          <div className="flex flex-col items-end gap-1.5 shrink-0">
            <Badge variant="info">
              {guidance.confidence}%{' '}
              {lang === 'en'
                ? 'confidence'
                : lang === 'es'
                  ? 'confianza'
                  : lang === 'fr'
                    ? 'confiance'
                    : 'Vertrauen'}{' '}
              · {guidance.risk}
            </Badge>
            {status === 'APPROVED' && (
              <Badge variant="safe">{translate('Broadcast Active', lang)}</Badge>
            )}
            {status === 'REJECTED' && (
              <Badge variant="critical">{translate('Archived / Rejected', lang)}</Badge>
            )}
            {status === 'PENDING_APPROVAL' && (
              <Badge variant="warning">{translate('Awaiting Operator Approval', lang)}</Badge>
            )}
          </div>
        </div>
        <div>
          <h3 className="text-sm font-semibold text-ink">
            {translate('Recommended actions', lang)}
          </h3>
          <ul className="mt-3 space-y-2">
            {translatedActions.map((action) => (
              <li
                key={action}
                className="rounded-command border border-white/10 bg-white/5 px-3 py-2 text-sm text-ink-muted"
              >
                {action}
              </li>
            ))}
          </ul>
        </div>

        {status === 'PENDING_APPROVAL' && onApprove && onReject && (
          <div className="flex items-center gap-3 pt-2">
            <button
              onClick={onApprove}
              className="text-xs font-semibold rounded bg-brand-primary text-slate-950 px-3 py-2 hover:bg-brand-primary/80 transition-all focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand-primary"
            >
              ✓ {translate('Approve Broadcast', lang)}
            </button>
            <button
              onClick={onReject}
              className="text-xs font-semibold rounded border border-white/10 bg-white/5 text-ink-muted px-3 py-2 hover:bg-red-500/20 hover:text-red-400 hover:border-red-500/20 transition-all focus-visible:outline focus-visible:outline-2 focus-visible:outline-red-500"
            >
              ✕ {translate('Reject Directive', lang)}
            </button>
          </div>
        )}
      </div>
    </Panel>
  );
}
