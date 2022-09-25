<template>
  <div class="q-ma-xl">
    <h4>Profile</h4>
    <div class="row items-center q-mb-md">
      <q-img class="col-6" style="border-radius: 50%;" :src="profilePicture" />
      <h5 style="text-align: center;" class="col-6 q-ma-none">{{ authStore.user.username }}</h5>
    </div>
    <div class="row justify-between">
      <q-file outlined v-model="newPfp" accept="image/*" label="Change Picture" clearable class="q-my-md col-8">
        <template v-slot:prepend>
          <q-icon name="attach_file" />
        </template>
      </q-file>
      <q-btn :disabled="!newPfp" label="Change Picture" class="q-my-md col-3" @click="uploadPfp()" />
    </div>
    <q-markup-table wrap-cells flat bordered>
      <tbody>
        <tr v-for="d in mappedUserData" :key="d.key">
          <td style="width: 35%">{{ d.key }}</td>
          <td style="width: 65%">{{ d.value }}</td>
        </tr>
      </tbody>
    </q-markup-table>

    <q-separator v-if="mappedDriverProfile" class="q-my-md" />
    <q-expansion-item
      v-if="mappedDriverProfile"
      label="Driver Profile"
      header-style="font-size: 1.5em; border: solid 1px #ddd"
    >
      <q-markup-table wrap-cells flat bordered>
        <tbody>
          <tr v-for="d in mappedDriverProfile" :key="d.key">
            <td style="width: 35%">{{ d.key }}</td>
            <td style="width: 65%">{{ d.value }}</td>
          </tr>
        </tbody>
      </q-markup-table>
      <q-separator class="q-my-md" />
      <h6>Identification</h6>
      <q-img :src="driverIdentification" />
    </q-expansion-item>
  </div>
</template>

<script>
import { useAuthStore } from 'src/stores/auth'
import axios from 'axios'
import * as c from 'src/misc/constants'
import { notifyHandler } from 'src/misc/helpers'

export default {
  name: 'Profile-page',
  async mounted() {
    await this.fetchUserPfp()
    await this.fetchDriverProfile()
  },
  setup() {
    const authStore = useAuthStore()
    return {
      authStore,
    }
  },
  data() {
    const userData = this.authStore.user
    const mappedUserData = [
      { key: 'Email', value: userData.email },
      { key: 'Member since', value: userData.createdAt },
    ]

    return {
      mappedUserData,
      mappedDriverProfile: null,
      driverIdentification: null,
      //source: https://upload.wikimedia.org/wikipedia/commons/8/89/Portrait_Placeholder.png
      profilePicture: require('src/assets/placeholder_pfp.png'),
      newPfp: null
    }
  },
  methods: {
    async fetchDriverProfile () {
      if(this.authStore.user.role.type === 'driver') {
        this.mappedDriverProfile = [
          { key: 'First name', value: this.authStore.user.driverProfile.firstName },
          { key: 'Last name', value: this.authStore.user.driverProfile.lastName },
          { key: 'License number', value: this.authStore.user.driverProfile.licenseNumber },
          { key: 'Vehicle registration', value: this.authStore.user.driverProfile.vehicleRegistration },
          { key: 'Driver since', value: this.authStore.user.driverProfile.createdAt },
        ]

        //we simply populate the relation to the identification image, which itself
        //stores a link to a blob container
        this.driverIdentification = `${c.coreApiBaseUrl}${this.authStore.user.driverProfile.identification.url}`
      }
    },
    async uploadPfp() {
      const formData = new FormData()
      formData.append('files', this.newPfp, this.newPfp.name)

      //upload the file to the media library
      const resp = await axios
        .post(`${c.coreApiBaseUrl}/api/upload`, formData, {
          headers: {
            Authorization: `Bearer ${this.authStore.authToken}`,
            'Content-Type': `multipart/form-data`,
          },
        })
        .catch((err) => {
          console.error(err.response)
          notifyHandler('negative', 'Failed to upload new profile picture', err.response.statusText)
          return
        })

      //then make the link with the User's profile
      const res = await axios
        .put(`${c.coreApiBaseUrl}/api/users/${this.authStore.user.id}`, {
          profilePicture: resp.data[0].id
        }, {
          headers: {
            Authorization: `Bearer ${this.authStore.authToken}`
          }
        })
        .catch((err) => {
          console.error(err.response)
          notifyHandler('negative', 'Failed to upload new profile picture', err.response.statusText)
          return
        })

      if (res.status === 200) {
        this.newPfp = null
        await this.fetchUserPfp()
        notifyHandler('positive', 'Successfully updated profile picture')
      }
    },
    async fetchUserPfp() {
      if (!this.authStore.user.profilePicture) {
        //double-check api for pfp (should have been gotten on login)
        const userData = await axios
          .get(`${c.coreApiBaseUrl}/api/users/me?populate=profilePicture`, {
            headers: {
              Authorization: `Bearer ${this.authStore.authToken}`
            }
          })
          .catch((err) => {
            console.error(err.response)
          })
        //we simply populate the relation to the image, which itself stores a link to a
        //blob container
        if (userData.data.profilePicture) {
          this.profilePicture = `${c.coreApiBaseUrl}${userData.data.profilePicture.url}`
        }
      } else {
        this.profilePicture = `${c.coreApiBaseUrl}${this.authStore.user.profilePicture.url}`
      }
    },
  },
}
</script>