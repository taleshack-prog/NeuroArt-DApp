import { NextRequest, NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"

export async function GET() {
  const sql = neon(process.env.DATABASE_URL!)
  const rows = await sql`SELECT * FROM posts WHERE published = true ORDER BY published_at DESC`
  return NextResponse.json(rows)
}

export async function POST(req: NextRequest) {
  const sql = neon(process.env.DATABASE_URL!)
  const body = await req.json()
  const slug = body.title.toLowerCase()
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "")
  const rows = await sql`
    INSERT INTO posts (slug, title, excerpt, content, category, author, author_wallet, published)
    VALUES (${slug}, ${body.title}, ${body.excerpt}, ${body.content}, ${body.category}, ${body.author}, ${body.authorWallet}, ${body.published ?? true})
    RETURNING *
  `
  return NextResponse.json(rows[0], { status: 201 })
}
