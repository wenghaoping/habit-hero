<template>
  <div class="min-h-screen flex flex-col items-center justify-center p-6 relative overflow-hidden">
    <div class="absolute top-10 left-10 w-32 h-32 bg-accent rounded-full border-[3px] border-black opacity-60 animate-bounce-slow -z-10"></div>
    <div class="absolute top-40 right-20 w-16 h-16 bg-primary rounded-lg rotate-12 border-[3px] border-black opacity-60 animate-wiggle -z-10"></div>
    <div class="absolute bottom-20 left-20 w-24 h-24 bg-secondary rounded-full border-[3px] border-black opacity-60 animate-pulse -z-10"></div>

    <div class="absolute top-10 right-1/2 translate-x-1/2 -z-10 opacity-80">
      <svg width="200" height="120" viewBox="0 0 200 120" fill="#E0F2FE" stroke="black" stroke-width="3">
        <path d="M20,80 Q0,80 0,60 Q0,30 30,30 Q40,10 70,10 Q100,0 130,20 Q160,10 180,40 Q200,50 200,80 Q200,110 170,110 L30,110 Q10,110 20,80 Z" />
      </svg>
    </div>

    <div class="bg-white p-8 rounded-[3rem] border-[4px] border-black shadow-cartoon-lg w-full max-w-sm text-center transform rotate-1 hover:rotate-0 transition-transform duration-300">
      <div class="bg-gradient-to-br from-primary to-violet-500 w-28 h-28 rounded-full border-[4px] border-black flex items-center justify-center mx-auto mb-6 shadow-cartoon relative -top-12">
        <Trophy :size="56" :stroke-width="2.5" class="text-white drop-shadow-md" />
        <div class="absolute -right-2 top-0 bg-accent p-2 rounded-full border-2 border-black animate-bounce">
          <Star :size="20" fill="black" class="text-black" />
        </div>
      </div>

      <div class="-mt-8 mb-8">
        <h1 class="text-4xl font-black text-slate-800 tracking-tight drop-shadow-sm mb-2">习惯小英雄</h1>
        <p class="text-slate-500 font-bold text-lg">今天也是棒棒的一天！</p>
      </div>

      <div class="space-y-5">
        <Button
          @click="$router.push('/kid')"
          size="xl"
          variant="accent"
          class="w-full justify-between group"
        >
          <span class="flex items-center gap-3">
            <User :stroke-width="3" /> {{ data?.childName || '我是小朋友' }}
          </span>
          <ArrowRight class="group-hover:translate-x-2 transition-transform" :stroke-width="3" />
        </Button>

        <Button
          @click="handleParentEntry"
          variant="secondary"
          size="lg"
          class="w-full justify-between group rounded-[2rem]"
        >
          <span class="flex items-center gap-3">
            <Lock :size="20" :stroke-width="3" /> 家长入口
          </span>
          <div class="bg-slate-100 p-1 rounded-full border-2 border-black group-hover:bg-slate-200">
            <ArrowRight :size="16" :stroke-width="3" />
          </div>
        </Button>
      </div>
    </div>

    <!-- Pin Modal -->
    <Modal :is-open="showPinModal" title="家长验证" @close="showPinModal = false">
      <div class="text-center">
        <p class="mb-6 text-slate-600 font-bold text-lg">输入密码进入管理后台</p>
        <div class="flex justify-center gap-2 mb-8">
          <input
            v-model="pin"
            type="password"
            maxlength="4"
            placeholder="0000"
            class="text-center text-4xl tracking-[0.5em] font-black w-48 border-b-4 border-slate-300 focus:border-black focus:outline-none bg-transparent py-2 placeholder:text-slate-200"
            @keyup.enter="handlePinSubmit"
          />
        </div>
        <Button @click="handlePinSubmit" class="w-full text-lg">
          进入后台
        </Button>
        <p class="mt-4 text-xs text-slate-400 font-bold">默认密码: 0000</p>
      </div>
    </Modal>
  </div>
</template>

<script setup lang="ts">
import { ref, inject, onMounted, watch } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { Trophy, Star, User, Lock, ArrowRight } from 'lucide-vue-next';
import { useAppData } from '../composables/useAppData';
import { useToast } from '../composables/useToast';
import { useAuth } from '../composables/useAuth';
import Button from '../components/ui/Button.vue';
import Modal from '../components/ui/Modal.vue';

const router = useRouter();
const route = useRoute();
const { data, init } = useAppData();
const { checkAuth, setAuthenticated } = useAuth();
const showToast = inject<(message: string, type?: 'success' | 'error' | 'info') => void>('showToast')!;

const showPinModal = ref(false);
const pin = ref('');

onMounted(() => {
  init();
  // 如果 URL 中有 requireAuth 参数，说明需要认证，自动打开密码输入框
  if (route.query.requireAuth === 'true') {
    showPinModal.value = true;
  }
  // 如果已经认证过，直接跳转到目标页面
  if (checkAuth() && route.query.redirect) {
    router.push(route.query.redirect as string);
  }
});

const handleParentEntry = () => {
  // 如果已经认证过，直接跳转
  if (checkAuth()) {
    router.push('/parent');
  } else {
    // 否则显示密码输入框
    showPinModal.value = true;
  }
};

const handlePinSubmit = () => {
  const correctPin = data.value?.parentPin || '0000';
  if (pin.value === correctPin) {
    // 设置认证状态
    setAuthenticated(true);
    pin.value = '';
    showPinModal.value = false;
    // 如果有重定向路径，跳转到该路径，否则跳转到家长页面
    const redirectPath = route.query.redirect as string || '/parent';
    router.push(redirectPath);
  } else {
    showToast('密码错误', 'error');
    pin.value = '';
  }
};
</script>

