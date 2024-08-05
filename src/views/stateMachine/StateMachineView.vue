<template>
  <div class="container">
    <toolbar-panel ref="toolbar"></toolbar-panel>
    <div style="display: flex">
      <item-panel ref="addItemPanel" :height="height"></item-panel>
      <div ref="canvas" class="canvasPanel" :style="{'height':height+'px','width':isView?'100%':'70%','border-bottom':isView?0:null}"></div>

    </div>
    <div></div>
  </div>
</template>
<script>
import ToolbarPanel from "@/views/stateMachine/ToolbarPanel"
import Command from '../../plugins/command'
import Toolbar from '../../plugins/toolbar'
import AddItemPanel from '../../plugins/addItemPanel'
import CanvasPanel from '../../plugins/canvasPanel'
import i18n from '../../locales'
import G6 from '@antv/g6/lib';
import { getShapeName } from '../../util/clazz'
import registerShape from "@/shape";
import registerBehavior from '@/behavior'
import ItemPanel from "@/views/stateMachine/ItemPanel";
registerShape(G6);
registerBehavior(G6);
export default {
  name: 'StateMachineView',
  components: {ItemPanel, ToolbarPanel},
  provide() {
    return {
      i18n: i18n['zh']
    }
  },
  props: {
    isView: {
      type: Boolean,
      default: false,
    },
    mode: {
      type: String,
      default: "edit"
    },
    height: {
      type: Number,
      default: 800,
    },
    lang: {
      type: String,
      default: "zh"
    },
    data: {
      type: Object,
      default: () => ({nodes:[],edges:[]})
    },
    users: {
      type: Array,
      default: () => ([])
    },
    groups: {
      type: Array,
      default: () => ([])
    },
    categorys: {
      type: Array,
      default: () => ([])
    }
  },
  data() {
    return {
      resizeFunc: ()=>{},
      selectedModel: {},
      processModel: {
        id: '',
        name: '',
        category: '',
        clazz: 'process',
        dataObjs: [],
        signalDefs: [],
        messageDefs: [],
      },
      graph:null,
      cmdPlugin: null,
    };
  },
  mounted() {
    const plugins = [
    ]
    this.cmdPlugin = new Command();
    const width = this.$refs['canvas'].offsetWidth;
    const toolbar = new Toolbar({container:this.$refs['toolbar'].$el});
    const addItemPanel = new AddItemPanel({container:this.$refs['addItemPanel'].$el});
    // const canvasPanel = new CanvasPanel({container:this.$refs['canvas']});
    plugins.push(this.cmdPlugin);
    plugins.push(toolbar);
    // plugins.push(addItemPanel);
    // plugins.push(canvasPanel);
    this.graph = new G6.Graph({
      plugins: plugins,
      container: this.$refs['canvas'],
      height: this.height,
      width: width,
      modes: {
        default: ['drag-canvas', 'clickSelected'],
        view: [ ],
        edit: [ 'drag-canvas', 'hoverNodeActived','hoverAnchorActived','dragNode','dragEdge',
          'dragPanelItemAddNode','clickSelected','deleteItem','itemAlign','dragPoint','brush-select'],
      },
      defaultEdge: {
        shape: 'flow-polyline-round',
      },
    });
    this.graph.setMode('edit');
    this.graph.data(this.initShape(this.data));
    this.graph.render();
  },
  methods: {
    initShape(data){
      if(data && data.nodes){
        return {
          nodes: data.nodes.map(node => {
            return {
              shape: getShapeName(node.clazz),
              ...node,
            }
          }),
          edges: data.edges
        }
      }
      return data;
    },
  }

}
</script>
<style scoped>
.container {
  width: 100%;
  height: 100%;
  background-color: #fff;
  display: block;
}
.canvasPanel {
  flex: 0 0 auto;
  float: left;
  width:70%;
  background-color: #fff;
  border-bottom: 1px solid #E9E9E9;
}
</style>
