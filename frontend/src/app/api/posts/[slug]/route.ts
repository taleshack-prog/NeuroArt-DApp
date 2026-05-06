import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

export async function GET(_: NextRequest, { params }: { params: { slug: string } }) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL as string,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string
  )
  const { data: post, error } = await supabase
    .from("posts")
    .select("*")
    .eq("slug", params.slug)
    .single()
  if (error) return NextResponse.json({ error: "Not found" }, { status: 404 })
  const { data: comments } = await supabase
    .from("comments")
    .select("*")
    .eq("post_slug", params.slug)
    .order("created_at", { ascending: true })
  return NextResponse.json({ ...post, comments: comments || [] })
}
