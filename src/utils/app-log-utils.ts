import { v4 as uuidv4 } from 'uuid';
import {appLog} from "@/api/dmp-server.ts";

export const sendAppAccessLog = () => {
  appAccessLog()
  setInterval( () => {
    appAccessLog()
  }, 2 * 60 * 1000);
};

export const appAccessLog = async () => {
  try {
    await appLog({
      appId: '05ea7724dd024430896d80c7756a1497',
      visitorId: generateVisitorId() as string,
    })
  } catch (e) {
    console.error(e);
  }
};

export const generateVisitorId = () => {
  let visitorId = localStorage.getItem('visitorId');
  if (!visitorId) {
    visitorId = uuidv4().replace(/-/g, '');
    localStorage.setItem('visitorId', visitorId ?? '');
  }
  return visitorId;
};