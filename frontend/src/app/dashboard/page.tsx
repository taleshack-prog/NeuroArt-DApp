'use client'

import { motion } from 'framer-motion'
import { ConnectKitButton } from 'connectkit'
import { useAccount, useBalance } from 'wagmi'
import { Brain, ArrowLeft, Wallet, ImageIcon, FlaskConical, TrendingUp } from 'lucide-react'
import Link from 'next/link'

const NEURO_TOKEN_ADDRESS = (process.env.NEXT_PUBLIC_NEURO_TOKEN_ADDRESS || '0x0000000000000000000000000000000000000000') as `0x${string}`

const mockFracoes = [
  { obra: 'Neuro-Sinfonia #001', fracoes: '12.500', percentual: '1.25%', valor: '625 $NEURO', status: 'Ativo' },
  { obra: 'Ondas Alpha #002', fracoes: '8.000', percentual: '0.80%', valor: '640 $NEURO', status: 'Ativo' },
  { obra: 'NeuroGenesis #003', fracoes: '25.000', percentual: '2.50%', valor: '3.000 $NEURO', status: 'Ativo' },
]

const mockPesquisas = [
  { titulo: 'Protocolo BCI-Hiperfoco v1.0', area: 'Brain-Computer Interface', status: 'Em andamento', aporte: '12.000 $NEURO' },
  { titulo: 'Jiu-Jitsu & Controle Inibitório', area: 'Artes Marciais / Neurociência', status: 'Aprovado', aporte: '8.500 $NEURO' },
  { titulo: 'Neuroplasticidade via Arte Digital', area: 'Neuroplasticidade', status: 'Em revisão', aporte: '15.000 $NEURO' },
]

export default function DashboardPage() {
  const { address, isConnected } = useAccount()
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
          <ConnectKitButton />
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
            <ConnectKitButton />
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
              label: 'Frações em Carteira',
              value: isConnected ? '3 obras' : '—',
              sub: '45.500 frações totais',
              color: 'border-emerald-500/30',
            },
            {
              icon: <TrendingUp className="w-6 h-6 text-purple-400" />,
              label: 'Valor em Portfólio',
              value: isConnected ? '4.265 $NEURO' : '—',
              sub: 'Estimativa atual',
              color: 'border-purple-500/30',
            },
            {
              icon: <FlaskConical className="w-6 h-6 text-amber-400" />,
              label: 'Pesquisas Financiadas',
              value: '3 projetos',
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
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-slate-500 border-b border-slate-800">
                  <th className="text-left pb-3 font-medium">Obra</th>
                  <th className="text-right pb-3 font-medium">Frações</th>
                  <th className="text-right pb-3 font-medium">Participação</th>
                  <th className="text-right pb-3 font-medium">Valor Est.</th>
                  <th className="text-right pb-3 font-medium">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/50">
                {mockFracoes.map((row, i) => (
                  <tr key={i} className="hover:bg-slate-800/30 transition-colors">
                    <td className="py-3 text-white font-medium">{row.obra}</td>
                    <td className="py-3 text-right text-slate-300 font-mono">{row.fracoes}</td>
                    <td className="py-3 text-right text-indigo-400 font-semibold">{row.percentual}</td>
                    <td className="py-3 text-right text-emerald-400 font-semibold">{row.valor}</td>
                    <td className="py-3 text-right">
                      <span className="px-2 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs">
                        {row.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
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
          <div className="space-y-4">
            {mockPesquisas.map((p, i) => (
              <div key={i} className="flex items-center justify-between p-4 bg-slate-950/40 border border-slate-800 rounded-xl">
                <div>
                  <div className="font-semibold text-white">{p.titulo}</div>
                  <div className="text-slate-500 text-sm mt-0.5">{p.area}</div>
                </div>
                <div className="text-right ml-4 shrink-0">
                  <div className={`text-xs font-medium px-2 py-1 rounded-full mb-1 ${
                    p.status === 'Em andamento'
                      ? 'bg-indigo-500/10 border border-indigo-500/30 text-indigo-400'
                      : p.status === 'Aprovado'
                      ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-400'
                      : 'bg-amber-500/10 border border-amber-500/30 text-amber-400'
                  }`}>
                    {p.status}
                  </div>
                  <div className="text-purple-400 font-bold text-sm">{p.aporte}</div>
                </div>
              </div>
            ))}
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
        <p>NeuroArt DApp © 2026 · Tales Hack & Prof. Alexandre de Souza Fortis · Base L2 · Florianópolis/SC</p>
      </footer>
    </main>
  )
}
