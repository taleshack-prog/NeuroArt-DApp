import { expect } from "chai";
import { ethers } from "hardhat";
import { deployV2 } from "../scripts/deployV2";

describe("scripts/deployV2", () => {
  it("faz deploy dos 3 contratos, deixa pausado e dá os papéis certos", async () => {
    const [admin, , dapp] = await ethers.getSigners();
    const usdc = await ethers.deployContract("MockUSDC");
    const feed = await ethers.deployContract("MockAggregator", [8, 242547370660n]);
    const { impl, factory, mp } = await deployV2({
      usdc: await usdc.getAddress(), ethUsdFeed: await feed.getAddress(),
      sequencerFeed: ethers.ZeroAddress, dappWallet: dapp.address, coFounder: ethers.ZeroAddress,
    });
    expect(await mp.paused()).to.equal(true);
    expect(await mp.dappWallet()).to.equal(dapp.address);
    expect(await mp.hasRole(await mp.DEFAULT_ADMIN_ROLE(), admin.address)).to.equal(true);
    expect(await mp.hasRole(await mp.FOUNDER_ROLE(), admin.address)).to.equal(true);
    expect(await factory.IMPLEMENTATION()).to.equal(await impl.getAddress());
    expect(await factory.hasRole(await factory.FOUNDER_ROLE(), admin.address)).to.equal(true);
  });
});
