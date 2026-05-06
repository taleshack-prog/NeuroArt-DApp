import { NextRequest, NextResponse } from "next/server"
import fs from "fs"
import path from "path"

const POSTS_FILE = path.join(process.cwd(), "data/posts.json")

function getPosts() {
  try {
    return JSON.parse(fs.readFileSync(POSTS_FILE, "utf-8"))
  } catch {
    return []
  }
}

export async function POST(req: NextRequest, { params }: { params: { slug: string } }) {
  const body = await req.json()
  const posts = getPosts()
  const idx = posts.findIndex((p: any) => p.slug === params.slug)
  if (idx === -1) return NextResponse.json({ error: "Not found" }, { status: 404 })
  
  const comment = {
    id: Date.now().toString(),
    text: body.text,
    author: body.author,
    wallet: body.wallet,
    createdAt: new Date().toISOString()
  }
  
  posts[idx].comments = posts[idx].comments || []
  posts[idx].comments.push(comment)
  fs.writeFileSync(POSTS_FILE, JSON.stringify(posts, null, 2))
  return NextResponse.json(comment, { status: 201 })
}
