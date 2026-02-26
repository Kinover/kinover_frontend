// JWT 토큰 필요하면 사용 (경로는 프로젝트에 맞게 수정)
import {getToken} from './storage'; // or '../../../utils/storage'
import {uploadFileToS3} from './uploadFile'; // 같은 파일이면 이 줄은 필요 없음

// 백엔드 presigned-url 요청 엔드포인트 (지윤이 서버 경로로 바꿔줘)
const PRESIGNED_URL_ENDPOINT =
  'https://<YOUR_API_DOMAIN>/api/s3/presigned-url'; // TODO: 실제 API 경로로 수정

// 파일 확장자로 content-type 결정 (백엔드에서 필요하면 같이 넘겨줌)
function getContentTypeByFileName(fileName) {
  if (fileName.match(/\.(jpg|jpeg)$/i)) return 'image/jpeg';
  if (fileName.match(/\.png$/i)) return 'image/png';
  if (fileName.match(/\.gif$/i)) return 'image/gif';
  if (fileName.match(/\.(mp4|mov|avi|mkv)$/i)) return 'video/mp4';
  return 'application/octet-stream';
}

/**
 * 1) 백엔드에 presigned-url 요청
 * 2) 받은 uploadUrl로 S3에 PUT 업로드
 * 3) (필요하면) 최종 접근 URL(fileUrl)을 리턴
 */
export async function uploadImageWithPresignedUrl(fileUri, fileName) {
  try {
    const token = await getToken(); // 토큰 필요 없으면 이 부분 삭제해도 됨

    const contentType = getContentTypeByFileName(fileName);

    // 1) presigned-url 발급 요청
    const presignRes = await fetch(PRESIGNED_URL_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? {Authorization: `Bearer ${token}`} : {}),
      },
      body: JSON.stringify({
        fileName,
        contentType,
      }),
    });

    if (!presignRes.ok) {
      throw new Error(`presigned-url 요청 실패: ${presignRes.status}`);
    }

    // 백엔드에서 이런 형태로 응답한다고 가정:
    // { uploadUrl: string, fileUrl: string }
    const {uploadUrl, fileUrl} = await presignRes.json();

    if (!uploadUrl) {
      throw new Error('uploadUrl이 응답에 없습니다.');
    }

    // 2) 실제 S3 업로드
    await uploadFileToS3(uploadUrl, fileUri, fileName);

    return fileUrl;
  } catch (err) {
    console.error('🚨 uploadImageWithPresignedUrl 에러:', err.message);
    throw err;
  }
}
