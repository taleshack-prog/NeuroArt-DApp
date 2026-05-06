import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

export async function GET() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL as string,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string
  )
  const { data, error } = await supabase
    .from("research_proposals")
    .select("*")
    .order("submitted_at", { ascending: false })
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function POST(req: NextRequest) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL as string,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string
  )
  const body = await req.json()
  const { data, error } = await supabase
    .from("research_proposals")
    .insert([{
      title: body.title,
      abstract: body.abstract,
      methodology: body.methodology,
      expected_results: body.expectedResults,
      budget_requested: body.budgetRequested,
      duration_months: body.durationMonths,
      researcher_name: body.researcherName,
      researcher_wallet: body.researcherWallet,
      researcher_email: body.researcherEmail,
      institution: body.institution,
      category: body.category,
      status: "pending"
    }])
    .select()
    .single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data, { status: 201 })
}
