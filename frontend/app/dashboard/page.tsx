'use client';

import { useEffect, useMemo, useState } from 'react';

type Message = {
  id: number;
  direction: string;
  channel: string;
  text: string;
  timestamp: string;
};

type CaseItem = {
  id: number;
  phone: string;
  type: string;
  status: string;
  intent: string | null;
  updatedAt: string;
  messages: Message[];
};

type FilterState = {
  type: string;
  status: string;
};

const API_BASE = 'http://localhost:3001';

const FILTERS = {
  type: ['ALL', 'CONSULTA', 'RECLAMO'],
  status: ['ALL', 'ABIERTO', 'EN_PROCESO', 'CERRADO'],
} as const;

const FALLBACK_CASES: CaseItem[] = [
  {
    id: 1001,
    phone: '+51999999999',
    type: 'CONSULTA',
    status: 'EN_PROCESO',
    intent: 'CONSULTA',
    updatedAt: new Date().toISOString(),
    messages: [
      {
        id: 1,
        direction: 'INBOUND',
        channel: 'WHATSAPP',
        text: 'Hola, necesito ayuda con mi matrícula.',
        timestamp: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
      },
      {
        id: 2,
        direction: 'OUTBOUND',
        channel: 'WHATSAPP',
        text: 'Claro, te ayudo con eso.',
        timestamp: new Date(Date.now() - 1000 * 60 * 10).toISOString(),
      },
    ],
  },
];

const CARD = {
  background: '#fff',
  borderRadius: '14px',
  padding: '1.15rem',
  boxShadow: '0 1px 3px rgba(15,23,42,0.08)',
  border: '1px solid #eef1f6',
} as const;

const getCaseStats = (cases: CaseItem[]) => ({
  total: cases.length,
  abiertos: cases.filter((item) => item.status === 'ABIERTO').length,
  proceso: cases.filter((item) => item.status === 'EN_PROCESO').length,
  cerrados: cases.filter((item) => item.status === 'CERRADO').length,
});

const filterCases = (cases: CaseItem[], filters: FilterState) =>
  cases.filter((item) => {
    const matchesType = filters.type === 'ALL' || item.type === filters.type;
    const matchesStatus = filters.status === 'ALL' || item.status === filters.status;
    return matchesType && matchesStatus;
  });

const getSelectedCase = (cases: CaseItem[], selectedCaseId: number | null) =>
  cases.find((item) => item.id === selectedCaseId) ?? cases[0] ?? null;

// Colores del badge de estado, reutilizados en la lista y el detalle.
const statusStyle = (status: string) => ({
  background: status === 'ABIERTO' ? '#fee2e2' : status === 'CERRADO' ? '#dcfce7' : '#fef3c7',
  color: status === 'ABIERTO' ? '#b91c1c' : status === 'CERRADO' ? '#15803d' : '#92400e',
});

// Devuelve el mensaje más reciente de un caso según su timestamp.
const latestMessage = (messages: Message[]): Message | null =>
  messages.length
    ? messages.reduce((a, b) => (new Date(a.timestamp) >= new Date(b.timestamp) ? a : b))
    : null;

// Tiempo relativo compacto ("hace 5 min") con fallback a fecha corta.
const relativeTime = (iso: string): string => {
  const diff = Date.now() - new Date(iso).getTime();
  const min = Math.floor(diff / 60000);
  if (min < 1) return 'hace instantes';
  if (min < 60) return `hace ${min} min`;
  const hours = Math.floor(min / 60);
  if (hours < 24) return `hace ${hours} h`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `hace ${days} d`;
  return new Date(iso).toLocaleDateString();
};

// ponytail: iconos inline en SVG, sin librería de iconos.
const ChannelIcon = ({ channel }: { channel: string }) => {
  const normalized = (channel ?? '').toUpperCase();
  if (normalized === 'SMS') {
    return (
      <svg viewBox="0 0 24 24" width={15} height={15} fill="#2563eb" aria-label="SMS" role="img">
        <path d="M20 2H4a2 2 0 00-2 2v18l4-4h14a2 2 0 002-2V4a2 2 0 00-2-2z" />
      </svg>
    );
  }
  if (normalized === 'WHATSAPP') {
    return (
      <svg viewBox="0 0 24 24" width={15} height={15} fill="#25D366" aria-label="WhatsApp" role="img">
        <path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.75.46 3.45 1.32 4.95L2 22l5.25-1.38c1.45.79 3.08 1.21 4.79 1.21 5.46 0 9.91-4.45 9.91-9.91S17.5 2 12.04 2zm4.52 11.99c-.25-.12-1.47-.72-1.69-.81-.23-.08-.39-.12-.56.12-.16.25-.64.81-.79.97-.14.17-.29.19-.54.06-.25-.12-1.05-.39-1.99-1.23-.74-.66-1.23-1.47-1.38-1.72-.14-.25-.01-.38.11-.5.11-.11.25-.29.37-.43.12-.14.16-.25.25-.41.08-.17.04-.31-.02-.43-.06-.12-.56-1.34-.76-1.84-.2-.48-.4-.42-.56-.43-.14-.01-.31-.01-.48-.01-.17 0-.43.06-.66.31-.23.25-.86.85-.86 2.07 0 1.22.89 2.4 1.01 2.56.12.17 1.75 2.67 4.25 3.74.59.26 1.05.41 1.41.52.59.19 1.13.16 1.56.1.48-.07 1.47-.6 1.68-1.18.21-.58.21-1.07.14-1.18-.06-.1-.22-.16-.47-.28z" />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 24 24" width={15} height={15} fill="#94a3b8" aria-label={channel} role="img">
      <circle cx="12" cy="12" r="6" />
    </svg>
  );
};

const CaseNumberChip = ({ id }: { id: number }) => (
  <span
    style={{
      fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
      fontSize: '0.8rem',
      fontWeight: 700,
      color: '#4338ca',
      background: '#eef2ff',
      padding: '0.15rem 0.5rem',
      borderRadius: '6px',
      whiteSpace: 'nowrap',
    }}
  >
    #{id}
  </span>
);

export default function DashboardPage() {
  // Estado principal con los casos que vienen desde el backend.
  const [cases, setCases] = useState<CaseItem[]>([]);
  const [selectedCaseId, setSelectedCaseId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [typeFilter, setTypeFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');

  const filters = useMemo<FilterState>(() => ({ type: typeFilter, status: statusFilter }), [typeFilter, statusFilter]);

  // Carga los casos desde la API del backend y actualiza el estado de la vista.
  const loadCases = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE}/cases`);
      if (!response.ok) throw new Error('No se pudieron cargar los casos');
      const data = await response.json();
      setCases(Array.isArray(data) && data.length > 0 ? data : FALLBACK_CASES);
    } catch (err) {
      setCases(FALLBACK_CASES);
      setError(err instanceof Error ? err.message : 'Error desconocido');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCases();
  }, []);

  // Aplica los filtros y ordena por actividad reciente (último mensaje).
  const filteredCases = useMemo(() => {
    const activity = (item: CaseItem) => {
      const last = latestMessage(item.messages);
      return new Date(last?.timestamp ?? item.updatedAt).getTime();
    };
    return filterCases(cases, filters).sort((a, b) => activity(b) - activity(a));
  }, [cases, filters]);

  // Actualiza el estado de un caso desde el panel y vuelve a cargar la lista.
  const updateStatus = async (id: number, status: string) => {
    try {
      await fetch(`${API_BASE}/cases/${id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      await loadCases();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido');
    }
  };

  const selectedCase = useMemo(() => getSelectedCase(filteredCases, selectedCaseId), [filteredCases, selectedCaseId]);

  useEffect(() => {
    if (!selectedCaseId && filteredCases[0]) {
      setSelectedCaseId(filteredCases[0].id);
    }
  }, [filteredCases, selectedCaseId]);

  // Historial ordenado cronológicamente para que el mensaje más reciente quede al final.
  const orderedMessages = useMemo(
    () =>
      selectedCase
        ? [...selectedCase.messages].sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())
        : [],
    [selectedCase],
  );

  // Calcula los totales para las tarjetas de resumen del dashboard.
  const stats = useMemo(() => getCaseStats(cases), [cases]);

  return (
    <main style={{ padding: '2rem', fontFamily: 'system-ui, -apple-system, sans-serif', background: '#f4f7fb', minHeight: '100vh', color: '#0f172a' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <div>
          <h1 style={{ margin: 0, fontSize: '1.9rem', letterSpacing: '-0.02em' }}>Dashboard de casos</h1>
          <p style={{ margin: '0.35rem 0 0', color: '#64748b' }}>Gestiona reclamos y consultas de forma rápida y ordenada.</p>
        </div>
        <button
          onClick={loadCases}
          style={{ padding: '0.7rem 1.1rem', borderRadius: '10px', border: '1px solid #d1d5db', cursor: 'pointer', background: '#fff', fontWeight: 600 }}
        >
          Refrescar
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: '0.9rem', marginBottom: '1.5rem' }}>
        {[
          { label: 'Total', value: stats.total, tone: '#2563eb' },
          { label: 'Abiertos', value: stats.abiertos, tone: '#dc2626' },
          { label: 'En proceso', value: stats.proceso, tone: '#d97706' },
          { label: 'Cerrados', value: stats.cerrados, tone: '#16a34a' },
        ].map((card) => (
          <div key={card.label} style={{ ...CARD, borderTop: `4px solid ${card.tone}` }}>
            <div style={{ color: '#64748b', fontSize: '0.9rem' }}>{card.label}</div>
            <div style={{ fontSize: '1.6rem', fontWeight: 700, marginTop: '0.2rem' }}>{card.value}</div>
          </div>
        ))}
      </div>

      {error && <p style={{ color: 'crimson', marginBottom: '1rem' }}>{error}</p>}

      <div style={{ display: 'grid', gridTemplateColumns: '1.25fr 0.85fr', gap: '1rem', alignItems: 'start' }}>
        <section style={CARD}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.85rem', flexWrap: 'wrap', gap: '0.5rem' }}>
            <h2 style={{ margin: 0, fontSize: '1.2rem' }}>Casos</h2>
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
              <select value={typeFilter} onChange={(event) => setTypeFilter(event.target.value)} style={{ padding: '0.45rem', borderRadius: '8px', border: '1px solid #d1d5db', background: '#fff' }}>
                {FILTERS.type.map((value) => (
                  <option key={value} value={value}>{value === 'ALL' ? 'Todos los tipos' : value}</option>
                ))}
              </select>
              <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)} style={{ padding: '0.45rem', borderRadius: '8px', border: '1px solid #d1d5db', background: '#fff' }}>
                {FILTERS.status.map((value) => (
                  <option key={value} value={value}>{value === 'ALL' ? 'Todos los estados' : value}</option>
                ))}
              </select>
            </div>
          </div>

          {loading ? (
            <div style={{ padding: '1rem 0', color: '#64748b' }}>Cargando casos...</div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.92rem' }}>
                <thead>
                  <tr style={{ textAlign: 'left', color: '#64748b', fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '0.03em' }}>
                    <th style={{ padding: '0 0.5rem 0.6rem 0' }}>Caso</th>
                    <th style={{ padding: '0 0.5rem 0.6rem' }}>Teléfono</th>
                    <th style={{ padding: '0 0.5rem 0.6rem' }}>Tipo</th>
                    <th style={{ padding: '0 0.5rem 0.6rem' }}>Estado</th>
                    <th style={{ padding: '0 0 0.6rem 0.5rem' }}>Último mensaje</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredCases.length > 0 ? (
                    filteredCases.map((item) => {
                      const last = latestMessage(item.messages);
                      const selected = item.id === selectedCase?.id;
                      return (
                        <tr
                          key={item.id}
                          onClick={() => setSelectedCaseId(item.id)}
                          style={{ cursor: 'pointer', borderTop: '1px solid #eef1f6', background: selected ? '#f5f3ff' : 'transparent' }}
                        >
                          <td style={{ padding: '0.7rem 0.5rem 0.7rem 0' }}><CaseNumberChip id={item.id} /></td>
                          <td style={{ padding: '0.7rem 0.5rem' }}>{item.phone}</td>
                          <td style={{ padding: '0.7rem 0.5rem' }}>{item.type}</td>
                          <td style={{ padding: '0.7rem 0.5rem' }}>
                            <span style={{ padding: '0.25rem 0.55rem', borderRadius: '999px', fontSize: '0.8rem', fontWeight: 600, ...statusStyle(item.status) }}>
                              {item.status}
                            </span>
                          </td>
                          <td style={{ padding: '0.7rem 0 0.7rem 0.5rem' }}>
                            {last ? (
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.15rem' }}>
                                <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', color: '#334155' }}>
                                  <ChannelIcon channel={last.channel} />
                                  <span style={{ maxWidth: '11rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{last.text}</span>
                                </span>
                                <span style={{ color: '#94a3b8', fontSize: '0.78rem' }}>{relativeTime(last.timestamp)}</span>
                              </div>
                            ) : (
                              <span style={{ color: '#94a3b8' }}>-</span>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan={5} style={{ padding: '0.9rem 0', color: '#64748b' }}>No hay casos que coincidan con los filtros.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <section style={CARD}>
          {selectedCase ? (
            <>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.9rem' }}>
                <h2 style={{ margin: 0, fontSize: '1.2rem' }}>Caso</h2>
                <CaseNumberChip id={selectedCase.id} />
                <span style={{ marginLeft: 'auto', padding: '0.25rem 0.6rem', borderRadius: '999px', fontSize: '0.8rem', fontWeight: 600, ...statusStyle(selectedCase.status) }}>
                  {selectedCase.status}
                </span>
              </div>

              <div style={{ display: 'grid', gap: '0.4rem', marginBottom: '1rem', color: '#334155', fontSize: '0.92rem' }}>
                <p style={{ margin: 0 }}><strong>Teléfono:</strong> {selectedCase.phone}</p>
                <p style={{ margin: 0 }}><strong>Tipo:</strong> {selectedCase.type}</p>
                <p style={{ margin: 0 }}><strong>Última actualización:</strong> {new Date(selectedCase.updatedAt).toLocaleString()}</p>
              </div>

              <label style={{ display: 'block', marginBottom: '0.45rem', fontWeight: 600 }}>Cambiar estado</label>
              <select
                value={selectedCase.status}
                onChange={(event) => updateStatus(selectedCase.id, event.target.value)}
                style={{ padding: '0.6rem', marginBottom: '1.25rem', width: '100%', borderRadius: '8px', border: '1px solid #d1d5db', background: '#fff' }}
              >
                <option value="ABIERTO">ABIERTO</option>
                <option value="EN_PROCESO">EN_PROCESO</option>
                <option value="CERRADO">CERRADO</option>
              </select>

              <h3 style={{ margin: '0 0 0.7rem', fontSize: '1.05rem' }}>Historial</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.55rem' }}>
                {orderedMessages.length > 0 ? orderedMessages.map((message, index) => {
                  const outbound = message.direction === 'OUTBOUND';
                  const isLast = index === orderedMessages.length - 1;
                  return (
                    <div key={message.id} style={{ display: 'flex', justifyContent: outbound ? 'flex-end' : 'flex-start' }}>
                      <div
                        style={{
                          maxWidth: '85%',
                          padding: '0.55rem 0.75rem',
                          borderRadius: outbound ? '12px 12px 2px 12px' : '12px 12px 12px 2px',
                          background: outbound ? '#eef2ff' : '#f1f5f9',
                          border: `1px solid ${outbound ? '#e0e7ff' : '#e2e8f0'}`,
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', marginBottom: '0.25rem' }}>
                          <ChannelIcon channel={message.channel} />
                          <span style={{ fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.03em', color: outbound ? '#4338ca' : '#475569' }}>
                            {outbound ? 'SALIENTE' : 'ENTRANTE'}
                          </span>
                          {isLast && (
                            <span style={{ fontSize: '0.66rem', fontWeight: 700, color: '#16a34a', background: '#dcfce7', padding: '0.05rem 0.35rem', borderRadius: '6px' }}>
                              más reciente
                            </span>
                          )}
                        </div>
                        <div style={{ whiteSpace: 'pre-wrap', fontSize: '0.9rem', color: '#0f172a' }}>{message.text}</div>
                        <div style={{ marginTop: '0.3rem', fontSize: '0.72rem', color: '#94a3b8', textAlign: outbound ? 'right' : 'left' }}>
                          {new Date(message.timestamp).toLocaleString()}
                        </div>
                      </div>
                    </div>
                  );
                }) : (
                  <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
                    <div style={{ maxWidth: '85%', padding: '0.55rem 0.75rem', borderRadius: '12px 12px 12px 2px', background: '#f1f5f9', border: '1px solid #e2e8f0' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', marginBottom: '0.25rem' }}>
                        <ChannelIcon channel="WHATSAPP" />
                        <span style={{ fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.03em', color: '#475569' }}>ENTRANTE</span>
                      </div>
                      <div style={{ whiteSpace: 'pre-wrap', fontSize: '0.9rem', color: '#0f172a' }}>Tu conversación aparecerá aquí.</div>
                    </div>
                  </div>
                )}
              </div>
            </>
          ) : (
            <p style={{ color: '#64748b' }}>No hay casos aún.</p>
          )}
        </section>
      </div>
    </main>
  );
}
