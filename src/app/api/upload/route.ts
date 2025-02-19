import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { NextRequest } from "next/server";


const s3Client = new S3Client({
  region: process.env.AWS_REGION!,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!
  }
});

const uploadFileToS3 = async (file: Buffer, fileName: string) => {

  const params = {
    Bucket: process.env.AWS_BUCKET,
    Key: `audio/${fileName}`,
    Body: file,
    ContentType: "audio/wav"
  }

  const command = new PutObjectCommand(params);
  await s3Client.send(command);

  return fileName;
}

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File;

    if(!file) return Response.json({ error: "File is required" }, { status: 400 })

      const buffer = Buffer.from(await file.arrayBuffer());
      const fileName = await uploadFileToS3(buffer, file.name)
      
    return Response.json({ success: true, fileName })
  } catch (error) {
    return Response.json({ error: "Error uploading file" })
  }

}
