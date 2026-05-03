import { http, createConfig } from 'wagmi'
import { base, baseSepolia } from 'wagmi/chains'
import { metaMask } from 'wagmi/connectors'

export const config = createConfig({
  chains: [baseSepolia, base],
  connectors: [
    metaMask({
      dappMetadata: {
        name: 'NeuroArt DApp',
        url: 'http://localhost:3003',
      }
    }),
  ],
  transports: {
    [baseSepolia.id]: http(process.env.NEXT_PUBLIC_BASE_SEPOLIA_RPC || 'https://sepolia.base.org'),
    [base.id]: http(),
  },
})
