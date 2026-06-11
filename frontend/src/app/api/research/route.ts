import { NextRequest, NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"

export async function GET() {
  const sql = neon(process.env.DATABASE_URL!)
  const rows = await sql`SELECT * FROM research_proposals ORDER BY submitted_at DESC`
  return NextResponse.json(rows)
}

export async function POST(req: NextRequest) {
  const sql = neon(process.env.DATABASE_URL!)
  const body = await req.json()
  const rows = await sql`
    INSERT INTO research_proposals (title, abstract, methodology, expected_results, budget_requested, duration_months, researcher_name, researcher_wallet, researcher_email, institution, category)
    VALUES (${body.title}, ${body.abstract}, ${body.methodology}, ${body.expectedResults}, ${body.budgetRequested}, ${body.durationMonths}, ${body.researcherName}, ${body.researcherWallet}, ${body.researcherEmail}, ${body.institution}, ${body.category})
    RETURNING *
  `
  return NextResponse.json(rows[0], { status: 201 })
}
