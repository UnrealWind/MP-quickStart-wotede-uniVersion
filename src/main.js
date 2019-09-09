import Vue from 'vue'
import App from './App'
import tkParse from './wxcomponents/tkParse'
import cloudAjax from './wxcomponents/cloudAjax'
import route from './wxcomponents/route'
import TkFlex from './components/tkFlex'
import TkContainer from './components/tkContainer'
import TkIcon from './components/tkIcon'
import TkImage from './components/tkImage'
import store from './store'
import scan from './wxcomponents/tkScan'

Vue.use(tkParse)
Vue.use(cloudAjax)
Vue.use(route)
Vue.use(scan)

Vue.config.productionTip = false
Vue.prototype.$serverUrl = 'https://unidemo.dcloud.net.cn';
Vue.prototype.$store = store

Vue.component('TkFlex', TkFlex)
Vue.component('TkContainer', TkContainer)
Vue.component('TkIcon', TkIcon)
Vue.component('TkImage', TkImage)

const app = new Vue({
    mpType: 'app',
    ...App,
    store,
    components: {
        'tk-flex': TkFlex,
        'tk-container': TkContainer,
        'tk-icon': TkIcon,
        'tk-image': TkImage
    }
})
app.$mount()
