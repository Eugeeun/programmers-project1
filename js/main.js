'use strict';

import { BASE_URL } from './config.js';

const PAGE_SIZE = 15;
let page = 1; // currentPage
let totalResults = null;
let groupSize = 3;

const searchParams = {
  pageBegin: 0,
  pageEnd: 0,
  minclass: '', // category
  svcname: '',
  target: '', // not use
  area: '',
};

// 슬라이더 생성
let swiper = new Swiper('.header__category-list', {
  slidesPerView: 'auto',
  spaceBetween: 20,
  freeMode: true,
  grabCursor: true,
  freeModeSticky: false,
  freeModeMomentum: false,
});

const getStatus = status => {
  switch (status) {
    case '접수중':
      return ['open', status];
    case '예약마감':
      return ['full', status];
    case '접수종료':
      return ['closed', status];
    case '예약일시중지':
      return ['pause', '일시중지'];
    case '안내중':
      return ['guidance', status];
  }
};

const createHtml = item => {
  const { SVCID, IMGURL, SVCSTATNM, SVCNM, PLACENM, USETGTINFO, SVCOPNBGNDT, SVCOPNENDDT } = item;
  const [statusClass, status] = getStatus(SVCSTATNM);

  return `
    <li class="services__item" id="${SVCID}">
      <div class="services__img">
        <img src="${IMGURL}" alt="img" />
        <span class="services__status ${statusClass}">${status}</span>
      </div>
      <div class="services__info-wrap">
        <span class="services__title">${SVCNM}</span>
        <div class="services__detail-info-wrap">
          <div class="services__target-wrap">
            <img src="./img/user.png" alt="" />
            <span class="services__target">${USETGTINFO}</span>
          </div>
          <div class="services__place">
            <img src="./img/calendar.png" alt="" />
            <span class="services__place">${PLACENM}</span>
          </div>
          <div class="services__period-wrap">
            <img src="./img/pin.png" alt="" />
            <span class="services__period">${SVCOPNBGNDT} ~ ${SVCOPNENDDT}</span>
          </div>
        </div>
      </div>
    </li>
  `;
};

const createPageBtn = () => {
  const totalPage = Math.ceil(totalResults / PAGE_SIZE); // 총 페이지 수
  const pageGroup = Math.ceil(page / groupSize); // 현재 페이지가 속해있는 그룹
  const firstPage = (pageGroup - 1) * groupSize + 1;
  const lastPage = Math.min(totalPage, pageGroup * groupSize);

  return Array.from({ length: lastPage - firstPage + 1 }, (_, index) => {
    const pageNumber = firstPage + index;
    const isActive = pageNumber === page ? 'selected' : '';
    return `<button class="services__page ${isActive}">${pageNumber}</button>`;
  }).join('');
};

const getPagination = () => {
  return `
    <li class="services__pagination-wrap">
      <button class="services__prev"><img src="./img/left-arrow.png" alt="" /></button>
      ${createPageBtn()}
      <button class="services__prev"><img src="./img/right-arrow.png" alt="" /></button>
    </li>
  `;
};

// 받아온 리스트로 HTML 그리기
const paintHtmlToServiceList = itemList => {
  const $target = document.querySelector('.services__list');

  // TODO: Save detail data and location to localStorage
  const serviceList = itemList.map(createHtml).join('');

  // Add pagination at last of element
  $target.innerHTML = serviceList + getPagination();
};

// 서비스 리스트 받아오기
const getServiceList = async url => {
  const KEY = 'ListPublicReservationEducation';
  console.log(url);

  try {
    const response = await fetch(url);
    const data = await response.json();

    totalResults = data[KEY].list_total_count;
    return data[KEY].row;
  } catch (e) {
    console.log(e);
  }
};

getServiceList(BASE_URL + '1/15') //
  .then(paintHtmlToServiceList);
