# Meetily Windows 本地开发指南

## 一、环境准备

### 1.1 安装 Visual Studio Build Tools（必须）

Rust 和 llama-cpp 编译需要 MSVC C++ 编译器。

1. 下载 [Visual Studio Build Tools](https://visualstudio.microsoft.com/visual-cpp-build-tools/)
2. 安装时勾选 **"使用 C++ 的桌面开发"** 工作负载
3. 确保包含以下组件：
   - MSVC v143 (或更新版本) C++ 生成工具
   - Windows 10/11 SDK
   - C++ CMake 工具

### 1.2 安装 CMake

```powershell
# 方式一：winget（推荐）
winget install Kitware.CMake

# 方式二：choco
choco install cmake --installargs 'ADD_CMAKE_TO_PATH=System' -y
```

安装后重启终端，确认：
```powershell
cmake --version
```

### 1.3 安装 Rust

```powershell
# 下载并运行 rustup-init.exe
# https://rustup.rs/

# 安装完成后确认
rustc --version
cargo --version
```

### 1.4 安装 Node.js 20+

```powershell
# 方式一：winget
winget install OpenJS.NodeJS.LTS

# 方式二：从 https://nodejs.org 下载 LTS 版本
```

确认：
```powershell
node --version   # 应 >= 20
```

### 1.5 安装 pnpm

```powershell
npm install -g pnpm
pnpm --version
```

### 1.6 安装 Git

如果还没有 Git：
```powershell
winget install Git.Git
```

---

## 二、获取代码

```powershell
# 打开终端（推荐 PowerShell 或 Windows Terminal）
git clone https://github.com/lambertlll/meetily.git
cd meetily
```

---

## 三、构建 llama-helper sidecar

Meetily 依赖一个本地 LLM 推理引擎作为 sidecar（侧载进程）。

```powershell
# 在项目根目录执行
cargo build --release -p llama-helper
```

> ⚠️ 首次编译会下载 llama-cpp 源码并编译，可能需要 5-15 分钟。
> 如果报错缺少 cmake，确认步骤 1.2 已完成且终端已重启。

编译成功后，复制 sidecar 到 Tauri 期望的位置：

```powershell
# 创建目录
New-Item -ItemType Directory -Force -Path "frontend\src-tauri\binaries"

# 复制可执行文件（注意文件名必须包含 target triple）
Copy-Item "target\release\llama-helper.exe" `
  -Destination "frontend\src-tauri\binaries\llama-helper-x86_64-pc-windows-msvc.exe"
```

---

## 四、安装前端依赖

```powershell
cd frontend
pnpm install
```

---

## 五、运行开发模式

```powershell
# 仍在 frontend/ 目录下
pnpm run tauri dev
```

这会同时启动：
- Next.js 开发服务器（端口 3118）
- Tauri 窗口（加载前端页面）

首次启动会编译 Rust 后端，约 3-8 分钟。之后修改前端代码会热重载。

---

## 六、打包成可分发的安装包

```powershell
# 在 frontend/ 目录下
pnpm run tauri build
```

产出文件位置：
```
frontend/src-tauri/target/release/bundle/
├── msi/       ← .msi 安装包
└── nsis/      ← .exe 安装包
```

---

## 七、常见问题

### Q: 编译报错 "linker `link.exe` not found"
→ 没有安装 Visual Studio Build Tools，回到步骤 1.1。

### Q: 编译报错 "cmake not found" 或 "Could not find toolchain"
→ 确认 cmake 在 PATH 中，重启终端后重试。

### Q: `pnpm run tauri dev` 报错 "sidecar not found"
→ 确认 `frontend\src-tauri\binaries\llama-helper-x86_64-pc-windows-msvc.exe` 存在。

### Q: 编译很慢
→ 首次编译 Rust 的确耗时较长（特别是 llama-cpp），后续增量编译会快很多。

### Q: 窗口打开但是白屏
→ 等待 Next.js 编译完成，或检查终端是否有报错。

---

## 快速参考（一键复制）

```powershell
# 完整流程（假设环境已安装好）
git clone https://github.com/lambertlll/meetily.git
cd meetily
cargo build --release -p llama-helper
New-Item -ItemType Directory -Force -Path "frontend\src-tauri\binaries"
Copy-Item "target\release\llama-helper.exe" -Destination "frontend\src-tauri\binaries\llama-helper-x86_64-pc-windows-msvc.exe"
cd frontend
pnpm install
pnpm run tauri dev
```
