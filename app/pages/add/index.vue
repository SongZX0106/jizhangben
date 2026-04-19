<template>
  <view class="page">
    <!-- HEADER -->
    <view class="header">
      <view class="header-inner">
        <view class="header-back" @click="goBack">
          <text class="back-arrow">
            <uni-icons type="arrow-left"></uni-icons>
          </text>
          <text class="back-text">返回</text>
        </view>
        <view class="header-date">
          <picker mode="date" :value="formDate" @change="onDateChange">
            <view class="header-date-btn">
              <text class="header-date-text">{{ dateDisplay }}</text>
              <text class="header-date-weekday">{{ weekdayDisplay }}</text>
              <text class="header-date-arrow">▸</text>
            </view>
          </picker>
        </view>
      </view>
    </view>

    <!-- MAIN -->
    <view class="main">
      <!-- Total Bar inline -->
      <view class="total-inline">
        <text class="total-inline-label">总计</text>
        <text class="total-inline-amount">¥{{ formatNum(totalAmount) }}</text>
        <template v-if="totalChange">
          <view
            :class="[
              'total-inline-badge',
              totalChange.pct >= 0 ? 'up' : 'down',
            ]"
          >
            <text>{{ totalChange.pct >= 0 ? "▲" : "▼" }}</text>
            <text
              >{{ totalChange.pct >= 0 ? "+" : ""
              }}{{ totalChange.pct.toFixed(1) }}%</text
            >
          </view>
        </template>
      </view>

      <!-- Platforms -->
      <view class="section">
        <view class="section-label">
          <text class="section-label-text">平台资产</text>
          <view class="section-label-line"></view>
        </view>
        <view class="platform-list">
          <view class="platform-row" v-for="(p, i) in platforms" :key="p.id">
            <view :class="['platform-icon', p.cls]">
              <text class="platform-icon-text">{{ p.icon }}</text>
            </view>
            <text class="platform-name">{{ p.name }}</text>
            <view class="amount-input-wrapper">
              <text class="amount-prefix">¥</text>
              <input
                type="digit"
                class="amount-input"
                placeholder="0.00"
                v-model="p.amount"
              />
            </view>
            <view class="platform-delete" @click="removePlatform(i)">
              <text class="delete-icon">✕</text>
            </view>
          </view>
        </view>
        <view v-if="platforms.length === 0" class="empty-hint">
          <text class="empty-hint-text">点击下方「+ 添加平台」开始记录</text>
        </view>
        <view class="add-platform-btn" @click="openPicker">
          <text class="add-icon">+</text>
          <text class="add-text">添加平台</text>
        </view>
      </view>

      <!-- Collapsible: Screenshots -->
      <view class="section">
        <view
          class="collapse-header"
          @click="showScreenshots = !showScreenshots"
        >
          <text class="section-label-text">截图凭证</text>
          <text v-if="screenshots.length > 0" class="collapse-count">{{
            screenshots.length
          }}</text>
          <view class="section-label-line"></view>
          <text :class="['collapse-arrow', showScreenshots ? 'open' : '']"
            >▾</text
          >
        </view>
        <view v-show="showScreenshots" class="collapse-body">
          <view class="upload-grid">
            <view class="upload-trigger" @click="chooseImage">
              <text class="upload-icon">
                <uni-icons type="cloud-upload" size="25"></uni-icons>
              </text>
              <text class="upload-text">上传</text>
            </view>
            <view
              class="upload-thumb"
              v-for="(img, i) in screenshots"
              :key="img"
            >
              <image :src="img" mode="aspectFill" @click="previewImage(i)" />
              <view class="thumb-delete" @click.stop="removeScreenshot(i)">
                <text class="thumb-delete-icon">✕</text>
              </view>
            </view>
          </view>
        </view>
      </view>

      <!-- Collapsible: Note -->
      <view class="section">
        <view class="collapse-header" @click="showNote = !showNote">
          <text class="section-label-text">备注</text>
          <view class="section-label-line"></view>
          <text :class="['collapse-arrow', showNote ? 'open' : '']">▾</text>
        </view>
        <view v-show="showNote" class="collapse-body">
          <textarea
            class="note-input"
            v-model="note"
            placeholder="记录一下这次的变化原因…"
          />
        </view>
      </view>
    </view>

    <!-- SUBMIT FOOTER -->
    <view class="submit-footer">
      <view class="submit-inner">
        <view class="btn-cancel" @click="goBack">
          <text class="btn-cancel-text">取消</text>
        </view>
        <view class="btn-submit" @click="saveSnapshot">
          <text class="btn-submit-text">保存快照</text>
        </view>
      </view>
    </view>

    <!-- PLATFORM PICKER MODAL -->
    <view
      :class="['picker-overlay', pickerOpen ? 'open' : '']"
      @click="closePicker"
    ></view>
    <view :class="['picker-sheet', pickerOpen ? 'open' : '']">
      <view class="picker-handle"></view>
      <text class="picker-title">选择平台</text>
      <text class="picker-subtitle">点击添加，或输入自定义平台名称</text>
      <view class="picker-grid">
        <view
          :class="[
            'picker-option',
            addedPlatformNames.has(p.name) ? 'selected' : '',
          ]"
          v-for="p in defaultPlatforms"
          :key="p.name"
          @click="selectDefaultPlatform(p)"
        >
          <view :class="['icon', 'platform-icon', p.cls]">
            <text class="platform-icon-text">{{ p.icon }}</text>
          </view>
          <text class="picker-label"
            >{{ p.name }}{{ addedPlatformNames.has(p.name) ? " ✓" : "" }}</text
          >
        </view>
      </view>
      <view class="picker-custom-row">
        <input
          class="picker-custom-input"
          v-model="customName"
          placeholder="自定义平台名称…"
          @confirm="addCustomPlatform"
        />
        <view class="picker-custom-btn" @click="addCustomPlatform">
          <text class="picker-custom-btn-text">添加</text>
        </view>
      </view>
      <view class="picker-cancel" @click="closePicker">
        <text class="picker-cancel-text">取消</text>
      </view>
    </view>
  </view>
</template>

<script setup>
import { ref, computed } from "vue";
import { onLoad } from "@dcloudio/uni-app";

const STORAGE_KEY = "asset_snapshots";

const defaultPlatforms = [
  { name: "微信", desc: "社交支付", icon: "微", cls: "wechat" },
  { name: "支付宝", desc: "数字钱包", icon: "支", cls: "alipay" },
  { name: "招商银行", desc: "主卡银行", icon: "招", cls: "cmb" },
  { name: "同花顺", desc: "证券交易", icon: "花", cls: "cmb" },
  { name: "雪球", desc: "投资社区", icon: "雪", cls: "icbc" },
  { name: "涨乐通", desc: "华泰证券", icon: "涨", cls: "cmb" },
];

const weekdays = ["周日", "周一", "周二", "周三", "周四", "周五", "周六"];

const today = new Date();
const formDate = ref(today.toISOString().slice(0, 10));
let platformIdCounter = 0;
const platforms = ref([
  {
    id: ++platformIdCounter,
    name: "支付宝",
    desc: "数字钱包",
    icon: "支",
    cls: "alipay",
    amount: "",
  },
  {
    id: ++platformIdCounter,
    name: "招商银行",
    desc: "主卡银行",
    icon: "招",
    cls: "cmb",
    amount: "",
  },
]);
const screenshots = ref([]);
const note = ref("");
const pickerOpen = ref(false);
const customName = ref("");
const lastTotal = ref(0);
const savingImages = ref(false);
const showScreenshots = ref(true);
const showNote = ref(true);

function loadLastTotal() {
  try {
    const raw = uni.getStorageSync(STORAGE_KEY);
    const parsed = raw && typeof raw === "string" ? JSON.parse(raw) : raw;
    if (Array.isArray(parsed) && parsed.length > 0) {
      parsed.sort((a, b) => b.date.localeCompare(a.date));
      lastTotal.value = (parsed[0].platforms || []).reduce(
        (s, p) => s + (parseFloat(p.amount) || 0),
        0,
      );
    }
  } catch (e) {}
}

onLoad(loadLastTotal);

const dateDisplay = computed(() => {
  const d = new Date(formDate.value);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y} · ${m} · ${day}`;
});

const weekdayDisplay = computed(() => {
  const d = new Date(formDate.value);
  return weekdays[d.getDay()];
});

function onDateChange(e) {
  formDate.value = e.detail.value;
}

const addedPlatformNames = computed(() => {
  const set = new Set();
  platforms.value.forEach((p) => set.add(p.name));
  return set;
});

function openPicker() {
  customName.value = "";
  pickerOpen.value = true;
}

function closePicker() {
  pickerOpen.value = false;
}

function selectDefaultPlatform(p) {
  if (addedPlatformNames.value.has(p.name)) return;
  platforms.value.push({
    id: ++platformIdCounter,
    name: p.name,
    desc: p.desc,
    icon: p.icon,
    cls: p.cls,
    amount: "",
  });
  closePicker();
}

function addCustomPlatform() {
  const name = customName.value.trim();
  if (!name || addedPlatformNames.value.has(name)) return;
  const colors = ["wechat", "alipay", "cmb", "icbc"];
  const cls = colors[Math.floor(Math.random() * colors.length)];
  platforms.value.push({
    id: ++platformIdCounter,
    name: name,
    desc: "自定义",
    icon: name[0],
    cls: cls,
    amount: "",
  });
  customName.value = "";
  closePicker();
}

function removePlatform(index) {
  platforms.value.splice(index, 1);
}

const totalAmount = computed(() => {
  return platforms.value.reduce((s, p) => s + (parseFloat(p.amount) || 0), 0);
});

const totalChange = computed(() => {
  const total = totalAmount.value;
  if (platforms.value.length === 0) return null;
  const diff = total - lastTotal.value;
  const pct = lastTotal.value > 0 ? (diff / lastTotal.value) * 100 : 0;
  return { diff, pct };
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

function chooseImage() {
  uni.chooseImage({
    count: 5 - screenshots.value.length,
    sizeType: ["compressed"],
    sourceType: ["album", "camera"],
    success: (res) => {
      savingImages.value = true;
      let pending = res.tempFilePaths.length;
      res.tempFilePaths.forEach(function (tempPath) {
        uni.saveFile({
          tempFilePath: tempPath,
          success: function (saveRes) {
            screenshots.value.push(saveRes.savedFilePath);
          },
          fail: function () {
            screenshots.value.push(tempPath);
          },
          complete: function () {
            pending--;
            if (pending <= 0) savingImages.value = false;
          },
        });
      });
    },
  });
}

function removeScreenshot(index) {
  screenshots.value.splice(index, 1);
}

function previewImage(index) {
  uni.previewImage({
    urls: screenshots.value,
    current: screenshots.value[index],
  });
}

function goBack() {
  uni.navigateBack();
}

function saveSnapshot() {
  if (savingImages.value) {
    uni.showToast({
      title: "图片保存中，请稍候",
      mask: true,
      icon: "none",
    });
    return;
  }
  if (platforms.value.length === 0) {
    uni.showToast({
      title: "请添加记录",
      mask: true,
      icon: "none",
    });
    return;
  }

  const snapshot = {
    id: Date.now().toString(),
    date: formDate.value,
    platforms: platforms.value.map(function (p) {
      return {
        name: p.name,
        desc: p.desc,
        icon: p.icon,
        cls: p.cls,
        amount: parseFloat(p.amount) || 0,
      };
    }),
    screenshots: screenshots.value,
    note: note.value.trim(),
  };

  try {
    const raw = uni.getStorageSync(STORAGE_KEY);
    const parsed = raw && typeof raw === "string" ? JSON.parse(raw) : raw;
    const arr = Array.isArray(parsed) ? parsed : [];
    arr.push(snapshot);
    const dataStr = JSON.stringify(arr);
    uni.setStorage({
      key: STORAGE_KEY,
      data: dataStr,
      success: function () {
        uni.showToast({ title: "已保存", icon: "success" });
        setTimeout(function () {
          uni.navigateBack();
        }, 800);
      },
      fail: function (err) {
        console.error("保存失败:", err);
        uni.showToast({
          title: "保存失败: " + (err.errMsg || "存储空间不足"),
          icon: "none",
          duration: 3000,
        });
      },
    });
  } catch (e) {
    console.error("保存异常:", e);
    uni.showToast({
      title: "保存失败: " + (e.message || "未知错误"),
      icon: "none",
      duration: 3000,
    });
  }
}
</script>

<style scoped>
/* ===== Base ===== */
.page {
  min-height: 100vh;
  background-color: #f5f2ed;
}

/* ===== Header ===== */
.header {
  position: sticky;
  top: 0;
  z-index: 50;
  background: rgba(245, 242, 237, 0.95);
  border-bottom: 1px solid rgba(26, 26, 26, 0.08);
  padding: 40px 24px 0;
}
.header-inner {
  max-width: 640px;
  margin: 0 auto;
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 52px;
}
.header-back {
  display: flex;
  align-items: center;
  flex-shrink: 0;
}
.back-arrow {
  font-size: 18px;
  color: #6b6b6b;
  margin-right: 8px;
}
.back-text {
  font-size: 13px;
  font-weight: 500;
  color: #6b6b6b;
}
.header-date {
  flex-shrink: 0;
}
.header-date-btn {
  display: flex;
  align-items: center;
  padding: 6px 12px;
  background-color: #fffdf9;
  border: 1px solid rgba(26, 26, 26, 0.08);
  border-radius: 10px;
}
.header-date-text {
  font-family: "JetBrains Mono", monospace;
  font-size: 13px;
  font-weight: 600;
  color: #1a1a1a;
}
.header-date-weekday {
  font-family: "DM Sans", sans-serif;
  font-size: 11px;
  font-weight: 500;
  color: #a0a0a0;
  margin-left: 8px;
}
.header-date-arrow {
  font-size: 12px;
  color: #a0a0a0;
  margin-left: 6px;
  margin-top: -1px;
}

/* ===== Main ===== */
.main {
  max-width: 640px;
  margin: 0 auto;
  padding: 20px 20px 75px;
}

/* ===== Sections ===== */
.section {
  margin-bottom: 24px;
}
.section-label {
  display: flex;
  align-items: center;
  margin-bottom: 12px;
}
.section-label-text {
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 3px;
  color: #a0a0a0;
  flex-shrink: 0;
}
.section-label-line {
  flex: 1;
  height: 1px;
  background-color: rgba(26, 26, 26, 0.08);
  margin-left: 12px;
}

/* ===== Platform Input ===== */
.platform-list {
  display: flex;
  flex-direction: column;
}
.platform-list .platform-row {
  margin-bottom: 8px;
}
.platform-row {
  display: flex;
  align-items: center;
  padding: 12px 16px;
  background-color: #fffdf9;
  border: 1px solid rgba(26, 26, 26, 0.08);
  border-radius: 12px;
}
.platform-row .platform-icon {
  margin-right: 10px;
}
.platform-icon {
  width: 34px;
  height: 34px;
  border-radius: 9px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}
.platform-icon-text {
  font-weight: 700;
  font-size: 12px;
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
.platform-name {
  flex: 1;
  min-width: 0;
  font-size: 14px;
  font-weight: 600;
  color: #1a1a1a;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.amount-input-wrapper {
  position: relative;
  flex-shrink: 0;
  margin-left: 8px;
}
.amount-prefix {
  position: absolute;
  left: 12px;
  top: 50%;
  transform: translateY(-50%);
  font-family: "JetBrains Mono", monospace;
  font-size: 14px;
  font-weight: 600;
  color: #a0a0a0;
  z-index: 1;
}
.amount-input {
  width: 100px;
  padding: 8px 12px 8px 28px;
  font-family: "JetBrains Mono", monospace;
  font-size: 16px;
  font-weight: 700;
  color: #1a1a1a;
  background-color: #f5f2ed;
  border: 1px solid rgba(26, 26, 26, 0.08);
  border-radius: 10px;
  text-align: right;
  height: auto;
}
.platform-delete {
  flex-shrink: 0;
  width: 28px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-left: 6px;
}
.delete-icon {
  font-size: 13px;
  color: #c43e3e;
}
.empty-hint {
  padding: 24px;
  text-align: center;
}
.empty-hint-text {
  font-size: 13px;
  color: #a0a0a0;
}
.add-platform-btn {
  width: 100%;
  padding: 12px 0;
  border: 1.5px dashed rgba(26, 26, 26, 0.12);
  border-radius: 12px;
  background-color: transparent;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-top: 8px;
}
.add-icon {
  font-size: 16px;
  color: #a0a0a0;
  margin-right: 8px;
}
.add-text {
  font-family: "DM Sans", sans-serif;
  font-size: 13px;
  font-weight: 600;
  color: #a0a0a0;
}

/* ===== Collapsible Sections ===== */
.collapse-header {
  display: flex;
  align-items: center;
  margin-bottom: 0;
  padding: 8px 0;
}
.collapse-count {
  font-family: "JetBrains Mono", monospace;
  font-size: 10px;
  font-weight: 700;
  color: #a0a0a0;
  background-color: rgba(26, 26, 26, 0.06);
  padding: 2px 6px;
  border-radius: 6px;
  margin-left: 8px;
}
.collapse-arrow {
  font-size: 12px;
  color: #a0a0a0;
  margin-left: 8px;
  transition: transform 0.2s;
  flex-shrink: 0;
}
.collapse-arrow.open {
  transform: rotate(180deg);
}
.collapse-body {
  padding-top: 8px;
}

/* ===== Screenshots ===== */
.upload-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 10px;
}
.upload-trigger {
  position: relative;
  width: 100%;
  height: 0;
  padding-bottom: 100%;
  border: 1.5px dashed rgba(26, 26, 26, 0.12);
  border-radius: 10px;
  background-color: #fffdf9;
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}
.upload-icon {
  position: absolute;
  top: 35%;
  font-size: 20px;
  color: #a0a0a0;
}
.upload-text {
  position: absolute;
  top: 60%;
  font-size: 9px;
  font-weight: 600;
  letter-spacing: 1px;
  color: #a0a0a0;
}
.upload-thumb {
  position: relative;
  width: 100%;
  height: 0;
  padding-bottom: 100%;
  border: 1px solid rgba(26, 26, 26, 0.08);
  border-radius: 10px;
  overflow: hidden;
  box-sizing: border-box;
}
.upload-thumb image {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
}
.thumb-delete {
  position: absolute;
  top: 4px;
  right: 4px;
  width: 20px;
  height: 20px;
  border-radius: 10px;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
}
.thumb-delete-icon {
  font-size: 10px;
  color: #ffffff;
}

/* ===== Note ===== */
.note-input {
  width: 100%;
  max-width: 100%;
  box-sizing: border-box;
  padding: 14px 16px;
  font-family: "DM Sans", "Noto Serif SC", sans-serif;
  font-size: 14px;
  line-height: 1.7;
  color: #1a1a1a;
  background-color: #fffdf9;
  border: 1px solid rgba(26, 26, 26, 0.08);
  border-radius: 12px;
  min-height: 72px;
}

/* ===== Total Inline ===== */
.total-inline {
  display: flex;
  align-items: center;
  padding: 14px 20px;
  background-color: #fffdf9;
  border: 1px solid rgba(26, 26, 26, 0.08);
  border-radius: 12px;
  margin-bottom: 20px;
}
.total-inline-label {
  font-family: "DM Sans", sans-serif;
  font-size: 11px;
  font-weight: 600;
  color: #a0a0a0;
  letter-spacing: 2px;
  margin-right: 10px;
}
.total-inline-amount {
  font-family: "JetBrains Mono", monospace;
  font-size: 20px;
  font-weight: 700;
  color: #1a1a1a;
  flex: 1;
}
.total-inline-badge {
  display: flex;
  align-items: center;
  font-family: "JetBrains Mono", monospace;
  font-size: 12px;
  font-weight: 700;
  padding: 4px 10px;
  border-radius: 6px;
}
.total-inline-badge.up {
  color: #c43e3e;
  background-color: #fdf0ef;
}
.total-inline-badge.down {
  color: #2e7d5b;
  background-color: #eef7f2;
}

/* ===== Submit Footer ===== */
.submit-footer {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  z-index: 50;
  background: rgba(245, 242, 237, 0.95);
  border-top: 1px solid rgba(26, 26, 26, 0.08);
  padding: 12px 24px;
}
.submit-inner {
  max-width: 640px;
  margin: 0 auto;
  display: flex;
}
.submit-inner .btn-cancel {
  margin-right: 12px;
}
.btn-cancel {
  flex: 1;
  border: 1px solid rgba(26, 26, 26, 0.08);
  border-radius: 12px;
  background-color: transparent;
  display: flex;
  align-items: center;
  justify-content: center;
  height: 46px;
}
.btn-cancel-text {
  font-family: "DM Sans", sans-serif;
  font-size: 14px;
  font-weight: 600;
  color: #6b6b6b;
}
.btn-submit {
  flex: 2;
  border-radius: 12px;
  background-color: #1a1a1a;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4px 20px rgba(26, 26, 26, 0.15);
  height: 46px;
}
.btn-submit-text {
  font-family: "DM Sans", sans-serif;
  font-size: 14px;
  font-weight: 700;
  color: #f5f2ed;
}

/* ===== Platform Picker Modal ===== */
.picker-overlay {
  position: fixed;
  top: 0;
  right: 0;
  bottom: 0;
  left: 0;
  z-index: 200;
  background-color: rgba(26, 26, 26, 0.3);
  opacity: 0;
  visibility: hidden;
}
.picker-overlay.open {
  opacity: 1;
  visibility: visible;
}
.picker-sheet {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  z-index: 210;
  background-color: #fffdf9;
  border-radius: 20px 20px 0 0;
  padding: 12px 24px 32px;
  max-height: 70vh;
  overflow-y: auto;
  transform: translateY(100%);
}
.picker-sheet.open {
  transform: translateY(0);
}
.picker-handle {
  width: 36px;
  height: 4px;
  border-radius: 2px;
  background-color: #a0a0a0;
  margin: 0 auto 20px;
}
.picker-title {
  display: block;
  font-family: "Playfair Display", serif;
  font-size: 20px;
  font-weight: 700;
  color: #1a1a1a;
  margin-bottom: 6px;
}
.picker-subtitle {
  display: block;
  font-size: 12px;
  color: #a0a0a0;
  margin-bottom: 20px;
}
.picker-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  margin-bottom: 16px;
}
.picker-option {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 16px 8px;
  border: 1.5px solid rgba(26, 26, 26, 0.08);
  border-radius: 14px;
  background-color: #f5f2ed;
  margin: 5px;
}
.picker-option .icon {
  width: 40px;
  height: 40px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 8px;
}
.picker-option .platform-icon-text {
  font-weight: 700;
  font-size: 14px;
  color: #ffffff;
}
.picker-option.selected {
  border-color: #c45d3e;
  background-color: rgba(196, 93, 62, 0.04);
}
.picker-label {
  font-size: 12px;
  font-weight: 600;
  color: #1a1a1a;
  text-align: center;
  line-height: 1.3;
}
.picker-custom-row {
  display: flex;
  margin-top: 4px;
}
.picker-custom-row .picker-custom-input {
  margin-right: 10px;
}
.picker-custom-input {
  flex: 1;
  padding: 12px 16px;
  font-family: "DM Sans", "Noto Serif SC", sans-serif;
  font-size: 14px;
  color: #1a1a1a;
  background-color: #f5f2ed;
  border: 1.5px solid rgba(26, 26, 26, 0.08);
  border-radius: 12px;
  height: auto;
}
.picker-custom-btn {
  padding: 0 20px;
  border-radius: 12px;
  background-color: #1a1a1a;
  display: flex;
  align-items: center;
  justify-content: center;
}
.picker-custom-btn-text {
  font-family: "DM Sans", sans-serif;
  font-size: 13px;
  font-weight: 700;
  color: #f5f2ed;
}
.picker-cancel {
  width: 100%;
  padding: 12px 0;
  margin-top: 12px;
  border: 1px solid rgba(26, 26, 26, 0.08);
  border-radius: 12px;
  background-color: transparent;
  display: flex;
  align-items: center;
  justify-content: center;
}
.picker-cancel-text {
  font-family: "DM Sans", sans-serif;
  font-size: 14px;
  font-weight: 600;
  color: #6b6b6b;
}

/* ===== Responsive ===== */
@media (max-width: 480px) {
  .amount-input {
    width: 85px;
    font-size: 14px;
  }
}
</style>
