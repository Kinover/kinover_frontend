// 📁 /api/imageUrlApi.js
import axios from 'axios';
import {getToken} from '../utils/storage';
import RNFS from 'react-native-fs';

// ✅ 여러 Presigned URL 요청
export const getPresignedUrls = async fileNames => {
  try {
    const token = await getToken();
    const response = await axios.post(
      'http://43.200.47.242:9090/api/image/upload-urls',
      {fileNames},
      {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      },
    );
    console.log('📡 Presigned 응답 데이터:', response.data);
    return response.data; // Array of presigned URLs
  } catch (error) {
    console.error(
      'Presigned URL 목록 요청 실패:',
      error.response?.data || error.message,
    );
    throw error;
  }
};

// base64 → ArrayBuffer 변환 함수
function base64ToArrayBuffer(base64) {
  const binaryString = global.atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes.buffer;
}

// ✅ 이미지/영상 업로드
export const uploadFileToS3 = async (uploadUrl, fileUri, fileName) => {
  try {
    const base64Data = await RNFS.readFile(
      fileUri.replace('file://', ''),
      'base64',
    );
    const arrayBuffer = base64ToArrayBuffer(base64Data);

    // 🔑 MIME 타입 결정
    let contentType = 'application/octet-stream'; // fallback
    if (fileName.endsWith('.jpg') || fileName.endsWith('.jpeg')) {
      contentType = 'image/jpeg';
    } else if (fileName.endsWith('.png')) {
      contentType = 'image/png';
    } else if (fileName.endsWith('.mp4') || fileName.endsWith('.mov')) {
      contentType = 'video/mp4';
    }

    const res = await fetch(uploadUrl, {
      method: 'PUT',
      headers: {'Content-Type': contentType},
      body: arrayBuffer,
    });

    if (!res.ok) throw new Error(`S3 업로드 실패: ${res.status}`);
    console.log(`✅ 업로드 성공 (${fileName}, ${contentType})`);
  } catch (err) {
    console.error('🚨 S3 업로드 에러:', err.message);
    throw err;
  }
};
