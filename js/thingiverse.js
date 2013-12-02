define(['jquery', 'config', 'page'], function($, config, page) {
	"use strict";

	var Thingiverse = (function () {
		var self;
		var registered_events = false;
		var access_token   = null;
		var $content       = null;

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
				self.getCollections  = self.makeGetter('/users/me/collections');
				self.getDashboard    = self.makeGetter('/events');
				self.getFeatured     = self.makeGetter('/featured/');
				self.getLikes        = self.makeGetter('/users/me/likes');
				self.getMade         = self.makeGetter('/users/me/copies');
				self.getNewest       = self.makeGetter('/newest/');
				self.getPopular      = self.makeGetter('/popular/');
				self.getThings       = self.makeGetter('/users/me/things');
				self.getUser         = self.makeGetter('/users/me/', function (data) {
					if (data.cover_image !== null) {
						// Make images easier to get at
						_.each(data.cover_image.sizes, function(image) {
							data[image.type + '_' + image.size] = image.url;
						});
					}

					return data;
				});
				self.showCollections = self.makeView('collections', self.getCollections, { 'nav': 'collections'});
				self.showDashboard   = self.makeView('dashboard'  , self.getDashboard,   { 'nav': 'dashboard'});
				self.showFeatured    = self.makeView('things'     , self.getFeatured,    { 'nav': 'featured'});
				self.showLikes       = self.makeView('things'     , self.getLikes,       { 'nav': 'likes'      , 'header': 'Likes'});
				self.showMade        = self.makeView('things'     , self.getMade,        { 'nav': 'made'       , 'header': 'Made'});
				self.showNewest      = self.makeView('things'     , self.getNewest,      { 'nav': 'newest'     , 'header': 'Newest'});
				self.showPopular     = self.makeView('things'     , self.getPopular,     { 'nav': 'popular'    , 'header': 'Popular'});
				self.showThings      = self.makeView('things'     , self.getThings,      { 'nav': 'things'});
				self.showUser        = self.makeView('user'       , self.getUser,        { 'nav': 'user'});

				// Sets the default view to display when logged in
				self.defaultView = self.showUser;

				$(document).ready(function () {
					$content = $('#content');
					self.registerEvents();
				});
			},

			/**
			 * Check if we already have a saved access_token and show the default view if so
			 */
			checkLogin: function(next) {
				chrome.storage.sync.get('access_token', function (items) {
					if (chrome.runtime.lastError || !items.access_token) {
						self.showLogin(next);
						return;
					}

					access_token = items.access_token;
					self.defaultView(next);
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
						chrome.storage.sync.set({'access_token': access_token}, function () {
							if (chrome.runtime.lastError) {
								page.showError(chrome.runtime.lastError.message);
								page.hideLoading();
							} else {
								self.defaultView();
							}
						});
					})
					.fail(function () { 
						page.showError('There was a problem logging in');
						page.hideLoading();
					});
			},

			/**
			 * Sets our event handlers
			 */
			registerEvents: function() {
				if (!registered_events) {
					$content.on('submit.thingiverse', '#sign-in', function (e) {
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
							self.login(username, password);
						}
					}).on('click.thingiverse', 'nav', function (e) {
						e.preventDefault();
						var class_name = e.originalEvent.srcElement.className;

						if (class_name.indexOf('active') === -1) {
							self['show' + class_name.charAt(0).toUpperCase() + class_name.slice(1)]();
						}
					}).on('click.thingiverse', '.logout', function (e) {
						e.preventDefault();
						chrome.storage.sync.clear(function () {
							self.checkLogin(function (next) {
								page.showError('You have been logged out', true);
								if (typeof next === 'function') { next(); }
							});
						});
					});

					registered_events = true;
				}
			},

			/**
			 * Removes all our event handlers. Use this before reinstantiating
			 */
			unregisterEvents: function() {
				$content.off('.thingiverse');
			},

			/**
			 * Creates a method which will perform a get from the specified path
			 * @param path String API path
			 * @param massager function Function that accepts and returns an object. Used to massage the data
			 * @return function
			 */
			makeGetter: function (path, massager) {
				// Cache for the API call
				var storage = null;

				return function (next, force) {
					if (storage === null || force === true) {
						get(path, function (data) {
							if (typeof massager === 'function') {
								storage = massager(data);
							} else {
								storage = data;
							}

							if (typeof next === 'function') { next(storage); }
						});
					} else {
						if (typeof next === 'function') { next(storage); }
					}
				};
			},

			/**
			 * Creates a method which will display a view after getting the specified data
			 * @param String Underscore template id, minus the '-template' suffix
			 * @param get_function function The function to use to retrieve data, which sends it via a callback
			 * @param static_data Object Contains static data so be sent to the template
			 * @return function
			 */
			makeView: function(template_id, get_function, static_data) {
				var data = static_data || {};

				return function (next) {
					get_function(function (got_data) {
						data[template_id] = got_data;
						page.replaceWithTemplate(template_id, data, next);
					});
				};
			},

			showLogin: function(next) {
				page.replaceWithTemplate('login', null, next);
			}
		};

		return Thingiverse;
	}());

	return new Thingiverse();
});
