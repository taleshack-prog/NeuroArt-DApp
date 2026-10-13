import { NextRequest, NextResponse } from "next/server"

export async function GET(req: NextRequest) {
  const cid = req.nextUrl.searchParams.get("cid")
  const urlParam = req.nextUrl.searchParams.get("url")

  // Só busca imagens em gateways IPFS conhecidos; evita que a rota vire um proxy aberto para qualquer site
  let fetchUrl: string
  if (urlParam) {
    let u: URL
    try { u = new URL(urlParam) } catch { return new NextResponse("Invalid url", { status: 400 }) }
    const host = u.hostname.toLowerCase()
    const allowed = u.protocol === "https:" && (
      host === "gateway.pinata.cloud" || host.endsWith(".mypinata.cloud") ||
      host === "ipfs.io" || host === "dweb.link" || host.endsWith(".ipfs.dweb.link")
    )
    if (!allowed) return new NextResponse("Host not allowed", { status: 400 })
    fetchUrl = u.toString()
  } else if (cid) {
    if (!/^[A-Za-z0-9]{20,100}$/.test(cid)) return new NextResponse("Invalid cid", { status: 400 })
    fetchUrl = `https://indigo-fascinating-lynx-313.mypinata.cloud/ipfs/${cid}`
  } else {
    return new NextResponse("Missing cid or url", { status: 400 })
  }

  const res = await fetch(fetchUrl)
  const buffer = await res.arrayBuffer()
  let contentType = res.headers.get("content-type") || "image/jpeg"
  
  // Forca image/jpeg quando octet-stream (Pinata nao define o tipo corretamente)
  if (contentType === "application/octet-stream") {
    contentType = "image/jpeg"
  }

  return new NextResponse(buffer, {
    headers: {
      "Content-Type": contentType,
      "Cache-Control": "public, max-age=31536000",
    },
  })
}
