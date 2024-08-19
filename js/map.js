import { KAKAO_MAP_URL } from './config.js';

let map;
let marker;

export const loadKakaoMaps = () => {
  const script = document.createElement('script');
  script.src = KAKAO_MAP_URL;
  script.onload = () => kakao.maps.load(initializeMap);
  script.onerror = () => console.error('Kakao Maps API 로드 오류');
  document.head.appendChild(script);
};

const initializeMap = () => {
  const mapContainer = document.getElementById('detail__map');
  map = new kakao.maps.Map(mapContainer, {
    center: new kakao.maps.LatLng(37.5665, 126.978),
    level: 3,
  });
  setMarkerAndCenter(37.5665, 126.978);
};

export const setMarkerAndCenter = (y, x) => {
  const position = new kakao.maps.LatLng(y, x);
  marker = new kakao.maps.Marker({ position });
  marker.setMap(map);
  map.setCenter(position);
};

export const removeMarker = () => marker?.setMap(null);
