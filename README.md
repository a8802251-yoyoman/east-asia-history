# 高中歷史第二冊・東亞史 教學網

楊梅高中歷史科　何友友老師教學網

普通型高中歷史第二冊「中國與東亞的歷史」。五個版本（南一、龍騰、翰林、三民、泰宇）的內容**不分版本、綜整合一**，依 108 課綱架構重新編寫。

## 怎麼用

純靜態網站，沒有任何後端或編譯步驟。直接用瀏覽器開啟 `index.html` 即可。

## 架設到 GitHub Pages

1. 建立一個新的 repository（例如 `eastasia-history`）
2. 把本資料夾內**所有檔案**上傳到 repo 根目錄（`index.html` 要在最外層）
3. 進入 repo 的 **Settings → Pages**
4. Source 選 **Deploy from a branch**，Branch 選 `main`、資料夾選 `/ (root)`，按 Save
5. 等一兩分鐘，網址會是 `https://<你的帳號>.github.io/<repo名稱>/`

## 兩條動線，同一套內容

| 動線 | 入口 | 適用 |
|---|---|---|
| 依**篇章節** | `chapters.html` | 跟課、段考複習 |
| 依**國家** | `countries.html` | 比較、統整、申論 |

### 頁面清單（18 頁）

**篇章節**
- `ch0-daolun.html`　導論：什麼是東亞？
- `ch1-guojia.html`　第1章　國家的統治
- `ch2-shehui.html`　第2章　社會組織
- `ch3-yidong-qian.html`　第3章　近代以前的人群移動與交流
- `ch4-yidong-hou.html`　第4章　近代以後的東亞人群移動
- `ch5-jiaohui.html`　第5章　傳統與現代的交會
- `ch6-zhanzheng.html`　第6章　戰爭與和平

**東亞各國**
- `country-china.html`　中國
- `country-japan.html`　日本
- `country-korea.html`　韓國（朝鮮半島）
- `country-vietnam.html`　越南
- `country-other.html`　東亞其他（琉球、蒙古、南洋、東協）

**工具**
- `timeline.html`　綜合大事年表（不分國家，可篩選與搜尋）
- `timeline-country.html`　分國大事年表（五條獨立年表）
- `quiz-all.html`　全冊總測驗（可自選範圍與題數）

## 內容規模

- **年表 164 則**事件（前1046 － 2018）
- **測驗 118 題**：篇章節 66 題、各國 52 題，每題皆附解析
- 全部內容經過史實查核：10 位查核員分段掃描，每項疑點再由 2 位獨立複驗者判定

## 檔案架構

```
.
├─ index.html              首頁
├─ ch*.html                七個篇章節頁面
├─ country-*.html          五個國家頁面
├─ timeline*.html          兩個年表頁面
├─ quiz-all.html           總測驗
├─ chapters.html           篇章節總覽
├─ countries.html          各國總覽
├─ assets/
│  ├─ style.css            全站樣式（含深色模式）
│  └─ site.js              導覽列、測驗引擎、年表引擎
└─ data/
   ├─ timeline.js          年表資料（綜合與分國共用同一份）
   ├─ quiz-chapters.js     篇章節題庫
   └─ quiz-countries.js    各國題庫
```

## 要修改內容時

**改年表** → 只需編輯 `data/timeline.js`。
```js
{y:1894, label:'1894－1895', era:'西力東漸與近代化（1840－1911）',
 c:['cn','jp','kr'], ch:6, t:'甲午戰爭、《馬關條約》', d:'說明文字…'}
```
- `y` 用於排序（數字，西元前為負數；同年要分先後時可用小數）
- `label` 是畫面上顯示的年份文字
- `c` 國家標籤：`cn` 中國／`jp` 日本／`kr` 韓國／`vn` 越南／`ot` 東亞其他
- `ch` 對應章次，章頁年表靠它篩選

綜合年表、分國年表與各章年表**共用這一份資料**，改一次全站同步。

**改題目** → 編輯 `data/quiz-chapters.js` 或 `data/quiz-countries.js`。
```js
{stem:'題幹', source:'引文（可省略）',
 options:['選項一','選項二','選項三','選項四'],
 answer:0,              // 0-based，0 ＝ 第一個選項
 explain:'解析'}
```
網站會依題幹自動重排選項位置，讓正解平均分散在 (A)(B)(C)(D)，避免學生用猜的。同一題每次載入的順序固定，師生畫面一致、可印出對答案。若某題選項順序本身有意義（例如年代排序），加上 `keepOrder:true` 即可不重排。

**改文字** → 直接編輯對應的 `.html`，都是一般 HTML，沒有樣板語言。

## 其他

- 支援深色模式，右上角 ◐ 可手動切換（會記住選擇）
- 手機、平板、電腦皆可閱讀
- 可直接列印：會自動隱藏導覽列與按鈕、展開所有測驗解析，適合印成講義
