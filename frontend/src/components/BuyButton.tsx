"use client"
/**
 * Compra de frações no FractionMarketplaceV2 (Base Mainnet).
 * - Preço, disponibilidade e cotação vêm do contrato (o que aparece é o que é cobrado).
 * - Funciona com qualquer carteira conectada pelo RainbowKit/wagmi (sem window.ethereum).
 * - Só mostra "Compra realizada" depois da confirmação on-chain de cada transação.
 */
import { useEffect, useId, useRef, useState } from "react"
import {
  useAccount, useBalance, useChainId, usePublicClient, useReadContract, useSwitchChain, useWriteContract,
} from "wagmi"
import { base } from "wagmi/chains"
import { useConnectModal } from "@rainbow-me/rainbowkit"
import {
  BASESCAN, ERC20_ABI, MARKETPLACE_V2, MARKETPLACE_V2_ABI, ONE_FRACTION, USDC_BASE,
  fmtEth, fmtUsdc, friendlyError,
} from "@/lib/marketplaceV2"
import type { ListingV2 } from "@/hooks/useListingV2"

// Anel de foco visível sobre fundos slate-900/950 (indigo-300 ≈ 9:1)
const FOCUS = "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-300 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900"
const PILL = "inline-flex items-center min-h-[44px] px-4 py-2 rounded-xl text-xs font-semibold border"

type Step = "idle" | "switching" | "approving" | "buying" | "done" | "error"

interface BuyButtonProps {
  obraId: string
  /** Título da obra: torna o nome acessível do botão único ("Adquirir frações de <título>") */
  obraTitle?: string
  listing: ListingV2
}

export function BuyButton({ obraId, obraTitle, listing }: BuyButtonProps) {
  const { address, isConnected } = useAccount()
  const chainId = useChainId()
  const { switchChainAsync } = useSwitchChain()
  const { openConnectModal } = useConnectModal()
  const client = usePublicClient({ chainId: base.id })
  const { writeContractAsync } = useWriteContract()

  const [qty, setQty] = useState(1)
  const [currency, setCurrency] = useState<"USDC" | "ETH">("USDC")
  const [step, setStep] = useState<Step>("idle")
  const [errorMsg, setErrorMsg] = useState("")
  const [txHash, setTxHash] = useState<`0x${string}` | null>(null)
  const [showModal, setShowModal] = useState(false)
  const busy = step === "switching" || step === "approving" || step === "buying"
  const busyRef = useRef(busy)
  busyRef.current = busy

  const dialogId = useId()
  const titleId = `${dialogId}-titulo`
  const qtyLabelId = `${dialogId}-qtd`
  const currencyLabelId = `${dialogId}-moeda`
  const triggerRef = useRef<HTMLButtonElement>(null)
  const dialogRef = useRef<HTMLDivElement>(null)
  const statusRef = useRef<HTMLDivElement>(null)

  const maxQty = Math.max(0, Math.floor(listing.available))
  const id = BigInt(obraId)
  const amount = BigInt(qty) * ONE_FRACTION
  const mp = { address: MARKETPLACE_V2, abi: MARKETPLACE_V2_ABI, chainId: base.id } as const

  const quoteUsdc = useReadContract({
    ...mp, functionName: "quoteUSDC", args: [id, amount],
    query: { enabled: showModal },
  })
  const quoteEth = useReadContract({
    ...mp, functionName: "quoteETH", args: [id, amount],
    query: { enabled: showModal && currency === "ETH", refetchInterval: 15_000 },
  })
  const usdcBal = useReadContract({
    address: USDC_BASE, abi: ERC20_ABI, chainId: base.id, functionName: "balanceOf",
    args: [address ?? "0x0000000000000000000000000000000000000000"],
    query: { enabled: showModal && !!address },
  })
  const ethBal = useBalance({ address, chainId: base.id, query: { enabled: showModal && !!address } })

  const ethValue = quoteEth.data ? (quoteEth.data * BigInt(102)) / BigInt(100) : undefined // 2% de folga; o contrato devolve o excesso
  const insufficient =
    currency === "USDC"
      ? quoteUsdc.data !== undefined && usdcBal.data !== undefined && usdcBal.data < quoteUsdc.data
      : ethValue !== undefined && ethBal.data !== undefined && ethBal.data.value < ethValue

  const closeModal = () => {
    if (busyRef.current) return
    setShowModal(false)
    setStep("idle")
    setErrorMsg("")
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
      setErrorMsg("")
      triggerRef.current?.focus()
    }
    document.addEventListener("keydown", onKey)
    return () => document.removeEventListener("keydown", onKey)
  }, [showModal])

  // Durante e depois da transação, o foco vai para a mensagem de status (os botões ficam desabilitados)
  useEffect(() => {
    if (step !== "idle") statusRef.current?.focus()
  }, [step])

  async function wait(hash: `0x${string}`) {
    if (!client) throw new Error("Sem conexão com a rede Base.")
    const rc = await client.waitForTransactionReceipt({ hash })
    if (rc.status !== "success") throw new Error("A transação foi revertida pela rede.")
  }

  const handleBuy = async () => {
    if (!isConnected || !address || busyRef.current) return
    setErrorMsg("")
    setTxHash(null)
    try {
      if (chainId !== base.id) {
        setStep("switching")
        await switchChainAsync({ chainId: base.id })
      }

      if (currency === "USDC") {
        const quote = (await quoteUsdc.refetch()).data
        if (!quote) throw new Error("Não foi possível obter o preço em USDC.")
        const allowance = await client!.readContract({
          address: USDC_BASE, abi: ERC20_ABI, functionName: "allowance", args: [address, MARKETPLACE_V2],
        })
        if (allowance < quote) {
          setStep("approving")
          await wait(await writeContractAsync({
            address: USDC_BASE, abi: ERC20_ABI, functionName: "approve",
            args: [MARKETPLACE_V2, quote], chainId: base.id,
          }))
        }
        setStep("buying")
        const hash = await writeContractAsync({ ...mp, functionName: "buyWithUSDC", args: [id, amount, quote] })
        await wait(hash)
        setTxHash(hash)
      } else {
        const quote = (await quoteEth.refetch()).data
        if (!quote) throw new Error("Cotação do ETH indisponível no momento. Tente pagar em USDC.")
        setStep("buying")
        const hash = await writeContractAsync({
          ...mp, functionName: "buyWithETH", args: [id, amount], value: (quote * BigInt(102)) / BigInt(100),
        })
        await wait(hash)
        setTxHash(hash)
      }

      setStep("done")
      listing.refetch()
    } catch (e) {
      console.error(e)
      setErrorMsg(friendlyError(e))
      setStep("error")
    }
  }

  // ---- estados sem compra possível (não abrem o diálogo)
  if (!listing.loaded) return <span className={`${PILL} bg-slate-800 border-slate-700 text-slate-300`}>Carregando…</span>
  if (!listing.active) return <span className={`${PILL} bg-slate-800 border-slate-700 text-slate-300`}>Em breve</span>
  if (listing.paused) return <span className={`${PILL} bg-amber-500/10 border-amber-500/40 text-amber-300`}>Vendas em breve</span>
  if (!listing.fresh) return <span className={`${PILL} bg-amber-500/10 border-amber-500/40 text-amber-300`}>Preço em atualização</span>
  if (maxQty < 1) return <span className={`${PILL} bg-slate-800 border-slate-700 text-slate-300`}>Esgotada</span>

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

  const total =
    currency === "USDC"
      ? quoteUsdc.data !== undefined ? `${fmtUsdc(quoteUsdc.data)} USDC` : "…"
      : ethValue !== undefined ? `até ${fmtEth(ethValue)} ETH` : quoteEth.isError ? "indisponível" : "…"

  const stepText: Record<Step, string> = {
    idle: "",
    switching: "Troque para a rede Base na sua carteira…",
    approving: "Passo 1 de 2: autorize o uso do USDC na sua carteira e aguarde a confirmação…",
    buying: currency === "USDC"
      ? "Passo 2 de 2: confirme a compra na sua carteira e aguarde a confirmação…"
      : "Confirme a compra na sua carteira e aguarde a confirmação…",
    done: "",
    error: "",
  }

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        onClick={() => { setQty(1); setShowModal(true) }}
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
              <div ref={statusRef} tabIndex={-1} role="status" className="text-center py-8 focus:outline-none">
                <div className="text-4xl mb-4" aria-hidden="true">✅</div>
                <p className="text-white font-bold text-lg">Compra confirmada!</p>
                <p className="text-slate-300 text-sm mt-2">
                  {qty} {qty === 1 ? "fração foi transferida" : "frações foram transferidas"} para sua carteira.
                </p>
                {txHash && (
                  <a href={`${BASESCAN}/tx/${txHash}`} target="_blank" rel="noopener noreferrer"
                    className={`inline-block mt-3 text-sm text-indigo-300 hover:underline rounded ${FOCUS}`}>
                    Ver transação no BaseScan<span className="sr-only"> (abre em nova aba)</span>
                  </a>
                )}
                <div>
                  <button type="button" onClick={closeModal}
                    className={`mt-6 min-h-[44px] px-6 py-2.5 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 ${FOCUS}`}>
                    Fechar
                  </button>
                </div>
              </div>
            ) : step === "error" ? (
              <div ref={statusRef} tabIndex={-1} role="alert" className="text-center py-8 focus:outline-none">
                <div className="text-4xl mb-4" aria-hidden="true">❌</div>
                <p className="text-white font-bold">A compra não foi concluída</p>
                <p className="text-slate-300 text-sm mt-2">{errorMsg}</p>
                <div className="flex justify-center gap-3 mt-6">
                  <button type="button" onClick={closeModal}
                    className={`min-h-[44px] px-6 py-2.5 bg-slate-800 text-slate-200 rounded-xl font-bold hover:bg-slate-700 ${FOCUS}`}>
                    Fechar
                  </button>
                  <button type="button" onClick={() => { setStep("idle"); setErrorMsg("") }}
                    className={`min-h-[44px] px-6 py-2.5 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 ${FOCUS}`}>
                    Tentar novamente
                  </button>
                </div>
              </div>
            ) : (
              <>
                <div className="space-y-4 mb-6">
                  <div role="group" aria-labelledby={qtyLabelId}>
                    <p id={qtyLabelId} className="text-slate-300 text-sm mb-2">
                      Quantidade de frações <span className="text-slate-400">({maxQty.toLocaleString("pt-BR")} disponíveis)</span>
                    </p>
                    <div className="flex items-center gap-3">
                      <button type="button" onClick={() => setQty(q => Math.max(1, q - 1))} disabled={busy || qty <= 1}
                        aria-label="Diminuir quantidade"
                        className={`w-11 h-11 rounded-lg bg-slate-800 text-white font-bold hover:bg-slate-700 disabled:opacity-50 ${FOCUS}`}>-</button>
                      <output aria-live="polite" className="text-white font-bold text-xl w-16 text-center">{qty}</output>
                      <button type="button" onClick={() => setQty(q => Math.min(maxQty, q + 1))} disabled={busy || qty >= maxQty}
                        aria-label="Aumentar quantidade"
                        className={`w-11 h-11 rounded-lg bg-slate-800 text-white font-bold hover:bg-slate-700 disabled:opacity-50 ${FOCUS}`}>+</button>
                    </div>
                  </div>

                  <div role="group" aria-labelledby={currencyLabelId}>
                    <p id={currencyLabelId} className="text-slate-300 text-sm mb-2">Moeda de pagamento</p>
                    <div className="flex gap-2">
                      {(["USDC", "ETH"] as const).map(c => (
                        <button key={c} type="button" onClick={() => setCurrency(c)} disabled={busy}
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
                      <span className="text-white font-bold">{total}</span>
                    </div>
                    {currency === "ETH" && (
                      <p className="text-xs text-slate-300 mb-2">
                        Valor convertido pela cotação Chainlink, com 2% de margem. O que sobrar volta automaticamente para você.
                      </p>
                    )}
                    <div className="flex justify-between text-xs text-slate-300">
                      <span>Divisão automática</span>
                      <span>80% artista · 20% DApp</span>
                    </div>
                    <p className="text-xs text-slate-400 mt-2">Além do valor, a rede Base cobra uma pequena taxa (gás) em ETH.</p>
                  </div>

                  {insufficient && (
                    <p role="alert" className="text-sm text-amber-300">
                      Saldo de {currency} insuficiente na rede Base para este valor.
                    </p>
                  )}
                  {busy && (
                    <div ref={statusRef} tabIndex={-1} role="status" className="text-sm text-indigo-200 focus:outline-none">
                      {stepText[step]}
                    </div>
                  )}
                </div>

                <div className="flex gap-3">
                  <button type="button" onClick={closeModal} disabled={busy}
                    className={`flex-1 min-h-[44px] px-4 py-2.5 bg-slate-800 text-slate-200 rounded-xl font-bold hover:bg-slate-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${FOCUS}`}>
                    Cancelar
                  </button>
                  <button type="button" onClick={handleBuy}
                    disabled={busy || insufficient || (currency === "USDC" ? quoteUsdc.data === undefined : ethValue === undefined)}
                    className={`flex-1 min-h-[44px] px-4 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl font-bold disabled:opacity-50 disabled:cursor-not-allowed ${FOCUS}`}>
                    {step === "approving" ? "Autorizando…" : step === "buying" ? "Comprando…" : step === "switching" ? "Trocando rede…" : "Confirmar"}
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
