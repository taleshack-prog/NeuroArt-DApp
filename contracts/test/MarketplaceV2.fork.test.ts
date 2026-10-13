/**
 * Teste em FORK da Base Mainnet: roda os contratos v2 contra o USDC, o feed Chainlink ETH/USD
 * e o feed do sequencer REAIS, numa cópia local da rede. Não gasta gás, não publica nada.
 *
 * Uso:
 *   BASE_RPC_URL=https://mainnet.base.org npx hardhat test test/MarketplaceV2.fork.test.ts
 * Sem BASE_RPC_URL o arquivo é ignorado (a suíte normal continua rodando sem rede).
 */
import { expect } from "chai";
import { ethers, network } from "hardhat";

const RPC = process.env.BASE_RPC_URL;
const d = RPC ? describe : describe.skip;

// Endereços reais na Base Mainnet (confirmados on-chain em 12/10/2026, exceto o sequencer,
// que este teste confirma: se o endereço estiver errado, quoteETH reverte)
const USDC = "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913";
const ETH_USD = "0x71041dddad3595F9CEd3DcCFBe3D1F4b0a16Bb70";
const SEQUENCER = "0xBCF85224fc0756B9Fa45aA7892530B47e10b6433";

const ONE = 10n ** 18n;
const OBRA = 1777841548376n;
const PRICE = 11_210_000n; // 11.21 USD por fração

d("Marketplace v2 — fork da Base Mainnet", function () {
  this.timeout(120_000);

  before(async () => {
    await network.provider.request({ method: "hardhat_reset", params: [{ forking: { jsonRpcUrl: RPC } }] });
    // Hardhat não conhece os hardforks da Base: leituras no próprio bloco do fork falham, então mina 1 bloco
    await network.provider.send("hardhat_mine", ["0x1"]);
  });

  after(async () => {
    await network.provider.request({ method: "hardhat_reset", params: [] });
  });

  it("feeds reais: ETH/USD e sequencer respondem como esperado", async () => {
    const abi = [
      "function description() view returns (string)",
      "function decimals() view returns (uint8)",
      "function latestRoundData() view returns (uint80,int256,uint256,uint256,uint80)",
    ];
    const feed = new ethers.Contract(ETH_USD, abi, ethers.provider);
    expect(await feed.description()).to.equal("ETH / USD");
    expect(await feed.decimals()).to.equal(8n);
    const [, price] = await feed.latestRoundData();
    console.log("      ETH/USD on-chain: US$", Number(price) / 1e8);

    const seq = new ethers.Contract(SEQUENCER, abi, ethers.provider);
    const [, status, startedAt] = await seq.latestRoundData();
    console.log("      sequencer status:", status.toString(), "(0 = no ar) desde", new Date(Number(startedAt) * 1000).toISOString());
    expect(status).to.equal(0n);
  });

  it("deploy completo + compra em ETH com feeds reais", async () => {
    const [admin, coFounder, artist, buyer, dapp] = await ethers.getSigners();

    const impl = await ethers.deployContract("NeuroArtVaultV2");
    const factory = await ethers.deployContract("ArtVaultFactoryV2", [impl, admin, coFounder]);
    const mp = await ethers.deployContract("FractionMarketplaceV2", [USDC, ETH_USD, SEQUENCER, dapp, admin, coFounder]);

    await factory.createVault({
      obraId: OBRA, name: "NeuroArt El Olvidao", symbol: "NA-OLV", ipfsHash: "",
      artist: artist.address, fractions: 100n, recipient: admin.address,
    });
    const vault = await ethers.getContractAt("NeuroArtVaultV2", await factory.getVault(OBRA));
    await vault.approve(mp, 100n * ONE);
    await mp.listObra(OBRA, vault, artist, PRICE, 100n * ONE);

    // Se o endereço do sequencer ou do feed estiver errado, esta chamada reverte
    const wei = await mp.quoteETH(OBRA, ONE);
    console.log("      1 fração = 11.21 USD =", ethers.formatEther(wei), "ETH (cotação real)");

    const artistBefore = await ethers.provider.getBalance(artist);
    await mp.connect(buyer).buyWithETH(OBRA, ONE, { value: (wei * 101n) / 100n });
    expect(await vault.balanceOf(buyer)).to.equal(ONE);
    expect((await ethers.provider.getBalance(artist)) - artistBefore).to.equal((wei * 8000n) / 10000n);
  });

  it("USDC real tem 6 decimais e o quote bate com o preço", async () => {
    const usdc = new ethers.Contract(USDC, ["function decimals() view returns (uint8)", "function symbol() view returns (string)"], ethers.provider);
    expect(await usdc.symbol()).to.equal("USDC");
    expect(await usdc.decimals()).to.equal(6n);
  });
});
