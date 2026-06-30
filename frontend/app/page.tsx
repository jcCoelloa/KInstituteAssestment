import Link from 'next/link';

export default function HomePage() {
  return (
    <main style={{ padding: '2rem', fontFamily: 'sans-serif' }}>
      <h1>K Institute Dashboard</h1>
      <p>La estructura base ya está lista para empezar con casos, webhook y pruebas.</p>
      <Link href="/dashboard" style={{ color: '#2563eb', fontWeight: 600 }}>Ir al dashboard</Link>
    </main>
  );
}
