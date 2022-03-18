// miniprogram/pages/ranking/ranking.js
var app = getApp();
console.log(app.globalData);

Page({

  data: {
    tabs: [],
    activeTab: 0,
    navBarHeight: getApp().globalData.navBarHeight,
  },

  onLoad: function (options) {
    // this.getTabBar().setData({
    //   active: 0,
    // })
    
    const tabs = [{
      title: '日',
      rankType: 'day',
      rankList: []
    }, {
      title: '周',
      rankType: 'week',
      rankList: []
    }, {
      title: '月',
      rankType: 'month',
      rankList: []
    }, {
      title: '总',
      rankType: 'total',
      rankList: []
    }]
    console.log('xxx:' + app.globalData.navBarHeight)
    this.setData({
      tabs,

      activeTab: 1,
      navBarHeight: app.globalData.navBarHeight,
    })
    
    this.loadRankingData(1)
  },

  /**
   * 用户点击右上角分享
   */
  onShareAppMessage: function () {
    return {
      title: '跑步排行榜',
      path: 'pages/ranking/ranking',
    }
  },

  onShareTimeline(res) {
    console.log(res)
    return {
      title: '看! 城运服跑步天团打榜啦。',
      path: 'pages/ranking/ranking',
      imageUrl: 'https://cdn.jsdelivr.net/gh/kuloud/fly-img@main/img/20210717161019.png'
    }
  },

  onTabClick(e) {
    const index = e.detail.index
    this.setData({
      activeTab: index
    })
  },

  onChange(e) {
    const index = e.detail.index
    this.setData({
      activeTab: index
    })
    this.loadRankingData(index)
  },

  loadRankingData(index) {
    wx.cloud.callFunction({
      name: 'ranking',
      data: {
        rankType: this.data.tabs[index].rankType,
      },
      success: res => {
        console.log('members:' + res.result.members)
        this.setData({
          ['tabs[' + index + '].rankList']: res.result.members
        })

      },
      fail: err => {
        wx.showToast({
          icon: 'none',
          title: '服务异常',
        })
        console.error('[云函数] [ranking] 调用失败：', err)
      }
    })
  },

})