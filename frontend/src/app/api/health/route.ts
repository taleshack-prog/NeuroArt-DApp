import { NextResponse } from 'next/server'
import { neon } from '@neondatabase/serverless'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

type ServiceStatus = 'healthy' | 'degraded' | 'down'

interface ServiceCheck {
  name: string
  status: ServiceStatus
  latency: number
  message: string
  checkedAt: string
}

interface HealthReport {
  status: ServiceStatus
  version: string
  timestamp: string
  services: ServiceCheck[]
}

function now() { return new Date().toISOString() }
function aggregate(services: ServiceCheck[]): ServiceStatus {
  if (services.some(s => s.status === 'down')) return 'down'
  if (services.some(s => s.status === 'degraded')) return 'degraded'
  return 'healthy'
}

async function checkDatabase(): Promise<ServiceCheck> {
  const url = process.env.DATABASE_URL
  if (!url) return { name: 'Database (Neon)', status: 'down', latency: 0, message: 'DATABASE_URL não configurada', checkedAt: now() }
  const t0 = Date.now()
  try {
    const sql = neon(url)
    await sql`SELECT 1`
    const latency = Date.now() - t0
    return { name: 'Database (Neon)', status: latency < 1500 ? 'healthy' : 'degraded', latency, message: latency < 1500 ? 'Connected' : 'Resposta lenta', checkedAt: now() }
  } catch (e) {
    return { name: 'Database (Neon)', status: 'down', latency: Date.now() - t0, message: String(e), checkedAt: now() }
  }
}

async function checkIPFS(): Promise<ServiceCheck> {
  const jwt = process.env.PINATA_JWT
  if (!jwt) return { name: 'IPFS (Pinata)', status: 'down', latency: 0, message: 'PINATA_JWT não configurada', checkedAt: now() }
  const t0 = Date.now()
  try {
    const res = await fetch('https://api.pinata.cloud/data/testAuthentication', {
      headers: { Authorization: `Bearer ${jwt}` },
      signal: AbortSignal.timeout(6000),
    })
    const latency = Date.now() - t0
    return { name: 'IPFS (Pinata)', status: res.ok ? (latency < 2000 ? 'healthy' : 'degraded') : 'down', latency, message: res.ok ? 'Autenticado' : `HTTP ${res.status}`, checkedAt: now() }
  } catch (e) {
    return { name: 'IPFS (Pinata)', status: 'down', latency: Date.now() - t0, message: String(e), checkedAt: now() }
  }
}

async function checkBaseRPC(): Promise<ServiceCheck> {
  const rpcUrl = process.env.BASE_RPC_URL || process.env.NEXT_PUBLIC_BASE_RPC_URL || 'https://mainnet.base.org'
  const t0 = Date.now()
  try {
    const res = await fetch(rpcUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ jsonrpc: '2.0', method: 'eth_blockNumber', params: [], id: 1 }),
      signal: AbortSignal.timeout(6000),
    })
    const data = await res.json()
    const latency = Date.now() - t0
    const block = data?.result ? parseInt(data.result, 16) : null
    return { name: 'Base L2 RPC', status: block ? (latency < 2000 ? 'healthy' : 'degraded') : 'down', latency, message: block ? `Block #${block.toLocaleString()}` : 'Sem resposta de bloco', checkedAt: now() }
  } catch (e) {
    return { name: 'Base L2 RPC', status: 'down', latency: Date.now() - t0, message: String(e), checkedAt: now() }
  }
}

async function checkAnthropicAPI(): Promise<ServiceCheck> {
  const key = process.env.ANTHROPIC_API_KEY
  if (!key) return { name: 'Anthropic API', status: 'down', latency: 0, message: 'ANTHROPIC_API_KEY não configurada', checkedAt: now() }
  const t0 = Date.now()
  try {
    const res = await fetch('https://api.anthropic.com/v1/models', {
      headers: { 'x-api-key': key, 'anthropic-version': '2023-06-01' },
      signal: AbortSignal.timeout(6000),
    })
    const latency = Date.now() - t0
    return { name: 'Anthropic API', status: res.ok ? (latency < 2000 ? 'healthy' : 'degraded') : 'down', latency, message: res.ok ? 'Acessível' : `HTTP ${res.status}`, checkedAt: now() }
  } catch (e) {
    return { name: 'Anthropic API', status: 'down', latency: Date.now() - t0, message: String(e), checkedAt: now() }
  }
}

function checkSelf(): ServiceCheck {
  return { name: 'Frontend (Next.js)', status: 'healthy', latency: 0, message: 'Running', checkedAt: now() }
}

export async function GET() {
  const [db, ipfs, rpc, anthropic] = await Promise.all([
    checkDatabase(), checkIPFS(), checkBaseRPC(), checkAnthropicAPI(),
  ])
  const services: ServiceCheck[] = [checkSelf(), db, ipfs, rpc, anthropic]
  const report: HealthReport = { status: aggregate(services), version: '1.0.0', timestamp: now(), services }
  return NextResponse.json(report, {
    status: report.status === 'down' ? 503 : 200,
    headers: { 'Cache-Control': 'no-store', 'Access-Control-Allow-Origin': '*' },
  })
}
