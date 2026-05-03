import { http, createConfig } from 'wagmi'
import { base, baseSepolia } from 'wagmi/chains'
import { getDefaultConfig } from 'connectkit'

export const config = createConfig(
  getDefaultConfig({
    chains: [baseSepolia, base],
    transports: {
      [baseSepolia.id]: http(process.env.NEXT_PUBLIC_BASE_SEPOLIA_RPC || ''),
      [base.id]: http(),
    },
    walletConnectProjectId: process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || '',
    appName: 'NeuroArt DApp',
    appDescription: 'Tokenização de Arte Neurodiversa na Rede Base',
    appUrl: 'https://neuroart.dao',
  })
)
