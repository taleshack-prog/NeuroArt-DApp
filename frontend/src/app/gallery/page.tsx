'use client'

import { motion } from 'framer-motion'
import { ConnectKitButton } from 'connectkit'
import { useAccount, useBalance } from 'wagmi'
import { Brain, ArrowLeft } from 'lucide-react'
import Link from 'next/link'

type ArtWork = {
  obraId: string
  title: string
  artist: string
  imageUrl: string
  availablePercentage: number
  pricePerFraction: string
  estadoCognitivo: string
}

const artworks: ArtWork[] = [
  {
    obraId: '001',
    title: 'Neuro-Sinfonia #001',
    artist: 'Tales Hack',
    imageUrl: 'https://placehold.co/500x500/0f172a/6366f1?text=NS+001',
    availablePercentage: 75,
    pricePerFraction: '0.05 $NEURO',
    estadoCognitivo: 'Hiperfoco',
  },
  {
    obraId: '002',
    title: 'Ondas Alpha #002',
    artist: 'Tales Hack',
    imageUrl: 'https://placehold.co/500x500/0f172a/10b981?text=OA+002',
    availablePercentage: 40,
    pricePerFraction: '0.08 $NEURO',
    estadoCognitivo: 'Estado de Fluxo',
  },
  {
    obraId: '003',
    title: 'NeuroGenesis #003',
    artist: 'Tales Hack',
    imageUrl: 'https://placehold.co/500x500/0f172a/a855f7?text=NG+003',
    availablePercentage: 90,
    pricePerFraction: '0.12 $NEURO',
    estadoCognitivo: 'Divergência Criativa',
  },
  {
    obraId: '004',
    title: 'Frequência 12Hz #004',
    artist: 'Tales Hack',
    imageUrl: 'https://placehold.co/500x500/0f172a/f59e0b?text=F+004',
    availablePercentage: 55,
    pricePerFraction: '0.03 $NEURO',
    estadoCognitivo: 'Hiperfoco',
  },
  {
    obraId: '005',
    title: 'Plasticidade #005',
    artist: 'Tales Hack',
    imageUrl: 'https://placehold.co/500x500/0f172a/ec4899?text=P+005',
    availablePercentage: 20,
    pricePerFraction: '0.07 $NEURO',
    estadoCognitivo: 'Monofoco',
  },
  {
    obraId: '006',
    title: 'BCI Canvas #006',
    artist: 'Tales Hack',
    imageUrl: 'https://placehold.co/500x500/0f172a/06b6d4?text=BC+006',
    availablePercentage: 65,
    pricePerFraction: '0.09 $NEURO',
    estadoCognitivo: 'Estado de Fluxo',
  },
]

const NEURO_TOKEN_ADDRESS = (process.env.NEXT_PUBLIC_NEURO_TOKEN_ADDRESS || '0x0000000000000000000000000000000000000000') as `0x${string}`

function ArtCard({ art }: { art: ArtWork }) {
  const soldPercentage = 100 - art.availablePercentage

  return (
    <motion.div
      variants={{ hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } }}
      whileHover={{ y: -4 }}
      className="group bg-slate-900/60 border border-slate-800 rounded-2xl overflow-hidden hover:border-indigo-500/50 transition-all duration-300"
    >
      <div className="relative overflow-hidden">
        <img
          src={art.imageUrl}
          alt={art.title}
          className="w-full h-52 object-cover group-hover:scale-105 transition-transform duration-500"
        />
        <div className="absolute top-3 left-3 flex gap-2">
          <span className="px-2 py-1 rounded-full bg-slate-950/80 border border-indigo-500/40 text-indigo-400 text-xs font-medium">
          </span>
          <span className="px-2 py-1 rounded-full bg-slate-950/80 border border-emerald-500/40 text-emerald-400 text-xs font-medium">
            {art.estadoCognitivo}
          </span>
        </div>
        <div className="absolute top-3 right-3 px-2 py-1 rounded-full bg-slate-950/80 border border-slate-700 text-slate-300 text-xs font-mono">
          #{art.obraId}
        </div>
      </div>

      <div className="p-5 space-y-4">
        <div>
          <h3 className="font-bold text-white text-lg leading-tight">{art.title}</h3>
          <p className="text-slate-500 text-sm mt-1">por {art.artist}</p>
        </div>

        <div className="space-y-2">
          <div className="flex justify-between text-xs text-slate-400">
            <span>Frações vendidas</span>
            <span className="text-indigo-400 font-semibold">{soldPercentage}%</span>
          </div>
          <div className="w-full bg-slate-800 rounded-full h-1.5">
            <motion.div
              className="bg-gradient-to-r from-indigo-500 to-purple-500 h-1.5 rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${soldPercentage}%` }}
              transition={{ duration: 1, delay: 0.3 }}
            />
          </div>
          <div className="flex justify-between text-xs text-slate-500">
            <span>{art.availablePercentage}% disponível</span>
            <span>{soldPercentage}% adquirido</span>
          </div>
        </div>

        <div className="flex items-center justify-between pt-1">
          <div>
            <div className="text-xs text-slate-500">Preço por fração</div>
            <div className="text-indigo-400 font-bold">{art.pricePerFraction}</div>
          </div>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="px-5 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl text-sm font-bold hover:from-indigo-500 hover:to-purple-500 transition-all"
          >
            Adquirir Frações
          </motion.button>
        </div>
      </div>
    </motion.div>
  )
}

export default function GalleryPage() {
  const { address } = useAccount()
  const { data: balance } = useBalance({
    address,
    token: NEURO_TOKEN_ADDRESS,
  })

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-950 via-indigo-950/20 to-slate-950 text-white">

      <header className="border-b border-slate-800 bg-slate-950/80 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <Link href="/" className="text-slate-400 hover:text-white transition-colors">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div className="flex items-center gap-3">
              <Brain className="text-indigo-500 w-7 h-7" />
              <span className="text-lg font-black bg-gradient-to-r from-indigo-400 to-emerald-400 bg-clip-text text-transparent">
                NeuroArt Gallery
              </span>
            </div>
          </div>
          <div className="flex items-center gap-4">
            {address && (
              <span className="text-sm text-indigo-400 font-semibold hidden md:block">
                {balance ? `${Number(balance.formatted).toFixed(2)} $NEURO` : '0.00 $NEURO'}
              </span>
            )}
            <ConnectKitButton />
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-6 py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-10"
        >
          <h1 className="text-4xl font-black mb-2">Obras Tokenizadas</h1>
          <p className="text-slate-400">
            Adquira frações de obras de artistas neurodivergentes. Cada compra financia pesquisa DeSci.
          </p>
        </motion.div>

        <motion.div
          variants={{ hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.1 } } }}
          initial="hidden"
          animate="show"
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"
        >
          {artworks.map((art) => (
            <ArtCard key={art.obraId} art={art} />
          ))}
        </motion.div>
      </div>

      <footer className="border-t border-slate-800 mt-20 py-8 text-center text-slate-500 text-sm">
        <p>NeuroArt DApp © 2026 · Tales Hack & Prof. Alexandre de Souza Fortis · Base L2</p>
      </footer>
    </main>
  )
}
