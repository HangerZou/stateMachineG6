<template>
  <div class="home">
<!--    <img alt="Vue logo" src="../assets/logo.png">-->
<!--    <HelloWorld msg="Welcome to Your Vue.js App"/>-->
    <state-machine-view :data="demoData" :height="600" :users="candidateUsers" :groups="candidateGroups" :categorys="categorys" :lang="lang"></state-machine-view>
  </div>
</template>

<script>
// @ is an alias to /src
import HelloWorld from '@/components/HelloWorld.vue'
import StateMachineView from "@/views/stateMachine/StateMachineView";

export default {
  name: 'HomeView',
  components: {
    StateMachineView,
    HelloWorld
  },
  data () {
    return {
      modalVisible:false,
      lang: "zh",
      demoData: {
        nodes: [{ id: 'startNode1',label: '', clazz: 'start', },
          { id: 'startNode2', label: '', clazz: 'timerStart', },
          { id: 'taskNode1', label: '主任审批', clazz: 'userTask',  },
          { id: 'taskNode2', label: '经理审批', clazz: 'scriptTask', active:true },
          { id: 'gatewayNode',  label: '金额大于1000', clazz: 'gateway',  },
          { id: 'taskNode3',  label: '董事长审批', clazz: 'receiveTask', },
          { id: 'catchNode1', label: '等待结束', clazz: 'signalCatch', },
          { id: 'endNode',  label: '', clazz: 'end', }],
        edges: [{ source: 'startNode1', target: 'taskNode1', clazz: 'flow' },
          { source: 'startNode2', target: 'gatewayNode', clazz: 'flow' },
          { source: 'taskNode1', target: 'catchNode1', clazz: 'flow' },
          { source: 'taskNode1', target: 'taskNode2', clazz: 'flow' },
          { source: 'taskNode2', target: 'gatewayNode', clazz: 'flow' },
          { source: 'taskNode2', target: 'taskNode1',  clazz: 'flow' },
          { source: 'gatewayNode', target: 'taskNode3', clazz: 'flow' },
          { source: 'gatewayNode', target: 'endNode', clazz: 'flow'},
          { source: 'taskNode3', target: 'endNode', clazz: 'flow' },
          { source: 'catchNode1', target: 'endNode', clazz: 'flow' }]
      },
      demoData1:{
        nodes: [{ id: 'startNode1', x: 50, y: 200, label: '', clazz: 'start', },
          { id: 'startNode2', x: 50, y: 320, label: '', clazz: 'timerStart', },
          { id: 'taskNode1', x: 200, y: 200, label: '主任审批', clazz: 'userTask',  },
          { id: 'taskNode2', x: 400, y: 200, label: '经理审批', clazz: 'scriptTask', active:true },
          { id: 'gatewayNode', x: 400, y: 320, label: '金额大于1000', clazz: 'gateway',  },
          { id: 'taskNode3', x: 400, y: 450, label: '董事长审批', clazz: 'receiveTask', },
          { id: 'catchNode1', x: 600, y: 200, label: '等待结束', clazz: 'signalCatch', },
          { id: 'endNode', x: 600, y: 320, label: '', clazz: 'end', }],
        edges: [{ source: 'startNode1', target: 'taskNode1', sourceAnchor:1, targetAnchor:3, clazz: 'flow' },
          { source: 'startNode2', target: 'gatewayNode', sourceAnchor:1, targetAnchor:3, clazz: 'flow' },
          { source: 'taskNode1', target: 'catchNode1', sourceAnchor:0, targetAnchor:0, clazz: 'flow' },
          { source: 'taskNode1', target: 'taskNode2', sourceAnchor:1, targetAnchor:3, clazz: 'flow' },
          { source: 'taskNode2', target: 'gatewayNode', sourceAnchor:1, targetAnchor:0, clazz: 'flow' },
          { source: 'taskNode2', target: 'taskNode1', sourceAnchor:2, targetAnchor:2, clazz: 'flow' },
          { source: 'gatewayNode', target: 'taskNode3', sourceAnchor:2, targetAnchor:0, clazz: 'flow' },
          { source: 'gatewayNode', target: 'endNode', sourceAnchor:1, targetAnchor:2, clazz: 'flow'},
          { source: 'taskNode3', target: 'endNode', sourceAnchor:1, targetAnchor:1, clazz: 'flow' },
          { source: 'catchNode1', target: 'endNode', sourceAnchor:1, targetAnchor:0, clazz: 'flow' }]
      },
      candidateUsers: [{id:'1',name:'Tom'},{id:'2',name:'Steven'},{id:'3',name:'Andy'}],
      candidateGroups: [{id:'1',name:'Manager'},{id:'2',name:'Security'},{id:'3',name:'OA'}],
      categorys: [{id:'1',name:'Common'},{id:'2',name:'Subsidy'},{id:'3',name:'Maintain'}],
    }
  },
}
</script>
