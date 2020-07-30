module.exports = {
  loadData: loadData,
  getStateByCode: getStateByCode
}

const API_URL = 'https://demo.com/api/';

/**
 * 
 * @param {*} states 
 * @param {*} stateCode 
 */
function getStateByCode(states, stateCode) {
  for (let i in states) {
    if (states[i].code == stateCode) {
      return states[i];
    }
  }
}

/**
 * 
 * @param {*} stateCode 
 * @param {*} cb 
 */
function loadData(stateCode, cb) {
  wx.showLoading({
    title: '努力加载中...'
  });

  wx.request({
    url: API_URL + stateCode,

    data: {},

    success: function (res) {
      wx.hideLoading();

      if (res.data.length == 0) {
        //返回失败
        wx.showToast({
          title: '网络繁忙',
          duration: 2000
        });
        return;
      }

      //成功下载数据
      //最新日期上加入'今天'或'昨天'
      let todayString = new Date().Format("yyyy-MM-dd");
      let yesterday = new Date();
      yesterday.setTime(yesterday.getTime() - 24 * 60 * 60 * 1000);
      let yesterdayString = yesterday.Format("yyyy-MM-dd");
      if (res.data[0].date == todayString) {
        res.data[0].date = '今天 ' + res.data[0].date;
      } else if (res.data[0].date == yesterdayString) {
        res.data[0].date = '昨天 ' + res.data[0].date;
      }

      //返回成功
      typeof cb == "function" && cb(res.data);
    },

    fail: function (res) {
      wx.hideLoading();
      //返回失败
      wx.showToast({
        title: '网络繁忙',
        duration: 2000
      });
    }
  })
}

/**
 * 以下日期格式化代码来自https://www.jianshu.com/p/b01db627afc1
 * 对Date的扩展，将 Date 转化为指定格式的String
 * 月(M)、日(d)、小时(h)、分(m)、秒(s)、季度(q) 可以用 1-2 个占位符， 
 * 年(y)可以用 1-4 个占位符，毫秒(S)只能用 1 个占位符(是 1-3 位的数字) 
 * 例子： 
 * (new Date()).Format("yyyy-MM-dd hh:mm:ss.S") ==> 2006-07-02 08:09:04.423 
 * (new Date()).Format("yyyy-M-d h:m:s.S")      ==> 2006-7-2 8:9:4.18 
 */
Date.prototype.Format = function (fmt) { //author: meizz 
  var o = {
    "M+": this.getMonth() + 1, //月份 
    "d+": this.getDate(), //日 
    "h+": this.getHours(), //小时 
    "m+": this.getMinutes(), //分 
    "s+": this.getSeconds(), //秒 
    "q+": Math.floor((this.getMonth() + 3) / 3), //季度 
    "S": this.getMilliseconds() //毫秒 
  };
  if (/(y+)/.test(fmt)) fmt = fmt.replace(RegExp.$1, (this.getFullYear() + "").substr(4 - RegExp.$1.length));
  for (var k in o)
    if (new RegExp("(" + k + ")").test(fmt)) fmt = fmt.replace(RegExp.$1, (RegExp.$1.length == 1) ? (o[k]) : (("00" + o[k]).substr(("" + o[k]).length)));
  return fmt;
}