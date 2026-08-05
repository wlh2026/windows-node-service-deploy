# 四福车间管理系统

一款面向生产车间的轻量化管理系统，覆盖**铜线出入库台账**与**小型工具全生命周期管理**两大核心业务。
零第三方后端依赖，仅用 Node.js 内置模块 + 单文件 SQLite 数据库，开箱即用、易于私有化部署。

> 程序作者：Mr WU ｜ 当前版本：v1.0.12（由 `data/changelog.json` 自动计算）

---

## 特性

- **零安装后端**：`node --experimental-sqlite server.js` 一条命令启动，无需数据库服务、无需 `npm install`
- **单文件数据库**：数据落在 `data.db`（SQLite），备份/迁移只需复制一个文件
- **前端本地化**：Excel 导出等前端库随项目打包在 `public/js/vendor/`，断网可用
- **权限双重校验**：前后端双重鉴权（导航隐藏 + 接口 403）
- **自动备份**：每天 15:00 自动备份数据库到 `backups/`，保留最近 30 份
- **扫码友好**：支持扫码枪即插即用录入工具编号

---

## 技术栈

| 层 | 技术 |
|---|---|
| 后端 | Node.js 内置 `http` + `node:sqlite`（需 Node ≥ 22.5） |
| 前端 | 原生 HTML / CSS / JavaScript，本地化 Excel 导出库 |
| 数据库 | SQLite（`node:sqlite` 内置，单文件 `data.db`） |
| 部署 | NSSM（Windows 服务）/ Docker / Docker Compose（NAS） |

---

## 功能模块

### 模块一：铜线出入库台账
- **生产对比表**：按任务单记录各规格漆包线 BOM 重量与实际重量，自动算差重
- **仓库铜线领用表**：记录实际领用 / 回库 / 线头报废重量，自动算实际用量
- 两表均支持按日期 / 单号 / 规格查询、打印（含签字栏）、导出 Excel

### 模块二：小型工具管理台账
- **工具档案**：自动编号（类别+流水，如 `DZ-001`）、序列号、品牌型号、位置、照片、安全库存、保养周期；支持批量打印二维码标签
- **借用归还**：扫码识别借/还，归还状态检查，损坏自动转维修
- **维修报废**：维修保养登记、报废登记，自动调整在库状态
- **盘点**：一键生成盘点单，扫码清点，自动生成盘盈盘亏报告
- **统计报表**：个人未还清单、周转率/使用率、维修报废统计
- **总览看板**：实时库存、逾期未还提醒、安全库存预警、保养到期提醒、铜线台账速览

> 更完整的功能与操作指引见 [使用说明.md](使用说明.md) 及 `docs/` 下的 HTML 说明书。

---

## 目录结构

```
四福车间管理系统/
├── server.js                 # 后端服务（Node http + node:sqlite）
├── public/                   # 前端页面（HTML/CSS/JS，Excel 库本地化于 js/vendor/）
├── data/                     # 程序元数据：changelog.json（版本历史）、version.json
├── deploy/                   # Windows Server 服务部署脚本（NSSM，纯 ASCII 无 BOM）
│   ├── install-service.bat   # 注册为 Windows 服务（自动探测 node、绕过平台检查）
│   ├── uninstall-service.bat
│   ├── start.bat             # 前台调试
│   ├── start-node.cmd        # 服务模式真正的启动器（install 时自动生成）
│   ├── open-firewall.bat     # 放行 8090 端口
│   ├── check-access.bat      # 4 项连通性诊断
│   └── README.md             # 部署详细步骤与排错
├── docs/                     # 使用说明书与部署文档（HTML）
├── Dockerfile                # Docker 镜像构建
├── docker-compose.yml        # Docker Compose 部署（绿联 4600 NAS 等）
├── .dockerignore
├── start.bat                 # 本地双击启动
└── 使用说明.md               # 中文使用说明
```

---

## 快速开始（本地）

1. 安装 **Node.js 22 LTS**（≥ 22.5，内置 `node:sqlite`），确保 `node` 在 `PATH`
2. 进入项目目录，双击 `start.bat`（或命令行 `node --experimental-sqlite server.js`）
3. 浏览器打开 `http://localhost:8090`
4. 初始账号 `admin` / 初始密码 `admin123`，**登录后请立即在「用户管理」修改密码**

> 手机 / 同局域网其他电脑访问：`http://<本机IP>:8090`

---

## 部署方案

### 方案 A：Windows Server 服务（推荐用于工厂内网服务器）

适用于 Windows Server 2012 R2 及以上（含 Server 2016/2019/2022）。以 NSSM 注册为自动启动的 Windows 服务，开机自启、崩溃自动重启、远程可访问。

```bat
cd /d C:\factory-app\deploy
uninstall-service.bat
taskkill /F /IM node.exe
install-service.bat
open-firewall.bat
check-access.bat
```

- 脚本自动探测 `node.exe` 常见安装位置并写死绝对路径，不依赖系统 `PATH`
- 对 Server 2012 R2 自动设置 `NODE_SKIP_PLATFORM_CHECK=1` 绕过 Node 22 的平台误报
- 详细步骤与排错见 [deploy/README.md](deploy/README.md)

### 方案 B：Docker / 绿联 4600 NAS

```bash
docker compose up -d --build
# 浏览器访问 http://<主机IP>:8090
```

数据持久化到宿主机 `./data` 目录（数据库、版本文件），容器重建不丢数据。详见 [docker-compose.yml](docker-compose.yml)。

### 方案 C：Linux / macOS 直接运行

```bash
export PORT=8090
node --experimental-sqlite server.js
```

---

## 环境变量

| 变量 | 默认值 | 说明 |
|---|---|---|
| `PORT` | `8090` | 监听端口 |
| `DATA_DIR` | 程序根目录 | 数据库与数据文件存放目录（便于挂盘 / 备份） |

---

## 数据安全与备份

- 所有数据保存在 `data.db` 单文件中（SQLite）
- **自动备份**：每天 15:00 备份到 `backups/`（文件名 `auto-YYYYMMDD-HHMMSS.db`），保留最近 30 份
- **手动备份 / 恢复**：管理员在「用户管理 → 数据备份与恢复」中下载、上传恢复；恢复前系统自动备份当前数据（`pre-restore-时间戳.db`）
- 迁移：直接复制 `data.db`（连同 `data.db-wal` / `data.db-shm`）即可

---

## 许可

本项目供内部车间管理使用，遵循仓库所属许可协议。如有定制需求请联系作者。

---

## ☕ 支持作者

如果本系统对您的工作有帮助，欢迎通过微信支付打赏支持作者继续开发与维护。

<p align="center">
  <img src="docs/wechat-donate.jpg" width="360" alt="微信支付赞赏码" />
</p>
<p align="center">微信支付 · 扫码赞赏 · 感谢支持 ❤️</p>
