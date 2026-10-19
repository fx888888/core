// CORE Fishing Game — local arcade gameplay + on-chain ammo packs.
// The game score is local-only. One on-chain ammo pack unlocks 10 local shots.
const CONTRACT_ADDRESS = ""; // Fill only after deploying FishingShop to Core Testnet2.
const CORE_TESTNET = {
  chainId: "0x45a",
  chainName: "Core Blockchain TestNet",
  nativeCurrency: { name: "tCORE2", symbol: "tCORE2", decimals: 18 },
  rpcUrls: ["https://rpc.test2.btcs.network"],
  blockExplorerUrls: ["https://scan.test2.btcs.network"]
};
const ABI = [
  "function ammoPackPrice() view returns (uint256)",
  "function ammoPacks(address) view returns (uint256)",
  "function buyAmmo(uint256 packs) payable",
  "function useAmmo(uint256 packs)"
];
let provider, signer, shop, account, gameActive = false;
let shots = 0, score = 0, caught = 0, fish = [], lastFrame = 0;
const $ = id => document.getElementById(id);
const canvas = $("ocean"), ctx = canvas.getContext("2d");
function status(msg) { $("status").textContent = msg; }
function short(addr) { return addr ? addr.slice(0, 6) + "…" + addr.slice(-4) : "未连接"; }
function setNetworkText(id) { $("network").textContent = String(id) === "1114" ? "Core Testnet2" : "Chain ID " + id; }
function updateStats() { $("score").textContent = score; $("shots").textContent = shots; $("caught").textContent = caught; }
async function switchToTestnet() {
  try {
    await window.ethereum.request({ method: "wallet_switchEthereumChain", params: [{ chainId: CORE_TESTNET.chainId }] });
  } catch (e) {
    if (e.code !== 4902) throw e;
    await window.ethereum.request({ method: "wallet_addEthereumChain", params: [CORE_TESTNET] });
  }
}
async function connect() {
  if (!window.ethereum) { status("没有检测到钱包。请在 TP 钱包或 MetaMask 的 DApp 浏览器中打开游戏网页。"); return; }
  try {
    const accounts = await window.ethereum.request({ method: "eth_requestAccounts" });
    if (!accounts.length) throw new Error("钱包未授权账户");
    await switchToTestnet();
    provider = new ethers.BrowserProvider(window.ethereum);
    signer = await provider.getSigner();
    account = await signer.getAddress();
    const net = await provider.getNetwork();
    setNetworkText(net.chainId);
    $("wallet").textContent = short(account);
    if (net.chainId !== 1114n) throw new Error("网络不是 Core Testnet2，请切换到 Chain ID 1114");
    if (!ethers.isAddress(CONTRACT_ADDRESS)) {
      status("钱包已连接到测试网，但合约地址尚未配置。部署 FishingShop 后，将地址填写到 site/app.js。");
      return;
    }
    shop = new ethers.Contract(CONTRACT_ADDRESS, ABI, signer);
    await refresh();
    $("buy").disabled = false;
    $("start").disabled = false;
    status("已连接测试网合约。购买弹药和开始每局游戏都需要你在钱包中确认交易。");
  } catch (e) { status("连接失败：" + (e.shortMessage || e.message || "未知错误")); }
}
async function refresh() {
  if (!shop || !account) return;
  const [price, packs] = await Promise.all([shop.ammoPackPrice(), shop.ammoPacks(account)]);
  $("price").textContent = ethers.formatEther(price) + " tCORE2 / 包";
  $("ammo").textContent = packs.toString() + " 包";
}
async function buy() {
  try {
    const n = Number($("packs").value);
    if (!Number.isInteger(n) || n < 1 || n > 100) throw new Error("数量必须为 1 到 100 的整数");
    const price = await shop.ammoPackPrice();
    status("请在钱包中确认测试网购买交易…");
    const tx = await shop.buyAmmo(n, { value: price * BigInt(n) });
    status("交易已提交，等待确认：" + tx.hash);
    await tx.wait(); await refresh(); status("购买成功！现在可以开始捕鱼。");
  } catch (e) { status("购买失败：" + (e.shortMessage || e.message || "未知错误")); }
}
async function startGame() {
  if (gameActive) return;
  try {
    if (!shop) throw new Error("请先连接已部署的测试网合约");
    status("请在钱包中确认消耗 1 个弹药包的交易…");
    const tx = await shop.useAmmo(1);
    status("消耗弹药交易已提交，等待确认…");
    await tx.wait();
    shots = 10; score = 0; caught = 0; gameActive = true;
    spawnFish(7); updateStats(); await refresh();
    status("开炮！点击画面中的鱼，每次点击消耗 1 发。");
  } catch (e) { status("无法开始游戏：" + (e.shortMessage || e.message || "未知错误")); }
}
function spawnFish(count) {
  fish = [];
  const colors = ["#ffcf5c", "#ff7f8e", "#68e6cf", "#9b9aff", "#ff9e55"];
  for (let i = 0; i < count; i++) fish.push({
    x: 45 + Math.random() * (canvas.width - 90),
    y: 70 + Math.random() * (canvas.height - 130),
    r: 16 + Math.random() * 12,
    vx: (Math.random() * 1.8 + .55) * (Math.random() > .5 ? 1 : -1),
    vy: (Math.random() - .5) * .65,
    color: colors[i % colors.length],
    alive: true,
    wobble: Math.random() * 6
  });
}
function drawFish(f) {
  ctx.save(); ctx.translate(f.x, f.y);
  if (f.vx < 0) ctx.scale(-1, 1);
  ctx.fillStyle = f.color;
  ctx.beginPath(); ctx.moveTo(-f.r, 0); ctx.lineTo(-f.r * 1.7, -f.r * .7); ctx.lineTo(-f.r * 1.7, f.r * .7); ctx.closePath(); ctx.fill();
  ctx.beginPath(); ctx.ellipse(0, 0, f.r, f.r * .62, 0, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = "#fff"; ctx.beginPath(); ctx.arc(f.r * .45, -f.r * .12, f.r * .17, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = "#08243b"; ctx.beginPath(); ctx.arc(f.r * .5, -f.r * .12, f.r * .08, 0, Math.PI * 2); ctx.fill();
  ctx.restore();
}
function frame(ts) {
  const dt = Math.min((ts - (lastFrame || ts)) / 16.67, 2); lastFrame = ts;
  const grad = ctx.createLinearGradient(0, 0, 0, canvas.height);
  grad.addColorStop(0, "#0b6994"); grad.addColorStop(1, "#052344");
  ctx.fillStyle = grad; ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.strokeStyle = "#9defff22"; ctx.lineWidth = 1;
  for (let y = 30; y < canvas.height; y += 45) { ctx.beginPath(); ctx.moveTo(0, y + Math.sin(ts / 800 + y) * 4); ctx.lineTo(canvas.width, y); ctx.stroke(); }
  // Seabed
  ctx.fillStyle = "#0a4d59"; ctx.beginPath(); ctx.moveTo(0, canvas.height - 22);
  for (let x = 0; x <= canvas.width; x += 30) ctx.lineTo(x, canvas.height - 25 + Math.sin(x / 38) * 8);
  ctx.lineTo(canvas.width, canvas.height); ctx.lineTo(0, canvas.height); ctx.fill();
  fish.forEach(f => {
    if (gameActive && f.alive) {
      f.x += f.vx * dt; f.y += f.vy * dt;
      if (f.x < 30 || f.x > canvas.width - 30) f.vx *= -1;
      if (f.y < 50 || f.y > canvas.height - 45) f.vy *= -1;
    }
    if (f.alive) drawFish(f);
  });
  if (!gameActive) {
    ctx.fillStyle = "#031a2acc"; ctx.fillRect(0, canvas.height / 2 - 38, canvas.width, 76);
    ctx.textAlign = "center"; ctx.fillStyle = "#fff"; ctx.font = "bold 26px system-ui";
    ctx.fillText(shop ? "点击“开始游戏”下潜捕鱼" : "连接钱包并部署合约后开始", canvas.width / 2, canvas.height / 2 + 8);
  }
  requestAnimationFrame(frame);
}
function shoot(event) {
  if (!gameActive || shots <= 0) return;
  const rect = canvas.getBoundingClientRect();
  const x = (event.clientX - rect.left) * canvas.width / rect.width;
  const y = (event.clientY - rect.top) * canvas.height / rect.height;
  shots--;
  let target = null, best = Infinity;
  fish.forEach(f => {
    if (!f.alive) return;
    const d = Math.hypot(f.x - x, f.y - y);
    if (d < f.r * 1.5 && d < best) { best = d; target = f; }
  });
  if (target) {
    target.alive = false; caught++; score += Math.round(10 + target.r);
    status("命中！+" + Math.round(10 + target.r) + " 分。");
    if (fish.every(f => !f.alive)) spawnFish(7);
  } else status("没打中，再试一次。");
  updateStats();
  if (shots <= 0) {
    gameActive = false;
    status("本局结束！本地分数：" + score + "。再次开始需要消耗一个链上弹药包。");
  }
}
$("connect").addEventListener("click", connect);
$("buy").addEventListener("click", buy);
$("start").addEventListener("click", startGame);
canvas.addEventListener("pointerdown", shoot);
if (window.ethereum) {
  window.ethereum.on?.("chainChanged", () => { shop = null; $("buy").disabled = true; $("start").disabled = true; connect(); });
  window.ethereum.on?.("accountsChanged", () => { shop = null; $("buy").disabled = true; $("start").disabled = true; connect(); });
}
spawnFish(7); requestAnimationFrame(frame); updateStats();
