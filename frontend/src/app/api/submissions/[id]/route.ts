import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL as string,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string
  )
  const body = await req.json()
  const update: any = {}

  if (body.status) update.status = body.status
  if (body.approvedAt) update.approved_at = body.approvedAt
  if (body.txHash) update.tx_hash = body.txHash
  if (body.ipfsCid) update.ipfs_cid = body.ipfsCid
  if (body.imageUrl) update.image_url = body.imageUrl
  if (body.vaultAddress) update.vault_address = body.vaultAddress

  const { data, error } = await supabase
    .from("submissions")
    .update(update)
    .eq("id", params.id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}
