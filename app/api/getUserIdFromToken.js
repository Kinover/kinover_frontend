import { jwtDecode } from 'jwt-decode';
import { getToken } from '../utils/storage';


export const getUserIdFromToken = async () => {
  const token = await getToken();
  if (!token) return null;

  const decoded = jwtDecode(token);
  return decoded.userId || decoded.sub || decoded.id; // 어떤 키로 들어가는지 로그로 확인
};