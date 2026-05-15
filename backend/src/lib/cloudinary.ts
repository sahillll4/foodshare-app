import { v2 as cloudinary } from 'cloudinary';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

export { cloudinary };

/**
 * Upload a base64 or buffer image to Cloudinary.
 * @param fileBuffer - Buffer or base64 data URI of the image
 * @param folder - Cloudinary folder name (e.g. 'food-listings')
 */
export async function uploadImage(
  fileBuffer: Buffer,
  folder: 'food-listings' | 'avatars' = 'food-listings'
): Promise<string> {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder: `foodshare/${folder}`,
        resource_type: 'image',
        transformation: [
          { width: 800, height: 600, crop: 'limit', quality: 'auto' },
        ],
      },
      (error, result) => {
        if (error) return reject(error);
        if (!result) return reject(new Error('No result from Cloudinary'));
        resolve(result.secure_url);
      }
    );
    stream.end(fileBuffer);
  });
}
