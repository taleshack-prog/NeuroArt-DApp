'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { WalletButton } from '@/components/WalletButton'
import { useAccount, useWriteContract, useWaitForTransactionReceipt, useBalance } from 'wagmi'
import { Brain, ArrowLeft, Shield, CheckCircle, XCircle, Clock, Zap, Eye, Loader, Users, LayoutDashboard, Gift, DollarSign, Wallet, PenLine, Trash2 } from 'lucide-react'
import Link from 'next/link'
import { isFounder, CONTRACTS, FACTORY_ABI } from '@/lib/constants'
import type { ArtworkSubmission } from '@/types'

const statusConfig = {
  pending:   { label: 'Pendente',   color: 'text-amber-400',   bg: 'bg-amber-500/10  border-amber-500/30',   icon: <Clock className="w-4 h-4" /> },
  approved:  { label: 'Aprovada',   color: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/30', icon: <CheckCircle className="w-4 h-4" /> },
  rejected:  { label: 'Rejeitada',  color: 'text-red-400',     bg: 'bg-red-500/10     border-red-500/30',     icon: <XCircle className="w-4 h-4" /> },
  tokenized: { label: 'Tokenizada', color: 'text-indigo-400',  bg: 'bg-indigo-500/10  border-indigo-500/30',  icon: <Zap className="w-4 h-4" /> },
}

function SubmissionCard({ art, onApprove, onReject, onTokenize, tokenizing }: {
  art: ArtworkSubmission
  onApprove: (id: string) => void
  onReject: (id: string) => void
  onTokenize: (art: ArtworkSubmission) => void
  tokenizing: string | null
}) {
  const s = statusConfig[art.status]
  const isLoading = tokenizing === art.id

  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
      className="bg-slate-900/60 border border-slate-800 rounded-2xl overflow-hidden">
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
            
            <span className="px-2 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs">{art.estadoCognitivo}</span>
            <span className="px-2 py-1 rounded-full bg-slate-800 border border-slate-700 text-slate-400 text-xs">{art.totalFractions?.toLocaleString()} frações</span>
            {art.valorObra && (
              <span className="px-2 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-bold">
                {art.moeda === 'BRL' ? 'R$' : art.moeda === 'USD' ? 'US$' : 'ETH'} {Number(art.valorObra).toLocaleString('pt-BR')}
              </span>
            )}
            {art.precoPorFracao && (
              <span className="px-2 py-1 rounded-full bg-purple-500/10 border border-purple-500/30 text-purple-400 text-xs">
                {art.precoPorFracao} / fração
              </span>
            )}
          </div>
          <p className="text-slate-600 text-xs mt-2 font-mono truncate">Artista: {art.artistWallet}</p>
          {art.ipfsCid && (
            <p className="text-slate-600 text-xs mt-1 font-mono truncate">IPFS: {art.ipfsCid}</p>
          )}
        </div>
      </div>

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
          <motion.button whileHover={{ scale: isLoading ? 1 : 1.03 }} whileTap={{ scale: 0.97 }}
            onClick={() => !isLoading && onTokenize(art)}
            disabled={isLoading}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600/20 border border-indigo-500/40 text-indigo-400 rounded-xl text-sm font-semibold hover:bg-indigo-600/30 transition-all disabled:opacity-50">
            {isLoading ? <Loader className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />}
            {isLoading ? 'Enviando para IPFS...' : 'Tokenizar na Base Sepolia'}
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
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])

  const [submissions, setSubmissions] = useState<ArtworkSubmission[]>([])
  const [filter, setFilter] = useState<'all' | ArtworkSubmission['status']>('all')
  const [activeTab, setActiveTab] = useState<'obras' | 'artistas' | 'airdrop' | 'financeiro' | 'blog'>('obras')
  const DAPP_WALLET = '0xE9eFC721405e1026B1ee91C07B2534e1796632A4' as `0x${string}`
  const USDC_ADDRESS = '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913' as `0x${string}`
  const NEURO_ADDRESS = (process.env.NEXT_PUBLIC_NEURO_TOKEN_ADDRESS || '0x0') as `0x${string}`
  const [posts, setPosts] = useState<any[]>([])
  const [newPost, setNewPost] = useState({ title: '', excerpt: '', content: '', category: 'Novidades NeuroArt', published: true })
  const [savingPost, setSavingPost] = useState(false)
  const [showNewPost, setShowNewPost] = useState(false)
  const [tokenizing, setTokenizing] = useState<string | null>(null)
  const [uploadStatus, setUploadStatus] = useState('')

  const { writeContract, data: txHash } = useWriteContract()
  const { data: ethBalance } = useBalance({ address: DAPP_WALLET })
  const { data: usdcBalance } = useBalance({ address: DAPP_WALLET, token: USDC_ADDRESS })
  const { data: neuroBalance } = useBalance({ address: DAPP_WALLET, token: NEURO_ADDRESS })
  const { isSuccess } = useWaitForTransactionReceipt({ hash: txHash })

  const founderAccess = mounted && isConnected && address && isFounder(address)

  useEffect(() => {
    fetch('/api/submissions')
      .then(r => r.json())
      .then(data => setSubmissions(Array.isArray(data) ? data : []))
      .catch(() => setSubmissions([]))
    fetch('/api/posts')
      .then(r => r.json())
      .then(data => setPosts(Array.isArray(data) ? data : []))
      .catch(() => {})
  }, [])

  useEffect(() => {
    if (isSuccess && tokenizing) {
      setSubmissions(prev => prev.map(s =>
        s.id === tokenizing ? { ...s, status: 'tokenized', txHash } : s
      ))
      fetch(`/api/submissions/${tokenizing}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'tokenized', txHash }),
      })
      setTokenizing(null)
      setUploadStatus('')
    }
  }, [isSuccess, tokenizing, txHash])

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
    fetch(`/api/submissions/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'approved', approvedAt: new Date().toISOString() }),
    })
  }

  function handleReject(id: string) {
    setSubmissions(prev => prev.map(s =>
      s.id === id ? { ...s, status: 'rejected' } : s
    ))
    fetch(`/api/submissions/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'rejected' }),
    })
  }

  async function handleTokenize(art: ArtworkSubmission) {
    setTokenizing(art.id)
    setUploadStatus('Enviando imagem para IPFS...')
    try {
      const ipfsRes = await fetch('/api/ipfs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageBase64: art.imageUrl,
          metadata: {
            name: art.title,
            description: art.description,
            estadoCognitivo: art.estadoCognitivo,
            artistName: art.artistName,
            artistWallet: art.artistWallet,
            totalFractions: art.totalFractions,
            valorObra: art.valorObra || '0',
            moeda: art.moeda || 'BRL',
            precoPorFracao: art.precoPorFracao || '',
            obraId: art.id,
          },
        }),
      })

      const ipfsData = await ipfsRes.json()
      if (!ipfsRes.ok) {
        console.error('IPFS error:', ipfsData.error)
        setUploadStatus('Erro no IPFS: ' + ipfsData.error)
        setTokenizing(null)
        return
      }

      setUploadStatus('IPFS OK! Abrindo MetaMask...')

      await fetch(`/api/submissions/${art.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ipfsCid: ipfsData.metadataCid, imageUrl: ipfsData.imageUrl }),
      })

      setSubmissions(prev => prev.map(s =>
        s.id === art.id ? { ...s, ipfsCid: ipfsData.metadataCid, imageUrl: ipfsData.imageUrl } : s
      ))

      writeContract({
        address: CONTRACTS.VAULT_FACTORY,
        abi: FACTORY_ABI,
        functionName: 'createVault',
        args: [
          BigInt(art.id),
          ipfsData.ipfsHash,
          art.artistWallet as `0x${string}`,
          BigInt(art.totalFractions),
        ],
      })
    } catch (e) {
      console.error(e)
      setUploadStatus('Erro: ' + String(e))
      setTokenizing(null)
    }
  }

  // Calcula lista de artistas a partir das submissoes
  const artistasMap = new Map<string, { name: string, wallet: string, obras: number, aprovadas: number, tokenizadas: number }>()
  submissions.forEach(s => {
    const key = s.artistWallet || s.artistName
    const existing = artistasMap.get(key) || { name: s.artistName, wallet: s.artistWallet || '', obras: 0, aprovadas: 0, tokenizadas: 0 }
    existing.obras++
    if (s.status === 'approved') existing.aprovadas++
    if (s.status === 'tokenized') existing.tokenizadas++
    artistasMap.set(key, existing)
  })
  const artistas = Array.from(artistasMap.values())

  // Calcula airdrop proporcional
  const totalAprovadas = artistas.reduce((acc, a) => acc + a.tokenizadas, 0)
  const AIRDROP_POOL = 250000

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

      {/* Abas de navegacao */}
      {founderAccess && (
        <div className="border-b border-slate-800 bg-slate-950/50">
          <div className="max-w-7xl mx-auto px-6">
            <div className="flex gap-1">
              {[
                { id: 'obras', label: 'Obras', icon: <LayoutDashboard className="w-4 h-4" /> },
                { id: 'artistas', label: 'Artistas', icon: <Users className="w-4 h-4" /> },
                { id: 'airdrop', label: 'Airdrop', icon: <Gift className="w-4 h-4" /> },
                { id: 'financeiro', label: 'Financeiro', icon: <DollarSign className="w-4 h-4" /> },
                { id: 'blog', label: 'Blog', icon: <PenLine className="w-4 h-4" /> },
              ].map(tab => (
                <button key={tab.id} onClick={() => setActiveTab(tab.id as any)}
                  className={`flex items-center gap-2 px-5 py-3 text-sm font-semibold border-b-2 transition-all ${
                    activeTab === tab.id
                      ? 'border-indigo-500 text-indigo-400'
                      : 'border-transparent text-slate-500 hover:text-slate-300'
                  }`}>
                  {tab.icon} {tab.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-6 py-10">
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
            {uploadStatus && (
              <div className="mb-4 px-4 py-3 bg-indigo-500/10 border border-indigo-500/30 rounded-xl text-indigo-300 text-sm flex items-center gap-2">
                <Loader className="w-4 h-4 animate-spin" /> {uploadStatus}
              </div>
            )}

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

            {activeTab === 'obras' && (
              <div className="space-y-4">
                {filtered.length === 0 && (
                  <div className="text-center py-16 text-slate-600">Nenhuma submissão nesta categoria.</div>
                )}
                {filtered.map(art => (
                  <SubmissionCard key={art.id} art={art}
                    onApprove={handleApprove}
                    onReject={handleReject}
                    onTokenize={handleTokenize}
                    tokenizing={tokenizing}
                  />
                ))}
              </div>
            )}

            {activeTab === 'artistas' && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                  <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4 text-center">
                    <div className="text-3xl font-black text-indigo-400">{artistas.length}</div>
                    <div className="text-slate-500 text-sm mt-1">Artistas cadastrados</div>
                  </div>
                  <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4 text-center">
                    <div className="text-3xl font-black text-emerald-400">{totalAprovadas}</div>
                    <div className="text-slate-500 text-sm mt-1">Obras tokenizadas</div>
                  </div>
                  <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4 text-center">
                    <div className="text-3xl font-black text-purple-400">{AIRDROP_POOL.toLocaleString()}</div>
                    <div className="text-slate-500 text-sm mt-1">NEURO no pool airdrop</div>
                  </div>
                </div>

                {artistas.length === 0 ? (
                  <div className="text-center py-16 text-slate-600">Nenhum artista cadastrado ainda.</div>
                ) : (
                  <div className="bg-slate-900/60 border border-slate-800 rounded-2xl overflow-hidden">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="bg-slate-900 border-b border-slate-800">
                          <th className="text-left py-3 px-4 text-slate-500 font-medium">Artista</th>
                          <th className="text-left py-3 px-4 text-slate-500 font-medium">Wallet</th>
                          <th className="text-center py-3 px-4 text-slate-500 font-medium">Submetidas</th>
                          <th className="text-center py-3 px-4 text-slate-500 font-medium">Tokenizadas</th>
                          <th className="text-right py-3 px-4 text-slate-500 font-medium">NEURO Airdrop</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800">
                        {artistas.map((a, i) => {
                          const neuroAirdrop = totalAprovadas > 0
                            ? Math.floor((a.tokenizadas / totalAprovadas) * AIRDROP_POOL)
                            : 0
                          return (
                            <tr key={i} className="hover:bg-slate-800/30 transition-colors">
                              <td className="py-3 px-4 text-white font-semibold">{a.name}</td>
                              <td className="py-3 px-4 text-slate-500 font-mono text-xs truncate max-w-32">
                                {a.wallet ? `${a.wallet.slice(0,6)}...${a.wallet.slice(-4)}` : '—'}
                              </td>
                              <td className="py-3 px-4 text-center text-slate-300">{a.obras}</td>
                              <td className="py-3 px-4 text-center text-indigo-400 font-bold">{a.tokenizadas}</td>
                              <td className="py-3 px-4 text-right text-emerald-400 font-bold">
                                {neuroAirdrop > 0 ? neuroAirdrop.toLocaleString() : '—'}
                              </td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'airdrop' && (
              <div className="space-y-6">
                <div className="bg-emerald-950/20 border border-emerald-500/20 rounded-2xl p-6">
                  <h3 className="text-emerald-400 font-black text-xl mb-2">Programa de Airdrop</h3>
                  <p className="text-slate-400 text-sm mb-4">
                    250.000 $NEURO distribuidos proporcionalmente aos artistas com obras tokenizadas entre 06/05/2026 e 06/05/2027.
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-slate-900/60 rounded-xl p-4 text-center">
                      <div className="text-2xl font-black text-emerald-400">250.000</div>
                      <div className="text-slate-500 text-xs mt-1">NEURO no pool</div>
                    </div>
                    <div className="bg-slate-900/60 rounded-xl p-4 text-center">
                      <div className="text-2xl font-black text-indigo-400">{totalAprovadas}</div>
                      <div className="text-slate-500 text-xs mt-1">Obras tokenizadas até agora</div>
                    </div>
                    <div className="bg-slate-900/60 rounded-xl p-4 text-center">
                      <div className="text-2xl font-black text-purple-400">
                        {totalAprovadas > 0 ? Math.floor(AIRDROP_POOL / totalAprovadas).toLocaleString() : '—'}
                      </div>
                      <div className="text-slate-500 text-xs mt-1">NEURO por obra tokenizada</div>
                    </div>
                  </div>
                </div>

                <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6">
                  <h3 className="text-white font-bold mb-1">Data de encerramento</h3>
                  <p className="text-slate-400 text-sm">06 de maio de 2027 — distribuicao automatica via contrato inteligente.</p>
                  <div className="mt-4 p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl">
                    <p className="text-amber-400 text-xs">Os valores acima sao estimativas baseadas nas obras tokenizadas ate o momento. O calculo final sera feito em 06/05/2027.</p>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'financeiro' && (
              <div className="space-y-6">
                <h2 className="text-xl font-black text-white">Gestao Financeira da DApp</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5">
                    <div className="flex items-center gap-3 mb-3">
                      <Wallet className="w-5 h-5 text-indigo-400" />
                      <span className="text-slate-400 text-sm">ETH na DApp</span>
                    </div>
                    <div className="text-2xl font-black text-white">
                      {ethBalance ? Number(ethBalance.formatted).toFixed(4) : '0.0000'} ETH
                    </div>
                    <div className="text-slate-500 text-xs mt-1 font-mono">{DAPP_WALLET.slice(0,6)}...{DAPP_WALLET.slice(-4)}</div>
                  </div>
                  <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5">
                    <div className="flex items-center gap-3 mb-3">
                      <DollarSign className="w-5 h-5 text-emerald-400" />
                      <span className="text-slate-400 text-sm">USDC na DApp</span>
                    </div>
                    <div className="text-2xl font-black text-white">
                      {usdcBalance ? Number(usdcBalance.formatted).toFixed(2) : '0.00'} USDC
                    </div>
                    <div className="text-slate-500 text-xs mt-1">Base Mainnet</div>
                  </div>
                  <div className="bg-slate-900/60 border border-indigo-500/30 rounded-2xl p-5">
                    <div className="flex items-center gap-3 mb-3">
                      <Zap className="w-5 h-5 text-indigo-400" />
                      <span className="text-slate-400 text-sm">NEURO na DApp</span>
                    </div>
                    <div className="text-2xl font-black text-indigo-400">
                      {neuroBalance ? Number(neuroBalance.formatted).toLocaleString('pt-BR', {maximumFractionDigits: 0}) : '0'}
                    </div>
                    <div className="text-slate-500 text-xs mt-1">Token de governanca</div>
                  </div>
                </div>
                <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6">
                  <h3 className="text-white font-bold mb-4">Split Automatico por Venda</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-emerald-950/20 border border-emerald-500/20 rounded-xl p-4 text-center">
                      <div className="text-3xl font-black text-emerald-400">80%</div>
                      <div className="text-slate-400 text-sm mt-1">Artista</div>
                    </div>
                    <div className="bg-indigo-950/20 border border-indigo-500/20 rounded-xl p-4 text-center">
                      <div className="text-3xl font-black text-indigo-400">20%</div>
                      <div className="text-slate-400 text-sm mt-1">DApp</div>
                    </div>
                  </div>
                </div>
                <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6">
                  <h3 className="text-white font-bold mb-4">Obras no Marketplace</h3>
                  <div className="space-y-3">
                    {submissions.filter(s => s.status === 'tokenized').map((s, i) => (
                      <div key={i} className="flex items-center justify-between p-3 bg-slate-950/40 border border-slate-800 rounded-xl">
                        <div>
                          <div className="text-white font-semibold text-sm">{s.title}</div>
                          <div className="text-slate-500 text-xs">por {s.artistName}</div>
                        </div>
                        <div className="text-emerald-400 font-bold text-sm">
                          {s.moeda === 'BRL' ? 'R$' : 'US$'} {Number(s.valorObra || 0).toLocaleString('pt-BR')}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="text-center">
                  <a href={`https://basescan.org/address/${DAPP_WALLET}`} target="_blank" rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-6 py-3 bg-slate-800 border border-slate-700 text-slate-300 rounded-xl text-sm font-semibold hover:border-indigo-500 transition-all">
                    <Eye className="w-4 h-4" /> Ver carteira DApp no BaseScan
                  </a>
                </div>
              </div>
            )}

            {activeTab === 'blog' && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-black text-white">Gerenciar Blog</h2>
                  <button onClick={() => setShowNewPost(!showNewPost)}
                    className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-xl text-sm font-bold hover:bg-indigo-500 transition-all">
                    <PenLine className="w-4 h-4" /> Novo Post
                  </button>
                </div>
                {showNewPost && (
                  <div className="bg-slate-900/60 border border-indigo-500/30 rounded-2xl p-6 space-y-4">
                    <h3 className="text-indigo-400 font-bold">Novo Artigo</h3>
                    <input value={newPost.title} onChange={e => setNewPost({...newPost, title: e.target.value})}
                      placeholder="Titulo do artigo"
                      className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-indigo-500" />
                    <input value={newPost.excerpt} onChange={e => setNewPost({...newPost, excerpt: e.target.value})}
                      placeholder="Resumo (excerpt)"
                      className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-indigo-500" />
                    <select value={newPost.category} onChange={e => setNewPost({...newPost, category: e.target.value})}
                      className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-indigo-500">
                      {["Arte & Criatividade", "Jiu-Jitsu & Neurociencia", "Neurodivergencia", "Natureza como Terapia", "Novidades NeuroArt", "Papers & Pesquisas"].map(cat => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </select>
                    <textarea value={newPost.content} onChange={e => setNewPost({...newPost, content: e.target.value})}
                      placeholder="Conteudo completo do artigo"
                      rows={10}
                      className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-indigo-500 resize-none" />
                    <div className="flex gap-3">
                      <button onClick={() => setShowNewPost(false)}
                        className="px-4 py-2 bg-slate-700 text-slate-300 rounded-xl text-sm font-bold hover:bg-slate-600 transition-all">
                        Cancelar
                      </button>
                      <button onClick={async () => {
                        setSavingPost(true)
                        const res = await fetch('/api/posts', {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ ...newPost, author: 'Tales Hack', authorWallet: address })
                        })
                        const post = await res.json()
                        setPosts(prev => [post, ...prev])
                        setNewPost({ title: '', excerpt: '', content: '', category: 'Novidades NeuroArt', published: true })
                        setShowNewPost(false)
                        setSavingPost(false)
                      }} disabled={savingPost || !newPost.title || !newPost.content}
                        className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-xl text-sm font-bold hover:bg-indigo-500 transition-all disabled:opacity-50">
                        {savingPost ? 'Publicando...' : 'Publicar'}
                      </button>
                    </div>
                  </div>
                )}
                <div className="space-y-3">
                  {posts.length === 0 && <p className="text-slate-600 text-center py-8">Nenhum post publicado ainda.</p>}
                  {posts.map((post, i) => (
                    <div key={i} className="bg-slate-900/60 border border-slate-800 rounded-xl p-4 flex items-center justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs px-2 py-0.5 rounded-full bg-indigo-500/10 border border-indigo-500/30 text-indigo-400">{post.category}</span>
                        </div>
                        <h4 className="text-white font-bold truncate">{post.title}</h4>
                        <p className="text-slate-500 text-xs mt-0.5">{new Date(post.publishedAt || post.published_at).toLocaleDateString('pt-BR')} · {post.comments?.length || 0} comentarios</p>
                      </div>
                      <a href={`/blog/${post.slug}`} target="_blank"
                        className="px-3 py-1.5 bg-slate-800 text-slate-300 rounded-lg text-xs hover:bg-slate-700 transition-all shrink-0">
                        Ver post
                      </a>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>

      <footer className="border-t border-slate-800 mt-20 py-8 text-center text-slate-500 text-sm">
        <p>NeuroArt DApp © 2026 · Painel exclusivo para fundadores · Base L2</p>
      </footer>
    </main>
  )
}
