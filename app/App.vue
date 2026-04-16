<script>
	export default {
		onLaunch: function() {
			console.log('App Launch')
		},
		onShow: function() {
			console.log('App Show')
		},
		onHide: function() {
			console.log('App Hide')
		}
	}
</script>

<style>
	page {
		background-color: #0a0a0f;
		color: #f5f5f7;
		font-family: -apple-system, 'Noto Sans SC', sans-serif;
		min-height: 100%;
	}

	::-webkit-scrollbar {
		width: 0;
		height: 0;
		background-color: transparent;
	}
</style>
