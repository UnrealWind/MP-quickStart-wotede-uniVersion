<template>
    <tk-container :status="status" >
      <div slot="header">首页</div>
      <div class="img-box">
        <tk-image :src="imgSrc" :width="'100%'" :height="'170px'"></tk-image>
      </div>
      <div class="cell-card">
        <h2>我的水卡
          <span @click="bindCard"><span class="icon-plus">+</span>绑定</span>
        </h2>
        <div v-if="cardList.length>0">
          <van-cell @click="goCardInfo(card.cardId)" v-for="(card,index) in cardList" :key="index" center="true">
          <span class="myCard-icon" slot="icon" >
            <tk-icon :size="24" :color="'#fff'" :name="'idcard'"></tk-icon>
          </span>
            <view slot="title">
              <view class="van-cell-text">卡号：{{card.cardId}}</view>
              <van-tag type="danger">
                <span>余额：</span>
                <span class="red">¥
                  <!--mpvue木有filter 就这么处理一哈-->
                  <span v-if="card.amount">{{card.amount}}</span>
                  <span v-else>0</span>
                </span>
              </van-tag>
            </view>
            <van-icon slot="right-icon" name="arrow" class="custom-icon" />
          </van-cell>
        </div>
        <div v-else>
          <van-cell title="您还没有绑定水卡！" />
        </div>
      </div>
      <div class="btn-box bottom">
        <van-button @click="goMachineInfo" type="info" size="large">
          <tk-icon :size="20" :name="'scan'">scan</tk-icon>扫水机码
        </van-button>
      </div>
      <van-toast id="van-toast" />
    </tk-container>
</template>

<script>
import Toast from '@/static/vant-weapp/dist/toast/toast'
export default {
  // 如果是单独想使用配置，在这里进行配置即可
  config: {
    'enablePullDownRefresh': true
  },
  data () {
    return {
      status: 'loading',
      wrap: true,
      // imgSrc: '/assets/img/notfound.jpg',
      imgSrc: '',
      cardList: [],
      hasLogin:false
    }
  },
  components: {

  },
  methods: {
    async init () {
      try {
        // await this.getUserInfo()
        await this.getAdvertise()
      } catch (e) {
        this.status = 'error'
        throw e
      }
    },
    async getAdvertise () {
      let res = await this.$tkParse.get('/classes/advertise', {})
      this.status = 'success'
      this.imgSrc = res.results[0].image
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
    goMachineInfo () {
      if(!this.hasLogin){
        this.goAuthPage()
      }else{
        this.scanCode()
      }
    },
    async scanCode(){
      let that = this
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
          // res 中包含了mchId 以及 authInfo
          await that.getDeviceInfo(res)
        }
      })
    },
    async getDeviceInfo (res) {
      let device = await this.$tkParse.get('/classes/devices', {
        params: {
          where: {
            authInfo: this.getQueryString(res.path, 'authInfo')
          }
        }
      }).catch(() => {
        Toast.fail('无法获取设备信息，请重试')
      })

      if (device) {
        this.$store.commit('setDeviceInfo', device.results[0])
        let path = '/pages/common/machineInfo'
        this.$route.push(path)
      }
    },
    goCardInfo (cardId) {
      let path = '/pages/common/myCard'
      let query = {
        cardId: cardId
      }
      this.$route.push(path, query)
    },
    bindCard () {
      if(!this.hasLogin){
        this.goAuthPage()
      }else{
        let path = '/pages/common/bindCard'
        this.$route.push(path)
      }
    },
    // 验证授权自动授权后续抽成组件
    async getUserInfo () {
      let that = this
      wx.getSetting({
        success (res) {
          if (res.authSetting['scope.userInfo']) {
            that.login()
          } else {

          }
        }
      })
    },
    goAuthPage(){
      let path = '/pages/common/authorization'
      this.$route.push(path)
    },
    async login () {
      let that = this
      wx.login({
        success: async (code) => {
          wx.getUserInfo({
            success: async (userInfo) => {
              userInfo['code'] = code.code
              let callback = await that.$cloudAjax.get('/wechat/getUser', userInfo)
              that.userInfo = callback.data
              let res = await that.$tkParse.get('/classes/customers', {
                params: {
                  where: {
                    openId: that.userInfo.openId
                  }
                }
              })
              that.$store.commit('setUserInfo', {
                openId: that.userInfo.openId,
                objectId: res.results[0].objectId
              })
              await that.getCardInfo()
            }
          })
        }
      })
    },
    getQueryString (url, name) {
      let reg = new RegExp('(^|&)' + name + '=([^&]*)(&|$)', 'i')
      if (!url.split('?')[1]) return null
      let r = url.split('?')[1].match(reg)
      if (r != null) return decodeURI(r[2]); return null
    }
  },
  created () {

  },
  onShow () {
    // 调用应用实例的方法获取全局数据
    let that = this
    wx.getSetting({
      success (res) {
        if (res.authSetting['scope.userInfo']) {
          that.login()
          that.hasLogin = true
        } else {

        }
      }
    })
    this.init()
  },
  async onLoad (options) {
    if (options && options.authInfo) {
      let device = await this.$tkParse.get('/classes/devices', {
        params: {
          where: {
            authInfo: options.authInfo
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
      options['mchId'] = userinfo.results[0].mchId
      this.$store.commit('setMchInfo', options)
    }
  }
}
</script>

<style lang=scss >
  page{
    background: #fff !important;
  }
  .red {
    color:red;
  }
  .img-box {
    height:170px;
    overflow: hidden;
    padding:0 10px;
    image {
      position: relative;
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
    background-color: rgba(0, 146, 255, 1);
    border-radius: 3px;
    van-icon {
      position:relative;
      top:12px;
      left:12px;
    }
  }
  .cell-card {
    margin-top:10px;
    background-color: #fff;
    h2 {
      padding: 10px 10px;
      font-size:20px;
      font-weight:600;
      border-bottom: 1px solid #eee;
      >span{
        float: right;
        font-size:14px;
        color: rgba(0, 145, 255, 1);
        font-weight: 300;
        .icon-plus {
          font-size: 18px;
          font-weight: 600;
          margin:0 3px 0 0;
        }
      }
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
