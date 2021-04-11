<template>
    <h1>Hello Onion</h1>
</template>

<script>
import Test from './test.vue';

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