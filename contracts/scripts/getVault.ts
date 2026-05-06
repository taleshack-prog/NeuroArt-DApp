import { ethers } from 'hardhat'
import ArtVaultFactoryABI from '../artifacts/contracts/ArtVaultFactory.sol/ArtVaultFactory.json'

async function main() {
  const [deployer] = await ethers.getSigners()
  
  const OBRA_ID = BigInt('1777841548376')
  const FACTORY_ADDRESS = '0x255F86038a4BAB00674637Fdb1792c2dE74589cF'

  const factory = new ethers.Contract(
    FACTORY_ADDRESS,
    ArtVaultFactoryABI.abi,
    deployer
  )

  const vaultAddress = await factory.getVault(OBRA_ID)
  console.log('Vault El Olvidao:', vaultAddress)

  const totalObras = await factory.totalObras()
  console.log('Total obras:', totalObras.toString())
}

main().catch(console.error)
