Of course. Here is a complete summary of the final, correct plan for your project, formatted as a Markdown file. You can copy and paste this entire block of text into a file named `README.md` in your project folder.

-----

````markdown
# Plan: Next.js Admin Panel for Editing JSONs in a Lightsail Bucket

This document outlines the complete plan for creating a secure admin panel with Next.js to manage JSON files stored in an AWS Lightsail Bucket.

## Architecture Overview

The architecture is designed for security and best practices. The Next.js frontend **does not** communicate directly with AWS. Instead, it makes requests to its own backend API routes, which then securely handle the communication with the Lightsail Bucket using the AWS SDK.

**Flow:**
`Admin Panel UI (Frontend)` → `Next.js API Routes (Backend)` → `AWS SDK` → `AWS Lightsail Bucket`

---

## 1. AWS Setup: IAM User and Policy

The foundation is a dedicated IAM user with a custom policy that grants it permission to access *only* the specific Lightsail Bucket.

### Action Checklist:

1.  **Navigate to the AWS IAM Console.**
2.  **Create a new IAM User** (e.g., `parezar-bucket-user`) with **Programmatic access**.
3.  **Create a new custom IAM Policy** by selecting "Attach policies directly" -> "Create policy" -> "JSON".
4.  **Paste the following JSON code** into the policy editor. This policy grants access *only* to the `parezar-laws` bucket.

    ```json
    {
        "Version": "2012-10-17",
        "Statement": [
            {
                "Sid": "AllowReadWriteInLightsailBucket",
                "Effect": "Allow",
                "Action": [
                    "s3:GetObject",
                    "s3:PutObject",
                    "s3:DeleteObject"
                ],
                "Resource": "arn:aws:s3:::parezar-laws/*"
            },
            {
                "Sid": "AllowBucketListing",
                "Effect": "Allow",
                "Action": "s3:ListBucket",
                "Resource": "arn:aws:s3:::parezar-laws"
            }
        ]
    }
    ```
5.  **Save the policy** (e.g., with the name `Lightsail-parezar-laws-Bucket-Access`).
6.  **Attach the new policy** to your user and finish the creation process.
7.  **Securely save the generated `Access key ID` and `Secret access key`**.

---

## 2. Next.js Project Setup

### A. Install Dependencies

Install the AWS SDK for S3 in your project terminal:
```bash
npm install @aws-sdk/client-s3
```

### B. Configure Environment Variables

Create a file named `.env.local` in the root of your project. **This file should never be committed to Git.**

```
# .env.local

# Keys from the IAM user you just created
AWS_ACCESS_KEY_ID=PASTE_YOUR_ACCESS_KEY_ID_HERE
AWS_SECRET_ACCESS_KEY=PASTE_YOUR_SECRET_ACCESS_KEY_HERE

# Your Lightsail Bucket details
AWS_REGION=eu-central-1
S3_BUCKET_NAME=parezar-laws
```

### C. Create the S3 Client Helper

Create a reusable S3 client to simplify your API code.

**File: `lib/s3Client.ts`**
```typescript
import { S3Client } from "@aws-sdk/client-s3";

const s3Client = new S3Client({
  region: process.env.AWS_REGION as string,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID as string,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY as string,
  },
});

export default s3Client;
```

### D. Create the Backend API Route

This server-side route is the secure bridge between your app and your bucket.

**File: `app/api/json/route.ts`**
```typescript
import { NextResponse } from 'next/server';
import s3Client from '@/lib/s3Client';
import { GetObjectCommand, PutObjectCommand } from '@aws-sdk/client-s3';

// Helper function to convert stream to string
async function streamToString(stream: any): Promise<string> {
  return new Promise((resolve, reject) => {
    const chunks: Uint8Array[] = [];
    stream.on('data', (chunk: Uint8Array) => chunks.push(chunk));
    stream.on('error', reject);
    stream.on('end', () => resolve(Buffer.concat(chunks).toString('utf-8')));
  });
}

// GET a file from the bucket
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const fileName = searchParams.get('file');

  if (!fileName) {
    return NextResponse.json({ error: 'File name is required' }, { status: 400 });
  }

  const command = new GetObjectCommand({
    Bucket: process.env.S3_BUCKET_NAME,
    Key: fileName,
  });

  try {
    const response = await s3Client.send(command);
    const bodyContents = await streamToString(response.Body);
    return NextResponse.json(JSON.parse(bodyContents));
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch data from Lightsail Bucket' }, { status: 500 });
  }
}

// UPDATE a file in the bucket
export async function POST(request: Request) {
  const { searchParams } = new URL(request.url);
  const fileName = searchParams.get('file');

  if (!fileName) {
    return NextResponse.json({ error: 'File name is required' }, { status: 400 });
  }

  try {
    const updatedJsonData = await request.json();

    const command = new PutObjectCommand({
      Bucket: process.env.S3_BUCKET_NAME,
      Key: fileName,
      Body: JSON.stringify(updatedJsonData, null, 2),
      ContentType: 'application/json',
    });

    await s3Client.send(command);
    return NextResponse.json({ success: true, message: `${fileName} updated successfully` });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update data in Lightsail Bucket' }, { status: 500 });
  }
}
```

### E. Create the Frontend Admin Page

This is an example React component that uses your API route to edit a JSON file.

**File: `app/admin/page.tsx`**
```typescript
'use client';

import { useState, useEffect, type ChangeEvent, type FormEvent } from 'react';

export default function AdminPage() {
  const [jsonData, setJsonData] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string>('');

  const fileName = 'data.json'; // The file you want to edit

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch(`/api/json?file=${fileName}`);
        if (!response.ok) throw new Error('Failed to fetch data');
        const data = await response.json();
        setJsonData(JSON.stringify(data, null, 2));
      } catch (err: any) {
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, [fileName]);

  const handleSave = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setStatusMessage('Saving...');

    try {
      const parsedJson = JSON.parse(jsonData); // Validate JSON before sending
      const response = await fetch(`/api/json?file=${fileName}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(parsedJson),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to save data');
      }
      setStatusMessage('Data saved successfully!');
    } catch (err: any) {
      setError(`Error: ${err.message}.`);
      setStatusMessage('');
    }
  };

  if (isLoading) return <p>Loading...</p>;

  return (
    <div>
      <h1>Edit {fileName}</h1>
      <form onSubmit={handleSave}>
        <textarea
          value={jsonData}
          onChange={(e: ChangeEvent<HTMLTextAreaElement>) => setJsonData(e.target.value)}
          rows={30}
          cols={100}
        />
        <br />
        <button type="submit">Save Changes</button>
      </form>
      {statusMessage && <p style={{ color: 'green' }}>{statusMessage}</p>}
      {error && <p style={{ color: 'red' }}>{error}</p>}
    </div>
  );
}
```

---

## 3. Running the Application

After all files and credentials are in place, restart your development server to load the environment variables.

```bash
npm run dev
```

Navigate to `/admin` in your browser to use the editing panel.

```
````