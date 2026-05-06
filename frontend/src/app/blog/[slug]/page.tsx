'use client'

import { motion } from "framer-motion"
import { Brain, ArrowLeft, Calendar, Tag, MessageCircle, Send } from "lucide-react"
import Link from "next/link"
import { useState, useEffect } from "react"
import { useAccount, useBalance } from "wagmi"

const NEURO_ADDRESS = (process.env.NEXT_PUBLIC_NEURO_TOKEN_ADDRESS || "0x0") as `0x${string}`

export default function PostPage({ params }: { params: { slug: string } }) {
  const [post, setPost] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [comment, setComment] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const { address, isConnected } = useAccount()
  const { data: neuroBalance } = useBalance({ address, token: NEURO_ADDRESS })

  const hasNeuro = isConnected && neuroBalance && Number(neuroBalance.formatted) > 0
  const canComment = hasNeuro

  useEffect(() => {
    fetch(`/api/posts/${params.slug}`)
      .then(r => r.json())
      .then(data => { setPost(data); setLoading(false) })
      .catch(() => setLoading(false))
  }, [params.slug])

  async function handleComment() {
    if (!comment.trim() || !canComment) return
    setSubmitting(true)
    await fetch(`/api/posts/${params.slug}/comments`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: comment, author: address?.slice(0,6) + "..." + address?.slice(-4), wallet: address })
    })
    setComment("")
    const updated = await fetch(`/api/posts/${params.slug}`).then(r => r.json())
    setPost(updated)
    setSubmitting(false)
  }

  if (loading) return <div className="min-h-screen bg-slate-950 flex items-center justify-center text-slate-500">Carregando...</div>
  if (!post) return <div className="min-h-screen bg-slate-950 flex items-center justify-center text-slate-500">Post nao encontrado.</div>

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-950 via-indigo-950/10 to-slate-950 text-white">
      <header className="border-b border-slate-800 bg-slate-950/80 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-3xl mx-auto px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <Link href="/blog" className="text-slate-400 hover:text-white transition-colors">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div className="flex items-center gap-3">
              <Brain className="text-indigo-500 w-7 h-7" />
              <span className="text-lg font-black bg-gradient-to-r from-indigo-400 to-emerald-400 bg-clip-text text-transparent">
                NeuroArt Blog
              </span>
            </div>
          </div>
        </div>
      </header>

      <article className="max-w-3xl mx-auto px-6 py-12">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <div className="flex items-center gap-2 mb-4">
            <span className="px-2 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/30 text-indigo-400 text-xs font-medium">
              <Tag className="w-3 h-3 inline mr-1" />{post.category}
            </span>
          </div>
          <h1 className="text-4xl font-black text-white mb-4 leading-tight">{post.title}</h1>
          <div className="flex items-center gap-3 text-slate-500 text-sm mb-8 pb-8 border-b border-slate-800">
            <Calendar className="w-4 h-4" />
            {new Date(post.publishedAt).toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" })}
            <span>·</span>
            <span className="text-indigo-400 font-semibold">{post.author}</span>
          </div>

          <div className="prose prose-invert max-w-none">
            {post.content.split("\n\n").map((paragraph: string, i: number) => (
              <p key={i} className="text-slate-300 leading-relaxed mb-4">{paragraph}</p>
            ))}
          </div>
        </motion.div>

        <div className="mt-12 pt-8 border-t border-slate-800">
          <h3 className="text-xl font-black mb-6 flex items-center gap-2">
            <MessageCircle className="w-5 h-5 text-indigo-400" />
            Comentarios ({post.comments?.length || 0})
          </h3>

          {post.comments?.length === 0 && (
            <p className="text-slate-600 text-sm mb-6">Seja o primeiro a comentar.</p>
          )}

          <div className="space-y-4 mb-8">
            {post.comments?.map((c: any) => (
              <div key={c.id} className="bg-slate-900/60 border border-slate-800 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-indigo-400 font-semibold text-sm font-mono">{c.author}</span>
                  <span className="text-slate-600 text-xs">
                    {new Date(c.createdAt).toLocaleDateString("pt-BR")}
                  </span>
                </div>
                <p className="text-slate-300 text-sm">{c.text}</p>
              </div>
            ))}
          </div>

          {canComment ? (
            <div className="flex gap-3">
              <input
                value={comment}
                onChange={e => setComment(e.target.value)}
                placeholder="Escreva seu comentario..."
                className="flex-1 bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-indigo-500"
              />
              <button onClick={handleComment} disabled={submitting || !comment.trim()}
                className="px-4 py-3 bg-indigo-600 text-white rounded-xl hover:bg-indigo-500 transition-all disabled:opacity-50">
                <Send className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="bg-slate-900/40 border border-slate-800 rounded-xl p-4 text-center">
              <p className="text-slate-500 text-sm">
                {isConnected
                  ? "Voce precisa ter $NEURO para comentar."
                  : "Conecte sua carteira com $NEURO para comentar."}
              </p>
            </div>
          )}
        </div>
      </article>

      <footer className="border-t border-slate-800 mt-20 py-8 text-center text-slate-500 text-sm">
        <p>NeuroArt DApp © 2026 · Tales Hack & Prof. Alexandre de Souza Fortis · Base L2</p>
      </footer>
    </main>
  )
}
