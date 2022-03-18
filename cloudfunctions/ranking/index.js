// 云函数入口文件
const cloud = require('wx-server-sdk')
const rp = require('request-promise')
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
var dbCache = {
  timestamp: new Date().timestamp,
  data: null,
}

// 云函数入口函数
exports.main = async (event, context) => {

  let {
    rankType
  } = event
  let {
    OPENID
  } = cloud.getWXContext()

  console.log('rankType: ' + rankType)

  if (!rankType) {
    // 默认周视图
    rankType = 'week'
  }

  // 数据库读取人员名单
  await syncMemberList()

  const memberResp = await spiderCoodonData(rankType)
  if (memberResp) {
    // 有member返回，正常处理
    if ('week' === rankType) {
      members = handleWeekMemberData(memberResp)
    } else {
      members = memberResp.map(r => {
        var m = dbCache.data.find(member => (member.id === r.id))
        return {
          id: r.id,
          index: r.index,
          nick: r.nick,
          name: (m && m.name ? m.name : r.nick),
          gender: (m && m.gender ? m.gender : 0),
          portrait: r.portrait,
          totalLength: r.total_length,
        }
      })
    }

    if ('total' != rankType) {
      // 批量查询各个人的点赞情况
      let startTime = new Date(moment().utcOffset("+08:00").startOf(rankType))
      const _ = db.command
      const $ = _.aggregate
      // 活得人员点赞数据
      var mIds = members.map(member => member.id)
      var thumbsData = await db.collection('rank_thumbs_up').aggregate().match({
        date: _.gte(startTime),
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
    }

  }

  return {
    members
  }
}

function handleWeekMemberData(memberResp) {
  var index = memberResp.length + 1
  return dbCache.data.map(member => {
    var result = {
      id: member.id,
      index: member.index,
      nick: member.nick,
      name: (member.name ? member.name : member.nick),
      gender: member.gender,
      portrait: member.portrait,
    }
    var m = memberResp.find(r => (r.id === member.id))
    if (m && m.id) {
      result.index = m.index
      result.totalLength = m.total_length
    } else {
      result.index = index++
      result.totalLength = 0
    }

    return result
  }).sort(function (x, y) {
    return x.index - y.index
  })
}

function matchSortType(rankType) {
  var sortType = 0
  switch (rankType) {
    case 'day':
      sortType = 4
      break
    case 'week':
      sortType = 0
      break
    case 'month':
      sortType = 1
      break
    case 'total':
      sortType = 2
      break

    default:
      break
  }
  return sortType
}

async function spiderCoodonData(rankType) {
  var sortType = matchSortType(rankType)
  const options = {
    method: 'GET',
    uri: 'https://mini.codoon.com/mini_sport/group_sports/get_group_sports_member_sort_v2',
    qs: {
      group_id: {GROUP_ID},
      order_type: 'asc',
      sort_type: sortType,
      page: 1,
      limit: 60,
    },
    headers: {
      'Host': 'mini.codoon.com',
      'Cookie': 'sessionid={sessionid}; Path=/; Domain=codoon.com; Max-Age=2592000',
      'accept': '*/*',
      'content-type': 'application/json',
      'custom-agent': 'miniprogram',
      'user-agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 11_3 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E217 MicroMessenger/6.8.0(0x16080000) NetType/WIFI Language/en Branch/Br_trunk MiniProgramEnv/Mac',
      'referer': '{referer_URL}',
      'accept-language': 'zh-cn',
      'Accept-Encoding': 'compress, gzip',
    },
    gzip: true,
  }

  const response = JSON.parse(await rp(options))
  return response.data.members
}

async function syncMemberList() {
  const now = new Date()
  if (now.timestamp - dbCache.timestamp > 24 * 60 * 60 * 1000) {
    const roster = (await db.collection('roster_xx').get()).data
    dbCache.data = roster
    dbCache.timestamp = now.timestamp
    console.log('[Database][roster_xx] cache updated at: ' + now)
  }

  if (!dbCache.data) {
    console.log('[Database][roster_xx] cache init at: ' + now)
    const roster = (await db.collection('roster_xx').get()).data
    dbCache.data = roster
  }
}