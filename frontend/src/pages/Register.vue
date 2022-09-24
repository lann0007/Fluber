<template>
  <div class="q-ma-xl">
    <h4>Register</h4>
    <q-form>
      <q-input type="text" class="q-pb-sm" filled v-model="username" label="Username" />
      <q-input type="email" class="q-pb-sm" filled v-model="email" label="Email" />
      <q-input type="password" class="q-pb-sm" filled v-model="password" label="Password" />
      <div class="row">
        <div class="row items-center">
          <p class="q-ma-none q-pr-sm">Already registered? </p>
          <q-btn color="primary" label="Login" outline @click="$router.push('/login')" />
        </div>
        <q-space />
        <q-btn color="primary" label="Submit" @click="doRegister()" />
      </div>
    </q-form>
  </div>
</template>
<script>
import { notifyHandler } from 'src/misc/helpers'
import { useAuthStore } from 'src/stores/auth'

export default {
  name: 'Register-page',
  setup() {
    const authStore = useAuthStore()
    return {
      authStore
    }
  },
  data() {
    return {
      username: null,
      email: null,
      password: null
    }
  },
  methods: {
    async doRegister() {
      const success = await this.authStore.doRegister(this.username, this.email, this.password)
      if (success) {
        this.$router.push('/')
        notifyHandler('positive', `Successfully registered and logged in. Welcome, ${this.authStore.user.username}`)
      }
    }
  }
}
</script>