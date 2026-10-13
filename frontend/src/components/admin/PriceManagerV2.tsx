'use client'

/**
 * Admin › Preços v2
 * Atualiza o preço por fração (em USD) das obras listadas no FractionMarketplaceV2,
 * usando a cotação USD/BRL do momento. A transação é assinada pela carteira conectada
 * (MetaMask). O contrato só aceita setPrice de carteiras com FOUNDER_ROLE.
 */
import { useCallback, useEffect, useState } from 'react'
import { useAccount, useChainId, usePublicClient, useSwitchChain, useWriteContract } from 'wagmi'
import { base } from 'wagmi/chains'

const MARKETPLACE_V2 = '0xf85eBecbb310715785dd2AbF3257b2531DD3710E' as const
const SUBMISSIONS_URL = '/api/submissions'
const MAX_FX_DIVERGENCE = 0.01 // 1%
const WARN_CHANGE = 0.1 // pede confirmação extra se o preço mudar mais de 10%

const MARKETPLACE_ABI = [
  {
    type: 'function', name: 'getListing', stateMutability: 'view',
    inputs: [{ name: 'obraId', type: 'uint256' }],
    outputs: [{
      type: 'tuple', components: [
        { name: 'vault', type: 'address' },
        { name: 'artist', type: 'address' },
        { name: 'priceUsd6', type: 'uint256' },
        { name: 'priceUpdatedAt', type: 'uint64' },
        { name: 'active', type: 'bool' },
      ],
    }],
  },
  { type: 'function', name: 'maxPriceAge', stateMutability: 'view', inputs: [], outputs: [{ type: 'uint256' }] },
  { type: 'function', name: 'paused', stateMutability: 'view', inputs: [], outputs: [{ type: 'bool' }] },
  { type: 'function', name: 'FOUNDER_ROLE', stateMutability: 'view', inputs: [], outputs: [{ type: 'bytes32' }] },
  {
    type: 'function', name: 'hasRole', stateMutability: 'view',
    inputs: [{ name: 'role', type: 'bytes32' }, { name: 'account', type: 'address' }], outputs: [{ type: 'bool' }],
  },
  {
    type: 'function', name: 'setPrice', stateMutability: 'nonpayable',
    inputs: [{ name: 'obraId', type: 'uint256' }, { name: 'priceUsd6', type: 'uint256' }], outputs: [],
  },
] as const

type Submission = { id: string; title: string; totalFractions: number; valorObra: string | number; moeda: string }
type Row = {
  id: string; title: string; valorBRL: number; fractions: number
  priceUsd6: bigint; updatedAt: number
}
type Fx = { rate: number; a: number; b: number; at: Date }

async function fetchFx(): Promise<Fx> {
  const [ra, rb] = await Promise.all([
    fetch('https://api.exchangerate-api.com/v4/latest/USD', { cache: 'no-store' }),
    fetch('https://economia.awesomeapi.com.br/json/last/USD-BRL', { cache: 'no-store' }),
  ])
  if (!ra.ok || !rb.ok) throw new Error('Uma das fontes de cotação não respondeu')
  const a = Number((await ra.json())?.rates?.BRL)
  const b = Number((await rb.json())?.USDBRL?.bid)
  if (!(a > 3 && a < 10) || !(b > 3 && b < 10)) throw new Error(`Cotação inválida (${a} / ${b})`)
  const div = Math.abs(a - b) / Math.min(a, b)
  if (div > MAX_FX_DIVERGENCE) throw new Error(`As fontes divergem ${(div * 100).toFixed(2)}% (${a} x ${b})`)
  return { rate: (a + b) / 2, a, b, at: new Date() }
}

function newPriceUsd6(valorBRL: number, fractions: number, rate: number): bigint {
  return BigInt(Math.round((valorBRL / fractions / rate) * 1e6))
}

const usd = (p6: bigint) => `US$ ${(Number(p6) / 1e6).toFixed(4)}`

function duration(sec: number) {
  const s = Math.abs(sec)
  const h = Math.floor(s / 3600)
  const m = Math.floor((s % 3600) / 60)
  return h > 0 ? `${h}h${m.toString().padStart(2, '0')}` : `${m}min`
}

export function PriceManagerV2() {
  const { address, isConnected } = useAccount()
  const chainId = useChainId()
  const { switchChain } = useSwitchChain()
  const client = usePublicClient({ chainId: base.id })
  const { writeContractAsync } = useWriteContract()

  const [rows, setRows] = useState<Row[]>([])
  const [maxAge, setMaxAge] = useState(0)
  const [paused, setPaused] = useState<boolean | null>(null)
  const [isFounderOnChain, setIsFounderOnChain] = useState<boolean | null>(null)
  const [fx, setFx] = useState<Fx | null>(null)
  const [fxError, setFxError] = useState('')
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState<string | null>(null)
  const [msg, setMsg] = useState<{ kind: 'ok' | 'erro'; text: string } | null>(null)
  const [now, setNow] = useState(() => Math.floor(Date.now() / 1000))

  useEffect(() => {
    const t = setInterval(() => setNow(Math.floor(Date.now() / 1000)), 30_000)
    return () => clearInterval(t)
  }, [])

  const load = useCallback(async () => {
    if (!client) return
    setLoading(true)
    setMsg(null)
    try {
      const subs: Submission[] = await (await fetch(SUBMISSIONS_URL, { cache: 'no-store' })).json()
      const [age, isPaused] = await Promise.all([
        client.readContract({ address: MARKETPLACE_V2, abi: MARKETPLACE_ABI, functionName: 'maxPriceAge' }),
        client.readContract({ address: MARKETPLACE_V2, abi: MARKETPLACE_ABI, functionName: 'paused' }),
      ])
      setMaxAge(Number(age))
      setPaused(isPaused)

      const listed: Row[] = []
      for (const s of subs.filter(s => s.moeda === 'BRL' && /^\d+$/.test(String(s.id)))) {
        const l = await client.readContract({
          address: MARKETPLACE_V2, abi: MARKETPLACE_ABI, functionName: 'getListing', args: [BigInt(s.id)],
        })
        if (!l.active) continue
        listed.push({
          id: String(s.id), title: s.title, valorBRL: Number(s.valorObra), fractions: Number(s.totalFractions),
          priceUsd6: l.priceUsd6, updatedAt: Number(l.priceUpdatedAt),
        })
      }
      setRows(listed)
    } catch (e: any) {
      setMsg({ kind: 'erro', text: `Erro ao ler o contrato: ${e?.shortMessage ?? e?.message ?? e}` })
    } finally {
      setLoading(false)
    }
    try {
      setFxError('')
      setFx(await fetchFx())
    } catch (e: any) {
      setFx(null)
      setFxError(e?.message ?? String(e))
    }
  }, [client])

  useEffect(() => { load() }, [load])

  useEffect(() => {
    if (!client || !address) { setIsFounderOnChain(null); return }
    ;(async () => {
      const role = await client.readContract({ address: MARKETPLACE_V2, abi: MARKETPLACE_ABI, functionName: 'FOUNDER_ROLE' })
      setIsFounderOnChain(await client.readContract({
        address: MARKETPLACE_V2, abi: MARKETPLACE_ABI, functionName: 'hasRole', args: [role, address],
      }))
    })().catch(() => setIsFounderOnChain(null))
  }, [client, address])

  const wrongChain = isConnected && chainId !== base.id
  const canSend = isConnected && !wrongChain && isFounderOnChain === true && !!fx && !busy

  async function update(row: Row, skipConfirm = false): Promise<boolean> {
    if (!fx || !client) return false
    const price = newPriceUsd6(row.valorBRL, row.fractions, fx.rate)
    const change = Math.abs(Number(price - row.priceUsd6)) / Number(row.priceUsd6)
    if (!skipConfirm && change > WARN_CHANGE &&
      !window.confirm(`${row.title}: o preço muda ${(change * 100).toFixed(1)}% (${usd(row.priceUsd6)} → ${usd(price)}). Confirmar?`)) {
      return false
    }
    setBusy(row.id)
    setMsg({ kind: 'ok', text: `Confirme na MetaMask: ${row.title} → ${usd(price)} por fração` })
    try {
      const hash = await writeContractAsync({
        address: MARKETPLACE_V2, abi: MARKETPLACE_ABI, functionName: 'setPrice',
        args: [BigInt(row.id), price], chainId: base.id,
      })
      setMsg({ kind: 'ok', text: `${row.title}: aguardando confirmação na rede…` })
      const rc = await client.waitForTransactionReceipt({ hash })
      if (rc.status !== 'success') throw new Error('a transação foi revertida')
      setRows(rs => rs.map(r => r.id === row.id ? { ...r, priceUsd6: price, updatedAt: Math.floor(Date.now() / 1000) } : r))
      setMsg({ kind: 'ok', text: `${row.title} atualizada para ${usd(price)} por fração.` })
      return true
    } catch (e: any) {
      setMsg({ kind: 'erro', text: `${row.title}: ${e?.shortMessage ?? e?.message ?? e}` })
      return false
    } finally {
      setBusy(null)
    }
  }

  async function updateAll() {
    if (!fx) return
    const big = rows.filter(r => {
      const p = newPriceUsd6(r.valorBRL, r.fractions, fx.rate)
      return Math.abs(Number(p - r.priceUsd6)) / Number(r.priceUsd6) > WARN_CHANGE
    })
    if (big.length && !window.confirm(`${big.length} obra(s) mudam mais de ${WARN_CHANGE * 100}%. Atualizar todas mesmo assim?`)) return
    let ok = 0
    for (const r of rows) {
      if (await update(r, true)) ok++
      else break
    }
    setMsg({ kind: ok === rows.length ? 'ok' : 'erro', text: `${ok} de ${rows.length} obra(s) atualizada(s).` })
  }

  const btn = 'min-h-[44px] px-4 py-2 rounded-xl text-sm font-bold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-300 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950 disabled:opacity-50 disabled:cursor-not-allowed'

  return (
    <section aria-labelledby="precos-v2-titulo" className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 id="precos-v2-titulo" className="text-2xl font-black text-white">Preços das frações (marketplace v2)</h2>
          <p className="text-slate-300 text-sm mt-1 max-w-2xl">
            O valor de cada obra é fixo em reais. Aqui você grava no contrato o preço em dólar pela cotação de agora.
            O contrato bloqueia compras se o preço ficar mais de {maxAge ? Math.round(maxAge / 3600) : 36}h sem atualização.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={load} disabled={loading || !!busy}
            className={`${btn} bg-slate-800 text-slate-200 hover:bg-slate-700`}>
            Recarregar
          </button>
          <button type="button" onClick={updateAll} disabled={!canSend || rows.length === 0}
            className={`${btn} bg-indigo-600 text-white hover:bg-indigo-700`}>
            Atualizar todas
          </button>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-3 text-sm">
        <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4">
          <p className="text-slate-400">Cotação USD/BRL agora</p>
          {fx ? (
            <>
              <p className="text-white text-xl font-bold">R$ {fx.rate.toFixed(4)}</p>
              <p className="text-slate-400 text-xs">exchangerate-api {fx.a} · AwesomeAPI {fx.b}</p>
            </>
          ) : (
            <p role="alert" className="text-red-300">{fxError || 'Carregando…'}</p>
          )}
        </div>
        <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4">
          <p className="text-slate-400">Marketplace v2</p>
          <p className={`text-xl font-bold ${paused ? 'text-amber-300' : 'text-emerald-300'}`}>
            {paused === null ? '…' : paused ? 'Pausado' : 'Aberto'}
          </p>
          <a href={`https://basescan.org/address/${MARKETPLACE_V2}`} target="_blank" rel="noopener noreferrer"
            className="text-xs text-indigo-300 hover:underline">
            Ver no BaseScan<span className="sr-only"> (abre em nova aba)</span>
          </a>
        </div>
        <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4">
          <p className="text-slate-400">Sua carteira</p>
          {!isConnected ? <p className="text-amber-300 font-bold">Não conectada</p>
            : wrongChain ? (
              <button type="button" onClick={() => switchChain({ chainId: base.id })}
                className={`${btn} mt-1 bg-amber-600 text-white hover:bg-amber-700`}>Trocar para a rede Base</button>
            ) : isFounderOnChain === false ? <p className="text-red-300 font-bold">Sem permissão de fundador</p>
            : isFounderOnChain ? <p className="text-emerald-300 font-bold">Fundadora ✓</p>
            : <p className="text-slate-300">Verificando…</p>}
        </div>
      </div>

      {msg && (
        <p role={msg.kind === 'erro' ? 'alert' : 'status'}
          className={`rounded-xl px-4 py-3 text-sm border ${msg.kind === 'erro' ? 'bg-red-500/10 border-red-500/40 text-red-200' : 'bg-indigo-500/10 border-indigo-500/40 text-indigo-100'}`}>
          {msg.text}
        </p>
      )}

      {loading ? (
        <p role="status" className="text-slate-300">Lendo o contrato…</p>
      ) : rows.length === 0 ? (
        <p className="text-slate-300">Nenhuma obra listada no marketplace v2.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <caption className="sr-only">Preço atual e preço pela cotação de agora, por obra</caption>
            <thead>
              <tr className="text-left text-slate-400 border-b border-slate-800">
                <th scope="col" className="py-2 pr-4">Obra</th>
                <th scope="col" className="py-2 pr-4">Valor (R$)</th>
                <th scope="col" className="py-2 pr-4">Preço no contrato</th>
                <th scope="col" className="py-2 pr-4">Validade</th>
                <th scope="col" className="py-2 pr-4">Preço com a cotação de agora</th>
                <th scope="col" className="py-2"><span className="sr-only">Ação</span></th>
              </tr>
            </thead>
            <tbody>
              {rows.map(r => {
                const left = r.updatedAt + maxAge - now
                const next = fx ? newPriceUsd6(r.valorBRL, r.fractions, fx.rate) : null
                const change = next ? (Number(next - r.priceUsd6) / Number(r.priceUsd6)) * 100 : 0
                return (
                  <tr key={r.id} className="border-b border-slate-800/60">
                    <th scope="row" className="py-3 pr-4 text-white font-semibold text-left">{r.title}</th>
                    <td className="py-3 pr-4 text-slate-300">
                      {r.valorBRL.toLocaleString('pt-BR')} <span className="text-slate-400">· {r.fractions} frações</span>
                    </td>
                    <td className="py-3 pr-4 text-white">{usd(r.priceUsd6)}</td>
                    <td className={`py-3 pr-4 font-semibold ${left <= 0 ? 'text-red-300' : left < 6 * 3600 ? 'text-amber-300' : 'text-emerald-300'}`}>
                      {left <= 0 ? `Vencido há ${duration(left)}` : `Vence em ${duration(left)}`}
                    </td>
                    <td className="py-3 pr-4 text-white">
                      {next ? <>{usd(next)} <span className="text-slate-400">({change >= 0 ? '+' : ''}{change.toFixed(2)}%)</span></> : '—'}
                    </td>
                    <td className="py-3">
                      <button type="button" onClick={() => update(r)} disabled={!canSend}
                        className={`${btn} bg-indigo-600 text-white hover:bg-indigo-700`}>
                        {busy === r.id ? 'Atualizando…' : 'Atualizar'}<span className="sr-only"> o preço de {r.title}</span>
                      </button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </section>
  )
}
