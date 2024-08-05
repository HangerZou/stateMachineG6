<template>
  <div>
    <div v-if="showBar" class="toolbar">
      <el-tooltip content="放大" placement="bottom">
            <span class="command" data-command="zoomIn" @click="zoomIn">
                <span class="iconfont icon-zoom-in-o"/>
            </span>
      </el-tooltip>
      <el-tooltip content="缩小" placement="bottom">
            <span class="command" data-command="zoomOut" @click="zoomOut">
                <span class="iconfont icon-zoom-out-o"/>
            </span>
      </el-tooltip>
      <el-tooltip content="实际大小" placement="bottom">
            <span class="command" data-command="undo" @click="resetZoom">
                <span class="iconfont icon-actual-size-o"/>
            </span>
      </el-tooltip>
      <el-tooltip content="适应屏幕" placement="bottom">
            <span class="command" data-command="undo" @click="autoFix">
                <span class="iconfont icon-fit"/>
            </span>
      </el-tooltip>
      <el-tooltip content="导出图片" placement="bottom">
            <span class="command" data-command="toBack"  @click="saveImg">
                <span class="iconfont icon-to-front"/>
            </span>
      </el-tooltip>
      <el-button @click="drawer = true" size="mini" type="default" style="float: right;margin-left: 16px;">
        编辑数据
      </el-button>
    </div>
    <div ref="canvas" id="graph-container" :style="{width: '100%', height: '100%', backgroundColor: theme.background}"></div>
    <el-drawer
        title=""
        :visible.sync="drawer"
        :direction="direction"
        >
      <span>
         <el-button type="primary" @click="onSubumit">提交</el-button>
        <b-code-editor v-model="jsonStr" :auto-format="true" :smart-indent="true" theme="dracula" :indent-unit="4" :line-wrap="false" ref="editor"></b-code-editor>

      </span>
    </el-drawer>
  </div>
</template>

<script>
import G6 from '@antv/g6';
import dagre from 'dagre';
import { exportImg } from "../util/bpmn"
import themes  from '../theme/theme'
import vueJsonEditor from 'vue-json-editor'

export default {
  components: { vueJsonEditor },
  name: 'AutoStateMachine',
  props: {
    zoomRate: {
      type: Number,
      default: -0.1
    },
    currentStates: {
      type: String,
      default: ''
    },
    graphDirection: {
      type: String,
      default: 'LR'
    },
    currentTheme: {
      type: String,
      default: 'default'
    },
    response: {
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
    },
  },
  data() {
    return {
      showBar: true, // 是否显示工具栏
      nodePointInfo: {}, // 暂存节点信息临时
      lineSegments: { //已画线段
        horizontal: [],
        vertical: []
      },
      nodeWidth: 150, // 节点宽度
      nodeHeight: 50, // 节点高度
      nodePadding: 300, // 节点与节点之间的间距
      linePadding: 20,// 线与线之间的间距
      virtualPadding: 16, // 锚点与虚拟节点之间的间距
      gap: 10, // 节点与边框的间距
      centerAxisX: 0,// 居中轴X
      centerAxisY: 0,// 居中轴Y
      themes, // 主题数据
      jsonStr: '',
      drawer: false,
      direction: 'rtl',
      graph: {}
    };
  },
  computed: {
    theme() {
      return this.themes[this.currentTheme];
    },
    graphData() {
      const data = this.response.data.data;

      const nodes = Object.keys(data.states).map((key) => {
        const state = data.states[key];
        const node = {
          id: key,
          label: state.comment,
          level: state.level
        };

        if (data.startStates && data.startStates.includes(key)) {
          node.type = 'begin';
        }
        if (data.endStates && data.endStates.includes(key)) {
          node.type = 'end';
        }
        if (this.currentStates && this.currentStates === key) {
          node.active = true;
        }

        return node;
      }).sort((a, b) => a.level - b.level);

      const edges = data.transitions.map((transition) => {
        return {
          source: transition.fromState,
          target: transition.toState,
          label: data.actions[transition.action] || transition.action
        };
      });
      // 根据节点的级别排序边
      edges.forEach((edge) => {
        edge.levelGap = Math.abs(nodes.find(node => node.id === edge.source).level - nodes.find(node => node.id === edge.target).level)
        console.log(edge.levelGap)
      })
      edges.sort((a, b) => a.levelGap - b.levelGap);
      // edges.sort((a, b) => {
      //   // 找到 a 和 b 的起始节点和目标节点的级别
      //   const aFromLevel = nodes.find(node => node.id === a.source).level;
      //   const aToLevel = nodes.find(node => node.id === a.target).level;
      //   const bFromLevel = nodes.find(node => node.id === b.source).level;
      //   const bToLevel = nodes.find(node => node.id === b.target).level;
      //
      //   // 使用起始节点和目标节点的最小级别来排序
      //   const aMinLevel = Math.min(aFromLevel, aToLevel);
      //   const bMinLevel = Math.min(bFromLevel, bToLevel);
      //
      //   return aMinLevel - bMinLevel;
      // });

      this.getCoord({ nodes, edges})
      if (this.graphDirection === 'RL') {
        nodes.forEach(node => {
          node.x = 2 * this.centerAxisX - node.x;
        })
        edges.forEach(edge => {
          edge.startPoint.x = 2 * this.centerAxisX - edge.startPoint.x;
          edge.endPoint.x = 2 * this.centerAxisX - edge.endPoint.x;
          edge.controlPoints.forEach(point => {
            point.x = 2 * this.centerAxisX - point.x;
          })
        })
      } else if (this.graphDirection === 'BT') {
        nodes.forEach(node => {
          node.y = 2 * this.centerAxisY - node.y;
        })
        edges.forEach(edge => {
          edge.startPoint.y = 2 * this.centerAxisY - edge.startPoint.y;
          edge.endPoint.y = 2 * this.centerAxisY - edge.endPoint.y;
          edge.controlPoints.forEach(point => {
            point.y =2 * this.centerAxisY - point.y;
          })
        })
      }
      return { nodes, edges };
    }
  },
  watch: {
    graphData: {
      deep: true,
      handler(newVal) {
        this.updateGraph(newVal);
      }
    }
  },
  mounted() {
    this.jsonStr = JSON.stringify(this.response, null, 2);
    this.initGraph();
  },
  methods: {
    initGraph() {
      const nodeExtraAttrs = {
        begin: {
          fill: this.theme.node.beginFill
        },
        end: {
          fill: this.theme.node.endFill
        }
      };
      const data = {
        nodes: [{ id: 'CREATED',label: '创建', type: 'begin', level: 1},
          { id: 'RELEASED', label: '发布' , level: 2},
          { id: 'STOPED', label: '停止', level: 3 },
          { id: 'MODIFIED', label: '修订', active:true, level: 4 },
          { id: 'DELETED',  label: '删除', type: 'end', level: 999  }],
        edges: [{ source: 'CREATED', target: 'RELEASED', label: '发布API' },
          { source: 'RELEASED', target: 'MODIFIED',label: '修改API'},
          { source: 'MODIFIED', target: 'RELEASED',label: '升级API' },
          { source: 'RELEASED', target: 'STOPED', label: '停止API'},
          { source: 'STOPED', target: 'MODIFIED', label: '复活API' },
          { source: 'STOPED', target: 'DELETED', label: '删除API' },
          { source: 'CREATED', target: 'DELETED', label: '废除API'}

        ],
      };
      const self = this;
      const dashArray = [
        [0,1],
        [0,2],
        [1,2],
        [0,1,1,2],
        [0,2,1,2],
        [1,2,1,2],
        [2,2,1,2],
        [3,2,1,2],
        [4,2,1,2]
      ];
      const interval = 9;
      const lineDash = [4, 2, 1, 2];
      G6.registerNode('operation', {
        drawShape(cfg, group) {
          const rect = group.addShape('rect', {
            attrs: {
              x: -self.nodeWidth / 2,
              y: -self.nodeHeight / 2,
              width: self.nodeWidth,
              height: self.nodeHeight,
              radius: 10,
              stroke: self.theme.node.stroke,
              fill: self.theme.node.fill,
              fillOpacity: 0.45,
              lineWidth: 2,
              ...nodeExtraAttrs[cfg.type]
            },
          });
          this.drawIcon(cfg,group);
          return rect;
        },
        drawIcon(cfg, group){
          const attr = {
            x: -65,
            y: -12.5,
            width: 25,
            height: 25,
          }
          if(cfg.type === 'begin'){
            const is = 'start1.svg'
            const icon = group.addShape('image', {
              attrs: {
                img: require(`../assets/node/${self.theme.node.beginIcon}`),
                ...attr
              },
            });
          }else if(cfg.type === 'end'){
            const icon = group.addShape('image', {
              attrs: {
                img: require(`../assets/node/${self.theme.node.endIcon}`),
                ...attr
              },
            });
          }
        },
        runAnimate(cfg, group){
          if(cfg.active){
            let totalArray = [];
            let index = 0;
            const shape = group.getFirst();
            shape.animate(
                (ratio)=>{
                  for (let i = 0; i < 9; i += interval) {
                    totalArray = totalArray.concat(lineDash);
                  }
                  const cfg = {
                    lineDash: dashArray[index].concat(totalArray)
                  };
                  index = (index + 1) % interval;
                  return cfg;
                },
                {
                  repeat: true,
                  duration: 5000
                });
          }
        },
        afterDraw(cfg, group) {
          this.runAnimate(cfg,group);
        },
      }, 'single-shape');

      const graph = new G6.Graph({
        container: 'graph-container',
        width: window.innerWidth,
        height: window.innerHeight,
        pixelRatio: 2,
        modes: {
          default: ['drag-canvas'],
        },
        defaultNode: {
          shape: 'operation',
          labelCfg: {
            style: {
              fill: self.theme.node.label,
              fontSize: 14,
              fontWeight: 'bold',
            },
          }
        },
        defaultEdge: {
          type: 'polyline',

          labelCfg: {
            autoRotate: true,
            refY: -10, // Adjust the vertical position of the label
            style: {
              fontSize: 8,
              fill: self.theme.edge.label,
              background: {
                fill: self.theme.edge.labelBg,
                padding: [2, 2, 2, 2],
                radius: 2,
              }
            },
          },
          style: {
            endArrow: true,
            lineWidth: 2,
            stroke: self.theme.edge.stroke,
          },
        },
        // plugins: [tooltip]
      });
      this.graph = graph
      this.updateGraph(this.graphData)
      if (this.zoomRate <= graph.get('maxZoom') && this.zoomRate >= graph.get('minZoom')) {
        graph.zoomTo(this.zoomRate);
      }
      // graph.data(data);
      // graph.render();
      // graph.fitView(200);
      // graph.zoomTo(1.1);
      // this.graph = graph
    },
    getCoord1(data) {
      const g = new dagre.graphlib.Graph();
      g.setDefaultEdgeLabel(() => ({}));
      g.setGraph({
        rankdir: this.graphDirection,
        // align: 'DL',
        // ranksep: 200
      });

      data.nodes.forEach(node => {
        g.setNode(node.id, { width: 150, height: 50 });
      });

      data.edges.forEach(edge => {
        g.setEdge(edge.source, edge.target);
      });

      dagre.layout(g);

      let coord;
      g.nodes().forEach((node, i) => {
        coord = g.node(node);
        data.nodes[i].x = coord.x;
        data.nodes[i].y = coord.y;
      });
      console.log('11111',  data.nodes)
      g.edges().forEach((edge, i) => {
        coord = g.edge(edge);

        console.log('22222', coord)
        data.edges[i].startPoint = coord.points[0];
        data.edges[i].endPoint = coord.points[coord.points.length - 1];
        data.edges[i].controlPoints = coord.points.slice(1, coord.points.length - 1);
        console.log('wwwpaa', data.edges[i])
      });
    },
    getCoord(data) {
       let obstacleSegment = {
         horizontal: [],
         vertical: []
       }
       const levelData = this.getMaxSameLevelCounts(data)
       const center = this.getCenterCoord(levelData.maxCount)
      data.nodes.forEach(node => {
        const level = node.level === 0 ? 0 : node.level - 1
        if (this.graphDirection === 'LR' || this.graphDirection === 'RL') {
          // node.x = level * ( this.nodeWidth + this.nodeHeight ) + ( this.nodeWidth / 2 )
          node.x = level * this.nodePadding + this.nodeWidth / 2 + this.virtualPadding
          const nodeGap = this.nodeWidth / 4
          const currentLevel = levelData.levelCounts.get(node.level)
          const offsetCenter = currentLevel % 2 === 0 ? 0 : nodeGap / 2 + this.nodeHeight / 2
          if (node.levelNum % 2 === 1) {
            node.y =  center + offsetCenter - (nodeGap * Math.floor(node.levelNum / 2) + this.nodeHeight * Math.floor(node.levelNum / 2) + nodeGap / 2 + this.nodeHeight / 2)
          } else {
            node.y = center + offsetCenter + (nodeGap * Math.floor(node.levelNum / 2 - 1) + this.nodeHeight * Math.floor(node.levelNum / 2 - 1) + nodeGap / 2 + this.nodeHeight / 2)
          }
        } else if (this.graphDirection === 'TB' || this.graphDirection === 'BT') {
          node.y = level * 100 + this.nodeHeight / 2 + this.virtualPadding
          const nodeGap = this.nodeWidth / 4
          const currentLevel = levelData.levelCounts.get(node.level)
          const offsetCenter = currentLevel % 2 === 0 ? 0 : nodeGap / 2 + this.nodeWidth / 2
          if (node.levelNum % 2 === 1) {
            node.x =  center + offsetCenter - (nodeGap * Math.floor(node.levelNum / 2) + this.nodeWidth * Math.floor(node.levelNum / 2) + nodeGap / 2 + this.nodeWidth / 2)
          } else {
            node.x = center + offsetCenter + (nodeGap * Math.floor(node.levelNum / 2 - 1) + this.nodeWidth * Math.floor(node.levelNum / 2 - 1) + nodeGap / 2 + this.nodeWidth / 2)
          }
        }

        obstacleSegment.horizontal.push([
          node.x - this.nodeWidth / 2 - this.virtualPadding,
          node.y - this.nodeHeight / 2 - this.virtualPadding,
          node.x + this.nodeWidth / 2 + this.virtualPadding,
          node.y - this.nodeHeight / 2 - this.virtualPadding
        ])

        obstacleSegment.horizontal.push([
          node.x - this.nodeWidth / 2 - this.virtualPadding,
          node.y + this.nodeHeight / 2 + this.virtualPadding,
          node.x + this.nodeWidth / 2 + this.virtualPadding,
          node.y + this.nodeHeight / 2 + this.virtualPadding
        ])

        obstacleSegment.vertical.push( [
          node.x - this.nodeWidth / 2 - this.virtualPadding,
          node.y - this.nodeHeight / 2 - this.virtualPadding,
          node.x - this.nodeWidth / 2 - this.virtualPadding,
          node.y + this.nodeHeight / 2 + this.virtualPadding
        ])
        obstacleSegment.vertical.push( [
          node.x + this.nodeWidth / 2 + this.virtualPadding,
          node.y - this.nodeHeight / 2 - this.virtualPadding,
          node.x + this.nodeWidth / 2 + this.virtualPadding,
          node.y + this.nodeHeight / 2 + this.virtualPadding
        ])

      })
      this.centerAxisX = (data.nodes[0].x + data.nodes[data.nodes.length -1].x) / 2
      this.centerAxisY = (data.nodes[0].y + data.nodes[data.nodes.length -1].y) / 2
      console.log('nodeData', data.nodes)
      console.log('edgeData', data.edges)

      // obstacleSegment.horizontal = mergeHorizontalSegments(obstacleSegment.horizontal)
      // obstacleSegment.vertical = mergeVerticalSegments(obstacleSegment.vertical)
      console.log('obstacleSegment', obstacleSegment)
      let anchorMatrix = this.createArray(data.nodes.length, 4)

      data.edges.forEach((edge, index) => {
        if (index < 90) {
          const sourceNode = data.nodes.find(node => node.id === edge.source)
          const targetNode = data.nodes.find(node => node.id === edge.target)
          console.log('=========计算开始', edge.label)
          const lines =  this.getLinePoints(sourceNode, targetNode, anchorMatrix, obstacleSegment)
          Object.assign(edge, lines)
          console.log('最终计算结果', edge)
        }
      })






    },
    /**
     * 合并区间
     * @param segments
     * @return {*[]}
     */
    mergeIntervals(segments) {
      if (segments.length === 0) return [];

      // 先按起始点排序
      segments.sort((a, b) => a[0] - b[0]);

      const merged = [];
      let [currentStart, currentEnd] = segments[0];

      for (let i = 1; i < segments.length; i++) {
        const [nextStart, nextEnd] = segments[i];

        if (nextStart <= currentEnd) {
          // 有重叠，扩展当前区间
          currentEnd = Math.max(currentEnd, nextEnd);
        } else {
          // 无重叠，保存当前区间并更新当前区间
          merged.push([currentStart, currentEnd]);
          [currentStart, currentEnd] = [nextStart, nextEnd];
        }
      }

      // 添加最后一个区间
      merged.push([currentStart, currentEnd]);
      return merged
    },

    /**
     * 获取节点的锚点坐标
     * @param node 节点
     * @return {Map<any, any>}
     * @author Hanger Zou
     */
    getNodeAnchorCoords(node) {
      const virtualPading = this.virtualPadding
      const anchorMap = new Map()
      anchorMap.set(0, {
        anchorX: node.x - this.nodeWidth / 2,
        anchorY: node.y,
        virtualX: node.x - this.nodeWidth / 2 - virtualPading,
        virtualY: node.y,
        angle0X: node.x - this.nodeWidth / 2 - virtualPading,
        angle0Y: node.y - this.nodeHeight / 2 - virtualPading,
        angle1X: node.x - this.nodeWidth / 2 - virtualPading,
        angle1Y: node.y + this.nodeHeight / 2 + virtualPading,
        posIndex: 0
      })
      anchorMap.set(1, {
        anchorX: node.x,
        anchorY: node.y - this.nodeHeight / 2,
        virtualX: node.x,
        virtualY: node.y - this.nodeHeight / 2 - virtualPading,
        angle0X: node.x - this.nodeWidth / 2 - virtualPading,
        angle0Y: node.y - this.nodeHeight / 2 - virtualPading,
        angle1X: node.x + this.nodeWidth / 2 + virtualPading,
        angle1Y: node.y - this.nodeHeight / 2 - virtualPading,
        posIndex: 1
      })
      anchorMap.set(2,{
        anchorX: node.x + this.nodeWidth / 2,
        anchorY: node.y,
        virtualX: node.x + this.nodeWidth / 2 + virtualPading,
        virtualY: node.y,
        angle0X: node.x + this.nodeWidth / 2 + virtualPading,
        angle0Y: node.y - this.nodeHeight / 2 - virtualPading,
        angle1X: node.x + this.nodeWidth / 2 + virtualPading,
        angle1Y: node.y + this.nodeHeight / 2 + virtualPading,
        posIndex: 2
      })
      anchorMap.set(3, {
        anchorX: node.x,
        anchorY: node.y + this.nodeHeight / 2,
        virtualX: node.x,
        virtualY: node.y + this.nodeHeight / 2 + virtualPading,
        angle0X: node.x - this.nodeWidth / 2 - virtualPading,
        angle0Y: node.y + this.nodeHeight / 2 + virtualPading,
        angle1X: node.x + this.nodeWidth / 2 + virtualPading,
        angle1Y: node.y + this.nodeHeight / 2 + virtualPading,
        posIndex: 3
      })
      return anchorMap
    },
    get2NodesDirection(sourceNode, targetNode) {
      //L R T B
      let h = '', v= ''
      if (sourceNode.x < targetNode.x) {
        h = 'R'
      } else if (sourceNode.x > targetNode.x) {
        h = 'L'
      }
      if (sourceNode.y < targetNode.y) {
        v = 'B'
      } else if (sourceNode.y > targetNode.y) {
        v = 'T'
      }
      return h + v

    },
    getLayoutCase(sourceNode, targetNode) {
      const direction = this.get2NodesDirection(sourceNode, targetNode)
      // 定义一个映射对象来存储方向和对应的priority
      const directionPriorityMap = this.graphDirection === 'LR' || this.graphDirection === 'RL' ? {
        RT: { source: [2, 1, 0, 3], target: [0, 3, 1, 2] },
        RB: { source: [2, 3, 0, 1], target: [0, 1, 3, 2] },
        LT: { source: [1, 0, 3, 2], target: [1, 2, 3, 0] },
        LB: { source: [1, 0, 3, 2], target: [1, 2, 0, 3] },
        T:  { source: [1, 2, 0, 3], target: [3, 2, 0, 1] },
        B:  { source: [3, 2, 0, 1], target: [1, 0, 2, 3] },
        L:  { source: [0, 1, 3, 2], target: [2, 1, 3, 0] },
        R:  { source: [2, 1, 3, 0], target: [0, 1, 3, 2] },
      }
      :
      {
        RT: { source: [1, 2, 0, 3], target: [0, 3, 1, 2] },
        RB: { source: [3, 2, 0, 1], target: [1, 0, 3, 2] },
        LT: { source: [1, 0, 3, 2], target: [3, 2, 0, 1] },
        LB: { source: [3, 2, 0, 1], target: [1, 0, 3, 2] },
        T:  { source: [1, 2, 0, 3], target: [3, 2, 0, 1] },
        B:  { source: [3, 2, 0, 1], target: [1, 0, 2, 3] },
        L:  { source: [0, 1, 3, 2], target: [2, 1, 3, 0] },
        R:  { source: [2, 1, 3, 0], target: [0, 1, 3, 2] },
      }
      // 检查映射中是否存在该方向
      if (directionPriorityMap.hasOwnProperty(direction)) {
        return directionPriorityMap[direction];
      } else {
        // 默认情况，返回空对象或自定义错误处理
        // 此处返回空对象，但也可以选择抛出错误或记录日志等方式
        return {};
      }
    },
    /**
     * 获取最适合画线的点
     * @param sourceNode 源点
     * @param targetNode 目标点
     * @param anchorMatrix 节点的锚点出入度矩阵 -1 ：入，0：未占用，1：出
     * @param obstacleSegment 障碍物区间
     * @author Hanger Zou
     */
    getLinePoints(sourceNode, targetNode, anchorMatrix, obstacleSegment) {
      const linePoints = []
      const sourceCoorsMap = this.getNodeAnchorCoords(sourceNode) //起始节点的锚点坐标 一次 左、上、右、下
      const targetCoorsMap = this.getNodeAnchorCoords(targetNode) //目标节点的锚点坐标 一次 左、上、右、下

      const sourceAnchor = []
      const targetAnchor = []
      const sourceAnchorMap = this.statisticNum(anchorMatrix, sourceNode)
      const targetAnchorMap = this.statisticNum(anchorMatrix, targetNode)
      let sourceFind = 1 //-1：入，0：未占用，1：出
      let targetFind = -1

      //找到可用于连线的锚点
      const countZero = sourceAnchorMap.get(0);
      if (countZero > 0) {
        if (sourceAnchorMap.get(-1) > 0 || countZero > 1) {
          sourceFind = 0;
        }
      }
      const targetCountZero = targetAnchorMap.get(0);
      if (targetCountZero > 0) {
        if (targetAnchorMap.get(1) > 0 || targetCountZero > 1) {
          targetFind = 0;
        }
      }

      const priority = this.getLayoutCase(sourceNode, targetNode)
      priority.source.forEach(index => {
        if (anchorMatrix[sourceNode.index][index] === sourceFind) {
           sourceAnchor.push(sourceCoorsMap.get(index))
        }
      })
      priority.target.forEach(index => {
        if (anchorMatrix[targetNode.index][index] === targetFind) {
           targetAnchor.push(targetCoorsMap.get(index))
        }
      })
      for (let i = 0; i < sourceAnchor.length; i++) {
        for (let j = 0; j < targetAnchor.length; j++) {
          this.nodePointInfo = {
            from: sourceAnchor[i],
            to: targetAnchor[j],
            startPointX: sourceAnchor[i].anchorX,
            startPointY: sourceAnchor[i].anchorY,
            endPointX: targetAnchor[j].anchorX,
            endPointY: targetAnchor[j].anchorY
          }
          const pointsInfo = this.getPointsInfo(sourceAnchor[i], targetAnchor[j], obstacleSegment)
          if (pointsInfo === undefined) continue
          const controlPoints = []
          pointsInfo.points.forEach((point) => {
            controlPoints.push({
              x: point[0],
              y: point[1]
            })
          })
          linePoints.push({
            startPoint: {
              x: sourceAnchor[i].anchorX,
              y: sourceAnchor[i].anchorY,
            },
            endPoint: {
              x: targetAnchor[j].anchorX,
              y: targetAnchor[j].anchorY
            },
            controlPoints: controlPoints,
            jointNum: pointsInfo.jointNum,
            pointNum: pointsInfo.length,
            obstacleNum: pointsInfo.obstacleNum,
            points: pointsInfo.points,
            from: i,
            to: j
          })
        }
      }
      if (linePoints.length === 0) return []
      linePoints.sort((a, b) => {
        if (a.jointNum !== b.jointNum) {
          return a.jointNum - b.jointNum
        }
        if (a.obstacleNum !== b.obstacleNum) {
          return a.obstacleNum - b.obstacleNum
        }
        return a.pointNum - b.pointNum
      })
      this.cacheLines(linePoints[0].points)
      anchorMatrix[sourceNode.index][sourceAnchor[linePoints[0].from].posIndex] = 1
      anchorMatrix[targetNode.index][targetAnchor[linePoints[0].to].posIndex] = -1
      return linePoints[0]
      // for (let i = 0; i < 4; i++) {
      //   if (anchorMatrix[sourceNode.index][i] === sourceFind) {
      //     sourceAnchor.push(sourceCoorsMap.get(i))
      //   }
      // }

    },
    /**
     * 创建零矩阵
     * @param rows
     * @param cols
     * @return {any[]}
     */
    createArray(rows, cols) {
      let arr = new Array(rows); // 创建rows行

      for (let i = 0; i < rows; i++) {
        arr[i] = new Array(cols).fill(0); // 每行填充cols列，初始值为0
      }

      return arr;
    },

    /**
     * 计算中心坐标的函数
     *
     * 该函数用于根据节点数量和相关尺寸计算出一个容器或布局的中心坐标。这在诸如图形布局、UI组件定位等场景中非常有用。
     *
     * @param {number} maxCount - 最大节点数量。这个参数用于确定容器的总高度，进而计算中心坐标。
     * @returns {number} 返回计算得到的中心坐标值。这个值可以用于进一步的定位计算或直接用于设置元素的中心坐标。
     */
    getCenterCoord(maxCount) {
        // 计算总高度：节点高度乘以节点数量，再加上节点之间间隙的累计 最后除以2。得到中心点的垂直位置。
        return  ((maxCount - 1) * this.nodeHeight / 2 + maxCount * this.nodeHeight) /2 + this.gap;
    },
    /**
     * 获取同一层节点个数最多的
     * @param data
     * @return {{maxLevel, levelCounts: Map<any, any>}}
     */
    getMaxSameLevelCounts(data) {
      // 使用 Map 来统计每个 level 的节点个数
      const levelCounts = new Map();

      data.nodes.forEach((node, index) => {
        const { level } = node;
        if (level === 999)
          node.level = levelCounts.size + 1
        if (levelCounts.has(level)) {
          levelCounts.set(level, levelCounts.get(level) + 1);
        } else {
          levelCounts.set(level, 1);
        }
        node.index = index
        node.levelNum = levelCounts.get(level)
      });

    // 找出最大个数的 level
      let maxCount = 0;
      let maxLevel;

      levelCounts.forEach((count, level) => {
        if (count > maxCount) {
          maxCount = count;
          maxLevel = level;
        }
      });
      return { levelCounts, maxCount}
    },
    zoomIn() {
      const graph = this.graph;
      const maxZoom = graph.get('maxZoom');
      const zoom = graph.getZoom();

      // this.originZoom = zoom;
      let currentZoom = zoom + 0.1;
      if(currentZoom > maxZoom)
        currentZoom = maxZoom;
      graph.zoomTo(currentZoom);
    },
    zoomOut() {
      const graph = this.graph;
      const minZoom = graph.get('minZoom');
      const zoom = graph.getZoom();
      // this.originZoom = zoom;
      let currentZoom = zoom - 0.1;
      if(currentZoom < minZoom)
        currentZoom = minZoom;
      graph.zoomTo(currentZoom);
    },
    resetZoom() {
      const graph = this.graph;
      const zoom = graph.getZoom();
      // this.originZoom = zoom;
      graph.zoomTo(1);
    },
    autoFix() {
      const graph = this.graph;
      const zoom = graph.getZoom();
      // this.originZoom = zoom;
      graph.fitView(200);
    },
    saveImg() {
      exportImg(this.$refs['canvas'],'xxxx',true);
      // this.graph.saveImg = (createFile = true) => {exportImg(this.$refs['graph-container'],'xxxx',createFile); console.log('09887778', this.graph.save())};

    },
    updateGraph(data) {
      this.graph.data(data);
      this.graph.render();
      this.graph.fitView(200);
    },
    // 检测json格式
    isJSON(str) {
      if (typeof str == 'string') {
        try {
          var obj=JSON.parse(str);
          if(typeof obj == 'object' && obj ){
            return true;
          }else{
            return false;
          }

        } catch(e) {
          return false;
        }
      }else if (typeof str == 'object'  && str) {
        return true;
      }
    },
    onSubumit(){
      if (!this.isJSON(this.jsonStr)){
        this.$message.error(`json格式错误`)
        return false
      }
      this.$message.success('json格式正确')
      this.response = JSON.parse(this.jsonStr)
    },
    statisticNum(anchorMatrix, node) {
      const sourceAnchorMap = new Map([
        [-1, 0],
        [0, 0],
        [1, 0]
      ])


      //扫描矩阵
      for (let i = 0; i < 4; i++) {
        const num = anchorMatrix[node.index][i]
        if (sourceAnchorMap.has(num)) {
          sourceAnchorMap.set(num, sourceAnchorMap.get(num) + 1)
        } else {
          sourceAnchorMap.set(num, 1)
        }
      }
      return sourceAnchorMap
    },
    getPointsInfo(s, t, obstacleSegment) {
      let controlPoints = []
      //计算路线 两点计算一条最右的
      // 计算所有点
      const points = [
        this.calcPointsLine(s.virtualX, s.virtualY, t.virtualX, t.virtualY, true, true, s, t, obstacleSegment),
        this.calcPointsLine(s.virtualX, s.virtualY, t.angle0X, t.angle0Y, true, false, s, t, obstacleSegment),
        this.calcPointsLine(s.virtualX, s.virtualY, t.angle1X, t.angle1Y, true, false, s, t, obstacleSegment),
        this.calcPointsLine(s.angle0X, s.angle0Y, t.virtualX, t.virtualY, false, true, s, t, obstacleSegment),
        this.calcPointsLine(s.angle0X, s.angle0Y, t.angle0X, t.angle0Y, false, false, s, t, obstacleSegment),
        this.calcPointsLine(s.angle0X, s.angle0Y, t.angle1X, t.angle1Y, false, false, s, t, obstacleSegment),
        this.calcPointsLine(s.angle1X, s.angle1Y, t.virtualX, t.virtualY, false, true, s, t, obstacleSegment),
        this.calcPointsLine(s.angle1X, s.angle1Y, t.angle0X, t.angle0Y, false, false, s, t, obstacleSegment),
        this.calcPointsLine(s.angle1X, s.angle1Y, t.angle1X, t.angle1Y, false, false, s, t, obstacleSegment)
      ]
      if (points === undefined || points.length === 0)
        return undefined

      const filteredPoints = points.filter(point => point !== undefined)
      filteredPoints.sort((a, b) => {
        if (a.jointNum !== b.jointNum) {
          return a.jointNum - b.jointNum
        }
        if (a.obstacleNum !== b.obstacleNum) {
          return a.obstacleNum - b.obstacleNum
        }
        return a.points.length - b.points.length
      })




      // filteredPoints[0].points.forEach((point) => {
      //   controlPoints.push({
      //     x: point[0],
      //     y: point[1]
      //   })
      // })
      //

      return  filteredPoints[0];
    },
    calcPointsLine(sX, sY, tX, tY, isSource, isTarget, sourceAnchorElement, targetAnchorElement, obstacleSegment) {
      let points = [];
      if (sX === tX || sY === tY) { //直连
        let points1  = [[sX, sY], [tX, tY]]
        const arr1 = this.getPoints(points1, isSource, isTarget, sourceAnchorElement, targetAnchorElement, obstacleSegment)
        if (arr1 !== undefined) {
          points.push(arr1)
        }
      } else { //斜线 矩形的 xieduijiao
        let points2 = this.graphDirection === 'LR' || this.graphDirection === 'RL' ? [[sX, sY],  [sX, tY], [tX, tY]] : [[sX, sY], [tX, sY], [tX, tY]]
        const arr2 = this.getPoints(points2, isSource, isTarget, sourceAnchorElement, targetAnchorElement, obstacleSegment)
        if (arr2 !== undefined) {
          points.push(arr2)
        }
        let points3 =this.graphDirection === 'LR' || this.graphDirection === 'RL' ? [[sX, sY], [tX, sY], [tX, tY]] : [[sX, sY],  [sX, tY], [tX, tY]]
        const arr3 = this.getPoints(points3, isSource, isTarget, sourceAnchorElement, targetAnchorElement, obstacleSegment)
        if (arr3 !== undefined) {
          points.push(arr3)
        }
      }
      if (points.length > 1) {
        points.sort((a, b) => {
          if (a.jointNum !== b.jointNum) {
            return a.jointNum - b.jointNum
          }
          return a.obstacleNum - b.obstacleNum
        })
      }
     return points.length > 0 ? points[0] : undefined

    },
    getPoints(points1, isSource, isTarget, sourceAnchorElement, targetAnchorElement, obstacleSegment) {
      // 检查方向
      if (!this.checkDirection(points1, sourceAnchorElement, targetAnchorElement)) {
        return undefined
      }
      if (!isSource) {
        points1.unshift([sourceAnchorElement.virtualX, sourceAnchorElement.virtualY])
      }
      if (!isTarget) {
        points1.push([targetAnchorElement.virtualX, targetAnchorElement.virtualY])
      }
      if (this.hasDuplicateElements(points1))
        return undefined
      // 检查障碍物
      obstacleSegment.obstacleNum = 0 // 碰撞障碍物后修改数量
      if (!this.isNotGetObstacles(points1, obstacleSegment)) {
        return undefined
      }
      const num = this.getJointPoints(points1)
      if (num === undefined) {
        return undefined
      }

      return {
        points: points1,
        jointNum: num,
        obstacleNum: obstacleSegment.obstacleNum
      }
    },
    hasDuplicateElements(array) {
      let seen = new Set();

      for (let arr of array) {
        // 将数组转换成字符串作为 Set 的键
        let key = arr.join(',')
        if (seen.has(key)) {
          return true  // 如果 Set 中已经有这个键，表示有重复的数组
        }
        seen.add(key)  // 否则将这个键添加到 Set 中
      }
      return false  // 如果遍历完所有元素都没有找到重复的数组，则返回 false
    },

    checkDirection(points1, sourceAnchorElement, targetAnchorElement) {
      const length = points1.length
      if(Math.min(points1[0][0], points1[1][0]) < this.nodePointInfo.startPointX && Math.max(points1[0][0], points1[1][0]) > this.nodePointInfo.startPointX)
        return false;
      if(Math.min(points1[0][1], points1[1][1]) < this.nodePointInfo.startPointY && Math.max(points1[0][1], points1[1][1]) > this.nodePointInfo.startPointY )
        return false;
      if(Math.min(points1[length - 1][0], points1[length - 2][0]) < this.nodePointInfo.endPointX && Math.max(points1[length - 1][0], points1[length -2][0]) > this.nodePointInfo.endPointX)
        return false;
      if(Math.min(points1[length - 1][1], points1[length - 2][1]) < this.nodePointInfo.endPointY && Math.max(points1[length - 1][1], points1[length -2][1]) > this.nodePointInfo.endPointY)
        return false;
      if(Math.min(points1[0][0], points1[1][0]) < sourceAnchorElement.virtualX && Math.max(points1[0][0], points1[1][0]) > sourceAnchorElement.virtualX )
        return false;
      if(Math.min(points1[0][1], points1[1][1]) < sourceAnchorElement.virtualY && Math.max(points1[0][1], points1[1][1]) > sourceAnchorElement.virtualY )
        return false;
      if(Math.min(points1[length - 1][0], points1[length - 2][0]) < targetAnchorElement.virtualX && Math.max(points1[length - 1][0], points1[length -2][0]) > targetAnchorElement.virtualX )
        return false;
      if(Math.min(points1[length - 1][1], points1[length - 2][1]) < targetAnchorElement.virtualY && Math.max(points1[length - 1][1], points1[length -2][1]) > targetAnchorElement.virtualY )
        return false;
      return true;
    },
    isNotGetObstacles(points1, obstacleSegment) {
      // 要插入的索引和元素
      let indices = []
      let elements = []
      for (let i = 0; i < points1.length - 1; i++) {
        let flag = false
        while (!flag) {
          const obstacle = {} // 障碍点
          if (this.isIntersect(points1[i], points1[i + 1], obstacleSegment,obstacle)) {
            //碰到障碍物
            if (obstacle.direction === 'horizontal') {
              if (i === 0 && (this.nodePointInfo.from === 1 || this.nodePointInfo.from === 3)) {
                flag = true
                return false
              }
              if (i === points1.length - 2 && (this.nodePointInfo.to === 1 || this.nodePointInfo.to === 3)) {
                flag = true
                return false
              }
              let newX = obstacle.start
              let scale = -1
              if (points1[i][0] > this.nodePointInfo.startPointX) {
                newX = obstacle.end
                scale = 1
              }
              obstacleSegment.obstacleNum ++
              newX = newX + scale * this.linePadding
              //
              if (this.isIntersect(points1[i],[newX, points1[i][1] ], obstacleSegment,obstacle)
              || this.isIntersect([newX, points1[i + 1][1] ], points1[i + 1], obstacleSegment,obstacle)) {
                flag = true
                return false
              }
              indices.push(i, i + 2)
              elements.push([points1[i][0], points1[i][1] ], [points1[i + 1][0], points1[i + 1][1] ])
              points1[i][0] = newX
              points1[i + 1][0] = newX

            } else {
              if (i === 0 && (this.nodePointInfo.from === 0 || this.nodePointInfo.from === 2)) {
                flag = true
                return false
              }
              if (i === points1.length - 2 && (this.nodePointInfo.to === 0 || this.nodePointInfo.to === 2)) {
                flag = true
                return false
              }
              let newY = obstacle.start
              let scale = -1
              if (points1[i][1] > this.nodePointInfo.startPointY) {
                newY = obstacle.end
                scale = 1
              }
              obstacleSegment.obstacleNum++
              newY = newY + scale * this.linePadding
              if (this.isIntersect(points1[i],[points1[i][0], newY], obstacleSegment,obstacle)
                  || this.isIntersect(points1[i + 1], [points1[i + 1][0], newY ], obstacleSegment,obstacle)) {
                flag = true
                return false
              }
              indices.push(i, i + 2)
              elements.push([points1[i][0], points1[i][1] ], [points1[i + 1][0], points1[i + 1][1] ])
              points1[i][1] = newY
              points1[i + 1][1] = newY
            }
            // if()
          }
          flag = true
        }

      }
      if (indices.length > 0) {
        points1 = this.insertElements(points1, indices, elements)
      }
      return true;
    },
    insertElements(array, indices, elements) {
      // 创建一个新数组，将原数组的元素复制到新数组中
      let newArray = array.slice();

      // 按照指定的索引位置插入元素
      for (let i = 0; i < indices.length; i++) {
        let index = indices[i];
        let element = elements[i];

        // 在指定索引位置插入元素
        array.splice(index + i, 0, element);
      }

      return array;
    },
    /**
     * 判断线段是否触碰障碍物
     * @param points1Element
     * @param points1Element2
     * @param obstacleSegment
     * @param obstacle
     * @return {boolean}
     */
    isIntersect(points1Element, points1Element2, obstacleSegment, obstacle) {
      let segment = obstacleSegment.horizontal
      if (points1Element[1] === points1Element2[1]) {
        segment = obstacleSegment.vertical
      }
      return segment.some(item => {
        return this.calcIntersectPoint(points1Element[0], points1Element[1], points1Element2[0], points1Element2[1], item[0], item[1], item[2], item[3], obstacle)
      })
    },
    calcIntersectPoint(x1, y1, x2, y2, x3, y3, x4, y4, obstacle) {

      if (obstacle === undefined) {
        obstacle = {}
      }
      console.log(x1 > Math.min(x3, x4) && x1 < Math.max(x3, x4) && y3 < Math.max(y1, y2) && y3 > Math.min(y1, y2))
      if (x1 === x2) { //竖直
        if (x1 > Math.min(x3, x4) && x1 < Math.max(x3, x4) && y3 < Math.max(y1, y2) && y3 > Math.min(y1, y2)) {
           obstacle.direction = 'horizontal'
           obstacle.start = x3
           obstacle.end = x4
           return true
        }
      } else {
        if (y1 > Math.min(y3, y4) && y1 < Math.max(y3, y4) && x3 < Math.max(x1, x2) && x3 > Math.min(x1, x2)) {
          obstacle.direction = 'vertical'
          obstacle.start = y3
          obstacle.end = y4
          return true
        }
      }
      return false

    },
    /**
     * 获取交点数量
     * @param points1
     * @return {undefined}
     */
    getJointPoints(points1) {
      let num = 0
     for (let i = 0; i < points1.length - 1; i++) {
       if (points1[i][0] === points1[i + 1][0]) { //竖直线
         if(!this.isAbleLine(points1[i], points1[i + 1], this.lineSegments.vertical)) { // 判断是否能画线
            return undefined
         }

         num += this.calcJointCount(points1[i], points1[i + 1], this.lineSegments.horizontal) // 计算交点数量
       }
       if (points1[i][1] === points1[i + 1][1]) { //水平线
         if(!this.isAbleLine(points1[i], points1[i + 1], this.lineSegments.horizontal)) { // 判断是否能画线
           return undefined
         }
         num += this.calcJointCount(points1[i], points1[i + 1], this.lineSegments.vertical) // 计算交点数量
       }

     }

      return num;
    },
    /**
     *  计算交点数量
     * @param points1Element
     * @param points1Element2
     * @param lineSegments
     * @return {undefined}
     */
    calcJointCount(points1Element, points1Element2, lineSegments) {
      let num = 0
      for (let i = 0; i < lineSegments.length; i++) {
        const obstacle = {}
        if (this.calcIntersectPoint(points1Element[0], points1Element[1], points1Element2[0], points1Element2[1], lineSegments[i][0], lineSegments[i][1], lineSegments[i][2], lineSegments[i][3]), obstacle) {
          num++
        }
      }

      return num;
    },
    segmentsIntersect(x1, x2, x3, x4) {
      // 确保 x1 <= x2 和 x3 <= x4
      if (x1 > x2) [x1, x2] = [x2, x1];  // Swap x1, x2 if x1 > x2
      if (x3 > x4) [x3, x4] = [x4, x3];  // Swap x3, x4 if x3 > x4

      // 判断投影是否有重叠
      return Math.max(x1, x3) <= Math.min(x2, x4);
    },
    /**
     * 判断是否能画线 如果重合且方向不一致则返回false， 重合必须要一致
     * @param points1Element
     * @param points1Element2
     * @param lineSegments
     * @return {boolean}
     */
    isAbleLine(points1Element, points1Element2, lineSegments) {
      if (!lineSegments || lineSegments.length === 0) {
        return true
      }
      if (points1Element[0] === points1Element2[0]) { //竖直
       for (let i = 0; i < lineSegments.length; i++) {
         if(lineSegments[i][0] === points1Element[0]) {
           if(this.segmentsIntersect(lineSegments[i][1], lineSegments[i][3], points1Element[1], points1Element2[1])){
             return lineSegments[i][1] === points1Element[1] && lineSegments[i][3] === points1Element2[1]
           }
           return true

         }
       }

      } else { //水平
        for (let i = 0; i < lineSegments.length; i++) {
          if(lineSegments[i][1] === points1Element[1]) {
            if(this.segmentsIntersect(lineSegments[i][0], lineSegments[i][2], points1Element[0], points1Element2[0])){
              return lineSegments[i][0] === points1Element[0] && lineSegments[i][2] === points1Element2[0]
            }
            return true
          }
        }

      }
      return true
    },
    /**
     * 缓存线段
     * @param points
     */
    cacheLines(points) {
      for (let i = 0; i < points.length - 1; i++) {
        if (points[i][0] === points[i + 1][0]) {
          this.lineSegments.vertical.push([points[i][0], points[i][1], points[i + 1][0], points[i + 1][1]])
        } else {
          this.lineSegments.horizontal.push([points[i][1], points[i][0], points[i + 1][0], points[i + 1][1]])
        }
      }
    }
  },


};
</script>

<style lang="scss" scoped>
#graph-container {
  border: 1px solid #ccc;
}
.toolbar {
  text-align: left;
  width: 100%;
  padding: 8px 0;
  background-color: #fff;
  border: 1px solid #E9E9E9;
  box-shadow: 0 8px 12px 0 rgba(0, 52, 107, 0.04);
  .command {
    display: inline-block;
    margin: 0 6px;
    line-height: 27px;
    border: 1px solid rgba(2, 2, 2, 0);
    border-radius: 2px;

    span {
      margin: 0 6px;
    }

    &:nth-of-type(1) {
      margin-left: 24px;
    }

    &:hover {
      border: 1px solid #E9E9E9;
      cursor: pointer;
    }
  }

  .separator {
    margin: 4px;
    border-left: 1px solid #E9E9E9;
  }

  .icon-select.disable {
    background: #EEE;
  }

  .disable {
    color: rgba(0, 0, 0, 0.25);

    &:hover {
      border: 1px solid rgba(2, 2, 2, 0);
      cursor: default;
    }
  }
}
/deep/ .CodeMirror {
  height: 80vh!important;
}
@font-face {
  font-family: "iconfont";
  src: url('../assets/iconfont/iconfont.eot?t=1566199791492'); /* IE9 */
  src: url('../assets/iconfont/iconfont.eot?t=1566199791492#iefix') format('embedded-opentype'), /* IE6-IE8 */
  url('data:application/x-font-woff2;charset=utf-8;base64,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') format('woff2'),
  url('../assets/iconfont/iconfont.woff?t=1566199791492') format('woff'),
  url('../assets/iconfont/iconfont.ttf?t=1566199791492') format('truetype'), /* chrome, firefox, opera, Safari, Android, iOS 4.2+ */
  url('../assets/iconfont/iconfont.svg?t=1566199791492#iconfont') format('svg'); /* iOS 4.1- */
}

.iconfont {
  font-family: "iconfont" !important;
  font-size: 16px;
  font-style: normal;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

.icon-copy-o:before {
  content: "\e8a2";
}

.icon-undo:before {
  content: "\e8a5";
}

.icon-zoom-in-o:before {
  content: "\e8a6";
}

.icon-actual-size-o:before {
  content: "\e7cb";
}

.icon-redo:before {
  content: "\e7cc";
}

.icon-fit:before {
  content: "\e7cd";
}

.icon-delete-o:before {
  content: "\e7ce";
}

.icon-to-front:before {
  content: "\e7cf";
}

.icon-to-back:before {
  content: "\e7d0";
}

.icon-paster-o:before {
  content: "\e7d1";
}

.icon-zoom-out-o:before {
  content: "\e7d2";
}
</style>