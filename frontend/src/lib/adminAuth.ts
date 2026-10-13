/**
 * Login do admin por assinatura de carteira (sem senha, sem gás).
 *
 * 1. O admin assina na MetaMask uma mensagem com endereço, site e validade (12h).
 * 2. POST /api/admin/session confere a assinatura e grava um cookie HttpOnly com a mensagem + assinatura.
 * 3. Cada rota que altera dados chama requireFounder(req): recupera o endereço a partir da assinatura
 *    e só aceita se for um fundador (lista FOUNDERS) e a sessão estiver dentro da validade.
 *
 * Ninguém consegue forjar o cookie sem a chave privada de um fundador.
 * Não precisa de variável de ambiente nem de tabela no banco.
 */
import { recoverMessageAddress, isAddress, type Hex } from 'viem'
import { isFounder } from '@/lib/constants'
import { SESSION_HOURS, LOGIN_TITLE as TITLE, LOGIN_FOOTER as FOOTER } from '@/lib/adminLoginMessage'
export { SESSION_HOURS, buildLoginMessage } from '@/lib/adminLoginMessage'

export const ADMIN_COOKIE = 'na_admin'
const MAX_CLOCK_SKEW_MS = 5 * 60 * 1000

type Parsed = { address: `0x${string}`; host: string; issuedAt: number; expiresAt: number }

function parseLoginMessage(message: string): Parsed | null {
  const lines = message.split('\n')
  if (lines.length !== 7 || lines[0] !== TITLE || lines[5] !== '' || lines[6] !== FOOTER) return null
  const get = (i: number, label: string) => (lines[i].startsWith(label) ? lines[i].slice(label.length) : null)
  const address = get(1, 'Endereço: ')
  const host = get(2, 'Site: ')
  const iss = get(3, 'Emitido em: ')
  const exp = get(4, 'Válido até: ')
  if (!address || !isAddress(address) || !host || !iss || !exp) return null
  const issuedAt = Date.parse(iss)
  const expiresAt = Date.parse(exp)
  if (!Number.isFinite(issuedAt) || !Number.isFinite(expiresAt)) return null
  return { address, host: host.toLowerCase(), issuedAt, expiresAt }
}

/** Host da requisição (atrás da Vercel vem em x-forwarded-host) */
export function requestHost(headers: Headers) {
  return (headers.get('x-forwarded-host') ?? headers.get('host') ?? '').split(',')[0].trim().toLowerCase()
}

/**
 * Confere mensagem + assinatura. Retorna o endereço do fundador ou null.
 * fresh=true (no login) exige que a mensagem tenha sido emitida há no máximo 5 minutos.
 */
export async function verifyLogin(message: string, signature: string, host: string, fresh: boolean) {
  const p = parseLoginMessage(message)
  if (!p) return null
  const now = Date.now()
  if (p.host !== host) return null
  if (p.expiresAt <= now) return null
  if (p.expiresAt - p.issuedAt > SESSION_HOURS * 3600 * 1000 + MAX_CLOCK_SKEW_MS) return null
  if (p.issuedAt > now + MAX_CLOCK_SKEW_MS) return null
  if (fresh && now - p.issuedAt > MAX_CLOCK_SKEW_MS) return null
  if (!/^0x[0-9a-fA-F]{130}$/.test(signature)) return null
  let signer: string
  try {
    signer = await recoverMessageAddress({ message, signature: signature as Hex })
  } catch {
    return null
  }
  if (signer.toLowerCase() !== p.address.toLowerCase()) return null
  if (!isFounder(signer)) return null
  return { address: signer as `0x${string}`, expiresAt: p.expiresAt }
}

export function encodeSession(message: string, signature: string) {
  return Buffer.from(JSON.stringify({ m: message, s: signature }), 'utf8').toString('base64url')
}

function decodeSession(value: string): { m: string; s: string } | null {
  try {
    const v = JSON.parse(Buffer.from(value, 'base64url').toString('utf8'))
    return typeof v?.m === 'string' && typeof v?.s === 'string' ? v : null
  } catch {
    return null
  }
}

/** Para as rotas de API: retorna o endereço do fundador logado, ou null */
export async function requireFounder(req: { headers: Headers; cookies: { get(name: string): { value: string } | undefined } }) {
  const raw = req.cookies.get(ADMIN_COOKIE)?.value
  if (!raw) return null
  const sess = decodeSession(raw)
  if (!sess) return null
  const ok = await verifyLogin(sess.m, sess.s, requestHost(req.headers), false)
  return ok?.address ?? null
}
