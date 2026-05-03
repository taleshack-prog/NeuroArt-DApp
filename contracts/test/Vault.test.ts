import { expect } from "chai";
import { ethers } from "hardhat";

describe("NeuroArtFractionalVault", function () {
  it("Artista define quantidade de frações", async function () {
    const [owner, artist] = await ethers.getSigners();
    const Vault = await ethers.getContractFactory("NeuroArtFractionalVault");
    const vault = await Vault.deploy();
    const totalFractions = 500_000;
    await vault.initialize(1, "ipfs://QmObra001", artist.address, totalFractions);
    const balance = await vault.balanceOf(artist.address);
    expect(balance).to.equal(ethers.parseEther(totalFractions.toString()));
  });

  it("Deve permitir resgate físico com 100% das frações", async function () {
    const [owner, artist] = await ethers.getSigners();
    const Vault = await ethers.getContractFactory("NeuroArtFractionalVault");
    const vault = await Vault.deploy();
    await vault.initialize(1, "ipfs://QmObra001", artist.address, 1000);
    await vault.connect(artist).redeemPhysical();
    expect(await vault.isRedeemed()).to.equal(true);
  });

  it("Deve rejeitar resgate sem 100% das frações", async function () {
    const [owner, artist, investor] = await ethers.getSigners();
    const Vault = await ethers.getContractFactory("NeuroArtFractionalVault");
    const vault = await Vault.deploy();
    await vault.initialize(1, "ipfs://QmObra001", artist.address, 1000);
    const half = ethers.parseEther("500");
    await vault.connect(artist).transfer(investor.address, half);
    await expect(vault.connect(artist).redeemPhysical())
      .to.be.revertedWith("Vault: need 100% of fractions");
  });
});
