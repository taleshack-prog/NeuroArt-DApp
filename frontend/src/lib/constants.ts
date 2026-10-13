// Endereços dos fundadores — únicos autorizados no painel admin
export const FOUNDERS = [
  '0xE9eFC721405e1026B1ee91C07B2534e1796632A4', // Tales Hack
  '0x59a42f0b0a6c5e0ab24c09fa4101d2df85d3e391', // Prof. Alexandre de Souza Fortis
] as const

export type FounderAddress = typeof FOUNDERS[number]

export function isFounder(address: string): boolean {
  return FOUNDERS.map(a => a.toLowerCase()).includes(address.toLowerCase())
}

// Endereços dos contratos — Base Sepolia
export const CONTRACTS = {
  NEURO_TOKEN:       '0x9f037a74CDCb5FEae5a1E0DEe41AB5aB428269bf',
  SBT:               '0x5938f3ACe0EDB0924991350565602093f3ee4D36',
  // Fábrica e implementação dos cofres: contratos v2 na Base Mainnet (ver src/lib/tokenizeV2.ts).
  // O endereço antigo (0x74d1…C8eb) não é contrato na Mainnet; as "tokenizações" enviadas a ele não criaram nada.
  VAULT_FACTORY:     '0x4B104A3Fb6c64f2e3fAC2Ce32364e80D51d948c1',
  VAULT_IMPL:        '0x24325004e562479f528d83C6F11D54312efA2768',
  DOCUMENT_REGISTRY: '0x754E6B0E18efE8Ac87a2b68C2cc921BA530d6B64',
} as const

// A ABI da fábrica v2 está em src/lib/tokenizeV2.ts (FACTORY_V2_ABI).
