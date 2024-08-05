import { mix, clone, isString } from '@antv/util';

class Command{

  constructor() {
    this._cfgs = this.getDefaultCfg();
    this.list = [];
    this.queue = [];
  }

  /**
   * 获取默认配置对象
   *
   * 此函数旨在返回一个包含默认配置的对象。这些配置主要用于命令管理，
   * 包括缩放增量、命令队列、当前命令索引以及剪贴板内容等设置。
   *
   * @returns {Object} 返回一个对象，其中包含了默认的命令管理配置。
   */
  getDefaultCfg() {
    // 返回默认的配置对象
    return { _command: { zoomDelta: .1, queue: [], current: 0, clipboard: [] } };
  }
  get(key) {
    return this._cfgs[key];
  }
  set(key, val) {
    this._cfgs[key] = val;
  }

  initPlugin(graph) {
    this.initCommands();
    graph.getCommands = () => { return this.get('_command').queue };
    graph.getCurrentCommand = () => {
      const c = this.get('_command');
      return c.queue[c.current - 1]
    };
    graph.executeCommand = (name,cfg) => { this.execute(name, graph, cfg) };
    graph.commandEnable = (name) => { return this.enable(name, graph) };
  }

  registerCommand(name,cfg,){
    if (this[name]){
      mix(this[name], cfg);
    }else {
      const cmd = mix({},{
        name: name,
        shortcutCodes: [],
        queue: true,
        executeTimes: 1,
        init(){},
        enable() { return true },
        execute(graph) {
          this.snapShot = graph.save();
          this.selectedItems = graph.get('selectedItems');
          this.method && (isString(this.method) ? graph[this.method]() : this.method(graph));
        },
        back(graph) {
          graph.read(this.snapShot);
          graph.set('selectedItems',this.selectedItems);
        }
      },cfg);
      this[name] = cmd;
      this.list.push(cmd);
    }
  }

  execute(name, graph, cfg) {
    const cmd = mix({},this[name], cfg);
    const manager = this.get('_command');
    if(cmd.enable(graph)){
      cmd.init();
      if(cmd.queue){
        manager.queue.splice(manager.current, manager.queue.length - manager.current, cmd);
        manager.current++;
      }
    }
    graph.emit('beforecommandexecute', { command: cmd });
    cmd.execute(graph);
    graph.emit('aftercommandexecute', { command: cmd });
    return cmd;
  }

  enable(name, graph) {
    return this[name].enable(graph);
  }

  destroyPlugin() {
    this._events = null;
    this._cfgs = null;
    this.list = [];
    this.queue = [];
    this.destroyed = true;
  }
  _deleteSubProcessNode(graph, itemId) {
    const subProcess = graph.find('node', (node) => {
      if (node.get('model')) {
        const clazz = node.get('model').clazz;
        if (clazz === 'subProcess') {
          const containerGroup = node.getContainer();
          const subGroup = containerGroup.subGroup;
          const item = subGroup.findById(itemId);
          return subGroup.contain(item);
        } else {
          return false;
        }
      } else {
        return false;
      }
    });
    if(subProcess){
      const group = subProcess.getContainer();
      const resultModel = group.removeItem(subProcess, itemId);
      graph.updateItem(subProcess, resultModel);
    }
  }
  /**
   * 初始化命令插件的命令列表。
   * 这里定义了图形编辑器中可用的各种操作命令，如添加、更新、删除节点等。
   * 每个命令通过registerCommand方法注册，并配置其启用条件、执行逻辑和撤销逻辑。
   */
  initCommands() {
    const cmdPlugin = this;

    /**
     * 注册添加命令。
     * 此命令允许在图中添加新节点或元素。
     */
    cmdPlugin.registerCommand('add', {
      enable: function() {
        // 判断是否满足执行条件：必须有类型和添加模型定义。
        return this.type && this.addModel;
      },
      execute: function(graph) {
        // 添加指定类型的节点或元素，并根据执行次数保存添加的元素ID。
        const item = graph.add(this.type, this.addModel);
        if(this.executeTimes === 1)
          this.addId = item.get('id');
      },
      back: function(graph) {
        // 撤销操作：根据之前保存的ID移除对应元素。
        graph.remove(this.addId);
      },
    });

    /**
     * 注册更新命令。
     * 此命令用于更新图中已存在的节点或元素的属性。
     */
    cmdPlugin.registerCommand('update', {
      enable: function() {
        // 判断是否满足执行条件：必须有要更新的元素ID和更新模型。
        return this.itemId && this.updateModel;
      },
      execute: function(graph) {
        // 更新指定ID的节点或元素属性。
        const item = graph.findById(this.itemId);
        if(item) {
          if(this.executeTimes === 1)
            this.originModel = mix({}, item.getModel());
          graph.update(item, this.updateModel);
        }
      },
      back: function(graph) {
        // 撤销操作：将更新的元素属性恢复到更新前的状态。
        const item = graph.findById(this.itemId);
        graph.update(item, this.originModel);
      },
    });

    /**
     * 注册删除命令。
     * 此命令用于删除图中选中的多个节点或元素。
     */
    cmdPlugin.registerCommand('delete', {
      enable: function(graph) {
        // 判断是否满足执行条件：当前模式为编辑模式且有选中的元素。
        const mode = graph.getCurrentMode();
        const selectedItems = graph.get('selectedItems');
        return mode === 'edit' && selectedItems && selectedItems.length > 0;
      },
      method: function(graph) {
        // 实现删除逻辑，包括触发删除前的事件和实际删除操作。
        const selectedItems = graph.get('selectedItems');
        graph.emit('beforedelete', { items: selectedItems });
        if(selectedItems && selectedItems.length > 0) {
          selectedItems.forEach(i => {
            const node = graph.findById(i);
            if (node) {
              graph.remove(i);
            } else {
              cmdPlugin._deleteSubProcessNode(graph, i);
            }
          });
        }
        graph.emit('afterdelete', { items: selectedItems });
      },
      shortcutCodes: ['Delete', 'Backspace'],
    });

    /**
     * 注册重做命令。
     * 此命令用于重做上一个被撤销的操作。
     */
    cmdPlugin.registerCommand('redo', {
      queue: false,
      enable: function(graph) {
        // 判断是否满足执行条件：当前模式为编辑模式且有可重做的操作。
        const mode = graph.getCurrentMode();
        const manager = cmdPlugin.get('_command');
        return mode === 'edit' && manager.current < manager.queue.length;
      },
      execute: function(graph) {
        // 重做指定的操作。
        const manager = cmdPlugin.get('_command');
        const cmd = manager.queue[manager.current];
        cmd && cmd.execute(graph);
        manager.current++;
      },
      shortcutCodes: [['metaKey', 'shiftKey', 'z'], ['ctrlKey', 'shiftKey', 'z']],
    });

    /**
     * 注册撤销命令。
     * 此命令用于撤销上一个操作。
     */
    cmdPlugin.registerCommand('undo', {
      queue: false,
      enable: function(graph) {
        // 判断是否满足执行条件：当前模式为编辑模式且有可撤销的操作。
        const mode = graph.getCurrentMode();
        return mode === 'edit' && cmdPlugin.get('_command').current > 0;
      },
      execute: function(graph) {
        // 撤销操作，通过执行对应操作的back方法实现。
        const manager = cmdPlugin.get('_command');
        const cmd = manager.queue[manager.current - 1];
        if(cmd) {
          cmd.executeTimes++;
          cmd.back(graph);
        }
        manager.current--;
      },
      shortcutCodes: [['metaKey', 'z'], ['ctrlKey', 'z']],
    });

    /**
     * 注册复制命令。
     * 此命令用于复制选中的节点或元素。
     */
    cmdPlugin.registerCommand('copy', {
      queue: false,
      enable: function(graph){
        // 判断是否满足执行条件：当前模式为编辑模式且有选中的元素。
        const mode = graph.getCurrentMode();
        const items = graph.get('selectedItems');
        return mode === 'edit' && items && items.length > 0;
      },
      method: function(graph) {
        // 将选中的第一个元素的类型和模型保存到剪贴板。
        const manager = cmdPlugin.get('_command');
        manager.clipboard = [];
        const items = graph.get('selectedItems');
        if(items && items.length > 0){
          const item = graph.findById(items[0]);
          if(item){
            manager.clipboard.push({ type: item.get('type'), model: item.getModel()});
          }
        }
      },
    });

    /**
     * 注册粘贴命令。
     * 此命令用于在图中粘贴之前复制的节点或元素。
     */
    cmdPlugin.registerCommand('paste', {
      enable: function(graph) {
        // 判断是否满足执行条件：当前模式为编辑模式且剪贴板上有内容。
        const mode = graph.getCurrentMode();
        return mode === 'edit' && cmdPlugin.get('_command').clipboard.length > 0;
      },
      method: function(graph) {
        // 从剪贴板中获取复制的内容并粘贴到图中。
        const manager = cmdPlugin.get('_command');
        this.pasteData = clone(manager.clipboard[0]);
        const addModel = this.pasteData.model;
        addModel.x && (addModel.x += 10);
        addModel.y && (addModel.y += 10);
        const { clazz = 'userTask' } = addModel;
        const timestamp = new Date().getTime();
        const id = clazz + timestamp;
        addModel.id = id;
        const item = graph.add(this.pasteData.type, addModel);
        item.toFront();
      },
    });

    /**
     * 注册放大命令。
     * 此命令用于增加图形的缩放比例。
     */
    cmdPlugin.registerCommand('zoomIn', {
      queue: false,
      enable: function(graph) {
        // 判断是否满足执行条件：当前缩放比例在允许的范围内。
        const zoom = graph.getZoom();
        const maxZoom = graph.get('maxZoom');
        const minZoom = graph.get('minZoom');
        return zoom <= maxZoom && zoom >= minZoom;
      },
      execute: function(graph) {
        // 执行放大操作，记录当前缩放比例，更新缩放比例。
        const manager = cmdPlugin.get('_command');
        const maxZoom = graph.get('maxZoom');
        const zoom = graph.getZoom();
        this.originZoom = zoom;
        let currentZoom = zoom + manager.zoomDelta;
        if(currentZoom > maxZoom)
          currentZoom = maxZoom;
        graph.zoomTo(currentZoom);
      },
      back: function(graph) {
        graph.zoomTo(this.originZoom);
      },
      shortcutCodes: [['metaKey', '='], ['ctrlKey', '=']],
    });
    /**
     * 注册一个命令，用于缩小图形的缩放级别。
     */
    cmdPlugin.registerCommand('zoomOut', {
      queue: false,
      /**
       * 判断是否允许执行缩小命令。
       * @param {Object} graph 图形对象。
       * @return {boolean} 如果当前缩放级别在允许的范围内，则返回true，否则返回false。
       */
      enable: function(graph) {
        const zoom = graph.getZoom();
        const maxZoom = graph.get('maxZoom');
        const minZoom = graph.get('minZoom');
        return zoom <= maxZoom && zoom >= minZoom;
      },
      /**
       * 执行缩小命令。
       * @param {Object} graph 图形对象。
       */
      execute: function(graph) {
        const manager = cmdPlugin.get('_command');
        const minZoom = graph.get('minZoom');
        const zoom = graph.getZoom();
        this.originZoom = zoom;
        let currentZoom = zoom - manager.zoomDelta;
        if(currentZoom < minZoom)
          currentZoom = minZoom;
        graph.zoomTo(currentZoom);
      },
      /**
       * 恢复到执行缩小命令前的缩放级别。
       * @param {Object} graph 图形对象。
       */
      back: function(graph) {
        graph.zoomTo(this.originZoom);
      },
      shortcutCodes: [['metaKey', '-'], ['ctrlKey', '-']],
    });

    /**
     * 注册一个命令，用于重置图形的缩放级别为默认值。
     */
    cmdPlugin.registerCommand('resetZoom', {
      queue: false,
      /**
       * 执行重置缩放命令。
       * @param {Object} graph 图形对象。
       */
      execute: function(graph) {
        const zoom = graph.getZoom();
        this.originZoom = zoom;
        graph.zoomTo(1);
      },
      /**
       * 恢复到执行重置缩放命令前的缩放级别。
       * @param {Object} graph 图形对象。
       */
      back: function(graph) {
        graph.zoomTo(this.originZoom);
      },
    });

    /**
     * 注册一个命令，用于自动调整图形视图以适应画布。
     */
    cmdPlugin.registerCommand('autoFit', {
      queue: false,
      /**
       * 执行自动适应视图命令。
       * @param {Object} graph 图形对象。
       */
      execute: function(graph) {
        const zoom = graph.getZoom();
        this.originZoom = zoom;
        graph.fitView(5);
      },
      /**
       * 恢复到执行自动适应视图命令前的缩放级别。
       * @param {Object} graph 图形对象。
       */
      back: function(graph) {
        graph.zoomTo(this.originZoom);
      },
    });

    /**
     * 注册一个命令，用于将选中的图形元素移至最前端。
     */
    cmdPlugin.registerCommand('toFront', {
      queue: false,
      /**
       * 判断是否允许执行移至最前面的命令。
       * @param {Object} graph 图形对象。
       * @return {boolean} 如果有选中的元素，则返回true，否则返回false。
       */
      enable: function(graph) {
        const items = graph.get('selectedItems');
        return items && items.length > 0;
      },
      /**
       * 执行将选中元素移至最前面的命令。
       * @param {Object} graph 图形对象。
       */
      execute: function(graph) {
        const items = graph.get('selectedItems');
        if(items && items.length > 0) {
          const item = graph.findById(items[0]);
          item.toFront();
          graph.paint();
        }
      },
      /**
       * 恢复执行将元素移至最前面命令前的状态。
       * @param {Object} graph 图形对象。
       */
      back: function(graph) {
      },
    });

    /**
     * 注册一个命令，用于将选中的图形元素移至最背面。
     */
    cmdPlugin.registerCommand('toBack', {
      queue: false,
      /**
       * 判断是否允许执行移至最背面的命令。
       * @param {Object} graph 图形对象。
       * @return {boolean} 如果有选中的元素，则返回true，否则返回false。
       */
      enable: function(graph) {
        const items = graph.get('selectedItems');
        return items && items.length > 0;
      },
      /**
       * 执行将选中元素移至最背面的命令。
       * @param {Object} graph 图形对象。
       */
      execute: function(graph) {
        const items = graph.get('selectedItems');
        if(items && items.length > 0) {
          const item = graph.findById(items[0]);
          item.toBack();
          graph.paint();
        }
      },
      /**
       * 恢复执行将元素移至最背面命令前的状态。
       * @param {Object} graph 图形对象。
       */
      back: function(graph) {
      },
    });
  }
}
export default Command;
