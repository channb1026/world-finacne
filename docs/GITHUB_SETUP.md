# 备份与 GitHub 上传

## 当前状态

- 已在项目根目录执行 `git init`，并完成**首次提交**。
- 提交信息：`chore: initial commit — world finance dashboard (pre World Monitor reference improvements)`
- 分支：`main`。
- `.gitignore` 已忽略：`node_modules/`、`dist`、`*.pid`、`.env`、日志等。

## 推送到 GitHub

### 方式一：在 GitHub 网页创建仓库后推送

1. 打开 [GitHub New Repository](https://github.com/new)。
2. 仓库名建议：`world_finance` 或 `world-finance`；可见性选 **Private** 或 **Public**。
3. **不要**勾选 “Add a README” / “Add .gitignore”（本地已有）。
4. 创建后，在项目目录执行（把 `YOUR_USERNAME` 和 `YOUR_REPO` 换成你的用户名和仓库名）：

```bash
cd /Users/edwardchen/Downloads/world_finance

git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO.git
git branch -M main
git push -u origin main
```

若使用 SSH：

```bash
git remote add origin git@github.com:YOUR_USERNAME/YOUR_REPO.git
git branch -M main
git push -u origin main
```

### 方式二：使用 GitHub CLI 创建并推送

若已安装 [GitHub CLI](https://cli.github.com/) 并登录：

```bash
cd /Users/edwardchen/Downloads/world_finance
gh repo create world_finance --private --source=. --remote=origin --push
```

（`--private` 可改为 `--public`；仓库名可改。）

## 本地备份（不依赖 GitHub）

若仅做本地备份，可复制整个项目目录，或打 zip：

```bash
cd /Users/edwardchen/Downloads
zip -r world_finance_backup_$(date +%Y%m%d).zip world_finance -x "world_finance/node_modules/*" -x "world_finance/frontend/node_modules/*" -x "world_finance/frontend/dist/*" -x "*.git/*"
```

## 修改 Git 用户信息（可选）

当前仓库已设置本地 `user.name` / `user.email` 用于首次提交。若要改成你的 GitHub 信息：

```bash
cd /Users/edwardchen/Downloads/world_finance
git config user.name "你的名字或 GitHub 用户名"
git config user.email "你的GitHub邮箱"
```

之后的新提交会使用上述信息。
