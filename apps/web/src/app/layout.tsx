import type { Metadata } from 'next'
import './globals.css'
import VLibras from '@/components/vlibras'

export const metadata: Metadata = {
  title: 'LibrasHUB',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="pt-BR">
      <body className={`antialiased`}>
        <VLibras />
        {children}
      </body>
    </html>
  )
}
