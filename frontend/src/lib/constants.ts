// Endereços dos fundadores — únicos autorizados no painel admin
export const FOUNDERS = [
  '0xE9eFC721405e1026B1ee91C07B2534e1796632A4', // Tales Hack
] as const

export type FounderAddress = typeof FOUNDERS[number]

export function isFounder(address: string): boolean {
  return FOUNDERS.map(a => a.toLowerCase()).includes(address.toLowerCase())
}

// Endereços dos contratos — Base Sepolia
export const CONTRACTS = {
  NEURO_TOKEN:       '0x9f037a74CDCb5FEae5a1E0DEe41AB5aB428269bf',
  SBT:               '0x5938f3ACe0EDB0924991350565602093f3ee4D36',
  VAULT_FACTORY:     '0x74d1F4271fB714a097B681b7342624196Dc3C8eb',
  VAULT_IMPL:        '0xd89A68B3c70782de5c3C378Fc847d54C0a1b98E4',
  DOCUMENT_REGISTRY: '0x754E6B0E18efE8Ac87a2b68C2cc921BA530d6B64',
} as const

// ABI mínima da ArtVaultFactory para chamar createVault
export const FACTORY_ABI = [
  {
    name: 'createVault',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'obraId',         type: 'uint256' },
      { name: 'ipfsHash',       type: 'string'  },
      { name: 'artist',         type: 'address' },
      { name: 'totalFractions', type: 'uint256' },
    ],
    outputs: [{ name: 'vault', type: 'address' }],
  },
  {
    name: 'getVault',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'obraId', type: 'uint256' }],
    outputs: [{ name: '', type: 'address' }],
  },
  {
    name: 'totalObras',
    type: 'function',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ name: '', type: 'uint256' }],
  },
] as const
