"use client"
import { useState } from "react"
import { useAccount, useWriteContract, useWaitForTransactionReceipt } from "wagmi"
import { parseUnits, parseEther } from "viem"

const MARKETPLACE_ADDRESS = (process.env.NEXT_PUBLIC_MARKETPLACE_ADDRESS || "0x0") as `0x\${string}`
const USDC_ADDRESS = "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913" as `0x\${string}`

const MARKETPLACE_ABI = [
  {
    name: "buyWithUSDC",
    type: "function",
    inputs: [
      { name: "obraId", type: "uint256" },
      { name: "amount", type: "uint256" }
    ],
    outputs: [],
    stateMutability: "nonpayable"
  },
  {
    name: "buyWithETH",
    type: "function",
    inputs: [
      { name: "obraId", type: "uint256" },
      { name: "amount", type: "uint256" }
    ],
    outputs: [],
    stateMutability: "payable"
  }
] as const

const ERC20_ABI = [
  {
    name: "approve",
    type: "function",
    inputs: [
      { name: "spender", type: "address" },
      { name: "amount", type: "uint256" }
    ],
    outputs: [{ type: "bool" }],
    stateMutability: "nonpayable"
  }
] as const

interface BuyButtonProps {
  obraId: string
  totalFractions: number
  priceUSDC: number
  priceETH: number
}

export function BuyButton({ obraId, totalFractions, priceUSDC, priceETH }: BuyButtonProps) {
  const { isConnected } = useAccount()
  const [qty, setQty] = useState(1)
  const [currency, setCurrency] = useState<"USDC" | "ETH">("USDC")
  const [step, setStep] = useState<"idle" | "approving" | "buying" | "done" | "error">("idle")
  const [showModal, setShowModal] = useState(false)

  const { writeContractAsync } = useWriteContract()

  const totalUSDC = (priceUSDC * qty).toFixed(2)
  const totalETH = (priceETH * qty).toFixed(6)

  const handleBuy = async () => {
    if (!isConnected) return
    try {
      await (window as any).ethereum.request({ method: "eth_requestAccounts" })
    } catch (e) {
      setStep("error")
      return
    }
    setStep("approving")
    try {
      const obraIdBig = BigInt(obraId)
      const amountBig = BigInt(qty) * BigInt("1000000000000000000")

      if (currency === "USDC") {
        const usdcAmount = parseUnits((priceUSDC * qty).toFixed(6), 6)
        await writeContractAsync({
          address: USDC_ADDRESS,
          abi: ERC20_ABI,
          functionName: "approve",
          args: [MARKETPLACE_ADDRESS, usdcAmount]
        })
        setStep("buying")
        await writeContractAsync({
          address: MARKETPLACE_ADDRESS,
          abi: MARKETPLACE_ABI,
          functionName: "buyWithUSDC",
          args: [obraIdBig, amountBig]
        })
      } else {
        setStep("buying")
        await writeContractAsync({
          address: MARKETPLACE_ADDRESS,
          abi: MARKETPLACE_ABI,
          functionName: "buyWithETH",
          args: [obraIdBig, amountBig],
          value: parseEther((priceETH * qty).toFixed(18))
        })
      }
      setStep("done")
    } catch (e) {
      console.error(e)
      setStep("error")
    }
  }

  if (!isConnected) return (
    <button disabled className="px-5 py-2.5 bg-slate-700 text-slate-400 rounded-xl text-sm font-bold cursor-not-allowed">
      Conecte a carteira
    </button>
  )

  return (
    <>
      <button
        onClick={() => setShowModal(true)}
        className="px-5 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl text-sm font-bold hover:from-indigo-500 hover:to-purple-500 transition-all"
      >
        Adquirir Fracoes
      </button>

      {showModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl p-6 w-full max-w-md">
            <h3 className="text-white font-black text-xl mb-6">Adquirir Fracoes</h3>

            {step === "done" ? (
              <div className="text-center py-8">
                <div className="text-4xl mb-4">✅</div>
                <p className="text-white font-bold text-lg">Compra realizada!</p>
                <p className="text-slate-400 text-sm mt-2">As fracoes foram transferidas para sua carteira.</p>
                <button onClick={() => { setShowModal(false); setStep("idle") }}
                  className="mt-6 px-6 py-2.5 bg-indigo-600 text-white rounded-xl font-bold">
                  Fechar
                </button>
              </div>
            ) : step === "error" ? (
              <div className="text-center py-8">
                <div className="text-4xl mb-4">❌</div>
                <p className="text-white font-bold">Erro na transacao</p>
                <button onClick={() => setStep("idle")}
                  className="mt-4 px-6 py-2.5 bg-slate-700 text-white rounded-xl font-bold">
                  Tentar novamente
                </button>
              </div>
            ) : (
              <>
                <div className="space-y-4 mb-6">
                  <div>
                    <label className="text-slate-400 text-sm mb-2 block">Quantidade de fracoes</label>
                    <div className="flex items-center gap-3">
                      <button onClick={() => setQty(Math.max(1, qty-1))}
                        className="w-8 h-8 rounded-lg bg-slate-800 text-white font-bold">-</button>
                      <span className="text-white font-bold text-xl w-12 text-center">{qty}</span>
                      <button onClick={() => setQty(Math.min(totalFractions, qty+1))}
                        className="w-8 h-8 rounded-lg bg-slate-800 text-white font-bold">+</button>
                    </div>
                  </div>

                  <div>
                    <label className="text-slate-400 text-sm mb-2 block">Moeda de pagamento</label>
                    <div className="flex gap-2">
                      <button onClick={() => setCurrency("USDC")}
                        className={`px-4 py-2 rounded-xl text-sm font-bold border transition-all \${currency === "USDC" ? "bg-indigo-600 border-indigo-500 text-white" : "bg-slate-800 border-slate-700 text-slate-400"}`}>
                        USDC
                      </button>
                      <button onClick={() => setCurrency("ETH")}
                        className={`px-4 py-2 rounded-xl text-sm font-bold border transition-all \${currency === "ETH" ? "bg-indigo-600 border-indigo-500 text-white" : "bg-slate-800 border-slate-700 text-slate-400"}`}>
                        ETH
                      </button>
                    </div>
                  </div>

                  <div className="bg-slate-800/60 rounded-xl p-4">
                    <div className="flex justify-between text-sm mb-2">
                      <span className="text-slate-400">Total a pagar</span>
                      <span className="text-white font-bold">
                        {currency === "USDC" ? `\${totalUSDC} USDC` : `\${totalETH} ETH`}
                      </span>
                    </div>
                    <div className="flex justify-between text-xs text-slate-500">
                      <span>Split automatico</span>
                      <span>80% artista · 20% DApp</span>
                    </div>
                  </div>
                </div>

                <div className="flex gap-3">
                  <button onClick={() => setShowModal(false)}
                    className="flex-1 px-4 py-2.5 bg-slate-800 text-slate-400 rounded-xl font-bold hover:bg-slate-700 transition-all">
                    Cancelar
                  </button>
                  <button onClick={handleBuy} disabled={step !== "idle"}
                    className="flex-1 px-4 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl font-bold disabled:opacity-50">
                    {step === "approving" ? "Aprovando..." : step === "buying" ? "Comprando..." : "Confirmar"}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </>
  )
}
