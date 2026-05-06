"use client"

import { motion, useScroll, useTransform } from "framer-motion"
import { WalletButton } from "@/components/WalletButton"
import { useAccount } from "wagmi"
import { Brain, Zap, FlaskConical, ArrowRight, Upload, BookOpen, Microscope, Users } from "lucide-react"
import Link from "next/link"
import { useState, useEffect, useRef } from "react"
import { isFounder } from "@/lib/constants"

function NeuralCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext("2d")
    if (!ctx) return

    canvas.width = window.innerWidth
    canvas.height = window.innerHeight

    const nodes: { x: number; y: number; vx: number; vy: number; r: number; pulse: number }[] = []
    const NUM_NODES = 60

    for (let i = 0; i < NUM_NODES; i++) {
      nodes.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        vx: (Math.random() - 0.5) * 0.4,
        vy: (Math.random() - 0.5) * 0.4,
        r: Math.random() * 2 + 1,
        pulse: Math.random() * Math.PI * 2,
      })
    }

    let animId: number
    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height)

      nodes.forEach(n => {
        n.x += n.vx
        n.y += n.vy
        n.pulse += 0.02
        if (n.x < 0 || n.x > canvas.width) n.vx *= -1
        if (n.y < 0 || n.y > canvas.height) n.vy *= -1
      })

      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          const dx = nodes[i].x - nodes[j].x
          const dy = nodes[i].y - nodes[j].y
          const dist = Math.sqrt(dx * dx + dy * dy)
          if (dist < 150) {
            const alpha = (1 - dist / 150) * 0.3
            ctx.beginPath()
            ctx.moveTo(nodes[i].x, nodes[i].y)
            ctx.lineTo(nodes[j].x, nodes[j].y)
            ctx.strokeStyle = `rgba(99, 102, 241, ${alpha})`
            ctx.lineWidth = 0.5
            ctx.stroke()
          }
        }
      }

      nodes.forEach(n => {
        const pulse = Math.sin(n.pulse) * 0.5 + 0.5
        ctx.beginPath()
        ctx.arc(n.x, n.y, n.r + pulse, 0, Math.PI * 2)
        ctx.fillStyle = `rgba(99, 102, 241, ${0.4 + pulse * 0.4})`
        ctx.fill()

        ctx.beginPath()
        ctx.arc(n.x, n.y, n.r * 3, 0, Math.PI * 2)
        ctx.fillStyle = `rgba(99, 102, 241, ${0.05 * pulse})`
        ctx.fill()
      })

      animId = requestAnimationFrame(draw)
    }

    draw()

    const handleResize = () => {
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight
    }
    window.addEventListener("resize", handleResize)

    return () => {
      cancelAnimationFrame(animId)
      window.removeEventListener("resize", handleResize)
    }
  }, [])

  return (
    <canvas ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-0 opacity-40" />
  )
}

const NAV_LINKS = [
  { href: "/gallery", label: "Galeria" },
  { href: "/whitepaper", label: "Whitepaper" },
  { href: "/research", label: "Pesquisa" },
  { href: "/blog", label: "Blog" },
  { href: "/research/approved", label: "DeSci" },
]

export default function Home() {
  const { address, isConnected } = useAccount()
  const [mounted, setMounted] = useState(false)
  const [artists, setArtists] = useState<any[]>([])
  const { scrollY } = useScroll()
  const heroY = useTransform(scrollY, [0, 500], [0, -150])
  const heroOpacity = useTransform(scrollY, [0, 300], [1, 0])

  useEffect(() => {
    setMounted(true)
    fetch("/api/submissions")
      .then(r => r.json())
      .then(data => {
        if (Array.isArray(data)) {
          const map = new Map()
          data.filter(s => s.status === "tokenized" || s.status === "approved").forEach(s => {
            if (!map.has(s.artistWallet)) {
              map.set(s.artistWallet, { name: s.artistName, wallet: s.artistWallet, obras: 0 })
            }
            map.get(s.artistWallet).obras++
          })
          setArtists(Array.from(map.values()).slice(0, 6))
        }
      })
      .catch(() => {})
  }, [])

  const founder = mounted && isConnected && address && isFounder(address)

  return (
    <main className="min-h-screen bg-slate-950 text-white overflow-x-hidden">
      <NeuralCanvas />

      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 border-b border-white/5 bg-slate-950/70 backdrop-blur-2xl">
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}
            className="flex items-center gap-3">
            <div className="relative">
              <Brain className="text-indigo-400 w-8 h-8" />
              <div className="absolute inset-0 animate-ping opacity-20">
                <Brain className="text-indigo-400 w-8 h-8" />
              </div>
            </div>
            <span className="text-xl font-black bg-gradient-to-r from-indigo-400 via-purple-400 to-emerald-400 bg-clip-text text-transparent">
              NeuroArt DApp
            </span>
          </motion.div>

          <nav className="hidden md:flex items-center gap-1">
            {NAV_LINKS.map((link, i) => (
              <motion.div key={link.href}
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}>
                <Link href={link.href}
                  className="px-4 py-2 text-slate-400 hover:text-white text-sm font-medium transition-all hover:bg-white/5 rounded-xl">
                  {link.label}
                </Link>
              </motion.div>
            ))}
          </nav>

          <div className="flex items-center gap-3">
            {founder && (
              <Link href="/admin"
                className="hidden md:flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600/20 border border-indigo-500/40 text-indigo-400 rounded-xl text-xs font-semibold hover:bg-indigo-600/30 transition-all">
                Admin
              </Link>
            )}
            <WalletButton />
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative min-h-screen flex items-center justify-center pt-20">
        <motion.div style={{ y: heroY, opacity: heroOpacity }}
          className="relative z-10 text-center max-w-5xl mx-auto px-6">

          <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1, ease: "easeOut" }}
            className="mb-8">
            <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-indigo-500/40 bg-indigo-500/10 text-indigo-400 text-sm font-medium">
              <span className="w-2 h-2 rounded-full bg-indigo-400 animate-pulse" />
              Base L2 · DeSci · Neurodiversidade · On-chain
            </span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="text-6xl md:text-8xl font-black mb-6 leading-none tracking-tight">
            <span className="text-white">Arte que</span>
            <br />
            <span className="bg-gradient-to-r from-indigo-400 via-purple-400 to-emerald-400 bg-clip-text text-transparent">
              financia ciência
            </span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="text-slate-400 text-xl max-w-2xl mx-auto mb-4 leading-relaxed">
            Tokenização fracionada de obras de artistas neurodivergentes.
            Cada fração adquirida financia pesquisas bioinspiradas na rede Base.
          </motion.p>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
            className="text-slate-600 text-sm mb-12">
            Fundado por <span className="text-indigo-400 font-semibold">Tales Hack</span> & <span className="text-emerald-400 font-semibold">Prof. Alexandre de Souza Fortis</span>
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
            className="flex flex-wrap gap-3 justify-center">
            <Link href="/gallery"
              className="group flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-2xl font-bold text-lg hover:from-indigo-500 hover:to-purple-500 transition-all shadow-lg shadow-indigo-500/25 hover:shadow-indigo-500/40">
              Ver Galeria
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Link>
            <Link href="/whitepaper"
              className="flex items-center gap-2 px-8 py-4 bg-white/5 border border-white/10 rounded-2xl font-bold text-lg hover:bg-white/10 hover:border-white/20 transition-all backdrop-blur-sm">
              <BookOpen className="w-5 h-5 text-indigo-400" /> Whitepaper
            </Link>
            <Link href="/research"
              className="flex items-center gap-2 px-8 py-4 bg-purple-500/10 border border-purple-500/30 text-purple-400 rounded-2xl font-bold text-lg hover:bg-purple-500/20 transition-all">
              <Microscope className="w-5 h-5" /> Propor Pesquisa
            </Link>
            <Link href="/blog"
              className="flex items-center gap-2 px-8 py-4 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 rounded-2xl font-bold text-lg hover:bg-emerald-500/20 transition-all">
              <BookOpen className="w-5 h-5" /> Blog
            </Link>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.2 }}
            className="mt-16 flex justify-center">
            <div className="w-px h-16 bg-gradient-to-b from-indigo-500/50 to-transparent animate-pulse" />
          </motion.div>
        </motion.div>
      </section>

      {/* Cards dos pilares */}
      <section className="relative z-10 max-w-7xl mx-auto px-6 py-20">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12">
          <h2 className="text-3xl font-black mb-3">O ecossistema NeuroArt</h2>
          <p className="text-slate-500">Tres pilares que sustentam a economia criativa neurodivergente</p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            {
              icon: <Brain className="w-10 h-10" />,
              color: "indigo",
              title: "BCI & Neuroplasticidade",
              desc: "Interfaces cerebro-computador capturam estados de hiperfoco e fluxo criativo, gerando metadados unicos para cada obra tokenizada.",
              link: "/research",
              linkLabel: "Propor pesquisa"
            },
            {
              icon: <Zap className="w-10 h-10" />,
              color: "purple",
              title: "Tokenizacao Fracionada",
              desc: "ERC20 Vault com Threshold Redemption. Consolide 100% das fracoes de uma obra e resgate o ativo fisico — queima os tokens, entrega a obra.",
              link: "/gallery",
              linkLabel: "Ver galeria"
            },
            {
              icon: <FlaskConical className="w-10 h-10" />,
              color: "emerald",
              title: "DeSci Aplicada",
              desc: "Cada transacao no marketplace destina recursos ao Fundo de Pesquisa NeuroArt, financiando Jiu-Jitsu, BCI e protocolos nao medicamentosos.",
              link: "/whitepaper",
              linkLabel: "Ler whitepaper"
            },
          ].map((card, i) => (
            <motion.div key={i}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.15 }}
              whileHover={{ y: -8, scale: 1.02 }}
              className={`relative bg-slate-900/60 border border-${card.color}-500/20 rounded-3xl p-8 hover:border-${card.color}-500/50 transition-all backdrop-blur-sm group overflow-hidden`}>
              <div className={`absolute inset-0 bg-gradient-to-br from-${card.color}-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity`} />
              <div className={`text-${card.color}-400 mb-6`}>{card.icon}</div>
              <h3 className="text-xl font-black mb-3">{card.title}</h3>
              <p className="text-slate-400 text-sm leading-relaxed mb-6">{card.desc}</p>
              <Link href={card.link}
                className={`text-${card.color}-400 text-sm font-semibold hover:text-${card.color}-300 transition-colors flex items-center gap-1`}>
                {card.linkLabel} <ArrowRight className="w-3 h-3" />
              </Link>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Whitepaper CTA */}
      <section className="relative z-10 max-w-7xl mx-auto px-6 py-10">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="relative border border-indigo-500/20 rounded-3xl p-10 bg-gradient-to-r from-indigo-950/40 to-purple-950/40 backdrop-blur-sm overflow-hidden text-center">
          <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/5 to-purple-500/5" />
          <div className="relative z-10">
            <Brain className="w-12 h-12 text-indigo-400 mx-auto mb-4" />
            <h2 className="text-3xl font-black mb-3">Entenda a visao do projeto</h2>
            <p className="text-slate-400 max-w-xl mx-auto mb-8">
              Antes de investir, leia nosso Whitepaper. Um manifesto pela liberdade cognitiva — filosofia, ciencia e economia do NeuroArt.
            </p>
            <Link href="/whitepaper"
              className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-2xl font-bold hover:from-indigo-500 hover:to-purple-500 transition-all shadow-lg shadow-indigo-500/25">
              <BookOpen className="w-5 h-5" /> Ler o Whitepaper
            </Link>
          </div>
        </motion.div>
      </section>

      {/* Secao Artistas */}
      <section className="relative z-10 max-w-7xl mx-auto px-6 py-20">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12">
          <Users className="w-10 h-10 text-emerald-400 mx-auto mb-4" />
          <h2 className="text-3xl font-black mb-3">Artistas Neurodivergentes</h2>
          <p className="text-slate-500 max-w-xl mx-auto">
            Talentos que estao transformando sua neurologia unica em arte tokenizada na blockchain.
          </p>
        </motion.div>

        {artists.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            {artists.map((a, i) => (
              <motion.div key={i}
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5 hover:border-emerald-500/30 transition-all">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-emerald-500 flex items-center justify-center text-white font-black">
                    {a.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <div className="text-white font-bold">{a.name}</div>
                    {a.wallet && (
                      <div className="text-slate-600 text-xs font-mono">{a.wallet.slice(0,6)}...{a.wallet.slice(-4)}</div>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="px-2 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-semibold">
                    {a.obras} obra{a.obras > 1 ? "s" : ""} tokenizada{a.obras > 1 ? "s" : ""}
                  </span>
                </div>
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-slate-600 mb-6">Seja o primeiro artista neurodivergente na NeuroArt.</p>
          </div>
        )}

        <div className="text-center">
          <Link href="/submit"
            className="inline-flex items-center gap-2 px-8 py-4 bg-emerald-600/20 border border-emerald-500/40 text-emerald-400 rounded-2xl font-bold hover:bg-emerald-600/30 transition-all">
            <Upload className="w-5 h-5" /> Submeter Minha Obra
          </Link>
        </div>
      </section>

      {/* Stats */}
      <section className="relative z-10 max-w-7xl mx-auto px-6 py-10">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { value: "Base L2", label: "Blockchain" },
            { value: "ERC-20", label: "Padrao dos tokens" },
            { value: "80/20", label: "Split artista/DApp" },
            { value: "250K", label: "NEURO airdrop artistas" },
          ].map((stat, i) => (
            <motion.div key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="bg-slate-900/40 border border-slate-800 rounded-2xl p-5 text-center">
              <div className="text-2xl font-black text-indigo-400 mb-1">{stat.value}</div>
              <div className="text-slate-500 text-xs">{stat.label}</div>
            </motion.div>
          ))}
        </div>
      </section>

      <footer className="relative z-10 border-t border-slate-800 mt-20 py-8 text-center text-slate-500 text-sm">
        <p>NeuroArt DApp © 2026 · Tales Hack & Prof. Alexandre de Souza Fortis · Florianopolis/SC · Base L2</p>
      </footer>
    </main>
  )
}
