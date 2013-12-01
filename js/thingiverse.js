define(['jquery', 'config', 'page'], function($, config, page) {
	var Thingiverse = (function () {
		"use strict";
		var self;
		var registered_nav = false;
		var access_token   = null;
		var $content       = null;
		var user           = null;

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
				self.getDashboard   = self.makeGetter('/events');
				self.getFeatured    = self.makeGetter('/featured/');
				self.getUser        = self.makeGetter('/users/me/');
				self.getCollections = self.makeGetter('/users/me/collections');
				self.getMade        = self.makeGetter('/users/me/copies');
				self.getLikes       = self.makeGetter('/users/me/likes');
				self.getThings      = self.makeGetter('/users/me/things');
				self.getNewest      = self.makeGetter('/newest/');
				self.getPopular     = self.makeGetter('/popular/');

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
			},

			/**
			 * Gets and displays the user's profile
			 */
			defaultView: function (next) {
				self.showUser(function () { self.registerNav(next); });
			},

			/**
			 * Check if we already have a saved access_token and show the default view if so
			 */
			checkLogin: function(next) {
				chrome.storage.sync.get('access_token', function (items) {
					if (items.access_token) {
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

			/**
			 * Sets the event handlers for our nav
			 * @param next function Callback
			 */
			registerNav: function(next) {
				if (!registered_nav) {
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
					}).on('click', 'nav .featured', function (e) {
						e.preventDefault();
						self.showFeatured(next);
					}).on('click', 'nav .newest', function (e) {
						e.preventDefault();
						self.showNewest(next);
					}).on('click', 'nav .popular', function (e) {
						e.preventDefault();
						self.showPopular(next);
					}).on('click', '.logout', function (e) {
						e.preventDefault();
						chrome.storage.sync.clear(function () {
							self.checkLogin(function () {
								page.showError('You have been logged out', true);
								if (typeof next === 'function') { next(); }
							});
						});
					})

					registered_nav = true;
				}
			},

			/* helper functions for retrieving each portion of our data */
			getUser: function(next, force) {
				if (user == null || force === true) {
					get('/users/me/', function (data) {
						user = data;

						// Make images easier to get at
						_.each(user.cover_image.sizes, function(image) {
							user[image.type + '_' + image.size] = image.url;
						});

						if (typeof next === 'function') { next(); }
					});
				} else {
					if (typeof next === 'function') { next(); }
				}
			},

			/**
			 * Creates a method which will perform a get from the specified path
			 * @param path String API path
			 * @return function
			 */
			makeGetter: function (path) {
				// Cache for the API call
				var storage = null;

				return function (next, force) {
					if (storage == null || force === true) {
						get(path, function (data) {
							storage = data;

							if (typeof next === 'function') { next(storage); }
						});
					} else {
						if (typeof next === 'function') { next(storage); }
					}
				}
			},

			/* helper functions for showing each page */
			showLogin: function(next) {
				page.replaceWithTemplate('login', null, next);
			},

			showUser: function(next) {
				self.getUser(function (user) {
					page.replaceWithTemplate('profile', {'user':user, 'nav':'profile'}, next);
				});
			},

			showLikes: function(next) {
				self.getLikes(function (likes) {
					page.replaceWithTemplate('things', {'things': likes, 'nav': 'likes'}, next);
				});
			},

			showThings: function(next) {
				self.getThings(function (things) {
					page.replaceWithTemplate('things', {'things': things, 'nav':'designs'}, next);
				});
			},

			showMade: function(next) {
				self.getMade(function (things) {
					page.replaceWithTemplate('things', {'things': things, 'nav':'mades'}, next);
				});
			},

			showCollections: function(next) {
				self.getCollections(function (collections) {
					page.replaceWithTemplate('collections', {'collections': collections, 'nav':'collections'}, next);
				});
			},

			showDashboard: function(next) {
				self.getDashboard(function (dashboard) {
					page.replaceWithTemplate('dashboard', {'dashboard': dashboard, 'nav': 'dashboard'}, next);
				});
			},

			showFeatured: function(next) {
				self.getFeatured(function (things) {
					page.replaceWithTemplate('things', {'things': things, 'nav': 'featured', 'header': 'Featured'}, next);
				});
			},

			showNewest: function(next) {
				self.getNewest(function (things) {
					page.replaceWithTemplate('things', {'things': things, 'nav': 'newest', 'header': 'Newest'}, next);
				});
			},

			showPopular: function(next) {
				self.getPopular(function (things) {
					page.replaceWithTemplate('things', {'things': things, 'nav': 'popular', 'header': 'Popular'}, next);
				});
			}
		};

		return Thingiverse;
	}());

	return new Thingiverse();
});
