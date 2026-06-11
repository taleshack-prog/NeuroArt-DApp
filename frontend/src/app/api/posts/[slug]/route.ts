import { NextRequest, NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"

export async function GET(_: NextRequest, { params }: { params: { slug: string } }) {
  const sql = neon(process.env.DATABASE_URL!)
  const posts = await sql`SELECT * FROM posts WHERE slug = ${params.slug}`
  if (!posts[0]) return NextResponse.json({ error: "Not found" }, { status: 404 })
  const comments = await sql`SELECT * FROM comments WHERE post_slug = ${params.slug} ORDER BY created_at ASC`
  return NextResponse.json({ ...posts[0], comments })
}

export async function PATCH(req: NextRequest, { params }: { params: { slug: string } }) {
  const sql = neon(process.env.DATABASE_URL!)
  const body = await req.json()
  const rows = await sql`
    UPDATE posts SET title = ${body.title}, excerpt = ${body.excerpt}, content = ${body.content}, category = ${body.category}
    WHERE slug = ${params.slug} RETURNING *
  `
  return NextResponse.json(rows[0])
}

export async function DELETE(_: NextRequest, { params }: { params: { slug: string } }) {
  const sql = neon(process.env.DATABASE_URL!)
  await sql`DELETE FROM posts WHERE slug = ${params.slug}`
  return NextResponse.json({ success: true })
}
