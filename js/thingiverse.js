define(['jquery', 'config', 'page'], function($, config, page) {
	var Thingiverse = (function () {
		"use strict";
		var self;
		var access_token  = null;
		var	$content      = null;
		var	user          = null;
		var	dashboard     = [];
		var	likes         = [];
		var	mades         = [];
		var	things        = [];
		var	collections   = [];
		var	followers     = [];
		var	following     = [];

		/**
		* Gets to an API endpoint
		* @param path string Endpoint path, including leading slash
		* @param payload Optional object Data to be sent
		* @param next function Callback
		*/
		var get = function(path, payload, next) {
			if (typeof payload === 'function') {
				next = payload;
				payload = null;
			}

			$.get(config.api_host.concat(path, '?access_token=', access_token), payload)
				.done(function (data) { next(data); })
				.fail(function () { 
					console.log('Handle this somehow?');
				});
		};

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

			$.post(config.api_host.concat(path, '?access_token=', access_token), payload)
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

				// Temporarily seetting this for dev
				user = {
					"id":104818,
					"name":"openback",
					"full_name":null,
					"url":"http:\/\/api.thingiverse.dev\/users\/openback",
					"public_url":"http:\/\/thingiverse.dev\/openback",
					"thumbnail":"http:\/\/thingiverse.dev\/img\/default\/avatar.jpg",
					"bio":"",
					"location":"",
					"registered":"2013-11-01T14:32:28-04:00",
					"last_active":"2013-11-27T20:57:25-05:00",
					"cover_image":{
						"id":463483,
						"url":"",
						"name":"",
						"sizes":[
							{
								"type":"thumb",
								"size":"large",
								"url":"http:\/\/.s3.amazonaws.com\/"
							},
							{
								"type":"thumb",
								"size":"medium",
								"url":"http:\/\/.s3.amazonaws.com\/"
							},
							{
								"type":"thumb",
								"size":"small",
								"url":"http:\/\/.s3.amazonaws.com\/"
							},
							{
								"type":"thumb",
								"size":"tiny",
								"url":"http:\/\/.s3.amazonaws.com\/"
							},
							{
								"type":"preview",
								"size":"featured",
								"url":"http:\/\/.s3.amazonaws.com\/"
							},
							{
								"type":"preview",
								"size":"card",
								"url":"http:\/\/.s3.amazonaws.com\/"
							},
							{
								"type":"preview",
								"size":"large",
								"url":"http:\/\/.s3.amazonaws.com\/"
							},
							{
								"type":"preview",
								"size":"medium",
								"url":"http:\/\/.s3.amazonaws.com\/"
							},
							{
								"type":"preview",
								"size":"small",
								"url":"http:\/\/.s3.amazonaws.com\/"
							},
							{
								"type":"preview",
								"size":"tiny",
								"url":"http:\/\/.s3.amazonaws.com\/"
							},
							{
								"type":"preview",
								"size":"tinycard",
								"url":"http:\/\/.s3.amazonaws.com\/"
							},
							{
								"type":"display",
								"size":"large",
								"url":"http:\/\/.s3.amazonaws.com\/"
							},
							{
								"type":"display",
								"size":"medium",
								"url":"http:\/\/.s3.amazonaws.com\/"
							},
							{
								"type":"display",
								"size":"small",
								"url":"http:\/\/.s3.amazonaws.com\/"
							}
						],
						"added":"2013-11-10T18:29:12-05:00"
					},
					"things_url":"http:\/\/api.thingiverse.dev\/users\/openback\/things",
					"copies_url":"http:\/\/api.thingiverse.dev\/users\/openback\/copies",
					"likes_url":"http:\/\/api.thingiverse.dev\/users\/openback\/likes",
					"default_license":"cc-sa",
					"email":"tim.caraballo+update@makerbot.com"
				};

			},

			/**
			* Handles our login and displays our profile page
			* @param username string
			* @param password string
			*/
			login: function(username, password) {
				var data = {
					'grant_type':'password',
					'client_id': config.client_id,
					'client_secret': config.client_secret,
					'username': username,
					'password': password
				};

				$.post(config.login_url, data)
					.done(function (response) { 
						console.log(response);
						access_token = response.access_token;
						self.getMe(self.showMe); 
					})
					.fail(function () { 
						page.showError('There was a problem logging in');
						page.hideLoading();
					});
			},

			/* helper functions for retrieving each portion of our data */
			getDashboard: function() {
				dashboard = [];
			},

			getUser: function(next, force) {
				if (user == null || force === true) {
					get('/users/me/', function (data) {
						user = data;

						if (next) { next(); }
					});
				} else {
					if (next) { next(); }
				}
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

					if (next) { next(); }
				});
			},

			getThings: function(next) {
				post('/users/me/things', function (data) {
					things = data;

					if (next) { next(); }
				});
			},

			getMade: function(next) {
				post('/users/me/copies', function (data) {
					mades = data;

					if (next) { next(); }
				});
			},

			/* helper functions for showing each page */
			showUser: function() {
				self.getUser(function () {
					page.replaceWithTemplate('profile', user, {variable: 'user'});
				});
			},

			showDashboard: function() {
				console.log('Showing the dashboard', dashboard);
			}
		};

		return Thingiverse;
	}());

	return new Thingiverse();
});
