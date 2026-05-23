import { ethers } from 'hardhat'

async function main() {
  const [deployer] = await ethers.getSigners()

  const FACTORY     = '0x95592eE2D804dB865155dA9Bddc2D43e6c9DbA23'
  const VAULT_TOKEN = '0xC7Ac2946fB70847b6531d93573d0b8d868fbFe05'
  const NEURO       = '0x323988FE0C241fe99E9FCa4dAea0D6e403D01D0B'

  const fractions = ethers.parseEther('5')
  const neuro     = ethers.parseEther('28')

  const vaultToken = await ethers.getContractAt('NeuroToken', VAULT_TOKEN)
  const neuroToken = await ethers.getContractAt('NeuroToken', NEURO)

  console.log('Aprovando fracoes...')
  await (await vaultToken.approve(FACTORY, fractions)).wait()
  console.log('Aprovando NEURO...')
  await (await neuroToken.approve(FACTORY, neuro)).wait()

  console.log('Bootstrap: 5 fracoes + 28 NEURO...')
  const factory = await ethers.getContractAt('NeuroArtAMMFactory', FACTORY)
  const tx = await factory.bootstrapLiquidity(VAULT_TOKEN, fractions, neuro, 0, 0)
  const receipt = await tx.wait()
  console.log('TX:', receipt?.hash)

  const active = await factory.isPoolActive(VAULT_TOKEN)
  console.log('Pool ativa:', active)
}

main().catch(console.error)
