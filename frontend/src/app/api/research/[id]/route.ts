import { NextRequest, NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"
import { requireFounder } from "@/lib/adminAuth"

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const admin = await requireFounder(req)
  if (!admin) return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
  const sql = neon(process.env.DATABASE_URL!)
  const body = await req.json()
  const rows = await sql`
    UPDATE research_proposals SET status = ${body.status}, reviewer_notes = ${body.reviewerNotes}, reviewed_at = NOW()
    WHERE id = ${params.id} RETURNING *
  `
  return NextResponse.json(rows[0])
}
