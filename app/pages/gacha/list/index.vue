<template>
  <view class="page">
    <!-- Header -->
    <view class="gacha-header">
      <view class="header-left">
        <text class="back-btn" @click="goBack">←</text>
        <text class="header-title">抽卡活动</text>
      </view>
      <view class="header-right"></view>
    </view>

    <!-- Hero -->
    <view class="hero-section">
      <text class="hero-heading">我的抽卡活动</text>
      <text class="hero-desc">探索正在进行的精彩抽卡</text>
    </view>

    <!-- Activity Grid -->
    <view class="activity-grid" v-if="activities.length > 0">
      <view
        class="activity-card"
        v-for="act in activities"
        :key="act.id"
        @click="goDraw(act.id)"
      >
        <view class="card-cover" :style="act.coverImage ? {} : { background: act.coverGradient || '#f5f2ed' }">
          <image v-if="act.coverImage" :src="act.coverImage" mode="aspectFill" class="cover-img" />
          <text v-else class="cover-emoji">{{ act.emoji || '🎴' }}</text>
        </view>
        <view class="card-body">
          <view class="card-name-row">
            <text class="card-name">{{ act.name }}</text>
            <text class="card-menu-btn" @click.stop="toggleMenu(act.id)">⋯</text>
          </view>
          <text class="card-desc">{{ act.description }}</text>
          <view class="progress-wrap">
            <view class="progress-track">
              <view
                class="progress-fill"
                :style="{ width: actProgress(act) + '%' }"
              ></view>
            </view>
          </view>
          <view class="card-meta">
            <text class="meta-text">进度 {{ actProgress(act) }}%</text>
            <text class="meta-text"
              >{{ drawnCount(act) }}/{{ act.prizes.length }} 已抽</text
            >
          </view>
          <text class="card-date" v-if="act.createdAt">{{ formatDate(act.createdAt) }}</text>
          <view class="card-menu" v-if="openMenuId === act.id">
            <text class="card-edit" @click.stop="goEdit(act.id)">编辑</text>
            <text class="card-delete" @click.stop="confirmDelete(act)">删除</text>
          </view>
        </view>
      </view>
    </view>

    <!-- Empty State -->
    <view class="empty-state" v-else>
      <text class="empty-icon">🎴</text>
      <text class="empty-text">暂无抽卡活动</text>
      <text class="empty-hint">点击右下角 + 创建新活动</text>
    </view>

    <!-- FAB -->
    <view class="fab" @click="goCreate">
      <text class="fab-icon">+</text>
    </view>

    <!-- Delete Dialog -->
    <view class="del-overlay" v-if="delDialog.show" @click="closeDel">
      <view class="del-card" @click.stop>
        <view class="del-icon-wrap">
          <text class="del-icon">✕</text>
        </view>
        <text class="del-title">确认删除</text>
        <text class="del-msg">确定要删除活动「{{ delDialog.name }}」吗？</text>
        <text class="del-sub">删除后无法恢复，已抽中的奖品记录将丢失</text>
        <view class="del-actions">
          <view class="del-btn del-cancel" @click="closeDel"><text>取消</text></view>
          <view class="del-btn del-confirm" @click="doDelete"><text>删除</text></view>
        </view>
      </view>
    </view>

    <GachaNav active="list" />
  </view>
</template>

<script setup>
import { ref } from "vue";
import { onShow } from "@dcloudio/uni-app";
import GachaNav from "../../../components/GachaNav.vue";

const STORAGE_KEY = "gacha_activities";

const DEMO_ACTIVITIES = [
  {
    id: "demo_1",
    name: "每日幸运星",
    description: "每日抽奖，赢取精彩好礼",
    emoji: "⭐",
    coverGradient: "linear-gradient(135deg, #fdf0ef 0%, #fde8e4 50%, #fbeee0 100%)",
    createdAt: new Date().toISOString(),
    prizes: [
      { id: "d1p1", name: "限量版数字藏品", rarity: "LEGENDARY", emoji: "👑" },
      { id: "d1p2", name: "星辰幻镜之球", rarity: "EPIC", emoji: "💎" },
      { id: "d1p3", name: "远古密匣钥匙", rarity: "RARE", emoji: "🗝️" },
      { id: "d1p4", name: "金币福袋", rarity: "COMMON", emoji: "🪙" },
      { id: "d1p5", name: "碎星矿石", rarity: "COMMON", emoji: "✨" },
    ],
    drawnPrizeIds: ["d1p4"],
  },
  {
    id: "demo_2",
    name: "超级翻翻乐",
    description: "翻转卡牌，惊喜不断",
    emoji: "🎴",
    coverGradient: "linear-gradient(135deg, #f0f9f4 0%, #e4f5eb 50%, #eef7f0 100%)",
    createdAt: new Date().toISOString(),
    prizes: [
      { id: "d2p1", name: "不灭凤凰之魂", rarity: "LEGENDARY", emoji: "🔥" },
      { id: "d2p2", name: "暗影刺客装备", rarity: "EPIC", emoji: "🗡️" },
      { id: "d2p3", name: "神秘宝箱钥匙", rarity: "RARE", emoji: "🔑" },
      { id: "d2p4", name: "经验药水", rarity: "COMMON", emoji: "🧪" },
    ],
    drawnPrizeIds: [],
  },
];

const activities = ref([]);
const delDialog = ref({ show: false, id: "", name: "" });
const openMenuId = ref(null);

function toggleMenu(id) {
  openMenuId.value = openMenuId.value === id ? null : id;
}

function loadActivities() {
  try {
    const raw = uni.getStorageSync(STORAGE_KEY);
    const parsed = raw && typeof raw === "string" ? JSON.parse(raw) : raw;
    activities.value = Array.isArray(parsed) ? parsed : [];
  } catch (e) {
    activities.value = [];
  }
  if (activities.value.length === 0) {
    activities.value = JSON.parse(JSON.stringify(DEMO_ACTIVITIES));
    saveActivities();
  }
}

function saveActivities() {
  uni.setStorageSync(STORAGE_KEY, JSON.stringify(activities.value));
}

function getDrawnPrizeIds(arr) {
  return (arr || []).map((item) =>
    typeof item === "string" ? item : item.prizeId
  );
}

function formatDate(iso) {
  const d = new Date(iso);
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

function drawnCount(act) {
  return getDrawnPrizeIds(act.drawnPrizeIds).length;
}

function actProgress(act) {
  if (!act.prizes || act.prizes.length === 0) return 0;
  return Math.round(
    (getDrawnPrizeIds(act.drawnPrizeIds).length / act.prizes.length) * 100
  );
}

function goCreate() {
  uni.navigateTo({ url: "/pages/gacha/create/index" });
}

function goEdit(id) {
  uni.navigateTo({ url: "/pages/gacha/create/index?editId=" + id });
}

function goDraw(id) {
  uni.navigateTo({ url: "/pages/gacha/draw/index?id=" + id });
}

function goBack() {
  uni.navigateBack();
}

function confirmDelete(act) {
  delDialog.value = { show: true, id: act.id, name: act.name };
}

function closeDel() {
  delDialog.value = { show: false, id: "", name: "" };
}

function doDelete() {
  const idx = activities.value.findIndex((a) => a.id === delDialog.value.id);
  if (idx > -1) {
    activities.value.splice(idx, 1);
    saveActivities();
    uni.showToast({ title: "已删除", icon: "success" });
  }
  closeDel();
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

/* Hero */
.hero-section {
  max-width: 900px;
  margin: 0 auto;
  padding: 8px 24px 24px;
}
.hero-heading {
  display: block;
  font-family: "Playfair Display", "Noto Serif SC", serif;
  font-size: 28px;
  font-weight: 900;
  color: #1a1a1a;
  margin-bottom: 6px;
}
.hero-desc {
  font-size: 13px;
  color: #a0a0a0;
  font-style: italic;
}

/* Activity Grid */
.activity-grid {
  max-width: 900px;
  margin: 0 auto;
  padding: 0 24px;
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
}
.activity-card {
  flex: 1;
  min-width: 280px;
  max-width: calc(50% - 8px);
  background-color: #fffdf9;
  border: 1px solid rgba(26, 26, 26, 0.08);
  border-radius: 20px;
  overflow: hidden;
  transition: transform 0.2s;
}
.activity-card:active {
  transform: scale(0.97);
}
.card-cover {
  height: 120px;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
}
.cover-emoji {
  font-size: 48px;
}
.cover-img {
  width: 100%;
  height: 100%;
}
.card-body {
  padding: 16px 20px 20px;
}
.card-name-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 4px;
}
.card-name {
  font-family: "Playfair Display", "Noto Serif SC", serif;
  font-size: 18px;
  font-weight: 700;
  color: #1a1a1a;
}
.card-menu-btn {
  font-size: 18px;
  color: #a0a0a0;
  padding: 2px 6px;
  border-radius: 6px;
  letter-spacing: 2px;
  line-height: 1;
}
.card-menu-btn:active {
  background-color: #f5f2ed;
}
.card-desc {
  display: block;
  font-size: 12px;
  color: #a0a0a0;
  margin-bottom: 14px;
}

/* Progress */
.progress-wrap {
  margin-bottom: 10px;
}
.progress-track {
  height: 6px;
  background-color: #ebe6de;
  border-radius: 3px;
  overflow: hidden;
}
.progress-fill {
  height: 100%;
  border-radius: 3px;
  background: linear-gradient(90deg, #d4856b, #c45d3e);
  transition: width 0.4s ease;
}
.card-meta {
  display: flex;
  justify-content: space-between;
}
.meta-text {
  font-family: "JetBrains Mono", monospace;
  font-size: 11px;
  color: #a0a0a0;
}
.card-date {
  display: block;
  font-family: "JetBrains Mono", monospace;
  font-size: 10px;
  color: #bbb;
  margin-top: 6px;
}
.card-menu {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  margin-top: 10px;
  padding-top: 10px;
  border-top: 1px solid rgba(26, 26, 26, 0.06);
}
.card-edit {
  font-size: 12px;
  color: #6b6b6b;
  padding: 4px 10px;
  border-radius: 6px;
  background-color: #f5f2ed;
}
.card-delete {
  font-size: 12px;
  color: #c45d3e;
  padding: 4px 10px;
  border-radius: 6px;
  background-color: #fdf0ef;
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

/* FAB */
.fab {
  position: fixed;
  bottom: 100px;
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

/* Delete Dialog */
.del-overlay {
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
.del-card {
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
.del-icon-wrap {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  background-color: #fdf0ef;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 16px;
}
.del-icon {
  font-size: 20px;
  color: #c45d3e;
  font-weight: 700;
}
.del-title {
  font-size: 17px;
  font-weight: 700;
  color: #1a1a1a;
  margin-bottom: 8px;
}
.del-msg {
  font-size: 13px;
  color: #6b6b6b;
  text-align: center;
  line-height: 1.6;
  margin-bottom: 4px;
}
.del-sub {
  font-size: 11px;
  color: #a0a0a0;
  font-style: italic;
  margin-bottom: 24px;
  text-align: center;
}
.del-actions {
  display: flex;
  width: 100%;
  gap: 10px;
}
.del-btn {
  flex: 1;
  height: 44px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
}
.del-btn text {
  font-size: 14px;
  font-weight: 600;
}
.del-cancel {
  background-color: #f5f2ed;
}
.del-cancel text {
  color: #6b6b6b;
}
.del-confirm {
  background-color: #c45d3e;
}
.del-confirm text {
  color: #ffffff;
}

@media (max-width: 640px) {
  .activity-card {
    min-width: 100%;
    max-width: 100%;
  }
}
</style>
