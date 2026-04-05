import RNFS from 'react-native-fs';

// base64 → ArrayBuffer 변환
function base64ToArrayBuffer(base64) {
  const binaryString = global.atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes.buffer;
}

// 파일 업로드 (이미지 + 영상 공통)
export async function uploadFileToS3(uploadUrl, fileUri, fileName) {
  try {
    const base64Data = await RNFS.readFile(
      fileUri.replace('file://', ''),
      'base64',
    );
    const arrayBuffer = base64ToArrayBuffer(base64Data);

 // Content-Type 자동 지정
    let contentType = 'application/octet-stream';
    if (fileName.match(/\.(jpg|jpeg)$/i)) contentType = 'image/jpeg';
    else if (fileName.match(/\.png$/i)) contentType = 'image/png';
    else if (fileName.match(/\.gif$/i)) contentType = 'image/gif';
    else if (fileName.match(/\.(mp4|mov|avi|mkv)$/i)) contentType = 'video/mp4';

    const res = await fetch(uploadUrl, {
      method: 'PUT',
      headers: {'Content-Type': contentType},
      body: arrayBuffer,
    });

    if (!res.ok) throw new Error(`S3 업로드 실패: ${res.status}`);
  } catch (err) {
    throw err;
  }
}