"use client"
import { useEffect, useId, useRef, useState } from "react"
import { useAccount, useWriteContract } from "wagmi"
import { useConnectModal } from "@rainbow-me/rainbowkit"
import { parseUnits, parseEther } from "viem"

const MARKETPLACE_ADDRESS = (process.env.NEXT_PUBLIC_MARKETPLACE_ADDRESS || "0x0") as `0x${string}`
const USDC_ADDRESS = "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913" as `0x${string}`

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

// Anel de foco visível sobre fundos slate-900/950 (indigo-300 ≈ 9:1)
const FOCUS = "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-300 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900"

interface BuyButtonProps {
  obraId: string
  totalFractions: number
  priceUSDC: number
  priceETH: number
  /** Título da obra: torna o nome acessível do botão único ("Adquirir frações de <título>") */
  obraTitle?: string
}

export function BuyButton({ obraId, totalFractions, priceUSDC, priceETH, obraTitle }: BuyButtonProps) {
  const { isConnected } = useAccount()
  const { openConnectModal } = useConnectModal()
  const [qty, setQty] = useState(1)
  const [currency, setCurrency] = useState<"USDC" | "ETH">("USDC")
  const [step, setStep] = useState<"idle" | "approving" | "buying" | "done" | "error">("idle")
  const [showModal, setShowModal] = useState(false)
  const busy = step === "approving" || step === "buying"
  const busyRef = useRef(busy)
  busyRef.current = busy

  const dialogId = useId()
  const titleId = `${dialogId}-titulo`
  const qtyLabelId = `${dialogId}-qtd`
  const currencyLabelId = `${dialogId}-moeda`
  const triggerRef = useRef<HTMLButtonElement>(null)
  const dialogRef = useRef<HTMLDivElement>(null)

  const { writeContractAsync } = useWriteContract()

  const totalUSDC = (priceUSDC * qty).toFixed(2)
  const totalETH = (priceETH * qty).toFixed(6)

  const closeModal = () => {
    if (busyRef.current) return
    setShowModal(false)
    setStep("idle")
    triggerRef.current?.focus()
  }

  // Foco inicial no diálogo e Escape para fechar (bloqueado durante a transação)
  useEffect(() => {
    if (!showModal) return
    dialogRef.current?.focus()
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape" || busyRef.current) return
      setShowModal(false)
      setStep("idle")
      triggerRef.current?.focus()
    }
    document.addEventListener("keydown", onKey)
    return () => document.removeEventListener("keydown", onKey)
  }, [showModal])

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

  // Desconectado: botão ativo que abre o modal do RainbowKit (um botão `disabled` sai da ordem de Tab)
  if (!isConnected) return (
    <button
      type="button"
      onClick={openConnectModal}
      className={`min-h-[44px] px-5 py-2.5 bg-slate-700 text-slate-200 rounded-xl text-sm font-bold hover:bg-slate-600 transition-colors forced-colors:border forced-colors:border-[ButtonText] ${FOCUS}`}
    >
      Conecte a carteira{obraTitle && <span className="sr-only"> para adquirir frações de {obraTitle}</span>}
    </button>
  )

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setShowModal(true)}
        aria-haspopup="dialog"
        className={`min-h-[44px] px-5 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl text-sm font-bold hover:from-indigo-700 hover:to-purple-700 transition-colors forced-colors:border forced-colors:border-[ButtonText] ${FOCUS}`}
      >
        Adquirir frações{obraTitle && <span className="sr-only"> de {obraTitle}</span>}
      </button>

      {showModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div
            ref={dialogRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            tabIndex={-1}
            className="bg-slate-900 border border-slate-700 rounded-2xl p-6 w-full max-w-md focus:outline-none"
          >
            <h2 id={titleId} className="text-white font-black text-xl mb-6">
              Adquirir frações{obraTitle && <> de {obraTitle}</>}
            </h2>

            {step === "done" ? (
              <div role="status" className="text-center py-8">
                <div className="text-4xl mb-4" aria-hidden="true">✅</div>
                <p className="text-white font-bold text-lg">Compra realizada!</p>
                <p className="text-slate-300 text-sm mt-2">As frações foram transferidas para sua carteira.</p>
                <button type="button" onClick={closeModal}
                  className={`mt-6 min-h-[44px] px-6 py-2.5 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 ${FOCUS}`}>
                  Fechar
                </button>
              </div>
            ) : step === "error" ? (
              <div role="alert" className="text-center py-8">
                <div className="text-4xl mb-4" aria-hidden="true">❌</div>
                <p className="text-white font-bold">Erro na transação</p>
                <button type="button" onClick={() => setStep("idle")}
                  className={`mt-4 min-h-[44px] px-6 py-2.5 bg-slate-700 text-white rounded-xl font-bold hover:bg-slate-600 ${FOCUS}`}>
                  Tentar novamente
                </button>
              </div>
            ) : (
              <>
                <div className="space-y-4 mb-6">
                  <div role="group" aria-labelledby={qtyLabelId}>
                    <p id={qtyLabelId} className="text-slate-300 text-sm mb-2">Quantidade de frações</p>
                    <div className="flex items-center gap-3">
                      <button type="button" onClick={() => setQty(Math.max(1, qty - 1))}
                        aria-label="Diminuir quantidade"
                        className={`w-11 h-11 rounded-lg bg-slate-800 text-white font-bold hover:bg-slate-700 ${FOCUS}`}>-</button>
                      <output aria-live="polite" className="text-white font-bold text-xl w-12 text-center">{qty}</output>
                      <button type="button" onClick={() => setQty(Math.min(totalFractions, qty + 1))}
                        aria-label="Aumentar quantidade"
                        className={`w-11 h-11 rounded-lg bg-slate-800 text-white font-bold hover:bg-slate-700 ${FOCUS}`}>+</button>
                    </div>
                  </div>

                  <div role="group" aria-labelledby={currencyLabelId}>
                    <p id={currencyLabelId} className="text-slate-300 text-sm mb-2">Moeda de pagamento</p>
                    <div className="flex gap-2">
                      {(["USDC", "ETH"] as const).map(c => (
                        <button key={c} type="button" onClick={() => setCurrency(c)}
                          aria-pressed={currency === c}
                          className={`min-h-[44px] px-4 py-2 rounded-xl text-sm font-bold border transition-colors ${FOCUS} ${currency === c ? "bg-indigo-600 border-indigo-400 text-white" : "bg-slate-800 border-slate-700 text-slate-300 hover:border-indigo-400"}`}>
                          {c}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="bg-slate-800/60 rounded-xl p-4">
                    <div className="flex justify-between text-sm mb-2">
                      <span className="text-slate-300">Total a pagar</span>
                      <span className="text-white font-bold">
                        {currency === "USDC" ? `${totalUSDC} USDC` : `${totalETH} ETH`}
                      </span>
                    </div>
                    <div className="flex justify-between text-xs text-slate-300">
                      <span>Split automático</span>
                      <span>80% artista · 20% DApp</span>
                    </div>
                  </div>
                </div>

                <div className="flex gap-3">
                  <button type="button" onClick={closeModal} disabled={busy}
                    className={`flex-1 min-h-[44px] px-4 py-2.5 bg-slate-800 text-slate-200 rounded-xl font-bold hover:bg-slate-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${FOCUS}`}>
                    Cancelar
                  </button>
                  <button type="button" onClick={handleBuy} disabled={step !== "idle"}
                    className={`flex-1 min-h-[44px] px-4 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl font-bold disabled:opacity-50 ${FOCUS}`}>
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
