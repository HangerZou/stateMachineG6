import { each } from '@antv/util';
import { vec2 } from '@antv/matrix-util';
/**
 * 注册一个名为'itemAlign'的行为，用于在节点拖动时对齐节点。
 * @param {Object} G6 G6图库的实例
 */
export default function(G6) {
  const { mix } = G6.Util;

  /**
   * 注册行为的默认配置
   */
  G6.registerBehavior('itemAlign', {
    /**
     * 获取行为的默认配置
     * @returns {Object} 默认配置，包括对齐线的样式、容差和对齐线数组
     */
    getDefaultCfg() {
      return {
        alignLineStyle: { stroke: '#FA8C16', lineWidth: 1 }, // 对齐线的样式
        tolerance: 5, // 容差，用于判断是否需要对齐
        _alignLines: [], // 存储对齐线的数组
      };
    },

    /**
     * 获取行为相关的事件处理函数
     * @returns {Object} 事件处理函数映射表，包括节点拖动后和拖动结束时的处理函数
     */
    getEvents() {
      return {
        'afternodedrag': 'onDrag', // 节点拖动后触发
        'afternodedragend': 'onDragEnd', // 节点拖动结束时触发
      };
    },

    /**
     * 节点拖动时的处理函数，清除原有对齐线并重新计算对齐
     * @param {Object} shape 被拖动的节点形状对象
     */
    onDrag(shape) {
      this._clearAlignLine(); // 清除原有对齐线
      this._itemAlign(shape); // 计算并绘制新的对齐线
    },

    /**
     * 节点拖动结束时的处理函数，清除对齐线
     */
    onDragEnd() {
      this._clearAlignLine();
    },

    /**
     * 计算并处理节点的对齐
     * @param {Object} item 要对齐的节点对象
     */
    _itemAlign(item) {
      const bbox = item.getBBox(); // 获取节点的边界框
      const ct = { x: bbox.x + bbox.width / 2, y: bbox.y }; // 中心点顶部
      const cc = { x: bbox.x + bbox.width / 2, y: bbox.y + bbox.height / 2 }; // 中心点
      const cb = { x: bbox.x + bbox.width / 2, y: bbox.y + bbox.height }; // 中心点底部
      const lc = { x: bbox.x, y: bbox.y + bbox.height / 2 }; // 左侧中心
      const rc = { x: bbox.x + bbox.width, y: bbox.y + bbox.height / 2 }; // 右侧中心
      const nodes = this.graph.getNodes(); // 获取所有节点
      each(nodes, (node) => {
        const horizontalLines = []; // 存储水平对齐线的信息
        const verticalLines = []; // 存储垂直对齐线的信息
        let p = null;
        const bbox1 = node.getBBox(); // 获取当前遍历节点的边界框
        each(this.getHorizontalLines(bbox1), (line) => {
          horizontalLines.push(this.getDistance(line, ct));
          horizontalLines.push(this.getDistance(line, cc));
          horizontalLines.push(this.getDistance(line, cb));
        });
        each(this.getVerticalLines(bbox1), (line) => {
          verticalLines.push(this.getDistance(line, lc));
          verticalLines.push(this.getDistance(line, cc));
          verticalLines.push(this.getDistance(line, rc));
        });
        horizontalLines.sort((a, b) => a.dis - b.dis); // 根据距离排序水平对齐线
        verticalLines.sort((a, b) => a.dis - b.dis); // 根据距离排序垂直对齐线
        // 检查并处理水平对齐
        if (horizontalLines.length > 0 && horizontalLines[0].dis < this.tolerance) {
          item.attr({ y: horizontalLines[0].line[1] - horizontalLines[0].point.y + bbox.y });
          p = { horizontals: [horizontalLines[0]] };
          for (let i = 1; i < 3; i++) {
            if (horizontalLines[0].dis === horizontalLines[i].dis) {
              p.horizontals.push(horizontalLines[i]);
            }
          }
        }
        // 检查并处理垂直对齐
        if (verticalLines.length > 0 && verticalLines[0].dis < this.tolerance) {
          item.attr({ x: verticalLines[0].line[0] - verticalLines[0].point.x + bbox.x });
          if (p) {
            p.verticals = [verticalLines[0]];
          } else {
            p = { verticals: [verticalLines[0]] };
          }
          for (let i = 1; i < 3; i++) {
            if (verticalLines[0].dis === verticalLines[i].dis) {
              p.verticals.push(verticalLines[i]);
            }
          }
        }
        if (p) {
          p.bbox = bbox; // 记录原始节点的边界框
          this._addAlignLine(p); // 添加对齐线
        }
      });
    },

    /**
     * 添加对齐线
     * @param {Object} p 包含对齐信息的对象
     */
    _addAlignLine(p) {
      const group = this.graph.get('group'); // 获取图形组
      const bbox = p.bbox; // 原始节点的边界框
      const lineStyle = this.alignLineStyle; // 对齐线的样式
      const lineArr = this._alignLines; // 对齐线数组
      // 处理水平对齐线
      if (p.horizontals) {
        each(p.horizontals, function(lineObj) {
          const line = lineObj.line;
          const point = lineObj.point;
          const lineHalf = (line[0] + line[2]) / 2;
          let x1, x2;
          if (point.x < lineHalf) {
            x1 = point.x - bbox.width / 2;
            x2 = Math.max(line[0], line[2]);
          } else {
            x1 = point.x + bbox.width / 2;
            x2 = Math.min(line[0], line[2]);
          }
          const shape = group.addShape('line', {
            attrs: mix({ x1, y1: line[1], x2, y2: line[1] }, lineStyle),
            capture: false,
          });
          lineArr.push(shape);
        });
      }
      // 处理垂直对齐线
      if (p.verticals) {
        each(p.verticals, function(lineObj) {
          const line = lineObj.line;
          const point = lineObj.point;
          const lineHalf = (line[1] + line[3]) / 2;
          let y1, y2;
          if (point.y < lineHalf) {
            y1 = point.y - bbox.height / 2;
            y2 = Math.max(line[1], line[3]);
          } else {
            y1 = point.y + bbox.height / 2;
            y2 = Math.min(line[1], line[3]);
          }
          const shape = group.addShape('line', {
            attrs: mix({ x1: line[0], y1, x2: line[0], y2 }, lineStyle),
            capture: false,
          });
          lineArr.push(shape);
        });
      }
    },

    /**
     * 获取节点的水平对齐线数组
     * @param {Object} bbox 节点的边界框对象
     * @returns {Array} 水平对齐线的数组
     */
    getHorizontalLines(bbox) {
      return [
        [bbox.minX, bbox.minY, bbox.maxX, bbox.minY], // 左上到右上
        [bbox.minX, bbox.centerY, bbox.maxX, bbox.centerY], // 左中到右中
        [bbox.minX, bbox.maxY, bbox.maxX, bbox.maxY], // 左下到右下
      ];
    },

    /**
     * 获取节点的垂直对齐线数组
     * @param {Object} bbox 节点的边界框对象
     * @returns {Array} 垂直对齐线的数组
     */
    getVerticalLines(bbox){
      return [
        [bbox.minX, bbox.minY, bbox.minX, bbox.maxY],       // tlbl
        [bbox.centerX, bbox.minY, bbox.centerX, bbox.maxY], // tcbc
        [bbox.maxX, bbox.minY, bbox.maxX, bbox.maxY],       // trbr
      ]
    },
    /**
     * 计算一个点到一条线段的距离。
     *
     * @param {Array} line 线段的两个端点坐标，格式为 [x1, y1, x2, y2]。
     * @param {Object} point 点的坐标，格式为 {x: number, y: number}。
     * @returns {Object} 返回一个对象，包含原始的线和点，以及计算得到的距离，格式为 {line, point, dis: number}。
     */
    getDistance(line, point) {
      // 使用pointLineDistance函数计算点到线段的距离，并将结果包含在对象中返回
      return { line, point, dis: this.pointLineDistance(line[0], line[1], line[2], line[3], point.x, point.y) };
    },
    /**
     * 计算一个点到一条直线的距离。
     *
     * @param {number} lineX1 直线上一点的x坐标。
     * @param {number} lineY1 直线上一点的y坐标。
     * @param {number} lineX2 直线上另一点的x坐标。
     * @param {number} lineY2 直线上另一点的y坐标。
     * @param {number} pointX 点的x坐标。
     * @param {number} pointY 点的y坐标。
     * @returns {number} 返回点到直线的距离。
     */
    pointLineDistance: function(lineX1, lineY1, lineX2, lineY2, pointX, pointY) {
      // 计算直线的长度向量
      const lineLength = [lineX2 - lineX1, lineY2 - lineY1];
      // 如果直线长度为0，表示两点重合，此时无法计算距离，返回NaN
      if (vec2.exactEquals(lineLength, [0, 0])) return NaN;
      // 计算与直线垂直的向量
      let s = [-lineLength[1], lineLength[0]];
      // 对垂直向量进行标准化
      vec2.normalize(s, s);
      // 计算点到直线的距离，使用向量点积公式
      return Math.abs(vec2.dot([pointX - lineX1, pointY - lineY1], s));
    },
    _clearAlignLine(){
      each(this._alignLines, (line) => {
        line.remove();
      });
      this._alignLines = [];
      this.graph.paint();
    },

  });
}
