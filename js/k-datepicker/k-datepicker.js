import SHARED from './shared/shared';
import { isElementExist, getAllElements, htmlStringToDOM, getTransformX } from './shared/utils.js';
import '../hammer.min.js';
import { OverlayScrollbars } from '../OverlayScrollbars/overlayscrollbars.esm.min.js';
import '../OverlayScrollbars/overlayscrollbars.min.css';

/**
 * 日期格式化
 * @param {object} date 日期物件
 * @returns
 */
function formatDate(date) {
  var year = date.getFullYear();
  var month = String(date.getMonth() + 1).padStart(2, '0');
  var day = String(date.getDate()).padStart(2, '0');
  return year + '-' + month + '-' + day;
}

/**
 * 檢查是否為日期格式
 * @param {string} str 日期字串
 * @returns
 */
function isValidDateFormat(str) {
  const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
  return dateRegex.test(str);
}

/**
 * Debounce（去抖動）
 * @param {function} func 欲防止重複執行的 function
 * @param {number} delay 延遲執行的時間(毫秒)
 * @returns
 */
function debounce(func, delay = 150) {
  let timer = null;
  return function (...args) {
    let context = this;
    clearTimeout(timer);
    timer = setTimeout(() => {
      func.apply(context, args);
    }, delay);
  };
}

class KDatepicker {
  constructor(element, options = {}) {
    this.__storage__ = {
      element,
      options,
    };
    this.#create();
  }
  #create() {
    const { element, options } = this.__storage__;
    if (!isElementExist(element) || getAllElements(element).length <= 0) {
      console.error(`${element} is not found !`);
      return;
    }
    const defaultOptions = {
      SETTINGS: {
        monthPerView: 1,
        inputStart: '.date-start',
        inputEnd: '.date-end',
        lang: 'zh-TW',
        dateRange: [formatDate(new Date()), 1],
      },
      EVENTS: {
        init: null,
        oneWayChange: null,
        monthChange: null,
        confirm: null,
      },
    };
    this.selector = element;
    this.elements = getAllElements(element);
    this.options = Object.assign({}, defaultOptions.SETTINGS, options);
    this.__events__ = Object.assign({}, defaultOptions.EVENTS);
    if (this.options.on) {
      for (const [k, v] of Object.entries(this.options.on)) {
        this.__events__[k] = [v];
      }
    }
    this.#init();
  }
  #init() {
    const kDatepicker = this;
    const { elements, options } = kDatepicker;
    elements.forEach(element => {
      element.setAttribute('month-per-view', window.innerWidth > 720 ? options.monthPerView : 1);
      element.classList.add('k-datepicker-initialize');
      if (typeof options.dateRange === 'object' && options.dateRange.length) {
        const start = isValidDateFormat(options.dateRange[0]) ? options.dateRange[0] : formatDate(new Date());
        const end = () => {
          if (isValidDateFormat(options.dateRange[1])) {
            return options.dateRange[1];
          } else if (typeof options.dateRange[1] === 'number') {
            const end = new Date(start);
            end.setMonth(end.getMonth() + options.dateRange[1] * 12 - 1);
            return formatDate(new Date(end));
          }
        };
        const firstDay = new Date(start);
        firstDay.setDate(1);
        element.setAttribute('view-date', formatDate(firstDay));
        element.setAttribute('date-range', `["${start}","${end()}"]`);
      }
      kDatepicker.#createCalendar(element);
      kDatepicker.emit('init');
    });
  }
  #createSlides(perView) {
    const kDatepicker = this;
    let slideHTML = '';
    const { week } = kDatepickerLanguage[kDatepicker.options.lang];
    const createCounts = perView ? perView + 2 : 1;
    for (let i = 0; i < createCounts; i++) {
      slideHTML += `<div class="c-slide" style="transform: translate3d(0,0,0);">
        <div class="c-table">
          <ul class="c-weeks">
            <li>${week[0]}</li>
            <li>${week[1]}</li>
            <li>${week[2]}</li>
            <li>${week[3]}</li>
            <li>${week[4]} </li>
            <li>${week[5]}</li>
            <li>${week[6]}</li>
          </ul>
          <ul class="c-days">
            <li><div class="day-cell"></div></li>
            <li><div class="day-cell"></div></li>
            <li><div class="day-cell"></div></li>
            <li><div class="day-cell"></div></li>
            <li><div class="day-cell"></div></li>
            <li><div class="day-cell"></div></li>
            <li><div class="day-cell"></div></li>
            <li><div class="day-cell"></div></li>
            <li><div class="day-cell"></div></li>
            <li><div class="day-cell"></div></li>
            <li><div class="day-cell"></div></li>
            <li><div class="day-cell"></div></li>
            <li><div class="day-cell"></div></li>
            <li><div class="day-cell"></div></li>
            <li><div class="day-cell"></div></li>
            <li><div class="day-cell"></div></li>
            <li><div class="day-cell"></div></li>
            <li><div class="day-cell"></div></li>
            <li><div class="day-cell"></div></li>
            <li><div class="day-cell"></div></li>
            <li><div class="day-cell"></div></li>
            <li><div class="day-cell"></div></li>
            <li><div class="day-cell"></div></li>
            <li><div class="day-cell"></div></li>
            <li><div class="day-cell"></div></li>
            <li><div class="day-cell"></div></li>
            <li><div class="day-cell"></div></li>
            <li><div class="day-cell"></div></li>
            <li><div class="day-cell"></div></li>
            <li><div class="day-cell"></div></li>
            <li><div class="day-cell"></div></li>
            <li><div class="day-cell"></div></li>
            <li><div class="day-cell"></div></li>
            <li><div class="day-cell"></div></li>
            <li><div class="day-cell"></div></li>
          </ul>
        </div>
      </div>`;
    }
    return slideHTML;
  }
  #createCalendar(datepickerContainer) {
    const kDatepicker = this;
    const { clear, oneWay, confirm, month } = kDatepickerLanguage[kDatepicker.options.lang];
    const monthsListHandler = () => {
      let monthsListDOM = '';
      const minDate = new Date(JSON.parse(datepickerContainer.getAttribute('date-range'))[0]);
      const maxDate = new Date(JSON.parse(datepickerContainer.getAttribute('date-range'))[1]);
      function createList(minDate, maxDate) {
        let current = new Date(minDate);
        while (current <= maxDate) {
          const listYear = current.getFullYear();
          const listMonth = current.getMonth() + 1;
          monthsListDOM += `<li date="${listYear}-${String(listMonth).padStart(2, '0')}-01">${month[listMonth - 1]} ${listYear}</li>`;
          current.setMonth(current.getMonth() + 1);
        }
      }
      createList(minDate, maxDate);
      return monthsListDOM;
    };
    const monthPerView = window.innerWidth > 720 ? kDatepicker.options.monthPerView : parseInt(datepickerContainer.getAttribute('month-per-view'));
    const calendarDomString = `<div class="calendar-popup">
      <div class="flex-box">
        <div class="c-container">
          <div class="c-header">
            <ul class="c-options">
              <li class="option-item reset-btn">
                <div class="icon"></div>
                <div class="text">${clear}</div>
              </li>
              <li class="option-item one-way">
                <input type="checkbox" name="" id="one-way">
                <div class="fake-checkbox"></div>
                <label for="one-way">${oneWay}</label>
              </li>
            </ul>
          </div>
          <div class="c-title">
            <div class="item">
              <div class="dropdown-btn">
                <div class="select-wrapper">
                  <div class="select-display current-month"></div>
                  <i class="dropdown-icon"></i>
                  <div class="dropdown">
                    <div class="dropdown-scroller">
                      <ul class="dropdown-list">
                        ${monthsListHandler()}
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div class="item">
              <span class="next-month"></span>
            </div>
          </div>
          <div class="c-body">
            <div class="c-scroll-wrapper">
              <div class="c-scroll-view">
                ${kDatepicker.#createSlides(monthPerView)}
              </div>
            </div>
            <div class="c-navigation">
              <div class="prev-btn hidden"></div>
              <div class="next-btn"></div>
            </div>
          </div>
          <div class="c-footer">
            <div class="confirm-btn disabled">${confirm}</div>
          </div>
        </div>
      </div>
    </div>`;
    const calendarDOM = htmlStringToDOM(calendarDomString);
    datepickerContainer.append(calendarDOM);
    kDatepicker.#initialCalendar(datepickerContainer, datepickerContainer.getAttribute('view-date'));
    kDatepicker.#calendarEventsHandler(datepickerContainer);
  }
  #getBeforeAfterDates(baseDate) {
    // 前一個月
    let previousMonth = new Date(baseDate);
    previousMonth.setMonth(previousMonth.getMonth() - 1);

    // 後一個月
    let nextMonth = new Date(baseDate);
    nextMonth.setMonth(nextMonth.getMonth() + 1);

    // 後兩個月
    let nextTwoMonth = new Date(baseDate);
    nextTwoMonth.setMonth(nextTwoMonth.getMonth() + 2);

    return [previousMonth, baseDate, nextMonth, nextTwoMonth];
  }
  #initialCalendar(datepickerContainer, baseDate = new Date()) {
    const kDatepicker = this;
    const allSlide = datepickerContainer.querySelectorAll('.c-slide');
    const previousBtn = datepickerContainer.querySelector('.c-navigation .prev-btn');
    const nextBtn = datepickerContainer.querySelector('.c-navigation .next-btn');
    const getFirstDay = date => {
      const y = new Date(date).getFullYear();
      const m = new Date(date).getMonth();
      return new Date(y, m, 1).getDay();
    };
    const getDays = date => {
      const y = new Date(date).getFullYear();
      const m = new Date(date).getMonth() + 1;
      return new Date(y, m, 0).getDate();
    };
    const { month } = kDatepickerLanguage[kDatepicker.options.lang];
    const calendarArr = kDatepicker.#getBeforeAfterDates(baseDate);
    const currentMonthTitle = datepickerContainer.querySelector('.c-title .current-month');
    const nextMonthTitle = datepickerContainer.querySelector('.c-title .next-month');
    const currentMonth = new Date(baseDate).getMonth();
    const nextMonth = new Date(new Date(baseDate).setMonth(currentMonth + 1)).getMonth();
    const nextYear = new Date(new Date(baseDate).setMonth(currentMonth + 1)).getFullYear();
    const minDate = new Date(JSON.parse(datepickerContainer.getAttribute('date-range'))[0]);
    const maxDate = new Date(JSON.parse(datepickerContainer.getAttribute('date-range'))[1]);
    currentMonthTitle.textContent = `${month[currentMonth]} ${new Date(baseDate).getFullYear()}`;
    nextMonthTitle.textContent = `${month[nextMonth]} ${nextYear}`;
    for (let i = 0; i < allSlide.length; i++) {
      let dayCount = 1;
      const dayCells = allSlide[i].querySelectorAll('.day-cell');
      for (let d = 0; d < 35; d++) {
        dayCells[d].removeAttribute('date');
        if (d >= getFirstDay(calendarArr[i])) {
          if (dayCount > getDays(calendarArr[i])) {
            dayCells[d].classList.add('empty');
          } else {
            const y = new Date(calendarArr[i]).getFullYear();
            const m = String(new Date(calendarArr[i]).getMonth() + 1).padStart(2, '0');
            const day = String(dayCount).padStart(2, '0');
            const date = `${y}-${m}-${day}`;
            dayCells[d].setAttribute('date', date);
            dayCells[d].textContent = dayCount;
            const isSameDay = new Date(date).getFullYear() === minDate.getFullYear() && new Date(date).getMonth() === minDate.getMonth() && new Date(date).getDate() === minDate.getDate();
            if ((new Date(date) < minDate && !isSameDay) || new Date(date) > maxDate) {
              dayCells[d].classList.add('disabled');
            }
            dayCount++;
          }
        } else {
          dayCells[d].classList.add('empty');
        }
      }
    }
    if (new Date(baseDate) > minDate) {
      previousBtn.classList.remove('hidden');
    } else {
      previousBtn.classList.add('hidden');
    }
    if (new Date(baseDate) <= maxDate) {
      if (new Date(baseDate).getFullYear() === new Date(maxDate).getFullYear() && currentMonth === new Date(maxDate).getMonth()) {
        nextBtn.classList.add('hidden');
      } else {
        nextBtn.classList.remove('hidden');
      }
    }
  }
  #setPopupPosition(datepickerContainer) {
    const calendarPopup = datepickerContainer.querySelector('.calendar-popup');
    const calendarContainer = calendarPopup.querySelector('.c-container');
    const calendarContainerWidth = calendarContainer.offsetWidth;
    const leftSpace = datepickerContainer.getBoundingClientRect().left + datepickerContainer.offsetWidth;
    const rightSpace = datepickerContainer.getBoundingClientRect().right;
    const align = () => {
      if (window.innerWidth <= 720) {
        return 'full';
      } else {
        if (leftSpace >= calendarContainerWidth) {
          return 'align-right';
        } else if (rightSpace >= calendarContainerWidth && leftSpace < calendarContainerWidth) {
          return 'align-left';
        } else {
          return 'full';
        }
      }
    };
    calendarPopup.classList.remove('align-left', 'align-right', 'full');
    calendarPopup.classList.add(align());
  }
  #calendarEventsHandler(datepickerContainer) {
    let openTimeout;
    const kDatepicker = this;
    const inputStart = datepickerContainer.querySelector(kDatepicker.options.inputStart);
    const inputEnd = datepickerContainer.querySelector(kDatepicker.options.inputEnd);
    const resetBtn = datepickerContainer.querySelector('.reset-btn');
    const oneWayCheckbox = datepickerContainer.querySelector('.one-way input');
    const dropdownBtn = datepickerContainer.querySelector('.dropdown-btn');
    const dropdownScroller = dropdownBtn.querySelector('.dropdown-scroller');
    const previousBtn = datepickerContainer.querySelector('.c-navigation .prev-btn');
    const nextBtn = datepickerContainer.querySelector('.c-navigation .next-btn');
    const confirmBtn = datepickerContainer.querySelector('.confirm-btn');
    const scrollWrapper = datepickerContainer.querySelector('.c-scroll-wrapper');
    let clickable = true;
    let dateSelectCounts = 0;
    let selectRange = [];
    function inputClickHandler(e) {
      e.stopPropagation();
      const calendarPopup = datepickerContainer.querySelector('.calendar-popup');
      calendarPopup.style.display = 'block';
      kDatepicker.#setPopupPosition(datepickerContainer);
      if (dateSelectCounts === 0) {
        inputStart.classList.add('selecting');
      } else if (dateSelectCounts === 1) {
        inputEnd.classList.add('selecting');
      }
      if (openTimeout) clearTimeout(openTimeout);
      openTimeout = setTimeout(() => {
        calendarPopup.classList.add('show');
      }, 100);
    }

    /**
     * 重置選擇
     */
    function resetHandler() {
      const dayCells = datepickerContainer.querySelectorAll('.day-cell:not(.empty)');
      inputStart.querySelector('input').value = '';
      inputStart.querySelector('input').classList.remove('is-selected');
      inputEnd.querySelector('input').value = '';
      inputEnd.querySelector('input').classList.remove('is-selected');
      confirmBtn.classList.add('disabled');
      selectRange = [];
      dayCells.forEach(cell => {
        cell.classList.remove('is-selected', 'in-range');
      });
    }

    /**
     * 切換單程/來回
     */
    function oneWayChangeHandler() {
      const checked = this.checked;
      const dayCells = datepickerContainer.querySelectorAll('.day-cell:not(.empty)');
      if (checked) {
        const endCell = datepickerContainer.querySelector(`.day-cell:not(.empty)[date="${inputEnd.querySelector('input').value}"]`);
        dayCells.forEach(cell => cell.classList.remove('in-range'));
        endCell?.classList.remove('is-selected');
        inputEnd.querySelector('input').value = '';
        inputEnd.querySelector('input').classList.remove('is-selected');
        if (selectRange.length === 2) {
          selectRange.splice(-1, 1);
        }
        if (inputStart.querySelector('input').value !== '') {
          confirmBtn.classList.remove('disabled');
        }
        dateSelectCounts = 0;
        inputStart.classList.add('selecting');
        inputEnd.classList.remove('selecting');
      } else {
        if (inputStart.querySelector('input').value !== '') {
          dateSelectCounts = 1;
          inputStart.classList.remove('selecting');
          inputEnd.classList.add('selecting');
        }
        if (inputEnd.querySelector('input').value === '') {
          confirmBtn.classList.add('disabled');
        }
      }
      kDatepicker.emit('oneWayChange', checked);
    }

    function updateSelectDate() {
      // 區間內全部亮起
      const dayCells = datepickerContainer.querySelectorAll('.day-cell');
      if (selectRange.length === 1) {
        dayCells.forEach(cell => {
          const date = new Date(cell.getAttribute('date'));
          cell.classList.remove('is-selected', 'in-range');
          if (formatDate(date) === formatDate(selectRange[0])) {
            cell.classList.add('is-selected');
          }
        });
      } else if (selectRange.length === 2) {
        dayCells.forEach(cell => {
          const date = new Date(cell.getAttribute('date'));
          cell.classList.remove('is-selected', 'in-range');
          if (formatDate(date) === formatDate(selectRange[0]) || formatDate(date) === formatDate(selectRange[1])) {
            cell.classList.add('is-selected');
          }
          if (date > selectRange[0] && date < selectRange[1]) {
            cell.classList.add('in-range');
          }
        });
      }
    }

    function dropdownHandler(e) {
      let isTarget = false;
      const dropdownEl = this.querySelector('.dropdown');
      const dropdownHeight = this.querySelector('.dropdown-scroller').clientHeight;
      const monthLis = this.querySelectorAll('li');
      if (this.classList.contains('open')) {
        // 關閉
        this.classList.remove('open');
        dropdownEl.setAttribute('style', '');
      } else {
        // 打開
        this.classList.add('open');
        dropdownEl.style.cssText = `
          height: ${dropdownHeight}px;
          z-index: 2;
        `;
      }
      for (const targetElement of monthLis) {
        if (targetElement.contains(e.target) || e.target.closest('li') === targetElement) {
          isTarget = true;
          break;
        }
      }
      if (isTarget) {
        const monthLi = e.target.closest('li');
        const date = monthLi.getAttribute('date');
        kDatepicker.#update(datepickerContainer, date);
        updateSelectDate();
        datepickerContainer.setAttribute('view-date', date);
      }
    }

    /**
     * 月份切換
     * @param {string} direction 方向 prev/next
     * @returns
     */
    function monthChange(direction) {
      if (!clickable) return;
      const monthPerView = parseInt(datepickerContainer.getAttribute('month-per-view'));
      const scrollView = datepickerContainer.querySelector('.c-scroll-view');
      const allSlide = datepickerContainer.querySelectorAll('.c-slide');
      let changeTimeout;
      clickable = false;
      if (changeTimeout) clearTimeout(changeTimeout);
      switch (direction) {
        case 'prev':
          scrollView.style.cssText = `
            transform: translate3d(calc(${getTransformX(scrollView)}px + ${100 / monthPerView}%),0,0);
            transition: transform 200ms ease-out 0s;
          `;
          allSlide.forEach(slide => {
            slide.style.cssText = `transform: translateX(calc(${getTransformX(slide)}px - 100%));`;
          });
          // 目前顯示的前一個月
          let previousMonth = new Date(datepickerContainer.getAttribute('view-date'));
          previousMonth.setMonth(previousMonth.getMonth() - 1);
          kDatepicker.#update(datepickerContainer, previousMonth);
          datepickerContainer.setAttribute('view-date', formatDate(previousMonth));
          break;
        case 'next':
          scrollView.style.cssText = `
            transform: translate3d(calc(${getTransformX(scrollView)}px - ${100 / monthPerView}%),0,0);
            transition: transform 200ms ease-out 0s;
          `;
          allSlide.forEach(slide => {
            slide.style.cssText = `transform: translateX(calc(${getTransformX(slide)}px + 100%));`;
          });
          // 目前顯示的下一個月
          let nextMonth = new Date(datepickerContainer.getAttribute('view-date'));
          nextMonth.setMonth(nextMonth.getMonth() + 1);
          kDatepicker.#update(datepickerContainer, nextMonth);
          datepickerContainer.setAttribute('view-date', formatDate(nextMonth));
          break;
      }
      updateSelectDate();
      changeTimeout = setTimeout(() => {
        clickable = true;
        kDatepicker.emit('monthChange');
      }, 200);
    }

    /**
     * 切換至上一個月份
     * @param {object} e 事件本身
     */
    function prevHandler(e) {
      e?.stopPropagation();
      monthChange('prev');
    }

    /**
     * 切換至下一個月份
     * @param {object} e 事件本身
     */
    function nextHandler(e) {
      e?.stopPropagation();
      monthChange('next');
    }

    /**
     * 日期選擇
     * @param {object} e 事件本身
     * @returns
     */
    function dateSelect(e) {
      let isTarget = false;
      const container = datepickerContainer.querySelector('.c-container');
      const dayCells = datepickerContainer.querySelectorAll('.day-cell:not(.empty):not(.disabled)');
      if (container.contains(e.target)) {
        e.stopPropagation();
      }
      for (const targetElement of dayCells) {
        if (targetElement.contains(e.target) || e.target.closest('.day-cell') === targetElement) {
          isTarget = true;
          break;
        }
      }
      if (isTarget) {
        const dayCell = e.target.closest('.day-cell');
        switch (dateSelectCounts) {
          case 0:
            dayCells.forEach(cell => {
              cell.classList.remove('is-selected', 'in-range');
            });
            dayCell.classList.add('is-selected');
            inputStart.querySelector('input').classList.add('is-selected');
            inputStart.querySelector('input').value = dayCell.getAttribute('date');
            inputEnd.querySelector('input').classList.remove('is-selected');
            inputEnd.querySelector('input').value = '';
            confirmBtn.classList.add('disabled');
            selectRange = [];
            selectRange.push(new Date(dayCell.getAttribute('date')));
            if (!oneWayCheckbox.checked) {
              dateSelectCounts++;
              inputStart.classList.remove('selecting');
              inputEnd.classList.add('selecting');
            } else {
              confirmBtn.classList.remove('disabled');
            }
            break;
          case 1:
            // 如果第二個日期比第一個時間還早則 return
            if (new Date(dayCell.getAttribute('date')) <= selectRange[0]) return;
            dayCell.classList.add('is-selected');
            inputEnd.querySelector('input').classList.add('is-selected');
            inputEnd.querySelector('input').value = dayCell.getAttribute('date');
            confirmBtn.classList.remove('disabled');
            selectRange.push(new Date(dayCell.getAttribute('date')));
            // 區間內全部亮起
            dayCells.forEach(cell => {
              const date = new Date(cell.getAttribute('date'));
              if (date > selectRange[0] && date < selectRange[1]) {
                cell.classList.add('in-range');
              }
            });
            dateSelectCounts = 0;
            inputStart.classList.add('selecting');
            inputEnd.classList.remove('selecting');
            break;
        }
      }
    }

    /**
     * 完成選擇
     */
    function confirmHandler() {
      if (!this.classList.contains('disabled')) {
        closePopup();
        const result = [];
        if (selectRange[0]) {
          result[0] = formatDate(selectRange[0]);
        }
        if (selectRange[1]) {
          result[1] = formatDate(selectRange[1]);
        }
        kDatepicker.emit('confirm', result);
      }
    }

    /**
     * 關閉月曆
     */
    function closePopup() {
      const calendarPopup = document.querySelector('.calendar-popup');
      calendarPopup.style.display = 'none';
      calendarPopup.classList.remove('show');
      inputStart.classList.remove('selecting');
      inputEnd.classList.remove('selecting');
    }

    /**
     * 點擊空白處
     */
    function clickBlank() {
      closePopup();
    }

    /**
     * RESIZE
     */
    function resizeHandler() {
      const viewWidth = window.innerWidth;
      const monthPerView = kDatepicker.options.monthPerView;
      const calendarPopup = document.querySelector('.calendar-popup');
      if (viewWidth > 720) {
        if (monthPerView === 2) {
          kDatepicker.#changeMonthPerView(datepickerContainer, 2);
        }
      } else {
        if (monthPerView === 2) {
          kDatepicker.#changeMonthPerView(datepickerContainer, 1);
        }
      }
      kDatepicker.#setPopupPosition(datepickerContainer);
    }
    OverlayScrollbars(dropdownScroller, {
      overflow: {
        x: 'hidden',
      },
    });

    const mc = new Hammer(scrollWrapper);
    mc.on('swipeleft swiperight', function (ev) {
      switch (ev.type) {
        case 'swipeleft':
          if (nextBtn.classList.contains('hidden')) return;
          nextHandler();
          break;
        case 'swiperight':
          if (previousBtn.classList.contains('hidden')) return;
          prevHandler();
          break;
      }
    });
    inputStart.addEventListener('click', inputClickHandler, false);
    inputEnd.addEventListener('click', inputClickHandler, false);
    resetBtn.addEventListener('click', resetHandler, false);
    oneWayCheckbox.addEventListener('change', oneWayChangeHandler, false);
    dropdownBtn.addEventListener('click', dropdownHandler, false);
    previousBtn.addEventListener('click', prevHandler, false);
    nextBtn.addEventListener('click', nextHandler, false);
    confirmBtn.addEventListener('click', confirmHandler, false);
    datepickerContainer.addEventListener('click', dateSelect, false);
    document.addEventListener('click', clickBlank, false);
    window.addEventListener('resize', debounce(resizeHandler));
  }
  #update(datepickerContainer, baseDate = new Date()) {
    const kDatepicker = this;
    const dayCells = datepickerContainer.querySelectorAll('.day-cell');
    dayCells.forEach(dayCell => {
      dayCell.textContent = '';
      dayCell.classList.remove('empty', 'disabled');
    });
    kDatepicker.#initialCalendar(datepickerContainer, baseDate);
  }
  #changeMonthPerView(datepickerContainer, perView) {
    const kDatepicker = this;
    const monthPerView = parseInt(datepickerContainer.getAttribute('month-per-view'));
    const baseDate = new Date(datepickerContainer.getAttribute('view-date'));
    const cScrollView = datepickerContainer.querySelector('.c-scroll-view');
    if (monthPerView === perView) return;
    cScrollView.removeAttribute('style');
    cScrollView.querySelectorAll('.c-slide').forEach(slide => {
      slide.style.transform = 'translate3d(0,0,0)';
    });
    if (monthPerView !== perView && perView === 1) {
      const lastSlide = cScrollView.lastElementChild;
      datepickerContainer.setAttribute('month-per-view', '1');
      cScrollView.removeChild(lastSlide);
      kDatepicker.#update(datepickerContainer, baseDate);
    } else if (monthPerView !== perView && perView === 2) {
      datepickerContainer.setAttribute('month-per-view', '2');
      cScrollView.append(htmlStringToDOM(kDatepicker.#createSlides()));
      kDatepicker.#update(datepickerContainer, baseDate);
    }
  }
}

Object.assign(KDatepicker.prototype, SHARED);
window.KDatepicker = KDatepicker;
export default KDatepicker;
