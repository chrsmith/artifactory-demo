# video-labeler

Pulumi package for analyzing a video for specific objects, labeling individual key frames.

It is implemented using AWS Rekognition, so you need AWS credentials when included into a Pulumi
program.

## Usage

```typescript
const videoProcessor = new video.VideoLabelProcessor();

// Analyze video stored at s3://super-awsome-bucket/hilarious-cat-video.mp4.
videoProcessor.analyzeVideo("super-awesome-bucket", "hilarious-cat-video.mp4");

videoProcessor.onLabelingComplete((file: string, results: LabelResult[]) => {
    console.log(`Results for analysis of ${file}`);
    for (labelResult of results) {
        console.log(`Detected ${result.Label.Name} (${result.Label.Confidence}% confidence, ${result.Timestamp}ms)`);
    }
});
```

### Configuration

You'll need to set the following configuration values for the `@pulumi/pulumi-aws` package, as
currently Fargate is restricted in where it can run.

```text
pulumi config set aws:region us-east-1
pulumi config set cloud-aws:useFargate true
pulumi config set cloud-aws:computeIAMRolePolicyARNs arn:aws:iam::aws:policy/AWSLambdaFullAccess,arn:aws:iam::aws:policy/AmazonEC2ContainerServiceFullAccess,arn:aws:iam::aws:policy/AmazonRekognitionFullAccess
```

## Development

```bash
npm install
npm run build
npm run lint
```

## Publishing to Artifactory

The `package.json` file declares the NPM registry to use. In our case it is an Artifactory
instance. If you've already ran `npm login` with your Artifactory credentials, then you can
publis new versions of the package with:

```bash
npm publish
```
