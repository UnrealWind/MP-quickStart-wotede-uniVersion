<template>
  <tk-container :status="status">
    <div slot="header">
      <div @click="back" class="back" >
        <tk-icon :size="18" :name="'arrow-left'"></tk-icon>
      </div>
      {{type}}
    </div>
    <div class="amounts">
      <h3>请选择充值金额</h3>
      <div class="amount-box">
        <div class="amount" @click="choseAmount(amount)" v-for="(amount,index) in amounts" :key="index">
          <div v-bind:class="{ active: amount.active }">
            <p>充{{amount.recharge}}元</p>
            <p class="gift">送{{amount.gift}}元</p>
          </div>
        </div>
      </div>
    </div>
    <div class="way">
      <h3>请选择支付方式</h3>
      <van-radio-group :value="payWay" >
        <van-cell-group>
          <van-cell
            title="微信支付"
            clickable
            data-name="1"
            @click="choseA"
          >
            <van-radio name="1" />
          </van-cell>
        </van-cell-group>
      </van-radio-group>
    </div>
    <div class="btn-box">
      <van-button @click="recharge" type="primary" size="large">立即充值</van-button>
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
      amounts: [],
      payWay: '1',
      selfAmount: null,
      cardId: '',
      type: null,
      amount: {},
      preAmount: null,
      deviceInfo: {},
      card: {}
    }
  },
  methods: {
    async init () {
      this.type = this.$root.$mp.query.type
      this.cardId = this.$root.$mp.query.cardId || 0
      this.$root.$mp.query.preAmount === 'undefined'?this.preAmount = 0:this.preAmount = this.$root.$mp.query.preAmount
      this.deviceInfo = this.$store.state.deviceInfo
      try {
        await this.getRecharge()
      } catch (e) {
        throw e
      }
      this.status = 'success'
    },
    async getRecharge () {
      let d = new Date();
      d.setHours(d.getHours(), d.getMinutes() - d.getTimezoneOffset());
      let res = await this.$tkParse.get('/classes/preferential', {
        params: {
          order: 'recharge',
          where :{
            'endDate': {
              $gte: {
                '__type': 'Date',
                'iso': d.toISOString()
              }
            }
          }
        }
      })
      let amounts = []
      res.results.forEach((n, i) => {
        if (this.type === '水机充值' && this.deviceInfo.deviceId && n.devices && n.devices.indexOf(this.deviceInfo.objectId) > -1 && !n.cardPay) {
          amounts.push(n)
        } else if (this.type === '水卡充值' && n.cardPay) {
          amounts.push(n)
        }
      })
      this.amounts = amounts
      this.amounts[0]['active'] = true
      this.amount = this.amounts[0]
    },
    choseAmount (amount) {
      this.amounts.forEach((n, i) => {
        n.active = false
      })
      amount.active = true
      this.amount = amount
    },
    back () {
      setTimeout(this.$route.back(), 1000)
    },
    getQueryString (url, name) {
      let reg = new RegExp('(^|&)' + name + '=([^&]*)(&|$)', 'i')
      if (!url.split('?')[1]) return null
      let r = url.split('?')[1].match(reg)
      if (r != null) return decodeURI(r[2]); return null
    },
    // 充值
    async recharge () {
      let that = this
      let cont = async ()=>{
        let amount = 0
        this.selfAmount ? amount = this.selfAmount : amount = Number(this.amount.recharge) + Number(this.amount.gift)
        let openId = this.$store.state.userInfo.openId
        let res = await this.$cloudAjax.get('/wechat/mpPay', {
          // mbd 微信这一会儿i一会儿I 真jr服气
          openid: openId,
          total_fee: Number(this.amount.recharge) * 100,
          mchId: this.$store.state.mchInfo.mchId
        })
        wx.requestPayment({
          timeStamp: res.data.timeStamp + '', // 时间戳
          nonceStr: res.data.nonceStr, // 随机字符串
          package: 'prepay_id=' + res.data.package, // repay_id
          signType: 'MD5', // 签名算法
          paySign: res.data.paySign, // 签名
          success (callback) {
            that.createOrder(amount, String(res.data.orderId), openId, true)
          },
          fail (err) {
            that.createOrder(amount, String(res.data.orderId), openId, false)
          }
        })
      }
      if(!this.$store.state.mchInfo.mchId){
        wx.scanCode({
          success: async (res) => {
            let device = await this.$tkParse.get('/classes/devices', {
              params: {
                where: {
                  authInfo: that.getQueryString(res.path, 'authInfo')
                }
              }
            })
            let userinfo = await this.$tkParse.get('/classes/config', {
              params: {
                where: {
                  user: device.results[0].user
                }
              }
            })
            that.$store.commit('setMchInfo', {
              mchId:userinfo.results[0].mchId,
              authInfo:that.getQueryString(res.path, 'authInfo')
            })
            cont()
          }
        })
      }else{
        cont()
      }
    },
    async rechargeDevice (amount, orderId) {
      let success = await this.$tkParse.put(`/classes/devices/${this.$store.state.deviceInfo.objectId}`, {
        'balance': amount + Number(this.preAmount)
      }).catch(e => {
        Toast.fail('充值失败！')
        this.back()
      })
      if (success) {
        Toast.success('充值成功！')
        this.back()
      }
    },
    async createOrder (amount, orderId, openId, payStatus) {
      let data = {
        'orderId': orderId,
        'openId': openId,
        'payStatus': payStatus,
        'type': 'wechatPay',
        'totalFee': amount,
        'actFee':Number(this.amount.recharge),
        'title': this.type
      }
      if (this.type === '水机充值') {
        data['device'] = this.$store.state.deviceInfo || {}
        data['type'] = 'machineCharge'
      } else {
        data['card'] = this.cardId || {}
        data['type'] = 'recharge'
      }
      data['orderAbout'] = JSON.parse(JSON.stringify(data))
      let res = await this.$tkParse.post('/classes/order', data).catch((e) => {
        throw e
      })
      if(payStatus) this.type === '水卡充值' ? this.rechargeCard(amount) : this.rechargeDevice(amount, res.objectId)
    },
    async rechargeCard (amount) {
      console.log(amount,this.preAmount)
      let success = await this.$tkParse.put(`/classes/cards/${this.cardId}`, {
        'amount': amount + Number(this.preAmount)
      }).catch(e => {
        Toast.fail('充值失败！')
        this.back()
      })
      if (success) {
        Toast.success('充值成功！')
        this.back()
      }
    },
    // 打水
    pay () {

    },
    choseA (event) {
      const { name } = event.currentTarget.dataset
      this.setData({
        payWay: name
      })
    }
  },
  created () {

  },
  mounted(){
    // 调用应用实例的方法获取全局数据
    this.init()
  },
  onShow () {

  },
  onLoad () {

  }
}
</script>

<style lang=scss>
  .main{
    background-color: #fff;
  }
  .font-14 {
    font-size:14px;
  }
  .amounts {
    padding: 0 15px;
    h3 {
      font-weight:500;
      font-size:16px;
    }
    .amount-box {
      .amount {
        display: inline-block;
        width:33%;
        text-align: center;
        >div{
          width:100px;
          height: 50px;
          border-radius: 10px;
          display: inline-block;
          margin:7px 0;
          font-size:16px;
          padding: 10px 0 0 0;
          background-color: rgba(242, 246, 247, 1);
          .gift {
            font-size:12px;
            color: rgba(0, 145, 255, 1);
          }
        }
        .active {
          background-color: rgba(0, 145, 255, 1) !important;
          color:#fff !important;
          .gift {
            color: #fff;
          }
        }
      }
    }
  }
  .way {
    margin:10px 0 0 0;
    h3 {
      font-weight:500;
      font-size:16px;
      padding: 0 15px 10px 15px;
    }
    .van-radio {
      float:right;
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
</style>
