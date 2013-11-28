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

				/*
				user = {
					"id":104818,
					"name":"openback",
					"full_name":null,
					"url":"http:\/\/api.thingiverse.dev\/users\/openback",
					"public_url":"http:\/\/thingiverse.dev\/openback",
					"thumbnail":"http:\/\/thingiverse.dev\/img\/default\/avatar.jpg",
					"bio":"",
					"location":"Brooklyn, NY",
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
				*/
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

						self.registerNav();
						self.getUser(self.showUser); 
					})
					.fail(function () { 
						page.showError('There was a problem logging in');
						page.hideLoading();
					});
			},

			registerNav: function() {
				$content.on('click', 'nav .profile', function (e) {
					e.preventDefault();
					self.showUser();
				}).on('click', 'nav .dashboard', function (e) {
					e.preventDefault();
					self.showDashboard();
				}).on('click', 'nav .designs', function (e) {
					e.preventDefault();
					self.showThings();
				}).on('click', 'nav .collections', function (e) {
					e.preventDefault();
					self.showCollections();
				}).on('click', 'nav .likes', function (e) {
					e.preventDefault();
					self.showLikes();
				})
			},

			/* helper functions for retrieving each portion of our data */
			getDashboard: function(next, force) {
				dashboard = [];
				if (next) { next(); }
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

			getLikes: function(next, force) {
				if (likes == null || force === true) {
					get('/users/me/likes', function (data) {
						likes = data;

						if (next) { next(); }
					});
				} else {
					if (next) { next(); }
				}
			},

			getCollections: function(next, force) {
				if (collections == null || force === true) {
					get('/users/me/collections', function (data) {
						collections = data;

						if (next) { next(); }
					});
				} else {
					if (next) { next(); }
				}
			},

			getThings: function(next, force) {
				if (things == null || force === true) {
					get('/users/me/things', function (data) {
						things = data;

						if (next) { next(); }
					});
				} else {
					if (next) { next(); }
				}
			},

			getMade: function(next, force) {
				if (mades == null || force === true) {
					get('/users/me/copies', function (data) {
						mades = data;

						if (next) { next(); }
					});
				} else {
					if (next) { next(); }
				}
			},

			/* helper functions for showing each page */
			showUser: function() {
				self.getUser(function () {
					page.replaceWithTemplate('profile', user, {variable: 'user'});
				});
			},

			showLikes: function() {
				self.getLikes(function () {
					console.log('Likes', things);
					page.replaceWithTemplate('things', {'things': likes});
				});
			},

			showThings: function() {
				self.getThings(function () {
					console.log('THINGS', things);
					page.replaceWithTemplate('things', {'things': things});
				});
			},

			showMade: function() {
				self.getMade(function () {
					console.log('MADES', things);
					page.replaceWithTemplate('things', {'things': mades});
				});
			},

			showCollections: function() {
				self.getCollections(function () {
					console.log('Collections', collections);
					page.replaceWithTemplate('collections', {'collections': collections});
				});
			},

			showDashboard: function() {
				self.getCollections(function () {
					console.log('DASHBOARD', collections);
					page.replaceWithTemplate('dashboard', {'dashboard': dashboard});
				});
			}
		};

		return Thingiverse;
	}());

	return new Thingiverse();
});
