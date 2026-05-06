import { ethers } from 'hardhat'
import MarketplaceABI from '../artifacts/contracts/FractionMarketplace.sol/FractionMarketplace.json'

async function main() {
  const [deployer] = await ethers.getSigners()
  console.log('Deployer:', await deployer.getAddress())

  const MARKETPLACE = '0xF576C19BDc2a4737A909CB2931c0c017a476a80A'
  const OBRA_ID = BigInt('1777841548376')
  const VAULT_TOKEN = '0xC7Ac2946fB70847b6531d93573d0b8d868fbFe05'
  const ARTIST = '0xE9eFC721405e1026B1ee91C07B2534e1796632A4'

  // 11.21 USDC por fracao (6 decimais)
  const PRICE_USDC = BigInt('11210000')
  // 0.003 ETH por fracao (18 decimais) — ~$11.21 com ETH a ~$3700
  const PRICE_ETH = ethers.parseEther('0.003')

  const marketplace = new ethers.Contract(
    MARKETPLACE,
    MarketplaceABI.abi,
    deployer
  )

  console.log('Listando El Olvidao no marketplace...')
  const tx = await marketplace.listObra(
    OBRA_ID,
    VAULT_TOKEN,
    ARTIST,
    PRICE_USDC,
    PRICE_ETH
  )
  const receipt = await tx.wait()
  console.log('TX:', receipt?.hash)
  console.log('El Olvidao listada com sucesso!')
  console.log('Preco USDC por fracao: 11.21 USDC')
  console.log('Preco ETH por fracao: 0.003 ETH')
}

main().catch(console.error)
