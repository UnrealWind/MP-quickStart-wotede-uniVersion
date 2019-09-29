<template>
  <tk-container :status="status">
    <div slot="header">
      <div @click="back" class="back" >
        <tk-icon :size="18" :name="'arrow-left'"></tk-icon>
      </div>
      支付打水
    </div>
    <div class="amounts">
      <h3>请选择打水金额</h3>
      <div class="amount-box">
        <div @click="choseAmount(amount)" class="amount" v-for="(amount,index) in amounts" :key="index">
          <div v-bind:class="{ active: amount.active }">
            <p>{{amount.label}}元</p>
          </div>
        </div>
      </div>
      <!--<van-cell-group>
        <van-field
          placeholder="自定义打水金额（最多不超过10元）"
          left-icon="gold-coin-o"
          :value="selfAmount"
        />
      </van-cell-group>-->
    </div>
    <div class="way">
      <h3>请选择支付方式</h3>
      <van-radio-group :value="payWay" >
        <van-cell-group>
          <van-cell
            title="微信支付"
            clickable
            data-name="wx"
            @click="chose('wx')"
          >
            <van-radio name="wx" />
          </van-cell>
          <van-cell
            v-for="(card,index) in cardList" :key="index"
            clickable
            :data-name="card.cardId"
            @click="chose(card)"
          >
            <van-radio :name="card.cardId" />
            <view slot="title" style="width:150%">
              <view class="van-cell-text">卡号：{{card.cardId}}
                <van-tag class="margin-left" type="danger" v-if="card.amount">¥：{{card.amount}}</van-tag>
                <van-tag class="margin-left" type="danger" v-else>¥：0</van-tag>
              </view>
            </view>
          </van-cell>
        </van-cell-group>
      </van-radio-group>
    </div>
    <div class="btn-box">
      <van-button v-if="payWay === 'wx'" type="info" @click="pay" size="large">立即支付</van-button>
      <van-button v-else @click="cardPay" type="info" size="large">立即支付</van-button>
    </div>
    <van-toast id="van-toast" />
  </tk-container>
</template>

<script>
import config from '../../config'
import Toast from '@/static/vant-weapp/dist/toast/toast'
export default {
  data () {
    return {
      status: 'loading',
      wrap: true,
      amounts: [
        {
          label: '0.01',
          active: true
        },
        {
          label: '0.5',
          active: false
        },
        {
          label: '1',
          active: false
        },
        {
          label: '2',
          active: false
        },
        {
          label: '5',
          active: false
        },
        {
          label: '10',
          active: false
        }
      ],
      payWay: 'wx',
      selfAmount: '',
      cardList: [],
      deviceInfo: {},
      amount: null,
      targetCard: {}
    }
  },
  components: {

  },
  methods: {
    async init () {
      this.deviceInfo = this.$store.state.deviceInfo
      this.judgeAmount()
      try {
        this.getCardInfo()
      } catch (e) {

      }
      this.status = 'success'
    },
    judgeAmount(){
      this.targetCard = {}
      this.payWay = 'wx'
      if(!this.amounts[0].active) return
      this.amounts.forEach((n,i)=>{
        if(n.active) this.amount = n
      })
    },
    async getCardInfo () {
      let objectId = this.$store.state.userInfo.objectId
      let res = await this.$tkParse.get('/classes/cards', {
        params: {
          where: {
            customer: objectId
          }
        }
      })
      this.status = 'success'
      this.cardList = res.results
    },
    choseAmount (amount) {
      this.amounts.forEach((n, i) => {
        n.active = false
      })
      amount.active = true
      this.amount = amount
    },
    back () {
      this.$route.back()
    },
    // 打水
    async pay () {
      let that = this
      let amount = Number(this.amount.label)
      let openId = this.$store.state.userInfo.openId

      this.createOrder(amount, '', openId, false)

      let res = await this.$cloudAjax.get('/wechat/mpPay', {
        // mbd 微信这一会儿i一会儿I 真jr服气
        openid: openId,
        total_fee: amount * 100,
        mchId: this.$store.state.mchInfo.mchId,
        type:'payWater',
        wechatId: config.wechatId,
        wechatSecret: config.wechatSecret
      })
      wx.requestPayment({
        timeStamp: res.data.timeStamp + '', // 时间戳
        nonceStr: res.data.nonceStr, // 随机字符串
        package: 'prepay_id=' + res.data.package, // repay_id
        signType: 'MD5', // 签名算法
        paySign: res.data.paySign, // 签名
        success (callback) {
          //that.createOrder(amount, String(res.data.orderId), openId, true)
          let path = '/pages/common/paySuccess'
          let query = {
            amount: amount
          }
          that.$route.push(path, query)
        },
        fail (err) {
          //that.createOrder(amount, String(res.data.orderId), openId, false)
        }
      })
    },
    async createOrder (amount, orderId, openId, payStatus) {
      let data = {
        'orderId': orderId,
        'openId': openId,
        'payStatus': payStatus,
        'type': 'wechatPay',
        'totalFee': amount,
        'title': '微信支付',
        'device': this.deviceInfo
      }

      if (this.payWay !== 'wx') data.type = 'card'
      data['orderAbout'] = JSON.parse(JSON.stringify(data))
      let res = await this.$tkParse.post('/classes/order', data).catch((e) => {
        throw e
      })

      let record = {
        fee: amount,
        sync: true,
        order: {
          className: 'order',
          objectId: res.objectId,
          __type: 'Pointer'
        },
        type: 'wechatPay',
        card: null,
        device: {
          className: 'devices',
          objectId: this.deviceInfo.objectId,
          __type: 'Pointer'
        }
      }
      if (this.payWay !== 'wx') {
        data.type = 'card'
        record.card = {
          className: 'cards',
          objectId: this.targetCard.objectId,
          __type: 'Pointer'
        }
      }

      await this.$tkParse.post('/classes/consumption', record).catch((e) => {
        throw e
      })
      if(payStatus) this.PayWater(amount, res.objectId, 'scanCode')
    },
    async PayWater (amount, orderId, payWay) {
      let res = await this.$cloudAjax.post(`/index/${payWay}`, {
        orderId: orderId,
        deviceId: this.deviceInfo.deviceId,
        authInfo: this.deviceInfo.authInfo
      })
      if (res === '制水成功') {
        // 这里预留出来了，我看水机方面没有提供水卡支付的接口，整个流程和扫码支付是一样的
        await this.$tkParse.put(`/classes/cards/${this.targetCard.objectId}`, {
          'amount': Number(this.targetCard.amount) - Number(this.amount.label)
        }).catch(e => {
          throw e
        })

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

        let path = '/pages/common/paySuccess'
        let query = {
          amount: amount
        }
        this.$route.push(path, query)
      }else{
        Toast.fail('支付失败')
      }
    },
    chose (msg) {
      msg === 'wx' ? this.payWay = msg : this.payWay = msg.cardId
      if (msg !== 'wx') this.targetCard = msg
    },
    async cardPay (card) {
      // 此处提示余额不足
      if (!this.targetCard.amount || (Number(this.targetCard.amount) - Number(this.amount.label) < 0)){
        Toast.fail('余额不足！')
        return
      }
      let openId = this.$store.state.userInfo.openId
      let timeStamp = new Date().getTime()
      await this.createOrder(Number(this.amount.label),'', openId, true)
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

<style lang=scss>
  .margin-left {
    margin-left:20px;
  }
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
      >.amount {
        display: inline-block;
        width:33%;
        text-align: center;
        >div{
          width:100px;
          height: 30px;
          border-radius: 10px;
          display: inline-block;
          margin:7px 0;
          font-size:16px;
          padding: 10px 0 0 0;
          border: 1px solid rgba(0, 146, 255, 1);
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
