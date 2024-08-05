const themes = {
    // 默认主题
    default: {
        node: {
            fill: '#92949F', // 节点背景颜色
            stroke: '#00C0A5', // 节点边框颜色
            label: '#666', // 节点标签颜色
            beginFill: '#9FD4FB', // 节点开始颜色
            endFill: '#C2E999', // 节点结束颜色
            beginIcon:'start1.svg', // 节点开始图标
            endIcon:'end1.svg' // 节点结束图标
        },
        edge: {
            stroke: '#ccc', // 边的颜色
            label: '#666', // 边标签颜色
            labelBg: '#ffffff' // 边标签背景颜色
        },
        background: '#ffffff' // 背景颜色
    },
    // 亮色主题
    light: {
        node: {
            fill: '#ffffff', // 节点背景颜色
            stroke: '#cccccc', // 节点边框颜色
            label: '#000000', // 节点标签颜色
            beginFill: '#9FD4FB', // 节点开始颜色
            endFill: '#C2E999', // 节点结束颜色
            beginIcon:'start1.svg', // 节点开始图标
            endIcon:'end1.svg' // 节点结束图标
        },
        edge: {
            stroke: '#e2e2e2', // 边的颜色
            label: '#000000', // 边标签颜色
            labelBg: '#f5f5f5' // 边标签背景颜色
        },
        background: '#f5f5f5' // 背景颜色
    },
    // 暗色主题
    dark: {
        node: {
            fill: '#333333', // 节点背景颜色
            stroke: '#666666', // 节点边框颜色
            label: '#ffffff', // 节点标签颜色
            beginFill: '#9FD4FB', // 节点开始颜色
            endFill: '#C2E999' ,// 节点结束颜色
            beginIcon:'start1.svg', // 节点开始图标
            endIcon:'end1.svg' // 节点结束图标
        },
        edge: {
            stroke: '#555555', // 边的颜色
            label: '#ffffff', // 边标签颜色
            labelBg: '#1e1e1e' // 边标签背景颜色
        },
        background: '#1e1e1e' // 背景颜色
    },
    //护眼主题
    eye: {
        node: {
            fill: '#ffffff', // 节点背景颜色
            stroke: '#666666', // 节点边框颜色
            label: '#000000', // 节点标签颜色
            beginFill: '#9FD4FB', // 节点开始颜色
            endFill: '#C2E999', // 节点结束颜色
            beginIcon:'start1.svg', // 节点开始图标
            endIcon:'end1.svg' // 节点结束图标
        },
        edge: {
            stroke: '#838282', // 边的颜色
            label: '#000000', // 边标签颜色
            labelBg: '#B5E6B5' // 边标签背景颜色
        },
        background: '#B5E6B5'
    },
    CNR: {
        node: {
            fill: '#ffffff', // 节点背景颜色
            stroke: '#e3baba', // 节点边框颜色
            label: '#000000', // 节点标签颜色
            beginFill: '#9FD4FB', // 节点开始颜色
            endFill: '#C2E999', // 节点结束颜色
            beginIcon:'darkPurpleStart.svg', // 节点开始图标
            endIcon:'darkYellowEnd.svg' // 节点结束图标
        },
        edge: {
            stroke: '#f5f5f5', // 边的颜色
            label: '#2d2d2d', // 边标签颜色
            labelBg: '#aa381e' // 边标签背景颜色
        },
        background: '#aa381e'
    },
    CharmingPurple: {
        node: {
            fill: '#ffffff', // 节点背景颜色
            stroke: '#e3baba', // 节点边框颜色
            label: '#000000', // 节点标签颜色
            beginFill: '#9FD4FB', // 节点开始颜色
            endFill: '#C2E999', // 节点结束颜色
            beginIcon:'lightPurpleStart.svg', // 节点开始图标
            endIcon:'lightPinkEnd.svg' // 节点结束图标
        },
        edge: {
            stroke: '#f5f5f5', // 边的颜色
            label: '#2d2d2d', // 边标签颜色
            labelBg: '#c017d3' // 边标签背景颜色
        },
        background: '#c017d3'
    },
};

export default themes;