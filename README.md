## 说明 ##
该工程是为了将.vue文件编译成js,同时将es6的语法编译为es5

## 安装 ##
`npm i vue-build-js -D`

## 使用 ##
```
# 编译所有
vue-build-js ./path all
# 监听所有
vue-build-js ./path watch
```
## 编译后解析 ##
```
// 通过请求获取到编译后的文件
function getVueFile(file, resolve) {
    axios.get(file + '.min.js').then(function (response) {
        const v = response.data;
        const {
            script,
            style,
            html
        } = eval(v);
        const data = eval(script);
        data.template = html;
        // style需要放入head里面
        resolve(data);
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