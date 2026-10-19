const { ethers } = require("hardhat");

async function main() {
  const [deployer] = await ethers.getSigners();
  const network = await ethers.provider.getNetwork();
  const chainId = Number(network.chainId);

  console.log("Network chain ID:", chainId);
  if (chainId === 1116 && process.env.ALLOW_MAINNET_DEPLOY !== "YES_I_UNDERSTAND") {
    throw new Error("Mainnet deployment blocked. Test on Core Testnet2 first. To override, explicitly set ALLOW_MAINNET_DEPLOY=YES_I_UNDERSTAND.");
  }
  if (chainId !== 1114 && chainId !== 1116) {
    throw new Error("Unexpected chain ID. Expected Core Testnet2 (1114) or Core Mainnet (1116).");
  }

  console.log("Deployer:", deployer.address);
  console.log("Deployer balance:", ethers.formatEther(await ethers.provider.getBalance(deployer.address)), chainId === 1114 ? "tCORE2" : "CORE");
  if (chainId === 1114) {
    console.log("TESTNET DEPLOYMENT: test tokens only; no real value.");
  }

  // One ammo pack costs 0.001 native coin. On testnet this is 0.001 tCORE2.
  const price = ethers.parseEther("0.001");
  const Factory = await ethers.getContractFactory("FishingShop");
  const shop = await Factory.deploy(price);
  await shop.waitForDeployment();
  const address = await shop.getAddress();
  console.log("FishingShop deployed to:", address);
  console.log("Explorer:", chainId === 1114 ? "https://scan.test2.btcs.network/address/" + address : "https://scan.coredao.org/address/" + address);
  console.log("Next: set this address as CONTRACT_ADDRESS in site/app.js, then redeploy the static site.");
}
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});