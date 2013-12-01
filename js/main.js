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

require(['jquery', 'thingiverse'], function ($, thingiverse) {
	"use strict";

	$(document).ready(function () {
		thingiverse.checkLogin();
	});
});
