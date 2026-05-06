"use client"

import { motion } from "framer-motion"
import { Brain, ArrowLeft, FlaskConical, Send, CheckCircle } from "lucide-react"
import Link from "next/link"
import { useState } from "react"
import { useAccount } from "wagmi"
import { WalletButton } from "@/components/WalletButton"

const CATEGORIES = [
  "Brain-Computer Interface (BCI)",
  "Neuroplasticidade via Arte",
  "Jiu-Jitsu & Neurociencia",
  "Protocolos Ambientais",
  "Neurodivergencia & Educacao",
  "Outro"
]

export default function ResearchPage() {
  const { address, isConnected } = useAccount()
  const [submitted, setSubmitted] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [form, setForm] = useState({
    title: "",
    abstract: "",
    methodology: "",
    expectedResults: "",
    budgetRequested: "",
    durationMonths: "",
    researcherName: "",
    researcherEmail: "",
    institution: "",
    category: "Brain-Computer Interface (BCI)"
  })

  const handleSubmit = async () => {
    if (!form.title || !form.abstract || !form.researcherName) return
    setSubmitting(true)
    try {
      const res = await fetch("/api/research", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, researcherWallet: address || "" })
      })
      if (res.ok) setSubmitted(true)
    } catch (e) {
      console.error(e)
    }
    setSubmitting(false)
  }

  if (submitted) return (
    <main className="min-h-screen bg-gradient-to-br from-slate-950 via-indigo-950/10 to-slate-950 text-white flex items-center justify-center">
      <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
        className="text-center max-w-md mx-auto px-6">
        <CheckCircle className="w-20 h-20 text-emerald-400 mx-auto mb-6" />
        <h2 className="text-3xl font-black mb-4">Proposta Enviada!</h2>
        <p className="text-slate-400 mb-8">Sua proposta de pesquisa foi recebida e sera analisada pelos fundadores. Voce sera notificado pelo email cadastrado.</p>
        <Link href="/" className="px-6 py-3 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-500 transition-all">
          Voltar ao inicio
        </Link>
      </motion.div>
    </main>
  )

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-950 via-indigo-950/10 to-slate-950 text-white">
      <header className="border-b border-slate-800 bg-slate-950/80 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-3xl mx-auto px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <Link href="/" className="text-slate-400 hover:text-white transition-colors">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div className="flex items-center gap-3">
              <Brain className="text-indigo-500 w-7 h-7" />
              <span className="text-lg font-black bg-gradient-to-r from-indigo-400 to-emerald-400 bg-clip-text text-transparent">
                NeuroArt DeSci
              </span>
            </div>
          </div>
          <WalletButton />
        </div>
      </header>

      <div className="max-w-3xl mx-auto px-6 py-12">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-10">
          <div className="flex items-center gap-3 mb-4">
            <FlaskConical className="w-8 h-8 text-purple-400" />
            <span className="px-3 py-1 rounded-full bg-purple-500/10 border border-purple-500/30 text-purple-400 text-sm font-medium">
              Fundo de Pesquisa DeSci
            </span>
          </div>
          <h1 className="text-4xl font-black mb-4">Submeter Proposta de Pesquisa</h1>
          <p className="text-slate-400 leading-relaxed">
            O NeuroArt financia pesquisas bioinspiradas focadas em intervencoes nao medicamentosas para neurodivergencia. 
            Submeta sua proposta para analise pelos fundadores.
          </p>
          <div className="grid grid-cols-3 gap-4 mt-6">
            {[
              { label: "Pool disponivel", value: "Fase 2", sub: "Q1 2027" },
              { label: "Areas de foco", value: "4", sub: "linhas de pesquisa" },
              { label: "Duracao max", value: "24", sub: "meses" },
            ].map((item, i) => (
              <div key={i} className="bg-slate-900/60 border border-slate-800 rounded-xl p-4 text-center">
                <div className="text-2xl font-black text-indigo-400">{item.value}</div>
                <div className="text-white text-sm font-semibold">{item.label}</div>
                <div className="text-slate-500 text-xs">{item.sub}</div>
              </div>
            ))}
          </div>
        </motion.div>

        <div className="space-y-6">
          <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 space-y-4">
            <h2 className="text-lg font-black text-white">Informacoes do Pesquisador</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-slate-400 text-sm mb-1 block">Nome completo *</label>
                <input value={form.researcherName} onChange={e => setForm({...form, researcherName: e.target.value})}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-indigo-500" />
              </div>
              <div>
                <label className="text-slate-400 text-sm mb-1 block">Email *</label>
                <input type="email" value={form.researcherEmail} onChange={e => setForm({...form, researcherEmail: e.target.value})}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-indigo-500" />
              </div>
            </div>
            <div>
              <label className="text-slate-400 text-sm mb-1 block">Instituicao / Afiliacao</label>
              <input value={form.institution} onChange={e => setForm({...form, institution: e.target.value})}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-indigo-500" />
            </div>
            {isConnected && (
              <div className="text-xs text-slate-500 font-mono">
                Wallet vinculada: {address?.slice(0,6)}...{address?.slice(-4)}
              </div>
            )}
          </div>

          <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 space-y-4">
            <h2 className="text-lg font-black text-white">Sobre a Pesquisa</h2>
            <div>
              <label className="text-slate-400 text-sm mb-1 block">Titulo da proposta *</label>
              <input value={form.title} onChange={e => setForm({...form, title: e.target.value})}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-indigo-500" />
            </div>
            <div>
              <label className="text-slate-400 text-sm mb-1 block">Categoria *</label>
              <select value={form.category} onChange={e => setForm({...form, category: e.target.value})}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-indigo-500">
                {CATEGORIES.map(cat => <option key={cat} value={cat}>{cat}</option>)}
              </select>
            </div>
            <div>
              <label className="text-slate-400 text-sm mb-1 block">Resumo / Abstract *</label>
              <textarea value={form.abstract} onChange={e => setForm({...form, abstract: e.target.value})}
                rows={4} placeholder="Descreva o objetivo e relevancia da pesquisa..."
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-indigo-500 resize-none" />
            </div>
            <div>
              <label className="text-slate-400 text-sm mb-1 block">Metodologia</label>
              <textarea value={form.methodology} onChange={e => setForm({...form, methodology: e.target.value})}
                rows={3} placeholder="Como a pesquisa sera conduzida?"
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-indigo-500 resize-none" />
            </div>
            <div>
              <label className="text-slate-400 text-sm mb-1 block">Resultados esperados</label>
              <textarea value={form.expectedResults} onChange={e => setForm({...form, expectedResults: e.target.value})}
                rows={3} placeholder="Quais impactos e descobertas sao esperados?"
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-indigo-500 resize-none" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-slate-400 text-sm mb-1 block">Orcamento solicitado (USD)</label>
                <input type="number" value={form.budgetRequested} onChange={e => setForm({...form, budgetRequested: e.target.value})}
                  placeholder="Ex: 5000"
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-indigo-500" />
              </div>
              <div>
                <label className="text-slate-400 text-sm mb-1 block">Duracao (meses)</label>
                <input type="number" value={form.durationMonths} onChange={e => setForm({...form, durationMonths: e.target.value})}
                  placeholder="Ex: 12"
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-indigo-500" />
              </div>
            </div>
          </div>

          <div className="bg-amber-950/20 border border-amber-500/20 rounded-xl p-4">
            <p className="text-amber-400 text-sm">
              As propostas serao analisadas pelos fundadores. O financiamento sera disponibilizado na Fase 2 (Q1 2027). 
              Propostas aprovadas recebem feedback e orientacao antes do inicio.
            </p>
          </div>

          <button onClick={handleSubmit} disabled={submitting || !form.title || !form.abstract || !form.researcherName}
            className="w-full flex items-center justify-center gap-2 px-6 py-4 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-xl font-bold text-lg hover:from-purple-500 hover:to-indigo-500 transition-all disabled:opacity-50">
            <Send className="w-5 h-5" />
            {submitting ? "Enviando..." : "Submeter Proposta"}
          </button>
        </div>
      </div>

      <footer className="border-t border-slate-800 mt-20 py-8 text-center text-slate-500 text-sm">
        <p>NeuroArt DApp 2026 - Tales Hack e Prof. Alexandre de Souza Fortis - Base L2</p>
      </footer>
    </main>
  )
}
