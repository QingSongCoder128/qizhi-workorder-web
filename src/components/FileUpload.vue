<template>
  <div class="file-upload">
    <el-upload
      :action="''"
      :http-request="handleUpload"
      :file-list="fileList"
      :on-remove="handleRemove"
      :limit="limit"
      :accept="accept"
      list-type="picture-card"
      :on-exceed="handleExceed"
    >
      <el-icon><Plus /></el-icon>
      <template #tip>
        <div class="upload-tip">
          {{ tip }}
        </div>
      </template>
    </el-upload>
  </div>
</template>

<script setup>
import { ref, watch } from 'vue'
import { ElMessage } from 'element-plus'
import { uploadAttachment } from '@/api/workOrder'

const props = defineProps({
  modelValue: { type: Array, default: () => [] },
  limit: { type: Number, default: 9 },
  accept: { type: String, default: '.jpg,.jpeg,.png,.pdf' },
  tip: { type: String, default: '支持 jpg/png/pdf，单张不超过 5MB，最多 9 个' }
})

const emit = defineEmits(['update:modelValue'])

const fileList = ref(
  props.modelValue.map((url, i) => ({ name: `file-${i}`, url }))
)

watch(() => props.modelValue, (val) => {
  fileList.value = val.map((url, i) => ({ name: `file-${i}`, url }))
})

async function handleUpload({ file }) {
  if (file.size > 5 * 1024 * 1024) {
    ElMessage.warning('文件大小不能超过 5MB')
    return
  }
  try {
    const res = await uploadAttachment(file)
    const url = res.data
    const newList = [...props.modelValue, url]
    emit('update:modelValue', newList)
  } catch {
    ElMessage.error('上传失败')
  }
}

function handleRemove(file) {
  const url = file.url || file.response?.data
  const newList = props.modelValue.filter(u => u !== url)
  emit('update:modelValue', newList)
}

function handleExceed() {
  ElMessage.warning(`最多上传 ${props.limit} 个文件`)
}
</script>

<style scoped>
.upload-tip {
  font-size: 12px;
  color: #999;
  margin-top: 4px;
}
</style>
