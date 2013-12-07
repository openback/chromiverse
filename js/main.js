requirejs.config({
	baseUrl: 'js',
	paths: {
		underscore: 'underscore-min',
		thingiverse: 'thingiverse',
		page: 'page',
		config: 'config'
	}
});

require(['thingiverse'], function (thingiverse) {
	"use strict";

	thingiverse.checkLogin();
});
