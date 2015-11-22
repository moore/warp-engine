DIST              := dist
HTDOCS            := htdocs
JS_DIR            := src/js
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
	browserify ${JS_DIR}/index.js --debug | node_modules/exorcist/bin/exorcist.js ${OUT_FILE}.map > ${OUT_FILE}

${HTDOCS}: js npm
	mkdir -p ${HTDOCS}
	mkdir -p ${HTDOCS}/lib
	mkdir -p ${HTDOCS}/lib/keymap
	cp lib/js/codemirror-5.8/lib/* ${HTDOCS}/lib/
	cp lib/js/codemirror-5.8/mode/javascript/javascript.js ${HTDOCS}/lib/codemirror-javascript-mode.js
	cp lib/js/codemirror-5.8/keymap/* ${HTDOCS}/lib/keymap/
	cp ${OUT_FILE} ${OUT_FILE}.map ${HTDOCS}
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
	-rm -rf ${BUILD_DIR} ${HTDOCS} node_modules

distclean:: clean
	-rm -rf ${DIST}
