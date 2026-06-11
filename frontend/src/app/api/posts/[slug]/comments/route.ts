import { NextRequest, NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"

export async function POST(req: NextRequest, { params }: { params: { slug: string } }) {
  const sql = neon(process.env.DATABASE_URL!)
  const body = await req.json()
  const rows = await sql`
    INSERT INTO comments (post_slug, text, author, wallet)
    VALUES (${params.slug}, ${body.text}, ${body.author}, ${body.wallet})
    RETURNING *
  `
  return NextResponse.json(rows[0], { status: 201 })
}
