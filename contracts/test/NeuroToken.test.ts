import { expect } from "chai";
import { ethers } from "hardhat";

describe("NeuroToken", function () {
  it("Deve ter supply inicial de 10.000.000 NEURO", async function () {
    const NeuroToken = await ethers.getContractFactory("NeuroToken");
    const token = await NeuroToken.deploy();
    const supply = await token.totalSupply();
    expect(supply).to.equal(ethers.parseEther("10000000"));
  });

  it("Deve executar transferência com 1% de burn", async function () {
    const [owner, recipient] = await ethers.getSigners();
    const NeuroToken = await ethers.getContractFactory("NeuroToken");
    const token = await NeuroToken.deploy();
    const amount = ethers.parseEther("1000");
    await token.transferWithBurn(recipient.address, amount);
    const recipientBalance = await token.balanceOf(recipient.address);
    expect(recipientBalance).to.equal(ethers.parseEther("990"));
  });
});
