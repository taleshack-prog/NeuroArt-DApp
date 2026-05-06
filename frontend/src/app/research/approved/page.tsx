"use client"

import { motion } from "framer-motion"
import { Brain, ArrowLeft, FlaskConical, CheckCircle, Clock, Tag } from "lucide-react"
import Link from "next/link"
import { useState, useEffect } from "react"

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  approved: { label: "Aprovada", color: "text-emerald-400", bg: "bg-emerald-500/10 border-emerald-500/30" },
  in_progress: { label: "Em andamento", color: "text-indigo-400", bg: "bg-indigo-500/10 border-indigo-500/30" },
  completed: { label: "Concluida", color: "text-purple-400", bg: "bg-purple-500/10 border-purple-500/30" },
}

export default function ApprovedResearchPage() {
  const [proposals, setProposals] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState("all")

  useEffect(() => {
    fetch("/api/research")
      .then(r => r.json())
      .then(data => {
        if (Array.isArray(data)) {
          setProposals(data.filter(p => p.status !== "pending" && p.status !== "rejected"))
        }
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  const filtered = filter === "all" ? proposals : proposals.filter(p => p.status === filter)

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-950/10 to-slate-950 text-white">
      <header className="border-b border-slate-800 bg-slate-950/80 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-5xl mx-auto px-6 py-4 flex justify-between items-center">
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
          <Link href="/research"
            className="flex items-center gap-2 px-4 py-2 bg-purple-600/20 border border-purple-500/40 text-purple-400 rounded-xl text-sm font-semibold hover:bg-purple-600/30 transition-all">
            <FlaskConical className="w-4 h-4" /> Submeter Proposta
          </Link>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-6 py-12">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-10">
          <div className="flex items-center gap-3 mb-4">
            <FlaskConical className="w-8 h-8 text-purple-400" />
            <span className="px-3 py-1 rounded-full bg-purple-500/10 border border-purple-500/30 text-purple-400 text-sm font-medium">
              Fundo de Pesquisa DeSci
            </span>
          </div>
          <h1 className="text-4xl font-black mb-4">Pesquisas Financiadas</h1>
          <p className="text-slate-400 max-w-2xl leading-relaxed">
            Pesquisas bioinspiradas aprovadas e financiadas pelo ecossistema NeuroArt.
            Cada compra de fracao na galeria contribui diretamente para este fundo.
          </p>

          <div className="grid grid-cols-3 gap-4 mt-8">
            {[
              { value: proposals.length, label: "Pesquisas aprovadas", color: "text-emerald-400" },
              { value: proposals.filter(p => p.status === "in_progress").length, label: "Em andamento", color: "text-indigo-400" },
              { value: proposals.filter(p => p.status === "completed").length, label: "Concluidas", color: "text-purple-400" },
            ].map((s, i) => (
              <div key={i} className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4 text-center">
                <div className={`text-3xl font-black ${s.color}`}>{s.value}</div>
                <div className="text-slate-500 text-sm mt-1">{s.label}</div>
              </div>
            ))}
          </div>
        </motion.div>

        <div className="flex gap-2 flex-wrap mb-8">
          {[
            { id: "all", label: "Todas" },
            { id: "approved", label: "Aprovadas" },
            { id: "in_progress", label: "Em andamento" },
            { id: "completed", label: "Concluidas" },
          ].map(f => (
            <button key={f.id} onClick={() => setFilter(f.id)}
              className={`px-4 py-2 rounded-xl text-sm font-semibold border transition-all ${
                filter === f.id
                  ? "bg-indigo-600 border-indigo-500 text-white"
                  : "bg-slate-900 border-slate-800 text-slate-400 hover:border-indigo-500"
              }`}>
              {f.label}
            </button>
          ))}
        </div>

        {loading && <div className="text-center py-20 text-slate-500">Carregando...</div>}

        {!loading && filtered.length === 0 && (
          <div className="text-center py-20">
            <FlaskConical className="w-16 h-16 text-slate-800 mx-auto mb-4" />
            <p className="text-slate-500 mb-2">Nenhuma pesquisa aprovada ainda.</p>
            <p className="text-slate-600 text-sm">O financiamento sera disponibilizado na Fase 2 (Q1 2027).</p>
            <Link href="/research" className="inline-flex items-center gap-2 mt-6 px-6 py-3 bg-purple-600/20 border border-purple-500/40 text-purple-400 rounded-xl font-semibold hover:bg-purple-600/30 transition-all">
              <FlaskConical className="w-4 h-4" /> Submeter sua proposta
            </Link>
          </div>
        )}

        <div className="space-y-6">
          {filtered.map((p, i) => {
            const status = STATUS_CONFIG[p.status] || STATUS_CONFIG.approved
            return (
              <motion.div key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 hover:border-purple-500/30 transition-all">
                <div className="flex items-start justify-between gap-4 mb-4">
                  <div className="flex-1">
                    <div className="flex flex-wrap items-center gap-2 mb-2">
                      <span className={`flex items-center gap-1 px-2 py-0.5 rounded-full border text-xs font-bold ${status.bg} ${status.color}`}>
                        <CheckCircle className="w-3 h-3" /> {status.label}
                      </span>
                      <span className="px-2 py-0.5 rounded-full bg-purple-500/10 border border-purple-500/30 text-purple-400 text-xs">
                        <Tag className="w-3 h-3 inline mr-1" />{p.category}
                      </span>
                    </div>
                    <h2 className="text-xl font-black text-white">{p.title}</h2>
                    <p className="text-slate-400 text-sm mt-1">
                      por <span className="text-indigo-400 font-semibold">{p.researcher_name}</span>
                      {p.institution && <span className="text-slate-500"> · {p.institution}</span>}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    {p.budget_requested && (
                      <div className="text-emerald-400 font-black text-lg">US$ {Number(p.budget_requested).toLocaleString()}</div>
                    )}
                    {p.duration_months && (
                      <div className="flex items-center gap-1 text-slate-500 text-xs justify-end mt-1">
                        <Clock className="w-3 h-3" /> {p.duration_months} meses
                      </div>
                    )}
                  </div>
                </div>

                <p className="text-slate-400 text-sm leading-relaxed mb-4">{p.abstract}</p>

                {p.expected_results && (
                  <div className="bg-emerald-950/20 border border-emerald-500/20 rounded-xl p-4">
                    <p className="text-emerald-400 text-xs font-bold mb-1">RESULTADOS ESPERADOS</p>
                    <p className="text-slate-400 text-sm">{p.expected_results}</p>
                  </div>
                )}
              </motion.div>
            )
          })}
        </div>
      </div>

      <footer className="border-t border-slate-800 mt-20 py-8 text-center text-slate-500 text-sm">
        <p>NeuroArt DApp 2026 · Tales Hack & Prof. Alexandre de Souza Fortis · Base L2</p>
      </footer>
    </main>
  )
}
