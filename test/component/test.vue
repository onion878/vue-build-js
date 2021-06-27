<template>
  <h1>Hello Test</h1>
</template>

<script lang="ts">
import {getName} from "./utils";

export default {
  data() {
    return {
      name: "onion",
    };
  },
  methods: {
    show() {
    },
  },
  mounted() {
    console.log(getName());
  },
};
</script>