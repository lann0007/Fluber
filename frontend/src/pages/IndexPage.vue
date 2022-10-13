<!-- TODO error handling -->
<!-- TODO multiple dropoff points -->

<template>
  <q-page class="q-ma-xl column items-center">
    <h1>Fluber Home</h1>
    <q-input
      style="width: 100%"
      label="Where to? (type address)"
      v-model="destinationAddress"
      @keydown.enter="searchDestination()"
    />
    <q-btn
      label="Search"
      color="primary"
      class="q-my-md"
      @click="searchDestination()"
      :disable="!destinationAddress"
      :loading="loadingSearch"
    />
    <q-markup-table v-if="searchResults && !confirmedDestination" wrap-cells>
      <tbody>
        <tr v-for="r of searchResults" :key="r">
          <td>
            <p>{{r.display_name}}</p>
          </td>
          <td>
            <q-btn label="Select" @click="confirmDestination(r)" />
          </td>
        </tr>
      </tbody>
    </q-markup-table>
    <!-- TODO is the home page going straight to the map? -->
    <MapComponent
      v-if="confirmedDestination"
      :destination="confirmedDestination"
      :user-coords="userCoords"
      @route-to-use="(e) => setRouteToUse(e)"
    />
    <q-btn
      v-if="confirmedDestination"
      label="Confirm Trip"
      :disable="!routeToUse"
      class="q-mt-md"
      @click="orderRide()"
    />
  </q-page>
</template>

<script>
import MapComponent from '../components/MapComponent.vue'
import { NominatimJS } from 'nominatim-js'
import { notifyHandler } from 'src/misc/helpers'

export default {
  name: 'IndexPage',
  components: {
    MapComponent,
  },
  mounted() {
    this.startLocationUpdates()
  },
  unmounted() {
    this.stopLocationUpdates()
  },
  data() {
    return {
      destinationAddress: null,
      searchResults: null,
      confirmedDestination: null,
      loadingSearch: false,
      userCoords_: null,
      routeToUse: null,
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
      console.log('Starting location updates')
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
    async searchDestination() {
      this.loadingSearch = true
      //reset page variables to start again (if there's already a selection in progress)
      this.searchResults = null
      this.confirmedDestination = null

      //use Nominatim API to translate search query into coordinates
      const resp = await NominatimJS.search({
        q: this.destinationAddress
      })
      console.log('resp: ', resp)
      if (resp.length === 0) {
        this.destinationAddress = null
        notifyHandler('negative', 'No results for search term. Please try another query')
      } else {
        this.searchResults = resp
      }
      this.loadingSearch = false
    },
    confirmDestination(destination) {
      console.log('confirming destination: ', destination)
      this.confirmedDestination = destination
    },
    setRouteToUse(route) {
      console.log('set route to use: ', route)
      this.routeToUse = route
    },
    orderRide() {
      console.log('Ordering ride... TODO')
    },
  },
}
</script>
