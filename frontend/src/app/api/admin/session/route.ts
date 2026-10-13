import { NextRequest, NextResponse } from "next/server"
import { ADMIN_COOKIE, encodeSession, requestHost, requireFounder, verifyLogin } from "@/lib/adminAuth"

export const dynamic = "force-dynamic"

/** GET: diz se há um fundador logado neste navegador */
export async function GET(req: NextRequest) {
  const address = await requireFounder(req)
  if (!address) return NextResponse.json({ error: "Não autenticado" }, { status: 401 })
  return NextResponse.json({ address })
}

/** POST { message, signature }: confere a assinatura e abre a sessão (cookie HttpOnly) */
export async function POST(req: NextRequest) {
  let body: any
  try { body = await req.json() } catch { return NextResponse.json({ error: "JSON inválido" }, { status: 400 }) }
  const message = typeof body?.message === "string" ? body.message : ""
  const signature = typeof body?.signature === "string" ? body.signature : ""
  const ok = await verifyLogin(message, signature, requestHost(req.headers), true)
  if (!ok) return NextResponse.json({ error: "Assinatura inválida, vencida ou de carteira não autorizada" }, { status: 401 })

  const res = NextResponse.json({ address: ok.address })
  res.cookies.set(ADMIN_COOKIE, encodeSession(message, signature), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/",
    expires: new Date(ok.expiresAt),
  })
  return res
}

/** DELETE: encerra a sessão */
export async function DELETE() {
  const res = NextResponse.json({ success: true })
  res.cookies.set(ADMIN_COOKIE, "", { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "strict", path: "/", maxAge: 0 })
  return res
}
