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

export async function GET() {
  const posts = getPosts().filter((p: any) => p.published)
  return NextResponse.json(posts)
}

export async function POST(req: NextRequest) {
  const body = await req.json()
  const posts = getPosts()
  const newPost = {
    id: Date.now().toString(),
    slug: body.title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, ""),
    title: body.title,
    excerpt: body.excerpt,
    content: body.content,
    category: body.category,
    author: body.author,
    authorWallet: body.authorWallet,
    publishedAt: new Date().toISOString(),
    published: body.published || false,
    comments: []
  }
  posts.unshift(newPost)
  fs.writeFileSync(POSTS_FILE, JSON.stringify(posts, null, 2))
  return NextResponse.json(newPost, { status: 201 })
}
