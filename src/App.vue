<template>
  <div id="app">
    <router-view />
    <Toast v-if="toast" :message="toast.message" :type="toast.type" />
  </div>
</template>

<script setup lang="ts">
import { provide } from 'vue';
import { useToast } from './composables/useToast';
import Toast from './components/Toast.vue';

const { toast, showToast } = useToast();
provide('showToast', showToast);
</script>

<style scoped>
#app {
  min-height: 100vh;
}
</style>

