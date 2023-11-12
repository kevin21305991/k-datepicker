import SHARED from './shared/shared';
import { isElementExist, getAllElements, htmlStringToDOM, getTransformX } from './shared/utils.js';

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
      },
      EVENTS: {
        init: null,
        oneWayChange: null,
        slideChange: null,
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
      element.setAttribute('month-per-view', options.monthPerView);
      element.setAttribute('view-date', formatDate(new Date()));
      element.classList.add('k-datepicker-initialize');
      kDatepicker.#createCalendar(element);
      kDatepicker.emit('init');
    });
  }
  #createCalendar(datepickerContainer) {
    const kDatepicker = this;
    const { clear, oneWay, confirm, week } = kDatepickerLanguage[kDatepicker.options.lang];
    const monthPerView = parseInt(datepickerContainer.getAttribute('month-per-view'));
    function createSlides(perView) {
      let slideHTML = '';
      for (let i = 0; i < perView + 2; i++) {
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
    const calendarDomString = `<div class="calendar-popup">
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
          <div class="item current-month"></div>
          <div class="item next-month"></div>
        </div>
        <div class="c-body">
          <div class="c-scroll-wrapper">
            <div class="c-scroll-view">
              ${createSlides(monthPerView)}
            </div>
          </div>
          <div class="c-navigation">
            <div class="prev-btn"></div>
            <div class="next-btn"></div>
          </div>
        </div>
        <div class="c-footer">
          <div class="confirm-btn disabled">${confirm}</div>
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
            if (new Date(date) < new Date()) {
              dayCells[d].classList.add('disabled');
            }
            dayCount++;
          }
        } else {
          dayCells[d].classList.add('empty');
        }
      }
    }
  }
  #calendarEventsHandler(datepickerContainer) {
    const kDatepicker = this;
    const inputStart = datepickerContainer.querySelector(kDatepicker.options.inputStart);
    const inputEnd = datepickerContainer.querySelector(kDatepicker.options.inputEnd);
    const resetBtn = datepickerContainer.querySelector('.reset-btn');
    const oneWayCheckbox = datepickerContainer.querySelector('.one-way input');
    const previousBtn = datepickerContainer.querySelector('.c-navigation .prev-btn');
    const nextBtn = datepickerContainer.querySelector('.c-navigation .next-btn');
    const confirmBtn = datepickerContainer.querySelector('.confirm-btn');
    let clickable = true;
    let dateSelectCounts = 0;
    let selectRange = [];
    function inputClickHandler(e) {
      e.stopPropagation();
      const calendarPopup = this.closest(kDatepicker.selector).querySelector('.calendar-popup');
      calendarPopup.style.display = 'block';
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
        cell.classList.remove('is-selected');
        cell.classList.remove('in-range');
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
        selectRange.splice(-1, 1);
        if (inputStart.querySelector('input').value !== '') {
          confirmBtn.classList.remove('disabled');
        }
        dateSelectCounts = 0;
      } else {
        if (inputStart.querySelector('input').value !== '') {
          dateSelectCounts = 1;
        }
        if (inputEnd.querySelector('input').value === '') {
          confirmBtn.classList.add('disabled');
        }
      }
      kDatepicker.emit('oneWayChange', checked);
    }

    /**
     * 月份切換
     * @param {string} direction 方向 prev/next
     * @returns
     */
    function slideChange(direction) {
      if (!clickable) return;
      const scrollView = datepickerContainer.querySelector('.c-scroll-view');
      const allSlide = datepickerContainer.querySelectorAll('.c-slide');
      let changeTimeout;
      clickable = false;
      if (changeTimeout) clearTimeout(changeTimeout);
      switch (direction) {
        case 'prev':
          scrollView.style.cssText = `
            transform: translate3d(calc(${getTransformX(scrollView)}px + ${100 / kDatepicker.options.monthPerView}%),0,0);
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
            transform: translate3d(calc(${getTransformX(scrollView)}px - ${100 / kDatepicker.options.monthPerView}%),0,0);
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
      // 區間內全部亮起
      const dayCells = datepickerContainer.querySelectorAll('.day-cell');
      if (selectRange.length === 1) {
        dayCells.forEach(cell => {
          const date = new Date(cell.getAttribute('date'));
          cell.classList.remove('is-selected');
          cell.classList.remove('in-range');
          if (formatDate(date) === formatDate(selectRange[0])) {
            cell.classList.add('is-selected');
          }
        });
      } else if (selectRange.length === 2) {
        dayCells.forEach(cell => {
          const date = new Date(cell.getAttribute('date'));
          cell.classList.remove('is-selected');
          cell.classList.remove('in-range');
          if (formatDate(date) === formatDate(selectRange[0]) || formatDate(date) === formatDate(selectRange[1])) {
            cell.classList.add('is-selected');
          }
          if (date > selectRange[0] && date < selectRange[1]) {
            cell.classList.add('in-range');
          }
        });
      }
      changeTimeout = setTimeout(() => {
        clickable = true;
        kDatepicker.emit('slideChange');
      }, 200);
    }

    /**
     * 切換至上一個月份
     * @param {object} e 事件本身
     */
    function prevHandler(e) {
      e.stopPropagation();
      slideChange('prev');
    }

    /**
     * 切換至下一個月份
     * @param {object} e 事件本身
     */
    function nextHandler(e) {
      e.stopPropagation();
      slideChange('next');
    }

    /**
     * 日期選擇
     * @param {object} e 事件本身
     * @returns
     */
    function dateSelect(e) {
      e.stopPropagation();
      let isTarget = false;
      const dayCells = datepickerContainer.querySelectorAll('.day-cell:not(.empty):not(.disabled)');
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
              cell.classList.remove('is-selected');
              cell.classList.remove('in-range');
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
    }

    /**
     * 點擊空白處
     */
    function clickBlank() {
      closePopup();
    }

    inputStart.addEventListener('click', inputClickHandler);
    inputEnd.addEventListener('click', inputClickHandler);
    resetBtn.addEventListener('click', resetHandler, false);
    oneWayCheckbox.addEventListener('change', oneWayChangeHandler, false);
    previousBtn.addEventListener('click', prevHandler, false);
    nextBtn.addEventListener('click', nextHandler, false);
    confirmBtn.addEventListener('click', confirmHandler, false);
    datepickerContainer.addEventListener('click', dateSelect, false);
    document.addEventListener('click', clickBlank, false);
  }
  #update(datepickerContainer, baseDate = new Date()) {
    const kDatepicker = this;
    const dayCells = datepickerContainer.querySelectorAll('.day-cell');
    dayCells.forEach(dayCell => {
      dayCell.textContent = '';
      dayCell.classList.remove('empty');
      dayCell.classList.remove('disabled');
    });
    kDatepicker.#initialCalendar(datepickerContainer, baseDate);
  }
}

Object.assign(KDatepicker.prototype, SHARED);
window.KDatepicker = KDatepicker;
export default KDatepicker;
