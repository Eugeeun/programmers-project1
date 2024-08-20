# 이짝어뗘

## 소개

- 서울시 교육 공공서비스 예약 정보를 제공합니다.

**와이어프레임**
![web view](https://github.com/user-attachments/assets/369c440c-e79a-4681-a025-97aadd968155)


## 특징

- 교육 공공서비스 예약의 서비스명, 지역명 검색을 통해 원하는 정보를 빠르게 찾을 수 있습니다.
- 카테고리별 분류를 통해 특정 정보를 모아볼 수 있습니다.
- 각 서비스의 상세정보를 제공합니다.

## 사용법

- config.js 파일을 추가해야 합니다.

**예시**

- 아래 파일에 API_KEY, KAKAO_MAP_KEY를 js폴더에 추가해 사용하면 됩니다.

```js
const API_KEY = '';
const KAKAO_MAP_KEY = '';
export const BASE_URL = `http://openAPI.seoul.go.kr:8088/${API_KEY}/json/ListPublicReservationEducation/`;
export const SERVICES_KEY = 'services';
export const KAKAO_MAP_URL = `http://dapi.kakao.com/v2/maps/sdk.js?appkey=${KAKAO_MAP_KEY}&autoload=false`;

export const PAGE_SIZE = 15;
export const GROUP_SIZE = 3;

export const dir = {
  prev: 0,
  next: 1,
};
```

## 참고

- https://data.seoul.go.kr/dataList/OA-2268/S/1/datasetView.do
- https://apis.map.kakao.com/web/sample/basicMarker/
![Property Listing](https://github.com/user-attachments/assets/7fd410b5-f9dd-4741-8a6e-d76d80e56cb5)

