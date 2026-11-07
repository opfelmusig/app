export default defineNuxtConfig({
  // Nuxt

  compatibilityDate: "2025-07-15",
  devtools: { enabled: true },

  // Modules

  modules: [
    "@nuxt/eslint",
    "@nuxt/ui",
    "@vueuse/nuxt",
    "@pinia/nuxt",
    "pinia-plugin-persistedstate",
    "@waradu/keyboard/nuxt",
    "@pinia/colada-nuxt",
  ],

  keyboard: {
    capture: true,
  },

  piniaPluginPersistedstate: {
    storage: "localStorage",
  },

  pinia: {
    storesDirs: ["stores"],
  },

  // Tauri

  ssr: false,

  vite: {
    clearScreen: false,
    envPrefix: ["VITE_", "TAURI_"],
    resolve: {
      dedupe: ["vue"],
    },
    server: {
      strictPort: true,
    },
    optimizeDeps: {
      include: [
        "@tauri-apps/api/app",
        "@tauri-apps/api/core",
        "@tauri-apps/plugin-http",
        "@tauri-apps/api/window",
        "@tauri-apps/api/path",
        "@tauri-apps/plugin-log",
        "idb-keyval",
        "ms",
        "safe-stable-stringify",
        "serialize-error",
        "@tauri-apps/plugin-os",
        "@tauri-apps/plugin-opener",
        "@vueuse/integrations/useFuse",
        "core-js/proposals/await-dictionary",
        "class-variance-authority",
        "@opfelmusig/lib",
        "@opfelmusig/lib/helpers",
        "@pinia/colada-plugin-auto-refetch",
        "@pinia/colada-plugin-cache-persister",
        "cn",
        "hls.js",
        "vue-collapsed",
        "motion-v",
        "node-vibrant/browser",
        "@opfelmusig/lib/types",
        "@tauri-apps/plugin-process",
        "@tauri-apps/plugin-updater",
        "@tauri-apps/plugin-deep-link",
        "remeda",
        "@tauri-apps/plugin-clipboard-manager",
        "@tauri-apps/api/webviewWindow",
        "birpc",
        "@tauri-apps/api/event",
        "@vueuse/integrations/useSortable",
      ],
    },
  },

  ignore: ["**/src-tauri/**"],

  // UI

  css: ["~/assets/css/tailwind.css"],

  colorMode: {
    preference: "dark",
    fallback: "dark",
  },

  fonts: {
    provider: "bunny",
    families: [
      {
        name: "Inter",
        provider: "bunny",
        weights: [400, 500, 600, 700],
        styles: ["normal"],
        subsets: ["latin"],
      },
    ],
  },

  icon: {
    provider: "none",
    serverBundle: false,
    clientBundle: {
      scan: true,
      icons: [
        "lucide:arrow-left",
        "lucide:arrow-up-down",
        "lucide:arrow-up-left",
        "lucide:arrow-up-right",
        "lucide:audio-lines",
        "lucide:check",
        "lucide:chevron-down",
        "lucide:chevron-left",
        "lucide:chevron-right",
        "lucide:chevron-up",
        "lucide:columns-3",
        "lucide:command",
        "lucide:corner-up-left",
        "lucide:database",
        "lucide:download",
        "lucide:ellipsis",
        "lucide:external-link",
        "lucide:filter",
        "lucide:folder",
        "lucide:folder-open",
        "lucide:gallery-vertical-end",
        "lucide:globe",
        "lucide:guitar",
        "lucide:history",
        "lucide:house",
        "lucide:keyboard",
        "lucide:layout-grid",
        "lucide:list",
        "lucide:list-music",
        "lucide:list-video",
        "lucide:loader-circle",
        "lucide:lock-keyhole",
        "lucide:log-out",
        "lucide:maximize",
        "lucide:menu",
        "lucide:message-square-quote",
        "lucide:mic-vocal",
        "lucide:minimize",
        "lucide:minus",
        "lucide:music",
        "lucide:music-2",
        "lucide:palette",
        "lucide:panel-left-close",
        "lucide:panel-left-open",
        "lucide:panel-right-close",
        "lucide:panel-right-open",
        "lucide:pause",
        "lucide:pencil",
        "lucide:pin-off",
        "lucide:play",
        "lucide:radio",
        "lucide:refresh-cw",
        "lucide:repeat",
        "lucide:rotate-ccw",
        "lucide:search",
        "lucide:settings",
        "lucide:settings-2",
        "lucide:shuffle",
        "lucide:skip-back",
        "lucide:skip-forward",
        "lucide:square-star",
        "lucide:star",
        "lucide:timer",
        "lucide:trash-2",
        "lucide:user",
        "lucide:user-x",
        "lucide:volume",
        "lucide:volume-2",
        "lucide:x",
      ],
    },
  },

  // Others

  experimental: {
    typescriptPlugin: true,
  },
});
