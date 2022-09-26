<template>
  <div class="q-ma-xl">
    <h4>Profile</h4>
    <div class="row items-center q-mb-md">
      <q-img class="col-6" style="border-radius: 50%;" :src="profilePicture" />
      <h5 v-if="authStore.user" style="text-align: center;" class="col-6 q-ma-none">{{ authStore.user.username }}</h5>
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
          <td v-if="!d.skip" style="width: 35%">{{ d.key }}</td>
          <td v-if="!d.skip" style="width: 65%">{{ d.value }}</td>
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
      <!-- TODO do we want to be able to allow drivers to upload new identifications? If so, should their driver capabilities be disabled until the new identification is verified? -->
      <q-img :src="driverIdentification" />
    </q-expansion-item>

    <div class="row justify-center">
      <q-btn label="Edit Profile" class="q-mt-md" @click="editDialogOpen = true" />
    </div>
    <!-- TODO make dialog bigger -->
    <q-dialog v-model="editDialogOpen">
      <q-card>
        <q-card-section class="q-py-sm">
          <h5 class="q-my-sm">Edit profile information</h5>
          <p class="q-my-sm">Fill in fields to edit, leave fields blank to keep</p>
        </q-card-section>
        <q-card-section class="q-py-sm">
          <q-form>
            <div v-for="d in mappedUserData" :key="d.key">
              <q-input v-if="d.fieldName" :label="d.key" v-model="editObj[d.fieldName]" :type="d.type" />
            </div>
            <div v-if="authStore.user.role.type === 'driver'">
              <h6 class="q-mb-sm q-mt-md">Driver profile</h6>
              <div v-for="d in mappedDriverProfile" :key="d.key">
              <q-input v-if="d.fieldName" :label="d.key" v-model="editObj[d.fieldName]" :type="d.type" />
            </div>
            </div>
          </q-form>
        </q-card-section>
        <div class="row justify-between">
          <q-card-actions>
            <q-btn flat label="Cancel" v-close-popup />
          </q-card-actions>
          <q-card-actions>
            <q-btn flat label="Submit" color="primary" v-close-popup @click="submitEdit()" />
          </q-card-actions>
        </div>
      </q-card>
    </q-dialog>
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
  },
  setup() {
    const authStore = useAuthStore()
    return {
      authStore,
    }
  },
  data() {
    return {
      //source: https://upload.wikimedia.org/wikipedia/commons/8/89/Portrait_Placeholder.png
      profilePicture: require('src/assets/placeholder_pfp.png'),
      newPfp: null,
      editDialogOpen: false,
      editObj: {}
    }
  },
  computed: {
    //this needs to be computed so that the DOM will react to changes to the user data
    //(e.g., when editing the profile)
    mappedUserData() {
      const userData = this.authStore.user
      return [
        //username is already displayed by profile pic, but we need access to the model
        //  name for editing, so keep it in this object
        //`skip` is for when looping over elements in DOM and don't want them shown.
        //`fieldName` indicates it can be edited - maps to backend model name for API requests
        //TODO what fields do we want to be able to edit? - for now doing username & email
        { key: 'Username', value: this.authStore.user.username, skip: true, fieldName: 'username', type: 'text' },
        { key: 'Email', value: userData.email, fieldName: 'email', type: 'email' },
        { key: 'Member since', value: userData.createdAt },
      ]
    },
    mappedDriverProfile() {
      if(this.authStore.user.role.type === 'driver') {
        return [
          //TODO what fields do we want to be able to edit? - for now doing licenseNumber & vehicleRegistration
          { key: 'First name', value: this.authStore.user.driverProfile.firstName },
          { key: 'Last name', value: this.authStore.user.driverProfile.lastName },
          { key: 'License number', value: this.authStore.user.driverProfile.licenseNumber, fieldName: 'licenseNumber', type: 'text' },
          { key: 'Vehicle registration', value: this.authStore.user.driverProfile.vehicleRegistration, fieldName: 'vehicleRegistration', type: 'text' },
          { key: 'Driver since', value: this.authStore.user.driverProfile.createdAt },
        ]
      }
      return null
    },
    driverIdentification() {
      //we simply populate the relation to the identification image, which itself
      //stores a link to a blob container
      return `${c.coreApiBaseUrl}${this.authStore.user.driverProfile.identification.url}`
    }
  },
  methods: {
    async submitEdit() {
      const data = this.mappedUserData.reduce((accum, curr) => {
        if (curr.fieldName && this.editObj[curr.fieldName]) {
          accum[curr.fieldName] = this.editObj[curr.fieldName]
        }
        return accum
      }, {})

      //`data` can be an empty object, so simply checking it's existence isn't enough,
      //so check if it has a least one key
      if(Object.keys(data).length > 0) {
        const resp = await axios
          .put(`${c.coreApiBaseUrl}/api/users/${this.authStore.user.id}`, data, {
            headers: {
              Authorization: `Bearer ${this.authStore.authToken}`,
            },
          })
          .catch((err) => {
            console.error(err.response)
            notifyHandler('negative', 'Failed to update profile', err.response.data.error.message)
            return
          })
        if (resp && resp.status === 200) {
          const success = await this.authStore.getUserProfile()
            .catch((err) => {
              console.error(err)
              notifyHandler('negative', 'Failed to retrieve user profile after update. You may need to re-login for changes to take affect', err.message)
              return
            })
          if(success) {
            notifyHandler('positive', 'Successfully updated user profile')
          }
        }
      }

      //now do driver profile if needed
      if (this.authStore.user.role.type === 'driver') {
        const data = this.mappedDriverProfile.reduce((accum, curr) => {
          if (curr.fieldName && this.editObj[curr.fieldName]) {
            accum[curr.fieldName] = this.editObj[curr.fieldName]
          }
          return accum
        }, {})

        //`data` can be an empty object, so simply checking it's existence isn't enough,
        //so check if it has a least one key
        if (Object.keys(data).length > 0) {
          const resp = await axios
            .put(`${c.coreApiBaseUrl}/api/driver-profiles/${this.authStore.user.driverProfile.id}`,
              //strapi expects an outer `data` object for requests to non-plugin (e.g.,
              //users and permissions) endpoints
              { data }, {
              headers: {
                Authorization: `Bearer ${this.authStore.authToken}`,
              },
            })
            .catch((err) => {
              console.error(err.response)
              notifyHandler('negative', 'Failed to update driver profile', err.response.data.error.message)
              return
            })
          if (resp && resp.status === 200) {
            const success = await this.authStore.getUserProfile()
              .catch((err) => {
                console.error(err)
                notifyHandler('negative', 'Failed to retrieve user profile after update. You may need to re-login for changes to take affect', err.message)
                return
              })
            if(success) {
              notifyHandler('positive', 'Successfully updated driver profile')
            }
          }
        }
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