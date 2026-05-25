import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import '@rainbow-me/rainbowkit/styles.css'
import { Providers } from '@/lib/providers'
import { AIAssistant } from '@/components/AIAssistant'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  icons: { icon: "/favicon.svg", apple: "/favicon.svg" },
  openGraph: {
    title: "NeuroArt DApp",
    description: "Arte neurodivergente tokenizada na Base L2. Ciencia descentralizada e economia criativa.",
    url: "https://neuro-art-d-app.vercel.app",
    siteName: "NeuroArt DApp",
    images: [{ url: "/og-image.png", width: 1200, height: 630, alt: "NeuroArt DApp" }],
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "NeuroArt DApp",
    description: "Arte neurodivergente tokenizada na Base L2.",
    images: ["/og-image.png"],
  },
  title: 'NeuroArt DApp',
  description: 'Tokenização de Arte Neurodiversa na Rede Base',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="pt-BR">
      <body className={inter.className}>
        <Providers>
          {children}
        <AIAssistant />
        </Providers>
      </body>
    </html>
  )
}
