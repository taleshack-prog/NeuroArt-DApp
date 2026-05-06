'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { WalletButton } from '@/components/WalletButton'
import { useAccount, useWriteContract, useWaitForTransactionReceipt } from 'wagmi'
import { Brain, ArrowLeft, Shield, CheckCircle, XCircle, Clock, Zap, Eye } from 'lucide-react'
import Link from 'next/link'
import { isFounder, CONTRACTS, FACTORY_ABI } from '@/lib/constants'
import type { ArtworkSubmission } from '@/types'

// Obras mockadas simulando submissões de artistas
const MOCK_SUBMISSIONS: ArtworkSubmission[] = [
  {
    id: '1',
    artistName: 'Maria Silva',
    artistWallet: '0x1234567890123456789012345678901234567890',
    title: 'Hiperfoco #001',
    description: 'Obra criada durante estado de hiperfoco intenso. Representa o fluxo neural durante criação artística com TDAH.',
    neurotipo: 'TDAH',
    estadoCognitivo: 'Hiperfoco',
    totalFractions: 100000,
    imageUrl: 'https://placehold.co/400x400/0f172a/6366f1?text=Hiperfoco+001',
    status: 'pending',
    submittedAt: '2026-05-01T10:00:00Z',
  },
  {
    id: '2',
    artistName: 'João Neuro',
    artistWallet: '0xabcdefabcdefabcdefabcdefabcdefabcdefabcd',
    title: 'Ondas Theta #002',
    description: 'Visualização de ondas cerebrais theta durante meditação profunda. Artista com TEA.',
    neurotipo: 'TEA',
    estadoCognitivo: 'Estado de Fluxo',
    totalFractions: 50000,
    imageUrl: 'https://placehold.co/400x400/0f172a/10b981?text=Ondas+Theta+002',
    status: 'pending',
    submittedAt: '2026-05-02T14:30:00Z',
  },
  {
    id: '3',
    artistName: 'Ana Fortis',
    artistWallet: '0x9999999999999999999999999999999999999999',
    title: 'Dislexia Visual #003',
    description: 'Arte que transforma a percepção disléxica em padrões visuais únicos e poderosos.',
    neurotipo: 'Dislexia',
    estadoCognitivo: 'Divergência Criativa',
    totalFractions: 200000,
    imageUrl: 'https://placehold.co/400x400/0f172a/a855f7?text=Dislexia+Visual+003',
    status: 'approved',
    submittedAt: '2026-04-30T09:00:00Z',
    approvedAt: '2026-05-01T11:00:00Z',
  },
]

const statusConfig = {
  pending:   { label: 'Pendente',    color: 'text-amber-400',  bg: 'bg-amber-500/10  border-amber-500/30',  icon: <Clock className="w-4 h-4" /> },
  approved:  { label: 'Aprovada',    color: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/30', icon: <CheckCircle className="w-4 h-4" /> },
  rejected:  { label: 'Rejeitada',   color: 'text-red-400',    bg: 'bg-red-500/10     border-red-500/30',    icon: <XCircle className="w-4 h-4" /> },
  tokenized: { label: 'Tokenizada',  color: 'text-indigo-400', bg: 'bg-indigo-500/10  border-indigo-500/30', icon: <Zap className="w-4 h-4" /> },
}

function SubmissionCard({
  art,
  onApprove,
  onReject,
  onTokenize,
}: {
  art: ArtworkSubmission
  onApprove: (id: string) => void
  onReject: (id: string) => void
  onTokenize: (art: ArtworkSubmission) => void
}) {
  const s = statusConfig[art.status]
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-slate-900/60 border border-slate-800 rounded-2xl overflow-hidden"
    >
      <div className="flex gap-4 p-5">
        <img src={art.imageUrl} alt={art.title}
          className="w-24 h-24 rounded-xl object-cover shrink-0" />
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2 flex-wrap">
            <div>
              <h3 className="font-bold text-white text-lg">{art.title}</h3>
              <p className="text-slate-400 text-sm">por {art.artistName}</p>
            </div>
            <span className={`flex items-center gap-1.5 px-3 py-1 rounded-full border text-xs font-medium ${s.bg} ${s.color}`}>
              {s.icon} {s.label}
            </span>
          </div>
          <p className="text-slate-500 text-sm mt-2 line-clamp-2">{art.description}</p>
          <div className="flex flex-wrap gap-2 mt-3">
            <span className="px-2 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/30 text-indigo-400 text-xs">{art.neurotipo}</span>
            <span className="px-2 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs">{art.estadoCognitivo}</span>
            <span className="px-2 py-1 rounded-full bg-slate-800 border border-slate-700 text-slate-400 text-xs">{art.totalFractions.toLocaleString()} frações</span>
          </div>
          <p className="text-slate-600 text-xs mt-2 font-mono truncate">Artista: {art.artistWallet}</p>
        </div>
      </div>

      {/* Ações dos fundadores */}
      <div className="border-t border-slate-800 px-5 py-3 flex gap-3 flex-wrap">
        {art.status === 'pending' && (
          <>
            <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
              onClick={() => onApprove(art.id)}
              className="flex items-center gap-2 px-4 py-2 bg-emerald-600/20 border border-emerald-500/40 text-emerald-400 rounded-xl text-sm font-semibold hover:bg-emerald-600/30 transition-all">
              <CheckCircle className="w-4 h-4" /> Aprovar
            </motion.button>
            <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
              onClick={() => onReject(art.id)}
              className="flex items-center gap-2 px-4 py-2 bg-red-600/20 border border-red-500/40 text-red-400 rounded-xl text-sm font-semibold hover:bg-red-600/30 transition-all">
              <XCircle className="w-4 h-4" /> Rejeitar
            </motion.button>
          </>
        )}
        {art.status === 'approved' && (
          <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
            onClick={() => onTokenize(art)}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600/20 border border-indigo-500/40 text-indigo-400 rounded-xl text-sm font-semibold hover:bg-indigo-600/30 transition-all">
            <Zap className="w-4 h-4" /> Tokenizar na Base Sepolia
          </motion.button>
        )}
        {art.status === 'tokenized' && art.txHash && (
          <a href={`https://sepolia.basescan.org/tx/${art.txHash}`} target="_blank" rel="noopener noreferrer"
            className="flex items-center gap-2 px-4 py-2 bg-slate-800 border border-slate-700 text-slate-400 rounded-xl text-sm hover:border-indigo-500 transition-all">
            <Eye className="w-4 h-4" /> Ver no BaseScan
          </a>
        )}
      </div>
    </motion.div>
  )
}

export default function AdminPage() {
  const { address, isConnected } = useAccount()
  const [submissions, setSubmissions] = useState<ArtworkSubmission[]>(MOCK_SUBMISSIONS)
  const [filter, setFilter] = useState<'all' | ArtworkSubmission['status']>('all')
  const [tokenizing, setTokenizing] = useState<string | null>(null)

  const { writeContract, data: txHash } = useWriteContract()
  const { isSuccess } = useWaitForTransactionReceipt({ hash: txHash })

  const founderAccess = isConnected && address && isFounder(address)

  const filtered = filter === 'all' ? submissions : submissions.filter(s => s.status === filter)

  const counts = {
    all:       submissions.length,
    pending:   submissions.filter(s => s.status === 'pending').length,
    approved:  submissions.filter(s => s.status === 'approved').length,
    tokenized: submissions.filter(s => s.status === 'tokenized').length,
    rejected:  submissions.filter(s => s.status === 'rejected').length,
  }

  function handleApprove(id: string) {
    setSubmissions(prev => prev.map(s =>
      s.id === id ? { ...s, status: 'approved', approvedAt: new Date().toISOString() } : s
    ))
  }

  function handleReject(id: string) {
    setSubmissions(prev => prev.map(s =>
      s.id === id ? { ...s, status: 'rejected' } : s
    ))
  }

  async function handleTokenize(art: ArtworkSubmission) {
    setTokenizing(art.id)
    try {
      writeContract({
        address: CONTRACTS.VAULT_FACTORY,
        abi: FACTORY_ABI,
        functionName: 'createVault',
        args: [
          BigInt(art.id),
          `ipfs://pending-${art.id}`,
          art.artistWallet as `0x${string}`,
          BigInt(art.totalFractions),
        ],
      })
    } catch (e) {
      console.error(e)
      setTokenizing(null)
    }
  }

  useEffect(() => {
    if (isSuccess && tokenizing) {
      setSubmissions(prev => prev.map(s =>
        s.id === tokenizing ? { ...s, status: 'tokenized', txHash } : s
      ))
      setTokenizing(null)
    }
  }, [isSuccess, tokenizing, txHash])

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-950 via-indigo-950/20 to-slate-950 text-white">
      <header className="border-b border-slate-800 bg-slate-950/80 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <Link href="/" className="text-slate-400 hover:text-white transition-colors">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div className="flex items-center gap-3">
              <Shield className="text-indigo-500 w-7 h-7" />
              <span className="text-lg font-black bg-gradient-to-r from-indigo-400 to-emerald-400 bg-clip-text text-transparent">
                NeuroArt Admin
              </span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {founderAccess && (
              <span className="hidden md:flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-semibold">
                <CheckCircle className="w-3 h-3" /> Fundador verificado
              </span>
            )}
            <WalletButton />
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-6 py-10">

        {/* Acesso negado */}
        {!isConnected && (
          <div className="text-center py-32">
            <Shield className="w-16 h-16 text-slate-700 mx-auto mb-4" />
            <h2 className="text-2xl font-black text-slate-400 mb-2">Área Restrita</h2>
            <p className="text-slate-600 mb-6">Conecte a carteira dos fundadores para acessar</p>
            <WalletButton />
          </div>
        )}

        {isConnected && !founderAccess && (
          <div className="text-center py-32">
            <XCircle className="w-16 h-16 text-red-500/50 mx-auto mb-4" />
            <h2 className="text-2xl font-black text-red-400 mb-2">Acesso Negado</h2>
            <p className="text-slate-500">Esta carteira não é um fundador autorizado.</p>
            <p className="text-slate-600 text-sm mt-2 font-mono">{address}</p>
          </div>
        )}

        {founderAccess && (
          <>
            {/* Métricas */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
              {[
                { label: 'Pendentes',   value: counts.pending,   color: 'text-amber-400' },
                { label: 'Aprovadas',   value: counts.approved,  color: 'text-emerald-400' },
                { label: 'Tokenizadas', value: counts.tokenized, color: 'text-indigo-400' },
                { label: 'Rejeitadas',  value: counts.rejected,  color: 'text-red-400' },
              ].map((m, i) => (
                <div key={i} className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4 text-center">
                  <div className={`text-3xl font-black ${m.color}`}>{m.value}</div>
                  <div className="text-slate-500 text-sm mt-1">{m.label}</div>
                </div>
              ))}
            </div>

            {/* Filtros */}
            <div className="flex gap-2 flex-wrap mb-6">
              {(['all', 'pending', 'approved', 'tokenized', 'rejected'] as const).map(f => (
                <button key={f} onClick={() => setFilter(f)}
                  className={`px-4 py-2 rounded-xl text-sm font-semibold border transition-all ${
                    filter === f
                      ? 'bg-indigo-600 border-indigo-500 text-white'
                      : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-indigo-500'
                  }`}>
                  {f === 'all' ? `Todas (${counts.all})` : `${statusConfig[f].label} (${counts[f]})`}
                </button>
              ))}
            </div>

            {/* Lista de submissões */}
            <div className="space-y-4">
              {filtered.length === 0 && (
                <div className="text-center py-16 text-slate-600">
                  Nenhuma submissão nesta categoria.
                </div>
              )}
              {filtered.map(art => (
                <SubmissionCard
                  key={art.id}
                  art={art}
                  onApprove={handleApprove}
                  onReject={handleReject}
                  onTokenize={handleTokenize}
                />
              ))}
            </div>
          </>
        )}
      </div>

      <footer className="border-t border-slate-800 mt-20 py-8 text-center text-slate-500 text-sm">
        <p>NeuroArt DApp © 2026 · Painel exclusivo para fundadores · Base L2</p>
      </footer>
    </main>
  )
}
