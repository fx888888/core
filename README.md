# CORE 捕鱼乐园（测试网试玩版）

这是一个面向手机浏览器的 CORE 链捕鱼小游戏第一阶段。它包含可操作的 Canvas 捕鱼画面、Core Testnet2 钱包连接、链上弹药包购买/消耗，以及 Hardhat 合约测试和部署配置。

## 当前可以做什么

- 在画面中看到游动的鱼，点击鱼开炮并获得本地分数。
- 每局 10 发子弹；开始一局时会在链上消耗 1 个弹药包。
- 使用 Core Testnet2 原生测试币 tCORE2 购买弹药包。
- 钱包连接会优先切换到 Core Testnet2（Chain ID 1114）。
- 分数和捕获数量只保存在当前页面运行状态中，不是链上奖励；刷新页面会重置。

## 当前限制

这仍然是测试版，不是已审计的生产游戏。当前没有后端账户、反作弊、排行榜、NFT/代币奖励、随机返奖或提现奖励。捕鱼命中与分数是浏览器本地逻辑，不能用于发放真实资产。合约管理员可以暂停商店、调整价格并提取合约余额。请先测试和审查，不要直接用于主网资金。

## 网络参数

Core DAO 官方文档确认 Core Testnet2 使用 Chain ID 1114、RPC `https://rpc.test2.btcs.network`；测试币为 tCORE2。旧测试网 1115 已停用。参考：
- RPC 与网络参数：https://docs.coredao.org/docs/Dev-Guide/rpc-list
- 测试币水龙头：https://scan.test2.btcs.network/faucet

## 1. 本地安装和自动测试

需要 Node.js 20 或更新版本。在电脑终端进入仓库目录：

```bash
npm install
npm run compile
npm test
```

GitHub Actions 会在推送代码或创建 Pull Request 时自动执行编译和测试。请到仓库的 **Actions** 标签查看实际运行结果；代码提交成功不等于测试已经通过。

## 2. 准备测试钱包

1. 创建一个专门用于测试的 EVM 钱包，切换到 Core Testnet2。
2. 只获取测试币 tCORE2：打开 https://scan.test2.btcs.network/faucet，按网页提示领取。
3. 把私钥只保存在你自己电脑的本地 `.env` 文件里。复制 `.env.example` 为 `.env`，填写 `PRIVATE_KEY=你的测试钱包私钥`。
4. **不要把私钥、助记词或 `.env` 内容发给任何人，也不要提交到 GitHub。** 绝不要把主网钱包私钥用于测试。

## 3. 部署到 Core Testnet2

确认测试钱包里有足够 tCORE2 后，在本地运行：

```bash
npm run deploy:testnet
```

脚本必须检测到 Chain ID 1114 才会继续。成功后会打印合约地址和测试网浏览器链接。打开浏览器确认交易成功，再继续下一步。

## 4. 连接前端和开始试玩

1. 打开 `site/app.js`。
2. 将 `const CONTRACT_ADDRESS = ""; ` 中的空字符串改成刚刚部署成功的测试网合约地址。
3. 提交更新后，把 `site/` 目录发布到静态网站托管平台；或在电脑本地使用静态服务器打开，不要直接把文件路径当成已上线网址。
4. 在 TP 钱包或 MetaMask 的 DApp 浏览器里打开网页，点击“连接钱包（测试网）”。
5. 购买弹药包。默认每包价格是 0.001 tCORE2。
6. 点击“消耗 1 个链上弹药包，开始游戏（10 发）”，钱包确认链上交易后开始捕鱼；点击画面里的鱼即可开炮。

如果合约地址还没填，页面会显示“合约地址尚未配置”，购买和开始按钮不会启用。

## 5. 安全和主网保护

Hardhat 默认网络为 Core Testnet2。部署脚本会阻止未经显式确认的主网部署。不要设置主网覆盖变量来跳过测试。主网部署需要单独代码审查、测试、用户确认以及真实 CORE 交易费，本项目尚未完成这些步骤。

## 项目目录

- `contracts/FishingShop.sol`：链上弹药包购买/消耗
- `site/index.html`、`site/style.css`、`site/app.js`：手机网页和本地捕鱼逻辑
- `scripts/deploy.js`：测试网优先部署脚本
- `test/FishingShop.js`：合约测试
- `.github/workflows/ci.yml`：编译与测试工作流
- `.github/workflows/pages.yml`：静态网页发布工作流（需在仓库 Settings → Pages 中选择 GitHub Actions）

## 当前版本

测试网试玩版 0.2。未完成真实主网部署、正式安全审计、后端和防作弊。