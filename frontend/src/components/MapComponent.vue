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
    <!-- if nothing is in here, the map will fail to load in production - so we add the user's location marker here, rather than in `makeMapRef()` - see: https://github.com/vue-leaflet/vue-leaflet/issues/138 -->
    <l-marker :lat-lng="[userCoords.lat, userCoords.lng]">
      <l-tooltip>Your location</l-tooltip>
    </l-marker>
  </l-map>
  <!-- NOTE: this div might show for some time before the location API can get the location -->
  <h2 v-else>Waiting for GPS</h2>
</template>

<script>
import { LMap, LMarker, LTooltip } from '@vue-leaflet/vue-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { Loading } from 'quasar'
import { sleep, ensureVariableDefined } from '../misc/helpers'
import _ from 'lodash'
import { NominatimJS } from 'nominatim-js'

export default {
  components: {
    LMap,
    LMarker,
    LTooltip,
  },
  props: {
    destinations: {
      type: Array,
      required: true
    },
    userCoords: {
      type: Object,
      required: true
    },
    driverCoords: {
      type: Object,
      required: false,
      default: null,
    },
    //flag used to modify some behaviours slightly when it's a driver using the component
    isDriverMode: {
      type: Boolean,
      default: false,
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

      //need a slight delay for data to be ready
      Loading.show()
      await sleep(500)
      await this.routeToDestination()
      Loading.hide()
    },
    async routeToDestination() {
      console.log('destinations: ', this.destinations)
      console.log('driverCoords: ', this.driverCoords)
      const waypointsArr = []
      if (this.driverCoords) {
        waypointsArr.push(
          L.latLng(this.driverCoords.lat, this.driverCoords.lng)
        )
      } else {
        waypointsArr.push(
          //start at user's/driver's location
          //driver has the user's route, so this will add their location to the beginning
          //  too, creating a route from the driver to the user
          L.latLng(this.userCoords.lat, this.userCoords.lng)
        )
      }
      for (const destination of this.destinations) {
        if (this.isDriverMode) {
          //route driver receives is formatted slightly differently
          waypointsArr.push(L.latLng(destination.latLng.lat, destination.latLng.lng))
        } else {
          waypointsArr.push(L.latLng(destination.lat, destination.lon))
        }
      }

      // http://www.liedman.net/leaflet-routing-machine/api/
      const resp = await L.Routing.control({
        waypoints: waypointsArr
      })
      .addTo(this.map)

      let route = null
      //await this call so that `route` will be defined before moving on
      await ensureVariableDefined(
        resp,
        (route) => route !== undefined && Object.keys(route).includes('_selectedRoute'),
        10000 //timeout in ms
      ).then(() => {
        route = _.cloneDeep(resp._selectedRoute)
      })

      //clone so can mutate the data affecting original variable
      // let route = _.cloneDeep(resp._selectedRoute)
      for (let i = 0; i < this.destinations.length; i++) {
        //array access of `waypoints` is plus 1 as as the first waypoint is the source, which is not in `destinations`
        route.waypoints[i+1].display_name = this.destinations[i].display_name
      }
      //now resolve `userCoords` to a location
      const resolvedUserLocation = await NominatimJS.search({
        //TODO add 'country' param (derive from current location / source location)
        q: `${this.userCoords.lat}, ${this.userCoords.lng}`,
      })
      //`resolvedUserLocation` returns array, but assume there's only 1
      route.waypoints[0].display_name = resolvedUserLocation[0].display_name

      //emit a vue event to tell parent component about route
      this.$emit('routeToUse', route)
    },
  }
}
</script>

<style>
@import 'https://unpkg.com/leaflet-routing-machine@latest/dist/leaflet-routing-machine.css'
</style>