import { ethers } from 'hardhat'

async function main() {
  const [deployer] = await ethers.getSigners()
  console.log('Deployer:', await deployer.getAddress())

  const NEURO_TOKEN = '0x323988FE0C241fe99E9FCa4dAea0D6e403D01D0B'
  const DAO_WALLET  = '0xE9eFC721405e1026B1ee91C07B2534e1796632A4'
  const STRATEGIC   = '0xE9eFC721405e1026B1ee91C07B2534e1796632A4'

  console.log('Deployando NeuroArtAMMFactory...')
  const Factory = await ethers.getContractFactory('NeuroArtAMMFactory')
  const factory = await Factory.deploy(NEURO_TOKEN, DAO_WALLET, STRATEGIC)
  await factory.waitForDeployment()
  const factoryAddr = await factory.getAddress()
  console.log('NeuroArtAMMFactory:', factoryAddr)

  console.log('Deployando NeuroArtRouter...')
  const Router = await ethers.getContractFactory('NeuroArtRouter')
  const router = await Router.deploy(factoryAddr, NEURO_TOKEN)
  await router.waitForDeployment()
  const routerAddr = await router.getAddress()
  console.log('NeuroArtRouter:', routerAddr)

  console.log('\n=== ENDERECOS PARA .env ===')
  console.log('NEXT_PUBLIC_AMM_FACTORY_ADDRESS=' + factoryAddr)
  console.log('NEXT_PUBLIC_AMM_ROUTER_ADDRESS=' + routerAddr)
}

main().catch(console.error)
