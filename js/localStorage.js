import { SERVICES_KEY } from './config.js';

export const getServices = () => JSON.parse(localStorage.getItem(SERVICES_KEY)) || [];
export const saveServices = services =>
  localStorage.setItem(SERVICES_KEY, JSON.stringify(services));
export const setServices = item => {
  const { SVCID, DTLCONT, X, Y, SVCURL } = item;
  const newService = { id: SVCID, desc: DTLCONT, x: X, y: Y, url: SVCURL };
  saveServices([...getServices(), newService]);
};
