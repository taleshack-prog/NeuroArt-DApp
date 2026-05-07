import { ethers } from 'hardhat'

async function main() {
  const [deployer] = await ethers.getSigners()
  console.log('Deployer:', await deployer.getAddress())

  const NEURO_TOKEN = '0x323988FE0C241fe99E9FCa4dAea0D6e403D01D0B'
  const USDC_BASE   = '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913'
  const TREASURY    = '0xE9eFC721405e1026B1ee91C07B2534e1796632A4'

  console.log('Deployando NeuroPresale...')
  const Presale = await ethers.getContractFactory('NeuroPresale')
  const presale = await Presale.deploy(NEURO_TOKEN, USDC_BASE, TREASURY)
  await presale.waitForDeployment()
  const addr = await presale.getAddress()
  console.log('NeuroPresale:', addr)
  console.log('Verifique em: https://basescan.org/address/' + addr)

  // Define preco inicial do ETH: $2400 USDC (6 decimais)
  console.log('Definindo preco do ETH...')
  const tx = await presale.setEthPrice(2400 * 1e6)
  await tx.wait()
  console.log('ETH price set: $2400 USDC')
  console.log('NEXT_PUBLIC_PRESALE_ADDRESS=' + addr)
}

main().catch(console.error)
