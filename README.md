## 说明 ##
该工程是为了将.vue文件编译成js,同时将es6的语法编译为es5,可以在vue文件中使用import,如: `import { getName } from './component/utils';` `import List from "./component/list.vue";` 其中第一个是ts,第二个是vue组件

## 安装 ##
`npm i vue-build-js -D`

## 使用 ##
```
# 编译所有
vue-build-js ./path all -o dist
# 监听所有
vue-build-js ./path watch  -o dist
```
## 编译后解析 ##
```
// 引入使用的js
<script src="https://cdn.jsdelivr.net/npm/axios@0.21.1/dist/axios.min.js"></script>
<script src="https://cdn.jsdelivr.net/npm/vue@2.6/dist/vue.min.js"></script>
<script src="https://unpkg.com/vue-router@2.0.0/dist/vue-router.js"></script>
<script src="https://requirejs.org/docs/release/2.3.6/minified/require.js"></script>
// 通过请求获取到编译后的文件
function getVueFile(file, resolve) {
    axios.get(file + '.config.json').then(function (c) {
        requirejs([file + '.min.js'].concat(c.data), function (main) {
            // main.style需要放入head里面
            resolve(main);
        });
    });
}
// vue加载使用
var routes = [
    {
        path: "/main",
        component: (resolve) => {
            return getVueFile('./main', resolve);
        }
    }
]

```