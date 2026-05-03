import { NextRequest, NextResponse } from 'next/server'

const PINATA_JWT = process.env.PINATA_JWT

// POST /api/ipfs — faz upload de imagem e metadados para o IPFS via Pinata
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { imageBase64, metadata } = body

    if (!PINATA_JWT) {
      return NextResponse.json({ error: 'Pinata não configurado' }, { status: 500 })
    }

    // 1. Upload da imagem
    let imageCid = ''
    if (imageBase64) {
      const base64Data = imageBase64.replace(/^data:image\/\w+;base64,/, '')
      const buffer = Buffer.from(base64Data, 'base64')
      const mimeMatch = imageBase64.match(/^data:(image\/\w+);base64,/)
      const mimeType = mimeMatch ? mimeMatch[1] : 'image/jpeg'

      const formData = new FormData()
      const blob = new Blob([buffer], { type: mimeType })
      formData.append('file', blob, `obra-${Date.now()}.jpg`)
      formData.append('pinataMetadata', JSON.stringify({ name: metadata.name }))

      const imageRes = await fetch('https://api.pinata.cloud/pinning/pinFileToIPFS', {
        method: 'POST',
        headers: { Authorization: `Bearer ${PINATA_JWT}` },
        body: formData,
      })

      if (!imageRes.ok) {
        const err = await imageRes.text()
        return NextResponse.json({ error: `Erro upload imagem: ${err}` }, { status: 500 })
      }

      const imageData = await imageRes.json()
      imageCid = imageData.IpfsHash
    }

    // 2. Upload dos metadados JSON (padrão ERC-721)
    const nftMetadata = {
      name: metadata.name,
      description: metadata.description,
      image: imageCid ? `ipfs://${imageCid}` : '',
      external_url: `https://neuroart.dao/artwork/${metadata.obraId}`,
      attributes: [
        { trait_type: 'Neurotipo',        value: metadata.neurotipo },
        { trait_type: 'Estado Cognitivo', value: metadata.estadoCognitivo },
        { trait_type: 'Artista',          value: metadata.artistName },
        { trait_type: 'Valor Total',      value: `${metadata.moeda} ${metadata.valorObra}` },
        { trait_type: 'Frações',          value: metadata.totalFractions },
        { trait_type: 'Preço por Fração', value: metadata.precoPorFracao },
      ],
      properties: {
        artist_wallet: metadata.artistWallet,
        total_fractions: metadata.totalFractions,
        valor_obra: metadata.valorObra,
        moeda: metadata.moeda,
      },
    }

    const metaRes = await fetch('https://api.pinata.cloud/pinning/pinJSONToIPFS', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${PINATA_JWT}`,
      },
      body: JSON.stringify({
        pinataContent: nftMetadata,
        pinataMetadata: { name: `metadata-${metadata.name}-${Date.now()}` },
      }),
    })

    if (!metaRes.ok) {
      const err = await metaRes.text()
      return NextResponse.json({ error: `Erro upload metadata: ${err}` }, { status: 500 })
    }

    const metaData = await metaRes.json()
    const metadataCid = metaData.IpfsHash

    return NextResponse.json({
      imageCid,
      metadataCid,
      imageUrl: `https://gateway.pinata.cloud/ipfs/${imageCid}`,
      metadataUrl: `https://gateway.pinata.cloud/ipfs/${metadataCid}`,
      ipfsHash: `ipfs://${metadataCid}`,
    })
  } catch (e) {
    console.error('IPFS upload error:', e)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
