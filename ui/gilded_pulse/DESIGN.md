---
name: Gilded Pulse
colors:
  surface: '#fcf9f8'
  surface-dim: '#dcd9d9'
  surface-bright: '#fcf9f8'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f6f3f2'
  surface-container: '#f0eded'
  surface-container-high: '#eae7e7'
  surface-container-highest: '#e5e2e1'
  on-surface: '#1c1b1b'
  on-surface-variant: '#4d4732'
  inverse-surface: '#313030'
  inverse-on-surface: '#f3f0ef'
  outline: '#7e775f'
  outline-variant: '#d0c6ab'
  surface-tint: '#705d00'
  primary: '#705d00'
  on-primary: '#ffffff'
  primary-container: '#ffd700'
  on-primary-container: '#705e00'
  inverse-primary: '#e9c400'
  secondary: '#795900'
  on-secondary: '#ffffff'
  secondary-container: '#ffbf00'
  on-secondary-container: '#6d5000'
  tertiary: '#60603e'
  on-tertiary: '#ffffff'
  tertiary-container: '#dedcb1'
  on-tertiary-container: '#61613e'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#ffe16d'
  primary-fixed-dim: '#e9c400'
  on-primary-fixed: '#221b00'
  on-primary-fixed-variant: '#544600'
  secondary-fixed: '#ffdfa0'
  secondary-fixed-dim: '#fbbc00'
  on-secondary-fixed: '#261a00'
  on-secondary-fixed-variant: '#5c4300'
  tertiary-fixed: '#e6e5b9'
  tertiary-fixed-dim: '#cac99f'
  on-tertiary-fixed: '#1d1d03'
  on-tertiary-fixed-variant: '#484828'
  background: '#fcf9f8'
  on-background: '#1c1b1b'
  surface-variant: '#e5e2e1'
typography:
  display-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 40px
    fontWeight: '800'
    lineHeight: 48px
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 32px
    fontWeight: '700'
    lineHeight: 40px
  headline-lg-mobile:
    fontFamily: Plus Jakarta Sans
    fontSize: 28px
    fontWeight: '700'
    lineHeight: 36px
  title-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 20px
    fontWeight: '600'
    lineHeight: 28px
  body-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  label-sm:
    fontFamily: Plus Jakarta Sans
    fontSize: 12px
    fontWeight: '600'
    lineHeight: 16px
    letterSpacing: 0.05em
rounded:
  sm: 0.5rem
  DEFAULT: 1rem
  md: 1.5rem
  lg: 2rem
  xl: 3rem
  full: 9999px
spacing:
  unit: 4px
  container-padding: 20px
  gutter: 12px
  card-gap: 16px
  section-margin: 32px
---

## 品牌与风格 (Brand & Style)

该设计系统专为移动端“抽卡”或“幸运抽奖”类应用量身定制。核心理念在于捕捉“瞬间的惊喜感”与“持续的愉悦感”。

**品牌人格：**
充满活力、极具吸引力且值得信赖。它不仅仅是一个工具，更是一个充满期待的数字游乐场。

**设计风格：现代毛玻璃主义 (Modern Glassmorphism)**
- **视觉叙事：** 采用大量的毛玻璃（Frosted Glass）效果，营造出层级丰富、具有深度感的界面。这种半透明的特质模拟了精致的实体卡牌。
- **触感：** 界面应表现出轻盈与通透，通过柔和的背景模糊（Backdrop Blur）和极细的白色边缘描边，强化玻璃的物理质感。
- **情感响应：** 暖黄色的主基调旨在激发用户的积极情绪和兴奋感，通过光影变化模拟阳光照射在半透明材质上的视觉效果。

## 色彩 (Colors)

色彩系统以“黄金时段”的暖色调为核心，配合高对比度的深色文字以确保易读性。

- **Primary (金黄色 #FFD700):** 用于核心行动点（CTA）、中奖高亮及品牌关键元素。象征财富与好运。
- **Secondary (琥珀色 #FFBF00):** 用于辅助交互、进度条及次级视觉焦点，增加色彩的层次深度。
- **Tertiary (奶油白 #FFFDD0):** 作为主要的背景基调或容器填充色，弱化纯白的刺眼感，提供温暖舒适的视觉衬底。
- **Neutral (深炭黑 #1A1A1A):** 核心文本色。在高饱和度的黄色背景下提供极佳的清晰度。
- **Glass Overlay:** 所有的毛玻璃容器使用白色 (#FFFFFF) 的超低不透明度（10%-20%）配合 20px-40px 的模糊度。

## 字体排版 (Typography)

选用 **Plus Jakarta Sans**。其圆润的字形与现代化的切角完美契合游戏化（Gamification）的视觉氛围。

- **层级处理：** 标题使用极粗（ExtraBold/Bold）字体以彰显力度，配合略微收紧的字间距增加视觉冲击力。
- **正文：** 保持简洁清晰，行间距设置为 1.5 倍以确保在移动端阅读的舒适度。
- **语言适配：** 针对中文显示，应配合系统默认的屏显黑体（如 PingFang SC），并保持与英文字体一致的视觉重量感。

## 布局与间距 (Layout & Spacing)

采用基于 **4px** 的原子间距系统，确保在各类移动端屏幕上的严谨对齐。

- **流体布局：** 使用以屏幕宽度为基准的流体栅格。容器边缘留白统一为 **20px**，为毛玻璃边缘的扩散阴影留出呼吸空间。
- **垂直节奏：** 模块之间使用 **32px** 或更大的间距来区分不同的功能区（如抽奖池区与个人奖品区）。
- **组件对齐：** 所有卡片内部填充（Padding）遵循 **16px** 或 **24px**，确保视觉重心居中。

## 深度与高度 (Elevation & Depth)

该设计系统不使用传统的重色阴影，而是通过光的折射和物理层级来表现深度。

- **玻璃图层：** 采用“多重叠加”法。底层为柔和的彩色径向渐变，上层为半透明玻璃。
- **描边：** 关键容器使用 1.5px 的内描边（Inner Border），颜色为线性渐变（白色从 40% 不透明度到 10%），模拟玻璃边缘的受光面。
- **光影：** 仅在顶层弹出层（Modal）使用极其弥散（Spread: 40px+）的深黄色调阴影 (#FFBF00, 15% 不透明度)，营造出悬浮感。

## 形状 (Shapes)

形状语言强调“无锐角”原则，以提升亲和力和安全性感受。

- **药丸形 (Pill-shaped):** 所有的主按钮、状态标签和搜索框均使用全圆角处理。
- **容器圆角：** 主体卡片使用 `rounded-xl` (1.5rem / 24px)，在大尺寸屏幕上显得饱满且高级。
- **微小元素：** 复选框或小图标背景使用 `rounded-lg` (1rem / 16px) 以保持风格统一。

## 组件 (Components)

### 1. 玻璃态卡牌 (Glassmorphic Cards)
这是系统的核心。卡牌必须具备 `backdrop-filter: blur(20px)`，背景色为 `rgba(255, 255, 255, 0.15)`。边缘必须带有浅白色半透明描边。

### 2. 药丸按钮 (Pill Buttons)
- **Primary:** 纯金黄色背景 (#FFD700)，黑色文字，带有微弱的顶部内发光。
- **Secondary:** 毛玻璃背景，白色描边，深黄色文字。

### 3. 抽奖球/物品 (Gacha Orbs)
应带有球体光泽感，使用径向渐变（从 #FFD700 到 #FFBF00），并在顶部添加一个白色月牙形高光，增强 3D 触感。

### 4. 输入框 (Input Fields)
底部对齐或全包围药丸形，背景使用极浅的奶油白 (50% 不透明度) 或毛玻璃效果，焦点状态下描边颜色转为金黄色。

### 5. 进度条 (Progress Bars)
轨道使用奶油白，填充部分使用琥珀色 (#FFBF00) 到金黄色 (#FFD700) 的水平渐变，末端可带有微弱的点状光效。