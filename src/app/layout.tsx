import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Casa Nicolae - Hub Intern HAPPY",
  description: "Sistem intern de management pentru Casa Nicolae",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Casa Nicolae",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
  themeColor: "#6366f1",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ro">
      <head>
        <link rel="apple-touch-icon" href="/icon-192.png" />
      </head>
      <body className="antialiased bg-gray-50">
        {children}
        <ServiceWorkerRegistration />
      </body>
    </html>
  );
}

function ServiceWorkerRegistration() {
  return (
    <script
      dangerouslySetInnerHTML={{
        __html: `
          if ('serviceWorker' in navigator) {
            window.addEventListener('load', function() {
              navigator.serviceWorker.register('/sw.js').then(function(reg) {
                console.log('SW registered:', reg.scope);
                // Try to register periodic sync for pharmacy checks
                if ('periodicSync' in reg) {
                  reg.periodicSync.register('check-pharmacy-stock', {
                    minInterval: 60 * 60 * 1000 // 1 hour
                  }).catch(function() {});
                }
              }).catch(function(err) {
                console.log('SW registration failed:', err);
              });
            });
          }
        `,
      }}
    />
  );
}
