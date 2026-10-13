/**
 * Deploy do Marketplace v2 na Base Mainnet.
 *
 * O que faz, nesta ordem:
 *   1. NeuroArtVaultV2 (implementação dos clones)
 *   2. ArtVaultFactoryV2
 *   3. FractionMarketplaceV2
 *   4. PAUSA o marketplace (ninguém compra até você testar e despausar)
 *   5. Grava os endereços em deployments/v2-<chainId>.json e imprime os comandos de verificação
 *
 * NÃO concede PRICE_KEEPER_ROLE e NÃO lista obras: isso vem depois, em scripts separados.
 *
 * Ensaio sem gastar gás (fork local da Base):
 *   terminal 1:  npx hardhat node --fork https://mainnet.base.org
 *   terminal 2:  npx hardhat run scripts/deployV2.ts --network localhost
 *
 * Mainnet (só depois do ensaio):
 *   CONFIRM_MAINNET=SIM npx hardhat run scripts/deployV2.ts --network base
 */
import { ethers, network } from "hardhat";
import * as fs from "fs";
import * as path from "path";

// Base Mainnet — confirmados on-chain em 12/10/2026 (ver test/MarketplaceV2.fork.test.ts)
const BASE = {
  usdc: "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913",
  ethUsdFeed: "0x71041dddad3595F9CEd3DcCFBe3D1F4b0a16Bb70",
  sequencerFeed: "0xBCF85224fc0756B9Fa45aA7892530B47e10b6433",
};

// Carteira da DApp (neuroarte.eth): recebe os 20% e é admin/fundadora
const DAPP_WALLET = "0xE9eFC721405e1026B1ee91C07B2534e1796632A4";

export type DeployConfig = {
  usdc: string;
  ethUsdFeed: string;
  sequencerFeed: string;
  dappWallet: string;
  coFounder: string; // address(0) se ainda não houver
};

export async function deployV2(cfg: DeployConfig) {
  const [deployer] = await ethers.getSigners();

  const impl = await ethers.deployContract("NeuroArtVaultV2");
  await impl.waitForDeployment();
  console.log("1/4 NeuroArtVaultV2 (implementação):", await impl.getAddress());

  const factory = await ethers.deployContract("ArtVaultFactoryV2", [await impl.getAddress(), deployer.address, cfg.coFounder]);
  await factory.waitForDeployment();
  console.log("2/4 ArtVaultFactoryV2:               ", await factory.getAddress());

  const mp = await ethers.deployContract("FractionMarketplaceV2", [
    cfg.usdc, cfg.ethUsdFeed, cfg.sequencerFeed, cfg.dappWallet, deployer.address, cfg.coFounder,
  ]);
  await mp.waitForDeployment();
  console.log("3/4 FractionMarketplaceV2:           ", await mp.getAddress());

  const tx = await mp.pause();
  await tx.wait();
  if (!(await mp.paused())) throw new Error("Marketplace NÃO ficou pausado — investigue antes de continuar");
  console.log("4/4 Marketplace pausado:              sim");

  return { impl, factory, mp };
}

async function main() {
  const { chainId } = await ethers.provider.getNetwork();
  const [deployer] = await ethers.getSigners();
  const isMainnet = chainId === 8453n;
  const isLocal = chainId === 31337n;

  if (!isMainnet && !isLocal) throw new Error(`Rede inesperada (chainId ${chainId}). Use --network base ou o fork local.`);

  if (isMainnet) {
    if (process.env.CONFIRM_MAINNET !== "SIM") {
      throw new Error("Deploy na Mainnet bloqueado. Rode com CONFIRM_MAINNET=SIM depois do ensaio no fork.");
    }
    if (deployer.address.toLowerCase() !== DAPP_WALLET.toLowerCase()) {
      throw new Error(`A carteira de deploy (${deployer.address}) não é a da DApp (${DAPP_WALLET}). Confira o PRIVATE_KEY do contracts/.env.`);
    }
  }

  // Hardhat não conhece os hardforks da Base: no fork, leituras no próprio bloco do fork falham
  if (isLocal) await network.provider.send("hardhat_mine", ["0x1"]);

  // No fork local o feed precisa existir: confere antes de gastar qualquer coisa
  const code = await ethers.provider.getCode(BASE.ethUsdFeed);
  if (code === "0x") throw new Error("Feed ETH/USD sem código nesta rede. No ensaio, o hardhat node precisa estar com --fork da Base.");

  const coFounder = process.env.CO_FOUNDER_ADDRESS ?? ethers.ZeroAddress;
  if (coFounder !== ethers.ZeroAddress && !ethers.isAddress(coFounder)) throw new Error("CO_FOUNDER_ADDRESS inválido");

  const bal = await ethers.provider.getBalance(deployer.address);
  console.log(`Rede:       ${network.name} (chainId ${chainId})`);
  console.log(`Deployer:   ${deployer.address}  saldo ${ethers.formatEther(bal)} ETH`);
  console.log(`DApp (20%): ${DAPP_WALLET}`);
  console.log(`Cofundador: ${coFounder === ethers.ZeroAddress ? "(nenhum por enquanto)" : coFounder}\n`);

  const cfg: DeployConfig = { ...BASE, dappWallet: DAPP_WALLET, coFounder };
  const { impl, factory, mp } = await deployV2(cfg);

  const out = {
    chainId: Number(chainId),
    deployedAt: new Date().toISOString(),
    deployer: deployer.address,
    NeuroArtVaultV2: await impl.getAddress(),
    ArtVaultFactoryV2: await factory.getAddress(),
    FractionMarketplaceV2: await mp.getAddress(),
    config: cfg,
  };
  const dir = path.join(__dirname, "..", "deployments");
  fs.mkdirSync(dir, { recursive: true });
  const file = path.join(dir, `v2-${chainId}.json`);
  fs.writeFileSync(file, JSON.stringify(out, null, 2));
  console.log(`\nEndereços salvos em ${path.relative(process.cwd(), file)}`);

  if (isMainnet) {
    console.log("\nVerificação no BaseScan:");
    console.log(`npx hardhat verify --network base ${out.NeuroArtVaultV2}`);
    console.log(`npx hardhat verify --network base ${out.ArtVaultFactoryV2} ${out.NeuroArtVaultV2} ${deployer.address} ${coFounder}`);
    console.log(`npx hardhat verify --network base ${out.FractionMarketplaceV2} ${cfg.usdc} ${cfg.ethUsdFeed} ${cfg.sequencerFeed} ${cfg.dappWallet} ${deployer.address} ${coFounder}`);
  }
}

if (require.main === module) {
  main().catch((e) => {
    console.error("\nERRO:", e.message ?? e);
    process.exitCode = 1;
  });
}
