import './globals.css';

export const metadata = {
  title: 'K Institute Dashboard',
  description: 'Assessment dashboard for case management',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  );
}
