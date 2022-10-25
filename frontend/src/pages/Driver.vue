<template>
  <div class="q-ma-sm">
    <h6>Pending Ride Requests</h6>
    <!-- TODO sort by closest - i.e., passengers/pickup point is near Driver -->
    <!-- initial summary table w/ not much info -->
    <q-markup-table wrap-cells dense>
      <thead>
        <tr style="font-weight: bold">
          <td>User</td>
          <td>Distance</td>
          <td>Time</td>
        </tr>
      </thead>
      <tbody>
        <tr v-for="request of ephemeralStore.rideRequests" :key="request">
          <td>
            {{ request.user.username }}
          </td>
          <td>
            {{ `${Math.round(request.route.summary.totalDistance / 1000)}km` }}
          </td>
          <td>
            {{ `${Math.round(request.route.summary.totalTime / 60)}min` }}
          </td>
          <td>
            <q-btn label="See More" @click="seeMoreRide(request)" />
          </td>
        </tr>
      </tbody>
    </q-markup-table>

    <!-- modal that displays more information and the map with the plotted route -->
    <q-dialog v-model="requestMoreInfoOpen">
      <q-card>
        <q-card-section>
          <h6 class="q-my-sm">Source Location</h6>
          {{ viewingMoreRide.route.waypoints[0].display_name }}

          <h6 class="q-my-sm">Destination(s)</h6>
          <ol>
            <li v-for="waypoint of viewingMoreRide.route.waypoints" :key="waypoint">
              {{ waypoint.display_name }}
            </li>
          </ol>

          <MapComponent
            :destinations="viewingMoreRide.route.waypoints"
            :user-coords="userCoords"
            :is-driver-mode="true"
          />
        </q-card-section>
        <q-card-actions class="row justify-between">
          <q-btn flat label="Back" v-close-popup />
          <q-btn label="Accept Ride" color="primary" v-close-popup @click="acceptRideRequest()" />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </div>
</template>

<script>
import socketioService from 'src/services/socketio.service'
import { useEphemeralStore } from 'src/stores/ephemeral'
import MapComponent from '../components/MapComponent.vue'
import { useAuthStore } from 'src/stores/auth'
import { useRideStateStore } from 'src/stores/rideState'


export default {
  name: 'Driver-page',
  components: {
    MapComponent
  },
  mounted() {
    this.startLocationUpdates()
  },
  unmounted() {
    this.stopLocationUpdates()
  },
  setup() {
    const authStore = useAuthStore()
    const ephemeralStore = useEphemeralStore()
    const rideStateStore = useRideStateStore()
    console.log('rideRequests: ', ephemeralStore.rideRequests)
    return {
      ephemeralStore,
      authStore,
      rideStateStore,
    }
  },
  data() {
    return {
      requestMoreInfoOpen: false,
      //when we 'see more', want to keep track of what we're viewing so the modal has
      //access to the data
      viewingMoreRide: null,
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
    seeMoreRide(request) {
      console.log('seeMoreRide() request: ', request)
      this.requestMoreInfoOpen = true
      this.viewingMoreRide = request
    },
    acceptRideRequest() {
      console.log('accepting ride request: ', this.viewingMoreRide)
      socketioService.joinRoom({roomName: this.viewingMoreRide.user,user: this.authStore.user, route: this.viewingMoreRide}, cb =>{
        console.log(cb)
        //persist the trip ID
        //TODO clear trip ID after ride has ended
        this.rideStateStore.setTripId(cb.tripId)
        console.log('set trip ID: ', this.rideStateStore.getTripIp())
      })
    },
  }
}
</script>