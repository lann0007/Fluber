<!-- TODO error handling -->

<template>
  <!-- source: https://vue2-leaflet.netlify.app/quickstart/#hello-map -->
  <!-- for some reason if this is wrapped in another HTML element it won't render, so any
    styles and layout should be done on this `MapComponent` (it's parent) -->
  <l-map
    v-if="userCoords !== null"
    id="mapItem"
    style="height: 400px"
    :zoom="18"
    :maxZoom="19"
    :center="userCoords"
    ref="theMap"
    @ready="makeMapRef()"
  >
    <!-- put other leaflet elements here -->
  </l-map>
  <!-- NOTE: this div might show for some time before the location API can get the location -->
  <h2 v-else>Waiting for GPS</h2>
</template>

<script>
import { LMap } from '@vue-leaflet/vue-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { Loading } from 'quasar'
import { sleep } from '../misc/helpers'

export default {
  components: {
    LMap,
  },
  props: {
    destinations: {
      type: Array,
      required: true
    },
    userCoords: {
      type: Object,
      required: true
    }
  },
  beforeMount() {
    //can only have one script tag but we need the leaflet-routing-machine script
    //https://stackoverflow.com/a/47002863
    let routingMachineScript = document.createElement('script')
    //FIXME this should probably be the local node module one, but can't seem to get it working
    routingMachineScript.setAttribute('src', 'https://unpkg.com/leaflet-routing-machine@latest/dist/leaflet-routing-machine.js')
    document.head.appendChild(routingMachineScript)
  },
  data() {
    return {
      //leaflet stuff
      map: null,  //allows us to expose the underlying leaflet API through vue-leaflet
      url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
      attribution:
        '&copy; <a target="_blank" href="http://osm.org/copyright">OpenStreetMap</a> contributors',
      //general data
      watchPositionId: null,
      userCoords_: null,
    }
  },
  methods: {
    //https://vue2-leaflet.netlify.app/quickstart/#accessing-leaflet-api
    async makeMapRef() {
      this.map = this.$refs.theMap.leafletObject

      L.tileLayer(this.url, {
        attribution: this.attribution
      }).addTo(this.map)

      L.marker(this.userCoords).addTo(this.map)

      //need a slight delay for data to be ready
      Loading.show()
      await sleep(500)
      this.routeToDestination()
      Loading.hide()
    },
    async routeToDestination() {
      const waypointsArr = []      
      waypointsArr.push(
        //start at user's location
        L.latLng(this.userCoords.lat, this.userCoords.lng)
      )
      for (const destination of this.destinations) {
        waypointsArr.push(L.latLng(destination.lat, destination.lon))
      }

      // http://www.liedman.net/leaflet-routing-machine/api/
      const resp = L.Routing.control({
        waypoints: waypointsArr
      })
      .addTo(this.map)

      //wait to finish calculations then grab the selected route
      await sleep(1000)
      const route = resp._selectedRoute

      //emit a vue event to tell parent component about route
      this.$emit('routeToUse', route)
    },
  }
}
</script>

<style>
@import 'https://unpkg.com/leaflet-routing-machine@latest/dist/leaflet-routing-machine.css'
</style>