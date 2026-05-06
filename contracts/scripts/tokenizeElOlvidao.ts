import { ethers } from 'hardhat'
import ArtVaultFactoryABI from '../artifacts/contracts/ArtVaultFactory.sol/ArtVaultFactory.json'

async function main() {
  const [deployer] = await ethers.getSigners()
  console.log('Deployer:', await deployer.getAddress())

  const OBRA_ID = BigInt('1777841548376')
  const IPFS_CID = 'QmZgufobdbj9JZnWwLALsrjTDYEybCg6MWQ8BNQPVGzELg'
  const ARTIST = '0xE9eFC721405e1026B1ee91C07B2534e1796632A4'
  const TOTAL_FRACTIONS = BigInt('100')
  const FACTORY_ADDRESS = '0x255F86038a4BAB00674637Fdb1792c2dE74589cF'

  const factory = new ethers.Contract(
    FACTORY_ADDRESS,
    ArtVaultFactoryABI.abi,
    deployer
  )

  console.log('Criando vault para El Olvidao na Base Mainnet...')
  const tx = await factory.createVault(OBRA_ID, IPFS_CID, ARTIST, TOTAL_FRACTIONS)
  const receipt = await tx.wait()
  console.log('TX:', receipt?.hash)

  const vaultAddress = await factory.getVault(OBRA_ID)
  console.log('Vault El Olvidao:', vaultAddress)
  console.log('Verifique em: https://basescan.org/address/' + vaultAddress)
}

main().catch(console.error)
