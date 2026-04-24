import { jwtDecode } from 'jwt-decode';
import { getToken } from '../utils/storage';


export const getUserIdFromToken = async () => {
  const token = await getToken();
  if (!token) return null;

  const decoded = jwtDecode(token);
  return (
    decoded.userId ??
    decoded.user_id ??
    decoded.sub ??
    decoded.id ??
    decoded.uid ??
    null
  );
};