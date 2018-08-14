# thumbnail-extractor

Container to run `ffmpeg` and extract a screencap from a video.

## Usage

To run, call `/extract-thumbnail.sh`.

The script will download the video at
`s3://${S3_BUCKET}/${INPUT_VIDEO}`, take a screencap at `${TIME_OFFSET}`, and then save
the result to `s3://${S3_BUCKET}/${OUTPUT_FILE}`.
 
## Publishing to Artifactory

If you've already ran `docker login` to your Artifactory instance, you can push the
built container like any other.

```bash
docker login ${ARTIFACTORY_NAME}-docker.jfrog.io
```

```bash
docker build . -t ${ARTIFACTORY_NAME}-docker.jfrog.io/thumbnail-extractor:latest
docker push ${ARTIFACTORY_NAME}-docker.jfrog.io/thumbnail-extractor:latest
```
