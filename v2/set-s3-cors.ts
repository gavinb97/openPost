// ============================================================
// One-shot script: apply CORS policy to onlyposts-media bucket
// Usage: npx tsx set-s3-cors.ts
// Requires S3_ACCESS_KEY, S3_ACCESS_SECRET in .env
// ============================================================

import dotenv from 'dotenv';
import { resolve } from 'path';
import { S3Client, PutBucketCorsCommand } from '@aws-sdk/client-s3';

dotenv.config({ path: resolve(__dirname, '.env') });

const s3 = new S3Client({
  region: process.env.S3_REGION || 'us-east-2',
  credentials: {
    accessKeyId: process.env.S3_ACCESS_KEY!,
    secretAccessKey: process.env.S3_ACCESS_SECRET!,
  },
});

const corsConfig = {
  CORSRules: [
    {
      AllowedOrigins: [
        'https://only-posts.com',
        'https://www.only-posts.com',
        // Uncomment during local dev if needed:
        // 'http://localhost:3000',
      ],
      AllowedMethods: ['GET', 'PUT', 'POST', 'DELETE', 'HEAD'],
      AllowedHeaders: ['*'],
      ExposeHeaders: ['ETag'],
      MaxAgeSeconds: 3000,
    },
  ],
};

async function main() {
  const bucket = process.env.S3_BUCKET || 'poolpartys3';
  console.log(`Applying CORS policy to bucket: ${bucket}`);

  await s3.send(new PutBucketCorsCommand({
    Bucket: bucket,
    CORSConfiguration: corsConfig,
  }));

  console.log('✓ CORS policy applied successfully');
  console.log('Allowed origins:', corsConfig.CORSRules[0].AllowedOrigins);
}

main().catch((err) => {
  console.error('Failed to apply CORS policy:', err.message);
  process.exit(1);
});
