'use client'
import { useReadContracts } from 'wagmi'
import { base } from 'wagmi/chains'
import { MARKETPLACE_V2, MARKETPLACE_V2_ABI, ONE_FRACTION } from '@/lib/marketplaceV2'

export type ListingV2 = {
  loaded: boolean
  error: boolean
  active: boolean
  vault?: `0x${string}`
  priceUsd6?: bigint      // preço por fração (USDC, 6 casas)
  ethPerFraction?: bigint // wei por fração pela cotação Chainlink atual (pode faltar se o oráculo estiver indisponível)
  available: number       // frações disponíveis no marketplace (pode ter casas decimais)
  fresh: boolean
  paused: boolean
  refetch: () => void
}

/** Lê do FractionMarketplaceV2 o estado de venda de uma obra */
export function useListingV2(obraId: string | undefined): ListingV2 {
  const valid = !!obraId && /^\d+$/.test(obraId)
  const id = valid ? BigInt(obraId) : BigInt(0)
  const c = { address: MARKETPLACE_V2, abi: MARKETPLACE_V2_ABI, chainId: base.id } as const

  const { data, isSuccess, isError, refetch } = useReadContracts({
    contracts: [
      { ...c, functionName: 'getListing', args: [id] },
      { ...c, functionName: 'available', args: [id] },
      { ...c, functionName: 'isPriceFresh', args: [id] },
      { ...c, functionName: 'paused' },
      { ...c, functionName: 'quoteETH', args: [id, ONE_FRACTION] },
    ],
    allowFailure: true,
    query: { enabled: valid, refetchInterval: 60_000 },
  })

  const listing = data?.[0]?.status === 'success' ? data[0].result : undefined
  const avail = data?.[1]?.status === 'success' ? data[1].result : BigInt(0)

  return {
    loaded: isSuccess,
    error: isError || data?.[0]?.status === 'failure',
    active: !!listing?.active,
    vault: listing?.active ? listing.vault : undefined,
    priceUsd6: listing?.active ? listing.priceUsd6 : undefined,
    ethPerFraction: data?.[4]?.status === 'success' ? data[4].result : undefined,
    available: Number(avail) / 1e18,
    fresh: data?.[2]?.status === 'success' ? data[2].result : false,
    paused: data?.[3]?.status === 'success' ? data[3].result : true,
    refetch: () => { refetch() },
  }
}
