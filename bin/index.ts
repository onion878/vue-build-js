declare var Vue: any, VueRouter: any, getVueFile: any, axios: any;
// 初始化界面
let url = 'route.json';
if(window.location.href.indexOf('index.html') > -1) {
    url = window.location.href.replace('index.html', 'route.json');
}
axios.get(url).then(({data}) => {
    const routes = [];
    data.forEach(d => {
        routes.push({
            path: d.path,
            meta: d.meta,
            component: Vue.defineAsyncComponent(
                () =>
                    new Promise((resolve, reject) => {
                        getVueFile(d.component, resolve);
                    })
            )
        });
    });
    const router = VueRouter.createRouter({
        history: VueRouter.createWebHashHistory(), routes: routes
    })

    // 路由前置导航守卫
    router.beforeEach((to, from, next) => {
        // 根据路由元信息设置文档标题
        if (to.meta.title) {
            window.document.title = to.meta.title;
        }
        next();
    });

    const app = Vue.createApp({
        data() {
            return {
                info: '动态加载Vue3组件'
            }
        }
    });
    app.use(router);
    app.mount('#app');
});