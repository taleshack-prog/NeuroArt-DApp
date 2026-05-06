import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export async function POST(req: NextRequest, { params }: { params: { slug: string } }) {
  const body = await req.json()
  const { data, error } = await supabase
    .from("comments")
    .insert([{
      post_slug: params.slug,
      text: body.text,
      author: body.author,
      wallet: body.wallet,
    }])
    .select()
    .single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data, { status: 201 })
}
