import { NextRequest, NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"

export async function GET() {
  const sql = neon(process.env.DATABASE_URL!)
  try {
    const rows = await sql`SELECT * FROM submissions ORDER BY submitted_at DESC`
    const mapped = rows.map((s: any) => ({
      id: s.id,
      artistName: s.artist_name,
      artistWallet: s.artist_wallet,
      title: s.title,
      description: s.description,
      estadoCognitivo: s.estado_cognitivo,
      totalFractions: s.total_fractions,
      imageUrl: s.image_url,
      ipfsCid: s.ipfs_cid,
      status: s.status,
      valorObra: s.valor_obra,
      moeda: s.moeda,
      precoPorFracao: s.preco_por_fracao,
      vaultAddress: s.vault_address,
      txHash: s.tx_hash,
      network: s.network,
      chainId: s.chain_id,
      submittedAt: s.submitted_at,
      approvedAt: s.approved_at,
    }))
    return NextResponse.json(mapped)
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  const sql = neon(process.env.DATABASE_URL!)
  try {
    const body = await req.json()
    const { artistName, artistWallet, title, description, estadoCognitivo, totalFractions, imageBase64, valorObra, moeda, precoPorFracao, artistEmail, artistCpfPassaporte, artistNacionalidade, artistEndereco, artistTelefone, obraLocalizacao, obraCondicao, aceitaTermos } = body

    if (!artistName || !artistWallet || !title || !description || !estadoCognitivo || !totalFractions) {
      return NextResponse.json({ error: "Campos obrigatorios faltando" }, { status: 400 })
    }

    const id = Date.now().toString()
    await sql`
      INSERT INTO submissions (id, artist_name, artist_wallet, title, description, estado_cognitivo, total_fractions, image_url, status, valor_obra, moeda, preco_por_fracao, artist_email, artist_cpf_passaporte, artist_nacionalidade, artist_endereco, artist_telefone, obra_localizacao, obra_condicao, aceita_termos)
      VALUES (${id}, ${artistName}, ${artistWallet}, ${title}, ${description}, ${estadoCognitivo}, ${Number(totalFractions)}, ${imageBase64 || ""}, ${"pending"}, ${valorObra || ""}, ${moeda || "BRL"}, ${precoPorFracao || ""}, ${artistEmail || ""}, ${artistCpfPassaporte || ""}, ${artistNacionalidade || ""}, ${artistEndereco || ""}, ${artistTelefone || ""}, ${obraLocalizacao || ""}, ${obraCondicao || ""}, ${aceitaTermos || false})
    `
    return NextResponse.json({ id, status: "pending" }, { status: 201 })
  } catch (e) {
    return NextResponse.json({ error: "Erro interno: " + String(e) }, { status: 500 })
  }
}
