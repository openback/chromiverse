#!/bin/bash
declare -a files=(
	bower_components
	css
	images
	index.html
	js
	manifest.json
	README.md
);

zip -r chromiverse.zip ${files[@]}
