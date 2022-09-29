<template>
  <q-page class="column items-center">
    <h1>Fluber Home</h1>
    <!-- TODO is the home page going straight to the map? -->
    <p class="q-px-md">
      Lorem ipsum dolor sit amet, consectetur adipiscing elit. Aenean at
      vehicula purus. Suspendisse eu lacus purus. Nunc ut varius nulla. Ut
      pharetra quam vitae dolor lacinia, vel elementum enim fringilla. Quisque
      convallis tellus in interdum blandit. Ut nec dolor nisl. Aenean lobortis
      massa ut faucibus tempus. Quisque feugiat, metus id laoreet sagittis, eros
      ante suscipit ipsum, sit amet porta magna magna at odio. Vivamus at odio
      mi. Praesent eu pharetra massa. Aliquam ipsum nulla, vehicula id gravida
      eget, interdum at metus. Proin placerat nunc eu nisl auctor consequat.
    </p>

    <MapComponent style="width: 90%" />
  </q-page>
</template>

<script>
import { defineComponent } from "vue";
import MapComponent from "../components/MapComponent.vue";

export default defineComponent({
  name: "IndexPage",
  components: {
    MapComponent,
  },
});
</script>
