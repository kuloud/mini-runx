//app.js
App({
  onLaunch: function () {
    if (!wx.cloud) {
      console.error('请使用 2.2.3 或以上的基础库以使用云能力')
    } else {
      wx.cloud.init({
        // env 参数说明：
        //   env 参数决定接下来小程序发起的云开发调用（wx.cloud.xxx）会默认请求到哪个云环境的资源
        //   此处请填入环境 ID, 环境 ID 可打开云控制台查看
        //   如不填则使用默认环境（第一个创建的环境）
        // env: 'my-env-id',
        traceUser: true,
      })

      wx.getSystemInfo({
        success: (res) => {
          const that = this;
          // 获取系统信息
          const systemInfo = wx.getSystemInfoSync();
          // 胶囊按钮位置信息
          const menuButtonInfo = wx.getMenuButtonBoundingClientRect();
          // 导航栏高度 = 状态栏到胶囊的间距（胶囊距上距离-状态栏高度） * 2 + 胶囊高度 + 状态栏高度
          that.globalData.navBarHeight = (menuButtonInfo.top - systemInfo.statusBarHeight) * 2 + menuButtonInfo.height + systemInfo.statusBarHeight;
          that.globalData.statusBarHeight = res.statusBarHeight
          console.log('navBarHeight: ' + that.globalData.navBarHeight)
          console.log('statusBarHeight: ' + that.globalData.statusBarHeight)
        }
      })

    }

  },

  globalData: {
    share: false, // 分享默认为false
    statusBarHeight: 0,
    navBarHeight: 0,
  }
})