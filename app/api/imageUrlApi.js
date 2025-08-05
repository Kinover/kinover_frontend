// 📁 /api/imageUrlApi.js
import axios from 'axios';
import { getToken } from '../utils/storage';

// ✅ 여러 Presigned URL 요청
export const getPresignedUrls = async (fileNames) => {
  try {
    const token = await getToken();
    const response = await axios.post(
      'http://43.200.47.242:9090/api/image/upload-urls',
      { fileNames },
      {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      }
    );
    console.log('📡 Presigned 응답 데이터:', response.data);

    return response.data; // Array of presigned URLs
  } catch (error) {
    console.error('Presigned URL 목록 요청 실패:', error.response?.data || error.message);
    throw error;
  }
};

// ✅ S3에 PUT 요청으로 이미지 업로드
export const uploadImageToS3 = async (uploadUrl, fileUri) => {
  try {
    const fileResponse = await fetch(fileUri);
    const blob = await fileResponse.blob();

    const uploadResponse = await fetch(uploadUrl, {
      method: 'PUT',
      headers: {
        'Content-Type': 'image/jpeg',
      },
      body: blob,
    });

    if (!uploadResponse.ok) {
      throw new Error(`S3 업로드 실패: ${uploadResponse.statusText}`);
    }
  } catch (error) {
    console.error('S3 업로드 에러:', error.message);
    throw error;
  }
};
