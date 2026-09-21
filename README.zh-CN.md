<!-- Source: Best-README-Template BLANK_README (Unlicense) — https://github.com/othneildrew/Best-README-Template -->

<a id="readme-top"></a>

[English](README.md) · **简体中文**

# 当前工作 · 自动归组

一个 Chrome 扩展：把新开的未分组网页（包括从其他应用打开的链接）自动放进你指定的标签分组，而不是排到标签栏最末尾。

> 本文是 [README.md](README.md) 的中文译文，两者不一致时以英文版为准。

[![CI](https://github.com/anyingiit/current-work-grouper/actions/workflows/ci.yml/badge.svg)](https://github.com/anyingiit/current-work-grouper/actions/workflows/ci.yml)
[![License](https://img.shields.io/github/license/anyingiit/current-work-grouper)](LICENSE)

[报告问题](https://github.com/anyingiit/current-work-grouper/issues/new?template=bug_report.yml) · [功能建议](https://github.com/anyingiit/current-work-grouper/issues/new?template=feature_request.yml)

<details>
  <summary>目录</summary>
  <ol>
    <li><a href="#关于项目">关于项目</a></li>
    <li><a href="#快速开始">快速开始</a></li>
    <li><a href="#使用">使用</a></li>
    <li><a href="#归组规则">归组规则</a></li>
    <li><a href="#已知限制">已知限制</a></li>
    <li><a href="#权限与隐私">权限与隐私</a></li>
    <li><a href="#开发">开发</a></li>
    <li><a href="#参与贡献">参与贡献</a></li>
    <li><a href="#许可证">许可证</a></li>
    <li><a href="#联系">联系</a></li>
  </ol>
</details>

## 关于项目

其他应用（备忘录、聊天软件、邮件客户端等）在 Chrome 中打开链接时，新标签总是出现在标签栏最末尾。如果你习惯把手头的网页集中在一个标签分组里，就得每次手动拖进去。

这个扩展自动完成这一步：

- 新开的未分组网页自动加入目标分组，默认名称为「当前工作」，可以自定义。
- 优先使用已打开的同名分组；找不到时自动创建一个蓝色分组。
- 点击工具栏图标即可修改分组名称、暂停或恢复。
- 不联网、不注入网页脚本、不保存浏览记录。

已知问题和计划中的功能见 [open issues](https://github.com/anyingiit/current-work-grouper/issues)。

## 快速开始

### 环境要求

- Google Chrome 102 或更新版本（或其他支持标签分组的 Chromium 浏览器）

### 安装

目前以「加载已解压的扩展程序」方式安装。

1. 在 [最新 Release](https://github.com/anyingiit/current-work-grouper/releases/latest) 下载 `current-work-grouper-v*.zip`，解压到一个固定位置。Chrome 会从这个文件夹加载扩展，安装后不要移动或删除它。也可以克隆仓库，直接使用其中的 `extension/` 文件夹。
2. 在 Chrome 地址栏输入 `chrome://extensions`，打开右上角的「开发者模式」。
3. 点击「加载已解压的扩展程序」，选择包含 `manifest.json` 的文件夹。
4. 在工具栏的拼图菜单中固定「当前工作 · 自动归组」。

更新时，用新版本文件覆盖同一个文件夹，再到 `chrome://extensions` 点击此扩展的刷新按钮。保持同一个文件夹可以保留设置。

## 使用

1. 点击工具栏图标，输入**目标分组名称**，点击**保存设置**。
2. 从其他应用点击一个网页链接，新标签会出现在该分组中。
3. 取消勾选「开启自动归组」并保存即可暂停（图标显示 `OFF`），勾选并保存恢复（`ON`）。

分组名称会去除首尾空格，不能留空，按原文精确匹配，支持中文、空格和符号。修改名称只影响之后新开的标签，不会重命名旧分组或移动旧标签。

## 归组规则

- 新建的 HTTP/HTTPS 网页，未固定且尚未分组时，自动加入目标分组。
- 优先使用新标签所在窗口的同名分组；若只在其他窗口找到，会把新标签移过去。建议只保留一个同名分组。
- 找不到已打开的同名分组时创建新分组。已保存但已关闭的分组不会被自动重新打开。
- 新标签本来是活动标签时，会展开目标分组；移到其他窗口时也会切换到该窗口。
- 同窗口归组后，通过短暂切换到组内另一标签再返回，促使垂直标签栏重新定位到新标签。后台标签不会触发此切换；组内没有其他未休眠标签时跳过。
- 忽略隐身窗口、非普通窗口、浏览器内部页面（`chrome://`）、`file://` 页面，以及已固定或已分组的标签。安装前已打开的标签不受影响。
- 新标签的网址延迟出现时，最多等待 10 秒；手动新建的空白标签之后再输入网址，不会被归组。

## 已知限制

- 浏览器先创建标签、扩展再归组，因此仍可能看到标签先出现在末尾。扩展不能直接读写原生标签栏的滚动位置；重新定位是兼容性处理，可能短暂闪过组内另一页面，实际效果取决于浏览器版本。
- Chrome 在 macOS 上也会给外部应用打开的链接设置来源标签，扩展无法可靠区分「外部打开」和「浏览器内打开」。因此它会接收**所有**新开的未分组网页，包括书签、浏览器内新开的未分组网页和恢复的无分组标签。恢复大量标签前，如不希望它们被归组，可以先暂停扩展。
- 外部链接复用一个已打开的空白标签时，不一定会被归组。
- 拖动标签、目标窗口恰好被关闭等情况可能导致一次归组失败。此时标签保持原位，图标显示 `!`；暂停并保存，再开启并保存即可恢复。

## 权限与隐私

扩展只申请三项权限：

| 权限 | 用途 |
|---|---|
| `tabs` | 读取新标签的网址和状态 |
| `tabGroups` | 查找、创建和更新标签分组 |
| `storage` | 保存分组名称、开关，以及短期待处理的标签 ID |

没有网络请求、内容脚本、浏览历史权限或遥测，不保存任何网址。暂停或移除扩展不会撤销已完成的归组。

基于 Chrome 扩展 API [`chrome.tabs`](https://developer.chrome.com/docs/extensions/reference/api/tabs) 和 [`chrome.tabGroups`](https://developer.chrome.com/docs/extensions/reference/api/tabGroups)。

## 开发

无第三方依赖，只需要 Node.js 20 或更新版本。

```sh
git clone https://github.com/anyingiit/current-work-grouper.git
cd current-work-grouper
npm run lint      # 语法检查和 manifest 校验
npm test          # 基于模拟 Chrome API 的行为测试
npm run package   # 打包到 dist/current-work-grouper-v<版本>.zip
```

在 `chrome://extensions` 中加载 `extension/` 文件夹即可在 Chrome 中调试。

发布新版本时，同步修改 `extension/manifest.json` 和 `package.json` 的版本号，把 [CHANGELOG.md](CHANGELOG.md) 中 `Unreleased` 的条目移到新版本下，然后推送 `v<版本>` 标签。Release 工作流会运行检查、打包，并创建附带安装包的 GitHub Release。

## 参与贡献

欢迎贡献。提交 issue 或 pull request 前请阅读 [CONTRIBUTING.md](CONTRIBUTING.md) 和 [CODE_OF_CONDUCT.md](CODE_OF_CONDUCT.md)。

请不要在公开的 issue 或 pull request 中报告安全问题，[SECURITY.md](SECURITY.md) 说明了如何私下报告。

## 许可证

基于 MIT 许可证发布，详见 [LICENSE](LICENSE)。

## 联系

项目地址：[https://github.com/anyingiit/current-work-grouper](https://github.com/anyingiit/current-work-grouper)

<p align="right">(<a href="#readme-top">回到顶部</a>)</p>
