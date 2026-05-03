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

// PATCH /api/submissions/[id] — atualiza status
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await req.json()
    const submissions = readDB()
    const index = submissions.findIndex(s => s.id === params.id)

    if (index === -1) {
      return NextResponse.json({ error: 'Submissão não encontrada' }, { status: 404 })
    }

    submissions[index] = { ...submissions[index], ...body }
    writeDB(submissions)

    return NextResponse.json(submissions[index])
  } catch {
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
