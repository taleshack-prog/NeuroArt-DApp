import { ethers } from 'hardhat'

async function main() {
  const FACTORY     = '0x95592eE2D804dB865155dA9Bddc2D43e6c9DbA23'
  const VAULT_TOKEN = '0xC7Ac2946fB70847b6531d93573d0b8d868fbFe05'

  const factory = await ethers.getContractAt('NeuroArtAMMFactory', FACTORY)
  const poolAddr = await factory.getPool(VAULT_TOKEN)
  console.log('Pool address:', poolAddr)

  const pool = await ethers.getContractAt('NeuroArtAMM', poolAddr)
  const [rA, rB] = await pool.getReserves()
  console.log('Reserve fracoes:', ethers.formatEther(rA))
  console.log('Reserve NEURO:', ethers.formatEther(rB))

  const totalSupply = await pool.totalSupply()
  console.log('LP totalSupply:', ethers.formatEther(totalSupply))
}

main().catch(console.error)
