import { v4 as uuidv4 } from 'uuid';

export const generateVisitorId = () => {
  let visitorId = localStorage.getItem('visitorId');
  if (!visitorId) {
    visitorId = uuidv4().replace(/-/g, '');
    localStorage.setItem('visitorId', visitorId ?? '');
  }
  return visitorId;
};