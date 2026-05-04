import { ethers } from "hardhat";

async function main() {
  const [deployer] = await ethers.getSigners();

  console.log("🚀 Iniciando deploy na Base Sepolia...");
  console.log("📍 Deployer:", deployer.address);

  const balance = await ethers.provider.getBalance(deployer.address);
  console.log("💰 Saldo ETH:", ethers.formatEther(balance), "ETH\n");

  // 1. NeuroToken
  console.log("[1/5] Deployando NeuroToken...");
  const NeuroToken = await ethers.getContractFactory("NeuroToken");
  const neuroToken = await NeuroToken.deploy();
  await neuroToken.waitForDeployment();
  const tokenAddress = await neuroToken.getAddress();
  console.log("✅ NeuroToken:", tokenAddress);

  // 2. NeuroSBT
  console.log("[2/5] Deployando NeuroSBT...");
  const NeuroSBT = await ethers.getContractFactory("NeuroSBT");
  const neuroSBT = await NeuroSBT.deploy();
  await neuroSBT.waitForDeployment();
  const sbtAddress = await neuroSBT.getAddress();
  console.log("✅ NeuroSBT:", sbtAddress);

  // 3. Vault Implementation
  console.log("[3/5] Deployando Vault Implementation...");
  const NeuroVault = await ethers.getContractFactory("NeuroArtFractionalVault");
  const vaultImpl = await NeuroVault.deploy();
  await vaultImpl.waitForDeployment();
  const vaultImplAddress = await vaultImpl.getAddress();
  console.log("✅ Vault Implementation:", vaultImplAddress);

  // 4. ArtVaultFactory
  console.log("[4/5] Deployando ArtVaultFactory...");
  const Factory = await ethers.getContractFactory("ArtVaultFactory");
  const factory = await Factory.deploy(vaultImplAddress, deployer.address);
  await factory.waitForDeployment();
  const factoryAddress = await factory.getAddress();
  console.log("✅ ArtVaultFactory:", factoryAddress);

  // 5. DocumentRegistry + registro do whitepaper
  console.log("[5/5] Deployando DocumentRegistry...");
  const Registry = await ethers.getContractFactory("DocumentRegistry");
  const registry = await Registry.deploy();
  await registry.waitForDeployment();
  const registryAddress = await registry.getAddress();
  console.log("✅ DocumentRegistry:", registryAddress);

  // Registrar hash do whitepaper on-chain
  console.log("\n📄 Registrando hash do Whitepaper on-chain...");
  const whitepaperHash = "0x5f5cc82532eea90f7ad63837793f9ac918b7c812f369061a5e79407599c23d88";
  const tx = await registry.registerDocument(
    "NeuroArt DApp Whitepaper v3.0",
    whitepaperHash,
    ""
  );
  await tx.wait();
  console.log("✅ Whitepaper registrado! TX:", tx.hash);

  // Resumo final
  console.log("\n" + "=".repeat(60));
  console.log("🎉 DEPLOY COMPLETO!");
  console.log("=".repeat(60));
  console.log(`NEXT_PUBLIC_NEURO_TOKEN_ADDRESS=${tokenAddress}`);
  console.log(`NEXT_PUBLIC_SBT_ADDRESS=${sbtAddress}`);
  console.log(`NEXT_PUBLIC_VAULT_FACTORY_ADDRESS=${factoryAddress}`);
  console.log(`NEXT_PUBLIC_REGISTRY_ADDRESS=${registryAddress}`);
  console.log("=".repeat(60));
  console.log(`\n🔍 Verifique em: https://sepolia.basescan.org/address/${factoryAddress}`);
  console.log(`📄 Whitepaper TX: https://sepolia.basescan.org/tx/${tx.hash}`);
}

main().catch((error) => {
  console.error("❌ Erro:", error);
  process.exit(1);
});

// Deploy separado do Marketplace (rodar após ter USDC testnet)
export async function deployMarketplace() {
  const [deployer] = await ethers.getSigners();
  
  // USDC na Base Sepolia
  const USDC_BASE_SEPOLIA = "0x036CbD53842c5426634e7929541eC2318f3dCF7e";
  const DAPP_WALLET = "0xE9eFC721405e1026B1ee91C07B2534e1796632A4";

  console.log("Deployando FractionMarketplace...");
  const Marketplace = await ethers.getContractFactory("FractionMarketplace");
  const marketplace = await Marketplace.deploy(USDC_BASE_SEPOLIA, DAPP_WALLET);
  await marketplace.waitForDeployment();
  console.log("FractionMarketplace:", await marketplace.getAddress());
}
