// 📁 /api/imageUrlApi.js
import axios from 'axios';
import {getToken} from '../utils/storage';
import RNBlobUtil from 'react-native-blob-util';

// 🔑 확장자 기반 Content-Type
const inferContentTypeByName = fileName => {
  const lower = (fileName || '').toLowerCase();
  if (lower.endsWith('.jpg') || lower.endsWith('.jpeg')) return 'image/jpeg';
  if (lower.endsWith('.png')) return 'image/png';
  if (lower.endsWith('.webp')) return 'image/webp';
  if (lower.endsWith('.mp4')) return 'video/mp4';
  if (lower.endsWith('.mov')) return 'video/quicktime';
  return 'application/octet-stream';
};

// ✅ 여러 Presigned URL 요청
export const getPresignedUrls = async filesOrNames => {
  try {
    const token = await getToken();

    const isArray = Array.isArray(filesOrNames);
    const first = isArray ? filesOrNames[0] : null;

    const isNewFormat =
      isArray &&
      first &&
      typeof first === 'object' &&
      typeof first.fileName === 'string';

    const payload = isNewFormat
      ? {files: filesOrNames}
      : {fileNames: filesOrNames};

    const response = await axios.post(
      'http://43.200.47.242:9090/api/image/upload-urls',
      payload,
      {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      },
    );

    console.log('📡 Presigned 응답 데이터:', response.data);
    return response.data; // Array<string | {url: string}>
  } catch (error) {
    console.error(
      'Presigned URL 목록 요청 실패:',
      error.response?.data || error.message,
    );
    throw error;
  }
};

// ✅ S3 PUT 업로드 (핵심: Content-Length 추가 + S3 에러 바디 로그)
export const uploadFileToS3 = async (
  uploadUrl,
  fileUri,
  contentTypeOrFileName,
  maybeFileName,
) => {
  try {
    let fileName = maybeFileName;
    let contentType = contentTypeOrFileName;

    // (uploadUrl, fileUri, fileName) 형태
    if (!maybeFileName) {
      fileName = contentTypeOrFileName;
      contentType = inferContentTypeByName(fileName);
    } else {
      contentType = contentType || inferContentTypeByName(fileName);
    }

    // file:// 제거
    const path = String(fileUri || '').startsWith('file://')
      ? String(fileUri).replace('file://', '')
      : String(fileUri);

    // ✅ Content-Length (영상 403 방지 핵심)
    const stat = await RNBlobUtil.fs.stat(path);
    const contentLength = Number(stat?.size || 0);

    console.log('🧾 PUT headers', {
      contentType,
      contentLength,
      path,
      fileName,
    });

    const res = await RNBlobUtil.fetch(
      'PUT',
      uploadUrl,
      {
        'Content-Type': contentType,
        'Content-Length': String(contentLength),
      },
      RNBlobUtil.wrap(path),
    );

    const info = res?.info?.() || {};
    const status = info.status;

    // ✅ 403일 때 S3가 XML로 이유를 줌 (SignatureDoesNotMatch / AccessDenied 등)
    if (status !== 200 && status !== 204) {
      const bodyText = res?.data || '';
      console.error('🚨 S3 응답 바디:', bodyText);
      throw new Error(`S3 업로드 실패: ${status}`);
    }

    console.log(`✅ 업로드 성공 (${fileName}, ${contentType})`);
    return true;
  } catch (err) {
    console.error('🚨 S3 업로드 에러:', err?.message || err);
    throw err;
  }
};

