import {getPresignedUrls, uploadFileToS3} from 'api/imageUrlApi';

/**
 * 단일 파일: presigned URL 발급(HTTPS API) 후 S3 PUT 업로드
 */
export async function uploadImageWithPresignedUrl(fileUri, fileName) {
  const presignedUrls = await getPresignedUrls([fileName]);
  const presigned = presignedUrls?.[0];
  const uploadUrl =
    typeof presigned === 'string'
      ? presigned
      : presigned?.url ?? presigned;

  if (!uploadUrl) {
    throw new Error('presigned url is missing');
  }

  await uploadFileToS3(uploadUrl, fileUri, fileName);

  if (typeof presigned === 'object' && presigned?.fileUrl) {
    return presigned.fileUrl;
  }
  return fileName;
}
