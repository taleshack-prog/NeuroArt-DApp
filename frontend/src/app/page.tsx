'use client'

import { motion } from 'framer-motion'
import { WalletButton } from '@/components/WalletButton'
import { useAccount } from 'wagmi'
import { Brain, Zap, FlaskConical, ArrowRight, Upload, LayoutDashboard } from 'lucide-react'
import Link from 'next/link'
import { useState, useEffect } from 'react'
import { isFounder } from '@/lib/constants'

export default function Home() {
  const { address, isConnected } = useAccount()
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])
  const founder = mounted && isConnected && address && isFounder(address)

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-950 via-indigo-950/20 to-slate-950 text-white">

      {/* Header */}
      <header className="border-b border-slate-800 bg-slate-950/80 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}
            className="flex items-center gap-3">
            <Brain className="text-indigo-500 w-8 h-8" />
            <span className="text-xl font-black bg-gradient-to-r from-indigo-400 to-emerald-400 bg-clip-text text-transparent">
              NeuroArt DApp
            </span>
          </motion.div>
          <div className="flex items-center gap-3">
            <Link href="/gallery" className="hidden md:block text-slate-400 hover:text-white text-sm font-medium transition-colors">Galeria</Link>
            <Link href="/blog" className="hidden md:block text-slate-400 hover:text-white text-sm font-medium transition-colors">Blog</Link>
            <Link href="/research" className="hidden md:block text-slate-400 hover:text-white text-sm font-medium transition-colors">Pesquisa</Link>
            <Link href="/whitepaper" className="hidden md:block text-slate-400 hover:text-white text-sm font-medium transition-colors">Whitepaper</Link>
            <Link href="/submit" className="hidden md:flex items-center gap-1.5 text-sm font-medium text-indigo-400 hover:text-indigo-300 transition-colors">
              <Upload className="w-4 h-4" /> Submeter Obra
            </Link>
            <Link href="/dashboard" className="hidden md:flex items-center gap-1.5 text-sm font-medium text-slate-400 hover:text-white transition-colors">
              <LayoutDashboard className="w-4 h-4" /> Dashboard
            </Link>
            <WalletButton />
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="max-w-7xl mx-auto px-6 py-32 text-center">
        <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }}>
          <span className="inline-block px-4 py-1 rounded-full border border-indigo-500/40 bg-indigo-500/10 text-indigo-400 text-sm font-medium mb-6">
            Base L2 · DeSci · Neurodiversidade
          </span>
          <h1 className="text-5xl md:text-7xl font-black mb-6 leading-tight">
            Arte que{' '}
            <span className="bg-gradient-to-r from-indigo-400 via-purple-400 to-emerald-400 bg-clip-text text-transparent">
              financia ciência
            </span>
          </h1>
          <p className="text-slate-400 text-xl max-w-2xl mx-auto mb-4">
            Tokenização fracionada de obras de artistas neurodivergentes.
            Cada fração adquirida financia pesquisas bioinspiradas na rede Base.
          </p>
          <p className="text-slate-500 text-sm mb-10">
            Fundado por <span className="text-indigo-400 font-semibold">Tales Hack</span> & <span className="text-emerald-400 font-semibold">Prof. Alexandre de Souza Fortis</span>
          </p>
          <div className="flex gap-4 justify-center flex-wrap items-center">
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Link href="/gallery"
                className="px-8 py-4 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-xl font-bold flex items-center gap-2 hover:from-indigo-500 hover:to-purple-500 transition-all">
                Ver Galeria <ArrowRight className="w-5 h-5" />
              </Link>
            </motion.div>
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Link href="/submit"
                className="px-8 py-4 bg-emerald-600/20 border border-emerald-500/40 text-emerald-400 rounded-xl font-bold flex items-center gap-2 hover:bg-emerald-600/30 transition-all">
                <Upload className="w-5 h-5" /> Submeter Obra
              </Link>
            </motion.div>
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Link href="/dashboard"
                className="px-8 py-4 border border-slate-700 rounded-xl font-bold hover:border-indigo-500 transition-all text-white">
                Dashboard
              </Link>
            </motion.div>
          </div>
        </motion.div>
      </section>

      {/* Cards dos pilares */}
      <section className="max-w-7xl mx-auto px-6 py-16">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            { icon: <Brain className="w-8 h-8 text-indigo-400" />, title: 'BCI & Neuroplasticidade', desc: 'Interfaces cérebro-computador capturam estados de hiperfoco e fluxo criativo, gerando metadados únicos para cada obra tokenizada.' },
            { icon: <Zap className="w-8 h-8 text-emerald-400" />, title: 'Tokenização Fracionada', desc: 'ERC20 Vault com Threshold Redemption. Consolide 100% das frações de uma obra e resgate o ativo físico — queima os tokens, entrega a obra.' },
            { icon: <FlaskConical className="w-8 h-8 text-purple-400" />, title: 'DeSci Aplicada', desc: 'Cada transação no marketplace destina recursos ao Fundo de Pesquisa NeuroArt, financiando Jiu-Jitsu, BCI e protocolos não medicamentosos.' },
          ].map((card, i) => (
            <motion.div key={i} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.15 }}
              className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 hover:border-indigo-500/50 transition-all">
              <div className="mb-4">{card.icon}</div>
              <h3 className="text-lg font-bold mb-2">{card.title}</h3>
              <p className="text-slate-400 text-sm leading-relaxed">{card.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Whitepaper CTA */}
      <section className="max-w-7xl mx-auto px-6 py-16">
        <div className="border border-indigo-500/20 rounded-2xl p-8 bg-indigo-500/5 text-center">
          <div className="w-16 h-16 rounded-2xl bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center mx-auto mb-6">
            <Brain className="w-8 h-8 text-indigo-400" />
          </div>
          <h2 className="text-2xl font-black mb-3">Entenda a visao do projeto</h2>
          <p className="text-slate-400 mb-6 max-w-xl mx-auto">
            Antes de investir, leia nosso Whitepaper. Ele explica a filosofia, a ciencia e a economia por tras do NeuroArt DApp.
          </p>
          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} className="inline-block">
            <Link href="/whitepaper" className="px-8 py-4 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-xl font-bold flex items-center gap-2 hover:from-indigo-500 hover:to-purple-500 transition-all">
              Ler o Whitepaper
            </Link>
          </motion.div>
        </div>
      </section>

            {/* CTA Artistas */}
      <section className="max-w-7xl mx-auto px-6 py-16">
        <div className="border border-emerald-500/20 rounded-2xl p-8 bg-emerald-500/5 text-center">
          <Upload className="w-12 h-12 text-emerald-400 mx-auto mb-4" />
          <h2 className="text-2xl font-black mb-3">Você é um artista neurodivergente?</h2>
          <p className="text-slate-400 mb-6 max-w-xl mx-auto">Submeta sua obra para tokenização. Os fundadores avaliam cada submissão e, se aprovada, sua obra é fracionada e disponibilizada para investidores na Base Sepolia.</p>
          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} className="inline-block">
            <Link href="/submit"
              className="px-8 py-4 bg-gradient-to-r from-emerald-600 to-teal-600 rounded-xl font-bold flex items-center gap-2 hover:from-emerald-500 hover:to-teal-500 transition-all">
              <Upload className="w-5 h-5" /> Submeter Minha Obra
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-800 mt-20 py-8 text-center text-slate-500 text-sm">
        <p>NeuroArt DApp © 2026 · Tales Hack & Prof. Alexandre de Souza Fortis · Base L2 · Florianópolis/SC</p>
      </footer>
    </main>
  )
}
