<template>
    <div>
      <input v-model="name"/>
      <h1>Hello {{name}}</h1>
      <router-link to="about">about page</router-link>
    </div>
</template>

<script lang="ts">
export default {
  data() {
    return {
      name: "World",
    };
  },
  methods: {
  },
  mounted() {
  }
};
</script>