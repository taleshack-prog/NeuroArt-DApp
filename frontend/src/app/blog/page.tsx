'use client'

import { motion } from "framer-motion"
import { Brain, ArrowLeft, BookOpen, Calendar, Tag } from "lucide-react"
import Link from "next/link"
import { useState, useEffect } from "react"

const CATEGORIES = ["Todas", "Arte & Criatividade", "Jiu-Jitsu & Neurociencia", "Neurodivergencia", "Natureza como Terapia", "Novidades NeuroArt", "Papers & Pesquisas"]

export default function BlogPage() {
  const [posts, setPosts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [category, setCategory] = useState("Todas")

  useEffect(() => {
    fetch("/api/posts")
      .then(r => r.json())
      .then(data => { setPosts(Array.isArray(data) ? data : []); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  const filtered = category === "Todas" ? posts : posts.filter(p => p.category === category)

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-950 via-indigo-950/10 to-slate-950 text-white">
      <header className="border-b border-slate-800 bg-slate-950/80 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-5xl mx-auto px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <Link href="/" className="text-slate-400 hover:text-white transition-colors">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div className="flex items-center gap-3">
              <Brain className="text-indigo-500 w-7 h-7" />
              <span className="text-lg font-black bg-gradient-to-r from-indigo-400 to-emerald-400 bg-clip-text text-transparent">
                NeuroArt Blog
              </span>
            </div>
          </div>
          <BookOpen className="w-5 h-5 text-slate-500" />
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-6 py-12">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-10">
          <h1 className="text-4xl font-black mb-3">Blog NeuroArt</h1>
          <p className="text-slate-400">Arte, ciencia, neurodiversidade e tudo que nos inspira.</p>
        </motion.div>

        <div className="flex gap-2 flex-wrap mb-8">
          {CATEGORIES.map(cat => (
            <button key={cat} onClick={() => setCategory(cat)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
                category === cat
                  ? "bg-indigo-600 border-indigo-500 text-white"
                  : "bg-slate-900 border-slate-800 text-slate-400 hover:border-indigo-500"
              }`}>
              {cat}
            </button>
          ))}
        </div>

        {loading && <div className="text-center py-20 text-slate-500">Carregando...</div>}

        {!loading && filtered.length === 0 && (
          <div className="text-center py-20 text-slate-500">Nenhum post nesta categoria ainda.</div>
        )}

        <motion.div
          variants={{ hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.1 } } }}
          initial="hidden" animate="show"
          className="grid grid-cols-1 md:grid-cols-2 gap-6"
        >
          {filtered.map(post => (
            <motion.article key={post.id}
              variants={{ hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } }}
              className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 hover:border-indigo-500/50 transition-all group"
            >
              <div className="flex items-center gap-2 mb-3">
                <span className="px-2 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/30 text-indigo-400 text-xs font-medium">
                  <Tag className="w-3 h-3 inline mr-1" />{post.category}
                </span>
              </div>
              <h2 className="text-xl font-black text-white mb-2 group-hover:text-indigo-400 transition-colors">
                {post.title}
              </h2>
              <p className="text-slate-400 text-sm leading-relaxed mb-4 line-clamp-3">{post.excerpt}</p>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs text-slate-500">
                  <Calendar className="w-3 h-3" />
                  {new Date(post.publishedAt).toLocaleDateString("pt-BR")}
                  <span className="mx-1">·</span>
                  <span>{post.author}</span>
                </div>
                <Link href={`/blog/${post.slug}`}
                  className="text-indigo-400 text-sm font-semibold hover:text-indigo-300 transition-colors">
                  Ler mais →
                </Link>
              </div>
            </motion.article>
          ))}
        </motion.div>
      </div>

      <footer className="border-t border-slate-800 mt-20 py-8 text-center text-slate-500 text-sm">
        <p>NeuroArt DApp © 2026 · Tales Hack & Prof. Alexandre de Souza Fortis · Base L2</p>
      </footer>
    </main>
  )
}
