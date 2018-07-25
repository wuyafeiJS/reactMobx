# react-demo

一个 React 纯 Web 项目脚手架，根据 create-react-app 进行改造的，原版的 `REAMDME` 重命名为 `README.o`。

## 快速启动

##### 安装依赖

```bash
yarn install
```

##### 启动本地 Server

```
yarn start
```

##### 本地代理配置

修改根目录下 `.devproxy.js` 文件，配置方式参考 [devServer.proxy](https://www.webpackjs.com/configuration/dev-server/#devserver-proxy)。

##### 打包构建

```
yarn build
```

## src 目录结构

```
src
├── App.js 页面根组件
├── index.js 项目入口
├── Router.js 全局路由配置
├── assets
│   ├── images 图片资源
│   └── ...
├── components 全局复用的组件
│   ├── Toast.js
│   ├── Toast.css
│   └── ...
├── config 系统配置
│   ├── base.js 与环境无关的通用配置
│   ├── dev.js
│   ├── test.js
│   ├── uat.js
│   └── prod.js 生产环境
├── lib
│   ├── const.js
│   ├── fetch 对网络请求做了封装，不同后台功能数据格式可能不同，所以可自行定制，参考例子 quote/simila
│   │   ├── base.js
│   │   ├── index.js
│   │   ├── quote.js
│   │   └── simila.js
│   ├── jsb.js 嵌入至易淘金App时才用到
│   ├── sa.js 神策上报封装（只包含基础逻辑，各上报需求需再开发）
│   ├── sentry.js 错误上报
│   ├── tesla.js 消息总线，主要用于全局跨组件通信
│   ├── user.js 基于JSB的用户模块（根据项目情况改写）
│   └── util.js 工具库
├── mock 数据模拟
│   ├── fetch.js
│   ├── jsb.js web环境下开发通常会使用
├── routes   路由页面组件代码（文件结构可自定义）
│   ├── Home.css
│   ├── Home.js
│   └── ...
└── ...
```

## 项目说明

#### 1. 数据请求

```js
import { quoteFetch, similaFetch } from 'lib/fetch';
quoteFetch(url, options)
  .then(data => {
    // 已解包，输出目标数据
    console.log(data);
  })
  .catch(body => {
    // body的格式为 { code: xx, msg: xxx }
  });
```

options 为原生 fetch api 的 options，额外支持下列参数：

1.  toastError：请求错误时是否弹 toast，默认为 false。
2.  indicator：是否显示全局 loading，GET 请求默认为 false，POST 默认为 true。
3.  params: get 请求参数对象
4.  data: post 请求参数对象（无须手动 JSON 序列化）

约定：这些 `quoteFetch`、`similaFetch` 以及后续新增的接口，都必须加入解包规则，即磨平不同接口的数据格式差异，对应用上层返回统一的格式：

```
{ code: 0, data: xxx, msg: xxx }
```

> Sample.js 有示例展示

#### 2. 数据 Mock

规则方法见 mock/jsb.js 和 mock/fetch.js。
fetch 接口的 mock 结构为：

```
{
    rule: xxx, // 通过正则匹配URL
    res: xxx // 返回的数据
}
```

#### 3. CSS Module

项目支持 css module，构建时支持（非运行时），使用方法如下：

```css
/* mycomp.css */
.class-a {
  /* ... */
}
```

```js
// mycomp.js
import './mycomp.css';

export default () => <div styleName="class-a" />;
```

使用 `styleName` 引入的样式名自动加入前缀隔离 css，同时不影响原有全局样式功能 `className`，如：

```js
// mycomp.js
import './mycomp.css';

export default () => <div styleName="class-a" className="global-class" />;
```

#### 4. 多环境开发打包

```bash
# 开发
yarn start # 默认dev环境
yarn run start:test
yarn run start:uat
yarn run start:prod

# 打包
yarn build # 默认prod环境
yarn run build:dev
yarn run build:test
yarn run build:uat
```

#### 5. 命名及引用规则

* 组件的文件名大写开头，如 `Indicator.js`，对应样式文件 `Indicator.css`。
* module-resolver 已包含 `src` 目录，`src` 目录下文件可以像引用 node_modules 模块一样不需要相对或绝对路径。如希望引用 `/src/lib/tesla`，无论在任何地方直接使用 `import tesla from 'lib/tesla'` 即可，其他模块同理。

#### 6. Sentry 上报配置

Sentry 功能主要为 crash 监控和分析，可在线解析 sourcemap 文件。

步骤：

1.  申请内网 Sentry 平台账号；
2.  修改 `src/config/${env}.js` 中 sentry 上报地址 `DSN`
3.  修改 `config/sentry.${env}.properties` 上传 `sourcemap` 相关配置；
4.  在 `src/index.js` 中引入 `lib/sentry`；
5.  sentry 的 release 版本是根据 package.json 的 version 组合成的，格式为`${version}-${env}`

在手脚架中已内置一个 demo 配置，可以直接体验。

## 注意事项

1.  .eslintrc.yaml 不建议轻易修改，更不建议添加`/* eslint disable */`来关闭 eslint 检查，尽量按照既定的编码规则编写代码。

## 关于分支管理

通常我们在 develop 分支上特性开发, 个人在本地可自建分支, 可以更好的管理提交纪录, 使 develop 的提交纪录更干净些

发布版本之后再打 tag 合并到 master 分支

## 如何发布?

Todo...

## VSCode 插件配置

目前来说，使用 vscode，配合相关插件，可以大大改善项目的开发体验，列举推荐配置如下：
**插件**

1.  ESLint
2.  Prettier
3.  CSS Modules Syntax Highlight
4.  EditorConfig for VS Code
