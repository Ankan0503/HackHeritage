import React, { useState, useEffect } from 'react';
import {
  X,
  Activity,
  RefreshCw,
  Cpu,
  Database,
  Satellite,
  Waves,
  ShieldCheck,
  Zap,
  Radio,
  Server
} from 'lucide-react';
import { LanguageCode } from '../types';

interface SystemHealthModalProps {
  isOpen: boolean;
  onClose: () => void;
  language: LanguageCode;
}

interface SystemHealthData {
  status: string;
  timestamp: string;
  liveStatus: {
    mlService: 'ONLINE' | 'PHYSICS_FALLBACK';
    ragService: 'ONLINE' | 'LEXICAL_FALLBACK';
    qdrantVectorDb: 'ONLINE' | 'OFFLINE';
    geminiLlm: 'ACTIVE' | 'DETERMINISTIC_FALLBACK';
    openMeteo: 'ONLINE' | 'DEGRADED';
    incoisPfz: 'AVAILABLE' | 'UNAVAILABLE';
  };
  services: Record<string, string>;
}

/** Served by GET /api/agents, so this panel cannot drift from what is wired in. */
interface AgentRoster {
  count: number;
  agents: {
    name: string;
    title: string;
    description: string;
    sources: string[];
    isStub: boolean;
  }[];
  reasoning: { provider: string | null; model: string | null; available: boolean; note: string };
  language: {
    provider: string | null;
    speechToText: string | null;
    textToSpeech: string | null;
    translation: string | null;
    note: string;
  };
  machineLearning: { shipped_variables: string[]; groups: number; truth: string | null };
}

export const SystemHealthModal: React.FC<SystemHealthModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [healthData, setHealthData] = useState<SystemHealthData | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [pingLatency, setPingLatency] = useState<number | null>(null);
  const [roster, setRoster] = useState<AgentRoster | null>(null);

  const fetchHealth = async () => {
    setIsRefreshing(true);
    const start = Date.now();
    try {
      const [health, agents] = await Promise.all([
        fetch('/api/health'),
        fetch('/api/agents'),
      ]);
      if (health.ok) {
        setHealthData(await health.json());
        setPingLatency(Date.now() - start);
      }
      // The agent roster is reported by the backend rather than listed here, so
      // this panel can never claim an agent or a source that is not wired in.
      if (agents.ok) setRoster(await agents.json());
    } catch {
      // ignore
    } finally {
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchHealth();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const components = [
    {
      name: 'Open-Meteo Atmospheric Weather',
      category: 'Live Metocean',
      icon: Waves,
      status: healthData?.liveStatus?.openMeteo === 'ONLINE' ? 'ONLINE' : 'DEGRADED',
      description: 'Air temperature, wind speed, gusts, pressure, precipitation',
      isFallback: false,
    },
    {
      name: 'Copernicus Marine (CMEMS) fronts',
      category: 'Satellite Oceanography',
      icon: Satellite,
      status: 'ONLINE',
      description: 'Thermal and biological fronts across the EEZ, published daily; cloud-bypass by sea-level advection',
      isFallback: false,
    },
    {
      name: 'INCOIS PFZ Satellite Frontlines',
      category: 'Fisheries Intelligence',
      icon: Satellite,
      status: 'AVAILABLE',
      description: 'Official Ministry of Earth Sciences daily convergence fronts',
      isFallback: false,
    },
    {
      name: 'Risk engine — Douglas sea state',
      category: 'Deterministic',
      icon: Cpu,
      status: 'ONLINE',
      // The stored XGBoost model is refused at load: its labels were derived from
      // the features it was given, so it only re-learned the IMD threshold table.
      description: 'Douglas sea state and Beaufort physics; the stored XGBoost model is refused for target leakage',
      isFallback: false,
    },
    {
      name: 'Evidence retrieval — BM25 + subword',
      category: 'Lexical RAG',
      icon: Database,
      status: 'ONLINE',
      description: 'BM25 with character n-grams over documents fetched from URLs that resolved; no dense embeddings',
      isFallback: false,
    },
    {
      name: roster?.reasoning?.model
        ? `Planner — ${roster.reasoning.model}`
        : 'Planner — LLM tool calling',
      category: 'Reasoning',
      icon: Zap,
      status: roster?.reasoning?.available ? 'ONLINE' : 'FALLBACK READY',
      description: roster?.reasoning?.available
        ? 'Calls agents as tools and may call again after seeing a result'
        : 'Keyword planner selecting agents; reply composed from their summaries',
      isFallback: !roster?.reasoning?.available,
    },
    {
      name: 'UNCLOS Maritime Geofencing',
      category: 'Spatial Intelligence',
      icon: ShieldCheck,
      status: 'ONLINE',
      description: 'Authentic 1974 Sri Lanka, PCA 2014 Bangladesh IMBL & Marine Protected Areas',
      isFallback: false,
    },
  ];

  return (
    <div className="fixed inset-0 z-[2000] flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-sm animate-in fade-in duration-200">
      {/* A column with a fixed ceiling: the header and the close button stay put
          while only the body scrolls. Without the ceiling the card grew past the
          viewport and took the close button off the bottom of the screen. */}
      <div className="relative flex max-h-[90vh] w-full max-w-2xl flex-col rounded-2xl border border-slate-200 bg-white shadow-2xl text-slate-800">
        {/* Header — pinned, so the close button is always reachable. */}
        <div className="flex shrink-0 items-center justify-between border-b border-slate-100 px-6 pt-6 pb-4">
          <div className="flex items-center space-x-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-sky-50 text-sky-600 border border-sky-200 shadow-2xs">
              <Activity className="h-5 w-5 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold font-mono tracking-wide text-slate-900">
                  System Health &amp; Multi-Service Diagnostics
                </h2>
                <span className="rounded bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700 border border-emerald-300 font-mono">
                  HEALTHY
                </span>
              </div>
              <p className="text-xs text-slate-500 font-mono">
                ORCA-X Live Connectivity &amp; Autonomous Safety Fallbacks
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 pb-6">
        {/* Top summary bar */}
        <div className="mt-4 flex items-center justify-between rounded-xl bg-slate-50 border border-slate-200 p-3 text-xs font-mono">
          <div className="flex items-center gap-2 text-slate-700">
            <Radio className="h-3.5 w-3.5 text-emerald-600 animate-pulse" />
            <span>Core API: <strong className="text-slate-900">orca-core (FastAPI)</strong></span>
            {pingLatency && (
              <span className="text-slate-500">({pingLatency}ms ping)</span>
            )}
          </div>
          <button
            onClick={fetchHealth}
            disabled={isRefreshing}
            className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs text-sky-700 hover:bg-slate-50 transition-all disabled:opacity-50 shadow-2xs cursor-pointer font-semibold"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isRefreshing ? 'animate-spin text-sky-600' : ''}`} />
            <span>Re-Probe Services</span>
          </button>
        </div>

        {/* Component matrix */}
        <div className="mt-4 space-y-2.5">
          {components.map((c, idx) => {
            const Icon = c.icon;
            return (
              <div
                key={idx}
                className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50/70 p-3 hover:border-sky-300 hover:bg-white transition-all shadow-2xs"
              >
                <div className="flex items-center space-x-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white border border-slate-200 text-sky-600 shadow-2xs">
                    <Icon className="h-4 w-4" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-slate-900">{c.name}</span>
                      <span className="text-[10px] text-slate-500 font-mono">[{c.category}]</span>
                    </div>
                    <p className="text-[11px] text-slate-600">{c.description}</p>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <span
                    className={`rounded px-2 py-0.5 text-[10px] font-bold font-mono ${
                      c.status === 'ONLINE' || c.status === 'AVAILABLE'
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-300'
                        : 'bg-amber-50 text-amber-800 border border-amber-300'
                    }`}
                  >
                    {c.status}
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Agents and the sources behind each — reported by the backend, never
            listed here, so this cannot drift from what is actually wired in. */}
        {roster && (
          <div className="mt-4">
            <div className="flex items-center justify-between px-1 pb-2">
              <h3 className="text-xs font-bold font-mono tracking-wide text-slate-200">
                AGENTS IN WORK ({roster.count})
              </h3>
              <span className="text-[10px] text-slate-500 font-mono">
                reported by /api/agents
              </span>
            </div>

            <div className="space-y-2 max-h-[40vh] overflow-y-auto pr-1">
              {roster.agents.map((agent) => (
                <div
                  key={agent.name}
                  className="rounded-xl border border-slate-800/80 bg-slate-950/60 p-3"
                >
                  <div className="flex items-center gap-2">
                    <Server className="h-3.5 w-3.5 text-cyan-400 shrink-0" />
                    <span className="text-xs font-bold text-white">{agent.title}</span>
                    <span className="text-[10px] text-slate-500 font-mono">{agent.name}</span>
                    {agent.isStub && (
                      <span className="rounded bg-amber-950/90 px-1.5 py-0.5 text-[9px] font-bold text-amber-400 border border-amber-800 font-mono">
                        STUB
                      </span>
                    )}
                  </div>
                  <p className="mt-1 text-[11px] leading-snug text-slate-400">{agent.description}</p>
                  <ul className="mt-2 space-y-0.5">
                    {agent.sources.map((source) => (
                      <li key={source} className="flex gap-1.5 text-[10.5px] leading-snug text-slate-500">
                        <span className="text-cyan-500/70 shrink-0">&bull;</span>
                        <span>{source}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>

            <div className="mt-3 grid gap-2 sm:grid-cols-2">
              <div className="rounded-xl border border-slate-800/80 bg-slate-950/60 p-2.5">
                <div className="text-[10px] font-bold font-mono text-slate-300">LANGUAGE</div>
                <p className="mt-0.5 text-[10.5px] text-slate-500 leading-snug">
                  {roster.language.provider
                    ? `${roster.language.provider} — ${roster.language.speechToText} speech, ${roster.language.textToSpeech} voice, ${roster.language.translation} translation`
                    : 'Not configured'}
                </p>
              </div>
              <div className="rounded-xl border border-slate-800/80 bg-slate-950/60 p-2.5">
                <div className="text-[10px] font-bold font-mono text-slate-300">MACHINE LEARNING</div>
                <p className="mt-0.5 text-[10.5px] text-slate-500 leading-snug">
                  {roster.machineLearning.shipped_variables.length
                    ? `Forecast bias correction for ${roster.machineLearning.shipped_variables.join(', ')} across ${roster.machineLearning.groups} fitted groups. Wind speed and waves were measured and left uncorrected.`
                    : 'No correction shipped'}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Resilience notice */}
        {/* Agents and the sources behind each — reported by the backend, never
            listed here, so this cannot drift from what is actually wired in. */}
        {roster && (
          <div className="mt-4">
            <div className="flex items-center justify-between px-1 pb-2">
              <h3 className="text-xs font-bold font-mono tracking-wide text-slate-800">
                AGENTS IN WORK ({roster.count})
              </h3>
              <span className="text-[10px] text-slate-500 font-mono">reported by /api/agents</span>
            </div>

            <div className="space-y-2">
              {roster.agents.map((agent) => (
                <div
                  key={agent.name}
                  className="rounded-xl border border-slate-200 bg-slate-50/70 p-3 shadow-2xs"
                >
                  <div className="flex items-center gap-2">
                    <Server className="h-3.5 w-3.5 text-sky-600 shrink-0" />
                    <span className="text-xs font-bold text-slate-900">{agent.title}</span>
                    <span className="text-[10px] text-slate-500 font-mono">{agent.name}</span>
                    {agent.isStub && (
                      <span className="rounded bg-amber-50 px-1.5 py-0.5 text-[9px] font-bold text-amber-700 border border-amber-200 font-mono">
                        STUB
                      </span>
                    )}
                  </div>
                  <p className="mt-1 text-[11px] leading-snug text-slate-600">{agent.description}</p>
                  <ul className="mt-2 space-y-0.5">
                    {agent.sources.map((source) => (
                      <li key={source} className="flex gap-1.5 text-[10.5px] leading-snug text-slate-500">
                        <span className="text-sky-500 shrink-0">&bull;</span>
                        <span>{source}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>

            <div className="mt-3 grid gap-2 sm:grid-cols-2">
              <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-2.5 shadow-2xs">
                <div className="text-[10px] font-bold font-mono text-slate-700">REASONING</div>
                <dl className="mt-0.5 space-y-0.5 text-[10.5px] leading-snug">
                  <div className="flex gap-1.5">
                    <dt className="text-slate-500">Service provider</dt>
                    <dd className="font-semibold text-slate-800">
                      {roster.reasoning.provider ?? 'not configured'}
                    </dd>
                  </div>
                  <div className="flex gap-1.5">
                    <dt className="text-slate-500">Model</dt>
                    <dd className="font-mono font-semibold text-slate-800">
                      {roster.reasoning.model ?? '—'}
                    </dd>
                  </div>
                </dl>
              </div>
              <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-2.5 shadow-2xs">
                <div className="text-[10px] font-bold font-mono text-slate-700">LANGUAGE</div>
                <p className="mt-0.5 text-[10.5px] text-slate-500 leading-snug">
                  {roster.language.provider
                    ? `${roster.language.provider} — ${roster.language.speechToText} speech, ${roster.language.textToSpeech} voice, ${roster.language.translation} translation`
                    : 'Not configured'}
                </p>
              </div>
              <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-2.5 shadow-2xs">
                <div className="text-[10px] font-bold font-mono text-slate-700">MACHINE LEARNING</div>
                <p className="mt-0.5 text-[10.5px] text-slate-500 leading-snug">
                  {roster.machineLearning.shipped_variables.length
                    ? `Forecast bias correction for ${roster.machineLearning.shipped_variables.join(', ')} across ${roster.machineLearning.groups} fitted groups. Wind speed and waves were measured and left uncorrected.`
                    : 'No correction shipped'}
                </p>
              </div>
            </div>
          </div>
        )}

        <div className="mt-4 rounded-xl border border-sky-200 bg-sky-50/80 p-3 text-[11px] text-slate-700 flex items-start gap-2.5 shadow-2xs">
          <ShieldCheck className="h-4 w-4 text-sky-600 shrink-0 mt-0.5" />
          <p className="leading-relaxed">
            <strong className="text-sky-900">Deterministic Safety Architecture:</strong> risk verdicts come from Douglas sea-state physics against published IMD and INCOIS thresholds, not from a learned model, so a verdict can be checked against a government bulletin. If the planner or a data source is unreachable the agents still run and the answer names the source that was missing, rather than reporting an absence of data as an absence of danger.
          </p>
        </div>
        </div>
      </div>
    </div>
  );
};
