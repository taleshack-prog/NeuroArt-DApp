/**
 * Pausa ou despausa o FractionMarketplaceV2 (função exclusiva do FOUNDER_ROLE).
 * Pausado = ninguém compra (nem USDC nem ETH). Listagens e preços não mudam.
 *
 * Ver o estado (não envia nada):
 *   npx hardhat run scripts/pauseV2.ts --network base
 * Simular uma ação (não envia nada):
 *   ACTION=unpause npx hardhat run scripts/pauseV2.ts --network base
 * Executar de verdade:
 *   CONFIRM_MAINNET=SIM ACTION=unpause npx hardhat run scripts/pauseV2.ts --network base
 *   CONFIRM_MAINNET=SIM ACTION=pause   npx hardhat run scripts/pauseV2.ts --network base
 */
import { ethers } from "hardhat";
import * as fs from "fs";
import * as path from "path";

async function waitFor<T>(fn: () => Promise<T>, ok: (v: T) => boolean, tries = 10): Promise<T> {
  let v = await fn();
  for (let i = 1; i < tries && !ok(v); i++) {
    await new Promise((r) => setTimeout(r, 2000));
    v = await fn();
  }
  return v;
}

async function main() {
  const { chainId } = await ethers.provider.getNetwork();
  const [signer] = await ethers.getSigners();
  const send = chainId === 8453n ? process.env.CONFIRM_MAINNET === "SIM" : process.env.SEND === "SIM";
  const action = (process.env.ACTION ?? "status").toLowerCase();
  if (!["status", "pause", "unpause"].includes(action)) throw new Error("ACTION deve ser pause, unpause ou status");

  const dep = JSON.parse(fs.readFileSync(path.join(__dirname, "..", "deployments", `v2-${chainId}.json`), "utf8"));
  const mp = await ethers.getContractAt("FractionMarketplaceV2", dep.FractionMarketplaceV2, signer);

  const paused: boolean = await mp.paused();
  const isFounder: boolean = await mp.hasRole(await mp.FOUNDER_ROLE(), signer.address);
  console.log(`Marketplace: ${dep.FractionMarketplaceV2}`);
  console.log(`Carteira:    ${signer.address}  founder: ${isFounder}`);
  console.log(`Estado:      ${paused ? "PAUSADO (vendas bloqueadas)" : "ATIVO (vendas abertas)"}`);
  if (action === "status") return;

  const want = action === "pause";
  if (paused === want) {
    console.log(`Nada a fazer: já está ${want ? "pausado" : "ativo"}.`);
    return;
  }
  if (!isFounder) throw new Error("Esta carteira não tem FOUNDER_ROLE; a transação seria recusada.");

  if (!send) {
    console.log(`\nSIMULAÇÃO: enviaria ${action}(). Nada foi enviado.`);
    console.log("Para executar: CONFIRM_MAINNET=SIM (Mainnet) ou SEND=SIM (local).");
    return;
  }

  const tx = want ? await mp.pause({ gasLimit: 100_000n }) : await mp.unpause({ gasLimit: 100_000n });
  const rc = await tx.wait();
  if (rc?.status !== 1) throw new Error(`Transação falhou (tx ${tx.hash})`);
  const now = await waitFor(() => mp.paused(), (p: boolean) => p === want);
  console.log(`\n${want ? "Pausado" : "Despausado"}  (tx ${rc.hash})`);
  console.log(`Estado agora: ${now ? "PAUSADO" : "ATIVO"}`);
}

if (require.main === module) {
  main().catch((e) => {
    console.error("\nERRO:", e.shortMessage ?? e.message ?? e);
    process.exitCode = 1;
  });
}
