export type ArtworkStatus = 'pending' | 'approved' | 'rejected' | 'tokenized'

export type ArtworkSubmission = {
  id: string
  artistName: string
  artistWallet: string
  title: string
  description: string
  neurotipo?: string
  estadoCognitivo: string
  totalFractions: number
  imageUrl: string
  ipfsCid?: string
  status: ArtworkStatus
  submittedAt: string
  approvedAt?: string
  valorObra?: string
  moeda?: string
  precoPorFracao?: string
  vaultAddress?: string
  txHash?: string
}
