define(['jquery'], function($) {
	var Thingiverse = (function () {
		"use strict";
		var self;
		var	client_secret = '33884214ccf6789d6f68fa7b245f1db8';
		var	client_id     = '6b2177b42a0eaf4b4d83';
		var	$content      = null;
		var	me            = {};
		var	dashboard     = [];
		var	likes         = [];
		var	mades         = [];
		var	things        = [];
		var	collections   = [];
		var	followers     = [];
		var	following     = [];

		/**
		* Posts to an API endpoint
		* @param path string Endpoint path, including leading slash
		* @param payload Optional object Data to be sent
		* @param next function Callback
		*/
		var post = function(path, payload, next) {
			if (typeof payload === 'function') {
				next = payload;
				payload = null;
			}

			$.post('https://api.thingiverse.com' + path, payload)
				.done(function (data) { next(data); })
				.fail(function () { 
					console.log('Handle this somehow?');
				});
		};

		/**
		* Creates our object. Should never need to be touched
		*/
		var Thingiverse = function () {
			this.initialize();
		};

		Thingiverse.prototype = {
			constructor: Thingiverse,
			/**
			* Effectively our constructor.
			*/
			initialize: function () {
				self = this;

				$(document).ready(function () {
					$content = $('#content');
				});
			},

			/**
			* Handles our login and displays our profile page
			* @param username string
			* @param password string
			*/
			login: function(username, password) {
				var data = {
					'grant_type':'password',
					'client_id': client_id,
					'client_secret': client_secret,
					'username': username,
					'password': password
				};

				$.post('https://www.thingiverse.com/login/oauth/access_token', data, function () { self.getMe(self.showMe); });
			},

			/* helper functions for retrieving each portion of our data */
			getDashboard: function() {
				dashboard = [];
			},

			getMe: function(next) {
				post('/users/me/', function (data) {
					me = data;

					if (next) { next(); }
				});
			},

			getLikes: function(next) {
				post('/users/me/likes', function (data) {
					likes = data;

					if (next) { next(); }
				});
			},

			getCollections: function(next) {
				post('/users/me/collections', function (data) {
					collections = data;

					if (next) {
						next();
					}
				});
			},

			getThings: function(next) {
				post('/users/me/things', function (data) {
					things = data;

					if (next) {
						next();
					}
				});
			},

			getMade: function(next) {
				post('/users/me/copies', function (data) {
					mades = data;

					if (next) {
						next();
					}
				});
			},

			/* helper functions for showing each page */
			showMe: function() {
				console.log('Showing me', me);
			},

			showDashboard: function() {
				console.log('Showing the dashboard', dashboard);
			}

			// getGetParams: function () {
			// 	if (!self.__get_params) {
			// 		self.__get_params = decodeURIComponent(window.location.search.slice(1))
			// 			.split('&')
			// 			.reduce(function _reduce (/*Object*/ a, /*String*/ b) {
			// 				b = b.split('=');
			// 				a[b[0]] = b[1];
			// 				return a;
			// 			}, {});
			// 	}
			// 	return self.__get_params;
			// },
		};

		return Thingiverse;
	}());

	return new Thingiverse();
});
