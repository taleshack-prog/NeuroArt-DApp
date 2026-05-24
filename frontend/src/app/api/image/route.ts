import { NextRequest, NextResponse } from "next/server"

export async function GET(req: NextRequest) {
  const cid = req.nextUrl.searchParams.get("cid")
  const urlParam = req.nextUrl.searchParams.get("url")

  let fetchUrl: string
  if (urlParam) {
    fetchUrl = urlParam
  } else if (cid) {
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
