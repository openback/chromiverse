requirejs.config({
	baseUrl: 'js',
	paths: {
		thingiverse: 'thingiverse',
		jquery: 'jquery-2.0.3.min'
	}
});

require(['jquery', 'thingiverse'], function ($, thingiverse) {
	"use strict";

	var $error;
	var $loading_screen;

	var showLoading = function() {
		$loading_screen.addClass('show');
	}

	var hideLoading = function() {
		$loading_screen.removeClass('show');
	}

	var showError = function (message) {
		$error.html(message).slideDown();
	};

	var hideError = function () {
		$error.slideUp();
	};

	$(document).ready(function () {
		$error = $('p.error');
		$loading_screen = $('.loading-screen');

		$('#sign-in').on('submit', function (e) {
			e.preventDefault();
			var username = $('#username').val();
			var password = $('#password').val();

			if (!username) {
				showError('Please enter a username');
			} else if (!password) {
				showError('Please enter a password');
			} else {
				hideError();
				showLoading();
				thingiverse.login($('#username').val(), $('#password').val());
			}
		});
	});
});
