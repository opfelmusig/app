<template>
  <div
    ref="scroller"
    class="relative flex min-h-full w-full min-w-0 flex-col overflow-hidden overflow-y-auto"
  >
    <slot />
  </div>
</template>

<script lang="ts" setup>
const route = useRoute();
const scroller = useTemplateRef("scroller");
provide(pageScrollerKey, scroller);

useRouteScrollRestoration(scroller, () => !!route.query.song_id);
</script>
