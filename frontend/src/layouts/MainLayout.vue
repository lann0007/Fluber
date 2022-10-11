<template>
  <q-layout view="lHh Lpr lFf">
    <q-header elevated>
      <q-toolbar>
        <q-btn flat dense round icon="menu" aria-label="Menu" @click="toggleLeftDrawer" />

        <q-toolbar-title>
          Fluber
        </q-toolbar-title>

        <q-btn v-if="!authStore.user" label="Login" icon="account_circle" flat @click="$router.push('/login')" />
        <div v-else>
          <q-btn-dropdown stretch flat icon="account_circle" :label="authStore.user.username">
            <q-list>
              <q-item v-close-popup clickable @click="$router.push('/profile')">
                <q-item-section>
                  <q-item-label>Profile</q-item-label>
                </q-item-section>
              </q-item>
              <q-item v-close-popup clickable @click="doLogout">
                <q-item-section>
                  <q-item-label>Log out</q-item-label>
                </q-item-section>
              </q-item>
            </q-list>
          </q-btn-dropdown>
        </div>
      </q-toolbar>
    </q-header>

    <q-drawer v-model="leftDrawerOpen" show-if-above bordered>
      <q-list class="column items-center">
        <q-item-label header>
          Navigation
        </q-item-label>

        <EssentialLink v-for="link in essentialLinks" :key="link.title" v-bind="link" />
        <div class="fixed-bottom row justify-center q-mb-md">
          <q-btn label="Toggle Dark Mode" @click="$q.dark.toggle()" />
        </div>        
      </q-list>
    </q-drawer>

    <q-page-container>
      <router-view />
    </q-page-container>
  </q-layout>
</template>

<script>
import { defineComponent, ref } from 'vue'
import EssentialLink from 'components/EssentialLink.vue'
import { useAuthStore } from 'src/stores/auth'
import { notifyHandler } from 'src/misc/helpers'
import SocketioService from '../services/socketio.service.js'

const linksList = [
  {
    title: 'Home',
    caption: 'Main page',
    icon: 'home',
    link: '/'
  },
  {
    title: 'Ride History',
    caption: 'Past rides',
    icon: 'directions_car',
    link: '/#/ride-history'
  }
]

export default defineComponent({
  name: 'MainLayout',
  components: {
    EssentialLink
  },
  setup() {
    const leftDrawerOpen = ref(false)
    const authStore = useAuthStore()

    return {
      essentialLinks: linksList,
      leftDrawerOpen,
      toggleLeftDrawer() {
        leftDrawerOpen.value = !leftDrawerOpen.value
      },
      authStore
    }
  },
  mounted() {
    this.openMessageSocket()
  },
  updated() {
    this.openMessageSocket()
  },
  methods: {
    doLogout() {
      this.$router.push('/login')
      this.authStore.doLogout()      
      notifyHandler('positive', 'Successfully logged out')      
    },
    openMessageSocket() {
      if(!SocketioService.socketIsOpen()) {
        SocketioService.setupSocketConnection(this.authStore.authToken, this.authStore.user)
        SocketioService.subscribeToMessages((err, data) => {
          // this.messages.push(data)
          this.msgStore.addMessage({
            message,
            id: this.authStore.user.id,
            name: this.authStore.user.username
          })
        })
      }
    }
  }
})
</script>
