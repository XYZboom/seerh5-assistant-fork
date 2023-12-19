// 以下信息仅在 >= 1.0版本内显示，后续1.0版本发布后（应为第一个可用的稳定版）将删除并重新开始记录changelog
// 为什么要删掉？一个是因为乱；一个是后面肯定会用上更好的changelog管理工具而不是手动编辑；最重要的一点：changelog一般是供开发者了解功能变更，从而帮助版本的迁移。但是前面这会根本没有人用，自然不用关心这些问题...

RoadMap: **见Readme**

**注意，正在进行0.6.0版本的重构和功能添加，暂时不具备可用性**

- [ ] 整理github issue和project, 删除过远和不够明确的目标, 关闭暂时无法复现的问题, 关闭已经完成的内容并链接commit/pr
- [ ] sdk中core版本兼容性检测, 添加core版本字段(必填), 并规范launcher的core实例和sdk使用的api之间的关系
- [ ] 统一签到模组(`sign`)到关卡, 将无战斗纯发包的也视为关卡的一种
  - [ ] 可能需要重新设计关卡的整体接口
  - [ ] 顺便解决关卡进度指示器的问题
- [ ] sdk中的同步core版本号脚本
- [ ] 战斗日志保存
- [ ] script通过语法树进行高级反混淆, 暂定主要目标是升级 async/await
- [x] 一键收星星
- [ ] 自定义背景（各种意义上？）
- [x] 控制中心：自动治疗开关
- [ ] QuickAccess重做，移入主界面底部
- [ ] ctOverride
- [ ] 日常新增：功勋任务
- [ ] spt扫荡
- [ ] 精灵养成模组，每天自动养成指定精灵
  - [ ] 自动消耗积分
  - [ ] 指定一个列表，自动选择没有达到指标的精灵进行养成
- [ ] launcher语法高亮模块
- [ ] launcher轻量配置编辑器模块，日志显示模块
- [ ] launcher和server的logger模块
- [ ] 调度界面, 删除全部已完成
- [ ] 考虑如何使`Strategy`的编写更加简便, 同时添加更简单的fallback支持(可能添加一个字段?)
  - [ ] 例如`true`代表fallback到自动, 否则链式依次fallback


# Core v0.7.x

- [x] 使用类型来提示SDK使用者和Launcher开发者当前Core的版本
  - [x] 从`CoreLoader`上来获取实例版本, 从type中获取api定义的版本
- [x] `CoreLoader`现在不需要传入监听事件名了
- [x] 属性攻击/特攻/物攻的枚举
- [x] 额外允许一些模块打印关键日志, 通过`common`包下的`log`模块启用
  - [x] `Log.setLogger()`允许使用自定义logger, 默认启用console.log, 输出格式为`[sea-core][module name]:`
  - [x] 外部api为`Log.enable()`和`Log.disable()`, 通过传入模块名称来开启这一部分的输出
  - [x] 目前暂定支持的模块只有`Battle`, 开启后将输出Operator模块的入参
- [x] `LevelRunner` api更改
- [x] 更改事件签名方式->`type:event`
- [x] 修复缺失的`fromEventPattern`导出
- [x] 更换`playerSuit`的检测方式, 添加更多定义
- [x] `GameConfigQuery` api更新
  - [x] 添加查询id的`getIdByName` 方法
  - [x] 现在要求传入以id为键的Map, 查询id时现在基于Map, 以此加快对大表进行id查找时的速度
  - [x] 添加对`Equipment`(装备)的查询
  - [x] `Query`的查询方法现在具有正确的可空返回type

# Core 当前版本 v0.8.1

- [x] 精简api界面, 删除不必要的导出
  - [x] 删除不常用的子包导出
  - [x] 删除不必要的实体接口
  - [x] 重命名`SocketBuilderRegistry`为`SocketDeserializerRegistry`
  - [x] `Battle`下导出全部重新组织
- [x] `SEAPet` 更换更优雅的链式调用api
- [ ] 重新组织命名空间导出到专门的模块导出
- [ ] 全体治疗基于Promise重写, 不需要加延时
- [ ] 查询关卡获取的因子数量
- [ ] `Strategy`模块重写, 提供更加方便优雅的api, 且统一大部分操作
  - [ ] 包括技能对点, 自动, 第五, 攻击
  - [ ] 可能需要单独导出一个StrategyMatcher模块
- [ ] 对于CoreLoad的注册hook, 提供标志位来进行功能的打开，关闭
  - [ ] 同时公开hook数组, 以便登录器层可以开关特定功能
- [ ] 启用单元测试，集成测试作为单独的包，移出core
- [ ] 解耦登录器/后端特定逻辑, 分离非核心功能, 部分移动到登录器下的`features`包下, 由登录器提供扩展定义, 部分合并到`engine`中
  - [ ] script解密
  - [ ] 对战显血
  - [ ] 自动关弹窗
  - [ ] logFilter
- [ ] 日志模块重写，可以动态改变等级，输出object而不是消息，可以子logger化
- [ ] 对于部分错误, 封装错误类
  - [ ] 暂定有影响DRY原则的错误封装
- [ ] 查询魂印激活放到SEAPet中
- [ ] 完善pet缓存逻辑
  - [ ] 同时优化第五和魂印的检测逻辑
- [ ] 更名
  - [ ] `SEAPet` -> `spet`
  - [ ] `GameConfigRegistry.getQuery` -> `query`
  - [ ] `extendEngine` -> `sea.core.extend`
  - [ ] `Engine` -> `engine`
  - [ ] `SEABattle` -> `battle`
  - [ ] `CoreLoader` -> `core`

# 低优先级

- [ ] 本地文件缓存
- [ ] 字体设置
- [ ] join all pet, 全局pet筛选
- [x] 根组件渲染提前到Core.init
- [ ] jsx外部化, import-map共享react
- [ ] cookie issue
- [ ] 更换store库(不用context)
- [ ] 在三个加载资源处都显示 总加载文件数 当前文件名 当前已下载大小/当前文件大小