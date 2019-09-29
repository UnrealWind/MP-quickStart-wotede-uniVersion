<template>
  <tk-container :status="status">
    <div slot="header">
      <div @click="back" class="back" >
        <tk-icon :size="18" :name="'arrow-left'"></tk-icon>
      </div>
      {{type}}
    </div>
    <div v-if="consumptions.length>0" class="cell-card">
      <van-cell v-for="(consumption,index) in consumptions" :key="index" center="true">
        <view slot="title">
          <view class="van-cell-text">{{consumption.type}}打水</view>
          <van-tag class="ti-title">
            <span>{{consumption.createdAt|date}}</span>
          </van-tag>
        </view>
        <view >
          <p class="blue" v-if="consumption.flow">{{consumption.flow}}毫升</p>
          <p class="blue" v-else>0毫升</p>
        </view>
      </van-cell>
    </div>
    <div v-if="orderList.length>0" class="cell-card">
      <van-cell v-for="(order,index) in orderList" :key="index" center="true">
        <view slot="title">
          <view class="van-cell-text">微信充值</view>
          <van-tag class="ti-title">
            <span>{{order.createAt|date}}</span>
          </van-tag>
        </view>
        <view >
          <p class="blue">+¥：{{order.fee}}</p>
        </view>
      </van-cell>
    </div>
    <div v-if="balanceList.length>0" class="cell-card">
      <van-cell v-for="(balance,index) in balanceList" :key="index" center="true">
        <view slot="title">
          <view class="van-cell-text">{{balance.type}}</view>
          <van-tag class="ti-title">
            <span>{{balance.createdAt|date}}</span>
          </van-tag>
        </view>
        <view >
          <p :class="{ blue: balance.type ==='微信充值' }" class="red" v-if="balance.fee">
            ¥：
            <span v-if="balance.type !=='微信充值'">-</span>
            <span v-if="balance.type ==='微信充值'">+</span>
            {{balance.fee}}
          </p>
          <p class="blue" v-else>¥：0</p>
        </view>
      </van-cell>
    </div>
  </tk-container>
</template>

<script>

export default {
  data () {
    return {
      status: 'loading',
      wrap: true,
      balanceList: [],
      type: null,
      consumptions: [],
      orderList: [],
      cardId: ''
    }
  },
  components: {

  },
  filters: {
    date (isoString) {
      if (isoString) {
        let date = new Date(isoString)
        return date.getFullYear() + '-' + (date.getMonth() + 1) + '-' + date.getDate() + ' ' + date.getHours() + ':' + date.getMinutes()
      } else {
        return ''
      }
    }
  },
  methods: {
    async init () {
      this.type = this.$root.$mp.query.type
      if (this.$root.$mp.query.cardId) this.cardId = this.$root.$mp.query.cardId
      this.deviceInfo = this.$store.state.deviceInfo
      try {
        if (this.type === '消费记录') {
          await this.getConsumption()
        } else if (this.type === '充值记录') {
          await this.getOrder()
        } else if (this.type === '余额明细') {
          await this.getBalance()
        }
      } catch (e) {
        throw e
      }
      this.status = 'success'
    },
    async getConsumption () {
      let res = await this.$tkParse.get('/classes/consumption', {
        params: {
          order: '-createdAt',
          where: {
            device: this.deviceInfo.objectId
          }
        }
      })
      res.results.forEach((n, i) => {
        n.type === 'wechatPay' ? n.type = '微信支付' : n.type = '水卡支付'
      })
      this.consumptions = res.results
    },
    async getOrder () {
      let res = await this.$tkParse.get('/classes/consumption', {
        params: {
          order: '-createdAt',
          where: {
            type: 'machineCharge',
            'device': this.deviceInfo.objectId
          }
        }
      }).catch((e) => {
        throw e
      })
      this.orderList = res.results
      console.log(res)
    },
    async getBalance () {
      let res = await this.$tkParse.get('/classes/consumption', {
        params: {
          order: '-createdAt',
          where: {
            card: this.cardId
          }
        }
      }).catch((e) => {
        throw e
      })
      console.log(res)
      res.results.forEach((n, i) => {
        n.type === 'card' ? n.type = '水卡打水' : n.type = '微信充值'
      })
      this.balanceList = res.results
    },
    back () {
      this.$route.back()
    }
  },
  created () {

  },
  onShow () {
    this.init()
  },
  onLoad () {

  }
}
</script>

<style lang=scss>
  .main{
    background-color: #fff;
  }
  .ti-title {
    font-size:12px;
    color:#ccc;
  }
  .red {
    font-size: 16px;
    color: rgba(252, 78, 9, 1);
    font-weight: 600;
  }
  .blue {
    font-size: 16px;
    color: rgba(0, 146, 255, 1);
    font-weight: 600;
  }
  .ti-value {
    font-size:12px;
    color:#ccc;
  }
</style>
