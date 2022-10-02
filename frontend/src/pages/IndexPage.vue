<template>
  <q-page class="column items-center">
    <h1>Fluber Home</h1>
    <!-- TODO is the home page going straight to the map? -->
    <MapComponent style="width: 90%" />
  </q-page>
</template>

<script>
import { defineComponent } from 'vue'
import MapComponent from '../components/MapComponent.vue'

export default defineComponent({
  name: 'IndexPage',
  components: {
    MapComponent,
  },
})
</script>
