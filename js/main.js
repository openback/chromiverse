requirejs.config({
	baseUrl: 'js',
	paths: {
		jquery: 'jquery-2.0.3.min',
		underscore: 'underscore-min',
		thingiverse: 'thingiverse',
		page: 'page',
		config: 'config'
	}
});

require(['jquery', 'thingiverse', 'page'], function ($, thingiverse, page) {
	"use strict";

	$(document).ready(function () {
		thingiverse.checkLogin();
	});
});
