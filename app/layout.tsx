import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Relatório de Trocas Diário",
  description: "Dashboard de acompanhamento de trocas por setor",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" data-theme="dark">
      <body>{children}</body>
    </html>
  );
}
