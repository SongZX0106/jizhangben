<script>
export default {
	onLaunch: function () {
		try {
			var canvas = document.createElement('canvas');
			canvas.width = 256;
			canvas.height = 256;
			var ctx = canvas.getContext('2d');
			var imageData = ctx.createImageData(256, 256);
			var data = imageData.data;
			for (var i = 0; i < data.length; i += 4) {
				var v = Math.floor(Math.random() * 256);
				data[i] = v;
				data[i + 1] = v;
				data[i + 2] = v;
				data[i + 3] = 40;
			}
			ctx.putImageData(imageData, 0, 0);
			var url = canvas.toDataURL('image/png');
			var style = document.createElement('style');
			style.textContent =
				'.grain-overlay{' +
				'position:fixed;top:0;left:0;right:0;bottom:0;' +
				'pointer-events:none;z-index:9999;' +
				'opacity:0.35;' +
				'background-image:url(' + url + ');' +
				'background-repeat:repeat;' +
				'background-size:256px 256px;' +
				'}';
			document.head.appendChild(style);
			var el = document.createElement('div');
			el.className = 'grain-overlay';
			document.body.appendChild(el);
		} catch (e) {}
	},
	onShow: function () {
		console.log('App Show')
	},
	onHide: function () {
		console.log('App Hide')
	}
}
</script>

<style>
@import url("./static/css2.css");
</style>