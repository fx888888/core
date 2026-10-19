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

  it("rejects zero and excessive pack counts", async function () {
    const { player, shop, price } = await setup();
    await expect(shop.connect(player).buyAmmo(0, { value: 0n })).to.be.revertedWith("invalid pack count");
    await expect(shop.connect(player).buyAmmo(101, { value: price * 101n })).to.be.revertedWith("invalid pack count");
  });

  it("consumes only owned ammo", async function () {
    const { player, shop, price } = await setup();
    await shop.connect(player).buyAmmo(2, { value: price * 2n });
    await expect(shop.connect(player).useAmmo(1)).to.emit(shop, "AmmoUsed").withArgs(player.address, 1);
    expect(await shop.ammoPacks(player.address)).to.equal(1);
    await expect(shop.connect(player).useAmmo(2)).to.be.revertedWith("not enough ammo");
  });

  it("restricts owner settings", async function () {
    const { other, shop } = await setup();
    await expect(shop.connect(other).setPaused(true)).to.be.revertedWith("not owner");
  });

  it("blocks purchases while paused and permits owner withdrawal", async function () {
    const { owner, player, shop, price } = await setup();
    await shop.connect(player).buyAmmo(1, { value: price });
    await shop.connect(owner).setPaused(true);
    await expect(shop.connect(player).buyAmmo(1, { value: price })).to.be.revertedWith("shop paused");
    await expect(shop.connect(player).useAmmo(1)).to.be.revertedWith("shop paused");
    await shop.connect(owner).withdraw(owner.address, price);
    expect(await ethers.provider.getBalance(await shop.getAddress())).to.equal(0n);
  });
});