import editorStyle from '../util/defaultStyle';
import Item from '@antv/g6/lib/item/item';
import { deepMix } from '@antv/util';

export default class Anchor extends Item {
  /**
   * 创建一个锚点对象。
   *
   * 此构造函数用于初始化一个锚点实例，配置锚点的属性，并设置其为激活状态或非激活状态。
   * 它通过对传入配置项的深度合并来设定锚点的默认属性，确保锚点的行为和样式符合编辑器的要求。
   *
   * @param {Object} cfg 锚点的配置项，包括类型、激活状态和模型等信息。
   */
  constructor(cfg) {
    // 调用父类构造函数，传入合并后的配置项，确保锚点的类型和默认样式被正确设置。
    super(deepMix(cfg,{
      type: 'anchor',
      isActived: false,
      model: {
        type: 'anchor',
        style: {
          ...editorStyle.anchorPointStyle,
          cursor: editorStyle.cursor.hoverEffectiveAnchor,
        }
      },
    }));
    // 启用捕捉模式，使得锚点可以响应鼠标操作。
    this.enableCapture(true);
    // 标记当前对象为锚点，用于内部逻辑判断和处理。
    this.isAnchor = true;
    // 将锚点对象放置到最前端，确保其在视觉上位于其他元素之上。
    this.toFront();
  }

  showHotpot(){
    this.hotpot = this.getContainer().addShape('marker', {
      attrs: {
        ...this.get('model').style,
        ...editorStyle.anchorHotsoptStyle
      },
      name: 'hotpot-shape',
      draggable: true,
    });
    this.hotpot.toFront();
    this.getKeyShape().toFront();
  }
  setActived(){
    this.update({style: {...editorStyle.anchorPointHoverStyle}});
  }
  clearActived(){
    this.update({style: {...editorStyle.anchorPointStyle}});
  }
  setHotspotActived(act){
    this.hotpot &&
    (act ?
      this.hotpot.attr(editorStyle.anchorHotsoptActivedStyle)
      : this.hotpot.attr(editorStyle.anchorHotsoptStyle))
  }
}
