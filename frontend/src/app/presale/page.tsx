"use client"

import { motion } from "framer-motion"
import { Brain, ArrowLeft, Zap, Clock, Users, TrendingUp, CheckCircle, AlertCircle } from "lucide-react"
import Link from "next/link"
import { useState, useEffect } from "react"
import { useAccount, useWriteContract, useReadContract, useBalance } from "wagmi"
import { parseUnits, parseEther, formatUnits } from "viem"
import { WalletButton } from "@/components/WalletButton"

const PRESALE_ADDRESS = (process.env.NEXT_PUBLIC_PRESALE_ADDRESS || "0x0") as `0x${string}`
const USDC_ADDRESS = "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913" as `0x${string}`
const NEURO_ADDRESS = (process.env.NEXT_PUBLIC_NEURO_TOKEN_ADDRESS || "0x0") as `0x${string}`

const PRESALE_ABI = [
  { name: "buyWithUSDC", type: "function", inputs: [{ name: "amount", type: "uint256" }], outputs: [], stateMutability: "nonpayable" },
  { name: "buyWithETH", type: "function", inputs: [{ name: "amount", type: "uint256" }], outputs: [], stateMutability: "payable" },
  { name: "calculateCost", type: "function", inputs: [{ name: "amount", type: "uint256" }], outputs: [{ type: "uint256" }], stateMutability: "pure" },
  { name: "getPresaleInfo", type: "function", inputs: [], outputs: [
    { name: "_startTime", type: "uint256" },
    { name: "_endTime", type: "uint256" },
    { name: "_totalAvailable", type: "uint256" },
    { name: "_totalSold", type: "uint256" },
    { name: "_remaining", type: "uint256" },
    { name: "_isActive", type: "bool" },
  ], stateMutability: "view" },
  { name: "getWalletInfo", type: "function", inputs: [{ name: "wallet", type: "address" }], outputs: [
    { name: "_purchased", type: "uint256" },
    { name: "_remaining", type: "uint256" },
  ], stateMutability: "view" },
] as const

const ERC20_ABI = [
  { name: "approve", type: "function", inputs: [{ name: "spender", type: "address" }, { name: "amount", type: "uint256" }], outputs: [{ type: "bool" }], stateMutability: "nonpayable" },
] as const

function CountdownTimer({ endTime }: { endTime: number }) {
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 })

  useEffect(() => {
    const calc = () => {
      const now = Math.floor(Date.now() / 1000)
      const diff = endTime - now
      if (diff <= 0) return
      setTimeLeft({
        days: Math.floor(diff / 86400),
        hours: Math.floor((diff % 86400) / 3600),
        minutes: Math.floor((diff % 3600) / 60),
        seconds: diff % 60,
      })
    }
    calc()
    const id = setInterval(calc, 1000)
    return () => clearInterval(id)
  }, [endTime])

  return (
    <div className="flex gap-3 justify-center">
      {[
        { v: timeLeft.days, l: "Dias" },
        { v: timeLeft.hours, l: "Horas" },
        { v: timeLeft.minutes, l: "Min" },
        { v: timeLeft.seconds, l: "Seg" },
      ].map((t, i) => (
        <div key={i} className="bg-slate-900/80 border border-indigo-500/30 rounded-2xl p-4 min-w-[70px] text-center">
          <div className="text-3xl font-black text-indigo-400">{String(t.v).padStart(2, "0")}</div>
          <div className="text-slate-500 text-xs mt-1">{t.l}</div>
        </div>
      ))}
    </div>
  )
}

export default function PresalePage() {
  const { address, isConnected } = useAccount()
  const [amount, setAmount] = useState(200)
  const [currency, setCurrency] = useState<"USDC" | "ETH">("USDC")
  const [step, setStep] = useState<"idle" | "approving" | "buying" | "done" | "error">("idle")
  const [mounted, setMounted] = useState(false)

  useEffect(() => setMounted(true), [])

  const { data: presaleInfo } = useReadContract({
    address: PRESALE_ADDRESS,
    abi: PRESALE_ABI,
    functionName: "getPresaleInfo",
  })

  const { data: walletInfo } = useReadContract({
    address: PRESALE_ADDRESS,
    abi: PRESALE_ABI,
    functionName: "getWalletInfo",
    args: address ? [address] : undefined,
    query: { enabled: !!address },
  })

  const { data: costData } = useReadContract({
    address: PRESALE_ADDRESS,
    abi: PRESALE_ABI,
    functionName: "calculateCost",
    args: [parseEther(String(amount))],
  })

  const { writeContractAsync } = useWriteContract()

  const totalAvailable = presaleInfo ? Number(formatUnits(presaleInfo[2], 18)) : 2000000
  const totalSold = presaleInfo ? Number(formatUnits(presaleInfo[3], 18)) : 0
  const remaining = presaleInfo ? Number(formatUnits(presaleInfo[4], 18)) : 2000000
  const isActive = presaleInfo ? presaleInfo[5] : false
  const endTime = presaleInfo ? Number(presaleInfo[1]) : 1761004740
  const startTime = presaleInfo ? Number(presaleInfo[0]) : 1749513600

  const soldPct = (totalSold / totalAvailable) * 100
  const hasDiscount = amount >= 20000
  const basePrice = amount * 0.20
  const discountedPrice = hasDiscount ? basePrice * 0.95 : basePrice
  const savingsUSDC = hasDiscount ? basePrice - discountedPrice : 0

  const walletPurchased = walletInfo ? Number(formatUnits(walletInfo[0], 18)) : 0
  const walletRemaining = walletInfo ? Number(formatUnits(walletInfo[1], 18)) : 100000

  const now = Math.floor(Date.now() / 1000)
  const notStarted = now < startTime
  const ended = now > endTime

  const handleBuy = async () => {
    if (!isConnected || !address) return
    setStep("approving")
    try {
      const amountBig = parseEther(String(amount))

      if (currency === "USDC") {
        const usdcCost = costData || parseUnits(discountedPrice.toFixed(6), 6)
        await writeContractAsync({
          address: USDC_ADDRESS,
          abi: ERC20_ABI,
          functionName: "approve",
          args: [PRESALE_ADDRESS, usdcCost as bigint]
        })
        setStep("buying")
        await writeContractAsync({
          address: PRESALE_ADDRESS,
          abi: PRESALE_ABI,
          functionName: "buyWithUSDC",
          args: [amountBig]
        })
      } else {
        const ethCost = parseEther((discountedPrice / 2400).toFixed(18))
        setStep("buying")
        await writeContractAsync({
          address: PRESALE_ADDRESS,
          abi: PRESALE_ABI,
          functionName: "buyWithETH",
          args: [amountBig],
          value: ethCost
        })
      }
      setStep("done")
    } catch (e) {
      console.error(e)
      setStep("error")
    }
  }

  return (
    <main className="min-h-screen bg-slate-950 text-white overflow-x-hidden">
      {/* Background neural */}
      <div className="fixed inset-0 z-0">
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-950/30 via-slate-950 to-purple-950/20" />
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-indigo-500/5 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/5 rounded-full blur-3xl animate-pulse" style={{animationDelay: "1s"}} />
      </div>

      <header className="relative z-50 border-b border-white/5 bg-slate-950/70 backdrop-blur-2xl sticky top-0">
        <div className="max-w-6xl mx-auto px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <Link href="/" className="text-slate-400 hover:text-white transition-colors">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div className="flex items-center gap-3">
              <Brain className="text-indigo-400 w-7 h-7" />
              <span className="text-lg font-black bg-gradient-to-r from-indigo-400 to-emerald-400 bg-clip-text text-transparent">
                NeuroArt Pre-venda
              </span>
            </div>
          </div>
          <WalletButton />
        </div>
      </header>

      <div className="relative z-10 max-w-6xl mx-auto px-6 py-12">

        {/* Hero */}
        <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12">
          <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-indigo-500/40 bg-indigo-500/10 text-indigo-400 text-sm font-medium mb-6">
            <span className="w-2 h-2 rounded-full bg-indigo-400 animate-pulse" />
            Pre-venda oficial $NEURO · Base Mainnet
          </span>
          <h1 className="text-5xl md:text-7xl font-black mb-4 leading-none">
            <span className="text-white">Adquira</span>{" "}
            <span className="bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">$NEURO</span>
          </h1>
          <p className="text-slate-400 text-xl max-w-2xl mx-auto">
            Token de governanca do ecossistema NeuroArt. Arte que financia ciencia na blockchain Base.
          </p>
        </motion.div>

        {/* Countdown */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }} className="mb-10">
          {notStarted ? (
            <div className="text-center">
              <p className="text-slate-400 text-sm mb-4">Pre-venda abre em 10/06/2026</p>
              <CountdownTimer endTime={startTime} />
            </div>
          ) : ended ? (
            <div className="text-center py-6 bg-slate-900/60 border border-slate-800 rounded-2xl">
              <p className="text-slate-400 font-bold">Pre-venda encerrada</p>
            </div>
          ) : (
            <div className="text-center">
              <p className="text-slate-400 text-sm mb-4 flex items-center justify-center gap-2">
                <Clock className="w-4 h-4" /> Encerra em 20/10/2026
              </p>
              <CountdownTimer endTime={endTime} />
            </div>
          )}
        </motion.div>

        {/* Progress bar */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 mb-8">
          <div className="flex justify-between text-sm mb-3">
            <span className="text-slate-400">Tokens vendidos</span>
            <span className="text-white font-bold">{totalSold.toLocaleString()} / {totalAvailable.toLocaleString()} NEURO</span>
          </div>
          <div className="w-full bg-slate-800 rounded-full h-4 overflow-hidden">
            <motion.div
              className="bg-gradient-to-r from-indigo-500 via-purple-500 to-emerald-500 h-4 rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${soldPct}%` }}
              transition={{ duration: 1.5, ease: "easeOut" }}
            />
          </div>
          <div className="flex justify-between text-xs text-slate-500 mt-2">
            <span>{soldPct.toFixed(1)}% vendido</span>
            <span>{remaining.toLocaleString()} restantes</span>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

          {/* Formulario de compra */}
          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-slate-900/60 border border-slate-800 rounded-3xl p-8">

            <h2 className="text-2xl font-black mb-6">Comprar $NEURO</h2>

            {step === "done" ? (
              <div className="text-center py-8">
                <CheckCircle className="w-16 h-16 text-emerald-400 mx-auto mb-4" />
                <h3 className="text-2xl font-black text-white mb-2">Compra realizada!</h3>
                <p className="text-slate-400 mb-6">Os tokens NEURO foram transferidos para sua carteira.</p>
                <button onClick={() => setStep("idle")}
                  className="px-6 py-3 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-500 transition-all">
                  Comprar mais
                </button>
              </div>
            ) : (
              <>
                {/* Quantidade */}
                <div className="mb-6">
                  <label className="text-slate-400 text-sm mb-2 block">Quantidade de NEURO</label>
                  <div className="relative">
                    <input
                      type="number"
                      value={amount}
                      onChange={e => setAmount(Math.max(200, Math.min(100000, Number(e.target.value))))}
                      className="w-full bg-slate-800 border border-slate-700 rounded-2xl px-5 py-4 text-white text-2xl font-black focus:outline-none focus:border-indigo-500 transition-all"
                    />
                    <span className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-500 font-semibold">NEURO</span>
                  </div>
                  <div className="flex gap-2 mt-2">
                    {[200, 1000, 5000, 20000, 50000].map(v => (
                      <button key={v} onClick={() => setAmount(v)}
                        className={`px-3 py-1 rounded-xl text-xs font-bold border transition-all ${
                          amount === v ? "bg-indigo-600 border-indigo-500 text-white" : "bg-slate-800 border-slate-700 text-slate-400 hover:border-indigo-500"
                        }`}>
                        {v >= 1000 ? `${v/1000}K` : v}
                      </button>
                    ))}
                  </div>
                  <p className="text-slate-600 text-xs mt-2">Min: 200 · Max: 100.000 por carteira</p>
                </div>

                {/* Moeda */}
                <div className="mb-6">
                  <label className="text-slate-400 text-sm mb-2 block">Pagamento</label>
                  <div className="flex gap-2">
                    <button onClick={() => setCurrency("USDC")}
                      className={`flex-1 py-3 rounded-2xl font-bold border transition-all ${
                        currency === "USDC" ? "bg-indigo-600 border-indigo-500 text-white" : "bg-slate-800 border-slate-700 text-slate-400"
                      }`}>
                      USDC
                    </button>
                    <button onClick={() => setCurrency("ETH")}
                      className={`flex-1 py-3 rounded-2xl font-bold border transition-all ${
                        currency === "ETH" ? "bg-indigo-600 border-indigo-500 text-white" : "bg-slate-800 border-slate-700 text-slate-400"
                      }`}>
                      ETH
                    </button>
                  </div>
                </div>

                {/* Resumo */}
                <div className="bg-slate-800/60 rounded-2xl p-5 mb-6 space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-400">Preco por NEURO</span>
                    <span className="text-white font-semibold">$0.20 USDC</span>
                  </div>
                  {hasDiscount && (
                    <div className="flex justify-between text-sm">
                      <span className="text-emerald-400 flex items-center gap-1">
                        <CheckCircle className="w-3 h-3" /> Desconto 5%
                      </span>
                      <span className="text-emerald-400 font-semibold">-${savingsUSDC.toFixed(2)}</span>
                    </div>
                  )}
                  <div className="border-t border-slate-700 pt-3 flex justify-between">
                    <span className="text-white font-bold">Total</span>
                    <div className="text-right">
                      <div className="text-indigo-400 font-black text-xl">
                        {currency === "USDC"
                          ? `$${discountedPrice.toFixed(2)} USDC`
                          : `${(discountedPrice / 2400).toFixed(4)} ETH`}
                      </div>
                      {hasDiscount && (
                        <div className="text-emerald-400 text-xs">Voce economiza ${savingsUSDC.toFixed(2)}</div>
                      )}
                    </div>
                  </div>
                </div>

                {isConnected ? (
                  <button
                    onClick={handleBuy}
                    disabled={step !== "idle" || !isActive || amount < 200}
                    className="w-full py-4 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-2xl font-black text-lg hover:from-indigo-500 hover:to-purple-500 transition-all disabled:opacity-50 shadow-lg shadow-indigo-500/25">
                    {step === "approving" ? "Aprovando USDC..." :
                     step === "buying" ? "Comprando..." :
                     notStarted ? "Pre-venda nao iniciada" :
                     ended ? "Pre-venda encerrada" :
                     `Comprar ${amount.toLocaleString()} NEURO`}
                  </button>
                ) : (
                  <div className="text-center">
                    <p className="text-slate-500 text-sm mb-3">Conecte sua carteira para comprar</p>
                    <WalletButton />
                  </div>
                )}

                {step === "error" && (
                  <div className="mt-3 flex items-center gap-2 text-red-400 text-sm">
                    <AlertCircle className="w-4 h-4" />
                    Erro na transacao. Tente novamente.
                  </div>
                )}
              </>
            )}
          </motion.div>

          {/* Info lateral */}
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.5 }}
            className="space-y-4">

            {/* Detalhes da pre-venda */}
            <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-6">
              <h3 className="text-lg font-black mb-4 flex items-center gap-2">
                <Zap className="w-5 h-5 text-indigo-400" /> Detalhes da Pre-venda
              </h3>
              <div className="space-y-3">
                {[
                  { label: "Preco", value: "$0.20 USDC por NEURO" },
                  { label: "Minimo", value: "200 NEURO ($40)" },
                  { label: "Maximo", value: "100.000 NEURO ($20.000)" },
                  { label: "Desconto", value: "5% acima de 20.000 NEURO" },
                  { label: "Total", value: "2.000.000 NEURO" },
                  { label: "Abertura", value: "10/06/2026" },
                  { label: "Encerramento", value: "20/10/2026" },
                  { label: "Rede", value: "Base Mainnet (L2)" },
                ].map((item, i) => (
                  <div key={i} className="flex justify-between text-sm">
                    <span className="text-slate-500">{item.label}</span>
                    <span className="text-white font-semibold">{item.value}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Sua carteira */}
            {isConnected && mounted && (
              <div className="bg-slate-900/60 border border-indigo-500/30 rounded-3xl p-6">
                <h3 className="text-lg font-black mb-4 flex items-center gap-2">
                  <Users className="w-5 h-5 text-indigo-400" /> Sua Participacao
                </h3>
                <div className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-500">Ja comprou</span>
                    <span className="text-indigo-400 font-bold">{walletPurchased.toLocaleString()} NEURO</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-500">Ainda pode comprar</span>
                    <span className="text-emerald-400 font-bold">{walletRemaining.toLocaleString()} NEURO</span>
                  </div>
                  <div className="w-full bg-slate-800 rounded-full h-2 mt-2">
                    <div className="bg-indigo-500 h-2 rounded-full"
                      style={{ width: `${(walletPurchased / 100000) * 100}%` }} />
                  </div>
                </div>
              </div>
            )}

            {/* Por que comprar */}
            <div className="bg-gradient-to-br from-indigo-950/40 to-purple-950/40 border border-indigo-500/20 rounded-3xl p-6">
              <h3 className="text-lg font-black mb-4 flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-purple-400" /> Por que $NEURO?
              </h3>
              <ul className="space-y-2">
                {[
                  "Governanca do ecossistema NeuroArt",
                  "Acesso a pesquisas DeSci exclusivas",
                  "Participacao no fundo de arte",
                  "Mecanismo deflacionario (1% burn)",
                  "Airdrop para artistas neurodivergentes",
                  "Base L2 — taxas minimas",
                ].map((item, i) => (
                  <li key={i} className="flex items-center gap-2 text-slate-400 text-sm">
                    <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>

          </motion.div>
        </div>
      </div>

      <footer className="relative z-10 border-t border-slate-800 mt-20 py-8 text-center text-slate-500 text-sm">
        <p>NeuroArt DApp 2026 · Tales Hack & Prof. Alexandre de Souza Fortis · Porto Alegre/RS · Base L2</p>
        <p className="text-xs mt-2 text-slate-700">Este nao e um conselho de investimento. Leia o whitepaper antes de comprar.</p>
      </footer>
    </main>
  )
}
