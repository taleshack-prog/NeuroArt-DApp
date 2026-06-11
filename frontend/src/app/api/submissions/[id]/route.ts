import { NextRequest, NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const sql = neon(process.env.DATABASE_URL!)
  const body = await req.json()
  try {
    if (body.status) await sql`UPDATE submissions SET status = ${body.status} WHERE id = ${params.id}`
    if (body.approvedAt) await sql`UPDATE submissions SET approved_at = ${body.approvedAt} WHERE id = ${params.id}`
    if (body.txHash) await sql`UPDATE submissions SET tx_hash = ${body.txHash} WHERE id = ${params.id}`
    if (body.ipfsCid) await sql`UPDATE submissions SET ipfs_cid = ${body.ipfsCid} WHERE id = ${params.id}`
    if (body.imageUrl) await sql`UPDATE submissions SET image_url = ${body.imageUrl} WHERE id = ${params.id}`
    if (body.vaultAddress) await sql`UPDATE submissions SET vault_address = ${body.vaultAddress} WHERE id = ${params.id}`
    return NextResponse.json({ success: true })
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}
