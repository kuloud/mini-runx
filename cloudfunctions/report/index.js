// 云函数入口文件
const cloud = require('wx-server-sdk')
const moment = require('moment')

moment.locale('zh-cn', {
  week: {
    dow: 1 // Monday is the first day of the week
  }
})

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})
const db = cloud.database({
  throwOnNotFound: false
})

// 云函数入口函数
exports.main = async (event, context) => {

  const _ = db.command
  const $ = _.aggregate
  // 活得人员点赞数据
  var mIds = members.map(member => member.id)
  var thumbsData = await db.collection('rank_thumbs_up').aggregate().match({
    thumbsUpUid: _.in(mIds),
  }).group({
    _id: '$thumbsUpUid',
    thumbsBy: $.addToSet('$uid'),
    thumbsNum: $.sum(1),
  }).end()
  thumbsData.list.map(t => {
    var m = members.find(member => (t._id === member.id))
    if (m) {
      m.thumbsUp = t.thumbsNum
      m.thumbsByMe = (t.thumbsBy.indexOf(OPENID) != -1)
    }
  })


  return {
    members
  }
}
