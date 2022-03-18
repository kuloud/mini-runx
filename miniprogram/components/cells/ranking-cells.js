// components/ranking-cell.js
Component({
  /**
   * 组件的属性列表
   */
  properties: {
    rankList: {
      type: Array,
      value: ''
    },
    rankType: {
      type: String,
      value: ''
    }
  },

  /**
   * 组件的初始数据
   */
  data: {
  },

  /**
   * 组件的方法列表
   */
  methods: {
    thumbsUp(e) {
      var member = e.currentTarget.dataset.member;
      var index = this.properties.rankList.findIndex(item => item.id === member.id)

      var animation = wx.createAnimation({
        timingFunction: 'ease-in-out'
      })
      animation.scale(1.3, 1.3).step()
      animation.scale(1, 1).step()
      var thumbsUpAnim = "rankList["+index+"].thumbsUpAnim"
      this.setData({
        [thumbsUpAnim]: animation.export()
      })
      
      console.log('member: ' + member.name + ', rankType: ' + this.properties.rankType)
      wx.cloud.callFunction({
        name: 'thumbsup',
        data: {
          rankType: this.properties.rankType,
          thumbsUpUid: member.id,
        },
        success: res => {
          console.log('result:' + res.result)
          if (res.result.code) {
            wx.showToast({
              icon: 'none',
              title: res.result.msg,
            })
          } else {
            // var index = this.properties.rankList.findIndex(item => item.id === member.id)
            member.thumbsUp = member.thumbsUp + 1
            member.thumbsByMe = true
            this.setData({
              ["rankList["+index+"]"] : member,
            })
          }
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

  }
})