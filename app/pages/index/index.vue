<template>
  <view class="page">
    <!-- APP BAR -->
    <view class="app-bar">
      <text class="app-logo">时迹</text>
      <text class="app-tagline">ShiJi</text>
    </view>

    <!-- HERO -->
    <view class="hero">
      <view
        :class="[
          'hero-card',
          computedSnapshots.length > 0 && computedSnapshots[0].change
            ? computedSnapshots[0].change.pct >= 0
              ? 'hero-up'
              : 'hero-down'
            : 'hero-neutral',
        ]"
      >
        <view class="hero-watermark">{{ currentYear }}</view>
        <view class="hero-left">
          <text class="hero-eyebrow">Portfolio Snapshot</text>
          <view class="hero-title">
            <text class="hero-title-main">资产快照</text>
          </view>
        </view>
        <view class="hero-right" v-if="computedSnapshots.length > 0">
          <view class="stat-block">
            <text class="stat-label">最新总资产</text>
            <text class="stat-value">
              ¥{{ formatNum(computedSnapshots[0].total) }}
            </text>
            <text class="stat-value-cn">{{
              formatNumCN(computedSnapshots[0].total)
            }}</text>
          </view>
          <view class="stat-row">
            <view class="stat-block">
              <text class="stat-label">较上次变动</text>
              <view
                v-if="computedSnapshots[0].change"
                :class="[
                  'stat-change',
                  computedSnapshots[0].change.pct >= 0 ? 'up' : 'down',
                ]"
              >
                <text class="arrow-icon">{{
                  computedSnapshots[0].change.pct >= 0 ? "▲" : "▼"
                }}</text>
                <text
                  >{{ computedSnapshots[0].change.pct >= 0 ? "+" : ""
                  }}{{ computedSnapshots[0].change.pct.toFixed(1) }}%</text
                >
              </view>
              <view v-else class="stat-change neutral">
                <text>—</text>
              </view>
            </view>
            <view class="stat-block stat-divider">
              <text class="stat-label">记录次数</text>
              <text class="stat-value stat-value-sm">
                {{ computedSnapshots.length }}
              </text>
            </view>
          </view>
        </view>
        <view class="hero-right hero-empty" v-else>
          <text class="empty-hint">还没有快照记录，点击右下角 + 开始记录</text>
        </view>
        <view class="hero-bottom">
          <text class="hero-sub">不定期记录，看见真实的变化</text>
        </view>
      </view>
    </view>

    <!-- TIMELINE -->
    <view class="timeline" v-if="computedSnapshots.length > 0">
      <template v-for="(group, gi) in groupedSnapshots" :key="group.year">
        <view class="year-divider">
          <text class="year-text">{{ group.year }}</text>
        </view>
        <view
          class="snapshot"
          v-for="(item, idx) in group.items"
          :key="item.id"
        >
          <view class="snapshot-header">
            <text class="snapshot-date">{{ formatDate(item.date) }}</text>
            <text class="snapshot-delete" @click="confirmDelete(item)">
              删除
            </text>
          </view>
          <view class="snapshot-card">
            <view class="card-header">
              <view class="card-total-area">
                <text class="card-total-label">总资产</text>
                <view class="card-total-row">
                  <text class="card-total-amount">{{
                    formatNum(item.total)
                  }}</text>
                  <text class="currency">CNY</text>
                </view>
              </view>
              <view class="card-change" v-if="item.change">
                <view
                  :class="[
                    'change-badge',
                    item.change.pct >= 0 ? 'up' : 'down',
                  ]"
                >
                  <text class="arrow-icon">{{
                    item.change.pct >= 0 ? "▲" : "▼"
                  }}</text>
                  <text
                    >{{ item.change.pct >= 0 ? "+" : ""
                    }}{{ item.change.pct.toFixed(1) }}%</text
                  >
                </view>
                <text class="change-amount">
                  {{ item.change.diff >= 0 ? "+" : "" }}¥{{
                    formatNum(item.change.diff)
                  }}
                </text>
              </view>
            </view>
            <view
              class="platforms"
              v-if="item.platforms && item.platforms.length > 0"
            >
              <view
                class="platform-chip"
                v-for="p in item.platforms"
                :key="p.name"
              >
                <view :class="['platform-icon', p.cls || 'default']">
                  <text class="platform-icon-text">{{
                    p.icon || p.name[0]
                  }}</text>
                </view>
                <view class="platform-info">
                  <text class="platform-name">{{ p.name }}</text>
                  <text class="platform-amount"
                    >¥{{ formatNum(p.amount) }}</text
                  >
                </view>
              </view>
            </view>
            <view
              class="screenshots"
              v-if="item.screenshots && item.screenshots.length > 0"
            >
              <view
                class="screenshot-thumb"
                v-for="(s, si) in item.screenshots"
                :key="s"
                @click="previewImage(item.screenshots, si)"
              >
                <image :src="s" mode="aspectFill" />
              </view>
            </view>
            <view class="card-note" v-if="item.note">
              <text class="note-text">{{ item.note }}</text>
            </view>
          </view>
        </view>
      </template>
    </view>

    <!-- FAB -->
    <view class="fab" @click="goAdd">
      <text class="fab-icon">+</text>
    </view>

    <!-- DELETE DIALOG -->
    <view class="dialog-overlay" v-if="deleteDialog.show" @click="closeDelete">
      <view class="dialog-card" @click.stop>
        <view class="dialog-icon-wrap">
          <text class="dialog-icon">✕</text>
        </view>
        <text class="dialog-title">确认删除</text>
        <text class="dialog-msg">
          确定要删除
          {{ deleteDialog.item ? deleteDialog.item.date : "" }} 的快照记录吗？
        </text>
        <text class="dialog-sub">删除后无法恢复</text>
        <view class="dialog-actions">
          <view class="dialog-btn dialog-cancel" @click="closeDelete">
            <text>取消</text>
          </view>
          <view class="dialog-btn dialog-confirm" @click="doDelete">
            <text>删除</text>
          </view>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup>
import { ref, computed } from "vue";
import { onShow } from "@dcloudio/uni-app";

const STORAGE_KEY = "asset_snapshots";
const rawSnapshots = ref([]);

function loadSnapshots() {
  try {
    const raw = uni.getStorageSync(STORAGE_KEY);
    const parsed = typeof raw === "string" ? JSON.parse(raw) : raw;
    rawSnapshots.value = Array.isArray(parsed) ? parsed : [];
  } catch (e) {
    rawSnapshots.value = [];
  }
}

onShow(loadSnapshots);

const computedSnapshots = computed(() => {
  const sorted = [...rawSnapshots.value].sort((a, b) => {
    const dateCmp = b.date.localeCompare(a.date);
    if (dateCmp !== 0) return dateCmp;
    return (b.id || "").localeCompare(a.id || "");
  });
  return sorted.map((item, i) => {
    const total = (item.platforms || []).reduce(
      (s, p) => s + (parseFloat(p.amount) || 0),
      0,
    );
    let change = null;
    if (i < sorted.length - 1) {
      const prev = sorted[i + 1];
      const prevTotal = (prev.platforms || []).reduce(
        (s, p) => s + (parseFloat(p.amount) || 0),
        0,
      );
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
  computedSnapshots.value.forEach((item) => {
    const year = item.date ? item.date.substring(0, 4) : "未知";
    if (year !== currentYear) {
      currentYear = year;
      groups.push({ year, items: [] });
    }
    groups[groups.length - 1].items.push(item);
  });
  return groups;
});

function formatNum(n) {
  const num = parseFloat(n) || 0;
  const parts = num.toFixed(2).split(".");
  const intPart = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  const decPart = parts[1];
  return decPart === "00"
    ? intPart
    : intPart + "." + decPart.replace(/0+$/, "");
}

function formatNumCN(n) {
  const cnNums = ["零", "壹", "贰", "叁", "肆", "伍", "陆", "柒", "捌", "玖"];
  const cnUnits = ["", "拾", "佰", "仟"];
  const cnBigUnits = ["", "万", "亿"];
  const num = Math.abs(parseFloat(n) || 0);
  const parts = num.toFixed(2).split(".");
  let intStr = parts[0];
  let result = "";
  let zero = false;
  for (let i = 0; i < intStr.length; i++) {
    const digit = parseInt(intStr[i]);
    const pos = intStr.length - 1 - i;
    const unit = cnUnits[pos % 4];
    const bigUnit = cnBigUnits[Math.floor(pos / 4)];
    if (digit === 0) {
      zero = true;
      if (pos % 4 === 0 && bigUnit) result += bigUnit;
    } else {
      if (zero) {
        result += "零";
        zero = false;
      }
      result += cnNums[digit] + unit;
      if (pos % 4 === 0) result += bigUnit;
    }
  }
  if (!result) result = "零";
  result += "元";
  const jiao = parseInt(parts[1][0]);
  const fen = parseInt(parts[1][1]);
  if (jiao === 0 && fen === 0) {
    result += "整";
  } else {
    if (jiao > 0) result += cnNums[jiao] + "角";
    else if (result.indexOf("元") < result.length - 1) result += "零";
    if (fen > 0) result += cnNums[fen] + "分";
  }
  return result;
}

const currentYear = new Date().getFullYear();

const weekdays = ["周日", "周一", "周二", "周三", "周四", "周五", "周六"];

function formatDate(dateStr) {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  const wd = weekdays[d.getDay()];
  return `${m} · ${day} · ${wd}`;
}

function previewImage(urls, index) {
  uni.previewImage({
    urls: urls,
    current: urls[index],
  });
}

const deleteDialog = ref({ show: false, item: null });

function confirmDelete(item) {
  deleteDialog.value = { show: true, item };
}

function closeDelete() {
  deleteDialog.value = { show: false, item: null };
}

function doDelete() {
  const item = deleteDialog.value.item;
  if (!item) return;
  const idx = rawSnapshots.value.findIndex((s) => s.id === item.id);
  if (idx > -1) {
    rawSnapshots.value.splice(idx, 1);
    uni.setStorageSync(STORAGE_KEY, JSON.stringify(rawSnapshots.value));
    uni.showToast({ title: "已删除", icon: "success" });
  }
  closeDelete();
}

function goAdd() {
  uni.navigateTo({ url: "/pages/add/index" });
}
</script>

<style scoped>
/* ===== Base ===== */
.page {
  min-height: 100vh;
  background-color: #f5f2ed;
}

/* ===== App Bar ===== */
.app-bar {
  max-width: 900px;
  margin: 0 auto;
  padding: 56px 24px 16px;
  display: flex;
  align-items: baseline;
}
.app-logo {
  font-family: "Noto Serif SC", "Playfair Display", serif;
  font-size: 32px;
  font-weight: 900;
  color: #1a1a1a;
  letter-spacing: 6px;
}
.app-tagline {
  font-family: "Playfair Display", serif;
  font-size: 11px;
  font-weight: 500;
  color: #a0a0a0;
  letter-spacing: 3px;
  margin-left: 12px;
  text-transform: uppercase;
}

/* ===== Header ===== */
.header {
  position: sticky;
  top: 0;
  z-index: 50;
  background: rgba(245, 242, 237, 0.95);
  padding: 30px 24px 0;
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
}
.logo-mark {
  margin-right: 10px;
  font-family: "Playfair Display", serif;
  font-weight: 900;
  font-size: 22px;
  color: #1a1a1a;
}
.logo-sub {
  font-size: 10px;
  font-weight: 500;
  letter-spacing: 3px;
  color: #a0a0a0;
}

/* ===== Hero ===== */
.hero {
  max-width: 900px;
  margin: 0 auto;
  padding: 0 24px;
}
.hero-card {
  position: relative;
  overflow: hidden;
  border: 1px solid rgba(26, 26, 26, 0.06);
  border-radius: 20px;
  padding: 28px 28px 24px;
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  box-shadow: 0 2px 16px rgba(26, 26, 26, 0.04);
  transition: background 0.4s ease;
}
.hero-card.hero-neutral {
  background: linear-gradient(135deg, #fffdf9 0%, #f5f2ed 100%);
}
.hero-card.hero-up {
  background: linear-gradient(135deg, #fff5f3 0%, #fde8e4 50%, #fbeee0 100%);
  border-color: rgba(196, 62, 62, 0.08);
}
.hero-card.hero-up .hero-eyebrow {
  color: #c43e3e;
}
.hero-card.hero-up .hero-eyebrow::before {
  background-color: #c43e3e;
}
.hero-card.hero-down {
  background: linear-gradient(135deg, #f0f9f4 0%, #e4f5eb 50%, #eef7f0 100%);
  border-color: rgba(46, 125, 91, 0.08);
}
.hero-card.hero-down .hero-eyebrow {
  color: #2e7d5b;
}
.hero-card.hero-down .hero-eyebrow::before {
  background-color: #2e7d5b;
}
.hero-watermark {
  position: absolute;
  top: -10px;
  right: 10px;
  font-family: "Playfair Display", serif;
  font-size: 120px;
  font-weight: 900;
  color: rgba(26, 26, 26, 0.03);
  line-height: 1;
  pointer-events: none;
  user-select: none;
}
.hero-left {
  flex: 1;
  padding-right: 24px;
}
.hero-eyebrow {
  display: flex;
  align-items: center;
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 4px;
  color: #c45d3e;
  margin-bottom: 12px;
}
.hero-eyebrow::before {
  content: "";
  display: inline-block;
  width: 24px;
  height: 1.5px;
  background-color: #c45d3e;
  margin-right: 12px;
}
.hero-title {
  margin: 0;
}
.hero-title-main {
  display: block;
  font-family: "Playfair Display", "Noto Serif SC", serif;
  font-size: 55rpx;
  font-weight: 900;
  line-height: 1.1;
  color: #1a1a1a;
}
.hero-bottom {
  width: 100%;
  padding-top: 12px;
  margin-top: 12px;
  border-top: 1px solid rgba(26, 26, 26, 0.06);
  text-align: right;
}
.hero-sub {
  font-size: 12px;
  color: #a0a0a0;
  font-style: italic;
  letter-spacing: 0.5px;
}
.hero-sub::before {
  content: "\201C";
  font-family: "Playfair Display", serif;
  font-size: 24px;
  color: #c45d3e;
  margin-right: 2px;
  line-height: 0;
  vertical-align: -6px;
}
.hero-right {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 12px;
  flex-shrink: 0;
  padding-top: 6px;
  width: 100%;
  justify-content: space-between;
}
.hero-empty {
  justify-content: center;
  align-items: center;
}
.empty-hint {
  font-size: 13px;
  color: #a0a0a0;
  font-style: italic;
}
.stat-block {
  text-align: right;
}
.stat-row {
  display: flex;
  align-items: flex-start;
  gap: 20px;
}
.stat-divider {
  padding-left: 20px;
  border-left: 1px solid rgba(26, 26, 26, 0.08);
}
.stat-label {
  display: block;
  font-size: 10px;
  font-weight: 600;
  letter-spacing: 3px;
  color: #a0a0a0;
  margin-bottom: 4px;
}
.stat-value {
  display: block;
  font-family: "JetBrains Mono", monospace;
  font-size: 22px;
  font-weight: 700;
  color: #1a1a1a;
}
.stat-value-sm {
  font-size: 20px;
}
.stat-value-cn {
  display: block;
  font-size: 10px;
  color: #a0a0a0;
  letter-spacing: 0.5px;
  line-height: 1.4;
}
.stat-change {
  display: flex;
  align-items: center;
  font-family: "JetBrains Mono", monospace;
  font-size: 12px;
  font-weight: 600;
  padding: 3px 8px;
  border-radius: 6px;
}
.stat-change.up {
  color: #c43e3e;
  background-color: #fdf0ef;
}
.stat-change.down {
  color: #2e7d5b;
  background-color: #eef7f2;
}
.stat-change.neutral {
  color: #a0a0a0;
  background-color: #ebe6de;
}
.arrow-icon {
  margin-right: 4px;
  font-size: 10px;
}

/* ===== Timeline ===== */
.timeline {
  max-width: 900px;
  margin: 0 auto;
  padding: 0 24px 100px;
  position: relative;
}
.timeline::before {
  content: "";
  position: absolute;
  left: 46px;
  top: 0;
  bottom: 0;
  width: 2px;
  background-color: rgba(26, 26, 26, 0.1);
}
.snapshot {
  position: relative;
  padding-left: 64px;
  margin-bottom: 32px;
}

.snapshot-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 8px;
}
.snapshot-date {
  font-family: "JetBrains Mono", monospace;
  font-size: 11px;
  font-weight: 500;
  letter-spacing: 2px;
  color: #a0a0a0;
}
.snapshot-delete {
  font-size: 12px;
  color: #a0a0a0;
  padding: 4px 8px;
  border-radius: 6px;
}

/* ===== Snapshot Card ===== */
.snapshot-card {
  background-color: #fffdf9;
  border: 1px solid rgba(26, 26, 26, 0.08);
  border-radius: 16px;
  overflow: hidden;
}
.card-header {
  padding: 20px 20px 0;
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
}
.card-total-area {
  flex: 1;
}
.card-total-label {
  display: block;
  font-size: 10px;
  font-weight: 600;
  letter-spacing: 3px;
  color: #a0a0a0;
  margin-bottom: 4px;
}
.card-total-row {
  display: flex;
  align-items: baseline;
}
.card-total-amount {
  font-family: "Playfair Display", serif;
  font-size: 34px;
  font-weight: 900;
  color: #1a1a1a;
  line-height: 1.1;
}
.currency {
  font-size: 13px;
  font-weight: 400;
  color: #8e8e8e;
  margin-left: 4px;
  font-family: "Playfair Display", "Noto Serif SC", serif;
}
.card-change {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
}
.change-badge {
  display: flex;
  align-items: center;
  font-family: "JetBrains Mono", monospace;
  font-size: 13px;
  font-weight: 700;
  padding: 5px 12px;
  border-radius: 8px;
  margin-bottom: 4px;
}
.change-badge.up {
  color: #c43e3e;
  background-color: #fdf0ef;
}
.change-badge.down {
  color: #2e7d5b;
  background-color: #eef7f2;
}
.change-amount {
  font-family: "JetBrains Mono", monospace;
  font-size: 11px;
  font-weight: 500;
  color: #a0a0a0;
}

/* ===== Platform Chips ===== */
.platforms {
  padding: 16px 20px;
  display: flex;
  flex-wrap: wrap;
}
.platform-chip {
  display: flex;
  align-items: center;
  background-color: #f5f2ed;
  border-radius: 10px;
  padding: 8px 12px;
  flex: 1;
  min-width: 130px;
  margin: 4px;
}
.platform-icon {
  width: 28px;
  height: 28px;
  border-radius: 7px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  margin-right: 8px;
}
.platform-icon-text {
  font-size: 12px;
  font-weight: 700;
  color: #ffffff;
}
.platform-icon.alipay {
  background-color: #1677ff;
}
.platform-icon.cmb {
  background-color: #e60012;
}
.platform-icon.wechat {
  background-color: #07c160;
}
.platform-icon.icbc {
  background-color: #c4122f;
}
.platform-icon.default {
  background-color: #1a1a1a;
}
.platform-info {
  flex: 1;
}
.platform-name {
  display: block;
  font-size: 10px;
  font-weight: 600;
  color: #6b6b6b;
}
.platform-amount {
  display: block;
  font-family: "JetBrains Mono", monospace;
  font-size: 14px;
  font-weight: 700;
  color: #1a1a1a;
}

/* ===== Screenshots ===== */
.screenshots {
  padding: 0 20px 16px;
  display: flex;
  overflow-x: auto;
}
.screenshot-thumb {
  flex-shrink: 0;
  width: 72px;
  height: 96px;
  border-radius: 8px;
  overflow: hidden;
  border: 1.5px solid rgba(26, 26, 26, 0.08);
}
.screenshot-thumb:nth-child(odd) {
  transform: rotate(-3deg);
}
.screenshot-thumb:nth-child(even) {
  transform: rotate(3deg);
}
.screenshot-thumb image {
  width: 100%;
  height: 100%;
}

/* ===== Note ===== */
.card-note {
  padding: 12px 20px 16px;
  border-top: 1px solid rgba(26, 26, 26, 0.08);
}
.card-note::before {
  content: "\201C";
  font-family: "Playfair Display", serif;
  font-size: 24px;
  color: #c45d3e;
  margin-right: 2px;
  line-height: 0;
  vertical-align: -6px;
}
.note-text {
  font-size: 13px;
  color: #6b6b6b;
  font-style: italic;
  line-height: 1.6;
}

/* ===== Year Divider ===== */
.year-divider {
  margin: 8px 0 24px;
}
.year-text {
  font-family: "Playfair Display", serif;
  font-size: 14px;
  font-weight: 700;
  color: #a0a0a0;
  letter-spacing: 2px;
}

/* ===== Delete Dialog ===== */
.dialog-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 100;
  background-color: rgba(26, 26, 26, 0.4);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0 32px;
}
.dialog-card {
  width: 100%;
  max-width: 320px;
  background-color: #fffdf9;
  border-radius: 20px;
  padding: 32px 24px 24px;
  display: flex;
  flex-direction: column;
  align-items: center;
  box-shadow: 0 16px 48px rgba(26, 26, 26, 0.16);
}
.dialog-icon-wrap {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  background-color: #fdf0ef;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 16px;
}
.dialog-icon {
  font-size: 20px;
  color: #c43e3e;
  font-weight: 700;
}
.dialog-title {
  font-size: 17px;
  font-weight: 700;
  color: #1a1a1a;
  margin-bottom: 8px;
}
.dialog-msg {
  font-size: 13px;
  color: #6b6b6b;
  text-align: center;
  line-height: 1.6;
  margin-bottom: 4px;
}
.dialog-sub {
  font-size: 11px;
  color: #a0a0a0;
  font-style: italic;
  margin-bottom: 24px;
}
.dialog-actions {
  display: flex;
  width: 100%;
  gap: 10px;
}
.dialog-btn {
  flex: 1;
  height: 44px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
}
.dialog-btn text {
  font-size: 14px;
  font-weight: 600;
}
.dialog-cancel {
  background-color: #f5f2ed;
}
.dialog-cancel text {
  color: #6b6b6b;
}
.dialog-confirm {
  background-color: #c43e3e;
}
.dialog-confirm text {
  color: #ffffff;
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
  background-color: #1a1a1a;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 8px 32px rgba(26, 26, 26, 0.2);
}
.fab-icon {
  color: #f5f2ed;
  font-size: 28px;
  font-weight: 300;
  line-height: 28px;
}

/* ===== Responsive ===== */
@media (max-width: 640px) {
  .hero-card {
    flex-direction: column;
    padding: 24px 20px 20px;
  }
  .hero-left {
    padding-right: 0;
    margin-bottom: 12px;
  }
  .hero-right {
    flex-direction: row;
    flex-wrap: wrap;
    gap: 10px;
    align-items: flex-start;
  }
  .stat-block {
    text-align: left;
  }
  .stat-value {
    font-size: 20px;
  }
  .card-total-amount {
    font-size: 28px;
  }
  .platform-chip {
    min-width: 120px;
  }
  .snapshot {
    padding-left: 48px;
  }
  .timeline::before {
    left: 38px;
  }
  .snapshot::before {
    left: 31px;
  }
}
</style>
