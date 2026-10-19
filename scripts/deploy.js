const { ethers } = require("hardhat");

async function main() {
  const [deployer] = await ethers.getSigners();
  const network = await ethers.provider.getNetwork();
  console.log("Network chain ID:", network.chainId.toString());
  console.log("Deployer:", deployer.address);
  console.log("Deployer balance:", ethers.formatEther(await ethers.provider.getBalance(deployer.address)), "CORE");

  // Initial ammo-pack price: 0.001 native CORE. Review before deployment.
  const price = ethers.parseEther("0.001");
  const Factory = await ethers.getContractFactory("FishingShop");
  const shop = await Factory.deploy(price);
  await shop.waitForDeployment();
  console.log("FishingShop deployed to:", await shop.getAddress());
  console.log("Verify chain ID and save this address in your frontend config.");
}
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});