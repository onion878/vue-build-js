## 说明 ##
目的是实现vue的远程动态加载组件方便项目调用远程组件和路由界面<br>
将.vue文件编译成js,同时将es6的语法编译为es5,可以在vue文件中使用import,如: <br>
`import { getName } from './component/utils';` typescript <br>
`import List from "./component/list.vue";` 自定义vue组件 <br>
`import Chart from "../component/chart.min";` 三方js库<br>
其中第一个是ts,第二个是vue组件 <br>
引入组件通过components去定义使用<br>

## 安装 ##
`npm i vue-build-js -D`

## 使用 ##
```
# 初始化项目(初始化后可以修改基础文件和代码)
vue-build-js ./src init -o dist
# 编译所有
vue-build-js ./src all -o dist
# 监听所有
vue-build-js ./src watch  -o dist
```