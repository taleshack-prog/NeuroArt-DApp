'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { WalletButton } from '@/components/WalletButton'
import { useAccount } from 'wagmi'
import { Brain, ArrowLeft, Upload, CheckCircle, AlertCircle, DollarSign } from 'lucide-react'
import Link from 'next/link'

type Moeda = 'BRL' | 'USD' | 'ETH'

type FormData = {
  // Obra
  artistName: string
  title: string
  description: string
  estadoCognitivo: string
  totalFractions: string
  valorObra: string
  moeda: Moeda
  imageFile: File | null
  imagePreview: string
  imageBase64: string
  // Identidade do artista
  artistEmail: string
  artistCpfPassaporte: string
  artistNacionalidade: string
  artistEndereco: string
  artistTelefone: string
  artistInstituicao: string
  // Custódia
  obraLocalizacao: string
  obraCondicao: string
  aceitaTermos: boolean
}

function calcCaucao(valorBRL: number): { pct: number; valorUSD: number; faixa: string } {
  const USD = valorBRL / 5.75
  if (valorBRL <= 12000) return { pct: 0, valorUSD: 0, faixa: "Sem caucao" }
  if (valorBRL <= 30000) return { pct: 1, valorUSD: USD * 0.01, faixa: "1% do valor" }
  if (valorBRL <= 60000) return { pct: 2, valorUSD: USD * 0.02, faixa: "2% + Proof of Reserve mensal" }
  if (valorBRL <= 150000) return { pct: 3, valorUSD: USD * 0.03, faixa: "3% + Seguro obrigatorio" }
  if (valorBRL <= 300000) return { pct: 4, valorUSD: USD * 0.04, faixa: "4% + Seguro + PoR quinzenal" }
  return { pct: 5, valorUSD: USD * 0.05, faixa: "5% + Seguro + Verificacao fisica" }
}

const ESTADOS = ['Hiperfoco', 'Estado de Fluxo', 'Divergência Criativa', 'Monofoco', 'Expansão Cognitiva']
const MOEDAS: { value: Moeda; label: string; symbol: string }[] = [
  { value: 'BRL', label: 'Real Brasileiro', symbol: 'R$' },
  { value: 'USD', label: 'Dólar Americano', symbol: 'US$' },
  { value: 'ETH', label: 'Ethereum', symbol: 'ETH' },
]

export default function SubmitPage() {
  const { address, isConnected } = useAccount()
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])

  const [step, setStep] = useState<'form' | 'success'>('form')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  const [form, setForm] = useState<FormData>({
    artistName: '',
    title: '',
    description: '',
    estadoCognitivo: '',
    totalFractions: '100000',
    valorObra: '',
    moeda: 'BRL',
    imageFile: null,
    imagePreview: '',
    imageBase64: '',
    artistEmail: '',
    artistCpfPassaporte: '',
    artistNacionalidade: 'Brasileira',
    artistEndereco: '',
    artistTelefone: '',
    artistInstituicao: '',
    obraLocalizacao: '',
    obraCondicao: 'Otimo',
    aceitaTermos: false,
  })

  // Preço por fração calculado automaticamente
  const precoPorFracao = () => {
    const valor = parseFloat(form.valorObra)
    const fracoes = parseInt(form.totalFractions)
    if (!valor || !fracoes || fracoes === 0) return null
    const preco = valor / fracoes
    // preco correto: valor total dividido pelo numero de fracoes
    const moeda = MOEDAS.find(m => m.value === form.moeda)
    if (form.moeda === 'ETH') return `${preco.toFixed(6)} ETH`
    return `${moeda?.symbol} ${preco.toFixed(4)}`
  }

  function handleInput(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }))
  }

  function handleImage(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 10 * 1024 * 1024) { setError('Imagem muito grande. Máximo 10MB.'); return }
    const reader = new FileReader()
    reader.onload = () => setForm(prev => ({
      ...prev,
      imageFile: file,
      imagePreview: reader.result as string,
      imageBase64: reader.result as string,
    }))
    reader.readAsDataURL(file)
    setError('')
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!mounted || !isConnected || !address) { setError('Conecte sua carteira primeiro.'); return }
    if (!form.imageFile) { setError('Selecione uma imagem da obra.'); return }
    if (!form.estadoCognitivo) { setError('Selecione o estado cognitivo.'); return }
    if (!form.valorObra || parseFloat(form.valorObra) <= 0) { setError('Informe o valor da obra.'); return }
    if (Number(form.totalFractions) < 1) { setError('Mínimo de 1 fração.'); return }
    if (Number(form.totalFractions) > 100_000_000) { setError('Máximo de 100.000.000 frações.'); return }

    setSubmitting(true)
    setError('')

    try {
      const res = await fetch('/api/submissions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          artistName: form.artistName,
          artistWallet: address,
          title: form.title,
          description: form.description,
          estadoCognitivo: form.estadoCognitivo,
          totalFractions: form.totalFractions,
          valorObra: form.valorObra,
          moeda: form.moeda,
          precoPorFracao: precoPorFracao(),
          imageBase64: form.imageBase64,
        }),
      })

      if (!res.ok) {
        const data = await res.json()
        setError(data.error || 'Erro ao submeter obra.')
        setSubmitting(false)
        return
      }

      setStep('success')
    } catch {
      setError('Erro de conexão. Tente novamente.')
    } finally {
      setSubmitting(false)
    }
  }

  if (step === 'success') {
    const moeda = MOEDAS.find(m => m.value === form.moeda)
    return (
      <main className="min-h-screen bg-gradient-to-br from-slate-950 via-indigo-950/20 to-slate-950 text-white flex items-center justify-center px-6">
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
          className="max-w-md w-full text-center bg-slate-900/60 border border-emerald-500/30 rounded-2xl p-10">
          <CheckCircle className="w-16 h-16 text-emerald-400 mx-auto mb-4" />
          <h2 className="text-2xl font-black text-white mb-2">Obra Submetida!</h2>
          <p className="text-slate-400 mb-2">
            <span className="text-emerald-400 font-semibold">"{form.title}"</span> foi enviada para análise dos fundadores.
          </p>
          <p className="text-slate-500 text-sm mb-6">Você será notificado quando sua obra for aprovada e tokenizada na Base Sepolia.</p>
          <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-4 mb-6 text-left space-y-3">
            <div>
              <div className="text-xs text-slate-500 mb-1">Carteira vinculada</div>
              <div className="text-indigo-400 font-mono text-sm truncate">{address}</div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <div className="text-xs text-slate-500 mb-1">Valor da obra</div>
                <div className="text-emerald-400 font-bold">{moeda?.symbol} {parseFloat(form.valorObra).toLocaleString()}</div>
              </div>
              <div>
                <div className="text-xs text-slate-500 mb-1">Frações</div>
                <div className="text-indigo-400 font-bold">{Number(form.totalFractions).toLocaleString()}</div>
              </div>
            </div>
            <div>
              <div className="text-xs text-slate-500 mb-1">Preço por fração</div>
              <div className="text-purple-400 font-bold">{precoPorFracao()}</div>
            </div>
          </div>
          <div className="flex gap-3">
            <Link href="/gallery"
              className="flex-1 px-4 py-3 bg-indigo-600/20 border border-indigo-500/40 text-indigo-400 rounded-xl text-sm font-semibold text-center hover:bg-indigo-600/30 transition-all">
              Ver Galeria
            </Link>
            <button onClick={() => setStep('form')}
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
          <WalletButton />
        </div>
      </header>

      <div className="max-w-3xl mx-auto px-6 py-10">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <h1 className="text-3xl font-black mb-2">Tokenize sua Obra</h1>
          <p className="text-slate-400">Submeta sua obra para análise. Após aprovação pelos fundadores, ela será tokenizada na Base Sepolia.</p>
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

          {/* Imagem */}
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

          {/* Dados */}
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
                placeholder="Descreva o processo criativo, o estado cognitivo durante a criação..."
                className="w-full bg-slate-950/60 border border-slate-700 rounded-xl px-4 py-3 text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500 transition-colors resize-none" />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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

          {/* Precificação */}
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
            className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 space-y-4">
            <h2 className="font-bold text-white flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-emerald-400" /> Precificação da Obra
            </h2>

            {/* Valor e moeda */}
            <div>
              <label className="block text-slate-400 text-sm mb-1.5">Valor total da obra *</label>
              <div className="flex gap-3">
                <select name="moeda" value={form.moeda} onChange={handleInput}
                  className="bg-slate-950/60 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-indigo-500 transition-colors shrink-0">
                  {MOEDAS.map(m => <option key={m.value} value={m.value}>{m.symbol} {m.value}</option>)}
                </select>
                <input name="valorObra" type="number" value={form.valorObra} onChange={handleInput}
                  required min="0.01" step="0.01"
                  placeholder="Ex: 800.00"
                  className="flex-1 bg-slate-950/60 border border-slate-700 rounded-xl px-4 py-3 text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500 transition-colors font-mono" />
              </div>
              <p className="text-slate-600 text-xs mt-1.5">Valor pelo qual você avalia sua obra. Os fundadores irão analisar se é compatível.</p>
            </div>

            {/* Frações */}
            <div>
              <label className="block text-slate-400 text-sm mb-1.5">Quantidade de frações *</label>
              <input name="totalFractions" type="number" value={form.totalFractions} onChange={handleInput}
                min="1" max="100000000" required
                className="w-full bg-slate-950/60 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-indigo-500 transition-colors font-mono text-lg" />
              <div className="flex justify-between text-xs text-slate-600 mt-1.5">
                <span>Mínimo: 1 (obra inteira)</span>
                <span>Máximo: 100.000.000</span>
              </div>
              <div className="mt-3 flex gap-2 flex-wrap">
                {[1, 10, 100, 1000, 10000, 100000, 1000000].map(v => (
                  <button key={v} type="button"
                    onClick={() => setForm(prev => ({ ...prev, totalFractions: String(v) }))}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                      form.totalFractions === String(v)
                        ? 'bg-indigo-600 border-indigo-500 text-white'
                        : 'bg-slate-800 border-slate-700 text-slate-400 hover:border-indigo-500'
                    }`}>
                    {v === 1 ? '1 (único)' : v.toLocaleString()}
                  </button>
                ))}
              </div>
            </div>

            {/* Preview do preço por fração */}
            {precoPorFracao() && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-4 flex items-center justify-between">
                <div>
                  <div className="text-xs text-slate-500">Preço por fração calculado</div>
                  <div className="text-emerald-400 font-black text-xl mt-0.5">{precoPorFracao()}</div>
                </div>
                <div className="text-right">
                  <div className="text-xs text-slate-500">Valor total</div>
                  <div className="text-white font-bold">
                    {MOEDAS.find(m => m.value === form.moeda)?.symbol} {parseFloat(form.valorObra || '0').toLocaleString()}
                  </div>
                </div>
              </motion.div>
            )}
          </motion.div>

          {error && (
            <div className="flex items-center gap-2 text-red-400 text-sm bg-red-500/10 border border-red-500/30 rounded-xl px-4 py-3">
              <AlertCircle className="w-4 h-4 shrink-0" /> {error}
            </div>
          )}

          {/* Ficha do Artista */}
          <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 space-y-4">
            <h2 className="text-lg font-black text-white">Identidade do Artista</h2>
            <p className="text-slate-500 text-sm">Dados obrigatorios para o contrato de deposito fiel.</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-slate-400 text-sm mb-1 block">Email *</label>
                <input value={form.artistEmail || ""} onChange={e => setForm({...form, artistEmail: e.target.value})}
                  type="email" placeholder="seu@email.com"
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-indigo-500" />
              </div>
              <div>
                <label className="text-slate-400 text-sm mb-1 block">CPF ou Passaporte *</label>
                <input value={form.artistCpfPassaporte || ""} onChange={e => setForm({...form, artistCpfPassaporte: e.target.value})}
                  placeholder="000.000.000-00 ou Passaporte"
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-indigo-500" />
              </div>
              <div>
                <label className="text-slate-400 text-sm mb-1 block">Nacionalidade *</label>
                <input value={form.artistNacionalidade || "Brasileira"} onChange={e => setForm({...form, artistNacionalidade: e.target.value})}
                  placeholder="Ex: Brasileira"
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-indigo-500" />
              </div>
              <div>
                <label className="text-slate-400 text-sm mb-1 block">Telefone</label>
                <input value={form.artistTelefone || ""} onChange={e => setForm({...form, artistTelefone: e.target.value})}
                  placeholder="+55 51 99999-9999"
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-indigo-500" />
              </div>
            </div>
            <div>
              <label className="text-slate-400 text-sm mb-1 block">Endereco completo *</label>
              <input value={form.artistEndereco || ""} onChange={e => setForm({...form, artistEndereco: e.target.value})}
                placeholder="Rua, numero, cidade, estado, pais"
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-indigo-500" />
            </div>
            <div>
              <label className="text-slate-400 text-sm mb-1 block">Instituicao / Atelie (opcional)</label>
              <input value={form.artistInstituicao || ""} onChange={e => setForm({...form, artistInstituicao: e.target.value})}
                placeholder="Nome do atelie, galeria ou instituicao"
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-indigo-500" />
            </div>
          </div>

          {/* Custodia da Obra */}
          <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 space-y-4">
            <h2 className="text-lg font-black text-white">Custodia da Obra</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-slate-400 text-sm mb-1 block">Localizacao atual da obra *</label>
                <input value={form.obraLocalizacao || ""} onChange={e => setForm({...form, obraLocalizacao: e.target.value})}
                  placeholder="Ex: Atelie proprio, Porto Alegre/RS"
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-indigo-500" />
              </div>
              <div>
                <label className="text-slate-400 text-sm mb-1 block">Condicao da obra *</label>
                <select value={form.obraCondicao || "Otimo"} onChange={e => setForm({...form, obraCondicao: e.target.value})}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-indigo-500">
                  {["Otimo", "Bom", "Regular"].map(op => <option key={op} value={op}>{op}</option>)}
                </select>
              </div>
            </div>
            {form.valorObra && form.moeda === "BRL" && (() => {
              const v = Number(form.valorObra)
              const usd = v / 5.75
              const pct = v <= 12000 ? 0 : v <= 30000 ? 1 : v <= 60000 ? 2 : v <= 150000 ? 3 : v <= 300000 ? 4 : 5
              const faixa = v <= 12000 ? "Sem caucao" : v <= 30000 ? "1% do valor" : v <= 60000 ? "2% + Proof of Reserve mensal" : v <= 150000 ? "3% + Seguro obrigatorio" : v <= 300000 ? "4% + Seguro + PoR quinzenal" : "5% + Seguro + Verificacao fisica"
              const caucaoUSD = (usd * pct / 100)
              return (
                <div className={`rounded-xl p-4 border ${pct === 0 ? "bg-emerald-950/20 border-emerald-500/20" : "bg-amber-950/20 border-amber-500/20"}`}>
                  <div className="flex items-center justify-between mb-1">
                    <span className={`font-bold text-sm ${pct === 0 ? "text-emerald-400" : "text-amber-400"}`}>Caucao de Custodia</span>
                    <span className={`font-black text-lg ${pct === 0 ? "text-emerald-400" : "text-amber-400"}`}>
                      {pct === 0 ? "Isento" : `$${caucaoUSD.toFixed(2)} USDC`}
                    </span>
                  </div>
                  <p className={`text-xs ${pct === 0 ? "text-emerald-600" : "text-amber-600"}`}>{faixa}</p>
                  {pct > 0 && <p className="text-slate-500 text-xs mt-1">A caucao sera bloqueada no contrato e devolvida apos comprovacao de entrega fisica.</p>}
                </div>
              )
            })()}
          </div>

          {/* Contrato de Deposito Fiel */}
          <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6">
            <h2 className="text-lg font-black text-white mb-4">Contrato de Deposito Fiel</h2>
            <div className="bg-slate-950/60 rounded-xl p-4 text-slate-400 text-xs leading-relaxed mb-4 max-h-40 overflow-y-auto">
              <p className="font-bold text-white mb-2">TERMO DE DEPOSITO FIEL E COMPROMISSO DE ENTREGA</p>
              <p>Ao submeter esta obra, o artista assume a responsabilidade legal pela guarda e conservacao do bem fisico durante todo o periodo de tokenizacao.</p>
              <p className="mt-2">O artista se compromete a: (1) manter a obra em perfeito estado de conservacao; (2) fornecer provas de custodia quando solicitado pelos fundadores; (3) realizar a entrega fisica ao detentor de 100% das fracoes mediante verificacao de identidade; (4) nao alienar, danificar ou extraviar a obra sob pena de banimento permanente do ecossistema e execucao judicial.</p>
              <p className="mt-2">Este compromisso e selado por hash imutavel registrado na rede Base, vinculando a identidade digital do artista (SBT) ao ativo tokenizado.</p>
              <p className="mt-2">Fundadores: Tales Hack e Prof. Alexandre de Souza Fortis — NeuroArt DApp, Porto Alegre/RS, Brasil.</p>
            </div>
            <label className="flex items-start gap-3 cursor-pointer">
              <input type="checkbox" checked={form.aceitaTermos || false}
                onChange={e => setForm({...form, aceitaTermos: e.target.checked})}
                className="mt-1 w-4 h-4 accent-indigo-500" />
              <span className="text-slate-400 text-sm">
                Li e aceito os termos do Contrato de Deposito Fiel. Entendo que este documento possui validade juridica como prova de propriedade e custodia da obra.
              </span>
            </label>
          </div>

          <motion.button type="submit" disabled={submitting || !mounted || !isConnected}
            whileHover={{ scale: submitting ? 1 : 1.02 }}
            whileTap={{ scale: submitting ? 1 : 0.98 }}
            className="w-full py-4 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl font-black text-lg hover:from-indigo-500 hover:to-purple-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed">
            {submitting ? 'Enviando...' : (mounted && isConnected) ? 'Submeter Obra para Aprovação' : 'Conecte a carteira para submeter'}
          </motion.button>
        </form>
      </div>

      <footer className="border-t border-slate-800 mt-20 py-8 text-center text-slate-500 text-sm">
        <p>NeuroArt DApp © 2026 · Tales Hack & Prof. Alexandre de Souza Fortis · Base L2</p>
      </footer>
    </main>
  )
}
