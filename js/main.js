'use strict';

import { BASE_URL, SERVICES_KEY } from './config.js';

const $categoryCon = document.querySelector('.swiper-wrapper');

const PAGE_SIZE = 15;
let page = 1; // currentPage
let totalResults = null;
let groupSize = 3;

const searchParams = {
  pageBegin: (page - 1) * PAGE_SIZE + 1,
  pageEnd: page * PAGE_SIZE,
  minclass: '', // category
  svcname: '',
  target: '', // not use
  area: '',
};

const dir = {
  prev: 0,
  next: 1,
};

const updateSearchParams = () => {
  searchParams.pageBegin = (page - 1) * PAGE_SIZE + 1;
  searchParams.pageEnd = page * PAGE_SIZE;
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

const getStatus = (status) => {
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

const createHtml = (item) => {
  const {
    SVCID,
    IMGURL,
    SVCSTATNM,
    SVCNM,
    PLACENM,
    USETGTINFO,
    SVCOPNBGNDT,
    SVCOPNENDDT,
  } = item;
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

// get location and details of Service from localStorage
const getServices = () => JSON.parse(localStorage.getItem(SERVICES_KEY)) || [];

// save location and details of Service to localStorage
const saveServices = (services) => {
  localStorage.setItem(SERVICES_KEY, JSON.stringify(services));
};

// update localStorage
const setServices = (item) => {
  const { SVCID, DTLCONT, X, Y, SVCURL } = item;
  const newService = {
    id: SVCID,
    desc: DTLCONT,
    x: X,
    y: Y,
    url: SVCURL,
  };
  saveServices([...getServices(), newService]);
};

const createPageBtn = () => {
  const totalPage = Math.ceil(totalResults / PAGE_SIZE); // 총 페이지 수
  const pageGroup = Math.ceil(page / groupSize); // 현재 페이지가 속해있는 그룹
  const firstPage = (pageGroup - 1) * groupSize + 1;
  const lastPage = Math.min(totalPage, pageGroup * groupSize);

  return Array.from({ length: lastPage - firstPage + 1 }, (_, index) => {
    const pageNumber = firstPage + index;
    const isActive = pageNumber === +page ? 'selected' : '';
    return `<button class="services__page ${isActive}">${pageNumber}</button>`;
  }).join('');
};

const getPagination = () => {
  return `
    <li class="services__pagination-wrap">
      <button class="services__prev"><img src="./img/left-arrow.png" alt="" /></button>
      ${createPageBtn()}
      <button class="services__next"><img src="./img/right-arrow.png" alt="" /></button>
    </li>
  `;
};

const movePage = (dir) => {
  const nextPage = (Math.ceil(page / groupSize) - !dir) * groupSize + dir;
  if (nextPage < 1 || nextPage > Math.ceil(totalResults / PAGE_SIZE)) return;

  page = nextPage;
  updateSearchParams();
  initializeServiceList(BASE_URL);
};

// 받아온 리스트로 HTML 그리기
const paintHtmlToServiceList = (itemList) => {
  const $target = document.querySelector('.services__list');

  // Save detail data and location to localStorage
  const serviceList = itemList.map(createHtml).join('');
  saveServices([]);
  itemList.forEach(setServices);

  // Add pagination at last of element
  $target.innerHTML = serviceList + getPagination();
  const $$paginationBtns = document.querySelectorAll('.services__page');
  $$paginationBtns.forEach(($paginationBtn) => {
    $paginationBtn.addEventListener('click', (e) => {
      page = e.target.innerText;
      updateSearchParams();
      initializeServiceList(BASE_URL);
    });
  });

  document.querySelector('.services__prev').addEventListener('click', () => {
    movePage(dir.prev);
  });
  document.querySelector('.services__next').addEventListener('click', () => {
    movePage(dir.next);
  });
};

const filterDesc = (desc) => {
  const doc = new DOMParser().parseFromString(desc, 'text/html');

  // 스타일, 이미지, figure 제거 및 &nbsp; 처리
  doc.querySelectorAll('*').forEach((el) => {
    el.removeAttribute('style');
    if (el.tagName === 'IMG' || el.tagName === 'FIGURE') el.remove();
  });
  doc.body.innerHTML = doc.body.innerHTML.replace(/&nbsp;/g, ' ');

  // "3. 상세내용" 이전의 모든 요소 제거
  const index = [...doc.body.children].findIndex((el) =>
    el.textContent.includes('3. 상세내용')
  );

  if (index !== -1) {
    [...doc.body.children].slice(0, index + 1).forEach((el) => el.remove());
  }

  // "4. 주의사항" 처리
  const warningSection = [...doc.querySelectorAll('p, div')].find((el) =>
    el.textContent.includes('4. 주의사항')
  );
  if (warningSection) {
    warningSection.innerHTML = warningSection.innerHTML.replace(/4\.\s*/, ''); // "4." 제거
    if (warningSection.textContent.trim()) {
      const strongTag = document.createElement('strong');
      strongTag.innerHTML = warningSection.innerHTML;
      warningSection.replaceWith(strongTag);
      strongTag.insertAdjacentHTML('afterend', '<br>');
    } else {
      warningSection.remove();
    }
  }

  // 최종 결과 반환
  return doc.body.innerText.trim() !== '주의사항'
    ? doc.body.innerHTML.trim()
    : '링크를 방문하여 상세내용을 확인해주세요!';
};

const displayDetails = (e) => {
  const $target = e.target.closest('li');
  const $map = document.querySelector('#detail__map');
  const $desc = document.querySelector('.detail__desc');
  const $link = document.querySelector('.detail__reservation');
  const data = getServices().filter((service) => service.id === $target.id)[0];

  $desc.innerHTML = filterDesc(data.desc);
  $link.href = data.url;

  $map.style.maxHeight = '60%';
  $desc.style.display = 'block';
  $link.style.display = 'block';
};

// 서비스 리스트 받아오기
const getServiceList = async (url) => {
  const KEY = 'ListPublicReservationEducation';
  const newUrl = url + Object.values(searchParams).join('/');
  console.log(newUrl);

  try {
    const response = await fetch(newUrl);
    const data = await response.json();

    totalResults = data[KEY].list_total_count;
    return data[KEY].row;
  } catch (e) {
    console.log(e);
  }
};

$categoryCon.addEventListener('click', (e) => {
  if (e.target.tagName !== 'BUTTON') return;
  console.log(e.target.dataset.category);
  const category = e.target.dataset.category;
  searchParams.minclass = category.split('/')[0];
  page = 1;
  updateSearchParams();
  initializeServiceList(BASE_URL);
});

// TODO: 보기 쉽게 만들기
const initializeServiceList = (baseUrl) => {
  getServiceList(baseUrl)
    .then(paintHtmlToServiceList)
    .then(() => {
      const $$services = document.querySelectorAll('.services__item');
      $$services.forEach(($service) => {
        $service.addEventListener('click', displayDetails);
      });
    })
    .catch((error) => {
      console.error('Error fetching service list:', error);
    });
};

// 사용 예시
initializeServiceList(BASE_URL);
