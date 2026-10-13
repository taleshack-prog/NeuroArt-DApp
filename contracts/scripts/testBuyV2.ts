/**
 * Compra de teste no FractionMarketplaceV2: 0,01 fração em USDC e/ou ETH.
 *
 * Como a pausa bloqueia TODAS as compras, o script:
 *   1. despausa (se estiver pausado)
 *   2. compra em USDC e/ou ETH
 *   3. pausa de novo — SEMPRE, mesmo se uma compra falhar (bloco finally)
 *
 * Com a carteira da DApp como compradora, artista e dappWallet, o dinheiro e as frações
 * voltam para a mesma carteira: o custo real é só o gás.
 *
 * Simulação (padrão, não envia nada):
 *   OBRA_ID=1777841548376 npx hardhat run scripts/testBuyV2.ts --network base
 * Execução real:
 *   CONFIRM_MAINNET=SIM OBRA_ID=1777841548376 npx hardhat run scripts/testBuyV2.ts --network base
 * Opcional: MODE=usdc | eth | both (padrão both; sem saldo de USDC, a parte USDC é pulada)
 */
import { ethers } from "hardhat";
import * as fs from "fs";
import * as path from "path";

const AMOUNT = 10n ** 16n; // 0,01 fração (18 decimais)
// Gás fixo nas compras: evita que um nó do RPC público, ainda sem o bloco do unpause, recuse a estimativa
const BUY_GAS = 400_000n;
const ERC20 = [
  "function balanceOf(address) view returns (uint256)",
  "function allowance(address,address) view returns (uint256)",
  "function approve(address,uint256) returns (bool)",
];

async function main() {
  const { chainId } = await ethers.provider.getNetwork();
  const [signer] = await ethers.getSigners();
  const send = chainId === 8453n ? process.env.CONFIRM_MAINNET === "SIM" : process.env.SEND === "SIM";
  const mode = (process.env.MODE ?? "both").toLowerCase();
  if (!["usdc", "eth", "both"].includes(mode)) throw new Error("MODE deve ser usdc, eth ou both");

  const obraId = process.env.OBRA_ID;
  if (!obraId || !/^\d+$/.test(obraId)) throw new Error("Informe OBRA_ID, ex.: OBRA_ID=1777841548376");

  const dep = JSON.parse(fs.readFileSync(path.join(__dirname, "..", "deployments", `v2-${chainId}.json`), "utf8"));
  const mp = await ethers.getContractAt("FractionMarketplaceV2", dep.FractionMarketplaceV2, signer);
  const usdc = new ethers.Contract(await mp.usdc(), ERC20, signer);

  const l = await mp.getListing(obraId);
  if (!l.active) throw new Error("Obra não está listada no v2");
  const vault = new ethers.Contract(l.vault, ERC20, signer);
  const fresh = await mp.isPriceFresh(obraId);
  const avail = await mp.available(obraId);
  const qUsdc: bigint = await mp.quoteUSDC(obraId, AMOUNT);
  let qEth = 0n;
  let ethErr = "";
  try { qEth = await mp.quoteETH(obraId, AMOUNT); } catch (e: any) { ethErr = e.shortMessage ?? e.message; }
  const balUsdc: bigint = await usdc.balanceOf(signer.address);
  const balEth = await ethers.provider.getBalance(signer.address);
  const wasPaused: boolean = await mp.paused();

  const doUsdc = mode !== "eth" && balUsdc >= qUsdc;
  const doEth = mode !== "usdc";
  if (!doUsdc && !doEth) throw new Error("Nada a comprar: sem saldo de USDC e MODE=usdc");
  if (doEth && ethErr) throw new Error(`Cotação em ETH indisponível (nada foi enviado): ${ethErr}`);

  console.log(`Rede:        chainId ${chainId}  ${send ? "(ENVIANDO transações)" : "(SIMULAÇÃO — nada será enviado)"}`);
  console.log(`Carteira:    ${signer.address}  ETH ${ethers.formatEther(balEth)}  USDC ${ethers.formatUnits(balUsdc, 6)}`);
  console.log(`Obra:        ${obraId}  vault ${l.vault}`);
  console.log(`Preço:       US$ ${(Number(l.priceUsd6) / 1e6).toFixed(6)}/fração  fresco: ${fresh}  disponível: ${ethers.formatEther(avail)} frações`);
  console.log(`0,01 fração: ${ethers.formatUnits(qUsdc, 6)} USDC  |  ${ethers.formatEther(qEth)} ETH`);
  console.log(`Pausado:     ${wasPaused}`);
  console.log(`Plano:       ${wasPaused ? "despausar → " : ""}${doUsdc ? "comprar em USDC → " : ""}${doEth ? "comprar em ETH → " : ""}${wasPaused ? "pausar de novo" : "(já estava despausado; não mexe na pausa)"}`);
  if (mode !== "eth" && !doUsdc) console.log(`             (USDC pulado: saldo ${ethers.formatUnits(balUsdc, 6)} < ${ethers.formatUnits(qUsdc, 6)})`);
  console.log("");

  if (!fresh) throw new Error("Preço vencido (mais de 36h). Renove com setPrice antes do teste.");
  if (avail < AMOUNT * 2n) throw new Error("Frações insuficientes no marketplace");

  if (!send) {
    console.log("Nada foi enviado. Para executar: CONFIRM_MAINNET=SIM (Mainnet) ou SEND=SIM (local).");
    return;
  }

  let unpausedHere = false;
  try {
    if (wasPaused) {
      const rc = await (await mp.unpause({ gasLimit: 100_000n })).wait();
      unpausedHere = true;
      console.log(`1. Despausado            (tx ${rc!.hash})`);
    }

    if (doUsdc) {
      const allowance: bigint = await usdc.allowance(signer.address, dep.FractionMarketplaceV2);
      if (allowance < qUsdc) {
        const rcA = await (await usdc.approve(dep.FractionMarketplaceV2, qUsdc)).wait();
        console.log(`2a. Approve USDC         (tx ${rcA!.hash})`);
      }
      const rcU = await (await mp.buyWithUSDC(obraId, AMOUNT, qUsdc, { gasLimit: BUY_GAS })).wait();
      console.log(`2b. Compra USDC ok       (tx ${rcU!.hash})`);
    }

    if (doEth) {
      const value = (qEth * 102n) / 100n; // 2% de folga contra variação do oráculo; o excesso volta
      const rcE = await (await mp.buyWithETH(obraId, AMOUNT, { value, gasLimit: BUY_GAS })).wait();
      console.log(`3. Compra ETH ok         (tx ${rcE!.hash})`);
    }
  } finally {
    if (unpausedHere) {
      const rcP = await (await mp.pause({ gasLimit: 100_000n })).wait();
      const ok = await mp.paused({ blockTag: rcP!.blockNumber });
      console.log(`4. Pausado de novo: ${ok}  (tx ${rcP!.hash})`);
    }
  }

  const fr: bigint = await vault.balanceOf(signer.address);
  console.log(`\nFrações NA-OLV na carteira agora: ${ethers.formatEther(fr)}`);
  console.log(`Frações restantes no marketplace: ${ethers.formatEther(await mp.available(obraId))}`);
}

if (require.main === module) {
  main().catch((e) => {
    console.error("\nERRO:", e.shortMessage ?? e.message ?? e);
    process.exitCode = 1;
  });
}
