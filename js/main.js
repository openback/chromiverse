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

// Temporary for designing
// thingiverse.showUser();
// return;

		$('#sign-in').on('submit', function (e) {
			e.preventDefault();
			var username = $('#username').val();
			var password = $('#password').val();

			if (!username) {
				page.showError('Please enter a username');
			} else if (!password) {
				page.showError('Please enter a password');
			} else {
				page.hideError();
				page.showLoading();
				thingiverse.login($('#username').val(), $('#password').val());
			}
		});
	});
});
