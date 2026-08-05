# 四福车间管理系统 · Windows Server 2012 R2 部署说明

> 适用版本：Windows Server 2012 **R2** 及以上（原版 Server 2012 不被 Node 支持，请先升级系统）
> 后端技术：Node.js 内置 `node:sqlite`，因此必须 **Node 22.5.0 及以上**，并以 `--experimental-sqlite` 启动
> ⚠️ **关于 R2 的平台检查**：较新版 Node（21+/22+）把官方最低支持版本提到了 Windows 10 / Server 2016，**R2 会被它自己的平台检查拦下**（报 "Node.js is only supported on Windows 8.1..."）。这是 Node 的误判，可用官方提供的环境变量 `NODE_SKIP_PLATFORM_CHECK=1` 跳过——**本部署包已自动带上该变量**（start.bat、install-service.bat 都会设置；服务模式还写进了服务自身环境），无需你手动处理。

---

## 一、环境准备

1. 到 https://nodejs.org 下载 **Node.js 22.x LTS（x64 版 .msi）**，默认安装（自动写入 PATH）。
2. 打开命令提示符验证：
   ```bat
   node -v
   ```
   需显示 **v22.5.0 或更高**。若低于 22.5，请重装新版本。

---

## 二、拷贝程序

把整个 `factory-app` 文件夹复制到服务器，建议放到 `C:\factory-app`。
数据库 `data.db` 已自带（单文件 SQLite），**无需任何 `npm install`**——本系统无第三方后端依赖，浏览器端库都是本地文件。

---

## 三、启动方式（二选一）

### 方式 A：注册为 Windows 服务（推荐，开机自启、无黑窗口、崩溃自动重启）

以**管理员身份**运行 `deploy\install-service.bat`：

- 脚本会自动检测 Node 版本（必须 ≥ 22）；
- 首次运行会从官网下载 NSSM（服务封装器）到 `deploy\` 目录；
- 注册服务 `FourFuApp` 并启动。

> 无外网时：手动把 `nssm.exe`（win64 版）放进 `deploy\` 目录再运行脚本即可。

常用管理命令（管理员 CMD）：
```bat
nssm start  FourFuApp     :: 启动
nssm stop   FourFuApp     :: 停止
nssm restart FourFuApp    :: 重启
nssm edit   FourFuApp     :: 图形化修改启动参数 / 日志
```

### 方式 B：手动前台运行（仅调试）

双击 `deploy\start.bat`，程序在前台运行，窗口关闭即停止。

---

## 四、开放防火墙（让局域网能访问）

以**管理员身份**运行 `deploy\open-firewall.bat`，放行 TCP 8090 入站。
如需命令行手动执行：
```bat
netsh advfirewall firewall add rule name="FourFu-TCP-8090" dir=in action=allow protocol=TCP localport=8090
```

---

## 五、访问系统

- 本机：`http://localhost:8090`
- 局域网其他电脑 / 手机：`http://<服务器IP>:8090`（程序默认监听所有网卡）
- 默认账号：`admin / admin123`（品质部账号 `quality / quality123`）
- 各页面如样式异常，请 **Ctrl+F5 硬刷新**。

---

## 六、数据与备份

- 数据库是单文件：`factory-app\data.db`。
- **每天 15:00 自动备份**到 `factory-app\backups\`（保留最近 30 份）。
- 也可在「系统设置 / 数据备份」页面手动下载 `.db` 备份、上传恢复。
- 想把数据单独存到别的盘（便于备份 / 迁移），启动前设置环境变量：
  ```bat
  set DATA_DIR=D:\factory-data
  ```
  然后再启动服务（服务模式下可在 `nssm edit FourFuApp` 的“环境”里添加该变量）。

---

## 七、升级 / 迁移

1. **停服务**：`nssm stop FourFuApp`
2. 备份 `data.db`（复制一份）
3. 用新版 `factory-app` 文件夹覆盖（保留旧 `data.db` 即可，表结构变更会在启动时自动迁移）
4. **启服务**：`nssm start FourFuApp`

> 注意：覆盖时**不要删掉 `data.db`**，否则历史数据丢失。

---

## 八、常见问题排查

| 现象 | 处理 |
|------|------|
| 启动报错 `Cannot find module 'node:sqlite'` | Node 版本过低，需 ≥ 22.5，重装 Node 22.x LTS |
| 启动报平台不支持 / 闪退，提示 "Node.js is only supported on Windows 8.1..." | 这是 Node 对 **Server 2012 R2** 的误判。本部署脚本已自动设置 `NODE_SKIP_PLATFORM_CHECK=1`；若你**手动**在 cmd 里跑，请先执行 `set NODE_SKIP_PLATFORM_CHECK=1` 再 `node --experimental-sqlite server.js`（**无需重启系统**，开个新 cmd 窗口即可）。原版 Server 2012（非 R2）则不在支持范围，需升级系统 |
| 本机能开、别人打不开 | 没开防火墙（运行 `open-firewall.bat`），或服务器 IP 变了 |
| 服务启动后马上停止 | 看 `nssm edit FourFuApp` 的日志；多半是 Node 路径或 `--experimental-sqlite` 参数问题 |
| 端口被占用 | 改端口：`set PORT=8080` 后启动，或在 nssm 环境里加 `PORT` 变量 |

---

部署辅助脚本清单（均在 `deploy\` 目录）：

| 文件 | 作用 |
|------|------|
| `start.bat` | 前台手动启动（调试用） |
| `install-service.bat` | 注册为 Windows 服务（开机自启 + 崩溃重启） |
| `uninstall-service.bat` | 卸载服务 |
| `open-firewall.bat` | 开放防火墙 8090 端口 |
| `README.md` | 本说明 |
