FROM node:10.14 as fix
RUN  echo "deb-src http://deb.debian.org/debian stretch main" >> /etc/apt/sources.list && \
  apt-get update && \
	apt-get install -y build-essential fakeroot dpkg-dev && \
	apt-get -y build-dep git && \
	apt-get install -y libcurl4-openssl-dev && \
	mkdir git-openssl && \
	cd git-openssl && \
	apt-get source git && \
	cd git-* && \
	sed -i -e 's/libcurl4-gnutls-dev/libcurl4-openssl-dev/g' ./debian/control && \
	sed -i -- '/TEST\s*=\s*test/d' ./debian/rules && \
	dpkg-buildpackage -rfakeroot -b -uc -us && \
        cd ../ && \
        ls -l 
#RUN dpkg -i git_2.11.0-3+deb9u7_amd64.deb


FROM node:10.14 as base
ARG GOLANG_VERSION=1.16.4
ARG GOLANG_SRC_URL=https://golang.google.cn/dl/go${GOLANG_VERSION}.linux-amd64.tar.gz
ARG GOLANG_SRC_SHA256=7154e88f5a8047aad4b80ebace58a059e36e7e2e4eb3b383127a28c711b4ff59
ENV GOPATH /go
ENV PATH $GOPATH/bin:/usr/local/go/bin:$PATH
RUN curl -fsSL "$GOLANG_SRC_URL" -o golang.tar.gz && \
  echo "$GOLANG_SRC_SHA256 golang.tar.gz" | sha256sum -c - && \
  tar -C /usr/local -xzf golang.tar.gz && \
  rm golang.tar.gz && \
  mkdir -p "$GOPATH/src" "$GOPATH/bin" && chmod -R 777 "$GOPATH" && \
  go env -w GOPROXY="https://goproxy.cn,https://goproxy.io,direct"
RUN  npm config set registry https://registry.npm.taobao.org -g && \
  npm install -g yarn && \
  yarn config set registry https://registry.npm.taobao.org/


FROM base AS builder
RUN go get -u github.com/project-flogo/cli/...
ENV BUILD_DIR /tmp/build
ENV FLOGO_WEB_LOCALDIR ${BUILD_DIR}/dist/local
COPY / ${BUILD_DIR}/
WORKDIR ${BUILD_DIR}
RUN yarn --pure-lockfile && yarn release && \
  cd dist/apps/server && \
  yarn --pure-lockfile --production=true && \
  npx modclean -Pr -n default:safe,default:caution


FROM base as release
ARG GITDEB git_2.11.0-3+deb9u7_amd64.deb
COPY --from=fix  /git-openssl/git_2.11.0-3+deb9u7_amd64.deb .
RUN dpkg -i git_2.11.0-3+deb9u7_amd64.deb  && \
  rm -f git_2.11.0-3+deb9u7_amd64.deb 
ENV NODE_ENV production
ENV FLOGO_WEB_LOCALDIR /flogo-web/local
ENV FLOGO_WEB_PUBLICDIR /flogo-web/apps/client
COPY --from=builder /tmp/build/dist/ /flogo-web/
COPY --from=builder $GOPATH/ $GOPATH/
COPY ./tools/docker/docker-startdev.sh /flogo-web/docker-startdev.sh
WORKDIR /flogo-web/
RUN cd local/engines/flogo-web && flogo build
CMD ["/flogo-web/docker-startdev.sh"]
