<template>
  <tk-container :status="status">
    <div slot="header">
      <div @click="back" class="back" >
        <tk-icon :size="18" :name="'arrow-left'"></tk-icon>
      </div>
      支付成功
    </div>
    <div class="bind-card">
      <tk-icon :size="60" :color="'rgba(0, 146, 255, 1)'">gold-coin</tk-icon>
      <h3 class="blue">{{amount}}</h3>
      <h4>支付成功</h4>
      <ul>
        <li>
          <p>请按水机按钮打水</p>
        </li>
      </ul>
    </div>
  </tk-container>
</template>

<script>

export default {
  data () {
    return {
      status: 'loading',
      wrap: true,
      amount: 0
    }
  },
  components: {

  },
  methods: {
    async init () {
      this.amount = this.$root.$mp.query.amount
      this.status = 'success'
    },
    back () {
      this.$route.back()
    },
    scan () {

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
      h4 {
        font-size: 18px;
        font-weight: 600;
      }
     >ul {
       text-align: center;
       padding: 14px;
       font-size: 14px;
       color: rgba(102, 102, 102, 1);
       li {
         line-height:30px;
       }
     }
   }
  .blue {
    font-size: 16px;
    color: rgba(0, 146, 255, 1);
    font-weight: 600;
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
