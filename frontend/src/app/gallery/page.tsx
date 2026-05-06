'use client'

import { motion } from 'framer-motion'
import { WalletButton } from '@/components/WalletButton'
import { useAccount, useBalance } from 'wagmi'
import { Brain, ArrowLeft, Upload } from 'lucide-react'
import Link from 'next/link'
import { useState, useEffect } from 'react'
import { getUSDtoBRL, getETHPrice, calcPrices } from '@/lib/exchange'
import type { ArtworkSubmission } from '@/types'
import { BuyButton } from '@/components/BuyButton'

const NEURO_TOKEN_ADDRESS = (process.env.NEXT_PUBLIC_NEURO_TOKEN_ADDRESS || '0x0000000000000000000000000000000000000000') as `0x${string}`

function ArtCard({ art, usdBRL, ethUSD }: { art: ArtworkSubmission, usdBRL: number, ethUSD: number }) {
  const isTokenized = art.status === 'tokenized'
  const moedaSymbol = art.moeda === 'BRL' ? 'R$' : art.moeda === 'USD' ? 'US$' : 'ETH'

  return (
    <motion.div
      variants={{ hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } }}
      whileHover={{ y: -4 }}
      className="group bg-slate-900/60 border border-slate-800 rounded-2xl hover:border-indigo-500/50 transition-all duration-300"
    >
      <div className="relative">
        <img
          src={art.imageUrl || `https://placehold.co/500x500/0f172a/6366f1?text=${encodeURIComponent(art.title)}`}
          alt={art.title}
          className="w-full object-contain group-hover:scale-105 transition-transform duration-500"
        />
        <div className="absolute top-3 left-3">
          {art.estadoCognitivo && (
            <span className="px-2 py-1 rounded-full bg-slate-950/80 border border-emerald-500/40 text-emerald-400 text-xs font-medium">
              {art.estadoCognitivo}
            </span>
          )}
        </div>
        <div className="absolute top-3 right-3">
          {isTokenized && (
            <span className="px-2 py-1 rounded-full bg-indigo-600/90 text-white text-xs font-bold">
              On-chain
            </span>
          )}
        </div>
      </div>
      <div className="p-5 space-y-4">
        <div>
          <h3 className="font-bold text-white text-lg">{art.title}</h3>
          <p className="text-slate-500 text-sm mt-1">por {art.artistName}</p>
          <p className="text-slate-400 text-xs mt-2 line-clamp-2">{art.description}</p>
        </div>
        <div className="space-y-1">
          <div className="flex justify-between text-xs text-slate-400">
            <span>Frações disponíveis</span>
            <span className="text-indigo-400 font-semibold">100%</span>
          </div>
          <div className="w-full bg-slate-800 rounded-full h-1.5">
            <div className="bg-gradient-to-r from-indigo-500 to-purple-500 h-1.5 rounded-full w-0" />
          </div>
          <div className="text-xs text-slate-600">{art.totalFractions?.toLocaleString()} frações totais</div>
        </div>
        <div className="flex items-center justify-between pt-1">
          <div>
            <div className="text-xs text-slate-500">Valor da obra</div>
            <div className="text-emerald-400 font-bold">
              {moedaSymbol} {Number(art.valorObra || 0).toLocaleString('pt-BR')}
            </div>
            {art.valorObra && art.totalFractions && (() => {
              const p = calcPrices(Number(art.valorObra), art.totalFractions, usdBRL, ethUSD)
              return (
                <div className="mt-1 space-y-0.5">
                  <div className="text-blue-400 text-xs font-semibold">{p.fracaoUSDC} USDC / fração</div>
                  <div className="text-slate-400 text-xs">{p.fracaoETH} ETH / fração</div>
                </div>
              )
            })()}
          </div>
          {isTokenized ? (
            <BuyButton
              obraId={art.id}
              totalFractions={art.totalFractions || 100}
              priceUSDC={11.21}
              priceETH={0.003}
            />
          ) : (
            <span className="px-4 py-2 bg-amber-500/10 border border-amber-500/30 text-amber-400 rounded-xl text-xs">
              Em aprovação
            </span>
          )}
        </div>
        {art.vaultAddress && (
          <a href={`https://sepolia.basescan.org/address/${art.vaultAddress}`}
            target="_blank" rel="noopener noreferrer"
            className="block text-xs text-slate-600 hover:text-indigo-400 transition-colors font-mono truncate">
            Vault: {art.vaultAddress}
          </a>
        )}
      </div>
    </motion.div>
  )
}

export default function GalleryPage() {
  const { address } = useAccount()
  const { data: balance } = useBalance({ address, token: NEURO_TOKEN_ADDRESS })
  const [artworks, setArtworks] = useState<ArtworkSubmission[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'tokenized'>('all')
  const [usdBRL, setUsdBRL] = useState(5.75)
  const [ethUSD, setEthUSD] = useState(2300)

  useEffect(() => {
    getUSDtoBRL().then(setUsdBRL)
    getETHPrice().then(setEthUSD)
  }, [])

  useEffect(() => {
    fetch('/api/submissions')
      .then(r => r.json())
      .then(data => {
        const visible = Array.isArray(data)
          ? data.filter(s => s.status === 'approved' || s.status === 'tokenized')
          : []
        setArtworks(visible)
      })
      .catch(() => setArtworks([]))
      .finally(() => setLoading(false))
  }, [])

  const filtered = filter === 'all' ? artworks : artworks.filter(a => a.status === 'tokenized')
  const tokenizedCount = artworks.filter(a => a.status === 'tokenized').length

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
            <Link href="/submit"
              className="hidden md:flex items-center gap-1.5 px-4 py-2 bg-emerald-600/20 border border-emerald-500/40 text-emerald-400 rounded-xl text-sm font-semibold hover:bg-emerald-600/30 transition-all">
              <Upload className="w-4 h-4" /> Submeter Obra
            </Link>
            <WalletButton />
          </div>
        </div>
      </header>
      <div className="max-w-7xl mx-auto px-6 py-12">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <h1 className="text-4xl font-black mb-2">Obras Tokenizadas</h1>
          <p className="text-slate-400">Adquira frações de obras de artistas neurodivergentes. Cada compra financia pesquisa DeSci na rede Base.</p>
        </motion.div>
        <div className="flex gap-3 mb-8">
          <button onClick={() => setFilter('all')}
            className={`px-4 py-2 rounded-xl text-sm font-semibold border transition-all ${filter === 'all' ? 'bg-indigo-600 border-indigo-500 text-white' : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-indigo-500'}`}>
            Todas ({artworks.length})
          </button>
          <button onClick={() => setFilter('tokenized')}
            className={`px-4 py-2 rounded-xl text-sm font-semibold border transition-all ${filter === 'tokenized' ? 'bg-indigo-600 border-indigo-500 text-white' : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-indigo-500'}`}>
            On-chain ({tokenizedCount})
          </button>
        </div>
        {loading && <div className="text-center py-20 text-slate-500">Carregando obras...</div>}
        {!loading && filtered.length === 0 && (
          <div className="text-center py-20">
            <p className="text-slate-500 mb-4">Nenhuma obra disponível ainda.</p>
            <Link href="/submit" className="px-6 py-3 bg-indigo-600 rounded-xl font-bold text-sm hover:bg-indigo-500 transition-all">
              Seja o primeiro a submeter uma obra
            </Link>
          </div>
        )}
        <motion.div
          variants={{ hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.1 } } }}
          initial="hidden" animate="show"
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"
        >
          {filtered.map(art => <ArtCard key={art.id} art={art} usdBRL={usdBRL} ethUSD={ethUSD} />)}
        </motion.div>
      </div>
      <footer className="border-t border-slate-800 mt-20 py-8 text-center text-slate-500 text-sm">
        <p>NeuroArt DApp © 2026 · Tales Hack & Prof. Alexandre de Souza Fortis · Base L2</p>
      </footer>
    </main>
  )
}
