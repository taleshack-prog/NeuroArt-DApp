import { NextRequest, NextResponse } from 'next/server'
import { readFileSync, writeFileSync } from 'fs'
import { join } from 'path'
import type { ArtworkSubmission } from '@/types'

const DB_PATH = join(process.cwd(), 'data', 'submissions.json')

function readDB(): ArtworkSubmission[] {
  try {
    return JSON.parse(readFileSync(DB_PATH, 'utf-8'))
  } catch {
    return []
  }
}

function writeDB(data: ArtworkSubmission[]) {
  writeFileSync(DB_PATH, JSON.stringify(data, null, 2))
}

// GET /api/submissions — lista todas
export async function GET() {
  const submissions = readDB()
  return NextResponse.json(submissions)
}

// POST /api/submissions — cria nova submissão
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { artistName, artistWallet, title, description, neurotipo, estadoCognitivo, totalFractions, imageBase64 } = body

    if (!artistName || !artistWallet || !title || !description || !neurotipo || !estadoCognitivo || !totalFractions) {
      return NextResponse.json({ error: 'Campos obrigatórios faltando' }, { status: 400 })
    }

    const submissions = readDB()
    const newSubmission: ArtworkSubmission = {
      id: Date.now().toString(),
      artistName,
      artistWallet,
      title,
      description,
      estadoCognitivo,
      totalFractions: Number(totalFractions),
      imageUrl: imageBase64 || '',
      status: 'pending',
      submittedAt: new Date().toISOString(),
    }

    submissions.push(newSubmission)
    writeDB(submissions)

    return NextResponse.json(newSubmission, { status: 201 })
  } catch (e) {
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
