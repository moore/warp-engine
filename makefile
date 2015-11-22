DIST              := dist
HTDOCS            := htdocs
TS_DIR            := src/ts
HTML_DIR          := src/html

CERTS_DIR    = certs
BUILD_DIR    = build
BUILD_JS_DIR = ${BUILD_DIR}/js

OUT_FILE     = ${BUILD_JS_DIR}/warp-engine.js
MIN_OUT_FILE = ${BUILD_JS_DIR}/warp-engine.min.js

.PHONY: all clean distclean 
all:: ${HTDOCS}

${BUILD_JS_DIR}:
	mkdir -p ${BUILD_JS_DIR}

js : ${BUILD_JS_DIR}
	tsc --outDir ${BUILD_JS_DIR}  --module commonjs ${TS_DIR}/index.ts
	browserify ${BUILD_JS_DIR}/index.js --debug | exorcist ${OUT_FILE}.map > ${OUT_FILE}

${HTDOCS}: js
	mkdir -p ${HTDOCS}
	cp ${OUT_FILE} ${OUT_FILE}.map ${HTDOCS}
	cp -r ${HTML_DIR}/* ${HTDOCS}

minify : js
	uglifyjs ${OUT_FILE} --in-source-map ${OUT_FILE}.map --screw-ie8 --source-map ${MIN_OUT_FILE}.map -o ${MIN_OUT_FILE} -p 2 -c -m 

dist : minify
	mkdir -p ${DIST}
	cp ${MIN_OUT_FILE} ${MIN_OUT_FILE}.map ${DIST}

server : ${HTDOCS}
	nghttpd -n 4 --htdocs=${HTDOCS}/ 8000 ${CERTS_DIR}/server.key ${CERTS_DIR}/server.crt

generate_certs: ${CERTS_DIR}
	openssl genrsa -out ${CERTS_DIR}/rootCA.key 2048
	openssl req -x509 -new -nodes -key ${CERTS_DIR}/rootCA.key -days 1024 -out ${CERTS_DIR}/rootCA.pem
	openssl genrsa -out ${CERTS_DIR}/server.key 2048
	openssl req -new -key ${CERTS_DIR}/server.key -out ${CERTS_DIR}/server.csr
	openssl x509 -req -in ${CERTS_DIR}/server.csr -CA ${CERTS_DIR}/rootCA.pem -CAkey ${CERTS_DIR}/rootCA.key -CAcreateserial -out ${CERTS_DIR}/server.crt -days 500

clean:: 
	-rm -rf ${BUILD_DIR} ${HTDOCS}

distclean:: clean
	-rm -rf ${DIST}
