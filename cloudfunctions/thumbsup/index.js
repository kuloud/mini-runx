// 云函数入口文件
const cloud = require('wx-server-sdk')
const moment = require('moment');

moment.locale('zh-cn', {
  week : {
      dow : 1 // Monday is the first day of the week
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
  let {
    rankType,
    thumbsUpUid,
  } = event
  let {
    OPENID,
    APPID,
  } = cloud.getWXContext()

  if (!rankType || !thumbsUpUid) {
    console.error('rankType: ' + rankType + ', thumbsUpUid' + thumbsUpUid + ', OPENID' + OPENID)
    return {
      event,
      openid: OPENID,
      code: 20001,
      msg: '唉哟，你发现了一个bug~'
    }
  }

  try {
    // 查询历史点赞
    const _ = db.command
    let res = await db.collection('rank_thumbs_up').where({
      date: _.gte(new Date(moment().utcOffset("+08:00").startOf(rankType))),
      thumbsUpUid: thumbsUpUid,
      uid: OPENID,
    }).get()
    let historythumbsUp = res.data[0]
    if (historythumbsUp) {
      // 在此区间内点赞过了，返回Toast提示
      return {
        event,
        openid: OPENID,
        code: 20001,
        msg: '别贪杯，点赞过了。'
      }
    } else {
      // 新增数据，返回正常
      return await db.collection('rank_thumbs_up').add({
        // data 字段表示需新增的 JSON 数据
        data: {
          date: new Date(),
          thumbsUpUid: thumbsUpUid,
          uid: OPENID,
        }
      })
    }

  } catch (e) {
    console.error(e)
  }

  return {
    event,
    openid: OPENID,
    code: 10001,
    msg: '唉哟，你发现了一个bug~'
  }
}