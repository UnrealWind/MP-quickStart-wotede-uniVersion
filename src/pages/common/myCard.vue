<template>
  <tk-container :status="status">
    <div slot="header">
      <div @click="back" class="back" >
        <tk-icon :size="18" :name="'arrow-left'"></tk-icon>
      </div>
      水卡详情
    </div>
    <div class="card-info">
      <p class="font-14">水卡余额（元）</p>
      <p class="font-60" v-if="card.amount">{{card.amount}}</p>
      <p class="font-60" v-else>0</p>
      <span @click="goRecord('余额明细')" class="info-btn">
        余额明细
      </span>
      <p class="card-num">卡号：{{card.cardId}}</p>
    </div>
    <div class="btn-box">
      <van-button @click="pay" type="info" size="large">充值</van-button>
    </div>
    <p class="center" @click="modalLoss">水卡挂失</p>
    <van-toast id="van-toast" />
    <van-dialog id="van-dialog" />
  </tk-container>
</template>

<script>
import Toast from '@/static/vant-weapp/dist/toast/toast'
import Dialog from '@/static/vant-weapp/dist/dialog/dialog';
export default {
  data () {
    return {
      status: 'loading',
      wrap: true,
      cardId: null,
      card: {}
    }
  },
  components: {

  },
  methods: {
    async init () {
      this.cardId = this.$root.$mp.query.cardId
      try {
        await this.getCardInfo()
      } catch (e) {
        this.status = 'error'
        throw e
      }
      this.status = 'success'
    },
    async getCardInfo () {
      let res = await this.$tkParse.get('/classes/cards', {
        params: {
          where: {
            cardId: this.cardId
          }
        }
      })
      this.card = res.results[0]
    },
    modalLoss(){
      Dialog.confirm({
        message: `确认挂失${this.cardId}?`
      }).then(() => {
        // on confirm
        this.lossCard()
      }).catch(() => {
        // on cancel
      });
    },
    async lossCard(){
      let lossRecord = await this.$tkParse.get('/classes/lossRecord', {
        params: {
          where: {
            lossCard: this.card.objectId,
            status: {
              $ne: 'cancel'
            }
          }
        }
      })
      if(lossRecord.results.length === 0){
        await this.$tkParse.put(`/classes/cards/${this.card.objectId}`, {
          loss: true
        })
        await this.$tkParse.post('/classes/lossRecord', {
          lossCard: {
              className: 'cards',
              objectId: this.card.objectId,
              __type: 'Pointer'
          },
          rechargeCard: {
            className: 'cards',
            objectId: '',
            __type: 'Pointer'
          },
          amount: this.card.amount,
          status: 'suspending'
        })
        Toast.success('挂失成功！')
      }else {
        Toast.fail('该卡已挂失！')
      }
    },
    goRecord (msg) {
      let path = '/pages/common/payRecord'
      let query = {
        type: msg,
        cardId: this.card.objectId
      }
      this.$route.push(path, query)
    },
    back () {
      this.$route.back()
    },
    pay () {
      let path = '/pages/common/recharge'
      let query = {
        type: '水卡充值',
        cardId: this.card.objectId,
        preAmount: this.card.amount
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

<style lang=scss>
  .main{
    background-color: #fff;
  }
  .font-14 {
    font-size:14px;
  }
  .font-60 {
    font-size:60px;
  }
  .card-info {
    height:200px;
    background-color: #0092ff;
    position: relative;
    .font-14 {
      padding: 28px 0 0 15px;
      color:#fff;
    }
    .font-60 {
      margin:25px 0 0 15px;
      color:#fff;
      height:60px;
      line-height: 60px;
    }
    .info-btn {
      position: absolute;
      width: 90px;
      height: 30px;
      line-height: 30px;
      border: 1px solid rgba(255, 255, 255, 1);
      border-radius: 2px;
      top:20px;
      right:5px;
      font-size:16px;
      color:#fff;
      text-align: center;
      padding: 0 3px;
    }
    .card-num {
      width:100%;
      height:35px;
      line-height: 35px;
      padding: 0 0 0 15px;
      background-color: #0078cc;
      position: absolute;
      bottom: 0;
      font-size:16px;
      color:#fff;
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
  .center {
    text-align: center;
    font-size: 16px;
    color:#0092ff;
  }
</style>
