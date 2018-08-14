FROM jrottenberg/ffmpeg

RUN apt-get update && \
    apt-get install python-dev python-pip -y && \
    apt-get clean
RUN pip install awscli

COPY extract-thumbnail.sh /extract-thumbnail.sh
RUN chmod +x /extract-thumbnail.sh
