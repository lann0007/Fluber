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
  <l-control position="bottomleft" >
    <q-btn color="primary" label="Test Routing" @click="testRouting()" />
  </l-control>
  </l-map>
  <!-- NOTE: this div might show for some time before the location API can get the location -->
  <h2 v-else>Waiting for GPS</h2>
</template>

<script>
import { LMap, LControl } from '@vue-leaflet/vue-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

export default {
  components: {
    LMap,
    LControl,
  },
  beforeMount() {
    //can only have one script tag but we need the leaflet-routing-machine script
    //https://stackoverflow.com/a/47002863
    let routingMachineScript = document.createElement('script')
    //FIXME this should probably be the local node module one, but can't seem to get it working
    routingMachineScript.setAttribute('src', 'https://unpkg.com/leaflet-routing-machine@latest/dist/leaflet-routing-machine.js')
    document.head.appendChild(routingMachineScript)
  },
  mounted() {
    this.startLocationUpdates()
  },
  unmounted() {
    this.stopLocationUpdates()
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
  computed: {
    userCoords: {
      set(val) {
        console.log('setting userCoords: ', val)
        this.userCoords_ = val
      },
      get() {
        console.log('getting userCoords: ', this.userCoords_)
        return this.userCoords_
      }
    },
  },
  methods: {
    startLocationUpdates() {
      this.watchPositionId = navigator.geolocation.watchPosition(
        (pos) => {
          this.userCoords = {
            lat: pos.coords.latitude,
            lng: pos.coords.longitude,
          }
        },
        (err) => {
          console.error('navigator experienced error watching position: ', err)
        }
      )
    },
    stopLocationUpdates() {
      navigator.geolocation.clearWatch(this.watchPositionId)
    },
    //https://vue2-leaflet.netlify.app/quickstart/#accessing-leaflet-api
    makeMapRef() {
      this.map = this.$refs.theMap.leafletObject

      L.tileLayer(this.url, {
        attribution: this.attribution
      }).addTo(this.map)

      L.marker(this.userCoords).addTo(this.map)
    },
    testRouting() {
      // http://www.liedman.net/leaflet-routing-machine/api/
      L.Routing.control({
        waypoints: [
          L.latLng(-35.007339, 138.573343), //Tonsley carpark
          L.latLng(-34.992860, 138.574918), //Daws Rd. / Main Sth. Rd. intersection
        ],
        routeWhileDragging: true
      }).addTo(this.map)
    }
  }
}
</script>

<style>
  @import 'https://unpkg.com/leaflet-routing-machine@latest/dist/leaflet-routing-machine.css'
</style>