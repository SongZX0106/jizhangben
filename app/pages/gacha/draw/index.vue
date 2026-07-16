<template>
  <view class="page">
    <!-- Header -->
    <view class="gacha-header">
      <view class="header-left">
        <text class="back-btn" @click="goBack">←</text>
        <text class="header-title">{{ activity ? activity.name : "幸运抽卡" }}</text>
      </view>
      <view class="header-right">
        <text class="status-badge" v-if="activity && remainingCount > 0">进行中</text>
        <text class="status-badge ended" v-else-if="activity">已抽完</text>
      </view>
    </view>

    <!-- No Activity Selected -->
    <view class="no-activity" v-if="!activity">
      <text class="na-icon">🎴</text>
      <text class="na-text">请先从活动列表选择一个活动</text>
      <view class="na-btn" @click="goBack">
        <text>返回活动列表</text>
      </view>
    </view>

    <!-- Draw Area -->
    <view class="draw-area" v-else>
      <!-- Activity Cover -->
      <view class="draw-cover" v-if="activity.coverImage">
        <image :src="activity.coverImage" mode="aspectFill" class="draw-cover-img" />
      </view>

      <!-- Activity Info -->
      <view class="info-bar">
        <text class="info-text">{{ activity.description }}</text>
      </view>

      <!-- Mystery Box -->
      <view class="box-container">
        <view class="box-glow" :class="{ 'is-drawing': isDrawing }"></view>
        <view
          class="mystery-box"
          :class="{ 'is-drawing': isDrawing }"
          @click="doDraw"
        >
          <view class="box-inner">
            <view class="orb">
              <view class="orb-highlight"></view>
              <text class="orb-emoji">{{ remainingCount > 0 ? '🎁' : '📭' }}</text>
            </view>
            <text class="box-label">{{
              remainingCount > 0 ? "点击抽取" : "已全部抽完"
            }}</text>
          </view>
        </view>
      </view>

      <!-- Draw Stats -->
      <view class="draw-stats">
        <view class="stat-item">
          <text class="stat-label">剩余奖品</text>
          <text class="stat-num">{{ remainingCount }} / {{ activity.prizes.length }}</text>
        </view>
        <view class="stat-divider"></view>
        <view class="stat-item">
          <text class="stat-label">已抽取</text>
          <text class="stat-num">{{ activity.drawnPrizeIds.length }} 件</text>
        </view>
      </view>

      <!-- Recently Drawn -->
      <view class="recent-section" v-if="recentDrawn.length > 0">
        <text class="recent-title">最近抽中</text>
        <view class="recent-list">
          <view
            class="recent-item"
            v-for="(prize, idx) in recentDrawn"
            :key="idx"
          >
            <image v-if="prize.image" :src="prize.image" mode="aspectFill" class="recent-img" />
            <text v-else class="recent-emoji">{{ prize.emoji || '🎁' }}</text>
            <view class="recent-info">
              <text class="recent-name">{{ prize.name }}</text>
              <view class="recent-bottom">
                <text :class="['recent-rarity', rarityClass(prize.rarity)]">{{
                  RARITY_LABELS[prize.rarity] || prize.rarity
                }}</text>
                <text class="recent-time" v-if="prize.drawnAt">{{ formatTime(prize.drawnAt) }}</text>
              </view>
            </view>
          </view>
        </view>
      </view>
    </view>

    <!-- Result Overlay -->
    <view
      class="result-overlay"
      v-if="showResult && lastPrize"
      @click="closeResult"
    >
      <view class="result-card" @click.stop>
        <view class="result-orb" @click.stop="previewPrizeImage">
          <image v-if="lastPrize.image" :src="lastPrize.image" mode="aspectFill" class="result-img" />
          <text v-else class="result-emoji">{{ lastPrize.emoji || '🎁' }}</text>
        </view>
        <text :class="['result-rarity-badge', rarityClass(lastPrize.rarity)]">{{
          RARITY_LABELS[lastPrize.rarity] || lastPrize.rarity
        }}</text>
        <text class="result-name">{{ lastPrize.name }}</text>
        <text class="result-hint">点击任意处关闭</text>
      </view>
    </view>

  </view>
</template>

<script setup>
import { ref, computed } from "vue";
import { onLoad } from "@dcloudio/uni-app";

const STORAGE_KEY = "gacha_activities";

const RARITY_LABELS = {
  LEGENDARY: "传说",
  EPIC: "史诗",
  RARE: "稀有",
  COMMON: "普通",
};

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

const activity = ref(null);
const isDrawing = ref(false);
const showResult = ref(false);
const lastPrize = ref(null);
const recentDrawn = ref([]);

const remainingCount = computed(() => {
  if (!activity.value) return 0;
  const total = activity.value.prizes.length;
  const drawn = getDrawnPrizeIds(activity.value.drawnPrizeIds).length;
  return total - drawn;
});

function loadActivity(id) {
  try {
    const raw = uni.getStorageSync(STORAGE_KEY);
    const parsed = raw && typeof raw === "string" ? JSON.parse(raw) : raw;
    const activities = Array.isArray(parsed) ? parsed : [];
    activity.value = activities.find((a) => a.id === id) || null;
    if (activity.value) {
      const drawnRecords = activity.value.drawnPrizeIds || [];
      const drawnIds = getDrawnPrizeIds(drawnRecords);
      const idToRecord = {};
      drawnRecords.forEach((r) => {
        idToRecord[typeof r === "string" ? r : r.prizeId] =
          typeof r === "string" ? null : r;
      });
      recentDrawn.value = activity.value.prizes
        .filter((p) => drawnIds.includes(p.id))
        .slice(-5)
        .reverse()
        .map((p) => {
          const record = idToRecord[p.id];
          return { ...p, drawnAt: record ? record.drawnAt : null };
        });
    }
  } catch (e) {
    activity.value = null;
  }
}

function saveActivity() {
  try {
    const raw = uni.getStorageSync(STORAGE_KEY);
    const parsed = raw && typeof raw === "string" ? JSON.parse(raw) : raw;
    const activities = Array.isArray(parsed) ? parsed : [];
    const idx = activities.findIndex((a) => a.id === activity.value.id);
    if (idx > -1) {
      activities[idx] = activity.value;
      uni.setStorageSync(STORAGE_KEY, JSON.stringify(activities));
    }
  } catch (e) {
    // ignore
  }
}

function doDraw() {
  if (isDrawing.value) return;
  if (remainingCount.value <= 0) {
    uni.showToast({ title: "奖品已全部抽完", icon: "none" });
    return;
  }

  isDrawing.value = true;

  const drawnRecords = activity.value.drawnPrizeIds || [];
  const drawnIds = getDrawnPrizeIds(drawnRecords);
  const available = activity.value.prizes.filter(
    (p) => !drawnIds.includes(p.id)
  );
  const picked = available[Math.floor(Math.random() * available.length)];

  setTimeout(() => {
    const now = new Date().toISOString();
    activity.value.drawnPrizeIds.push({ prizeId: picked.id, drawnAt: now });
    saveActivity();
    lastPrize.value = picked;
    showResult.value = true;
    isDrawing.value = false;

    recentDrawn.value.unshift({ ...picked, drawnAt: now });
    if (recentDrawn.value.length > 5) {
      recentDrawn.value = recentDrawn.value.slice(0, 5);
    }
  }, 600);
}

function previewPrizeImage() {
  if (lastPrize.value && lastPrize.value.image) {
    uni.previewImage({
      urls: [lastPrize.value.image],
      current: lastPrize.value.image,
    });
  }
}

function closeResult() {
  showResult.value = false;
}

function goBack() {
  uni.navigateBack();
}

function rarityClass(rarity) {
  const map = {
    LEGENDARY: "rarity-legendary",
    EPIC: "rarity-epic",
    RARE: "rarity-rare",
    COMMON: "rarity-common",
  };
  return map[rarity] || "";
}

onLoad((options) => {
  if (options && options.id) {
    loadActivity(options.id);
  }
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
.status-badge {
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 1px;
  color: #2e7d5b;
  padding: 4px 12px;
  background-color: #eef7f2;
  border-radius: 8px;
}
.status-badge.ended {
  color: #a0a0a0;
  background-color: #ebe6de;
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

/* No Activity */
.no-activity {
  max-width: 900px;
  margin: 0 auto;
  padding: 80px 24px;
  display: flex;
  flex-direction: column;
  align-items: center;
}
.na-icon {
  font-size: 56px;
  margin-bottom: 16px;
}
.na-text {
  font-size: 14px;
  color: #6b6b6b;
  margin-bottom: 20px;
}
.na-btn {
  padding: 10px 28px;
  background-color: #1a1a1a;
  border-radius: 10px;
}
.na-btn text {
  font-size: 14px;
  font-weight: 600;
  color: #f5f2ed;
}

/* Draw Cover */
.draw-cover {
  max-width: 900px;
  margin: 0 auto;
  padding: 8px 24px;
}
.draw-cover-img {
  width: 100%;
  height: 160px;
  border-radius: 16px;
}

/* Info Bar */
.info-bar {
  max-width: 900px;
  margin: 0 auto;
  padding: 0 24px 8px;
  text-align: center;
}
.info-text {
  font-size: 13px;
  color: #a0a0a0;
  font-style: italic;
}

/* Box Container */
.box-container {
  max-width: 900px;
  margin: 0 auto;
  padding: 16px 24px;
  display: flex;
  flex-direction: column;
  align-items: center;
  position: relative;
}
.box-glow {
  position: absolute;
  width: 200px;
  height: 200px;
  border-radius: 50%;
  background: radial-gradient(
    circle,
    rgba(196, 93, 62, 0.12) 0%,
    transparent 70%
  );
  transition: all 0.3s;
}
.box-glow.is-drawing {
  transform: scale(1.5);
  opacity: 0.6;
}
.mystery-box {
  width: 220px;
  height: 260px;
  background-color: #fffdf9;
  border: 1.5px solid rgba(26, 26, 26, 0.1);
  border-radius: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4px 24px rgba(26, 26, 26, 0.06);
  transition: transform 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
  position: relative;
  z-index: 1;
}
.mystery-box.is-drawing {
  transform: scale(1.15) rotate(6deg);
}
.box-inner {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
}
.orb {
  width: 100px;
  height: 100px;
  border-radius: 50%;
  background: radial-gradient(circle at 35% 30%, #e8a090, #c45d3e);
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  box-shadow: 0 4px 20px rgba(196, 93, 62, 0.3);
}
.orb-highlight {
  position: absolute;
  top: 12%;
  left: 18%;
  width: 35%;
  height: 22%;
  background: rgba(255, 255, 255, 0.5);
  border-radius: 50%;
  transform: rotate(-25deg);
}
.orb-emoji {
  font-size: 44px;
  position: relative;
  z-index: 1;
}
.box-label {
  font-family: "JetBrains Mono", monospace;
  font-size: 12px;
  color: #a0a0a0;
  letter-spacing: 2px;
}

/* Draw Stats */
.draw-stats {
  max-width: 900px;
  margin: 0 auto;
  padding: 24px 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 32px;
}
.stat-item {
  text-align: center;
}
.stat-label {
  display: block;
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 2px;
  color: #a0a0a0;
  margin-bottom: 4px;
}
.stat-num {
  font-family: "JetBrains Mono", monospace;
  font-size: 20px;
  font-weight: 700;
  color: #1a1a1a;
}
.stat-divider {
  width: 1px;
  height: 32px;
  background-color: rgba(26, 26, 26, 0.1);
}

/* Recent Drawn */
.recent-section {
  max-width: 900px;
  margin: 0 auto;
  padding: 0 24px;
}
.recent-title {
  display: block;
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 2px;
  color: #a0a0a0;
  margin-bottom: 12px;
}
.recent-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.recent-item {
  display: flex;
  align-items: center;
  gap: 12px;
  background-color: #fffdf9;
  border: 1px solid rgba(26, 26, 26, 0.06);
  border-radius: 12px;
  padding: 12px 16px;
}
.recent-emoji {
  font-size: 28px;
}
.recent-img {
  width: 40px;
  height: 40px;
  border-radius: 8px;
  flex-shrink: 0;
}
.recent-info {
  flex: 1;
}
.recent-name {
  display: block;
  font-size: 14px;
  font-weight: 600;
  color: #1a1a1a;
  margin-bottom: 4px;
}
.recent-bottom {
  display: flex;
  align-items: center;
  gap: 8px;
}
.recent-time {
  font-family: "JetBrains Mono", monospace;
  font-size: 10px;
  color: #a0a0a0;
}
.recent-rarity {
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 1px;
  padding: 2px 8px;
  border-radius: 6px;
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

/* Result Overlay */
.result-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 120;
  background-color: rgba(26, 26, 26, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0 32px;
}
.result-card {
  width: 100%;
  max-width: 300px;
  background-color: #fffdf9;
  border-radius: 24px;
  padding: 36px 24px 24px;
  display: flex;
  flex-direction: column;
  align-items: center;
  box-shadow: 0 20px 60px rgba(26, 26, 26, 0.2);
}
.result-sparkle {
  font-size: 16px;
  color: #c45d3e;
  margin-bottom: 8px;
  letter-spacing: 8px;
}
.result-orb {
  width: 120px;
  height: 120px;
  border-radius: 50%;
  background: radial-gradient(circle at 35% 30%, #e8a090, #c45d3e);
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 16px;
  box-shadow: 0 4px 20px rgba(196, 93, 62, 0.25);
}
.result-emoji {
  font-size: 56px;
}
.result-img {
  width: 120px;
  height: 120px;
  border-radius: 50%;
}
.result-rarity-badge {
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 2px;
  padding: 4px 16px;
  border-radius: 8px;
  margin-bottom: 8px;
}
.result-name {
  font-family: "Playfair Display", "Noto Serif SC", serif;
  font-size: 22px;
  font-weight: 700;
  color: #1a1a1a;
  margin-bottom: 16px;
  text-align: center;
}
.result-hint {
  font-size: 11px;
  color: #a0a0a0;
  font-style: italic;
}
</style>
