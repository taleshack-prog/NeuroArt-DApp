import { ethers } from 'hardhat'

async function main() {
  const [deployer] = await ethers.getSigners()
  
  const NEURO_TOKEN = '0x323988FE0C241fe99E9FCa4dAea0D6e403D01D0B'
  const PRESALE = '0x503b7a79FDc13B4Ee56944eef6dacdd5e0165D5B'
  const AMOUNT = ethers.parseEther('2000000')

  const neuro = await ethers.getContractAt('NeuroToken', NEURO_TOKEN)
  
  console.log('Transferindo 2.000.000 NEURO para o contrato de presale...')
  const tx = await neuro.transfer(PRESALE, AMOUNT)
  await tx.wait()
  console.log('TX:', tx.hash)
  console.log('2.000.000 NEURO transferidos para o presale!')
}

main().catch(console.error)
