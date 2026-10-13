import { expect } from "chai";
import { ethers } from "hardhat";
import { time, loadFixture } from "@nomicfoundation/hardhat-network-helpers";

const ONE = 10n ** 18n;            // 1 fração
const OBRA = 1777841548376n;       // El Olvidao
const PRICE = 11_210_000n;         // 11.21 USDC por fração (6 dec)
const ETH_USD = 2425_47370660n;    // US$ 2425.4737066 (8 dec)
const HOUR = 3600;

describe("Marketplace v2", () => {
  async function deploy() {
    const [admin, coFounder, keeper, artist, buyer, dapp, stranger] = await ethers.getSigners();

    const usdc = await ethers.deployContract("MockUSDC");
    const feed = await ethers.deployContract("MockAggregator", [8, ETH_USD]);
    const now = await time.latest();
    const seq = await ethers.deployContract("MockAggregator", [0, 0]);
    await seq.set(0, now - 2 * HOUR, now - 2 * HOUR); // sequencer no ar há 2h

    const impl = await ethers.deployContract("NeuroArtVaultV2");
    const factory = await ethers.deployContract("ArtVaultFactoryV2", [impl, admin, coFounder]);
    const mp = await ethers.deployContract("FractionMarketplaceV2", [usdc, feed, seq, dapp, admin, coFounder]);
    await mp.grantRole(await mp.PRICE_KEEPER_ROLE(), keeper);

    await factory.createVault({
      obraId: OBRA, name: "NeuroArt El Olvidao", symbol: "NA-OLV", ipfsHash: "bafy...",
      artist: artist.address, fractions: 100n, recipient: admin.address,
    });
    const vault = await ethers.getContractAt("NeuroArtVaultV2", await factory.getVault(OBRA));

    await vault.approve(mp, 100n * ONE);
    await mp.listObra(OBRA, vault, artist, PRICE, 100n * ONE);

    await usdc.mint(buyer, 10_000n * 1_000_000n);
    await usdc.connect(buyer).approve(mp, ethers.MaxUint256);

    return { admin, coFounder, keeper, artist, buyer, dapp, stranger, usdc, feed, seq, impl, factory, mp, vault };
  }

  describe("Vault", () => {
    it("clone tem nome e símbolo (corrige o token sem nome do v1)", async () => {
      const { vault } = await loadFixture(deploy);
      expect(await vault.name()).to.equal("NeuroArt El Olvidao");
      expect(await vault.symbol()).to.equal("NA-OLV");
      expect(await vault.totalSupply()).to.equal(100n * ONE);
    });

    it("implementação não pode ser inicializada por terceiros", async () => {
      const { impl, stranger } = await loadFixture(deploy);
      await expect(
        impl.connect(stranger).initialize("x", "x", 1, "", stranger.address, 1, stranger.address)
      ).to.be.revertedWithCustomError(impl, "InvalidInitialization");
    });

    it("resgate físico exige 100% e queima tudo", async () => {
      const { factory, admin } = await loadFixture(deploy);
      await factory.createVault({ obraId: 2n, name: "A", symbol: "A", ipfsHash: "", artist: admin.address, fractions: 10n, recipient: admin.address });
      const v = await ethers.getContractAt("NeuroArtVaultV2", await factory.getVault(2n));
      await expect(v.redeemPhysical()).to.emit(v, "PhysicalRedeemed");
      expect(await v.totalSupply()).to.equal(0n);
      await expect(v.redeemPhysical()).to.be.revertedWith("Vault: already redeemed");
    });
  });

  describe("Factory", () => {
    it("massDeploy funciona (no v1 revertia sempre por causa do this.createVault)", async () => {
      const { factory, coFounder, artist } = await loadFixture(deploy);
      await factory.connect(coFounder).massDeploy([
        { obraId: 10n, name: "A", symbol: "A", ipfsHash: "", artist: artist.address, fractions: 1000n, recipient: coFounder.address },
        { obraId: 11n, name: "B", symbol: "B", ipfsHash: "", artist: artist.address, fractions: 100n, recipient: coFounder.address },
      ]);
      expect(await factory.totalObras()).to.equal(3n);
    });

    it("quem não é fundador não cria vault", async () => {
      const { factory, stranger } = await loadFixture(deploy);
      await expect(factory.connect(stranger).createVault({ obraId: 9n, name: "A", symbol: "A", ipfsHash: "", artist: stranger.address, fractions: 1n, recipient: stranger.address }))
        .to.be.revertedWithCustomError(factory, "AccessControlUnauthorizedAccount");
    });
  });

  describe("Listagem", () => {
    it("listObra deposita as frações no marketplace", async () => {
      const { mp } = await loadFixture(deploy);
      expect(await mp.available(OBRA)).to.equal(100n * ONE);
    });

    it("mesmo vault não pode ser listado em outra obra", async () => {
      const { mp, vault, artist } = await loadFixture(deploy);
      await expect(mp.listObra(999n, vault, artist, PRICE, 0)).to.be.revertedWith("MP: vault used by another obra");
    });
  });

  describe("Compra em USDC", () => {
    it("cobra o preço on-chain e divide 80/20", async () => {
      const { mp, usdc, vault, buyer, artist, dapp } = await loadFixture(deploy);
      const total = await mp.quoteUSDC(OBRA, 2n * ONE);
      expect(total).to.equal(22_420_000n); // 2 × 11.21
      await mp.connect(buyer).buyWithUSDC(OBRA, 2n * ONE, total);
      expect(await vault.balanceOf(buyer)).to.equal(2n * ONE);
      expect(await usdc.balanceOf(artist)).to.equal(17_936_000n); // 80%
      expect(await usdc.balanceOf(dapp)).to.equal(4_484_000n);    // 20%
    });

    it("reverte se o preço passar do teto aceito pelo comprador", async () => {
      const { mp, buyer } = await loadFixture(deploy);
      await expect(mp.connect(buyer).buyWithUSDC(OBRA, ONE, PRICE - 1n)).to.be.revertedWith("MP: price above max");
    });

    it("reverte com preço velho (sem atualização há mais de 36h)", async () => {
      const { mp, buyer } = await loadFixture(deploy);
      await time.increase(37 * HOUR);
      await expect(mp.connect(buyer).buyWithUSDC(OBRA, ONE, PRICE)).to.be.revertedWith("MP: stale price");
    });

    it("reverte se não houver frações suficientes", async () => {
      const { mp, buyer } = await loadFixture(deploy);
      await expect(mp.connect(buyer).buyWithUSDC(OBRA, 101n * ONE, ethers.MaxUint256)).to.be.revertedWith("MP: not enough fractions");
    });

    it("reverte com o marketplace pausado", async () => {
      const { mp, coFounder, buyer } = await loadFixture(deploy);
      await mp.connect(coFounder).pause();
      await expect(mp.connect(buyer).buyWithUSDC(OBRA, ONE, PRICE)).to.be.revertedWithCustomError(mp, "EnforcedPause");
    });
  });

  describe("Compra em ETH (Chainlink)", () => {
    it("converte USD em ETH pela cotação do feed e devolve o excesso", async () => {
      const { mp, buyer, artist, dapp, vault } = await loadFixture(deploy);
      const wei = await mp.quoteETH(OBRA, ONE);
      // 11.21 / 2425.4737066 ≈ 0.00462178 ETH, arredondado para cima
      const esperado = (PRICE * 10n ** 20n + ETH_USD - 1n) / ETH_USD;
      expect(wei).to.equal(esperado);
      expect(wei).to.be.closeTo(4_621_777_580_000_000n, 10_000_000_000n);
      const artistBefore = await ethers.provider.getBalance(artist);
      const dappBefore = await ethers.provider.getBalance(dapp);
      await expect(mp.connect(buyer).buyWithETH(OBRA, ONE, { value: wei * 2n }))
        .to.changeEtherBalance(buyer, -wei, { includeFee: false });
      expect(await vault.balanceOf(buyer)).to.equal(ONE);
      const artistGot = (await ethers.provider.getBalance(artist)) - artistBefore;
      const dappGot = (await ethers.provider.getBalance(dapp)) - dappBefore;
      expect(artistGot + dappGot).to.equal(wei);
      expect(artistGot).to.equal((wei * 8000n) / 10000n);
    });

    it("reverte com ETH insuficiente", async () => {
      const { mp, buyer } = await loadFixture(deploy);
      const wei = await mp.quoteETH(OBRA, ONE);
      await expect(mp.connect(buyer).buyWithETH(OBRA, ONE, { value: wei - 1n })).to.be.revertedWith("MP: insufficient ETH");
    });

    it("reverte com oráculo velho", async () => {
      const { mp, feed, buyer } = await loadFixture(deploy);
      const now = await time.latest();
      await feed.set(ETH_USD, now - 4 * HOUR, now - 4 * HOUR);
      await expect(mp.connect(buyer).buyWithETH(OBRA, ONE, { value: ONE })).to.be.revertedWith("MP: stale oracle");
    });

    it("reverte com o sequencer da Base fora do ar", async () => {
      const { mp, seq, buyer } = await loadFixture(deploy);
      const now = await time.latest();
      await seq.set(1, now, now);
      await expect(mp.connect(buyer).buyWithETH(OBRA, ONE, { value: ONE })).to.be.revertedWith("MP: sequencer down");
    });

    it("reverte logo após o sequencer voltar (período de carência)", async () => {
      const { mp, seq, buyer } = await loadFixture(deploy);
      const now = await time.latest();
      await seq.set(0, now - 60, now - 60);
      await expect(mp.connect(buyer).buyWithETH(OBRA, ONE, { value: ONE })).to.be.revertedWith("MP: sequencer grace period");
    });
  });

  describe("Keeper de preço", () => {
    it("atualiza dentro de ±10% após 12h", async () => {
      const { mp, keeper } = await loadFixture(deploy);
      await time.increase(12 * HOUR);
      const novo = (PRICE * 105n) / 100n;
      await expect(mp.connect(keeper).updatePrices([OBRA], [novo])).to.emit(mp, "PriceUpdated");
      expect((await mp.getListing(OBRA)).priceUsd6).to.equal(novo);
    });

    it("não pode variar mais de 10%", async () => {
      const { mp, keeper } = await loadFixture(deploy);
      await time.increase(12 * HOUR);
      await expect(mp.connect(keeper).updatePrices([OBRA], [PRICE / 2n])).to.be.revertedWith("MP: deviation too high");
    });

    it("não pode atualizar antes de 12h (impede derrubar o preço em várias chamadas)", async () => {
      const { mp, keeper } = await loadFixture(deploy);
      await expect(mp.connect(keeper).updatePrices([OBRA], [PRICE])).to.be.revertedWith("MP: too soon");
    });

    it("keeper não pode listar, mudar carteira da DApp nem pausar", async () => {
      const { mp, keeper, vault, artist } = await loadFixture(deploy);
      await expect(mp.connect(keeper).listObra(5n, vault, artist, PRICE, 0)).to.be.revertedWithCustomError(mp, "AccessControlUnauthorizedAccount");
      await expect(mp.connect(keeper).setDappWallet(keeper)).to.be.revertedWithCustomError(mp, "AccessControlUnauthorizedAccount");
      await expect(mp.connect(keeper).pause()).to.be.revertedWithCustomError(mp, "AccessControlUnauthorizedAccount");
      await expect(mp.connect(keeper).setPrice(OBRA, 1n)).to.be.revertedWithCustomError(mp, "AccessControlUnauthorizedAccount");
    });

    it("fundador corrige preço sem teto", async () => {
      const { mp, coFounder } = await loadFixture(deploy);
      await mp.connect(coFounder).setPrice(OBRA, PRICE * 3n);
      expect((await mp.getListing(OBRA)).priceUsd6).to.equal(PRICE * 3n);
    });
  });

  describe("Deslistar", () => {
    it("bloqueia compra e permite recuperar as frações", async () => {
      const { mp, buyer, admin, vault } = await loadFixture(deploy);
      await expect(mp.withdrawFractions(OBRA, admin, ONE)).to.be.revertedWith("MP: delist first");
      await mp.delist(OBRA);
      await expect(mp.connect(buyer).buyWithUSDC(OBRA, ONE, PRICE)).to.be.revertedWith("MP: not listed");
      await mp.withdrawFractions(OBRA, admin, 100n * ONE);
      expect(await vault.balanceOf(admin)).to.equal(100n * ONE);
    });
  });
});
