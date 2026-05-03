'use client'

import { motion } from 'framer-motion'
import { ConnectKitButton } from 'connectkit'
import { useAccount } from 'wagmi'
import { Brain, Zap, FlaskConical, ArrowRight } from 'lucide-react'

export default function Home() {
  const { address, isConnected } = useAccount()

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-950 via-indigo-950/20 to-slate-950 text-white">

      {/* Header */}
      <header className="border-b border-slate-800 bg-slate-950/80 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center gap-3"
          >
            <Brain className="text-indigo-500 w-8 h-8" />
            <span className="text-xl font-black bg-gradient-to-r from-indigo-400 to-emerald-400 bg-clip-text text-transparent">
              NeuroArt DApp
            </span>
          </motion.div>
          <ConnectKitButton />
        </div>
      </header>

      {/* Hero */}
      <section className="max-w-7xl mx-auto px-6 py-32 text-center">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
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
          <div className="flex gap-4 justify-center flex-wrap">
            <motion.a
              href="/gallery"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="px-8 py-4 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-xl font-bold flex items-center gap-2 hover:from-indigo-500 hover:to-purple-500 transition-all"
            >
              Ver Galeria <ArrowRight className="w-5 h-5" />
            </motion.a>
            <motion.a
              href="/dashboard"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="px-8 py-4 border border-slate-700 rounded-xl font-bold hover:border-indigo-500 transition-all"
            >
              Dashboard
            </motion.a>
          </div>
        </motion.div>
      </section>

      {/* Cards dos pilares reais do projeto */}
      <section className="max-w-7xl mx-auto px-6 py-16">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            {
              icon: <Brain className="w-8 h-8 text-indigo-400" />,
              title: 'BCI & Neuroplasticidade',
              desc: 'Interfaces cérebro-computador capturam estados de hiperfoco e fluxo criativo, gerando metadados únicos para cada obra tokenizada.',
            },
            {
              icon: <Zap className="w-8 h-8 text-emerald-400" />,
              title: 'Tokenização Fracionada',
              desc: 'ERC20 Vault com Threshold Redemption. Consolide 100% das frações de uma obra e resgate o ativo físico — queima os tokens, entrega a obra.',
            },
            {
              icon: <FlaskConical className="w-8 h-8 text-purple-400" />,
              title: 'DeSci Aplicada',
              desc: 'Cada transação no marketplace destina recursos ao Fundo de Pesquisa NeuroArt, financiando Jiu-Jitsu, BCI e protocolos não medicamentosos.',
            },
          ].map((card, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.15 }}
              className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 hover:border-indigo-500/50 transition-all"
            >
              <div className="mb-4">{card.icon}</div>
              <h3 className="text-lg font-bold mb-2">{card.title}</h3>
              <p className="text-slate-400 text-sm leading-relaxed">{card.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Tokenomics resumido */}
      <section className="max-w-7xl mx-auto px-6 py-16">
        <div className="border border-slate-800 rounded-2xl p-8 bg-slate-900/40">
          <h2 className="text-2xl font-black mb-6 text-center">Tokenomics <span className="text-indigo-400">$NEURO</span></h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
            {[
              { label: 'Venda Pública / Liquidez DApp', pct: '70%', tokens: '7.000.000', color: 'text-emerald-400' },
              { label: 'Tales Hack — Fundador', pct: '15%', tokens: '1.500.000', color: 'text-indigo-400' },
              { label: 'Prof. Alexandre Fortis — Co-fundador', pct: '15%', tokens: '1.500.000', color: 'text-purple-400' },
            ].map((item, i) => (
              <div key={i} className="bg-slate-950/60 rounded-xl p-4 border border-slate-800">
                <div className={`text-3xl font-black ${item.color} mb-1`}>{item.pct}</div>
                <div className="text-slate-300 font-semibold text-sm mb-1">{item.tokens} NEURO</div>
                <div className="text-slate-500 text-xs">{item.label}</div>
              </div>
            ))}
          </div>
          <p className="text-center text-slate-500 text-xs mt-4">Supply total: 10.000.000 $NEURO · Burn deflacionário de 1% nas taxas do marketplace</p>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-800 mt-20 py-8 text-center text-slate-500 text-sm">
        <p>NeuroArt DApp © 2026 · Tales Hack & Prof. Alexandre de Souza Fortis · Base L2 · Florianópolis/SC</p>
      </footer>
    </main>
  )
}
