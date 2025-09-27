import {getPresignedUrls, uploadImageToS3} from '../../api/imageUrlApi';

export async function uploadImageWithPresignedUrl(fileUri, fileName) {
  const [presignedUrl] = await getPresignedUrls([fileName]);
  await uploadImageToS3(presignedUrl, fileUri);
}