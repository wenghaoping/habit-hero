<template>
  <div class="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
    <!-- Basic Info Settings -->
    <div class="bg-white p-6 md:p-8 rounded-[2rem] border-[3px] border-black shadow-cartoon">
      <h3 class="font-black text-slate-800 mb-6 text-xl flex items-center gap-2">
        <Settings :size="24" /> 基础设置
      </h3>

      <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label class="block text-sm font-bold text-slate-500 mb-2">小朋友名字</label>
          <input
            v-model="editChildName"
            class="w-full p-4 rounded-2xl border-[3px] border-slate-200 focus:border-black focus:outline-none font-black text-lg"
          />
        </div>
        <div>
          <label class="block text-sm font-bold text-slate-500 mb-2">家长密码 (4位数字)</label>
          <input
            v-model="editPin"
            type="text"
            class="w-full p-4 rounded-2xl border-[3px] border-slate-200 focus:border-black focus:outline-none font-black text-lg tracking-widest"
            @input="handlePinInput"
          />
        </div>
        <div class="md:col-span-2">
          <label class="block text-sm font-bold text-slate-500 mb-2">小朋友头像</label>
          <div class="flex flex-col sm:flex-row items-center sm:items-start gap-3 sm:gap-4">
            <img v-if="editAvatar" :src="editAvatar" alt="预览" class="w-16 h-16 object-cover rounded-2xl border-2 border-black" />
            <div class="flex items-center gap-2 flex-wrap">
              <input
                id="avatarImageInput"
                type="file"
                accept="image/*"
                class="hidden"
                @change="handleAvatarChange"
              />
              <label
                for="avatarImageInput"
                class="px-4 py-2 rounded-2xl border-2 border-black bg-white hover:bg-slate-50 cursor-pointer font-bold shadow-cartoon-sm"
              >选择图片</label>
            </div>
          </div>
        </div>
      </div>
      <div class="mt-6 flex justify-end">
        <Button @click="handleSaveSettings" variant="primary" :disabled="isAvatarReading">保存修改</Button>
      </div>
    </div>

    <!-- Deductions Quick Settings -->
    <div class="bg-white p-6 md:p-8 rounded-[2rem] border-[3px] border-black shadow-cartoon">
      <h3 class="font-black text-slate-800 mb-4 text-xl flex items-center gap-2">
        <Zap :size="24" /> 扣分快捷设置
      </h3>
      <p class="text-slate-500 font-bold mb-6">
        设置快速扣分选项，方便在总览页面快速扣除积分。
      </p>
      <button @click="$router.push('/deductions-settings')" class="w-full py-4 px-5 rounded-2xl border-[3px] border-black bg-green-500 hover:bg-green-600 text-white font-black shadow-cartoon hover:-translate-y-1 hover:shadow-cartoon-lg transition-all active:scale-95 flex items-center justify-center">
        <Zap class="mr-2" :size="20" :stroke-width="3" />
        进入扣分快捷设置
      </button>
    </div>

    <!-- Data Backup -->
    <div class="bg-white p-6 md:p-8 rounded-[2rem] border-[3px] border-black shadow-cartoon">
      <h3 class="font-black text-slate-800 mb-4 text-xl flex items-center gap-2">
        <Save :size="24" /> 数据备份与恢复
      </h3>
      <p class="text-slate-500 font-bold mb-6">
        将数据导出为文件保存到本地，或者从文件恢复数据。
      </p>

      <div class="flex flex-col sm:flex-row gap-4">
        <Button @click="handleExport" variant="secondary" class="flex-1 py-4">
          <Download class="mr-2" :size="20" :stroke-width="3" />
          导出数据 (JSON)
        </Button>

        <div class="relative flex-1">
          <input
            type="file"
            accept=".json"
            class="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
            @change="handleImport"
          />
          <Button variant="primary" class="w-full py-4 h-full">
            <Upload class="mr-2" :size="20" :stroke-width="3" />
            导入数据 (JSON)
          </Button>
        </div>
      </div>
    </div>

    <!-- Clear Points and History -->
    <div class="bg-orange-50 p-6 md:p-8 rounded-[2rem] border-[3px] border-black shadow-cartoon">
      <h3 class="font-black text-slate-800 mb-4 text-xl flex items-center gap-2">
        <AlertCircle :size="24" class="text-orange-600" /> 清空积分和历史记录
      </h3>
      <p class="text-slate-600 font-bold mb-4">该操作将清空当前积分和所有历史记录，但会保留任务、奖励和扣分选项。不可恢复，请谨慎操作。</p>
      <Button
        @click="isClearPointsModalOpen = true"
        variant="danger"
        class="w-full py-4 bg-orange-500 hover:bg-orange-600 text-white border-black"
      >
        清空积分和历史记录
      </Button>
    </div>

    <!-- Reset All Data -->
    <div class="bg-red-50 p-6 md:p-8 rounded-[2rem] border-[3px] border-black shadow-cartoon">
      <h3 class="font-black text-slate-800 mb-4 text-xl flex items-center gap-2">
        <AlertCircle :size="24" class="text-red-600" /> 开发者工具：清空所有数据
      </h3>
      <p class="text-slate-600 font-bold mb-4">该操作将删除所有积分、习惯、奖励、待审批任务和历史记录。不可恢复，请谨慎操作。</p>
      <Button
        @click="isResetModalOpen = true"
        variant="danger"
        class="w-full py-4 bg-red-500 hover:bg-red-600 text-white border-black"
      >
        清空所有数据
      </Button>
    </div>

    <div class="bg-indigo-50 p-6 rounded-[2rem] border-[3px] border-black/10 text-center">
      <p class="text-indigo-300 font-bold text-sm">Habit Hero v2.1</p>
    </div>

    <!-- Clear Points and History Confirm Modal -->
    <Modal :is-open="isClearPointsModalOpen" title="清空积分和历史记录" @close="isClearPointsModalOpen = false">
      <div class="space-y-4">
        <p class="text-sm font-bold text-slate-700">该操作将清空当前积分和所有历史记录，但会保留任务、奖励和扣分选项。不可恢复，请确认继续。</p>
        <label class="flex items-center gap-2">
          <input type="checkbox" v-model="ackClearPoints" />
          <span class="text-sm font-bold text-slate-600">我已了解此操作不可恢复，并确认继续</span>
        </label>
        <div class="flex gap-3 justify-end">
          <Button @click="isClearPointsModalOpen = false" variant="secondary">取消</Button>
          <Button
            @click="handleClearPointsHistory"
            :disabled="isClearingPoints || !ackClearPoints"
            variant="danger"
            class="bg-orange-500 hover:bg-orange-600"
          >
            {{ isClearingPoints ? '正在清空...' : '确认清空' }}
          </Button>
        </div>
      </div>
    </Modal>

    <!-- Reset Confirm Modal -->
    <Modal :is-open="isResetModalOpen" title="危险操作：清空所有数据" @close="isResetModalOpen = false">
      <div class="space-y-4">
        <p class="text-sm font-bold text-slate-700">该操作将清空服务端数据库中的所有数据，不可恢复。请确认并输入管理员密码以继续。</p>
        <label class="flex items-center gap-2">
          <input type="checkbox" v-model="ackReset" />
          <span class="text-sm font-bold text-slate-600">我已了解此操作不可恢复，并确认继续</span>
        </label>
        <div>
          <label class="block text-sm font-bold text-slate-500 mb-2">管理员密码</label>
          <input
            v-model="resetPassword"
            type="password"
            placeholder="请输入：admin"
            class="w-full p-3 rounded-xl border-[3px] border-slate-200 focus:border-black focus:outline-none font-black"
          />
        </div>
        <div class="flex gap-3 justify-end">
          <Button @click="isResetModalOpen = false" variant="secondary">取消</Button>
          <Button
            @click="handleResetAll"
            :disabled="isResetting || !ackReset || !resetPassword"
            variant="danger"
            class="bg-red-500 hover:bg-red-600"
          >
            {{ isResetting ? '正在清空...' : '确认清空' }}
          </Button>
        </div>
      </div>
    </Modal>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, inject } from 'vue';
import { useRouter } from 'vue-router';
import {
  Settings,
  Save,
  Download,
  Upload,
  Zap,
  AlertCircle,
} from 'lucide-vue-next';
import { useAppData } from '../../composables/useAppData';
import { exportDataToFile, importDataFromFile, resetAllData, clearPointsHistory } from '../../../services/storageService';
import type { AppData } from '../../../types';
import Button from '../ui/Button.vue';
import Modal from '../ui/Modal.vue';

const router = useRouter();

interface Props {
  data: AppData;
}

const props = defineProps<Props>();
const { updateData, init } = useAppData();
const showToast = inject<(message: string, type?: 'success' | 'error' | 'info') => void>('showToast')!;

const editChildName = ref(props.data.childName);
const editPin = ref(props.data.parentPin);
const editAvatar = ref<string | null>(props.data.avatar ?? null);
const isAvatarReading = ref(false);
const isClearPointsModalOpen = ref(false);
const ackClearPoints = ref(false);
const isClearingPoints = ref(false);
const isResetModalOpen = ref(false);
const resetPassword = ref('');
const ackReset = ref(false);
const isResetting = ref(false);

watch(() => props.data.childName, (val) => {
  editChildName.value = val;
});

watch(() => props.data.parentPin, (val) => {
  editPin.value = val;
});

watch(() => props.data.avatar, (val) => {
  editAvatar.value = val ?? null;
});

const handlePinInput = (e: Event) => {
  const target = e.target as HTMLInputElement;
  const v = target.value.replace(/[^0-9]/g, '').slice(0, 4);
  editPin.value = v;
};

const handleSaveSettings = () => {
  if (editPin.value.length !== 4) {
    showToast('密码必须是4位数字', 'error');
    return;
  }
  updateData((prev) => ({
    ...prev,
    childName: editChildName.value,
    parentPin: editPin.value,
    avatar: editAvatar.value ?? null,
  }));
  showToast('基础设置已保存！');
};

const handleExport = async () => {
  await exportDataToFile();
};

const handleImport = async (e: Event) => {
  const target = e.target as HTMLInputElement;
  const file = target.files?.[0];
  if (file) {
    try {
      const imported = await importDataFromFile(file);
      updateData(() => imported);
      editChildName.value = imported.childName || '宝贝';
      editPin.value = imported.parentPin || '0000';
      showToast('数据恢复成功！');
    } catch (err) {
      showToast('文件格式错误', 'error');
    }
  }
};

const handleAvatarChange = async (e: Event) => {
  const target = e.target as HTMLInputElement;
  const file = target.files?.[0];
  if (!file) {
    editAvatar.value = null;
    return;
  }
  const reader = new FileReader();
  isAvatarReading.value = true;
  reader.onload = () => {
    const result = reader.result as string;
    const img = new Image();
    img.onload = () => {
      const maxDim = 800;
      const scale = Math.min(1, maxDim / Math.max(img.width, img.height));
      const canvas = document.createElement('canvas');
      canvas.width = Math.round(img.width * scale);
      canvas.height = Math.round(img.height * scale);
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        const compressed = canvas.toDataURL('image/jpeg', 0.85);
        editAvatar.value = compressed;
      } else {
        editAvatar.value = result;
      }
      isAvatarReading.value = false;
    };
    img.onerror = () => {
      editAvatar.value = result;
      isAvatarReading.value = false;
    };
    img.src = result;
  };
  reader.onerror = () => {
    isAvatarReading.value = false;
  };
  reader.readAsDataURL(file);
};

const handleClearPointsHistory = async () => {
  if (!ackClearPoints.value) {
    showToast('请勾选确认', 'error');
    return;
  }
  isClearingPoints.value = true;
  try {
    await clearPointsHistory();
    await init();
    showToast('已清空积分和历史记录', 'success');
    isClearPointsModalOpen.value = false;
    ackClearPoints.value = false;
  } catch (e) {
    showToast('清空失败，请检查服务端日志', 'error');
  } finally {
    isClearingPoints.value = false;
  }
};

const handleResetAll = async () => {
  if (resetPassword.value !== 'admin' || !ackReset.value) {
    showToast('请勾选确认并输入管理员密码', 'error');
    return;
  }
  isResetting.value = true;
  try {
    await resetAllData(resetPassword.value);
    await init();
    showToast('已清空所有数据', 'success');
    isResetModalOpen.value = false;
    resetPassword.value = '';
    ackReset.value = false;
  } catch (e) {
    showToast('清空失败，请检查服务端日志', 'error');
  } finally {
    isResetting.value = false;
  }
};
</script>

