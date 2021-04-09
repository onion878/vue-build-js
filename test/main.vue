<template>
  <div>
    <h1 data-2>Hello aaaaaaaaaaaaaaaa {{ name }}</h1>
    <van-button type="primary">按钮</van-button>
    <van-button type="warning" @click="show">按钮</van-button>
    <van-switch v-model="check" />
    <input type="text" v-model="name" />
    {{ check }}
    <van-tag type="primary">标签</van-tag>
    <van-tag type="success">标签</van-tag>
    <van-tag type="danger">标签</van-tag>
    <van-tag type="warning">标签</van-tag>
    <van-tag type="success">Hello onion</van-tag>
    <a-list></a-list>
  </div>
</template>

<script lang="ts">
import { getName } from './component/utils';
import List from "./component/list.vue";

export default {
  components: {
    "a-list": List,
  },
  data() {
    return {
      name: "onion",
      check: false,
    };
  },
  methods: {
    show() {
      // vant.Notify("通知内容");
    },
  },
  mounted() {
    const a: string = "asdasd";
    this.name = this.$route.query.name;
    console.log(a);
    console.log(getName());
    // vant.Dialog.alert({
      // title: "标题",
      // message: "弹窗内容",
    // }).then(() => {
      // on close
    // });
  },
};
</script>

<style>
h1 span,
input {
  font-family: "楷体";
  color: red;
}
</style>