import { ethers } from 'hardhat'

async function main() {
  const [deployer] = await ethers.getSigners()
  console.log('Deployer:', await deployer.getAddress())

  // USDC na Base Mainnet
  const USDC_BASE = '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913'
  // Carteira da DApp (recebe 20%)
  const DAPP_WALLET = '0xE9eFC721405e1026B1ee91C07B2534e1796632A4'

  const Marketplace = await ethers.getContractFactory('FractionMarketplace')
  const marketplace = await Marketplace.deploy(USDC_BASE, DAPP_WALLET)
  await marketplace.waitForDeployment()
  const addr = await marketplace.getAddress()
  console.log('FractionMarketplace:', addr)
  console.log('Verifique em: https://basescan.org/address/' + addr)
}

main().catch(console.error)
