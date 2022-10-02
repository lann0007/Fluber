<template>
  <!-- source: https://vue2-leaflet.netlify.app/quickstart/#hello-map -->
  <!-- for some reason if this is wrapped in another HTML element it won't render, so any
    styles and layout should be done on this `MapComponent` (it's parent) -->
  <l-map
    v-if="userCoords !== null"
    style="height: 300px"
    :zoom="18"
    :maxZoom="19"
    :center="userCoords"
    ref="theMap"
    @ready="makeMapRef()"
  >
    <!-- <l-tile-layer :url="url" :attribution="attribution"></l-tile-layer> -->
    <!-- <l-marker :lat-lng="userCoords"></l-marker> -->
  </l-map>
  <!-- NOTE: this div might show for some time before the location API can get the location -->
  <h2 v-else>Waiting for GPS</h2>
</template>

<script>
import { LMap } from '@vue-leaflet/vue-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

export default {
  components: {
    LMap,
    // LTileLayer,
    // LMarker
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
    }
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
    }
  }
}
</script>
