# Thesis 验收记录 · 2026-09-16

final result: blocked

本轮功能与导航回归通过，已修复下列视觉和交互问题；严格像素级验收仍被一项文字换行差异阻挡。这里没有把“测试通过”等同于“完全还原”。

## 仍未通过

**[P2] 字距差异会改变部分文字换行。** Figma 使用 Delight Regular/Medium、1% 字距；当前实现约束要求字距为 0。字体文件、字号、行高一致，但在 393px 宽度下，Sam Altman 的 P04 正文为 4 行，参考为 5 行，整项 226px 对比 248px，相差 22px。其他若干段落的行尾词也不同。没有用固定卡片高度、缩窄正文或手工换行掩盖问题。严格一致需要先统一设计与实现的字距规范，再重新测量截断。

证据：[P04 逐项对照](docs/qa/thesis-2026-09-16/compare-item-P04.png)、[全部卡片高度](docs/qa/thesis-2026-09-16/card-metrics.json)。九张卡片中八张整体高度与参考一致，不代表每个字的换行位置都相同。

## 本轮已修复

| 优先级 | 位置 / 问题 | 修改与复核 |
| --- | --- | --- |
| P1 | All updates 的 Jul 8 更新漏了整组媒体 | 使用 Figma 原始两张图片和已有 MSFT 图表；240×135、间距 8、圆角 8、0.5px 边线。浮层及选中该历史版本后的详情复用同一媒体组件。 |
| P1 | Chamath 个人页误用了另一个人的头像 | 恢复原始 Chamath 图片，按设计的裁切比例显示；没有重画或替换成占位头像。 |
| P2 | 个人页 Follow/Share 顺序、按钮宽度、Active/Archived 样式错误 | 访客页使用下划线 tabs；自己的 Library 保留胶囊筛选。恢复 Follow 在 Share 左侧、hug 宽度及设计间距。 |
| P2 | 个人页简介截断、说明区与收起后标题不符 | 简介按稿显示，Show more 内联；公共信息说明使用共享灰底/圆角 token；滚动后顶部出现头像与姓名。 |
| P2 | Followers/Following 标签、数量与分隔线不完整 | 等宽标签展示计数，列表下描边延伸到屏幕边缘。 |
| P2 | Search 返回后 Recent 没有即时刷新、超过五项 | 记录访问即刷新、去重并保留完整历史，只显示最近五项；保留返回时的位置和焦点。删除入口扩大命中区域。 |
| P2 | Tickers/People 单分类仍重复显示分组标题 | 按分类设计去除重复标题；Tickers 筛选上下各 12px，People 首行直接承接 tabs。 |
| P2 | 手动正文段间距和首页标题栏下描边缺失 | 手动 feed 正文按空行间隔排版；P01 总高恢复 633px；For You 使用 line/l12 的 0.5px 下描边。 |
| P2 | 快速往返时动画竞争、隐藏页面累积 | 新跳转从当前视觉位置接续并取消旧动画；新分支清理被替代的页面和监听器，保留当前祖先链供返回。 |

## 参考与证据

源文件：[Feed Mobile MVP](https://www.figma.com/design/EHag6olZJxmlkf1hbAzSi7/Feed-Mobile-MVP)。实现为 `#/mvp-social`，名称 Thesis。

| 页面 / 状态 | Figma 节点 | 对照截图 |
| --- | --- | --- |
| For You | 5742:114415，用户入口 5851:100223 | [首页](docs/qa/thesis-2026-09-16/compare-home.png) |
| 九种 feed 项 | 5742:114435/114434/114441/114443/114437/114440/114438/114439/114442 | [P06](docs/qa/thesis-2026-09-16/compare-item-P06.png)、[P01](docs/qa/thesis-2026-09-16/compare-item-P01.png)、[S05](docs/qa/thesis-2026-09-16/compare-item-S05.png)、[P04](docs/qa/thesis-2026-09-16/compare-item-P04.png)、[S01](docs/qa/thesis-2026-09-16/compare-item-S01.png)、[P07](docs/qa/thesis-2026-09-16/compare-item-P07.png)、[P02](docs/qa/thesis-2026-09-16/compare-item-P02.png)、[S02](docs/qa/thesis-2026-09-16/compare-item-S02.png)、[S06](docs/qa/thesis-2026-09-16/compare-item-S06.png) |
| Search 默认 / All / Tickers / People | 6305:68946、6305:69407、6360:158563、6360:158740 | [默认](docs/qa/thesis-2026-09-16/compare-search.png)、[All](docs/qa/thesis-2026-09-16/compare-search-all.png)、[Tickers](docs/qa/thesis-2026-09-16/compare-search-tickers.png)、[People](docs/qa/thesis-2026-09-16/compare-search-people.png) |
| Me / 外部个人页 | 5979:51478、5482:88631 | [Me](docs/qa/thesis-2026-09-16/compare-me.png)、[外部个人页](docs/qa/thesis-2026-09-16/compare-profile.png) |
| 详情 / All updates | 6908:68814、6720:91916；媒体 6948:66743 | [详情](docs/qa/thesis-2026-09-16/compare-detail.png)、[浮层](docs/qa/thesis-2026-09-16/compare-sheet.png) |

每张对照图左侧为 Figma，右侧为浏览器实拍。393×852 参考移除 59px 系统状态栏及 34px 系统底栏后，与 393×759 页面比较；卡片另按完整节点导出，避免 Figma 父级 viewport 截掉屏外内容。另测 320/360/430px，320px 使用逻辑宽度 360px 等比缩放。

详情参考与现有列表的作者、日期、ticker 不同。详情对照只在验收浏览器内替换对应样例文字，以检查相同内容下的几何；没有将生产数据改成同一个样例。浮层对照暂时移除实际 Jul 13 最新项以匹配设计的 Jul 10 首项，因此背景页面、版本数量不作逐像素等价声明。实际版本及媒体归属由独立交互测试验证。搜索对照中的 Follow/Following 随已关注状态变化，输入框在点击分类后处于失焦状态，与稿中的黑色焦点边线不是同一状态，未把这两处当作 token 偏差。

局部对照覆盖所有九张完整 feed 项；全页对照检查标题、头像、tabs、字段与底栏。图片和 SVG 继续使用 Figma 原资源。图表与原始图片哈希核对一致；没有因截图缩放差异重复替换图表。

## 五项还原检查

| 检查面 | 结论 |
| --- | --- |
| 字体 / 排版 | Delight 字体资源、Regular/Medium、14/22 正文、12/20 辅助文字已核对；零字距导致的换行差异仍未通过。 |
| 布局 / 间距 | 核对 Auto Layout 方向与 flex 伸缩、16px 页面边距、8/12/24px 语义间距、圆角、0.5px 下描边。详情正文 y=100、来源 y=370、图表 y=402、ticker y=549、tabs y=589、底栏 y=711，与同内容参考吻合。 |
| 颜色 / 变量 | 修改复用 `--n5/--n7/--n9`、`--br03`、`--m1/--m2`、`--l12/--l2`、共享 spacing/radius/hairline 变量；外部说明区改为 br03+n7。暗色适配作可用性检查，未提供对应暗色稿，不宣称暗色像素一致。 |
| 资源 / 清晰度 | 原始头像、图表及 SVG 保留；新增媒体使用设计原位图，按 FILL/FIT 区分 cover/contain；没有整页截图模拟界面。 |
| 文案 / 内容 | 保留每条 feed 的作者、角色、正文、ticker 与历史版本内容；未把最新 charts/signals 复制给没有证据的历史版本。已知空状态和 demo 数据行为沿用现有实现。 |

## 交互与动效

- 页面前进从右侧进入，父页后退 18%；返回时当前页向右加速退出，父页恢复，统一 260ms。逐帧证据：[前进](docs/qa/thesis-2026-09-16/motion-forward.png)、[返回](docs/qa/thesis-2026-09-16/motion-back.png)，采样 0/65/130/195/259ms。
- 连续六次在 40ms 内打断跳转、详情→个人页→返回→浏览器前进均通过；反复二十次进入/返回没有新增可交互的隐藏页面。
- All updates 支持关闭按钮、遮罩、Escape、下拉手柄、浏览器返回；浏览器前进可恢复浮层。横向滑图不选择版本，点更新正文才进入对应版本。
- 版本切换保持书签状态，回到 Latest 正确恢复当前正文和证据；分享 URL 包含 post/version，深链能打开对应历史内容。
- 低动态偏好可跳过页面位移动效。未用真机性能分析仪测量帧率；截图与浏览器自动化不等于真实手机性能保证。

## 验证范围

通过：`mvp-thesis.cjs`、新增 `mvp-thesis-audit.cjs`、扩展 `mvp-thesis-detail.cjs`、`mvp-social-device.cjs`；audit/detail 在 Chromium 与 WebKit 两个引擎检查。原 MVP 的 `mvp-feed-reference.cjs` 和 `mvp-refresh.cjs` 回归通过。原 MVP 原有的零字距换行差异未在本次改动中扩大。

覆盖：首页九项、详情与历史媒体、信号与相关条目、搜索默认/查询/分类/空结果/清空确认、Recent、Me 五个栏目、外部/成员个人页、关注列表、来源/ticker/Alva 入口、书签与返回状态。六个设备预设的三主页和详情安全区通过；真实移动端尺寸不绘制演示系统状态栏和底部手势条。

本轮范围为当前 Thesis 与共享 MVP 回归，不代表重新验收早期 baby 全部独立页面。样例数据不具备真实账户/后台业务能力。没有实体 Android/iPhone 真机，本轮移动兼容证据来自 Chromium、WebKit 与设备预设。

## 实施清单

- [x] 实际打开参考与浏览器页面，合成同屏对照，而非只读代码。
- [x] 修复确认的头像、媒体、布局、状态和动效问题。
- [x] 九类卡片逐项检查，320/360/393/430px 布局与设备安全区检查。
- [x] 关键交互与原 MVP 回归；静态差异检查无错误。
- [ ] 严格像素级通过：字距规范统一后重新验收 P04 和正文行尾位置。
