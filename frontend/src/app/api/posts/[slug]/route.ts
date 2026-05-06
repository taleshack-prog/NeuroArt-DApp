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

export async function DELETE(_: NextRequest, { params }: { params: { slug: string } }) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL as string,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string
  )
  const { error } = await supabase
    .from('posts')
    .delete()
    .eq('slug', params.slug)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}

export async function PATCH(req: NextRequest, { params }: { params: { slug: string } }) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL as string,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string
  )
  const body = await req.json()
  const { data, error } = await supabase
    .from("posts")
    .update({
      title: body.title,
      excerpt: body.excerpt,
      content: body.content,
      category: body.category,
    })
    .eq("slug", params.slug)
    .select()
    .single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}
