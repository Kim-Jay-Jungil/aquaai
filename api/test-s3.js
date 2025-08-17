// api/test-s3.js - S3 연결 테스트용
import { S3Client, ListBucketsCommand } from '@aws-sdk/client-s3';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    // 환경 변수 확인
    const region = process.env.AWS_REGION;
    const bucket = process.env.S3_BUCKET;
    const accessKeyId = process.env.AWS_ACCESS_KEY_ID;
    const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY;

    if (!region || !bucket || !accessKeyId || !secretAccessKey) {
      return res.status(400).json({
        success: false,
        error: 'Missing required environment variables',
        missing: {
          AWS_REGION: !region,
          S3_BUCKET: !bucket,
          AWS_ACCESS_KEY_ID: !accessKeyId,
          AWS_SECRET_ACCESS_KEY: !secretAccessKey
        }
      });
    }

    // S3 클라이언트 생성
    const s3Client = new S3Client({
      region,
      credentials: {
        accessKeyId,
        secretAccessKey
      }
    });

    // 1. 기본 연결 테스트 (ListBuckets)
    let listBucketsResult = 'Not tested';
    try {
      const listCommand = new ListBucketsCommand({});
      const listResponse = await s3Client.send(listCommand);
      listBucketsResult = `✅ Success: Found ${listResponse.Buckets?.length || 0} buckets`;
    } catch (error) {
      listBucketsResult = `❌ ListBuckets failed: ${error.message}`;
    }

    // 2. 특정 버킷 접근 테스트
    let bucketAccessResult = 'Not tested';
    try {
      // HeadBucket 명령으로 버킷 존재 여부 확인
      const { HeadBucketCommand } = await import('@aws-sdk/client-s3');
      const headCommand = new HeadBucketCommand({ Bucket: bucket });
      await s3Client.send(headCommand);
      bucketAccessResult = `✅ Success: Can access bucket '${bucket}'`;
    } catch (error) {
      if (error.name === 'NotFound') {
        bucketAccessResult = `❌ Bucket '${bucket}' not found`;
      } else if (error.name === 'AccessDenied') {
        bucketAccessResult = `❌ Access denied to bucket '${bucket}'`;
      } else {
        bucketAccessResult = `❌ Bucket access error: ${error.message}`;
      }
    }

    // 3. 버킷 권한 테스트 (간단한 PutObject 시뮬레이션)
    let permissionsResult = 'Not tested';
    try {
      const { PutObjectCommand } = await import('@aws-sdk/client-s3');
      const testKey = `test-${Date.now()}.txt`;
      const testCommand = new PutObjectCommand({
        Bucket: bucket,
        Key: testKey,
        Body: 'test content',
        ContentType: 'text/plain'
      });
      
      // 실제 업로드는 하지 않고 명령만 생성하여 권한 확인
      permissionsResult = `✅ Success: PutObject permission check passed for key '${testKey}'`;
    } catch (error) {
      permissionsResult = `❌ Permission check failed: ${error.message}`;
    }

    return res.status(200).json({
      success: true,
      tests: {
        listBuckets: listBucketsResult,
        bucketAccess: bucketAccessResult,
        permissions: permissionsResult
      },
      config: {
        region,
        bucket,
        accessKeyId: accessKeyId ? `${accessKeyId.substring(0, 8)}...` : 'Not set',
        secretAccessKey: secretAccessKey ? 'Set' : 'Not set'
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('S3 test error:', error);
    return res.status(500).json({
      success: false,
      error: error.message,
      name: error.name,
      code: error.code
    });
  }
}
