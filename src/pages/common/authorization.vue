<template>
  <tk-container :status="status">
    <div slot="header">
      沃特德
    </div>
    <div >
      <div class="bind-card">
        <img src="http://moke-store.oss-cn-beijing.aliyuncs.com/d1679961-e492-495a-92e9-c66bdb2319ea.png"/>
        <p>您需要授权登录才可以正常打水哦</p>
      </div>
      <div class="btn-box">

        <!--这个按钮以后封组件-->
        <van-button @getuserinfo="auth" open-type="getUserInfo" type="info" size="large">微信用户授权</van-button>
      </div>
    </div>
    <van-toast id="van-toast" />
  </tk-container>
</template>

<script>
// 这个以后封组件,ps 这里必须使用相对路径
// 授权这套以后封装，现在先都放在这
import Toast from '@/static/vant-weapp/dist/toast/toast'
export default {
  data () {
    return {
      status: 'loading',
      wrap: true,
      userInfo: {}
    }
  },
  components: {

  },
  computed: {
    authed () {
      let auth = false
      if (JSON.stringify(this.userInfo) !== '{}') {
        auth = true
      }
      return auth
    }
  },
  methods: {
    async init () {
      this.status = 'success'
    },
    back () {
      this.$route.back()
    },
    auth (e) {
      if (e.mp.detail.userInfo) Toast.success('授权成功！')
      this.userInfo = e.mp.detail.userInfo
      this.login()
    },
    pay (code, money) {
      wx.request({
        url: 'https://mini.mokekeji.com:12138/mporg/pay?code=' + code + '&money=' + money,
        success (res) {
          wx.requestPayment({
            timeStamp: res.data.obj.timeStamp + '', // 时间戳
            nonceStr: res.data.obj.nonceStr, // 随机字符串
            package: 'prepay_id=' + res.data.obj.package, // repay_id
            signType: 'MD5', // 签名算法
            paySign: res.data.obj.paySign, // 签名
            success (res) {

            }
          })
        }
      })
    },
    login () {
      let that = this
      wx.login({
        success: async (code) => {
          wx.getUserInfo({
            success: async (userInfo) => {
              userInfo['code'] = code.code
              let callback = await that.$cloudAjax.get('/wechat/getUser', userInfo)
              that.userAuth(callback)
            }
          })
        }
      })
    },
    // 如果有用户就啥都不做，没有用户直接新增这个用户
    async userAuth (userInfo) {
      let res = await this.$tkParse.get('/classes/customers', {
        params: {
          where: {
            openId: userInfo.data.openId
          }
        }
      })
      if (res.results.length === 0) {
        this.saveUser(userInfo)
      } else {
        this.$store.commit('setUserInfo', {
          openId: userInfo.openId,
          objectId: res.results[0].objectId
        })
        this.back()
      }
    },
    async saveUser (userInfo) {
      let res = await this.$tkParse.post('/classes/customers', {
        openId: userInfo.data.openId
      }).catch(err => {
        throw err
      })
      console.log(res, 'ressres')
      userInfo['objectId'] = res.objectId
      this.$store.commit('setUserInfo', {
        openId: userInfo.openId,
        objectId: res.objectId
      })

      this.back()
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
  .bind-card {
    margin-top:120px;
    >img {
      width:184px;
      height:123px;
    }
    p {
      font-size: 14px;
      color: rgba(102, 102, 102, 1);
      width:120px;
      margin:0 auto;
    }
  }
</style>
