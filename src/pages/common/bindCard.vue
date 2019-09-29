<template>
  <tk-container :status="status">
    <div slot="header">
      <div @click="back" class="back" >
        <tk-icon :size="18" :name="'arrow-left'"></tk-icon>
      </div>
      绑定水卡
    </div>
    <div class="bind-card">
      <tk-icon :size="40" :name="'credit-pay'">credit-pay</tk-icon>
      <h3>绑卡流程</h3>
      <ul>
        <li>
          <p>1.扫描饮水机二维码获取水机编号</p>
        </li>
        <li>
          <p>2.水卡贴饮水机磁卡处</p>
        </li>
        <li>
          <p>3.绑定成功</p>
        </li>
      </ul>
    </div>
    <div class="btn-box">
      <van-button @click="scan" type="info" size="large">
        <tk-icon :size="20" :name="'scan'">scan</tk-icon>扫描水机二维码
      </van-button>
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
      wrap: true
    }
  },
  components: {

  },
  methods: {
    async init () {
      // await this.$tkParse.post('/classes/shop', {test: 12})
      this.status = 'success'
    },
    back () {
      this.$route.back()
    },
    scan () {
      let that = this
      wx.scanCode({
        success: async (res) => {
          // res 中包含了mchId 以及 authInfo
          let device = await that.$tkParse.get('/classes/devices', {
            params: {
              where: {
                authInfo: that.getQueryString(res.path, 'authInfo')
              }
            }
          }).catch(() => {
            Toast.fail('无法获取设备信息，请重试')
          })
          if (device) {
            that.$store.commit('setDeviceInfo', device.results[0])
            that.goPasteCard()
          }
        }
      })
    },
    getQueryString (url, name) {
      let reg = new RegExp('(^|&)' + name + '=([^&]*)(&|$)', 'i')
      if (!url.split('?')[1]) return null
      let r = url.split('?')[1].match(reg)
      if (r != null) return decodeURI(r[2]); return null
    },
    goPasteCard () {
      let path = '/pages/common/pasteCard'
      this.$route.push(path)
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
  .main {
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
