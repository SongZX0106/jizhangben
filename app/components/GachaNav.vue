<template>
  <view class="bottom-nav">
    <view
      :class="['nav-item', active === 'list' ? 'active' : '']"
      @click="active !== 'list' && goPage('/pages/gacha/list/index')"
    >
      <uni-icons type="bars" size="20" :color="active === 'list' ? '#c45d3e' : '#a0a0a0'" />
      <text class="nav-label">活动</text>
    </view>
    <view
      :class="['nav-item', active === 'history' ? 'active' : '']"
      @click="active !== 'history' && goPage('/pages/gacha/history/index')"
    >
      <uni-icons type="refresh-filled" size="20" :color="active === 'history' ? '#c45d3e' : '#a0a0a0'" />
      <text class="nav-label">历史</text>
    </view>
  </view>
</template>

<script setup>
defineProps({
  active: { type: String, default: "" },
});

function goPage(url) {
  uni.redirectTo({ url });
}
</script>

<style scoped>
.bottom-nav {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  z-index: 50;
  background: #fffdf9;
  border-top: 1px solid rgba(26, 26, 26, 0.08);
  display: flex;
  justify-content: space-around;
  align-items: center;
  padding: 8px 16px;
  padding-bottom: calc(8px + env(safe-area-inset-bottom));
}
.nav-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
  padding: 6px 24px;
  border-radius: 12px;
  transition: all 0.2s;
}
.nav-item.active {
  background-color: rgba(196, 93, 62, 0.08);
}
.nav-label {
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 1px;
  color: #a0a0a0;
}
.nav-item.active .nav-label {
  color: #c45d3e;
}
</style>
