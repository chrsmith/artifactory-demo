# Amazon ECS doesn't support private container registries. So we unfortunately
# cannot have the Pulumi program just contain a reference to our container
# served from Artifactory.
#
# Instead, we have this placeholder Dockerfile that is built as part of the
# Pulumi program's build. *That* container is then pushed to ECS and ran
# on AWS infrastructure.
#
# Replace `pulumi-docker.jfrog.io` with the URL to your own Artifactory
# instance.
FROM pulumi-docker.jfrog.io/thumbnail-extractor:latest
ENTRYPOINT /extract-thumbnail.sh
