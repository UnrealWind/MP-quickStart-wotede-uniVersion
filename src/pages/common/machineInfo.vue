<template>
  <tk-container :status="status">
    <div slot="header">
      <div @click="back" class="back" >
        <tk-icon :size="18" :name="'arrow-left'"></tk-icon>
      </div>
      水机信息
    </div>
    <div class="balance">
      <p>
        <span v-if="deviceInfo.balance">{{deviceInfo.balance}}</span>
        <span v-else>0</span>
        <span class="tiny">元</span>
      </p>
      <p class="font-14">本水机余额</p>
      <van-button @click="recharge" type="default" round >&nbsp;立即充值&nbsp;</van-button>
    </div>
    <div class="record">
      <span>
        <tk-icon :size="30" :name="'cashier-o'">cashier-o</tk-icon>
      </span>
      <div @click="goRecord('消费记录')" class="border-r">
        <p>{{consumptions}}</p>
        <p class="font-14">消费记录</p>
      </div>
      <div @click="goRecord('充值记录')">
        <p>{{orderList}}</p>
        <p class="font-14">充值记录</p>
      </div>
    </div>
    <div class="histogram">
      <p class="tip">暂无滤芯数据！</p>
      <!--<div v-for="(histogram,index) in histograms" :key="index" class="histogram-box">
        <div class="top">
          <p>{{histogram.present}}%</p>
        </div>
        <div class="middle">
          <div class="histogram-bg"></div>
          <div class="histogram-cover histogram-present" v-bind:style="{  height: histogram.present + '%' }"></div>
        </div>
        <div class="bottom">
          <p>{{histogram.label}}</p>
        </div>
      </div>-->
    </div>
    <div style="width: 100%;background-color:#fff;margin-top:10px;">
      <h3 style="font-size:15px;
      padding: 5px 10px;">运行状态</h3>
      <div class="status">
        <div class="flex">
          <div class="grid-3">
          <span class="status-relative">
            <p>{{deviceInfo.status.tds_raw}}</p>
          </span>
            <div class="circle bg-blue"></div>
            <p class="status-bottom">净水TDS</p>
          </div>
          <div class="grid-3">
          <span class="status-relative">
            <p>2</p>
          </span>
            <div class="circle bg-org"></div>
            <p class="status-bottom">漏水状态</p>
          </div>
          <div class="grid-3">
          <span class="status-relative">
            <p>{{deviceInfo.status.machine_tempreture}}</p>
            <p class="tiny-p">℃</p>
          </span>
            <div class="circle bg-yellow"></div>
            <p class="status-bottom">水机温度</p>
          </div>
          <div class="grid-3">
          <span class="status-relative">
            <p>{{deviceInfo.status.Water_pressure}}</p>
          </span>
            <div class="circle bg-green"></div>
            <p class="status-bottom">水压</p>
          </div>
        </div>
      </div>
    </div>
    <div class="btn-box bottom">
      <van-button @click="pay" type="primary" size="large">支付打水</van-button>
    </div>
    <van-toast id="van-toast" />
  </tk-container>
</template>

<script>
import Toast from '@/static/vant-weapp/dist/toast/toast'
export default {
  data () {
    return {
      status: 'loading',
      wrap: true,
      imgSrc: 'asd',
      histograms: [
        {
          label: 'PP棉',
          present: '23'
        },
        {
          label: '颗粒碳',
          present: '34'
        },
        {
          label: '烧结炭',
          present: '45'
        },
        {
          label: 'RO膜',
          present: '56'
        },
        {
          label: '口感碳',
          present: '67'
        }
      ],
      deviceInfo: {},
      consumptions: 0,
      orderList: 0
    }
  },
  components: {

  },
  methods: {
    async init () {
      this.deviceInfo = this.$store.state.deviceInfo
      try {
        await this.getDeviceInfo()
        await this.getOrder()
        await this.getConsumption()
      } catch (e) {
        throw e
      }
      this.status = 'success'
    },
    async getConsumption () {
      let res = await this.$tkParse.get(`/classes/consumption/`, {
        params: {
          count: 1,
          limit: 0
        }
      })
      this.consumptions = res.count
    },
    async getOrder () {
      let res = await this.$tkParse.get(`/classes/order/`, {
        params: {
          count: 1,
          limit: 0,
          where: {
            title: '水机充值'
          }
        }
      })
      this.orderList = res.count
    },
    async getDeviceInfo () {
      let device = await this.$tkParse.get('/classes/devices', {
        params: {
          where: {
            authInfo: this.deviceInfo.authInfo
          }
        }
      }).catch(() => {
        Toast.fail('无法获取设备信息，请重试')
      })
      if (device) {
        this.$store.commit('setDeviceInfo', device.results[0])
        this.deviceInfo = device.results[0]
      }

      // 之前是后台进行设备刷新的，这里也先这么处理吧,刷新水机数据实在是太慢了，非常影响用户体验
      if(!this.deviceInfo.status){
        // refreshDevice()
      }
    },
    async refreshDevice(){
      await this.$cloudAjax.post('/index/refreshStatus', {
        'deviceId': this.deviceInfo.deviceId,
        'authInfo': this.deviceInfo.authInfo,
        'objectId': this.deviceInfo.objectId
      }).catch((e) => {
        Toast.fail('设备刷新失败')
      })
    },
    back () {
      this.$route.back()
    },
    // 充值
    recharge () {
      let path = '/pages/common/recharge'
      let query = {
        type: '水机充值',
        preAmount: this.deviceInfo.balance
      }
      this.$route.push(path, query)
    },
    // 打水
    pay () {
      let path = '/pages/common/pay'
      let query = {
        test: 12
      }
      this.$route.push(path, query)
    },
    goRecord (msg) {
      let path = '/pages/common/payRecord'
      let query = {
        type: msg
      }
      this.$route.push(path, query)
    }
  },
  created () {

  },
  onShow () {
    // 调用应用实例的方法获取全局数据
    this.init()
  },
  onLoad () {

  }
}
</script>

<style lang=scss scoped>
  .tip {
    font-size:14px;
    padding: 10px 15px;
    color:#666;
  }
  .font-14 {
    font-size:14px !important;
  }
  .balance {
    height:120px;
    width:100%;
    text-align: center;
    background-color: rgba(58, 184, 253, 1);
    padding: 30px 0;
    p {
      margin:0 0 10px 0;
      color:#fff;
      font-weight: 500;
      font-size:24px;
    }
    .tiny {
      font-size:12px;
    }

  }
  .record {
    display: flex;
    flex-direction: row;
    height:80px;
    background: #fff;
    >span {
      display: inline-block;
      width:15%;
      height:100%;
      padding: 25px;
    }
    >div{
      width:40%;
      height:100%;
      padding: 20px;
      font-size:20px;
      .font-14 {
        color:#ccc;
      }
    }
    .border-r {
      p{
        border-right:1px solid #ccc;
      }
    }
  }
  .userIcon{
    width:100px;
    height:100px;
  }
  .myCard-icon {
    display: inline-block;
    width: 50px;
    height: 50px;
    margin:0 20px 0 0;
  }
  .cell-card {
    margin-top:10px;
  }
  .histogram {
    display: inline-block;
    /*height:236px;*/
    width:100%;
    background-color: #fff;
    margin-top:10px;
    >div{
      width:20%;
      height:100%;
      display: inline-block;
      text-align: center;
      .top,.bottom {
        font-size:10px;
        height:20px;
        padding: 5px;
      }
      .middle {
        position: relative;
        height:180px;
        .histogram-bg,.histogram-cover {
          width:10px;
          height:100%;
          background-color: #ccc;
          margin:0 auto;
        }
        .histogram-present {
          float:left;
          position: absolute;
          bottom:0;
          left:33px;
          background-color: rgba(0, 145, 255, 1);
        }
      }
    }
  }
  .status {
    margin:0 auto;
    width:375px;
    height:120px;
    background-color: #fff;
    h3 {
      font-size:15px;
      padding: 5px 10px;
    }
    .circle {
      height:67px;
      width:67px;
      -webkit-border-radius:50%;
      -moz-border-radius: 50%;
      border-radius: 50%;
      display: inline-block;
      margin:5px 15px;
    }
    .bg-blue{
      background-color: rgba(58, 184, 253, 1);
    }
    .bg-org{
      background-color: rgba(250, 118, 1, 1);
    }
    .bg-yellow{
      background-color: rgba(250, 193, 1, 1);
    }
    .bg-green{
      background-color: rgba(84, 218, 93, 1);
    }
    .grid-3 {
      position: relative;
      .status-relative {
        width:100%;
        position:absolute;
        top:20px;
        font-size:16px;
        color:#fff;
        text-align: center;
        .tiny-p {
          font-size:12px;
        }
      }
      .status-bottom {
        font-size: 14px;
        color: rgba(102, 102, 102, 1);
        text-align:center;
      }
    }
  }
  .btn-box {
    margin:10px 0 0 0 ;
    background-color: #fff;
    width: 95%;
    padding: 10px;
    van-icon {
      position: relative;
      top:3px;
      left:-3px;
    }
  }
  .flex {
    width:100%;
    .grid-3 {
      width:25%;
      display: inline-block;
    }
  }
  .btn-box.bottom {
    margin:10px 0 0 0 ;
    position: absolute;
    bottom: 0;
    width: 95%;
    padding: 10px;
    van-icon {
      position: relative;
      top:3px;
      left:-3px;
    }
  }
</style>
