

# 时迹

<p align="center">
  <img src="https://szx-bucket1.oss-cn-hangzhou.aliyuncs.com/picgo/logo.png" alt="logo" style="width:120px" />
</p>

时间的轨迹，记录每一个节点的财富状态。

## 简介

**时迹** 是一款轻量级个人资产快照记录工具。不同于传统记账软件逐笔记录收支，它采用「定期快照」的方式——你只需在某个时刻将各个平台的资产总额记录下来，就能在时间线上清晰地看到自己的财富变化轨迹。

## 应用截图

<img src="https://szx-bucket1.oss-cn-hangzhou.aliyuncs.com/picgo/image-20260420174146789.png" alt="image-20260420174146789" width="400"/>

<img src="https://szx-bucket1.oss-cn-hangzhou.aliyuncs.com/picgo/image-20260420174157395.png" alt="image-20260420174157395" width="400" />

<img src="https://szx-bucket1.oss-cn-hangzhou.aliyuncs.com/picgo/image-20260420174219060.png" alt="image-20260420174219060" width="400" />

<img src="https://szx-bucket1.oss-cn-hangzhou.aliyuncs.com/picgo/image-20260420174230118.png" alt="image-20260420174230118" width="400" />

## 核心功能

- **多平台资产汇总**：支持支付宝、微信、招商银行、同花顺、雪球等主流平台，也可自定义添加任意平台。每次快照记录各平台余额，自动计算总资产。
- **智能对比分析**：每条快照与上一次自动对比，显示变动金额和百分比。顶部卡片根据涨跌动态切换渐变底色——红色代表增长，绿色代表减少，一眼掌握趋势。
- **截图凭证**：支持上传 App 截图作为凭证，永久保存到本地，方便回溯核对。
- **中文大写金额**：自动将总资产转为中文大写形式（如「壹万贰仟叁佰肆拾伍元整」），适合正式场合参考。
- **备注记录**：每次快照可附加备注，记录变动原因（如「年终奖到账」、「基金大跌」）。

## 技术架构

| 层级       | 技术选型                                                                            |
| ---------- | ----------------------------------------------------------------------------------- |
| 框架       | uni-app（一套代码，多端发布：Android/iOS App、微信/支付宝小程序、H5）               |
| 视图层     | Vue 3 Composition API + `<script setup>`                                            |
| 构建工具   | Vite                                                                                |
| UI 组件    | uni-icons + 自研组件（无第三方 UI 库依赖）                                          |
| 数据存储   | 设备本地 Storage（JSON 序列化），零服务器依赖                                       |
| 图片持久化 | uni.saveFile 将临时路径转为永久存储                                                 |
| 字体       | Playfair Display（标题衬线）+ JetBrains Mono（数值等宽）+ Noto Serif SC（中文衬线） |

## 设计特色

- **杂志级排版**：混合使用衬线体与等宽体，搭配精心调配的暖色系色盘（米白底 `#f5f2ed`、羊皮纸卡片 `#fffdf9`、赭红强调 `#c45d3e`）。
- **时间线叙事**：快照按年份分组，用竖线串联，每张卡片带 Polaroid 风格的微倾截图缩略图。
- **情感化反馈**：顶部 Hero 卡片根据资产涨跌自动渲染不同色调的渐变背景，让数据不只是数字，更有一种情绪上的直观感知。
- **纯离线设计**：不联网、不登录、不上传，所有数据和图片仅存在于你自己的设备上，隐私零风险。

## 项目结构

```
app/
├── pages/
│   ├── index/index.vue    # 首页：资产快照总览 + 时间线
│   └── add/index.vue      # 新增：创建快照记录
├── static/                # 静态资源（字体、样式）
├── App.vue                # 根组件
├── main.js                # 入口文件
├── pages.json             # 页面路由配置
└── manifest.json          # 应用配置
```





