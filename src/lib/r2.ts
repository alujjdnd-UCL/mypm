import { S3Client, PutObjectCommand, DeleteObjectsCommand, ListObjectsV2Command, GetObjectCommand } from '@aws-sdk/client-s3';

const r2 = new S3Client({
    region: 'auto',
    endpoint: process.env.R2_ENDPOINT,
    credentials: {
        accessKeyId: process.env.R2_ACCESS_KEY_ID!,
        secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
    },
});

const BUCKET_NAME = process.env.R2_BUCKET_NAME!;

export async function uploadProfilePic(upi: string, buffer: Buffer, contentType: string) {
    const key = `profile-pics/${upi}.png`;
    
    const command = new PutObjectCommand({
        Bucket: BUCKET_NAME,
        Key: key,
        Body: buffer,
        ContentType: contentType,
    });
    
    await r2.send(command);
}

export async function getProfilePic(upi: string) {
    try {
        const key = `profile-pics/${upi}.png`;
        
        const command = new GetObjectCommand({
            Bucket: BUCKET_NAME,
            Key: key,
        });
        
        const response = await r2.send(command);
        
        if (response.Body) {
            return {
                Body: await response.Body.transformToByteArray(),
                ContentType: response.ContentType,
                ContentLength: response.ContentLength,
                LastModified: response.LastModified,
            };
        }
        
        return null;
    } catch (error) {
        // File doesn't exist or other error
        return null;
    }
}

export async function deleteProfilePics(upi: string) {
    // List all objects with the UPI prefix
    const listCommand = new ListObjectsV2Command({
        Bucket: BUCKET_NAME,
        Prefix: `profile-pics/${upi}`,
    });
    
    const listResponse = await r2.send(listCommand);
    
    if (listResponse.Contents && listResponse.Contents.length > 0) {
        // Delete all found objects
        const deleteCommand = new DeleteObjectsCommand({
            Bucket: BUCKET_NAME,
            Delete: {
                Objects: listResponse.Contents.map(obj => ({ Key: obj.Key! })),
            },
        });
        
        await r2.send(deleteCommand);
    }
}