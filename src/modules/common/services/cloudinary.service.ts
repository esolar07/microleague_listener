import { Injectable } from '@nestjs/common';
import { v2 as cloudinary } from 'cloudinary';

@Injectable()
export class CloudinaryService {
  constructor() {
    cloudinary.config({
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
      api_key: process.env.CLOUDINARY_API_KEY,
      api_secret: process.env.CLOUDINARY_API_SECRET,
    });
  }

  async uploadImage(filePath: string): Promise<string> {
    return new Promise((resolve, reject) => {
      cloudinary.uploader.upload(
        filePath,
        { folder: 'uploads' },
        (error, result) => {
          if (error) {
            reject(error);
          } else {
            resolve(result.secure_url);
          }
        },
      );
    });
  }

  async uploadImageDirect(file): Promise<any> {
    try {
      const base64String = file.buffer.toString('base64');
      const result = await cloudinary.uploader.upload(
        `data:${file.mimetype};base64,${base64String}`, // Upload the base64 string as a base64-encoded image
        {
          resource_type: 'auto', // 'auto' detects the resource type (image/video/raw)
          folder: 'uploads', // Optional: specify a folder to organize your images
          public_id: file.originalname.split('.')[0], // Use the original filename as the public ID
          overwrite: true, // Overwrite existing file with the same public ID
        },
      );

      return result.secure_url;
    } catch (error) {
      console.log(error.message, 'error');
      throw new Error('Error uploading image to Cloudinary');
    }
  }
}
