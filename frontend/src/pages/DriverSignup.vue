<!-- TODO how do we want to handle approval process? There's no use case for it but I imagine the Admin would have to action it? We could just skip doing the approval for the demo and have it as future work -->
<template>
  <div class="q-ma-xl">
    <h4>Driver Signup</h4>
    <q-form>
      <div v-for="f in formFields" :key="f.fieldName">
        <q-input v-if="f.type === 'text' || f.type === 'textarea'" :label="f.field" :type="f.type" v-model="dataObj[f.fieldName]" />
        <q-file accept="image/*" v-else-if="f.type === 'file'" :label="f.field" v-model="dataObj[f.fieldName]" >
          <template v-slot:prepend>
            <q-icon name="attach_file" />
          </template>
        </q-file>
      </div>
      <div class="row justify-end q-mt-sm" >
        <q-btn label="Submit" color="primary" @click="submit()" :loading="submitting" />
      </div>
    </q-form>
  </div>
</template>

<script>
import { useAuthStore } from 'src/stores/auth'
import axios from 'axios'
import * as c from 'src/misc/constants'
import { notifyHandler } from 'src/misc/helpers'

export default {
  name: 'Driver-signup',
  setup() {
    const authStore = useAuthStore()
    return {
      authStore,
    }
  },
  data() {
    const formFields = [
      { field: 'First name', fieldName: 'firstName', type: 'text' },
      { field: 'Last name', fieldName: 'lastName', type: 'text' },
      { field: 'License number', fieldName: 'licenseNumber', type: 'text' },
      { field: 'Vehicle registration', fieldName: 'vehicleRegistration', type: 'text' },
      { field: 'Driver identification', fieldName: 'identification', type: 'file' },
    ]
    return {
      formFields,
      dataObj: {},
      submitting: false
    }
  },
  methods: {
    //TODO rollback previous `post` or `put` calls when a given call fails (causing the function to exit without completion)
    async submit() {
      this.submitting = true
      const data = this.formFields.reduce((accum, curr) => {
        if(curr.fieldName && this.dataObj[curr.fieldName] && curr.type !== 'file') {
          accum[curr.fieldName] = this.dataObj[curr.fieldName]
        }

        return accum
      }, {})

      //even though this page's route is protected, double-check not already driver
      if(this.authStore.user.driverProfile) {
        notifyHandler('warning', 'You are already a driver, cannot sign up again')
        this.$router.push('/profile')
        this.submitting = false
        return
      }

      //send the identification first
      const fileField = this.formFields.find(o => o.type === 'file')
      if (
        this.dataObj[fileField.fieldName]
      ) {
        const formData = new FormData()
        formData.append('files', this.dataObj[fileField.fieldName], this.dataObj[fileField.fieldName].name)
        const res = await axios
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
        if (res && res.status === 200) {
          //now assign the reference of the file to the record to be sent
          data[fileField.fieldName] = res.data[0].id
        } else {
          this.submitting = false
          return
        }
      }

      const respDriverProfile = await axios
        .post(`${c.coreApiBaseUrl}/api/driver-profiles`, { data }, {
          headers: {
            Authorization: `Bearer ${this.authStore.authToken}`,
          },
        })
        .catch((err) => {
          console.error(err.response)
          notifyHandler('negative', 'Failed to sign up as driver', err.response.data.error.message)
          return
        })
      if (respDriverProfile && respDriverProfile.status === 200) {
        const roles = await axios
          //for some reason filtering on the REST interface isn't working for roles (but
          //is for other things), so grab all roles and do filtering on client
          .get(`${c.coreApiBaseUrl}/api/users-permissions/roles`, {
            headers: {
              Authorization: `Bearer ${this.authStore.authToken}`,
            },
          })
          .catch((err) => {
            console.error(err.response)
            notifyHandler('negative', 'Failed to get roles', err.response.data.error.message)
            return
          })
        let driverRole = null
        if (roles && roles.status === 200) {
          driverRole = roles.data.roles.find(o => o.name === 'Driver' && o.type === 'driver')
        } else {
          this.submitting = false
          return
        }

        //now update the user's role to `driver`
        const respUserUpdated = await axios
          .put(`${c.coreApiBaseUrl}/api/users/${this.authStore.user.id}`,
            {
              role: driverRole.id,
              driverProfile: respDriverProfile.data.data.id
            },
            {
              headers: {
                Authorization: `Bearer ${this.authStore.authToken}`,
              },
            }
          )
          .catch((err) => {
            console.error(err.response)
            notifyHandler('negative', 'Failed to update user role', err.response.data.error.message)
            return
          })
        if (respUserUpdated && respUserUpdated.status === 200) {
          //finally, refresh the user's profile
          const success = await this.authStore.getUserProfile()
            .catch((err) => {
              console.error(err)
              notifyHandler('negative', 'Failed to retrieve user profile after driver signup. You may need to re-login for changes to take affect', err.message)
              return
            })
          if(success) {
            notifyHandler('positive', 'Successfully signed up as driver')
            this.$router.push('/profile')
          } else {
            this.submitting = false
          }
        } else {
          this.submitting = false
          return
        }
      } else {
        this.submitting = false
        return
      }
    }
  }
}
</script>