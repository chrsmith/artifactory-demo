import * as aws from "@pulumi/aws";
import * as cloud from "@pulumi/cloud-aws";

import * as pulumi from "@pulumi/pulumi";

// IAM Role policy allowing AWS Rekognition to access the S3-hosted video to analyze.
const policy = {
    "Version": "2012-10-17",
    "Statement": [
        {
            "Action": "sts:AssumeRole",
            "Principal": {
                "Service": "rekognition.amazonaws.com",
            },
            "Effect": "Allow",
            "Sid": "",
        },
    ],
};

/**
 * Pulumi component for analyzing videos using AWS Rekognition.
 */
export class VideoLabelProcessor  extends pulumi.ComponentResource {
    // The Topic messages are sent to whenever Rekognition is finished analyzing a video.
    readonly topic: cloud.Topic<any>;

    // IAM Role assumed to start Rekognition jobs.
    readonly role: aws.iam.Role;

    /**
     * @param name The _unique_ name of the resource.
     * @param opts A bag of options that control this resource's behavior.
     */
    constructor(name: string, opts?: pulumi.ResourceOptions) {
        const inputs: pulumi.Inputs = {
            options: opts,
        };
        super("pulumi-contrib:components:VideoLabelProcessor", name, inputs, opts);

        // Default resource options for children, just parent them to this ComponentResource.
        const defaultResourceOpts: pulumi.ResourceOptions = { parent: this };

        // Create the role policy we need to use, granting AWS Rekognition access to read
        // data found in the running AWS acount.
        this.role = new aws.iam.Role(
            `${name}-role`,
            { assumeRolePolicy: JSON.stringify(policy) },
            defaultResourceOpts);

        const serviceRoleAccess = new aws.iam.RolePolicyAttachment(
            `${name}-role-access`,
            {
                role: this.role,
                // The AWS-managed Reknognition service role.
                policyArn: "arn:aws:iam::aws:policy/service-role/AmazonRekognitionServiceRole",
            },
            defaultResourceOpts);

        // Rekognition sends events asynchronously. We use this topic to coordinate listener callbacks.
        this.topic = new cloud.Topic(`${name}-Topic`, defaultResourceOpts);
    }

    /**
     * Begin analyzing a video stored on S3.
     */
    public analyzeVideo(bucketName: string, filename: string) {
        const awsSdk = require("aws-sdk");
        const rekognition = new awsSdk.Rekognition();

        const params = {
            MinConfidence: 50.0,  // [0, 100]
            Video: {
                S3Object: {
                    Bucket: bucketName,
                    Name: filename,
                },
            },
            // When the label detection job completes, a new message is put into the underlying
            // SNS topic of this.topic. That's how we know when to call whatever clients register
            // callbacks via onLabelingComplete.
            NotificationChannel: {
                RoleArn: this.role.arn.get(),
                SNSTopicArn: this.topic.topic.arn.get(),
            },
        };

        rekognition.startLabelDetection(
            params,
            (err: Error, data: any) => {
                if (err) {
                    console.log("Error starting label detection", err, err.stack);
                } else {
                     console.log(`Rekognition job submitted for ${filename}.`);
                     console.log(`Rekognition Job ID: ${data.JobId}`);
                     console.log(`Results will be posted to SNS topic ARN: ${this.topic.topic.arn.get()}`);
                }
            });
    }

    /**
     * onLabelingComplete calls the provided callback when the video is finished being analyzed.
     */
    public onLabelingComplete(callback: any) {
        this.topic.subscribe(
            "onLabelingCompleteSub",
            async (jobStatus) => {
                console.log("subscription callback:", JSON.stringify(jobStatus, null, 2));
                if (jobStatus.Status !== "SUCCEEDED" || jobStatus.API !== "StartLabelDetection") {
                    return;
                }

                // Fetch the actual results from Rekongition now that they exist.
                const awsSdk = require("aws-sdk");
                const rekognition = new awsSdk.Rekognition();

                rekognition.getLabelDetection(
                    { JobId: jobStatus.JobId },
                    (err: Error, data: any) => {
                        if (err) {
                            console.log("Error getting label detection results", err, err.stack);
                            return;
                        }
                        console.log("Obtained label detection results.");

                        callback(jobStatus.Video.S3ObjectName, data.Labels);
                    });
            });
    }
}
