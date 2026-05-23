import { ethers } from 'hardhat'

async function main() {
  const [deployer] = await ethers.getSigners()

  const FACTORY      = '0x95592eE2D804dB865155dA9Bddc2D43e6c9DbA23'
  const VAULT_TOKEN  = '0xC7Ac2946fB70847b6531d93573d0b8d868fbFe05' // El Olvidao vault
  const ARTIST       = '0xE9eFC721405e1026B1ee91C07B2534e1796632A4'
  const TOTAL_FRACS  = BigInt('100') * BigInt('1000000000000000000') // 100 fracoes

  const factory = await ethers.getContractAt('NeuroArtAMMFactory', FACTORY)

  console.log('Criando pool AMM para El Olvidao...')
  const tx = await factory.createPool(VAULT_TOKEN, ARTIST, TOTAL_FRACS)
  const receipt = await tx.wait()
  console.log('TX:', receipt?.hash)

  const pool = await factory.getPool(VAULT_TOKEN)
  console.log('Pool El Olvidao:', pool)
  console.log('Basescan: https://basescan.org/address/' + pool)
}

main().catch(console.error)
