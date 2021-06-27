<template>
    <h1>Hello Onion {{name}}</h1>
</template>

<script lang="ts">
import Test from './test.vue';
import {getName} from "./utils";

export default {
  components: {
    "a-test": Test,
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
    const a = "asdasd";
    this.name = this.$route.query.name;
    this.name = getName();
    console.log(a);
    // vant.Dialog.alert({
      // title: "标题",
      // message: "弹窗内容",
    // }).then(() => {
      // on close
    // });
  },
};
</script>