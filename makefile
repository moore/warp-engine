CWD               :=$(shell dirname $(realpath $(lastword $(MAKEFILE_LIST))))
DIST              := dist
HTDOCS            := htdocs
GO_DIR            := src/go
JS_DIR            := src/js
HTML_DIR          := src/html

GO_HOME = go-libs/


CERTS_DIR    = certs
BUILD_DIR    = build
BUILD_JS_DIR = ${BUILD_DIR}/js
BUILD_GO_DIR = ${BUILD_DIR}/go

OUT_FILE     = ${BUILD_JS_DIR}/warp-engine.js
MIN_OUT_FILE = ${BUILD_JS_DIR}/warp-engine.min.js

.PHONY: all clean distclean 
all:: ${HTDOCS}

${BUILD_GO_DIR}:
	mkdir -p ${BUILD_GO_DIR}

${GO_HOME}:
	mkdir -p ${GO_HOME}


go : ${BUILD_GO_DIR} ${GO_HOME}
	#GOPATH=`pwd`/${GO_HOME} go build -o ${BUILD_GO_DIR}/server go-libs/planet.com/go-message/server.go

prep : ${GO_HOME}  ${HTDOCS}
	cp -r ${GO_DIR}/* ${GO_HOME}
	cp -r ${HTDOCS} ${GO_HOME}
	#aedeploy gcloud preview app deploy app.yaml --promote

dev-app: prep
	cd ${GO_HOME} && goapp serve

deploy : prep
	cd ${GO_HOME} && goapp deploy -application warp-9

${BUILD_JS_DIR}:
	mkdir -p ${BUILD_JS_DIR}

js : ${BUILD_JS_DIR} npm
	browserify ${JS_DIR}/index.js --debug | node_modules/exorcist/bin/exorcist.js ${OUT_FILE}.map > ${OUT_FILE}

${HTDOCS}: js
	mkdir -p ${HTDOCS}
	mkdir -p ${HTDOCS}/lib
	mkdir -p ${HTDOCS}/lib/keymap
	cp lib/js/codemirror-5.8/lib/* ${HTDOCS}/lib/
	cp lib/js/codemirror-5.8/mode/javascript/javascript.js ${HTDOCS}/lib/codemirror-javascript-mode.js
	cp lib/js/codemirror-5.8/keymap/* ${HTDOCS}/lib/keymap/
	cp ${OUT_FILE} ${OUT_FILE}.map ${HTDOCS}
	cp ${JS_DIR}/worker.js ${HTDOCS}
	cp -r ${HTML_DIR}/* ${HTDOCS}

minify : js
	uglifyjs ${OUT_FILE} --in-source-map ${OUT_FILE}.map --screw-ie8 --source-map ${MIN_OUT_FILE}.map -o ${MIN_OUT_FILE} -p 2 -c -m 

dist : minify
	mkdir -p ${DIST}
	cp ${MIN_OUT_FILE} ${MIN_OUT_FILE}.map ${DIST}

server : ${HTDOCS} npm
	node_modules/http-server/bin/http-server ${HTDOCS}

npm :
	npm install

clean:: 
	-rm -rf ${BUILD_DIR} ${HTDOCS} ${GO_HOME}

distclean:: clean
	-rm -rf ${DIST}
