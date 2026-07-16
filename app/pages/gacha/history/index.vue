<template>
  <view class="page">
    <!-- Header -->
    <view class="gacha-header">
      <view class="header-left">
        <text class="back-btn" @click="goBack">←</text>
        <text class="header-title">已抽取内容</text>
      </view>
      <view class="header-right">
        <text class="count-badge">共 {{ drawnItems.length }} 件</text>
      </view>
    </view>

    <!-- Empty State -->
    <view class="empty-state" v-if="drawnItems.length === 0">
      <text class="empty-icon">📭</text>
      <text class="empty-text">还没有抽中的奖品</text>
      <text class="empty-hint">去抽卡页面试试手气吧</text>
    </view>

    <!-- Drawn Items List -->
    <view class="history-list" v-else>
      <view class="list-header">
        <text class="list-title">全部抽中记录</text>
      </view>
      <view class="item" v-for="item in drawnItems" :key="item.prizeId + item.activityId">
        <view class="item-left">
          <view class="item-icon">
            <image v-if="item.image" :src="item.image" mode="aspectFill" class="item-img" />
            <text v-else>{{ item.emoji || '🎁' }}</text>
          </view>
        </view>
        <view class="item-body">
          <view class="item-top">
            <text :class="['rarity-badge', 'rarity-' + item.rarity.toLowerCase()]">{{
              item.rarityLabel
            }}</text>
            <text class="item-source">{{ item.activityName }}</text>
          </view>
          <text class="item-name">{{ item.name }}</text>
          <text class="item-time" v-if="item.drawnAt">{{ formatTime(item.drawnAt) }}</text>
        </view>
        <view class="item-right">
          <view class="restore-btn" @click="doRestore(item)">
            <text>恢复到奖池</text>
          </view>
        </view>
      </view>
    </view>

    <GachaNav active="history" />
  </view>
</template>

<script setup>
import { ref, computed } from "vue";
import { onShow } from "@dcloudio/uni-app";
import GachaNav from "../../../components/GachaNav.vue";

const STORAGE_KEY = "gacha_activities";

const activities = ref([]);

function getDrawnPrizeIds(arr) {
  return (arr || []).map((item) =>
    typeof item === "string" ? item : item.prizeId
  );
}

function formatTime(iso) {
  const d = new Date(iso);
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(
    d.getHours()
  )}:${pad(d.getMinutes())}`;
}

const RARITY_LABELS = {
  LEGENDARY: "传说",
  EPIC: "史诗",
  RARE: "稀有",
  COMMON: "普通",
};

const drawnItems = computed(() => {
  const items = [];
  activities.value.forEach((act) => {
    const drawnRecords = act.drawnPrizeIds || [];
    const drawnIds = getDrawnPrizeIds(drawnRecords);
    const idToRecord = {};
    drawnRecords.forEach((r) => {
      idToRecord[typeof r === "string" ? r : r.prizeId] =
        typeof r === "string" ? null : r;
    });
    act.prizes.forEach((p) => {
      if (drawnIds.includes(p.id)) {
        const record = idToRecord[p.id];
        items.push({
          prizeId: p.id,
          activityId: act.id,
          activityName: act.name,
          name: p.name,
          emoji: p.emoji,
          image: p.image,
          rarity: p.rarity,
          rarityLabel: RARITY_LABELS[p.rarity] || p.rarity,
          drawnAt: record ? record.drawnAt : null,
        });
      }
    });
  });
  return items;
});

function loadActivities() {
  try {
    const raw = uni.getStorageSync(STORAGE_KEY);
    const parsed = raw && typeof raw === "string" ? JSON.parse(raw) : raw;
    activities.value = Array.isArray(parsed) ? parsed : [];
  } catch (e) {
    activities.value = [];
  }
}

function doRestore(item) {
  const act = activities.value.find((a) => a.id === item.activityId);
  if (!act) return;
  const drawnRecords = act.drawnPrizeIds || [];
  const idx = drawnRecords.findIndex((r) =>
    (typeof r === "string" ? r : r.prizeId) === item.prizeId
  );
  if (idx > -1) {
    act.drawnPrizeIds.splice(idx, 1);
    uni.setStorageSync(STORAGE_KEY, JSON.stringify(activities.value));
    uni.showToast({ title: "已恢复到奖池", icon: "success" });
  }
}

function goBack() {
  uni.navigateBack();
}

onShow(() => {
  loadActivities();
});
</script>

<style scoped>
.page {
  min-height: 100vh;
  background-color: #f5f2ed;
  padding-bottom: 100px;
}

/* Header */
.gacha-header {
  max-width: 900px;
  margin: 0 auto;
  padding: 56px 24px 16px;
  display: flex;
  align-items: baseline;
  justify-content: space-between;
}
.header-left {
  display: flex;
  align-items: baseline;
  gap: 14px;
}
.header-right {
  flex-shrink: 0;
}
.count-badge {
  font-size: 11px;
  font-weight: 600;
  color: #6b6b6b;
  padding: 4px 12px;
  background-color: #ebe6de;
  border-radius: 8px;
}
.back-btn {
  font-size: 18px;
  color: #6b6b6b;
  padding: 4px;
}
.header-title {
  font-family: "Noto Serif SC", "Playfair Display", serif;
  font-size: 20px;
  font-weight: 700;
  color: #1a1a1a;
  letter-spacing: 2px;
}

/* Empty State */
.empty-state {
  max-width: 900px;
  margin: 0 auto;
  padding: 80px 24px;
  display: flex;
  flex-direction: column;
  align-items: center;
}
.empty-icon {
  font-size: 56px;
  margin-bottom: 16px;
}
.empty-text {
  font-size: 16px;
  font-weight: 600;
  color: #6b6b6b;
  margin-bottom: 6px;
}
.empty-hint {
  font-size: 13px;
  color: #a0a0a0;
  font-style: italic;
}

/* History List */
.history-list {
  max-width: 900px;
  margin: 0 auto;
  padding: 0 24px;
}
.list-header {
  margin-bottom: 16px;
}
.list-title {
  font-family: "Playfair Display", "Noto Serif SC", serif;
  font-size: 18px;
  font-weight: 700;
  color: #1a1a1a;
}

/* Item */
.item {
  background-color: #fffdf9;
  border: 1px solid rgba(26, 26, 26, 0.06);
  border-radius: 16px;
  padding: 14px 16px;
  display: flex;
  align-items: center;
  gap: 14px;
  margin-bottom: 8px;
  transition: transform 0.2s;
}
.item:active {
  transform: scale(0.98);
}
.item-left {
  flex-shrink: 0;
}
.item-icon {
  width: 52px;
  height: 52px;
  border-radius: 12px;
  background-color: #f5f2ed;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 26px;
  overflow: hidden;
  flex-shrink: 0;
}
.item-img {
  width: 100%;
  height: 100%;
}
.item-body {
  flex: 1;
  min-width: 0;
}
.item-top {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 4px;
}
.rarity-badge {
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.5px;
  padding: 2px 8px;
  border-radius: 6px;
  white-space: nowrap;
  flex-shrink: 0;
}
.rarity-legendary {
  color: #c45d3e;
  background-color: #fdf0ef;
}
.rarity-epic {
  color: #7c3aed;
  background-color: #f5f0ff;
}
.rarity-rare {
  color: #2563eb;
  background-color: #eff4ff;
}
.rarity-common {
  color: #6b6b6b;
  background-color: #f5f2ed;
}
.item-source {
  font-size: 11px;
  color: #a0a0a0;
}
.item-name {
  display: block;
  font-size: 15px;
  font-weight: 600;
  color: #1a1a1a;
}
.item-time {
  display: block;
  font-family: "JetBrains Mono", monospace;
  font-size: 10px;
  color: #a0a0a0;
  margin-top: 2px;
}
.item-right {
  flex-shrink: 0;
}
.restore-btn {
  padding: 5px 16px;
  border-radius: 10px;
  transition: transform 0.15s;
  display: flex;
  align-items: center;
  height: 25px;
  border: 1px solid #c45d3e;
  color: #c45d3e;
}
.restore-btn:active {
  transform: scale(0.92);
}
.restore-btn text {
  font-size: 12px;
  font-weight: 600;
  white-space: nowrap;
}
</style>
