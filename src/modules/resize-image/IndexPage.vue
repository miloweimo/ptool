<script setup lang="ts">
import { onUnmounted, ref } from "vue";
import { formatError } from "@/utils/formatError";
import { saveFiles } from "@/utils/saveFiles";
import { resizeImageFile } from "@/utils/resizeImage";

const width = ref(100);
const height = ref(100);
const isResizing = ref(false);
const isDownloading = ref(false);

type ImagePreview = {
  id: string;
  file: File;
  url: string;
};

const imagePreviews = ref<ImagePreview[]>([]);

function revokePreviews(previews: ImagePreview[]) {
  for (const preview of previews) {
    URL.revokeObjectURL(preview.url);
  }
}

function toPreview(file: File): ImagePreview {
  return {
    id: `${file.name}-${file.size}-${file.lastModified}`,
    file,
    url: URL.createObjectURL(file),
  };
}

function handleFileChange(event: Event) {
  const files = (event.target as HTMLInputElement).files;
  if (!files?.length) return;

  revokePreviews(imagePreviews.value);
  imagePreviews.value = Array.from(files)
    .filter((file) => file.type.startsWith("image/"))
    .map(toPreview);
}

async function resizeImages() {
  if (!imagePreviews.value.length || isResizing.value) return;

  isResizing.value = true;
  try {
    const resizedFiles = await Promise.all(
      imagePreviews.value.map((preview) =>
        resizeImageFile(preview.file, width.value, height.value),
      ),
    );

    revokePreviews(imagePreviews.value);
    imagePreviews.value = resizedFiles.map(toPreview);
  } catch (error) {
    console.error("[ptool] resize failed", error);
    window.alert(`图片缩放失败: ${formatError(error)}`);
  } finally {
    isResizing.value = false;
  }
}

async function downloadImages() {
  if (!imagePreviews.value.length || isDownloading.value || isResizing.value) {
    return;
  }

  isDownloading.value = true;
  try {
    await saveFiles(imagePreviews.value.map((preview) => preview.file));
  } catch (error) {
    console.error("[ptool] save failed", error);
    window.alert(`图片保存失败: ${formatError(error)}`);
  } finally {
    isDownloading.value = false;
  }
}

async function handleSaveImages() {
  await resizeImages();
  await downloadImages();
}

function clearImages() {
  revokePreviews(imagePreviews.value);
  imagePreviews.value = [];
}

function removeImage(id: string) {
  imagePreviews.value = imagePreviews.value.filter((preview) => preview.id !== id);
}

onUnmounted(() => {
  revokePreviews(imagePreviews.value);
});
</script>

<template>
  <main class="container">
    <!-- <h1>ptool转换工具</h1> -->
    <div>
      <h2>修改图片大小</h2>
      <div class="flex items-center gap-2">
          <label for="image-input" class="file-picker">
            {{ imagePreviews.length ? `已选择 ${imagePreviews.length} 张图片` : "选择图片" }}
          </label>
          <button
            @click="clearImages"
            class="btn"
          >
            {{ "清空图片" }}
          </button>
          <div>
            <label for="width">宽度</label><input type="number" id="width" v-model="width" class="border border-gray-300 rounded-md p-2 w-24"/>px
          </div>
          <div>
            <label for="height">高度</label><input type="number" id="height" v-model="height" class="border border-gray-300 rounded-md p-2 w-24"/>px
          </div>
          <button
            @click="handleSaveImages"
            class="btn"
            :disabled="!imagePreviews.length || isResizing || isDownloading"
          >
            {{ isResizing ? "处理中..." : "保存" }}
          </button>
          <!-- <button
            @click="downloadImages"
            class="btn"
            :disabled="!imagePreviews.length || isResizing || isDownloading"
          >
            {{ isDownloading ? "打包中..." : "保存图片" }}
          </button> -->
        </div>
      <div>
        <input
          id="image-input"
          type="file"
          name="image"
          accept="image/*"
          multiple
          class="sr-only"
          @change="handleFileChange"
        />
        <div
          v-if="imagePreviews.length"
          class="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-3"
        >
          <figure
            v-for="preview in imagePreviews"
            :key="preview.id"
            class="overflow-hidden rounded-lg border border-gray-200 bg-white"
          >
            <img
              :src="preview.url"
              :alt="preview.file.name"
              class="h-32 w-full object-cover"
            />
            <figcaption class="truncate px-2 py-1 text-xs text-gray-500 flex items-center justify-between">
              {{ preview.file.name }}
              <button
                @click="removeImage(preview.id)"
                class="btn"
              >
                {{ "删除" }}
              </button>
            </figcaption>
          </figure>
        </div>
      </div>
    </div>
  </main>
</template>

<style scoped>
@reference "@/style.css";

.btn {
  @apply bg-blue-500 text-white rounded-md p-2 cursor-pointer;
}

.btn:disabled {
  @apply bg-gray-300 text-gray-500 cursor-not-allowed;
}

.file-picker {
  @apply inline-block cursor-pointer rounded-md border border-gray-300 bg-white px-4 py-2 text-sm text-gray-700 hover:bg-gray-50;
}
</style>
