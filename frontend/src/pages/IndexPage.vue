<!-- TODO error handling -->

<template>
  <q-page class="q-ma-xl column items-center">
    <h1>Fluber Home</h1>

    <q-input
      style="width: 100%"
      label="Where to? (type address)"
      v-model="destinationAddress"
      clearable
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
            <q-btn label="Select" @click="addDestination(r)" />
          </td>
        </tr>
      </tbody>
    </q-markup-table>

    <div v-if="confirmedDestinations.length > 0">
      <h6 class="q-mb-none">Current trip's selected destinations</h6>
      <q-markup-table wrap-cells>
        <tbody>
          <tr v-for="(d, index) of confirmedDestinations" :key="d">
            <td>{{ index + 1 }}</td>
            <td>
              {{ d.display_name }}
            </td>
            <td>
              <q-btn label="Remove" @click="removeDestination(index)" />
            </td>
          </tr>
        </tbody>
      </q-markup-table>
    </div>

    <q-btn
      v-if="confirmedDestinations.length > 0"
      :label="confirmTripLabel"
      class="q-my-md"
      @click="confirmTrip()"
    />

    <!-- TODO is the home page going straight to the map? -->
    <MapComponent
      v-if="rideConfirmed"
      :destinations="confirmedDestinations"
      :user-coords="userCoords"
      @route-to-use="(e) => setRouteToUse(e)"
    />
    <q-btn
      v-if="confirmedDestinations.length > 0 && routeToUse"
      label="Order Ride"
      color="primary"
      class="q-mt-md"
      @click="orderRide()"
    />
    <q-btn v-for="request of locStore.location" :key="request"
      label="In Progress"
      color="secondary"
      class="q-mt-md"
      @click="showRideProgress(request)"
    />
    <q-dialog v-model="requestMoreInfoOpen">
      <q-card>
        <q-card-section>
          <h6 class="q-my-sm">Driver Location Updates</h6>
          <MapComponent
            :destinations="viewingMoreRide.route.waypoints"
            :user-coords="userCoords"
            :is-driver-mode="true"
          />
        </q-card-section>
        <q-card-actions class="row justify-between">
          <q-btn flat label="Back" v-close-popup />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </q-page>
  
</template>

<script>
import MapComponent from '../components/MapComponent.vue'
import { NominatimJS } from 'nominatim-js'
import { notifyHandler, sleep, ensureVariableDefined } from 'src/misc/helpers'
import SocketioService from '../services/socketio.service.js'
import { Loading } from 'quasar'
import { useLocationStore } from 'src/stores/loc'

export default {
  name: 'IndexPage',
  setup(){
    const locStore = useLocationStore()
    return{
      locStore,
    }
  },
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
      confirmedDestinations: [],
      rideConfirmed: false,
      loadingSearch: false,
      userCoords_: null,
      requestMoreInfoOpen: false,
      viewingMoreRide: null,
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
    driverCoords:{
      set(val){
        console.log('setting driverCoords: ', val)
        this.driverCoords_ = val
      },
      get(){
        console.log('getting driverCoords: ', this.driverCoords_)
        return this.driverCoords_
      }
    },
    //FIXME if we add a destination and remove one before the call to `confirmTrip()`,
    //the button will read 'Confirm Trip Change' (after addition) then 'Confirm Trip'
    //(after removal), but should always read 'Confirm Trip Change'
    confirmTripLabel() {
      const defaultLabel = 'Confirm Trip'
      const changeLabel = 'Confirm Trip Change'

      if (this.confirmedDestinations.length > 0 && !this.routeToUse) {
        return defaultLabel
      } else if (
        this.confirmedDestinations.length > 0 &&
        this.routeToUse &&
        //minus 1 as the `inputWaypoints` also contain the source location, but we're
        //trying to compare the destinations
        this.routeToUse.inputWaypoints.length - 1 < this.confirmedDestinations.length
      ) {
        return changeLabel
      } else {
        return defaultLabel
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
          if (err.code === 1) {
            notifyHandler('negative', 'Failed to get location, please ensure you have it enabled and have given permission')
          }
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
        //TODO add 'country' param (derive from current location / source location)
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
    addDestination(destination) {
      //TODO don't allow adding destinations that are too close together - quick solution
      //is to use the `place_id` or something, but bette solution would be to use the
      //`boundingbox` coordinates to check distances using external library
      console.log('adding destination: ', destination)
      this.confirmedDestinations.push(destination)
    },
    removeDestination(index) {
      this.confirmedDestinations.splice(index, 1)
    },
    setRouteToUse(route) {
      console.log('set route to use: ', route)
      this.routeToUse = route
    },
    async confirmTrip() {
      Loading.show()
      let returnEarly = false
      await ensureVariableDefined(
        this.userCoords,
        (coords) => !!coords,
        5000
      )
      .catch(err => {
        console.error(err)
        notifyHandler('negative', 'We\'re having trouble getting your location. Please try again.')
        Loading.hide()
        returnEarly = true
      })
      if (returnEarly) return
      if (this.rideConfirmed) {
        //ride already been confirmed so we're adding/removing a destination
        this.rideConfirmed = false
        await sleep(1000)  //enough delay so that the MapComponent can unmount/mount
        this.rideConfirmed = true
      } else {
        this.rideConfirmed = true
      }
      Loading.hide()
    },
    orderRide() {
      SocketioService.requestRide({route: this.routeToUse, user: this.id})
      this.rideConfirmed = false
      this.confirmedDestinations.length = 0
      this.searchResults = ""
    },

    showRideProgress(request){
      this.viewingMoreRide = request
      this.requestMoreInfoOpen = true
      console.log('RECEIVED ROUTE', this.viewingMoreRide.route)
      this.locStore.location = null
    },
  },
}
</script>
