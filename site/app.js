// Minimal injected EVM wallet integration. Set CONTRACT_ADDRESS after deployment.
const CONTRACT_ADDRESS = ""; // Example: "0x..." — do not guess or reuse an address.
const CORE_MAINNET = { chainId: "0x45c", chainName: "Core Blockchain", nativeCurrency: { name: "CORE", symbol: "CORE", decimals: 18 }, rpcUrls: ["https://rpc.coredao.org"], blockExplorerUrls: ["https://scan.coredao.org"] };
const ABI = [
  "function ammoPackPrice() view returns (uint256)",
  "function ammoPacks(address) view returns (uint256)",
  "function buyAmmo(uint256 packs) payable",
  "function useAmmo(uint256 packs)"
];
let provider, signer, shop, account;
const $ = (id) => document.getElementById(id);
function status(msg) { $("status").textContent = msg; }
function short(addr) { return addr ? addr.slice(0,6) + "…" + addr.slice(-4) : "未连接"; }

async function connect() {
  if (!window.ethereum) { status("未检测到钱包。请在支持 EVM 的钱包内置浏览器中打开此页面。"); return; }
  try {
    const accounts = await window.ethereum.request({ method: "eth_requestAccounts" });
    account = accounts[0];
    provider = new ethers.BrowserProvider(window.ethereum);
    const net = await provider.getNetwork();
    $("wallet").textContent = short(account);
    $("network").textContent = net.chainId.toString() === "1116" ? "Core 主网" : "Chain ID " + net.chainId;
    if (net.chainId.toString() !== "1116") status("请切换到 Core 主网（Chain ID 1116）后再继续。");
    try { await window.ethereum.request({ method: "wallet_switchEthereumChain", params: [{ chainId: CORE_MAINNET.chainId }] }); } catch (e) {
      if (e.code === 4902) await window.ethereum.request({ method: "wallet_addEthereumChain", params: [CORE_MAINNET] });
      else throw e;
    }
    provider = new ethers.BrowserProvider(window.ethereum);
    signer = await provider.getSigner();
    account = await signer.getAddress();
    $("network").textContent = "Core 主网";
    $("wallet").textContent = short(account);
    if (!ethers.isAddress(CONTRACT_ADDRESS)) { status("钱包已连接。请先部署合约，再把地址填写到 site/app.js 的 CONTRACT_ADDRESS。"); return; }
    shop = new ethers.Contract(CONTRACT_ADDRESS, ABI, signer);
    await refresh();
    $("buy").disabled = false;
    $("use").disabled = false;
    status("钱包和合约已连接。所有交易都需要你在钱包中确认。");
  } catch (e) { status("连接失败：" + (e.shortMessage || e.message || "未知错误")); }
}
async function refresh() {
  if (!shop || !account) return;
  const [price, packs] = await Promise.all([shop.ammoPackPrice(), shop.ammoPacks(account)]);
  $("price").textContent = ethers.formatEther(price) + " CORE / 包";
  $("use").textContent = "消耗 1 包弹药（余额 " + packs.toString() + "）";
}
async function buy() {
  try {
    const n = Number($("packs").value);
    if (!Number.isInteger(n) || n < 1 || n > 100) throw new Error("数量必须为 1 到 100 的整数");
    const price = await shop.ammoPackPrice();
    status("请在钱包中确认购买交易…");
    const tx = await shop.buyAmmo(n, { value: price * BigInt(n) });
    status("交易已提交：" + tx.hash);
    await tx.wait(); await refresh(); status("购买成功，弹药已记入合约。");
  } catch (e) { status("购买失败：" + (e.shortMessage || e.message || "未知错误")); }
}
async function useOne() {
  try { status("请在钱包中确认消耗弹药…"); const tx = await shop.useAmmo(1); await tx.wait(); await refresh(); status("已消耗 1 包弹药。捕鱼得分暂未上链记录。"); }
  catch (e) { status("操作失败：" + (e.shortMessage || e.message || "未知错误")); }
}
$("connect").addEventListener("click", connect);
$("buy").addEventListener("click", buy);
$("use").addEventListener("click", useOne);
// ethers is loaded below from a pinned CDN version.
