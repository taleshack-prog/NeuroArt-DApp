import { NextRequest, NextResponse } from "next/server"

export async function GET(req: NextRequest) {
  const cid = req.nextUrl.searchParams.get("cid")
  const url = `https://indigo-fascinating-lynx-313.mypinata.cloud/ipfs/${cid}`
  const res = await fetch(url)
  const buffer = await res.arrayBuffer()
  const contentType = res.headers.get("content-type") || "image/jpeg"
  return new NextResponse(buffer, {
    headers: {
      "Content-Type": contentType,
      "Cache-Control": "public, max-age=31536000",
    },
  })
}
