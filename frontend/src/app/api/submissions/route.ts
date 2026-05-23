import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

export async function GET() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL as string,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string
  )
  const { data, error } = await supabase
    .from("submissions")
    .select("*")
    .order("submitted_at", { ascending: false })
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Mapeia para o formato antigo
  const mapped = (data || []).map((s: any) => ({
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
}

export async function POST(req: NextRequest) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL as string,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string
  )
  try {
    const body = await req.json()
    const { artistName, artistWallet, title, description, estadoCognitivo, totalFractions, imageBase64, valorObra, moeda, precoPorFracao, artistEmail, artistCpfPassaporte, artistNacionalidade, artistEndereco, artistTelefone, artistInstituicao, obraLocalizacao, obraCondicao, aceitaTermos } = body

    if (!artistName || !artistWallet || !title || !description || !estadoCognitivo || !totalFractions) {
      const missing = { artistName: !artistName, artistWallet: !artistWallet, title: !title, description: !description, estadoCognitivo: !estadoCognitivo, totalFractions: !totalFractions }
      return NextResponse.json({ error: "Campos obrigatorios faltando", missing }, { status: 400 })
    }

    const id = Date.now().toString()

    const { data, error } = await supabase
      .from("submissions")
      .insert([{
        id,
        artist_name: artistName,
        artist_wallet: artistWallet,
        title,
        description,
        estado_cognitivo: estadoCognitivo,
        total_fractions: Number(totalFractions),
        image_url: imageBase64 || "",
        status: "pending",
        valor_obra: valorObra || "",
        moeda: moeda || "BRL",
        preco_por_fracao: precoPorFracao || "",
        artist_email: artistEmail || "",
        artist_cpf_passaporte: artistCpfPassaporte || "",
        artist_nacionalidade: artistNacionalidade || "",
        artist_endereco: artistEndereco || "",
        artist_telefone: artistTelefone || "",
        obra_localizacao: obraLocalizacao || "",
        obra_condicao: obraCondicao || "",
        aceita_termos: aceitaTermos || false,
      }])
      .select()
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ id: data.id, status: "pending" }, { status: 201 })
  } catch (e) {
    return NextResponse.json({ error: "Erro interno: " + String(e) }, { status: 500 })
  }
}
