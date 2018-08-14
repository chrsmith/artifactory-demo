# Pulumi with Artifactory Demo

This repository shows how to use [JFrog Artifactory](https://jfrog.com/artifactory/) in conjunction
with Pulumi.

## Application

The Pulumi application uses Amazon Web Services to enable users to upload video files to S3. Those
videos are then analyzed using Rekognition to detect objects at certain key frames. Each object
that is detected is then extracted from the video, using `ffmpeg` running on Fargate.

The code is based on [some](https://github.com/pulumi/examples/tree/master/cloud-js-thumbnailer)
[examples](https://github.com/pulumi/examples/tree/master/cloud-js-thumbnailer-machine-learning) in
the [pulumi/examples](https://github.com/pulumi/examples) repository. Though this repo separated
out the components involved so they could be built and versioned independently, and served from
Artifactory.

## Components

### video-labeler

The `video-labeler` directory contains an NPM package abstracting the use of AWS Rekognition for
analyzing images. The Pulumi program will consume the `video-labeler` package so that it can be
blissfully unaware of how Rekognition, Lambda, SNS, and the IAM policy schenanigans that go on
under the hood.

### thumbnail-extractor

The `thumbnail-extractor` directory contains a `Dockerfile` which contains a script for extracting
images from a video stored on S3. It uses `ffmpeg` under the hood.

### analyzer-service

The `analyzer-service` directory contains the Pulumi program that puts it all together.
