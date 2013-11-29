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

					// Login form handler
					$('#content').on('submit', '#sign-in', function (e) {
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
							self.login($('#username').val(), $('#password').val());
						}
					});
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

			defaultView: function (next) {
				self.getUser(function () {
					self.showUser(function () {
						self.registerNav(next);
					});
				});
			},

			/**
			 * Check if we already have a saved access_token and show the default view if so
			 */
			checkLogin: function(next) {
				chrome.storage.sync.get('access_token', function (items) {
					if (items.access_token) { // TODO: HOw to check runtime error?
						// TODO: How to check runtime error?
						access_token = items.access_token;
						self.defaultView(next);
					} else {
						self.showLogin(next);
					}
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
					'client_id': config.client_id,
					'client_secret': config.client_secret,
					'username': username,
					'password': password
				};

				$.post(config.login_url, data)
					.done(function (response) { 
						access_token = response.access_token;
						chrome.storage.sync.set({'access_token': access_token}, self.defaultView);
					})
					.fail(function () { 
						page.showError('There was a problem logging in');
						page.hideLoading();
					});
			},

			registerNav: function(next) {
				$content.on('click', 'nav .profile', function (e) {
					e.preventDefault();
					self.showUser(next);
				}).on('click', 'nav .dashboard', function (e) {
					e.preventDefault();
					self.showDashboard(next);
				}).on('click', 'nav .designs', function (e) {
					e.preventDefault();
					self.showThings(next);
				}).on('click', 'nav .collections', function (e) {
					e.preventDefault();
					self.showCollections(next);
				}).on('click', 'nav .likes', function (e) {
					e.preventDefault();
					self.showLikes(next);
				}).on('click', '.logout', function (e) {
					e.preventDefault();
					chrome.storage.sync.clear(function () {
						self.checkLogin(function () {
							page.showError('You have been logged out', true);
							if (typeof next === 'function') { next(); }
						});
					});
				})
			},

			/* helper functions for retrieving each portion of our data */
			getDashboard: function(next, force) {
				dashboard = [];
				if (typeof next === 'function') { next(); }
			},

			getUser: function(next, force) {
				if (user == null || force === true) {
					get('/users/me/', function (data) {
						user = data;

						if (typeof next === 'function') { next(); }
					});
				} else {
					if (typeof next === 'function') { next(); }
				}
			},

			getLikes: function(next, force) {
				if (likes == null || force === true) {
					get('/users/me/likes', function (data) {
						likes = data;

						if (typeof next === 'function') { next(); }
					});
				} else {
					if (typeof next === 'function') { next(); }
				}
			},

			getCollections: function(next, force) {
				if (collections == null || force === true) {
					get('/users/me/collections', function (data) {
						collections = data;

						if (typeof next === 'function') { next(); }
					});
				} else {
					if (typeof next === 'function') { next(); }
				}
			},

			getThings: function(next, force) {
				if (things == null || force === true) {
					get('/users/me/things', function (data) {
						things = data;

						if (typeof next === 'function') { next(); }
					});
				} else {
					if (typeof next === 'function') { next(); }
				}
			},

			getMade: function(next, force) {
				if (mades == null || force === true) {
					get('/users/me/copies', function (data) {
						mades = data;

						if (typeof next === 'function') { next(); }
					});
				} else {
					if (typeof next === 'function') { next(); }
				}
			},

			/* helper functions for showing each page */
			showLogin: function(next) {
				page.replaceWithTemplate('login');
				if (typeof next === 'function') { next(); }
			},

			showUser: function(next) {
				self.getUser(function () {
					page.replaceWithTemplate('profile', user, {variable: 'user'}, next);
				});
			},

			showLikes: function(next) {
				self.getLikes(function () {
					console.log('Likes', things);
					page.replaceWithTemplate('things', {'things': likes}, next);
				});
			},

			showThings: function(next) {
				self.getThings(function () {
					console.log('THINGS', things);
					page.replaceWithTemplate('things', {'things': things}, next);
				});
			},

			showMade: function(next) {
				self.getMade(function () {
					console.log('MADES', things);
					page.replaceWithTemplate('things', {'things': mades}, next);
				});
			},

			showCollections: function(next) {
				self.getCollections(function () {
					console.log('Collections', collections);
					page.replaceWithTemplate('collections', {'collections': collections}, next);
				});
			},

			showDashboard: function(next) {
				self.getCollections(function () {
					console.log('DASHBOARD', collections);
					page.replaceWithTemplate('dashboard', {'dashboard': dashboard}, next);
				});
			}
		};

		return Thingiverse;
	}());

	return new Thingiverse();
});
