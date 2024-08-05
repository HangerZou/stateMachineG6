<template>
  <div className="main-content-box">
    <div id="container"></div>
  </div>
</template>

<script>
import G6 from '@antv/g6';

export default {
  name: 'nodeByDiy',
  data() {
    return {
      gDatas: {
        nodes: [
          {
            id: 'node-1',
            label: '开始',
            x: 150,
            y: 150,
            type: 'start-or-end',
            style: {
              fill: '#099254'
            },
            color: '#3e62ae'
          },
          {
            id: 'node-2',
            label: '结束',
            type: 'start-or-end',
            x: 950,
            y: 150,
            size: [150, 50],
            style: {
              fill: '#1f7fb7'
            }
          },
          {
            id: 'node-3',
            label: '文档',
            type: 'document-node',
            x: 350,
            y: 350,
            style: {
              fill: '#6b7570'
            }
          },
          {
            id: 'node-4',
            label: '处理',
            type: 'sub-process',
            x: 750,
            y: 350,
            style: {
              fill: '#4465aa'
            }
          },
        ],
        edges: [
          {
            source: 'node-1',
            target: 'node-3',
            sourceAnchor: 3,
            targetAnchor: 0,
          },
          {
            source: 'node-3',
            target: 'node-4',
            sourceAnchor: 3,
            targetAnchor: 1,
          },
          {
            source: 'node-4',
            target: 'node-2',
            sourceAnchor: 2,
            targetAnchor: 3,
          },

        ]
      }
    }
  },
  mounted() {
    this.getInit()
  },
  methods: {
    getInit() {
      // 注册节点。类型为开始或者结束类型
      G6.registerNode('start-or-end', {
        drawShape: function (cfg, group) {
          let width = cfg.size[0]
          let height = cfg.size[1]
          let stroke = cfg.style.stroke
          let fill = cfg.style.fill
          let rect = group.addShape('rect', {
            attrs: {
              x: -width / 2,
              y: -height / 2,
              width,
              height,
              radius: height / 2,
              stroke,
              fill,
              lineWidth: 1
            },
            name: 'start-or-end'
          })
          return rect
        }
      }, 'single-node')
      // 注册节点。类型为子流程类型节点
      G6.registerNode('sub-process', {
        drawShape: function (cfg, group) {
          let width = cfg.size[0]
          let height = cfg.size[1]
          let stroke = cfg.style.stroke
          let fill = cfg.style.fill
          //大的矩形
          let subProcess = group.addShape('rect', {
            attrs: {
              x: -width / 2,
              y: -height / 2,
              height,
              width,
              fill,
              stroke
            },
            name: 'sub-process'
          })
          // 左边
          group.addShape('rect', {
            attrs: {
              x: -(width / 2 - 20),
              y: -height / 2,
              height,
              width: 1,
              fill: '#fff',
              stroke: '#fff'
            }
          })
          // 右边
          group.addShape('rect', {
            attrs: {
              x: (width / 2 - 20),
              y: -height / 2,
              height,
              width: 1,
              fill: '#fff',
              stroke: '#fff'
            }
          })

          return subProcess
        }
      }, 'rect')
      // 注册节点。类型为文档类型节点
      G6.registerNode('document-node', {
        drawShape: function (cfg, group) {
          let width = cfg.size[0]
          let height = cfg.size[1]
          let stroke = cfg.style.stroke
          let fill = cfg.style.fill
          let documentNodes = group.addShape('path', {
            attrs: {
              path: [
                ['M', -width / 2, 0 - height / 2], // 坐上
                ['L', width / 2, -height / 2], // 右上
                ['L', width / 2, height / 3], // 右下
                ['C', width / 4, -height / 8, -width / 4, height * 6 / 8, -width / 2, height / 2], // 弧线
                ['Z']
              ],
              fill,
              stroke
            },
            name: 'document-node'
          })
          return documentNodes
        }
      }, 'single-node')
      // 注册边。继承polyline，添加流动效果
      G6.registerEdge('cus-polyline', {
        afterDraw(cfg, group) {
          let shape = group.get('children')[0]
          let index = 0
          shape.animate(
              () => {
                index++
                if (index > 9) {
                  index = 0
                }
                let animateLine = {
                  lineDash: [4, 5, 1, 2],
                  lineDashOffset: -index
                }
                return animateLine
              },
              {
                repeat: true,
                duration: 5000
              }
          )
        }
      }, 'polyline')
      const width = document.getElementById('container').scrollWidth * 0.95;
      const height = document.getElementById('container').scrollHeight || 800;
      const graph = new G6.Graph({
        container: 'container',
        width,
        height,
        modes: {
          default: [
            'drag-canvas',
            'drag-node',
            'zoom-canvas'
          ]
        },
        defaultNode: {
          type: 'rect',
          size: [180, 75],
          color: '#3e62ae',
          style: {
            fill: '#DEE9FF',
            stroke: '#5B8FF9',
          },
          labelCfg: {
            style: {
              fill: '#ffffff',
              fontSize: 16
            }
          },
          anchorPoints: [
            [0, 0.5],
            [0.5, 0],
            [1, 0.5],
            [0.5, 1]
          ]

        },
        defaultEdge: {
          type: 'cus-polyline',
          style: {
            offset: 30,
            endArrow: true,
            stroke: 'blue',
          },
        },
      });

      graph.data(this.gDatas);
      graph.render();
      // graph.fitView();

    }
  }
}

</script>

<style scoped>
</style>
