# analyzer-service

The `analyzer-service` is a Pulumi app that enables you to upload a video file to S3, and then
extracts images of objects detected in that video.

## Usage

To upload videos and then see the objects detected, you can use the AWS CLI:

```bash
export BUCKET_NAME=$(pulumi stack output bucketName)
aws s3 cp ~/Desktop/awesome-video.mp4 s3://${BUCKET_NAME}

# Look at the AWS logs for the Pulumi stack. You'll see messages as the
# video is uploaded, analysis starts, and thumbnail tasks get spun up.
pulumi logs -f

# Look at the objects recognized and extracted.
aws s3 ls s3://${BUCKET_NAME}
```

## Development

```bash
npm install
npm run build
npm run lint
```

```bash
pulumi update --yes --skip-preview
```
