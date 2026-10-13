/**
 * Cria o vault v2 de UMA obra e lista no FractionMarketplaceV2, depositando todas as frações.
 *
 * Fluxo:
 *   1. Lê a obra em /api/submissions (título, frações, IPFS, artistWallet, valor em BRL)
 *   2. Cotação USD/BRL do dia em DUAS fontes; aborta se faltar uma ou se divergirem > 1%
 *   3. priceUsd6 = valorBRL / frações / USDBRL  (USD com 6 casas, por fração)
 *   4. factory.createVault  -> frações mintadas para a carteira da DApp
 *   5. vault.approve(marketplace) + marketplace.listObra(..., todas as frações)
 *
 * É idempotente: se o vault ou a listagem já existirem, pula a etapa (não duplica).
 * O marketplace continua PAUSADO — este script não despausa.
 *
 * Simulação (padrão, não envia nada):
 *   OBRA_ID=1777841548376 SYMBOL=NA-OLV npx hardhat run scripts/listObraV2.ts --network base
 * Execução real:
 *   CONFIRM_MAINNET=SIM OBRA_ID=1777841548376 SYMBOL=NA-OLV npx hardhat run scripts/listObraV2.ts --network base
 */
import { ethers } from "hardhat";
import * as fs from "fs";
import * as path from "path";

const SUBMISSIONS_URL = process.env.SUBMISSIONS_URL ?? "https://neuro-art-d-app.vercel.app/api/submissions";
const MAX_DIVERGENCE = 0.01; // 1%

type Submission = {
  id: string; title: string; artistWallet: string; totalFractions: number;
  ipfsCid: string | null; valorObra: string | number; moeda: string; status: string;
};

async function fetchJson(url: string) {
  const r = await fetch(url, { headers: { accept: "application/json" } });
  if (!r.ok) throw new Error(`${url} respondeu ${r.status}`);
  return r.json();
}

/** USD->BRL em duas fontes independentes. Nunca usa valor fixo de reserva. */
export async function usdBrlRate(): Promise<{ rate: number; sources: Record<string, number> }> {
  const a = await fetchJson("https://api.exchangerate-api.com/v4/latest/USD");
  const b = await fetchJson("https://economia.awesomeapi.com.br/json/last/USD-BRL");
  const r1 = Number(a?.rates?.BRL);
  const r2 = Number(b?.USDBRL?.bid);
  if (!(r1 > 3 && r1 < 10)) throw new Error(`exchangerate-api devolveu cotação inválida: ${a?.rates?.BRL}`);
  if (!(r2 > 3 && r2 < 10)) throw new Error(`AwesomeAPI devolveu cotação inválida: ${b?.USDBRL?.bid}`);
  const div = Math.abs(r1 - r2) / Math.min(r1, r2);
  if (div > MAX_DIVERGENCE) throw new Error(`Cotações divergem ${(div * 100).toFixed(2)}% (${r1} x ${r2}). Abortado.`);
  return { rate: (r1 + r2) / 2, sources: { exchangerateApi: r1, awesomeApi: r2 } };
}

/** Preço por fração em USD com 6 casas. */
export function priceUsd6(valorBRL: number, fractions: number, usdBrl: number): bigint {
  if (!(valorBRL > 0) || !(fractions > 0) || !(usdBrl > 0)) throw new Error("valor, frações e cotação precisam ser > 0");
  return BigInt(Math.round((valorBRL / fractions / usdBrl) * 1e6));
}

async function main() {
  const { chainId } = await ethers.provider.getNetwork();
  const [signer] = await ethers.getSigners();
  const send = chainId === 8453n ? process.env.CONFIRM_MAINNET === "SIM" : process.env.SEND === "SIM";

  const obraId = process.env.OBRA_ID;
  const symbol = process.env.SYMBOL;
  if (!obraId || !/^\d+$/.test(obraId)) throw new Error("Informe OBRA_ID (numérico), ex.: OBRA_ID=1777841548376");
  if (!symbol || !/^[A-Z0-9-]{2,11}$/.test(symbol)) throw new Error("Informe SYMBOL em maiúsculas, ex.: SYMBOL=NA-OLV");

  const depFile = path.join(__dirname, "..", "deployments", `v2-${chainId}.json`);
  if (!fs.existsSync(depFile)) throw new Error(`Não achei ${depFile}. Rode o deployV2 nesta rede antes.`);
  const dep = JSON.parse(fs.readFileSync(depFile, "utf8"));

  const factory = await ethers.getContractAt("ArtVaultFactoryV2", dep.ArtVaultFactoryV2, signer);
  const mp = await ethers.getContractAt("FractionMarketplaceV2", dep.FractionMarketplaceV2, signer);

  // ---- dados da obra
  const subs: Submission[] = process.env.SUBMISSIONS_FILE
    ? JSON.parse(fs.readFileSync(process.env.SUBMISSIONS_FILE, "utf8"))
    : await fetchJson(SUBMISSIONS_URL);
  const obra = subs.find((s) => String(s.id) === obraId);
  if (!obra) throw new Error(`Obra ${obraId} não encontrada em ${SUBMISSIONS_URL}`);
  if (obra.moeda !== "BRL") throw new Error(`Obra em ${obra.moeda}; este script só trata valor em BRL`);
  if (!ethers.isAddress(obra.artistWallet)) throw new Error(`artistWallet inválida: ${obra.artistWallet}`);
  const fractions = Number(obra.totalFractions);
  if (!Number.isInteger(fractions) || fractions < 1) throw new Error(`totalFractions inválido: ${obra.totalFractions}`);
  const valorBRL = Number(obra.valorObra);

  // ---- cotação e preço
  const fx = process.env.TEST_USD_BRL && chainId === 31337n
    ? { rate: Number(process.env.TEST_USD_BRL), sources: { teste: Number(process.env.TEST_USD_BRL) } }
    : await usdBrlRate();
  const price = priceUsd6(valorBRL, fractions, fx.rate);
  const name = `NeuroArt ${obra.title}`;

  console.log(`Rede:          chainId ${chainId}  ${send ? "(ENVIANDO transações)" : "(SIMULAÇÃO — nada será enviado)"}`);
  console.log(`Carteira:      ${signer.address}`);
  console.log(`Obra:          ${obra.title} (${obraId})`);
  console.log(`Token:         ${name} / ${symbol}  — ${fractions} frações`);
  console.log(`Artista (80%): ${obra.artistWallet}`);
  console.log(`Valor:         R$ ${valorBRL.toLocaleString("pt-BR")}  → R$ ${(valorBRL / fractions).toFixed(2)} por fração`);
  console.log(`Cotação:       USD/BRL ${fx.rate.toFixed(4)}  ${JSON.stringify(fx.sources)}`);
  console.log(`Preço:         US$ ${(Number(price) / 1e6).toFixed(6)} por fração  (priceUsd6 = ${price})`);
  console.log(`Marketplace:   ${dep.FractionMarketplaceV2}  pausado: ${await mp.paused()}\n`);

  // ---- 1. vault
  let vaultAddr: string = await factory.getVault(obraId);
  if (vaultAddr !== ethers.ZeroAddress) {
    console.log(`1/3 Vault já existe: ${vaultAddr} (pulando criação)`);
  } else if (!send) {
    console.log("1/3 [simulação] criaria o vault");
  } else {
    const tx = await factory.createVault({
      obraId, name, symbol, ipfsHash: obra.ipfsCid ?? "", artist: obra.artistWallet, fractions, recipient: signer.address,
    });
    const rc = await tx.wait();
    vaultAddr = await factory.getVault(obraId, { blockTag: rc!.blockNumber });
    console.log(`1/3 Vault criado: ${vaultAddr}  (tx ${rc!.hash})`);
  }

  // ---- 2 e 3. approve + listObra
  const listing = await mp.getListing(obraId);
  if (listing.active) {
    console.log(`2/3 e 3/3 Obra já listada (vault ${listing.vault}, US$ ${(Number(listing.priceUsd6) / 1e6).toFixed(6)}) — nada a fazer`);
    return;
  }
  if (!send) {
    console.log(`2/3 [simulação] aprovaria ${fractions} frações para o marketplace`);
    console.log(`3/3 [simulação] listaria a obra a US$ ${(Number(price) / 1e6).toFixed(6)} por fração`);
    console.log("\nNada foi enviado. Para executar: CONFIRM_MAINNET=SIM (Mainnet) ou SEND=SIM (local).");
    return;
  }

  const vault = await ethers.getContractAt("NeuroArtVaultV2", vaultAddr, signer);
  const amount = BigInt(fractions) * 10n ** 18n;
  const bal: bigint = await vault.balanceOf(signer.address);
  if (bal < amount) throw new Error(`A carteira tem ${ethers.formatEther(bal)} frações; precisa de ${fractions}`);

  const rcA = await (await vault.approve(dep.FractionMarketplaceV2, amount)).wait();
  console.log(`2/3 Approve ok (tx ${rcA!.hash})`);

  const rcL = await (await mp.listObra(obraId, vaultAddr, obra.artistWallet, price, amount)).wait();
  const after = await mp.getListing(obraId, { blockTag: rcL!.blockNumber });
  const avail = await mp.available(obraId, { blockTag: rcL!.blockNumber });
  console.log(`3/3 Listada (tx ${rcL!.hash}) — ativa: ${after.active}, frações no marketplace: ${ethers.formatEther(avail)}`);
}

if (require.main === module) {
  main().catch((e) => {
    console.error("\nERRO:", e.message ?? e);
    process.exitCode = 1;
  });
}
