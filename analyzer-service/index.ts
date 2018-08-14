import * as cloud from "@pulumi/cloud-aws";

import * as videoLabeler from "video-labeler";

// Create an S3 bucket to store videos.
const uploadsBucket = new cloud.Bucket("bucket");
const bucketName = uploadsBucket.bucket.id;

// The extractThumbnailTask describes a compute task which extracts a thumbnail image from a
// video. The specific container instance is configured by the environment variables set whenever
// the container is ran.
const extractThumbnailTask = new cloud.Task(
    "thumbnailTask",
    {
        // Have Pulumi build the thumbnail-extractor Dockerfile locally, and push to AWS.
        // (That Dockerfile is in-turn pulled from Artifactory.)
        build: "./thumbnail-extractor",
        memoryReservation: 512,
    });

// The video analysis package to label uploaded videos.
const videoProcessor = new videoLabeler.VideoLabelProcessor("videoProcessor");

// When a new video is uploaded, start the analysis process.
uploadsBucket.onPut(
    "onNewVideo",
    (bucketArgs) => {
        console.log(`New video uploaded to ${bucketArgs.key} (${bucketArgs.eventTime}).`);
        videoProcessor.analyzeVideo(bucketName.get(), bucketArgs.key);
        return Promise.resolve();
    },
    { keySuffix: ".mp4" });

// Lot when a screencap is posed.
uploadsBucket.onPut(
    "onNewThumbnail",
    (bucketArgs) => {
        console.log(`New thumbnail uploaded to ${bucketArgs.key} (${bucketArgs.eventTime}).`);
        return Promise.resolve();
    },
    { keySuffix: ".jpg" });

// When the analysis process is complete, spawn a series of Fargate tasks to extract thumbnails.
videoProcessor.onLabelingComplete(
    (videoFile: string, results: any[]) => {
        console.log(`Video labeling complete (${results.length} labels).`);

        // If the video contains a lot of objects, we can quickly overwhelm Fargate and/or get
        // throttled by AWS. We should just update the thumbnailer-extractor component to accept
        // a list of images to extract, rather than a single one. For the time being, we just
        // limit the max labels extracted.
        let count = 1;
        const maxScreencaps = 5;

        for (const result of results) {
            if (result.Label.Confidence < 95.0 || count > maxScreencaps) {
                return;
            }
            count++;

            const fileSuffix = `_${result.Label.Name}-at-${result.Timestamp}.jpg`;
            const thumbnailFile = videoFile.substring(0, videoFile.lastIndexOf(".")) + fileSuffix;
            const framePos = result.Timestamp / 1000;  // ms to s

            console.log(`Extracting thumbnail for object ${result.Label.Name} to ${thumbnailFile}.`);
            extractThumbnailTask
                .run({
                    environment: {
                        "S3_BUCKET":   bucketName.get(),
                        "INPUT_VIDEO": videoFile,
                        "TIME_OFFSET": `${framePos}`,  // number to string.
                        "OUTPUT_FILE": thumbnailFile,
                    },
                })
                .then(
                    // tslint:disable-next-line
                    () => {},
                    (error: Error) => {
                        console.log("Error launching thumbnail extraction task:", error);
                    });
        }
    });

// Export the bucket name.
exports.bucketName = bucketName;
