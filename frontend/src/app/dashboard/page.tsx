'use client'

import { motion } from 'framer-motion'
import { useState, useEffect } from 'react'
import { WalletButton } from '@/components/WalletButton'
import { useAccount, useBalance } from 'wagmi'
import { Brain, ArrowLeft, Wallet, ImageIcon, FlaskConical, TrendingUp, Shield } from 'lucide-react'
import Link from 'next/link'
import { isFounder } from '@/lib/constants'

const NEURO_TOKEN_ADDRESS = (process.env.NEXT_PUBLIC_NEURO_TOKEN_ADDRESS || '0x0000000000000000000000000000000000000000') as `0x${string}`



export default function DashboardPage() {
  const { address, isConnected } = useAccount()
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])
  const { data: balance } = useBalance({
    address,
    token: NEURO_TOKEN_ADDRESS,
  })

  const neuroBalance = isConnected && balance ? Number(balance.formatted).toFixed(2) : '—'

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-950 via-indigo-950/20 to-slate-950 text-white">

      {/* Header */}
      <header className="border-b border-slate-800 bg-slate-950/80 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <Link href="/" className="text-slate-400 hover:text-white transition-colors">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div className="flex items-center gap-3">
              <Brain className="text-indigo-500 w-7 h-7" />
              <span className="text-lg font-black bg-gradient-to-r from-indigo-400 to-emerald-400 bg-clip-text text-transparent">
                NeuroArt Dashboard
              </span>
            </div>
          </div>
          {address && isFounder(address) && (
              <Link href="/admin" className="flex items-center gap-2 px-4 py-2 bg-indigo-600/20 border border-indigo-500/40 text-indigo-400 rounded-xl text-sm font-semibold hover:bg-indigo-600/30 transition-all">
                <Shield className="w-4 h-4" /> Painel Admin
              </Link>
            )}
            <WalletButton />
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-6 py-10 space-y-8">

        {/* Aviso se não conectado */}
        {!isConnected && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="border border-indigo-500/40 bg-indigo-500/10 rounded-2xl p-6 text-center"
          >
            <p className="text-indigo-300 font-medium mb-3">Conecte sua carteira para ver seus ativos</p>
            {address && isFounder(address) && (
              <Link href="/admin" className="flex items-center gap-2 px-4 py-2 bg-indigo-600/20 border border-indigo-500/40 text-indigo-400 rounded-xl text-sm font-semibold hover:bg-indigo-600/30 transition-all">
                <Shield className="w-4 h-4" /> Painel Admin
              </Link>
            )}
            <WalletButton />
          </motion.div>
        )}

        {/* Cards de métricas */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"
        >
          {[
            {
              icon: <Wallet className="w-6 h-6 text-indigo-400" />,
              label: 'Saldo $NEURO',
              value: isConnected ? `${neuroBalance} NEURO` : 'Conecte a carteira',
              sub: 'Token de governança',
              color: 'border-indigo-500/30',
            },
            {
              icon: <ImageIcon className="w-6 h-6 text-emerald-400" />,
              label: 'Fracoes em Carteira',
              value: isConnected ? '0 obras' : '—',
              sub: 'Adquira na galeria',
              color: 'border-emerald-500/30',
            },
            {
              icon: <TrendingUp className="w-6 h-6 text-purple-400" />,
              label: 'Valor em Portfolio',
              value: isConnected ? '0 $NEURO' : '—',
              sub: 'Estimativa atual',
              color: 'border-purple-500/30',
            },
            {
              icon: <FlaskConical className="w-6 h-6 text-amber-400" />,
              label: 'Pesquisas Financiadas',
              value: 'Em breve',
              sub: 'Fundo DeSci ativo',
              color: 'border-amber-500/30',
            },
          ].map((card, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className={`bg-slate-900/60 border ${card.color} rounded-2xl p-5`}
            >
              <div className="flex items-center gap-3 mb-3">
                {card.icon}
                <span className="text-slate-400 text-sm">{card.label}</span>
              </div>
              <div className="text-xl font-black text-white mb-1">{card.value}</div>
              <div className="text-slate-500 text-xs">{card.sub}</div>
            </motion.div>
          ))}
        </motion.div>

        {/* Minhas Frações */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6"
        >
          <h2 className="text-xl font-black mb-5 flex items-center gap-2">
            <ImageIcon className="w-5 h-5 text-emerald-400" />
            Minhas Frações
          </h2>
          {!isConnected ? (
            <p className="text-slate-500 text-sm text-center py-8">Conecte sua carteira para ver suas frações.</p>
          ) : (
            <div className="text-center py-8">
              <p className="text-slate-500 text-sm mb-4">Suas frações aparecerão aqui após adquirir obras na galeria.</p>
              <Link href="/gallery" className="px-6 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-bold hover:bg-indigo-500 transition-all">
                Ver Galeria
              </Link>
            </div>
          )}
        </motion.div>

        {/* Pesquisas Financiadas */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6"
        >
          <h2 className="text-xl font-black mb-5 flex items-center gap-2">
            <FlaskConical className="w-5 h-5 text-purple-400" />
            Pesquisas Financiadas pelo Fundo DeSci
          </h2>
          <div className="text-center py-8">
            <p className="text-slate-500 text-sm">Os editais de pesquisa serao publicados na Fase 2 do projeto.</p>
            <p className="text-slate-600 text-xs mt-2">Previsto para Q1 2027</p>
          </div>
        </motion.div>

                {/* Fundadores */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6"
        >
          <h2 className="text-xl font-black mb-5">Responsáveis pelo Protocolo</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[
              { nome: 'Tales Hack', papel: 'Fundador', alocacao: '15% — 1.500.000 $NEURO', cor: 'text-indigo-400', borda: 'border-indigo-500/30' },
              { nome: 'Prof. Alexandre de Souza Fortis', papel: 'Co-fundador', alocacao: '15% — 1.500.000 $NEURO', cor: 'text-emerald-400', borda: 'border-emerald-500/30' },
            ].map((f, i) => (
              <div key={i} className={`p-4 bg-slate-950/40 border ${f.borda} rounded-xl`}>
                <div className={`font-black text-lg ${f.cor}`}>{f.nome}</div>
                <div className="text-slate-400 text-sm mt-1">{f.papel}</div>
                <div className="text-slate-500 text-xs mt-2 font-mono">{f.alocacao}</div>
              </div>
            ))}
          </div>
        </motion.div>

      </div>

      <footer className="border-t border-slate-800 mt-10 py-8 text-center text-slate-500 text-sm">
        <p>NeuroArt DApp © 2026 · Tales Hack & Prof. Alexandre de Souza Fortis · Base L2 · Porto Alegre/RS</p>
      </footer>
    </main>
  )
}
