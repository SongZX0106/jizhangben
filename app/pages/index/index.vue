<template>
	<view class="page">
		<!-- HEADER -->
		<header class="header">
			<div class="header-inner">
				<div class="logo">
					<span class="logo-mark">A·A</span>
					<span class="logo-sub">资产年鉴</span>
				</div>
			</div>
		</header>

		<!-- HERO -->
		<section class="hero">
			<div class="hero-eyebrow">Portfolio Snapshot</div>
			<h1 class="hero-title">
				资产快照
				<span style="padding-top: 8px;">不定期记录，看见真实的变化</span>
			</h1>
			<div class="hero-stats" v-if="computedSnapshots.length > 0">
				<div class="stat-block">
					<div class="stat-label">最新总资产</div>
					<div class="stat-value">¥{{ formatNum(computedSnapshots[0].total) }}</div>
				</div>
				<div class="stat-block">
					<div class="stat-label">较上次变动</div>
					<div v-if="computedSnapshots[0].change" :class="['stat-change', computedSnapshots[0].change.pct >= 0 ? 'up' : 'down']">
						<svg viewBox="0 0 24 24">
							<polyline v-if="computedSnapshots[0].change.pct >= 0" points="18 15 12 9 6 15" />
							<polyline v-else points="6 9 12 15 18 9" />
						</svg>
						{{ computedSnapshots[0].change.pct >= 0 ? '+' : '' }}{{ computedSnapshots[0].change.pct.toFixed(1) }}%
					</div>
					<div v-else class="stat-change neutral">—</div>
				</div>
				<div class="stat-block">
					<div class="stat-label">记录次数</div>
					<div class="stat-value" style="font-size:22px;">{{ computedSnapshots.length }}</div>
				</div>
			</div>
			<div class="hero-stats hero-empty" v-else>
				<div class="empty-hint">还没有快照记录，点击右下角 + 开始记录</div>
			</div>
		</section>

		<!-- TIMELINE -->
		<div class="timeline" v-if="computedSnapshots.length > 0">
			<template v-for="(group, gi) in groupedSnapshots" :key="group.year">
				<div class="year-divider"><span>{{ group.year }}</span></div>
				<article class="snapshot visible" v-for="(item, idx) in group.items" :key="item.id">
					<div class="snapshot-header">
						<div class="snapshot-date">{{ formatDate(item.date) }}</div>
						<text class="snapshot-delete" @click="confirmDelete(item)">删除</text>
					</div>
					<div class="snapshot-card">
						<div class="card-header">
							<div>
								<div class="card-total-label">总资产</div>
								<div class="card-total">{{ formatNum(item.total) }}<span class="currency">CNY</span></div>
							</div>
							<div class="card-change" v-if="item.change">
								<div :class="['change-badge', item.change.pct >= 0 ? 'up' : 'down']">
									<svg viewBox="0 0 24 24">
										<polyline v-if="item.change.pct >= 0" points="18 15 12 9 6 15" />
										<polyline v-else points="6 9 12 15 18 9" />
									</svg>
									{{ item.change.pct >= 0 ? '+' : '' }}{{ item.change.pct.toFixed(1) }}%
								</div>
								<div class="change-amount">
									{{ item.change.diff >= 0 ? '+' : '' }}¥{{ formatNum(item.change.diff) }}
								</div>
							</div>
						</div>
						<div class="platforms" v-if="item.platforms && item.platforms.length > 0">
							<div class="platform-chip" v-for="p in item.platforms" :key="p.name">
								<div :class="['platform-icon', p.cls || 'default']">
									{{ p.icon || p.name[0] }}
								</div>
								<div>
									<div class="platform-name">{{ p.name }}</div>
									<div class="platform-amount">¥{{ formatNum(p.amount) }}</div>
								</div>
							</div>
						</div>
						<div class="screenshots" v-if="item.screenshots && item.screenshots.length > 0">
							<div class="screenshot-thumb" v-for="(s, si) in item.screenshots" :key="si"
								@click="previewImage(item.screenshots, si)">
								<image :src="s" mode="aspectFill" />
							</div>
						</div>
						<div class="card-note" v-if="item.note">{{ item.note }}</div>
					</div>
				</article>
			</template>
		</div>

		<!-- FAB -->
		<button class="fab" @click="goAdd">
			<svg viewBox="0 0 24 24">
				<line x1="12" y1="5" x2="12" y2="19" />
				<line x1="5" y1="12" x2="19" y2="12" />
			</svg>
		</button>
	</view>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { onShow } from '@dcloudio/uni-app';

const STORAGE_KEY = 'asset_snapshots';
const rawSnapshots = ref([]);

function loadSnapshots() {
	try {
		const raw = uni.getStorageSync(STORAGE_KEY);
		rawSnapshots.value = raw ? JSON.parse(raw) : [];
	} catch (e) {
		rawSnapshots.value = [];
	}
}

onMounted(loadSnapshots);
onShow(loadSnapshots);

const computedSnapshots = computed(() => {
	const sorted = [...rawSnapshots.value].sort((a, b) => b.date.localeCompare(a.date));
	return sorted.map((item, i) => {
		const total = (item.platforms || []).reduce((s, p) => s + (parseFloat(p.amount) || 0), 0);
		let change = null;
		if (i < sorted.length - 1) {
			const prev = sorted[i + 1];
			const prevTotal = (prev.platforms || []).reduce((s, p) => s + (parseFloat(p.amount) || 0), 0);
			const diff = total - prevTotal;
			const pct = prevTotal > 0 ? (diff / prevTotal) * 100 : 0;
			change = { diff, pct };
		}
		return { ...item, total, change };
	});
});

const groupedSnapshots = computed(() => {
	const groups = [];
	let currentYear = null;
	computedSnapshots.value.forEach(item => {
		const year = item.date ? item.date.substring(0, 4) : '未知';
		if (year !== currentYear) {
			currentYear = year;
			groups.push({ year, items: [] });
		}
		groups[groups.length - 1].items.push(item);
	});
	return groups;
});

function formatNum(n) {
	return (parseFloat(n) || 0).toLocaleString('zh-CN');
}

const weekdays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];

function formatDate(dateStr) {
	if (!dateStr) return '';
	const d = new Date(dateStr);
	const m = String(d.getMonth() + 1).padStart(2, '0');
	const day = String(d.getDate()).padStart(2, '0');
	const wd = weekdays[d.getDay()];
	return `${m} · ${day} · ${wd}`;
}

function previewImage(urls, index) {
	uni.previewImage({
		urls: urls,
		current: urls[index]
	});
}

function confirmDelete(item) {
	uni.showModal({
		title: '确认删除',
		content: `确定要删除 ${item.date} 的快照记录吗？`,
		confirmColor: '#c43e3e',
		success(res) {
			if (res.confirm) {
				const idx = rawSnapshots.value.findIndex(s => s.id === item.id);
				if (idx > -1) {
					rawSnapshots.value.splice(idx, 1);
					uni.setStorageSync(STORAGE_KEY, JSON.stringify(rawSnapshots.value));
					uni.showToast({ title: '已删除', icon: 'success' });
				}
			}
		}
	});
}

function goAdd() {
	uni.navigateTo({ url: '/pages/add/index' });
}
</script>

<style scoped>
@import url("../../static/css2.css");
.page {
	min-height: 100vh;
	background: var(--paper);
}

:root,
.page {
	--ink: #1a1a1a;
	--ink-light: #6b6b6b;
	--ink-muted: #a0a0a0;
	--paper: #f5f2ed;
	--paper-warm: #ebe6de;
	--paper-card: #fffdf9;
	--accent: #c45d3e;
	--up: #c43e3e;
	--up-bg: #fdf0ef;
	--down: #2e7d5b;
	--down-bg: #eef7f2;
	--border: rgba(26, 26, 26, 0.08);
	--shadow: rgba(26, 26, 26, 0.04);
}

/* ===== HEADER ===== */
.header {
	position: sticky;
	top: 0;
	z-index: 50;
	background: rgba(245, 242, 237, 0.85);
	backdrop-filter: blur(20px);
	-webkit-backdrop-filter: blur(20px);
	border-bottom: 1px solid var(--border);
	padding: 0 24px;
}

.header-inner {
	max-width: 900px;
	margin: 0 auto;
	display: flex;
	align-items: center;
	justify-content: space-between;
	height: 64px;
}

.logo {
	display: flex;
	align-items: baseline;
	gap: 10px;
}

.logo-mark {
	font-family: 'Playfair Display', serif;
	font-weight: 900;
	font-size: 22px;
	letter-spacing: -0.5px;
	color: var(--ink);
}

.logo-sub {
	font-size: 10px;
	font-weight: 500;
	letter-spacing: 3px;
	text-transform: uppercase;
	color: var(--ink-muted);
}

/* ===== HERO ===== */
.hero {
	max-width: 900px;
	margin: 0 auto;
	padding: 40px 24px 40px;
}

.hero-eyebrow {
	font-size: 11px;
	font-weight: 600;
	letter-spacing: 4px;
	text-transform: uppercase;
	color: var(--accent);
	margin-bottom: 16px;
	display: flex;
	align-items: center;
	gap: 12px;
}

.hero-eyebrow::before {
	content: '';
	width: 32px;
	height: 1.5px;
	background: var(--accent);
}

.hero-title {
	font-family: 'Playfair Display', 'Noto Serif SC', serif;
	font-size: 72rpx;
	font-weight: 900;
	line-height: 1.05;
	letter-spacing: -2px;
	color: var(--ink);
	margin-bottom: 20px;
}

.hero-title span {
	display: block;
	color: var(--ink-muted);
	font-size: 0.55em;
	letter-spacing: -1px;
	font-weight: 400;
	font-style: italic;
}

.hero-stats {
	display: flex;
	gap: 40px;
	margin-top: 32px;
	padding-top: 28px;
	border-top: 1px solid var(--border);
	flex-wrap: wrap;
}

.hero-empty {
	border-top: none;
	padding-top: 0;
}

.empty-hint {
	font-size: 14px;
	color: var(--ink-muted);
	font-style: italic;
}

.stat-label {
	font-size: 10px;
	font-weight: 600;
	letter-spacing: 3px;
	text-transform: uppercase;
	color: var(--ink-muted);
	margin-bottom: 6px;
}

.stat-value {
	font-family: 'JetBrains Mono', monospace;
	font-size: 26px;
	font-weight: 700;
	letter-spacing: -1px;
	color: var(--ink);
}

.stat-change {
	display: inline-flex;
	align-items: center;
	gap: 4px;
	font-family: 'JetBrains Mono', monospace;
	font-size: 12px;
	font-weight: 600;
	padding: 3px 8px;
	border-radius: 6px;
}

.stat-change.up { color: var(--up); background: var(--up-bg); }
.stat-change.down { color: var(--down); background: var(--down-bg); }
.stat-change.neutral { color: var(--ink-muted); background: var(--paper-warm); }

.stat-change svg {
	width: 12px;
	height: 12px;
	fill: none;
	stroke: currentColor;
	stroke-width: 2.5;
	stroke-linecap: round;
	stroke-linejoin: round;
}

/* ===== TIMELINE ===== */
.timeline {
	max-width: 900px;
	margin: 0 auto;
	padding: 0 24px 120px;
	position: relative;
}

.snapshot {
	position: relative;
	padding-left: 80px;
	margin-bottom: 56px;
	animation: fadeSlideIn 0.6s ease-out both;
}

@keyframes fadeSlideIn {
	from { opacity: 0; transform: translateY(24px); }
	to { opacity: 1; transform: translateY(0); }
}

.snapshot-header {
	display: flex;
	align-items: baseline;
	justify-content: space-between;
	margin-bottom: 12px;
}

.snapshot-date {
	font-family: 'JetBrains Mono', monospace;
	font-size: 11px;
	font-weight: 500;
	letter-spacing: 2px;
	color: var(--ink-muted);
	text-transform: uppercase;
}

.snapshot-delete {
	font-size: 12px;
	color: var(--ink-muted);
	cursor: pointer;
	padding: 4px 8px;
	border-radius: 6px;
	transition: color 0.2s, background 0.2s;
}

.snapshot-delete:active {
	color: var(--up);
	background: var(--up-bg);
}

.snapshot-card {
	background: var(--paper-card);
	border-radius: 16px;
	border: 1px solid var(--border);
	overflow: hidden;
}

.card-header {
	padding: 28px 28px 0;
	display: flex;
	justify-content: space-between;
	align-items: flex-start;
}

.card-total-label {
	font-size: 10px;
	font-weight: 600;
	letter-spacing: 3px;
	text-transform: uppercase;
	color: var(--ink-muted);
	margin-bottom: 6px;
}

.card-total {
	font-family: 'Playfair Display', serif;
	font-size: 38px;
	font-weight: 900;
	letter-spacing: -1.5px;
	color: var(--ink);
	line-height: 1.1;
}

.card-total .currency {
	font-size: 18px;
	font-weight: 400;
	color: var(--ink-muted);
	margin-left: 4px;
	vertical-align: super;
}

.card-change {
	display: flex;
	flex-direction: column;
	align-items: flex-end;
	gap: 4px;
}

.change-badge {
	display: inline-flex;
	align-items: center;
	gap: 5px;
	font-family: 'JetBrains Mono', monospace;
	font-size: 13px;
	font-weight: 700;
	padding: 5px 12px;
	border-radius: 8px;
}

.change-badge.up { color: var(--up); background: var(--up-bg); }
.change-badge.down { color: var(--down); background: var(--down-bg); }

.change-badge svg {
	width: 14px;
	height: 14px;
	fill: none;
	stroke: currentColor;
	stroke-width: 2.5;
	stroke-linecap: round;
	stroke-linejoin: round;
}

.change-amount {
	font-family: 'JetBrains Mono', monospace;
	font-size: 11px;
	color: var(--ink-muted);
	font-weight: 500;
}

/* Platform chips */
.platforms {
	padding: 24px 28px;
	display: flex;
	flex-wrap: wrap;
	gap: 12px;
}

.platform-chip {
	display: flex;
	align-items: center;
	gap: 10px;
	background: var(--paper);
	border-radius: 10px;
	padding: 10px 16px;
	flex: 1;
	min-width: 140px;
}

.platform-icon {
	width: 32px;
	height: 32px;
	border-radius: 8px;
	display: flex;
	align-items: center;
	justify-content: center;
	font-size: 13px;
	font-weight: 700;
	flex-shrink: 0;
	color: white;
}

.platform-icon.alipay { background: #1677ff; }
.platform-icon.cmb { background: #e60012; }
.platform-icon.wechat { background: #07c160; }
.platform-icon.icbc { background: #c4122f; }
.platform-icon.default { background: var(--ink); }

.platform-name {
	font-size: 11px;
	font-weight: 600;
	color: var(--ink-light);
	letter-spacing: 0.5px;
}

.platform-amount {
	font-family: 'JetBrains Mono', monospace;
	font-size: 15px;
	font-weight: 700;
	color: var(--ink);
	letter-spacing: -0.5px;
}

/* Screenshots */
.screenshots {
	padding: 0 28px 24px;
	display: flex;
	gap: 10px;
	overflow-x: auto;
}

.screenshot-thumb {
	flex-shrink: 0;
	width: 80px;
	height: 106px;
	border-radius: 8px;
	overflow: hidden;
	border: 1.5px solid var(--border);
}

.screenshot-thumb image {
	width: 100%;
	height: 100%;
}

/* Note */
.card-note {
	padding: 16px 28px 20px;
	font-size: 13px;
	color: var(--ink-light);
	font-style: italic;
	line-height: 1.6;
	border-top: 1px solid var(--border);
	margin: 0 28px;
	padding-left: 0;
	padding-right: 0;
}

.card-note::before {
	content: '\201C';
	font-family: 'Playfair Display', serif;
	font-size: 24px;
	color: var(--accent);
	margin-right: 2px;
	line-height: 0;
	vertical-align: -6px;
}

/* Year divider */
.year-divider {
	margin-bottom: 40px;
	margin-top: 16px;
}

.year-divider span {
	font-family: 'Playfair Display', serif;
	font-size: 14px;
	font-weight: 700;
	color: var(--ink-muted);
	letter-spacing: 2px;
	background: var(--paper);
	padding: 4px 0;
}

/* ===== FAB ===== */
.fab {
	position: fixed;
	bottom: 32px;
	right: 24px;
	z-index: 40;
	width: 56px;
	height: 56px;
	border-radius: 16px;
	border: none;
	background: var(--ink);
	color: var(--paper);
	display: flex;
	align-items: center;
	justify-content: center;
	box-shadow: 0 8px 32px rgba(26, 26, 26, 0.2);
}

.fab:active {
	transform: scale(0.95);
}

.fab svg {
	width: 24px;
	height: 24px;
	fill: none;
	stroke: currentColor;
	stroke-width: 2;
	stroke-linecap: round;
}

/* Responsive */
@media (max-width: 640px) {
	.hero-stats { gap: 24px; }
	.stat-value { font-size: 22px; }
	.card-total { font-size: 30px; }
	.platform-chip { min-width: 130px; }
	.snapshot { padding-left: 52px; }
	.year-divider { padding-left: 0; }
}
</style>
