const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("FishingShop", function () {
  async function setup() {
    const [owner, player, other] = await ethers.getSigners();
    const price = ethers.parseEther("0.001");
    const Factory = await ethers.getContractFactory("FishingShop");
    const shop = await Factory.deploy(price);
    await shop.waitForDeployment();
    return { owner, player, other, shop, price };
  }

  it("allows buying ammo with exact CORE payment", async function () {
    const { player, shop, price } = await setup();
    await expect(shop.connect(player).buyAmmo(2, { value: price * 2n }))
      .to.emit(shop, "AmmoPurchased").withArgs(player.address, 2, price * 2n);
    expect(await shop.ammoPacks(player.address)).to.equal(2);
  });

  it("rejects incorrect payment", async function () {
    const { player, shop, price } = await setup();
    await expect(shop.connect(player).buyAmmo(1, { value: price - 1n }))
      .to.be.revertedWith("incorrect CORE amount");
  });

  it("consumes only owned ammo", async function () {
    const { player, shop, price } = await setup();
    await shop.connect(player).buyAmmo(2, { value: price * 2n });
    await shop.connect(player).useAmmo(1);
    expect(await shop.ammoPacks(player.address)).to.equal(1);
    await expect(shop.connect(player).useAmmo(2)).to.be.revertedWith("not enough ammo");
  });

  it("restricts owner settings", async function () {
    const { other, shop } = await setup();
    await expect(shop.connect(other).setPaused(true)).to.be.revertedWith("not owner");
  });
});