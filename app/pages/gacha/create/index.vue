<template>
  <view class="page">
    <!-- Header -->
    <view class="gacha-header">
      <view class="header-left">
        <text class="back-btn" @click="goBack">←</text>
        <text class="header-title">{{ editId ? '编辑活动' : '创建新活动' }}</text>
      </view>
    </view>

    <!-- Form -->
    <view class="form-body">
      <!-- Activity Cover -->
      <view class="section">
        <text class="section-label">活动封面</text>
        <view class="cover-upload" @click="uploadCover">
          <image
            v-if="coverImage"
            :src="coverImage"
            mode="aspectFill"
            class="cover-preview"
          />
          <view v-else class="cover-placeholder">
            <text class="cover-icon-big">📷</text>
            <text class="cover-hint">点击上传封面图</text>
          </view>
        </view>
      </view>

      <!-- Activity Info -->
      <view class="section">
        <text class="section-label">活动信息</text>
        <view class="form-card">
          <text class="field-label"
            ><text class="label-icon">🎯</text>活动名称</text
          >
          <input
            class="field-input"
            v-model="name"
            placeholder="输入响亮的活动标题..."
            placeholder-style="color:#a0a0a0"
          />
        </view>
      </view>

      <!-- Prizes -->
      <view class="section">
        <text class="section-label">奖品列表</text>
        <view class="prize-list">
          <view class="prize-item" v-for="(prize, idx) in prizes" :key="idx">
            <view class="prize-img-box" @click="uploadPrizeImage(idx)">
              <image
                v-if="prize.image"
                :src="prize.image"
                mode="aspectFill"
                class="prize-img"
              />
              <view v-else class="prize-img-placeholder">
                <text class="prize-img-add">+</text>
                <text class="prize-img-hint">图片</text>
              </view>
            </view>
            <view class="prize-body">
              <input
                class="field-input"
                v-model="prize.name"
                placeholder="例如：限量款潮玩"
                placeholder-style="color:#a0a0a0"
              />
              <view class="rarity-row">
                <text
                  v-for="r in rarities"
                  :key="r.value"
                  :class="[
                    'rarity-chip',
                    prize.rarity === r.value ? 'active' : '',
                    'rarity-' + r.value.toLowerCase(),
                  ]"
                  @click="prize.rarity = r.value"
                  >{{ r.label }}</text
                >
              </view>
            </view>
            <view
              class="prize-remove"
              @click="removePrize(idx)"
              v-if="prizes.length > 1"
            >
              <text>✕</text>
            </view>
          </view>
        </view>
        <view class="add-prize-btn" @click="addPrize">
          <text class="add-icon">+</text>
          <text>添加更多奖品</text>
        </view>
      </view>

      <!-- Tips -->
      <view class="tips-card">
        <text class="tips-icon">💡</text>
        <view class="tips-body">
          <text class="tips-title">贴士</text>
          <text class="tips-text"
            >为每个奖品上传一张精美的实拍图，可以极大地提高用户的参与热情。</text
          >
        </view>
      </view>
    </view>

    <!-- Save Button -->
    <view class="save-bar">
      <view class="save-btn" @click="doSave">
        <text class="save-btn-text">{{ editId ? '保存修改' : '完成并保存' }}</text>
        <text class="save-btn-check">✓</text>
      </view>
    </view>
  </view>
</template>

<script setup>
import { ref } from "vue";
import { onLoad } from "@dcloudio/uni-app";

const STORAGE_KEY = "gacha_activities";

const rarities = [
  { value: "LEGENDARY", label: "传说" },
  { value: "EPIC", label: "史诗" },
  { value: "COMMON", label: "普通" },
];

const name = ref("");
const coverImage = ref("");
const editId = ref("");
const prizes = ref([
  { name: "", image: "", rarity: "COMMON" },
  { name: "", image: "", rarity: "COMMON" },
]);

function genId() {
  return (
    new Date().getTime().toString(36) +
    Math.random().toString(36).substr(2, 6)
  );
}

function addPrize() {
  prizes.value.push({ name: "", image: "", rarity: "COMMON" });
}

function removePrize(idx) {
  prizes.value.splice(idx, 1);
}

function uploadCover() {
  uni.chooseImage({
    count: 1,
    sizeType: ["compressed"],
    success: (res) => {
      uni.saveFile({
        tempFilePath: res.tempFilePaths[0],
        success: (saveRes) => {
          coverImage.value = saveRes.savedFilePath;
        },
        fail: () => {
          coverImage.value = res.tempFilePaths[0];
        },
      });
    },
  });
}

function uploadPrizeImage(idx) {
  uni.chooseImage({
    count: 1,
    sizeType: ["compressed"],
    success: (res) => {
      uni.saveFile({
        tempFilePath: res.tempFilePaths[0],
        success: (saveRes) => {
          prizes.value[idx].image = saveRes.savedFilePath;
        },
        fail: () => {
          prizes.value[idx].image = res.tempFilePaths[0];
        },
      });
    },
  });
}

function doSave() {
  const n = name.value.trim();
  if (!n) {
    uni.showToast({ title: "请输入活动名称", icon: "none" });
    return;
  }
  const validPrizes = prizes.value.filter((p) => p.name.trim());
  if (validPrizes.length < 2) {
    uni.showToast({ title: "请至少填写 2 个奖品名称", icon: "none" });
    return;
  }

  try {
    const raw = uni.getStorageSync(STORAGE_KEY);
    const parsed = raw && typeof raw === "string" ? JSON.parse(raw) : raw;
    const activities = Array.isArray(parsed) ? parsed : [];

    if (editId.value) {
      const idx = activities.findIndex((a) => a.id === editId.value);
      if (idx > -1) {
        activities[idx].name = n;
        activities[idx].coverImage = coverImage.value;
        activities[idx].coverGradient = "";
        activities[idx].emoji = "";
        activities[idx].prizes = validPrizes.map((p) => ({
          id: p.id || genId(),
          name: p.name.trim(),
          rarity: p.rarity,
          image: p.image,
        }));
      }
    } else {
      activities.push({
        id: genId(),
        name: n,
        description: "精彩抽卡活动",
        coverImage: coverImage.value,
        createdAt: new Date().toISOString(),
        prizes: validPrizes.map((p) => ({
          id: genId(),
          name: p.name.trim(),
          rarity: p.rarity,
          image: p.image,
        })),
        drawnPrizeIds: [],
      });
    }

    uni.setStorageSync(STORAGE_KEY, JSON.stringify(activities));
    uni.showToast({ title: editId.value ? "已保存" : "创建成功", icon: "success" });
    setTimeout(() => {
      uni.navigateBack();
    }, 800);
  } catch (e) {
    uni.showToast({ title: "保存失败", icon: "none" });
  }
}

function goBack() {
  uni.navigateBack();
}

onLoad((options) => {
  if (options && options.editId) {
    editId.value = options.editId;
    try {
      const raw = uni.getStorageSync(STORAGE_KEY);
      const parsed = raw && typeof raw === "string" ? JSON.parse(raw) : raw;
      const activities = Array.isArray(parsed) ? parsed : [];
      const act = activities.find((a) => a.id === options.editId);
      if (act) {
        name.value = act.name;
        coverImage.value = act.coverImage || "";
        prizes.value = (act.prizes || []).map((p) => ({
          id: p.id,
          name: p.name,
          image: p.image || "",
          rarity: p.rarity || "COMMON",
        }));
        if (prizes.value.length < 2) {
          prizes.value.push({ name: "", image: "", rarity: "COMMON" });
        }
      }
    } catch (e) {
      // ignore
    }
  }
});
</script>

<style scoped>
.page {
  min-height: 100vh;
  background-color: #f5f2ed;
  padding-bottom: 160px;
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

/* Form Body */
.form-body {
  max-width: 900px;
  margin: 0 auto;
  padding: 0 24px;
}

/* Section */
.section {
  margin-bottom: 32px;
}
.section-label {
  display: block;
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 2px;
  color: #a0a0a0;
  margin-bottom: 12px;
  padding-left: 4px;
}

/* Cover Upload */
.cover-upload {
  width: 100%;
  height: 180px;
  border-radius: 20px;
  overflow: hidden;
  background-color: #fffdf9;
  border: 2px dashed rgba(26, 26, 26, 0.12);
}
.cover-preview {
  width: 100%;
  height: 100%;
}
.cover-placeholder {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
}
.cover-icon-big {
  font-size: 36px;
}
.cover-hint {
  font-size: 13px;
  color: #a0a0a0;
}

/* Form Card */
.form-card {
  background-color: #fffdf9;
  border: 1px solid rgba(26, 26, 26, 0.08);
  border-radius: 20px;
  padding: 20px;
}
.field-label {
  display: block;
  font-size: 12px;
  font-weight: 600;
  color: #6b6b6b;
  margin-bottom: 8px;
}
.label-icon {
  margin-right: 4px;
}
.field-input {
  width: 100%;
  height: 44px;
  background-color: #f5f2ed;
  border-radius: 10px;
  padding: 0 14px;
  font-size: 14px;
  color: #1a1a1a;
  box-sizing: border-box;
}

/* Prize List */
.prize-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-bottom: 12px;
}
.prize-item {
  background-color: #fffdf9;
  border: 1px solid rgba(26, 26, 26, 0.08);
  border-radius: 20px;
  padding: 16px;
  display: flex;
  gap: 14px;
  align-items: flex-start;
}
.prize-img-box {
  width: 80px;
  height: 80px;
  border-radius: 12px;
  overflow: hidden;
  flex-shrink: 0;
  background-color: #f5f2ed;
  border: 2px dashed rgba(26, 26, 26, 0.12);
}
.prize-img {
  width: 100%;
  height: 100%;
}
.prize-img-placeholder {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 1px;
}
.prize-img-add {
  font-size: 22px;
  color: #c45d3e;
  font-weight: 300;
  line-height: 1;
}
.prize-img-hint {
  font-size: 10px;
  color: #a0a0a0;
}
.prize-body {
  flex: 1;
  min-width: 0;
}
.rarity-row {
  display: flex;
  gap: 6px;
  margin-top: 8px;
  flex-wrap: wrap;
}
.rarity-chip {
  font-size: 10px;
  font-weight: 600;
  letter-spacing: 0.5px;
  padding: 3px 10px;
  border-radius: 6px;
  background-color: #f5f2ed;
  color: #a0a0a0;
  transition: all 0.2s;
}
.rarity-chip.active {
  color: #ffffff;
}
.rarity-chip.active.rarity-legendary {
  background-color: #c45d3e;
}
.rarity-chip.active.rarity-epic {
  background-color: #7c3aed;
}
.rarity-chip.active.rarity-rare {
  background-color: #2563eb;
}
.rarity-chip.active.rarity-common {
  background-color: #6b6b6b;
}
.prize-remove {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  background-color: #f5f2ed;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  margin-top: 4px;
}
.prize-remove text {
  font-size: 12px;
  color: #a0a0a0;
}
.add-prize-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  height: 48px;
  border: 2px dashed rgba(196, 93, 62, 0.3);
  border-radius: 16px;
  font-size: 13px;
  font-weight: 600;
  color: #c45d3e;
  background-color: rgba(196, 93, 62, 0.04);
}
.add-icon {
  font-size: 18px;
  font-weight: 300;
}

/* Tips */
.tips-card {
  background-color: rgba(196, 93, 62, 0.06);
  border: 1px solid rgba(196, 93, 62, 0.12);
  border-radius: 16px;
  padding: 16px;
  display: flex;
  gap: 10px;
  margin-bottom: 32px;
}
.tips-icon {
  font-size: 18px;
  flex-shrink: 0;
}
.tips-body {
  flex: 1;
}
.tips-title {
  display: block;
  font-size: 12px;
  font-weight: 700;
  color: #c45d3e;
  margin-bottom: 4px;
}
.tips-text {
  font-size: 12px;
  color: #6b6b6b;
  line-height: 1.6;
}

/* Save Bar */
.save-bar {
  position: fixed;
  bottom: 10px;
  left: 0;
  right: 0;
  z-index: 45;
  padding: 12px 24px;
  background: linear-gradient(180deg, transparent, #f5f2ed 40%);
}
.save-btn {
  max-width: 900px;
  margin: 0 auto;
  height: 52px;
  border-radius: 16px;
  background-color: #c45d3e;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  box-shadow: 0 4px 16px rgba(196, 93, 62, 0.25);
  transition: transform 0.2s;
}
.save-btn:active {
  transform: scale(0.96);
}
.save-btn-text {
  font-size: 17px;
  font-weight: 700;
  color: #ffffff;
  letter-spacing: 1px;
}
.save-btn-check {
  font-size: 18px;
  color: #ffffff;
  font-weight: 700;
}
</style>
