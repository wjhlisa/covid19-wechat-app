import * as echarts from '../../ec-canvas/echarts';
//app.js
var api = require('../../libs/api');

const STATE_CODE_SELECTED = 'StateCodeSelected';
const RED_COLOR = '#FF0000';
const BLUE_COLOR = '#0000FF';
const GREY_COLOR = '#888888';

//获取应用实例
var app = getApp()
Page({
  data: {
    currentStateName: '',
    statesToChoose: [],
    stateData: {},
    isShowingStateList: false,
    isShowingDialog: false,
    latestColor: '',

    ec: {
      //因为有时候数据下载先完成，chart自动化初始化后完成，造成首次打开页面没有图标，所以这里采用懒加载
      //将 lazyLoad 设为 true 后，需要手动初始化图表
      lazyLoad: true
    },
  },


  /**
   * 页面加载时触发。一个页面只会调用一次，可以在 onLoad 的参数中获取打开当前页面路径中的参数
   */
  onLoad: function () {
    this.setData({
      statesToChoose: app.globalData.statesToChoose
    });

    //获取用户上次选定的州
    var stateCodeSelected = wx.getStorageSync(STATE_CODE_SELECTED) || '';
    if (stateCodeSelected == '') { //This is the first time to run
      stateCodeSelected = this.data.statesToChoose[0].code;
      wx.setStorageSync(STATE_CODE_SELECTED, stateCodeSelected);
    }

    //设置当前州
    this.setData({
      currentStateName: api.getStateByCode(this.data.statesToChoose, stateCodeSelected).name
    });

    //下载选定州数据
    var that = this;
    api.loadData(stateCodeSelected, function (data) {
      //今天是否增加了
      var latestColor;
      if (data[0].num > data[1].num) {
        latestColor = RED_COLOR;
      } else {
        latestColor = BLUE_COLOR;
      }

      //Render page
      that.setData({
        stateData: data,
        latestColor: latestColor,
      });

      that.drawChart();
    });
  },


  /**
   * 页面显示/切入前台时触发
   */
  onShow() {
    wx.setNavigationBarTitle({
      title: app.globalData.miniProgramName
    });
  },

  
  /**
   * 页面初次渲染完成时触发。一个页面只会调用一次，代表页面已经准备妥当，可以和视图层进行交互。
   */
  onReady: function () {
    // 获取组件
    this.ecComponent = this.selectComponent('#canvas');
  },

  
/**
 * 画图来自微信ECharts开源代码
 * https://github.com/ecomfe/echarts-for-weixin
 * https://echarts.apache.org/en/option.html#title
 */
drawChart: function() {
  this.ecComponent.init((canvas, width, height, dpr) => {
    // 获取组件的 canvas、width、height 后的回调函数
    // 在这里初始化图表
    const chart = echarts.init(canvas, null, {
      width: width,
      height: height,
      devicePixelRatio: dpr
    });

    //生产value数组
    let xArray = [];
    let numArray = [];
    for (var i = this.data.stateData.length - 1; i > 0; i--) {
      xArray.push({
        value: this.data.stateData[i].num,
        itemStyle: {
          color: GREY_COLOR
        }
      })
      numArray.push(this.data.stateData[i].num);
    }
    //最新日期的颜色
    xArray.push({
      value: this.data.stateData[0].num,
      itemStyle: {
        color: this.data.latestColor
      }
    });
    numArray.push(this.data.stateData[0].num);
  
    //chart option
    var option = {
      title: {
        // text: '最近30天每日新增',
        // left: 'center',
        show: false,
      },
  
      grid: {
        left: 20,
        right: 20,
        bottom: 15,
        top: 40,
        containLabel: true
      },
  
      xAxis: [{
        type: 'category',
        axisTick: {
          show: false
        },
        axisLine: {
          lineStyle: {
            color: '#999'
          }
        },
      }],
  
      yAxis: [{
        type: 'value',
        minInterval: 1,
        axisLine: {
          lineStyle: {
            color: '#999'
          }
        },
        axisLabel: {
          color: '#666'
        }
      }],
  
      series: [{
        name: 'case',
        type: 'bar',
        data: xArray
      }]
    }
  
    //若每日新增的最大数目 < 10，Y轴最大值为10
    if (Math.max.apply(Math, numArray) <= 10) {
      option.yAxis[0].max = 10;
    } else {
      option.yAxis[0].max = null;
    }
  
    //绘制
    chart.setOption(option);

    // 注意这里一定要返回 chart 实例，否则会影响事件处理等
    return chart;
  });
},


  /**
   * 显示州列表
   */
  onChangeState: function (e) {
    this.setData({
      isShowingStateList: !this.data.isShowingStateList
    })
  },


  /**
   * 显示数据来源对话框
   */
  onShowDialog: function (e) {
    this.setData({
      isShowingDialog: !this.data.isShowingDialog
    })
  },

  
  /*
   *关闭数据来源对话框
   */
  onCloseDialog: function() {
    this.setData({
      isShowingDialog: false
    });
  },


  /**
   * 切换到新选定的州
   */
  onSelectState: function (e) {
    var stateCode = this.data.statesToChoose[e.currentTarget.dataset.index].code;
    wx.setStorageSync(STATE_CODE_SELECTED, stateCode);

    //设置当前州
    this.setData({
      currentStateName: api.getStateByCode(this.data.statesToChoose, stateCode).name
    });

    //由于疫情紧急，每次都下载最新数据
    var that = this;
    api.loadData(stateCode, function (data) {
      //今天是否增加了
      var latestColor;
      if (data[0].num > data[1].num) {
        latestColor = RED_COLOR;
      } else {
        latestColor = BLUE_COLOR;
      }

      that.setData({
        stateData: data,
        latestColor: latestColor,
        isShowingStateList: !that.data.isShowingStateList
      });

      that.drawChart();
    });
  },


  /**
   * 点击遮罩，隐藏选项或对话框
   */
  onTapMask: function () {
    this.setData({
      isShowingStateList: false,
      isShowingDialog: false
    })
  },

  
  /**
   * 用户点击右上角分享
   */
  onShareAppMessage: function () {
    return {
      title: app.globalData.miniProgramName,
      path: '/pages/index/index'
    }
  }
})