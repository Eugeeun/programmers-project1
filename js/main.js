'use strict';

import { BASE_URL, PAGE_SIZE, GROUP_SIZE, dir } from './config.js';
import { swiper } from './swiper.js';
import { loadKakaoMaps, setMarkerAndCenter, removeMarker } from './map.js';
import { saveServices, setServices, getServices } from './localStorage.js';

// DOM 요소 선택
const $categoryCon = document.querySelector('.swiper-wrapper');
const $select = document.querySelector('#intro__select');
const $input = document.querySelector('#intro__search');
const $submitBtn = document.querySelector('.intro__submit-btn > img');
const $$categoryList = document.querySelector('.header__category-list');
const $closeBtn = document.querySelector('.header__close-menu-btn');
const $logo = document.querySelector('.header__logo');
const $menuOpenBtn = document.querySelector('.header__menu-btn');

// 변수
let page = 1; // currentPage
let totalResults = null;

// 검색 파라미터
const searchParams = {
  pageBegin: (page - 1) * PAGE_SIZE + 1,
  pageEnd: page * PAGE_SIZE,
  minclass: '', // 카테고리
  svcname: '',
  target: '', // 사용하지 않음
  area: '',
};

// 페이지 업데이트
const updateParams = () => {
  searchParams.pageBegin = (page - 1) * PAGE_SIZE + 1;
  searchParams.pageEnd = page * PAGE_SIZE;
};

// 카테고리 버튼을 누르면 일부 파라미터 초기화
const resetParams = () => {
  searchParams.area = '';
  searchParams.svcname = '';
  page = 1;
};

// 검색시 파라미터를 업데이트하고 로드
const updateParamsAndLoad = () => {
  searchParams[$select.value] = $input.value;
  updateParams();
  loadServiceList(BASE_URL);
};

// 선택된 카테고리로 로드
const selectCategory = category => {
  searchParams.minclass = category === '전체' ? '' : category.split('/')[0];
  resetParams();
  updateParams();
  loadServiceList(BASE_URL);
  $input.value = '';
};

// 모바일버전에서 카테고리 박스 변화
const toggleCategoryVisibility = show => {
  $$categoryList.classList.toggle('active', show);
  $closeBtn.style.display = show ? 'block' : 'none';
};

// 리스트의 상태
const getStatus = status => {
  const statusMap = {
    접수중: ['open', '접수중'],
    예약마감: ['full', '예약마감'],
    접수종료: ['closed', '접수종료'],
    예약일시중지: ['pause', '일시중지'],
    안내중: ['guidance', '안내중'],
  };
  return statusMap[status] || ['unknown', '알 수 없음'];
};

// 리스트 템플릿
const createHtml = item => {
  const { SVCID, IMGURL, SVCSTATNM, SVCNM, PLACENM, USETGTINFO, SVCOPNBGNDT, SVCOPNENDDT } = item;
  const [statusClass, status] = getStatus(SVCSTATNM);

  return `
    <li class="services__item shadow" id="${SVCID}">
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
            <span class="services__period">
              ${SVCOPNBGNDT.slice(0, 11)} ~ ${SVCOPNENDDT.slice(0, 11)}
            </span>
          </div>
        </div>
      </div>
    </li>
  `;
};

const renderServiceList = itemList => {
  const $target = document.querySelector('.services__list');

  // 리스트가 존재하지 않거나 0개라면 기본 템플릿 반환
  if (!itemList || itemList.length === 0) {
    $target.innerHTML = `
      <li class="services__item shadow">
        <div class="services__img">
          <img src="./img/noimg.png" alt="img" />
        </div>
        <div class="services__info-wrap">
          <span class="services__title">데이터가 존재하지 않습니다.</span>
        </div>
      </li>
    `;
    return false;
  }

  saveServices([]);
  itemList.forEach(setServices);

  $target.innerHTML = itemList.map(createHtml).join('') + renderPagination();

  document.querySelectorAll('.services__page').forEach($paginationBtn =>
    $paginationBtn.addEventListener('click', e => {
      page = parseInt(e.target.innerText, 10);
      updateParams();
      loadServiceList(BASE_URL);
    })
  );

  document.querySelector('.services__prev').addEventListener('click', () => navigatePage(dir.prev));
  document.querySelector('.services__next').addEventListener('click', () => navigatePage(dir.next));

  return true;
};

// 페이지네이션 추가
const renderPagination = () => {
  const totalPage = Math.ceil(totalResults / PAGE_SIZE);
  const pageGroup = Math.ceil(page / GROUP_SIZE);
  const firstPage = (pageGroup - 1) * GROUP_SIZE + 1;
  const lastPage = Math.min(totalPage, pageGroup * GROUP_SIZE);

  const createPageBtn = () =>
    Array.from({ length: lastPage - firstPage + 1 }, (_, index) => {
      const pageNumber = firstPage + index;
      const isActive = pageNumber === page ? 'selected' : '';
      return `<button class="services__page ${isActive}">${pageNumber}</button>`;
    }).join('');

  return `
    <li class="services__pagination-wrap">
      <button class="services__prev"><img src="./img/left-arrow.png" alt="" /></button>
      ${createPageBtn()}
      <button class="services__next"><img src="./img/right-arrow.png" alt="" /></button>
    </li>
  `;
};

// 페이지 그룹 이전, 다음 기능
const navigatePage = dir => {
  const nextPage = (Math.ceil(page / GROUP_SIZE) - !dir) * GROUP_SIZE + dir;
  if (nextPage < 1 || nextPage > Math.ceil(totalResults / PAGE_SIZE)) return;

  page = nextPage;
  updateParams();
  loadServiceList(BASE_URL);
};

// 상세내용 중 필요한 내용만 필터링
const cleanDescription = desc => {
  const doc = new DOMParser().parseFromString(desc, 'text/html');

  doc.querySelectorAll('*').forEach(el => {
    el.removeAttribute('style');
    if (el.tagName === 'IMG' || el.tagName === 'FIGURE') el.remove();
  });
  doc.body.innerHTML = doc.body.innerHTML.replace(/&nbsp;/g, ' ');

  const index = [...doc.body.children].findIndex(el => el.textContent.includes('3. 상세내용'));
  if (index !== -1) [...doc.body.children].slice(0, index + 1).forEach(el => el.remove());

  const warningSection = [...doc.querySelectorAll('p, div')].find(el =>
    el.textContent.includes('4. 주의사항')
  );
  if (warningSection) {
    warningSection.innerHTML = warningSection.innerHTML.replace(/4\.\s*/, '');
    if (warningSection.textContent.trim()) {
      const strongTag = document.createElement('strong');
      strongTag.innerHTML = warningSection.innerHTML;
      warningSection.replaceWith(strongTag);
      strongTag.insertAdjacentHTML('afterend', '<br>');
    } else {
      warningSection.remove();
    }
  }

  return doc.body.innerText.trim() !== '주의사항'
    ? doc.body.innerHTML.trim()
    : '링크를 방문하여 상세내용을 확인해주세요!';
};

// 리스트를 클릭하면 디테일한 정보 출력
const showDetails = e => {
  const $target = e.target.closest('li');
  const data = getServices().find(service => service.id === $target.id);

  if (!data) return;

  const $map = document.querySelector('#detail__map');
  const $desc = document.querySelector('.detail__desc');
  const $link = document.querySelector('.detail__reservation');
  const $detail = document.querySelector('.detail');
  const $detailCloseBtn = document.querySelector('.detail__close-btn');

  $desc.innerHTML = cleanDescription(data.desc);
  $link.href = data.url;

  removeMarker();
  setMarkerAndCenter(data.y, data.x);

  $map.style.maxHeight = '60%';
  $desc.style.display = 'block';
  $link.style.display = 'block';
  $detail.classList.add('display');

  // 모바일 버전에서 닫기 버튼 중복 이벤트 등록 방지
  const closeDetailHandler = () => $detail.classList.remove('display');
  $detailCloseBtn.removeEventListener('click', closeDetailHandler);
  $detailCloseBtn.addEventListener('click', closeDetailHandler);
};

// 파라미터를 읽은 후 해당 주소로 fetch실행
const fetchServiceList = async url => {
  const KEY = 'ListPublicReservationEducation';
  const newUrl =
    url +
    Object.values(searchParams)
      .map(param => param || '%20')
      .join('/');
  console.log(newUrl);

  try {
    const response = await fetch(newUrl);
    const data = await response.json();
    totalResults = data[KEY].list_total_count;
    return data[KEY].row;
  } catch (e) {
    console.error('Error fetching service list:', e);
    return [];
  }
};

// 데이터를 성공적으로 받아왔다면 화면에 로드 후 이벤트 리스너 등록
const loadServiceList = async baseUrl => {
  try {
    const services = await fetchServiceList(baseUrl);
    if (!renderServiceList(services)) return;

    document
      .querySelectorAll('.services__item')
      .forEach($service => $service.addEventListener('click', showDetails));
  } catch (error) {
    console.error('Error initializing service list:', error);
  }
};

// 이벤트 리스너 초기화
const initializeEventListeners = () => {
  $logo.addEventListener('click', () => $logo.classList.toggle('rotate'));

  $categoryCon.addEventListener('click', e => {
    if (e.target.tagName !== 'BUTTON') return;

    const $targetBtn = e.target;
    const category = $targetBtn.dataset.category;

    $categoryCon.querySelectorAll('button').forEach(btn => btn.classList.remove('selected'));
    $targetBtn.classList.add('selected');

    selectCategory(category);
    toggleCategoryVisibility(false);
  });

  $submitBtn.addEventListener('click', () => {
    resetParams();
    updateParamsAndLoad();
  });

  $input.addEventListener('keydown', e => {
    if (e.key === 'Enter') {
      resetParams();
      updateParamsAndLoad();
    }
  });

  $menuOpenBtn.addEventListener('click', () => toggleCategoryVisibility(true));
  $closeBtn.addEventListener('click', () => toggleCategoryVisibility(false));
};

// 초기화
loadKakaoMaps();
loadServiceList(BASE_URL);
initializeEventListeners();
