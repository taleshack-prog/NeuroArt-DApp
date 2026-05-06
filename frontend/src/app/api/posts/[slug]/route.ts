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

export async function GET(_: NextRequest, { params }: { params: { slug: string } }) {
  const posts = getPosts()
  const post = posts.find((p: any) => p.slug === params.slug)
  if (!post) return NextResponse.json({ error: "Not found" }, { status: 404 })
  return NextResponse.json(post)
}
