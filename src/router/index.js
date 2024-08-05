import Vue from 'vue'
import VueRouter from 'vue-router'
import HomeView from '../views/stateMachine/HomeView.vue'

Vue.use(VueRouter)

const routes = [
  {
    path: '/',
    name: 'home',
    component: HomeView
  },
  {
    path: '/graph/:direction/:theme/:zoomRate/:currentStates',
    name: 'graph',
    // route level code-splitting
    // this generates a separate chunk (about.[hash].js) for this route
    // which is lazy-loaded when the route is visited.
    component: () => import('../views/StateMachine')
  },
  // {
  //   path: '/m/:direction/:theme/:zoomRate/:currentStates',
  //   name: 'about',
    // route level code-splitting
    // this generates a separate chunk (about.[hash].js) for this route
    // which is lazy-loaded when the route is visited.
  //   component: () => import(/* webpackChunkName: "about" */ '../components/AutoStateMachine.vue')
  // },
  {
    path: '/diy',
    name: 'diy',
    // route level code-splitting
    // this generates a separate chunk (about.[hash].js) for this route
    // which is lazy-loaded when the route is visited.
    component: () => import(/* webpackChunkName: "about" */ '../views/stateMachine/AutoDIYST.vue')
  }

]

const router = new VueRouter({
  mode: 'history',
  base: '/stateMachine/',
  routes: routes})

export default router
