import { ethers } from 'hardhat'

async function main() {
  const FACTORY     = '0x95592eE2D804dB865155dA9Bddc2D43e6c9DbA23'
  const VAULT_TOKEN = '0xC7Ac2946fB70847b6531d93573d0b8d868fbFe05'

  const factory = await ethers.getContractAt('NeuroArtAMMFactory', FACTORY)

  const pool = await factory.getPool(VAULT_TOKEN)
  console.log('Pool El Olvidao:', pool)

  const total = await factory.totalPools()
  console.log('Total pools:', total.toString())

  const active = await factory.isPoolActive(VAULT_TOKEN)
  console.log('Pool ativa:', active)
}

main().catch(console.error)
