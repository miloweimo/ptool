import { createRouter, createWebHashHistory } from "vue-router";

const router = createRouter({
  history: createWebHashHistory(),
  routes: [
    {
      path: "/",
      meta: {
        title: "首页",
      },
      redirect: "/resize-image",
    },
    {
      path: "/resize-image",
      name: "resize-image",
      meta: {
        title: "图片压缩",
      },
      component: () => import("./modules/resize-image/IndexPage.vue"),
    },
  ],
});

export default router;