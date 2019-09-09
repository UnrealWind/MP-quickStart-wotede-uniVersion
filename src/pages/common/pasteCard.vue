<template>
  <tk-container :status="status">
    <div slot="header">
      <div @click="back" class="back" >
        <tk-icon :size="18" :name="'arrow-left'"></tk-icon>
      </div>
      绑定水卡
    </div>
    <div class="bind-card">
      <tk-icon :size="40">credit-pay</tk-icon>
      <h3>请贴卡</h3>
      <ul>
        <li>
          <p>请将水卡贴在水机磁卡处</p>
        </li>
      </ul>
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
      interval: 15,
      bool: true,
      bindBool: false,
      result1: null,
      errorBool: false,
      time: null,
      result: null,
      device: {},
      customer: {}
    }
  },
  methods: {
    async init () {
      this.status = 'success'
      this.device = this.$store.state.deviceInfo
      this.customer = this.$store.state.userInfo
      try {
        await this.askCard()
      } catch (e) {
        Toast.fail('未检测到水卡！')
      }
    },
    async askCard () {
      let bindData = await this.$cloudAjax.post('/index/bindCard', {
        deviceId: this.device.deviceId,
        authInfo: this.device.authInfo,
        step: '1'
      })
      if (bindData.ds_id !== 'binding_info') {
        Toast.fail('未检测到水卡！')
        return
      }
      await this.$cloudAjax.post('/index/bindCard', {
        deviceId: this.device.deviceId,
        authInfo: this.device.authInfo,
        step: '2'
      }).catch(e => {})
      await this.bind(bindData)
    },
    judgeCard(cardId){

    },
    async bind (card) {
      let cardId = card.value.card_id
      let type = card.value.card_type
      let virtualCard = type ? !!Number(type) : false
      let cards = await this.$tkParse.get('/classes/cards', {
        params: {
          where: {
            cardId: cardId
          }
        }
      }).catch(() => {
        Toast.fail('无法获取卡片信息！')
        this.back()
      })
      if (!cards) return
      if (cards.results.length === 0) {
        await this.$tkParse.post('/classes/cards', {
          'customer': this.customer.objectId,
          'cardId': cardId,
          'device': this.device.objectId,
          'virtualCard': virtualCard
        }).then(() => {
          Toast.success('绑定成功！')
          this.back()
        }).catch(e => {
          Toast.fail('绑定失败！')
          this.back()
        })
      } else {
        Toast.fail('卡片已绑定！')
      }
    },
    back () {
      setTimeout(this.$route.back(), 1000)
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
  .font-14 {
    font-size:14px;
  }
  .bind-card {
    text-align: center;
    h3 {
      font-size: 18px;
      margin:10px 0 0 0;
    }
    >ul {
      text-align: left;
      padding: 15px;
      font-size: 16px;
      color: rgba(102, 102, 102, 1);
      li {
        line-height:30px;
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
</style>
