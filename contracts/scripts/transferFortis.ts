import { ethers } from 'hardhat'

async function main() {
  const NEURO = '0x323988FE0C241fe99E9FCa4dAea0D6e403D01D0B'
  const FORTIS = '0x59a42f0b0a6c5e0ab24c09fa4101d2df85d3e391'
  const AMOUNT = ethers.parseEther('1500000')
  const neuro = await ethers.getContractAt('NeuroToken', NEURO)
  const tx = await neuro.transfer(FORTIS, AMOUNT)
  await tx.wait()
  console.log('1.500.000 NEURO transferidos para Prof. Fortis!')
  console.log('TX:', tx.hash)
}
main().catch(console.error)
