import { createRouter, createWebHashHistory } from "vue-router";

const router = createRouter({
  history: createWebHashHistory(),
  routes: [
    {
      path: "/",
      redirect: "/resize-image",
    },
    {
      path: "/resize-image",
      name: "resize-image",
      component: () => import("./modules/resize-image/IndexPage.vue"),
    },
  ],
});

export default router;