import axios from 'axios';
import {getToken} from '../utils/storage';

// 1. presigned URL 요청
export const imageUrlApi = async fileName => {
  try {
    const token = await getToken();
    const response = await axios.post(
      'http://43.200.47.242:9090/api/image/upload-url',
      {fileName}, // ✅ 백엔드는 fileName만 필요함
      {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      },
    );

    const url = response.data; // 백엔드가 string 하나만 반환
    return {
      uploadUrl: url, // S3에 PUT할 presigned URL
      fileUrl: url, // 업로드된 후 접근할 URL (같음)
    };
  } catch (error) {
    console.error(
      'Presigned URL 요청 실패:',
      error.response?.data || error.message,
    );
    throw error;
  }
};

// 2. S3에 PUT 요청으로 이미지 업로드
export const uploadImageToS3 = async (uploadUrl, fileUri) => {
  try {
    const fileResponse = await fetch(fileUri);
    const blob = await fileResponse.blob();

    const uploadResponse = await fetch(uploadUrl, {
      method: 'PUT',
      headers: {
        'Content-Type': 'image/jpeg', // ✅ presigned URL과 일치해야 함
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
