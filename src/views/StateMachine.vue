<template>
  <auto-state-machine
      :response="data"
      :graph-direction="layoutDir"
      :current-theme="theme"
      :zoom-rate="zoomRate"
      :current-states="currentStates"
  ></auto-state-machine>
</template>

<script>
import AutoStateMachine from '@/components/AutoStateMachine';
export default {
  name: 'StateMachine',
  components: {AutoStateMachine},
  data () {
    return {
      layoutDir: this.$route.params.direction || 'LR', // LR,TB,RL,BT 布局方向
      theme:  this.$route.params.theme || 'eye', // default,dark,light,eye 主题
      zoomRate: this.$route.params.zoomRate || -1,
      currentStates: this.$route.params.currentStates || '',
      data: {
        "code": "200",
        "message": "成功",
        "data": {
          "data": {
            "states": {
              "CREATED": {
                "level": 1,
                "branch": 2,
                "comment": "创建"
              },
              "RELEASED": {
                "level": 2,
                "branch": 2,
                "comment": "发布"
              },
              "STOPED": {
                "level": 3,
                "branch": 2,
                "comment": "停止"
              },
              "MODIFIED": {
                "level": 3,
                "branch": 1,
                "comment": "修订"
              },
              "DELETED": {
                "level": 999,
                "branch": 0,
                "comment": "删除"
              }
            },
            "actions": {
              "REUSE": "复活API",
              "DELETE": "删除API",
              "MODIFIE": "修改API",
              "STOP": "停止API",
              "UPGRADE": "升级API",
              "RELEASE": "发布API",
              "Drop": "废除API"
            },
            "transitions": [
              {
                "fromState": "CREATED",
                "action": "RELEASE",
                "toState": "RELEASED"
              },
              {
                "fromState": "RELEASED",
                "action": "MODIFIE",
                "toState": "MODIFIED"
              },
              {
                "fromState": "MODIFIED",
                "action": "UPGRADE",
                "toState": "RELEASED"
              },
              {
                "fromState": "RELEASED",
                "action": "STOP",
                "toState": "STOPED"
              },
              {
                "fromState": "STOPED",
                "action": "REUSE",
                "toState": "MODIFIED"
              },
              {
                "fromState": "STOPED",
                "action": "DELETE",
                "toState": "DELETED"
              },
              {
                "fromState": "CREATED",
                "action": "Drop",
                "toState": "DELETED"
              }
            ],
            "startStates": [
              "CREATED"
            ],
            "endStates": [
              "DELETED"
            ]
          }
        },
        "dataCount": 1
      }
    }
   }
}
</script>

<style scoped>

</style>