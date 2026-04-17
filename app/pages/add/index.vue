<template>
    <view class="page">
        <!-- HEADER -->
        <header class="header">
            <div class="header-inner">
                <view class="header-back" @click="goBack">
                    <svg viewBox="0 0 24 24">
                        <polyline points="15 18 9 12 15 6" />
                    </svg>
                    <text>返回</text>
                </view>
                <span class="logo-mark">A·A</span>
            </div>
        </header>

        <!-- MAIN -->
        <view class="main">
            <view class="page-header">
                <view class="page-eyebrow">New Entry</view>
                <h1 class="page-title">新增快照</h1>
                <p class="page-subtitle">记录此刻，未来回看时会感谢现在的自己</p>
            </view>

            <!-- Date -->
            <view class="section">
                <view class="section-label">快照日期</view>
                <view class="date-wrapper">
                    <view class="date-display">
                        <svg viewBox="0 0 24 24">
                            <rect x="3" y="4" width="18" height="18" rx="2" />
                            <line x1="16" y1="2" x2="16" y2="6" />
                            <line x1="8" y1="2" x2="8" y2="6" />
                            <line x1="3" y1="10" x2="21" y2="10" />
                        </svg>
                        <span class="date-text">{{ dateDisplay }}</span>
                        <span class="date-weekday">{{ weekdayDisplay }}</span>
                        <picker mode="date" :value="formDate" @change="onDateChange">
                            <view class="date-input-cover"></view>
                        </picker>
                    </view>
                </view>
            </view>

            <!-- Platforms -->
            <view class="section">
                <view class="section-label">平台资产</view>
                <view class="platform-list">
                    <view class="platform-row" v-for="(p, i) in platforms" :key="p.id">
                        <view :class="['platform-icon', p.cls]">{{ p.icon }}</view>
                        <view class="platform-info">
                            <view class="platform-name">{{ p.name }}</view>
                            <view class="platform-desc">{{ p.desc }}</view>
                        </view>
                        <view class="amount-input-wrapper">
                            <span class="amount-prefix">¥</span>
                            <input type="digit" class="amount-input" placeholder="0.00" v-model="p.amount"
                                @input="updateTotal" />
                        </view>
                        <uni-icons type="closeempty" size="16" color="red" class="platform-delete"
                            @click="removePlatform(i)" />
                    </view>
                </view>
                <button class="add-platform-btn" @click="openPicker">
                    <svg viewBox="0 0 24 24">
                        <line x1="12" y1="5" x2="12" y2="19" />
                        <line x1="5" y1="12" x2="19" y2="12" />
                    </svg>
                    添加平台
                </button>
            </view>

            <!-- Total Preview -->
            <view class="section">
                <view class="section-label">资产汇总</view>
                <view class="total-preview">
                    <view>
                        <view class="total-label">本次总资产</view>
                        <view class="total-amount">{{ formatNum(totalAmount) }}<span class="currency">CNY</span></view>
                    </view>
                    <view class="total-change">
                        <template v-if="totalChange">
                            <view :class="['change-badge', totalChange.pct >= 0 ? 'up' : 'down']">
                                <svg viewBox="0 0 24 24">
                                    <polyline v-if="totalChange.pct >= 0" points="18 15 12 9 6 15" />
                                    <polyline v-else points="6 9 12 15 18 9" />
                                </svg>
                                {{ totalChange.pct >= 0 ? '+' : '' }}{{ totalChange.pct.toFixed(1) }}%
                            </view>
                            <view class="change-amount">
                                {{ totalChange.diff >= 0 ? '+' : '' }}{{ formatNum(totalChange.diff) }} CNY
                            </view>
                        </template>
                        <template v-else>
                            <view class="change-badge neutral">
                                <svg viewBox="0 0 24 24">
                                    <line x1="5" y1="12" x2="19" y2="12" />
                                </svg>
                                —
                            </view>
                            <view class="change-amount">上次 ¥{{ formatNum(lastTotal) }}</view>
                        </template>
                    </view>
                </view>
            </view>

            <!-- Screenshots -->
            <view class="section">
                <view class="section-label">截图凭证</view>
                <view class="upload-grid">
                    <view class="upload-trigger" @click="chooseImage">
                        <svg viewBox="0 0 24 24">
                            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                            <polyline points="17 8 12 3 7 8" />
                            <line x1="12" y1="3" x2="12" y2="15" />
                        </svg>
                        <text>上传</text>
                    </view>
                    <view class="upload-thumb" v-for="(img, i) in screenshots" :key="i">
                        <image :src="img" mode="aspectFill" @click="previewImage(i)" />
                        <view class="thumb-delete" @click.stop="removeScreenshot(i)">
                            <uni-icons type="closeempty" size="10" color="#fff" />
                        </view>
                    </view>
                </view>
            </view>

            <!-- Note -->
            <view class="section">
                <view class="section-label">备注</view>
                <textarea class="note-input" v-model="note" placeholder="记录一下这次的变化原因…" />
                <view class="note-hint">可选。方便未来回顾时了解当时的情况</view>
            </view>
        </view>

        <!-- SUBMIT FOOTER -->
        <footer class="submit-footer">
            <view class="submit-inner">
                <button class="btn-cancel" @click="goBack">取消</button>
                <button class="btn-submit" @click="saveSnapshot">保存快照</button>
            </view>
        </footer>

        <!-- PLATFORM PICKER MODAL -->
        <view :class="['picker-overlay', pickerOpen ? 'open' : '']" @click="closePicker"></view>
        <view :class="['picker-sheet', pickerOpen ? 'open' : '']">
            <view class="picker-handle"></view>
            <view class="picker-title">选择平台</view>
            <view class="picker-subtitle">点击添加，或输入自定义平台名称</view>
            <view class="picker-grid">
                <view :class="['picker-option', addedPlatformNames.has(p.name) ? 'selected' : '']"
                    v-for="p in defaultPlatforms" :key="p.name" @click="selectDefaultPlatform(p)">
                    <view :class="['icon', 'platform-icon', p.cls]">{{ p.icon }}</view>
                    <view class="label">{{ p.name }}{{ addedPlatformNames.has(p.name) ? ' ✓' : '' }}</view>
                </view>
            </view>
            <view class="picker-custom-row">
                <input class="picker-custom-input" v-model="customName" placeholder="自定义平台名称…"
                    @confirm="addCustomPlatform" />
                <button class="picker-custom-btn" @click="addCustomPlatform">添加</button>
            </view>
            <button class="picker-cancel" @click="closePicker">取消</button>
        </view>
    </view>
</template>

<script setup>
import { ref, computed } from 'vue';

const STORAGE_KEY = 'asset_snapshots';

const defaultPlatforms = [
    { name: '微信', desc: '社交支付', icon: '微', cls: 'wechat' },
    { name: '支付宝', desc: '数字钱包', icon: '支', cls: 'alipay' },
    { name: '招商银行', desc: '主卡银行', icon: '招', cls: 'cmb' },
    { name: '同花顺', desc: '证券交易', icon: '花', cls: 'cmb' },
    { name: '雪球', desc: '投资社区', icon: '雪', cls: 'icbc' },
    { name: '涨乐通', desc: '华泰证券', icon: '涨', cls: 'cmb' },
];

const weekdays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];

const today = new Date();
const formDate = ref(today.toISOString().slice(0, 10));
const platforms = ref([]);
const screenshots = ref([]);
const note = ref('');
const pickerOpen = ref(false);
const customName = ref('');
const lastTotal = ref(0);
let platformIdCounter = 0;

// Load last total
try {
    const raw = uni.getStorageSync(STORAGE_KEY);
    if (raw) {
        const arr = JSON.parse(raw);
        if (arr.length > 0) {
            arr.sort((a, b) => b.date.localeCompare(a.date));
            lastTotal.value = (arr[0].platforms || []).reduce((s, p) => s + (parseFloat(p.amount) || 0), 0);
        }
    }
} catch (e) { }

const dateDisplay = computed(() => {
    const d = new Date(formDate.value);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
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
    platforms.value.forEach(p => set.add(p.name));
    return set;
});

function openPicker() {
    customName.value = '';
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
        amount: ''
    });
    closePicker();
}

function addCustomPlatform() {
    const name = customName.value.trim();
    if (!name || addedPlatformNames.value.has(name)) return;
    const colors = ['wechat', 'alipay', 'cmb', 'icbc'];
    const cls = colors[Math.floor(Math.random() * colors.length)];
    platforms.value.push({
        id: ++platformIdCounter,
        name: name,
        desc: '自定义',
        icon: name[0],
        cls: cls,
        amount: ''
    });
    customName.value = '';
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
    if (total <= 0) return null;
    const diff = total - lastTotal.value;
    const pct = lastTotal.value > 0 ? (diff / lastTotal.value) * 100 : 0;
    return { diff, pct };
});

function formatNum(n) {
    return (parseFloat(n) || 0).toLocaleString('zh-CN');
}

function chooseImage() {
    uni.chooseImage({
        count: 5 - screenshots.value.length,
        sizeType: ['compressed'],
        sourceType: ['album', 'camera'],
        success: (res) => {
            screenshots.value.push(...res.tempFilePaths);
        }
    });
}

function removeScreenshot(index) {
    screenshots.value.splice(index, 1);
}

function previewImage(index) {
    uni.previewImage({
        urls: screenshots.value,
        current: screenshots.value[index]
    });
}

function goBack() {
    uni.navigateBack();
}

function saveSnapshot() {
    const snapshot = {
        id: Date.now().toString(),
        date: formDate.value,
        platforms: platforms.value.map(function (p) {
            return {
                name: p.name,
                desc: p.desc,
                icon: p.icon,
                cls: p.cls,
                amount: parseFloat(p.amount) || 0
            };
        }),
        screenshots: screenshots.value,
        note: note.value.trim()
    };

    try {
        const raw = uni.getStorageSync(STORAGE_KEY);
        const arr = raw ? JSON.parse(raw) : [];
        arr.push(snapshot);
        uni.setStorageSync(STORAGE_KEY, JSON.stringify(arr));
        uni.showToast({ title: '已保存', icon: 'success' });
        setTimeout(function () { uni.navigateBack(); }, 800);
    } catch (e) {
        uni.showToast({ title: '保存失败', icon: 'none' });
    }
}
</script>

<style scoped>
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
    max-width: 640px;
    margin: 0 auto;
    display: flex;
    align-items: center;
    justify-content: space-between;
    height: 64px;
}

.header-back {
    display: flex;
    align-items: center;
    gap: 8px;
    color: var(--ink-light);
    font-size: 13px;
    font-weight: 500;
}

.header-back svg {
    width: 18px;
    height: 18px;
    fill: none;
    stroke: currentColor;
    stroke-width: 2;
    stroke-linecap: round;
    stroke-linejoin: round;
}

.logo-mark {
    font-family: 'Playfair Display', serif;
    font-weight: 900;
    font-size: 18px;
    letter-spacing: -0.5px;
    color: var(--ink);
}

/* ===== MAIN ===== */
.main {
    max-width: 640px;
    margin: 0 auto;
    padding: 48px 24px 160px;
}

.page-header {
    margin-bottom: 48px;
}

.page-eyebrow {
    font-size: 11px;
    font-weight: 600;
    letter-spacing: 4px;
    text-transform: uppercase;
    color: var(--accent);
    margin-bottom: 12px;
    display: flex;
    align-items: center;
    gap: 12px;
}

.page-eyebrow::before {
    content: '';
    width: 24px;
    height: 1.5px;
    background: var(--accent);
}

.page-title {
    font-family: 'Playfair Display', 'Noto Serif SC', serif;
    font-size: 40px;
    font-weight: 900;
    line-height: 1.1;
    letter-spacing: -1.5px;
    color: var(--ink);
    margin-bottom: 8px;
}

.page-subtitle {
    font-size: 14px;
    color: var(--ink-muted);
    font-weight: 400;
}

/* ===== SECTIONS ===== */
.section {
    margin-bottom: 40px;
}

.section-label {
    font-size: 10px;
    font-weight: 700;
    letter-spacing: 3px;
    text-transform: uppercase;
    color: var(--ink-muted);
    margin-bottom: 16px;
    display: flex;
    align-items: center;
    gap: 8px;
}

.section-label::after {
    content: '';
    flex: 1;
    height: 1px;
    background: var(--border);
    margin-left: 8px;
}

/* ===== DATE INPUT ===== */
.date-wrapper {
    position: relative;
}

.date-display {
    font-family: 'JetBrains Mono', monospace;
    font-size: 28px;
    font-weight: 700;
    letter-spacing: -1px;
    color: var(--ink);
    padding: 20px 24px;
    background: var(--paper-card);
    border: 1px solid var(--border);
    border-radius: 14px;
    display: flex;
    align-items: center;
    gap: 16px;
    position: relative;
    overflow: hidden;
    white-space: nowrap;
    flex-wrap: nowrap;
}

.date-display svg {
    width: 22px;
    height: 22px;
    stroke: var(--accent);
    fill: none;
    stroke-width: 1.8;
    flex-shrink: 0;
}

.date-input-cover {
    position: absolute;
    inset: 0;
    opacity: 0;
}

.date-weekday {
    font-family: 'DM Sans', sans-serif;
    font-size: 12px;
    font-weight: 600;
    color: var(--ink-muted);
    letter-spacing: 1px;
    margin-left: auto;
    flex-shrink: 0;
}

/* ===== PLATFORM INPUT ===== */
.platform-list {
    display: flex;
    flex-direction: column;
    gap: 12px;
}

.platform-row {
    display: flex;
    align-items: center;
    gap: 14px;
    padding: 16px 20px;
    background: var(--paper-card);
    border: 1px solid var(--border);
    border-radius: 14px;
    transition: border-color 0.2s, box-shadow 0.2s;
}

.platform-icon {
    width: 40px;
    height: 40px;
    border-radius: 10px;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    font-weight: 700;
    font-size: 13px;
    letter-spacing: -0.5px;
    color: white;
}

.platform-icon.alipay {
    background: #1677ff;
}

.platform-icon.cmb {
    background: #e60012;
}

.platform-icon.wechat {
    background: #07c160;
}

.platform-icon.icbc {
    background: #c4122f;
}

.platform-icon.default {
    background: var(--ink);
}

.platform-info {
    flex: 1;
    min-width: 0;
}

.platform-name {
    font-size: 14px;
    font-weight: 600;
    color: var(--ink);
}

.platform-desc {
    font-size: 11px;
    color: var(--ink-muted);
    margin-top: 2px;
}

.amount-input-wrapper {
    position: relative;
    flex-shrink: 0;
}

.amount-prefix {
    position: absolute;
    left: 14px;
    top: 50%;
    transform: translateY(-50%);
    font-family: 'JetBrains Mono', monospace;
    font-size: 15px;
    font-weight: 600;
    color: var(--ink-muted);
    pointer-events: none;
    z-index: 1;
}

.amount-input {
    width: 140px;
    padding: 10px 14px 10px 32px;
    font-family: 'JetBrains Mono', monospace;
    font-size: 17px;
    font-weight: 700;
    color: var(--ink);
    background: var(--paper);
    border: 1px solid var(--border);
    border-radius: 10px;
    text-align: right;
    height: auto;
}

.amount-input::placeholder {
    color: var(--ink-muted);
    font-weight: 400;
    font-size: 14px;
}

/* Delete button */
.platform-delete {
    flex-shrink: 0;
}

/* Add platform button */
.add-platform-btn {
    width: 100%;
    padding: 8px;
    border: 1.5px dashed rgba(26, 26, 26, 0.12);
    border-radius: 14px;
    background: transparent;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    font-family: 'DM Sans', sans-serif;
    font-size: 13px;
    font-weight: 600;
    color: var(--ink-muted);
    margin-top: 12px;
}

.add-platform-btn:active {
    border-color: rgba(196, 93, 62, 0.3);
    color: var(--accent);
}

.add-platform-btn svg {
    width: 18px;
    height: 18px;
    fill: none;
    stroke: currentColor;
    stroke-width: 2;
    stroke-linecap: round;
}

/* ===== TOTAL PREVIEW ===== */
.total-preview {
    background: var(--paper-card);
    border: 1px solid var(--border);
    border-radius: 14px;
    padding: 24px;
    display: flex;
    justify-content: space-between;
    align-items: center;
}

.total-label {
    font-size: 10px;
    font-weight: 600;
    letter-spacing: 3px;
    text-transform: uppercase;
    color: var(--ink-muted);
    margin-bottom: 4px;
}

.total-amount {
    font-family: 'Playfair Display', serif;
    font-size: 36px;
    font-weight: 900;
    letter-spacing: -1.5px;
    color: var(--ink);
}

.total-amount .currency {
    font-size: 16px;
    font-weight: 400;
    color: var(--ink-muted);
    margin-left: 4px;
}

.total-change {
    display: flex;
    flex-direction: column;
    align-items: flex-end;
}

.change-badge {
    display: inline-flex;
    align-items: center;
    gap: 5px;
    font-family: 'JetBrains Mono', monospace;
    font-size: 14px;
    font-weight: 700;
    padding: 6px 14px;
    border-radius: 8px;
}

.change-badge.up {
    color: var(--up);
    background: var(--up-bg);
}

.change-badge.down {
    color: var(--down);
    background: var(--down-bg);
}

.change-badge.neutral {
    color: var(--ink-muted);
    background: var(--paper);
}

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
    margin-top: 4px;
}

/* ===== SCREENSHOTS ===== */
.upload-grid {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 8px;
}

.upload-trigger {
    aspect-ratio: 1;
    border: 1.5px dashed rgba(26, 26, 26, 0.12);
    border-radius: 10px;
    background: var(--paper-card);
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 4px;
}

.upload-trigger svg {
    width: 20px;
    height: 20px;
    stroke: var(--ink-muted);
    fill: none;
    stroke-width: 1.5;
    stroke-linecap: round;
    stroke-linejoin: round;
}

.upload-trigger text {
    font-size: 9px;
    font-weight: 600;
    letter-spacing: 1px;
    text-transform: uppercase;
    color: var(--ink-muted);
}

.upload-thumb {
    aspect-ratio: 1;
    border-radius: 10px;
    overflow: hidden;
    position: relative;
    border: 1px solid var(--border);
}

.upload-thumb image {
    width: 100%;
    height: 100%;
}

.thumb-delete {
    position: absolute;
    top: 4px;
    right: 4px;
    width: 20px;
    height: 20px;
    border-radius: 50%;
    background: rgba(0, 0, 0, 0.5);
    display: flex;
    align-items: center;
    justify-content: center;
}

/* ===== NOTE ===== */
.note-input {
    width: 100%;
    padding: 16px 20px;
    font-family: 'DM Sans', 'Noto Serif SC', sans-serif;
    font-size: 14px;
    line-height: 1.7;
    color: var(--ink);
    background: var(--paper-card);
    border: 1px solid var(--border);
    border-radius: 14px;
    min-height: 80px;
}

.note-input::placeholder {
    color: var(--ink-muted);
}

.note-hint {
    font-size: 11px;
    color: var(--ink-muted);
    margin-top: 8px;
    font-weight: 500;
}

/* ===== SUBMIT FOOTER ===== */
.submit-footer {
    position: fixed;
    bottom: 0;
    left: 0;
    right: 0;
    z-index: 50;
    background: rgba(245, 242, 237, 0.9);
    backdrop-filter: blur(20px);
    -webkit-backdrop-filter: blur(20px);
    border-top: 1px solid var(--border);
    padding: 16px 24px;
}

.submit-inner {
    max-width: 640px;
    margin: 0 auto;
    display: flex;
    gap: 12px;
}

.btn-cancel {
    flex: 1;
    border: 1px solid var(--border);
    border-radius: 12px;
    background: transparent;
    font-family: 'DM Sans', sans-serif;
    font-size: 15px;
    font-weight: 600;
    color: var(--ink-light);
    height: 50px;
    line-height: 50px;
}

.btn-submit {
    flex: 2;
    border: none;
    border-radius: 12px;
    background: var(--ink);
    font-family: 'DM Sans', sans-serif;
    font-size: 15px;
    font-weight: 700;
    color: var(--paper);
    box-shadow: 0 4px 20px rgba(26, 26, 26, 0.15);
    height: 50px;
    line-height: 50px;
}

.btn-submit:active {
    transform: scale(0.98);
}

/* ===== RESPONSIVE ===== */
@media (max-width: 480px) {
    .page-title {
        font-size: 32px;
    }

    .total-amount {
        font-size: 28px;
    }

    .amount-input {
        width: 110px;
        font-size: 15px;
    }

    .upload-grid {
        grid-template-columns: repeat(4, 1fr);
    }

    .date-display {
        font-size: 20px;
        gap: 8px;
        padding: 14px 16px;
    }

    .date-display svg {
        width: 18px;
        height: 18px;
        flex-shrink: 0;
    }

    .date-weekday {
        font-size: 10px;
    }
}

/* ===== PLATFORM PICKER MODAL ===== */
.picker-overlay {
    position: fixed;
    inset: 0;
    z-index: 200;
    background: rgba(26, 26, 26, 0.3);
    backdrop-filter: blur(4px);
    -webkit-backdrop-filter: blur(4px);
    opacity: 0;
    visibility: hidden;
    transition: opacity 0.25s, visibility 0.25s;
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
    background: var(--paper-card);
    border-radius: 20px 20px 0 0;
    padding: 12px 24px 32px;
    max-height: 70vh;
    overflow-y: auto;
    transform: translateY(100%);
    transition: transform 0.3s cubic-bezier(0.32, 0.72, 0, 1);
}

.picker-sheet.open {
    transform: translateY(0);
}

.picker-handle {
    width: 36px;
    height: 4px;
    border-radius: 2px;
    background: var(--ink-muted);
    opacity: 0.3;
    margin: 0 auto 20px;
}

.picker-title {
    font-family: 'Playfair Display', serif;
    font-size: 20px;
    font-weight: 700;
    margin-bottom: 6px;
    color: var(--ink);
}

.picker-subtitle {
    font-size: 12px;
    color: var(--ink-muted);
    margin-bottom: 20px;
}

.picker-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 10px;
    margin-bottom: 16px;
}

.picker-option {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 8px;
    padding: 16px 8px;
    border: 1.5px solid var(--border);
    border-radius: 14px;
    background: var(--paper);
    transition: border-color 0.2s, background 0.2s, transform 0.15s;
}

.picker-option:active {
    transform: scale(0.96);
}

.picker-option.selected {
    border-color: var(--accent);
    background: rgba(196, 93, 62, 0.04);
}

.picker-option .icon {
    width: 40px;
    height: 40px;
    border-radius: 10px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: 700;
    font-size: 14px;
    color: white;
    flex-shrink: 0;
}

.picker-option .label {
    font-size: 12px;
    font-weight: 600;
    color: var(--ink);
    text-align: center;
    line-height: 1.3;
}

.picker-custom-row {
    display: flex;
    gap: 10px;
    margin-top: 4px;
}

.picker-custom-input {
    flex: 1;
    padding: 12px 16px;
    font-family: 'DM Sans', 'Noto Serif SC', sans-serif;
    font-size: 14px;
    color: var(--ink);
    background: var(--paper);
    border: 1.5px solid var(--border);
    border-radius: 12px;
    height: auto;
}

.picker-custom-input::placeholder {
    color: var(--ink-muted);
}

.picker-custom-btn {
    padding: 5px 20px;
    border: none;
    border-radius: 12px;
    background: var(--ink);
    color: var(--paper);
    font-family: 'DM Sans', sans-serif;
    font-size: 13px;
    font-weight: 700;
    white-space: nowrap;
}

.picker-custom-btn:active {
    opacity: 0.8;
}

.picker-cancel {
    width: 100%;
    padding: 5px 14px;
    margin-top: 12px;
    border: 1px solid var(--border);
    border-radius: 12px;
    background: transparent;
    font-family: 'DM Sans', sans-serif;
    font-size: 14px;
    font-weight: 600;
    color: var(--ink-light);
}

/* ===== ANIMATIONS ===== */
.section {
    opacity: 0;
    transform: translateY(16px);
    animation: fadeUp 0.5s ease-out forwards;
}

.section:nth-child(2) {
    animation-delay: 0.08s;
}

.section:nth-child(3) {
    animation-delay: 0.16s;
}

.section:nth-child(4) {
    animation-delay: 0.24s;
}

.section:nth-child(5) {
    animation-delay: 0.32s;
}

.section:nth-child(6) {
    animation-delay: 0.40s;
}

@keyframes fadeUp {
    to {
        opacity: 1;
        transform: translateY(0);
    }
}
</style>
