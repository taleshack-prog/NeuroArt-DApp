"use client"

import { motion } from "framer-motion"
import { Brain, ArrowLeft, ArrowUpDown, TrendingUp, Droplets, Info, CheckCircle, AlertCircle } from "lucide-react"
import Link from "next/link"
import { useState, useEffect } from "react"
import { useAccount, useWriteContract, useReadContract, useBalance } from "wagmi"
import { parseEther, formatEther } from "viem"
import { WalletButton } from "@/components/WalletButton"

const ROUTER_ADDRESS  = (process.env.NEXT_PUBLIC_AMM_ROUTER_ADDRESS  || "0x0") as `0x${string}`
const FACTORY_ADDRESS = (process.env.NEXT_PUBLIC_AMM_FACTORY_ADDRESS || "0x0") as `0x${string}`
const NEURO_ADDRESS   = (process.env.NEXT_PUBLIC_NEURO_TOKEN_ADDRESS || "0x0") as `0x${string}`
const VAULT_EL_OLVIDAO = "0xC7Ac2946fB70847b6531d93573d0b8d868fbFe05" as `0x${string}`

const ROUTER_ABI = [
  { name: "swapNEUROForFraction", type: "function", inputs: [
    { name: "obraToken", type: "address" },
    { name: "amountNEURO", type: "uint256" },
    { name: "minFractionsOut", type: "uint256" }
  ], outputs: [{ type: "uint256" }], stateMutability: "nonpayable" },
  { name: "swapFractionForNEURO", type: "function", inputs: [
    { name: "obraToken", type: "address" },
    { name: "amountFractions", type: "uint256" },
    { name: "minNEUROOut", type: "uint256" }
  ], outputs: [{ type: "uint256" }], stateMutability: "nonpayable" },
  { name: "getAmountOut", type: "function", inputs: [
    { name: "obraToken", type: "address" },
    { name: "amountIn", type: "uint256" },
    { name: "neuroForFraction", type: "bool" }
  ], outputs: [{ type: "uint256" }], stateMutability: "view" },
  { name: "getReserves", type: "function", inputs: [
    { name: "obraToken", type: "address" }
  ], outputs: [{ name: "rFractions", type: "uint256" }, { name: "rNeuro", type: "uint256" }], stateMutability: "view" },
  { name: "getPrice", type: "function", inputs: [
    { name: "obraToken", type: "address" }
  ], outputs: [{ type: "uint256" }], stateMutability: "view" },
] as const

const ERC20_ABI = [
  { name: "approve", type: "function", inputs: [
    { name: "spender", type: "address" },
    { name: "amount", type: "uint256" }
  ], outputs: [{ type: "bool" }], stateMutability: "nonpayable" },
  { name: "balanceOf", type: "function", inputs: [{ name: "account", type: "address" }], outputs: [{ type: "uint256" }], stateMutability: "view" },
] as const

export default function MarketplacePage() {
  const { address, isConnected } = useAccount()
  const [direction, setDirection] = useState<"buy" | "sell">("buy")
  const [amount, setAmount] = useState("")
  const [step, setStep] = useState<"idle" | "approving" | "swapping" | "done" | "error">("idle")
  const [mounted, setMounted] = useState(false)

  useEffect(() => setMounted(true), [])

  const { data: reserves } = useReadContract({
    address: ROUTER_ADDRESS,
    abi: ROUTER_ABI,
    functionName: "getReserves",
    args: [VAULT_EL_OLVIDAO],
  })

  const { data: priceData } = useReadContract({
    address: ROUTER_ADDRESS,
    abi: ROUTER_ABI,
    functionName: "getPrice",
    args: [VAULT_EL_OLVIDAO],
  })

  const amountBig = amount && !isNaN(Number(amount)) ? parseEther(amount) : BigInt(0)

  const { data: amountOut } = useReadContract({
    address: ROUTER_ADDRESS,
    abi: ROUTER_ABI,
    functionName: "getAmountOut",
    args: [VAULT_EL_OLVIDAO, amountBig, direction === "buy"],
    query: { enabled: amountBig > BigInt(0) },
  })

  const { data: neuroBalance } = useBalance({
    address,
    token: NEURO_ADDRESS,
    query: { enabled: !!address },
  })

  const { data: fractionBalance } = useReadContract({
    address: VAULT_EL_OLVIDAO,
    abi: ERC20_ABI,
    functionName: "balanceOf",
    args: address ? [address] : undefined,
    query: { enabled: !!address },
  })

  const { writeContractAsync } = useWriteContract()

  const rFractions = reserves ? Number(formatEther(reserves[0])) : 0
  const rNeuro     = reserves ? Number(formatEther(reserves[1])) : 0
  const price      = priceData ? Number(formatEther(priceData)) : 0
  const priceUSD   = price * 0.20
  const outputAmount = amountOut ? Number(formatEther(amountOut)) : 0

  const handleSwap = async () => {
    if (!isConnected || !amount || !address) return
    setStep("approving")
    try {
      const amountIn = parseEther(amount)
      const minOut = BigInt(0) // sem slippage protection no MVP

      if (direction === "buy") {
        // NEURO -> Fracao
        await writeContractAsync({
          address: NEURO_ADDRESS,
          abi: ERC20_ABI,
          functionName: "approve",
          args: [ROUTER_ADDRESS, amountIn]
        })
        setStep("swapping")
        await writeContractAsync({
          address: ROUTER_ADDRESS,
          abi: ROUTER_ABI,
          functionName: "swapNEUROForFraction",
          args: [VAULT_EL_OLVIDAO, amountIn, minOut]
        })
      } else {
        // Fracao -> NEURO
        await writeContractAsync({
          address: VAULT_EL_OLVIDAO,
          abi: ERC20_ABI,
          functionName: "approve",
          args: [ROUTER_ADDRESS, amountIn]
        })
        setStep("swapping")
        await writeContractAsync({
          address: ROUTER_ADDRESS,
          abi: ROUTER_ABI,
          functionName: "swapFractionForNEURO",
          args: [VAULT_EL_OLVIDAO, amountIn, minOut]
        })
      }
      setStep("done")
    } catch (e) {
      console.error(e)
      setStep("error")
    }
  }

  return (
    <main className="min-h-screen bg-slate-950 text-white">
      <header className="border-b border-slate-800 bg-slate-950/80 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <Link href="/" className="text-slate-400 hover:text-white transition-colors">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div className="flex items-center gap-3">
              <Brain className="text-indigo-400 w-7 h-7" />
              <span className="text-lg font-black bg-gradient-to-r from-indigo-400 to-emerald-400 bg-clip-text text-transparent">
                NeuroArt Marketplace
              </span>
            </div>
          </div>
          <WalletButton />
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-6 py-12">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-10">
          <h1 className="text-4xl font-black mb-2">Marketplace de Frações</h1>
          <p className="text-slate-400">Negocie frações de obras de arte neurodivergentes com $NEURO</p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

          {/* Swap Widget */}
          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}
            className="lg:col-span-2 bg-slate-900/60 border border-slate-800 rounded-3xl p-8">

            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-black">Swap</h2>
              <div className="flex gap-2">
                <button onClick={() => setDirection("buy")}
                  className={`px-4 py-2 rounded-xl text-sm font-bold border transition-all ${
                    direction === "buy" ? "bg-indigo-600 border-indigo-500 text-white" : "bg-slate-800 border-slate-700 text-slate-400"
                  }`}>
                  Comprar Frações
                </button>
                <button onClick={() => setDirection("sell")}
                  className={`px-4 py-2 rounded-xl text-sm font-bold border transition-all ${
                    direction === "sell" ? "bg-purple-600 border-purple-500 text-white" : "bg-slate-800 border-slate-700 text-slate-400"
                  }`}>
                  Vender Frações
                </button>
              </div>
            </div>

            {/* Obra info */}
            <div className="bg-slate-800/60 rounded-2xl p-4 mb-6 flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-white font-black text-lg">
                EO
              </div>
              <div>
                <div className="text-white font-bold">El Olvidao</div>
                <div className="text-slate-400 text-sm">100 frações · R$ 6.450 · Base Mainnet</div>
              </div>
              <div className="ml-auto text-right">
                <div className="text-indigo-400 font-black text-lg">{price.toFixed(4)} NEURO</div>
                <div className="text-slate-500 text-xs">por fração · ~${priceUSD.toFixed(4)}</div>
              </div>
            </div>

            {step === "done" ? (
              <div className="text-center py-8">
                <CheckCircle className="w-16 h-16 text-emerald-400 mx-auto mb-4" />
                <h3 className="text-2xl font-black mb-2">Swap realizado!</h3>
                <p className="text-slate-400 mb-6">Os tokens foram transferidos para sua carteira.</p>
                <button onClick={() => { setStep("idle"); setAmount("") }}
                  className="px-6 py-3 bg-indigo-600 rounded-xl font-bold hover:bg-indigo-500 transition-all">
                  Novo swap
                </button>
              </div>
            ) : (
              <>
                {/* Input */}
                <div className="space-y-3 mb-6">
                  <div className="bg-slate-800/60 rounded-2xl p-4">
                    <div className="flex justify-between text-sm text-slate-400 mb-2">
                      <span>Você paga</span>
                      <span>{direction === "buy" ? "NEURO" : "Frações El Olvidao"}</span>
                    </div>
                    <input
                      type="number"
                      value={amount}
                      onChange={e => setAmount(e.target.value)}
                      placeholder="0.0"
                      className="w-full bg-transparent text-3xl font-black text-white focus:outline-none"
                    />
                    {mounted && isConnected && (
                      <div className="text-slate-500 text-xs mt-2">
                        Saldo: {direction === "buy"
                          ? `${Number(neuroBalance?.formatted || 0).toFixed(2)} NEURO`
                          : `${Number(formatEther(fractionBalance || BigInt(0))).toFixed(4)} frações`
                        }
                      </div>
                    )}
                  </div>

                  <div className="flex justify-center">
                    <button onClick={() => setDirection(d => d === "buy" ? "sell" : "buy")}
                      className="p-2 bg-slate-800 border border-slate-700 rounded-xl hover:bg-slate-700 transition-all">
                      <ArrowUpDown className="w-5 h-5 text-slate-400" />
                    </button>
                  </div>

                  <div className="bg-slate-800/60 rounded-2xl p-4">
                    <div className="flex justify-between text-sm text-slate-400 mb-2">
                      <span>Você recebe (estimado)</span>
                      <span>{direction === "buy" ? "Frações El Olvidao" : "NEURO"}</span>
                    </div>
                    <div className="text-3xl font-black text-emerald-400">
                      {outputAmount > 0 ? outputAmount.toFixed(6) : "0.0"}
                    </div>
                  </div>
                </div>

                {/* Taxa info */}
                <div className="bg-slate-950/40 rounded-xl p-3 mb-6 text-xs text-slate-500 space-y-1">
                  <div className="flex justify-between">
                    <span>Taxa do artista</span><span className="text-slate-400">1%</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Taxa DAO</span><span className="text-slate-400">0.75%</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Taxa LPs</span><span className="text-slate-400">0.5%</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Fundo estratégico</span><span className="text-slate-400">0.25%</span>
                  </div>
                  <div className="flex justify-between border-t border-slate-800 pt-1 mt-1">
                    <span className="font-semibold text-slate-300">Total</span>
                    <span className="text-slate-300 font-semibold">2.5%</span>
                  </div>
                </div>

                {isConnected ? (
                  <button onClick={handleSwap}
                    disabled={step !== "idle" || !amount || Number(amount) <= 0}
                    className="w-full py-4 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-2xl font-black text-lg hover:from-indigo-500 hover:to-purple-500 transition-all disabled:opacity-50">
                    {step === "approving" ? "Aprovando..." :
                     step === "swapping" ? "Executando swap..." :
                     direction === "buy" ? "Comprar Frações" : "Vender Frações"}
                  </button>
                ) : (
                  <div className="text-center">
                    <p className="text-slate-500 text-sm mb-3">Conecte sua carteira para negociar</p>
                    <WalletButton />
                  </div>
                )}

                {step === "error" && (
                  <div className="mt-3 flex items-center gap-2 text-red-400 text-sm">
                    <AlertCircle className="w-4 h-4" /> Erro no swap. Tente novamente.
                  </div>
                )}
              </>
            )}
          </motion.div>

          {/* Pool Stats */}
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}
            className="space-y-4">

            <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-6">
              <h3 className="text-lg font-black mb-4 flex items-center gap-2">
                <Droplets className="w-5 h-5 text-indigo-400" /> Pool El Olvidao
              </h3>
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-400">Frações no pool</span>
                  <span className="text-white font-bold">{rFractions.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-400">NEURO no pool</span>
                  <span className="text-white font-bold">{rNeuro.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-400">Preco por fração</span>
                  <span className="text-indigo-400 font-bold">{price.toFixed(4)} NEURO</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-400">Preco em USD</span>
                  <span className="text-emerald-400 font-bold">${priceUSD.toFixed(4)}</span>
                </div>
                <div className="border-t border-slate-800 pt-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-400">Tipo</span>
                    <span className="text-white">AMM x*y=k</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-6">
              <h3 className="text-lg font-black mb-4 flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-emerald-400" /> Distribuicao de Taxas
              </h3>
              <div className="space-y-2">
                {[
                  { label: "Artista", pct: "1%", color: "bg-indigo-500" },
                  { label: "DAO", pct: "0.75%", color: "bg-purple-500" },
                  { label: "LPs", pct: "0.5%", color: "bg-emerald-500" },
                  { label: "Fundo Estrategico", pct: "0.25%", color: "bg-amber-500" },
                ].map((item, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <div className={`w-2 h-2 rounded-full ${item.color}`} />
                    <span className="text-slate-400 text-sm flex-1">{item.label}</span>
                    <span className="text-white text-sm font-semibold">{item.pct}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-indigo-950/20 border border-indigo-500/20 rounded-3xl p-6">
              <div className="flex items-start gap-2">
                <Info className="w-4 h-4 text-indigo-400 mt-0.5 shrink-0" />
                <p className="text-slate-400 text-xs leading-relaxed">
                  AMM de produto constante (x*y=k). Preco determinado automaticamente pela liquidez do pool. Sem ordem book — swaps instantâneos.
                </p>
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      <footer className="border-t border-slate-800 mt-20 py-8 text-center text-slate-500 text-sm">
        <p>NeuroArt DApp 2026 · Tales Hack & Prof. Alexandre de Souza Fortis · Porto Alegre/RS · Base L2</p>
      </footer>
    </main>
  )
}
