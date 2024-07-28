# KDatepicker - Document

![K-datepicker](https://imgur.com/Dickerl.gif)

**[DEMO](https://k-datepicker.vercel.app/)**

## Getting Started

### 1. Embed css & javascript file

```html=
<!-- CSS -->
<link rel="stylesheet" href="path/k-datepicker.css" />

<!-- JS -->
<script src="path/language.js"></script>
<script src="path/k-datepicker.min.js"></script>
```

### 2. Add Swiper HTML Layout

#### my-datepicker(line 1), date-start(line 3), date-end(line 7) 這三個 className 可以自定義

```html=
<div class="k-datepicker-container my-datepicker">
  <div class="daterange-selector">
    <div class="datepicker-input date-start">
      <input type="text" id="date-start" readonly>
      <label for="date-start">Depart Date</label>
    </div>
    <div class="datepicker-input date-end">
      <input type="text" id="date-end" readonly>
      <label for="date-end">Return Date</label>
    </div>
  </div>
</div>
```

### 3. Initialize KDatepicker

```js=
var datepicker = new KDatepicker('.my-datepicker', {
    on: {
      init(){
        // 啟動時觸發
        console.log('KDatepicker is initialize');
      },
      oneWayChange(checked){
        // 單/雙程 切換時觸發
        var inputEnd = document.querySelector('.my-datepicker .date-end')
        if(checked){
          inputEnd.classList.add('disabled')
        }
        else{
          inputEnd.classList.remove('disabled')
        }
      },
      monthChange() {
        // 切換月份時觸發
        console.log('month change');
      },
      confirm(result){
        // 日期選擇確認後觸發
        if(result.length === 2){
          console.log(`select ${result[0]} to ${result[1]}`);
        }
        else{
          console.log(`select ${result[0]}`)
        }
      }
    },
    lang: 'en',
    monthPerView: 2,
});
```

## Parameters

| Name         |  Type  | Default<div style="width:120px"> | Description                                                                                                                                                                                               |
| ------------ | :----: | :------------------------------: | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| monthPerView | number |                1                 | 欲顯示月份數量 目前僅有 1,2 兩種                                                                                                                                                                          |
| inputStart   | string |          '.date-start'           | selector String 起始日期按鈕的 className                                                                                                                                                                  |
| inputEnd     | string |           '.date-end'            | selector String 結束日期按鈕的 className                                                                                                                                                                  |
| dateRange    | object |         ['2023-11-19',1]         | 日期可選擇的範圍 - 第一個值為日期的字串，第二個值可以是日期字串也可以是數字(單位: 年)，如果第二個值用數字則表示範圍日期最大值為第一個值往後加 n 年<br>ex: ['2023-11-19','2024-12-31'] or ['2023-12-31',2] |
| lang         | string |             'zh-TW'              | 月曆語系，目前有三種 繁中(zh-TW, 簡中(zh-CN, 英文(en)。如有需要可自行去 language.js 中擴充                                                                                                                |

## Events

#### 詳細用法請參考上面 Initialize

| Name         |  Arguments  | Description                                   |
| ------------ | :---------: | --------------------------------------------- |
| init         | kdatepicker | 啟動時會觸發                                  |
| oneWayChange |   checked   | 單/雙程 切換時觸發，checked 會回傳是否勾選    |
| slideChange  | kdatepicker | 月份切換時觸發                                |
| confirm      |   result    | 日期選擇確認後觸發，result 會回傳所選擇的日期 |
