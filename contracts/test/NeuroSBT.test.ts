import { expect } from "chai";
import { ethers } from "hardhat";

describe("NeuroSBT", function () {
  it("Deve impedir transferência (Soulbound)", async function () {
    const [owner, artist, hacker] = await ethers.getSigners();
    const NeuroSBT = await ethers.getContractFactory("NeuroSBT");
    const sbt = await NeuroSBT.deploy();
    await sbt.mintSBT(artist.address, "ipfs://QmTest");
    await expect(
      sbt.connect(artist).transferFrom(artist.address, hacker.address, 1)
    ).to.be.revertedWith("SBT: non-transferable");
  });

  it("Deve impedir mint duplo para o mesmo artista", async function () {
    const [owner, artist] = await ethers.getSigners();
    const NeuroSBT = await ethers.getContractFactory("NeuroSBT");
    const sbt = await NeuroSBT.deploy();
    await sbt.mintSBT(artist.address, "ipfs://QmTest");
    await expect(sbt.mintSBT(artist.address, "ipfs://QmTest2"))
      .to.be.revertedWith("SBT: artist already verified");
  });
});
