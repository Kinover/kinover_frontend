import RNBlobUtil from 'react-native-blob-util';

import {getPresignedUrls, uploadFileToS3} from 'api/imageUrlApi';

import {
  inferContentTypeByName,
  stripFileScheme,
} from './chatInputUtils';

/**
 * 채팅 미디어 업로드 플로우를 분리한 유틸
 * - resolve/compress는 호출하는 쪽(chatInput)에서 주입받음
 * - 여기서는 파일명/프리사인/업로드/S3 전송까지 담당
 */
export async function uploadChatMediaSnapshot({
  mediaSnapshot,
  resolveUploadUri,
  compressUploadUri,
  getPresignedUrlsFn = getPresignedUrls,
  uploadFileToS3Fn = uploadFileToS3,
  statFn = RNBlobUtil.fs.stat,
  inferContentTypeByNameFn = inferContentTypeByName,
  stripFileSchemeFn = stripFileScheme,
}) {
  const now = Date.now();
  const prepared = [];

  for (let i = 0; i < mediaSnapshot.length; i++) {
    const original = mediaSnapshot[i];
    const originalUri = original?.uri;
    const isVideo = !!original?.isVideo;

    const resolvedUri = await resolveUploadUri(originalUri, i, isVideo);
    const {uri: compressedUri, ext} = await compressUploadUri(
      resolvedUri,
      isVideo,
    );

    const safeExt = ext || (isVideo ? 'mp4' : 'jpg');
    const fileName = `chat_${now}_${i}.${safeExt}`;
    const contentType = inferContentTypeByNameFn(fileName);

    const p = stripFileSchemeFn(compressedUri);
    const stat = await statFn(p);
    const size = Number(stat?.size || 0);
    if (!size) {
      throw new Error(`압축 결과 파일이 비었어요: ${compressedUri}`);
    }

    prepared.push({
      uploadUri: compressedUri,
      fileName,
      contentType,
    });
  }

  const presignedUrls = await getPresignedUrlsFn(
    prepared.map(p => ({fileName: p.fileName, contentType: p.contentType})),
  );

  for (let i = 0; i < prepared.length; i++) {
    const presigned =
      typeof presignedUrls[i] === 'string'
        ? presignedUrls[i]
        : presignedUrls[i]?.url;

    if (!presigned) throw new Error('presigned url is missing');

    await uploadFileToS3Fn(
      presigned,
      prepared[i].uploadUri,
      prepared[i].contentType,
      prepared[i].fileName,
    );
  }

  return prepared.map(p => p.fileName);
}

