import { createApp } from 'vue'
import { createPinia } from 'pinia'
import router from './router'
import App from './App.vue'
import './assets/main.css'

const app = createApp(App)
const pinia = createPinia()
app.use(pinia)
app.use(router)

// Initialize Supabase Auth session & initial data
import { useAuthStore } from './stores/auth'
import { useProductsStore } from './stores/products'
const auth = useAuthStore()
const productsStore = useProductsStore()
auth.initAuth()
productsStore.fetchProducts()

app.mount('#app')

