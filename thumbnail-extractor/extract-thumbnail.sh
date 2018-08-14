#!/bin/bash

echo "extract-thumbnail.sh"

if [ -z ${INPUT_VIDEO:-} ] || [ -z ${S3_BUCKET:-} ] || [ -z ${TIME_OFFSET:-} ] || [ -z ${OUTPUT_FILE:-} ]; then
    echo "Error. Required environment variable not set. Current environment:"
    env
    exit 1
fi

echo "Copying video from s3://${S3_BUCKET}/${INPUT_VIDEO} to ${INPUT_VIDEO}."
aws s3 cp s3://${S3_BUCKET}/${INPUT_VIDEO} ./${INPUT_VIDEO}

echo "Extracting frame from video."
ffmpeg \
    -v error \
    -i ./${INPUT_VIDEO} \
    -ss ${TIME_OFFSET} \
    -vframes 1 -f image2 \
    -an -y \
    ${OUTPUT_FILE}

echo "Copying resulting image to s3://${S3_BUCKET}/${OUTPUT_FILE}"
aws s3 cp ./${OUTPUT_FILE} s3://${S3_BUCKET}/${OUTPUT_FILE}
