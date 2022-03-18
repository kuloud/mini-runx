// 云函数入口文件
const cloud = require('wx-server-sdk')
const rp = require('request-promise')

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})
const db = cloud.database({
  throwOnNotFound: false
})

// 云函数入口函数
exports.main = async (event, context) => {
  let triggerName = event.TriggerName
  console.log(triggerName)

  let rankType = matchRankType(triggerName)
  if (rankType === '') {
    return {}
  }

  // 数据库读取人员名单
  const roster = (await db.collection('roster_xx').get()).data
  const memberResp = await spiderCoodonData(rankType)
  if (memberResp) {
    var members = memberResp.map(r => {
      var m = roster.find(member => (member.id === r.id))
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

    db.collection('rank_data_type_' + rankType).add({
      // data 字段表示需新增的 JSON 数据
      data: {
        timestamp: new Date(),
        rank_data: members,
      }
    }).then(res => {
      console.log("add cache id: " + res._id)
    })

  }

  return {}
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

function matchRankType(triggerName) {
  var rankType = ''
  switch (triggerName) {
    case 'dailyPullTrigger':
      rankType = 'day'
      break
    case 'weeklyPullTrigger':
      rankType = 'week'
      break

    default:
      break
  }
  return rankType
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