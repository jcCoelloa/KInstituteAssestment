'use client';

import { useEffect, useMemo, useState } from 'react';

type CaseItem = {
  id: number;
  phone: string;
  type: string;
  status: string;
  intent: string | null;
  updatedAt: string;
  messages: Array<{ id: number; direction: string; text: string }>;
};

type FilterState = {
  type: string;
  status: string;
};

const FILTERS = {
  type: ['ALL', 'CONSULTA', 'RECLAMO'],
  status: ['ALL', 'ABIERTO', 'EN_PROCESO', 'CERRADO'],
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
      const response = await fetch('http://localhost:3001/cases');
      if (!response.ok) throw new Error('No se pudieron cargar los casos');
      const data = await response.json();
      setCases(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCases();
  }, []);

  // Aplica los filtros de tipo y estado sobre la lista de casos.
  const filteredCases = useMemo(() => filterCases(cases, filters), [cases, filters]);

  // Actualiza el estado de un caso desde el panel y vuelve a cargar la lista.
  const updateStatus = async (id: number, status: string) => {
    try {
      await fetch(`http://localhost:3001/cases/${id}/status`, {
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

  // Calcula los totales para las tarjetas de resumen del dashboard.
  const stats = useMemo(() => getCaseStats(cases), [cases]);

  return (
    <main style={{ padding: '2rem', fontFamily: 'sans-serif', background: '#f4f7fb', minHeight: '100vh', color: '#111827' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
        <div>
          <h1 style={{ margin: 0, fontSize: '1.8rem' }}>Dashboard de casos</h1>
          <p style={{ margin: '0.35rem 0 0', color: '#4b5563' }}>Gestiona reclamos y consultas de forma rápida y ordenada.</p>
        </div>
        <button
          onClick={loadCases}
          style={{ padding: '0.7rem 1rem', borderRadius: '8px', border: '1px solid #d1d5db', cursor: 'pointer', background: '#fff', fontWeight: 600 }}
        >
          Refrescar
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: '0.9rem', marginBottom: '1.25rem' }}>
        {[
          { label: 'Total', value: stats.total, tone: '#2563eb' },
          { label: 'Abiertos', value: stats.abiertos, tone: '#dc2626' },
          { label: 'En proceso', value: stats.proceso, tone: '#d97706' },
          { label: 'Cerrados', value: stats.cerrados, tone: '#16a34a' },
        ].map((card) => (
          <div key={card.label} style={{ background: '#fff', borderRadius: '12px', padding: '1rem', boxShadow: '0 1px 3px rgba(0,0,0,0.08)', borderTop: `4px solid ${card.tone}` }}>
            <div style={{ color: '#6b7280', fontSize: '0.9rem' }}>{card.label}</div>
            <div style={{ fontSize: '1.45rem', fontWeight: 700, marginTop: '0.2rem' }}>{card.value}</div>
          </div>
        ))}
      </div>

      {error && <p style={{ color: 'crimson', marginBottom: '1rem' }}>{error}</p>}

      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: '1rem' }}>
        <section style={{ background: 'white', borderRadius: '12px', padding: '1rem', boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.85rem' }}>
            <h2 style={{ margin: 0 }}>Casos</h2>
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
              <select value={typeFilter} onChange={(event) => setTypeFilter(event.target.value)} style={{ padding: '0.45rem', borderRadius: '6px', border: '1px solid #d1d5db', background: '#fff' }}>
                {FILTERS.type.map((value) => (
                  <option key={value} value={value}>{value === 'ALL' ? 'Todos los tipos' : value}</option>
                ))}
              </select>
              <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)} style={{ padding: '0.45rem', borderRadius: '6px', border: '1px solid #d1d5db', background: '#fff' }}>
                {FILTERS.status.map((value) => (
                  <option key={value} value={value}>{value === 'ALL' ? 'Todos los estados' : value}</option>
                ))}
              </select>
            </div>
          </div>

          {loading ? (
            <div style={{ padding: '1rem 0', color: '#6b7280' }}>Cargando casos...</div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ textAlign: 'left', borderBottom: '1px solid #ddd' }}>
                    <th style={{ paddingBottom: '0.5rem' }}>Teléfono</th>
                    <th style={{ paddingBottom: '0.5rem' }}>Tipo</th>
                    <th style={{ paddingBottom: '0.5rem' }}>Estado</th>
                    <th style={{ paddingBottom: '0.5rem' }}>Intención</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredCases.map((item) => (
                    <tr key={item.id} onClick={() => setSelectedCaseId(item.id)} style={{ cursor: 'pointer', borderBottom: '1px solid #eee' }}>
                      <td style={{ padding: '0.7rem 0' }}>{item.phone}</td>
                      <td style={{ padding: '0.7rem 0' }}>{item.type}</td>
                      <td style={{ padding: '0.7rem 0' }}>
                        <span style={{ padding: '0.25rem 0.55rem', borderRadius: '999px', background: item.status === 'ABIERTO' ? '#fee2e2' : item.status === 'CERRADO' ? '#dcfce7' : '#fef3c7', color: item.status === 'ABIERTO' ? '#b91c1c' : item.status === 'CERRADO' ? '#15803d' : '#92400e' }}>
                          {item.status}
                        </span>
                      </td>
                      <td style={{ padding: '0.7rem 0' }}>{item.intent ?? '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <section style={{ background: 'white', borderRadius: '12px', padding: '1rem', boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }}>
          <h2 style={{ marginTop: 0, marginBottom: '0.8rem' }}>Detalle</h2>
          {selectedCase ? (
            <>
              <div style={{ display: 'grid', gap: '0.45rem', marginBottom: '1rem' }}>
                <p style={{ margin: 0 }}><strong>Teléfono:</strong> {selectedCase.phone}</p>
                <p style={{ margin: 0 }}><strong>Tipo:</strong> {selectedCase.type}</p>
                <p style={{ margin: 0 }}><strong>Estado:</strong> {selectedCase.status}</p>
                <p style={{ margin: 0 }}><strong>Última actualización:</strong> {new Date(selectedCase.updatedAt).toLocaleString()}</p>
              </div>

              <label style={{ display: 'block', marginBottom: '0.45rem', fontWeight: 600 }}>Cambiar estado</label>
              <select
                value={selectedCase.status}
                onChange={(event) => updateStatus(selectedCase.id, event.target.value)}
                style={{ padding: '0.55rem', marginBottom: '1rem', width: '100%', borderRadius: '6px', border: '1px solid #d1d5db', background: '#fff' }}
              >
                <option value="ABIERTO">ABIERTO</option>
                <option value="EN_PROCESO">EN_PROCESO</option>
                <option value="CERRADO">CERRADO</option>
              </select>

              <div>
                <h3 style={{ marginBottom: '0.5rem' }}>Historial</h3>
                {selectedCase.messages.map((message) => (
                  <div key={message.id} style={{ marginBottom: '0.6rem', padding: '0.7rem', background: '#f8fafc', borderRadius: '8px', border: '1px solid #eef2f7' }}>
                    <strong>{message.direction}</strong>: {message.text}
                  </div>
                ))}
              </div>
            </>
          ) : (
            <p style={{ color: '#6b7280' }}>No hay casos aún.</p>
          )}
        </section>
      </div>
    </main>
  );
}
