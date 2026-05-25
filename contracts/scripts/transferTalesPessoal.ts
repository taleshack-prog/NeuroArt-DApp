import { ethers } from 'hardhat'

async function main() {
  const NEURO = '0x323988FE0C241fe99E9FCa4dAea0D6e403D01D0B'
  const TALES_PESSOAL = '0xe976d1fA78CB3f4e1D8Db33F47a3B61baF80EdA4'
  const AMOUNT = ethers.parseEther('1500000')

  const neuro = await ethers.getContractAt('NeuroToken', NEURO)
  console.log('Transferindo 1.500.000 NEURO para Tales Pessoal...')
  const tx = await neuro.transfer(TALES_PESSOAL, AMOUNT)
  await tx.wait()
  console.log('TX:', tx.hash)
  console.log('1.500.000 NEURO transferidos!')
}

main().catch(console.error)
