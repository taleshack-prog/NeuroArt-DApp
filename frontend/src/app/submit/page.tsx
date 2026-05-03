'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { ConnectKitButton } from 'connectkit'
import { useAccount } from 'wagmi'
import { Brain, ArrowLeft, Upload, CheckCircle, AlertCircle } from 'lucide-react'
import Link from 'next/link'

type FormData = {
  artistName: string
  title: string
  description: string
  neurotipo: string
  estadoCognitivo: string
  totalFractions: string
  imageFile: File | null
  imagePreview: string
}

const NEUROTIPOS = ['TDAH', 'TEA', 'Dislexia', 'Discalculia', 'Superdotação', 'Outro']
const ESTADOS = ['Hiperfoco', 'Estado de Fluxo', 'Divergência Criativa', 'Monofoco', 'Expansão Cognitiva']

export default function SubmitPage() {
  const { address, isConnected } = useAccount()
  const [step, setStep] = useState<'form' | 'success'>('form')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  const [form, setForm] = useState<FormData>({
    artistName: '',
    title: '',
    description: '',
    neurotipo: '',
    estadoCognitivo: '',
    totalFractions: '100000',
    imageFile: null,
    imagePreview: '',
  })

  function handleInput(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }))
  }

  function handleImage(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 10 * 1024 * 1024) {
      setError('Imagem muito grande. Máximo 10MB.')
      return
    }
    const reader = new FileReader()
    reader.onload = () => setForm(prev => ({
      ...prev,
      imageFile: file,
      imagePreview: reader.result as string,
    }))
    reader.readAsDataURL(file)
    setError('')
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!isConnected) { setError('Conecte sua carteira primeiro.'); return }
    if (!form.imageFile) { setError('Selecione uma imagem da obra.'); return }
    if (!form.neurotipo) { setError('Selecione o neurotipo.'); return }
    if (!form.estadoCognitivo) { setError('Selecione o estado cognitivo.'); return }
    if (Number(form.totalFractions) < 100) { setError('Mínimo de 100 frações.'); return }
    if (Number(form.totalFractions) > 100_000_000) { setError('Máximo de 100.000.000 frações.'); return }

    setSubmitting(true)
    setError('')

    // Simula envio — aqui será integrado com Pinata + backend
    await new Promise(r => setTimeout(r, 2000))

    setSubmitting(false)
    setStep('success')
  }

  if (step === 'success') {
    return (
      <main className="min-h-screen bg-gradient-to-br from-slate-950 via-indigo-950/20 to-slate-950 text-white flex items-center justify-center px-6">
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
          className="max-w-md w-full text-center bg-slate-900/60 border border-emerald-500/30 rounded-2xl p-10">
          <CheckCircle className="w-16 h-16 text-emerald-400 mx-auto mb-4" />
          <h2 className="text-2xl font-black text-white mb-2">Obra Submetida!</h2>
          <p className="text-slate-400 mb-2">
            <span className="text-emerald-400 font-semibold">"{form.title}"</span> foi enviada para análise dos fundadores.
          </p>
          <p className="text-slate-500 text-sm mb-6">
            Você será notificado quando sua obra for aprovada e tokenizada na Base Sepolia.
          </p>
          <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-4 mb-6 text-left">
            <div className="text-xs text-slate-500 mb-1">Carteira do artista</div>
            <div className="text-indigo-400 font-mono text-sm truncate">{address}</div>
            <div className="text-xs text-slate-500 mt-2 mb-1">Frações solicitadas</div>
            <div className="text-emerald-400 font-bold">{Number(form.totalFractions).toLocaleString()} frações</div>
          </div>
          <div className="flex gap-3">
            <Link href="/gallery"
              className="flex-1 px-4 py-3 bg-indigo-600/20 border border-indigo-500/40 text-indigo-400 rounded-xl text-sm font-semibold text-center hover:bg-indigo-600/30 transition-all">
              Ver Galeria
            </Link>
            <button onClick={() => { setStep('form'); setForm({ artistName: '', title: '', description: '', neurotipo: '', estadoCognitivo: '', totalFractions: '100000', imageFile: null, imagePreview: '' }) }}
              className="flex-1 px-4 py-3 bg-slate-800 border border-slate-700 text-slate-300 rounded-xl text-sm font-semibold hover:border-slate-600 transition-all">
              Nova Submissão
            </button>
          </div>
        </motion.div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-950 via-indigo-950/20 to-slate-950 text-white">
      <header className="border-b border-slate-800 bg-slate-950/80 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-3xl mx-auto px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <Link href="/" className="text-slate-400 hover:text-white transition-colors">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div className="flex items-center gap-3">
              <Brain className="text-indigo-500 w-7 h-7" />
              <span className="text-lg font-black bg-gradient-to-r from-indigo-400 to-emerald-400 bg-clip-text text-transparent">
                Submeter Obra
              </span>
            </div>
          </div>
          <ConnectKitButton />
        </div>
      </header>

      <div className="max-w-3xl mx-auto px-6 py-10">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <h1 className="text-3xl font-black mb-2">Tokenize sua Obra</h1>
          <p className="text-slate-400">Submeta sua obra para análise dos fundadores. Após aprovação, ela será tokenizada na Base Sepolia e disponibilizada para investidores.</p>
        </motion.div>

        {!isConnected && (
          <div className="border border-amber-500/40 bg-amber-500/10 rounded-2xl p-5 mb-6 flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-amber-400 shrink-0" />
            <div>
              <p className="text-amber-300 font-medium text-sm">Conecte sua carteira</p>
              <p className="text-amber-500/70 text-xs">Sua carteira será vinculada à obra como artista depositário.</p>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">

          {/* Upload de imagem */}
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
            className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6">
            <h2 className="font-bold text-white mb-4 flex items-center gap-2">
              <Upload className="w-5 h-5 text-indigo-400" /> Imagem da Obra
            </h2>
            <label className={`block w-full border-2 border-dashed rounded-xl cursor-pointer transition-all ${form.imagePreview ? 'border-indigo-500/50' : 'border-slate-700 hover:border-indigo-500/40'}`}>
              <input type="file" accept="image/*" onChange={handleImage} className="hidden" />
              {form.imagePreview ? (
                <img src={form.imagePreview} alt="Preview" className="w-full h-64 object-cover rounded-xl" />
              ) : (
                <div className="py-16 text-center">
                  <Upload className="w-10 h-10 text-slate-600 mx-auto mb-3" />
                  <p className="text-slate-400 font-medium">Clique para selecionar</p>
                  <p className="text-slate-600 text-sm mt-1">PNG, JPG, GIF — máx. 10MB</p>
                </div>
              )}
            </label>
          </motion.div>

          {/* Dados da obra */}
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
            className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 space-y-4">
            <h2 className="font-bold text-white mb-2">Dados da Obra</h2>

            <div>
              <label className="block text-slate-400 text-sm mb-1.5">Seu nome artístico *</label>
              <input name="artistName" value={form.artistName} onChange={handleInput} required
                placeholder="Como você quer ser identificado"
                className="w-full bg-slate-950/60 border border-slate-700 rounded-xl px-4 py-3 text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500 transition-colors" />
            </div>

            <div>
              <label className="block text-slate-400 text-sm mb-1.5">Título da obra *</label>
              <input name="title" value={form.title} onChange={handleInput} required
                placeholder="Ex: Neuro-Sinfonia #001"
                className="w-full bg-slate-950/60 border border-slate-700 rounded-xl px-4 py-3 text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500 transition-colors" />
            </div>

            <div>
              <label className="block text-slate-400 text-sm mb-1.5">Descrição *</label>
              <textarea name="description" value={form.description} onChange={handleInput} required rows={4}
                placeholder="Descreva o processo criativo, o estado cognitivo durante a criação e o significado da obra..."
                className="w-full bg-slate-950/60 border border-slate-700 rounded-xl px-4 py-3 text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500 transition-colors resize-none" />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-slate-400 text-sm mb-1.5">Neurotipo *</label>
                <select name="neurotipo" value={form.neurotipo} onChange={handleInput} required
                  className="w-full bg-slate-950/60 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-indigo-500 transition-colors">
                  <option value="">Selecione...</option>
                  {NEUROTIPOS.map(n => <option key={n} value={n}>{n}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-slate-400 text-sm mb-1.5">Estado Cognitivo *</label>
                <select name="estadoCognitivo" value={form.estadoCognitivo} onChange={handleInput} required
                  className="w-full bg-slate-950/60 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-indigo-500 transition-colors">
                  <option value="">Selecione...</option>
                  {ESTADOS.map(e => <option key={e} value={e}>{e}</option>)}
                </select>
              </div>
            </div>
          </motion.div>

          {/* Frações */}
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
            className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6">
            <h2 className="font-bold text-white mb-1">Quantidade de Frações</h2>
            <p className="text-slate-500 text-sm mb-4">Você decide em quantas frações quer dividir sua obra. Mais frações = menor preço unitário = mais acessível.</p>
            <input name="totalFractions" type="number" value={form.totalFractions} onChange={handleInput}
              min="100" max="100000000" required
              className="w-full bg-slate-950/60 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-indigo-500 transition-colors font-mono text-lg" />
            <div className="flex justify-between text-xs text-slate-600 mt-2">
              <span>Mínimo: 100</span>
              <span>Máximo: 100.000.000</span>
            </div>
            <div className="mt-3 flex gap-2 flex-wrap">
              {[1000, 10000, 100000, 1000000].map(v => (
                <button key={v} type="button"
                  onClick={() => setForm(prev => ({ ...prev, totalFractions: String(v) }))}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                    form.totalFractions === String(v)
                      ? 'bg-indigo-600 border-indigo-500 text-white'
                      : 'bg-slate-800 border-slate-700 text-slate-400 hover:border-indigo-500'
                  }`}>
                  {v.toLocaleString()}
                </button>
              ))}
            </div>
          </motion.div>

          {error && (
            <div className="flex items-center gap-2 text-red-400 text-sm bg-red-500/10 border border-red-500/30 rounded-xl px-4 py-3">
              <AlertCircle className="w-4 h-4 shrink-0" /> {error}
            </div>
          )}

          <motion.button type="submit" disabled={submitting || !isConnected}
            whileHover={{ scale: submitting ? 1 : 1.02 }}
            whileTap={{ scale: submitting ? 1 : 0.98 }}
            className="w-full py-4 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl font-black text-lg hover:from-indigo-500 hover:to-purple-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed">
            {submitting ? 'Enviando...' : isConnected ? 'Submeter Obra para Aprovação' : 'Conecte a carteira para submeter'}
          </motion.button>

        </form>
      </div>

      <footer className="border-t border-slate-800 mt-20 py-8 text-center text-slate-500 text-sm">
        <p>NeuroArt DApp © 2026 · Tales Hack & Prof. Alexandre de Souza Fortis · Base L2</p>
      </footer>
    </main>
  )
}
