<template>
  <div class="q-ma-xl">
    <h4>Login</h4>
    <q-form>
      <q-input type="email" class="q-pb-sm" filled v-model="email" label="Email" />
      <q-input type="password" class="q-pb-sm" filled v-model="password" label="Password" />
      <div class="row">
        <div class="row items-center">
          <p class="q-ma-none q-pr-sm">No account? </p>
          <q-btn color="primary" label="Register" outline @click="$router.push('/register')" />
        </div>
        <q-space />
        <q-btn color="primary" label="Submit" @click="doLogin()" />
      </div>
    </q-form>
  </div>
</template>
<script>
import { notifyHandler } from 'src/misc/helpers'
import { useAuthStore } from 'src/stores/auth'

export default {
  name: 'Login-page',
  setup() {
    const authStore = useAuthStore()
    return {
      authStore
    }
  },
  data() {
    return {
      email: null,
      password: null
    }
  },
  methods: {
    async doLogin() {
      const success = await this.authStore.doLogin(this.email, this.password)
      if (success) {
        this.$router.push('/')
        notifyHandler('positive', `Successfully logged in. Welcome, ${this.authStore.user.username}`)
      }

    }
  }
}
</script>