import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL as string,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string
  )
  const body = await req.json()
  const { data, error } = await supabase
    .from("research_proposals")
    .update({
      status: body.status,
      reviewer_notes: body.reviewerNotes,
      reviewed_at: new Date().toISOString()
    })
    .eq("id", params.id)
    .select()
    .single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}
