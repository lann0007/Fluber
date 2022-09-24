<template>
  <div class="q-ma-xl">
    <h4>Login</h4>
    <q-form>
      <q-input type="email" class="q-pb-sm" filled v-model="username" label="Email" />
      <q-input type="password" class="q-pb-sm" filled v-model="password" label="Password" />
      <q-btn color="primary" style="float:right" label="Submit" @click="doLogin()"></q-btn>
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
      username: null,
      password: null
    }
  },
  methods: {
    async doLogin() {
      const success = await this.authStore.doLogin(this.username, this.password)
      if (success) {
        this.$router.push('/')
        notifyHandler('positive', `Successfully logged in. Welcome, ${this.authStore.user.username}`)
      }

    }
  }
}
</script>