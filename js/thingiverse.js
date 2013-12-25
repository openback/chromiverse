define(['config', 'page', 'underscore', 'underscore_template_helpers'], function(config, page, _) {
	"use strict";

	var Thingiverse = (function () {
		var self;
		var registered_events = false;
		var access_token   = null;
		var content        = null;
		var EVENT_TYPES = {
			"1":  "view",
			"2":  "download",
			"3":  "comment",
			"4":  "publish",
			"5":  "make",
			"6":  "like",
			"7":  "unlike",
			"8":  "collect",
			"9":  "derive",
			"10": "feature",
			"11": "follow",
			"12": "unfollow",
			"13": "update",       // Deprecated
			"14": "authorize",
			"15": "unauthorize",
			"16": "uncollect",
			"17": "uncomment",
			"18": "unmake",
			"19": "underive",
			"20": "unfeature"
		};

		var EVENT_TARGET_TYPES = {
			"1": "user",
			"2": "thing",
			"3": "collection",
			"4": "app",
			"5": "make",
			"6": "category",
			"7": "tag"
		};

		var KNOWN_EVENT_TYPES = [
			'publish',
			'make',
			'feature'
		];

		/**
		 * Make an ajax call to an API endpoint or URL
		 * @param string method Normally 'GET' or 'POST'
		 * @param path string Endpoint path, including leading slash if for API
		 * @param payload Optional object Data to be sent
		 * @param next function Callback
		 */
		var ajax = function(method, path, payload, next) {
			var req = new XMLHttpRequest();
			var url;

			if (typeof payload === 'function') {
				next = payload;
				payload = null;
			}

			if (path.charAt(0) === '/') {
				if (!access_token) {
					if (typeof next === 'function') {
						return next('Not authorized');
					}

					return;
				}

				url = config.api_host.concat(path, '?access_token=', access_token);
			} else {
				url = path;
			}

			req.onreadystatechange = function () {
				var err = null;
				var response = null;

				if (typeof next !== 'function') {
					return;
				}

				if (req.readyState === 4) {
					try {
						response = JSON.parse(req.response);
					} catch (e) {
						response = req.response;
					}

					if (req.status !== 200) {
						err = response;
						response = null;
					}

					next(err, response);
				}
			};

			if (payload) {
				payload = (payload.constructor === FormData) ? payload : JSON.stringify(payload);
			}

			req.open(method, url, true);
			req.send(payload);
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
				self.defaultView = self.showDashboard;
				content = document.getElementById('content');

				// Set up some underscore template helpers
				_.addTemplateHelpers({
					drawEvent: function(event_data) {
						var event_name = self.getEventName(event_data.type);
						var template = (KNOWN_EVENT_TYPES.indexOf(event_name) === -1) ?
							page.getCompiledTemplate('event-unknown') :
							page.getCompiledTemplate('event-' + event_name);
						return template(event_data);
					},
					
					getImageSize: function(image_type, image_size, sizes) {
						var large_url = null;

						for (var i = 0; i < sizes.length; i++) {
							if (sizes[i].type === image_type && sizes[i].size === image_size) {
								return sizes[i].url;
							}

							// In case we don't find it, return the first large URL.
							if (sizes[i].size === 'large' && ! large_url) {
								large_url = sizes[i].url;
							}
						}

						return large_url;
					},

					formatTime: function(time_string, short_words) {
						var t = new Date(time_string);
            var datediff = (Date.now() - t)/1000;
						var mins =   Math.floor(datediff / (60));
						var hours = Math.floor(datediff / (60 * 60));
						var days =  Math.floor(datediff / (60 * 60 * 24));

						if (datediff < 60) { // seconds
							if (datediff <= 10) {
								return 'just now';
							}

							return datediff + ' ' + this.pluralize((short_words ? 'sec':'second'), datediff) + ' ago';
						} else if (mins < 60) {
							return mins + ' ' + this.pluralize((short_words ? 'min':'minute'), mins) +' ago';
						} else if (hours < 24) {
							return hours + ' ' + this.pluralize((short_words ? 'hr':'hour'), hours) +' ago';
						} else if (days < 7) {
							return days + ' ' + this.pluralize('day', days) + ' ago';
						}

						return t.toDateString().slice(4);
					}
				} );

				self.registerEvents();
			},

			/**
			 * Check if we already have a saved access_token and show the default view if so
			 */
			checkLogin: function(next) {
				chrome.storage.sync.get('access_token', function (items) {
					if (chrome.runtime.lastError || !items || !items.access_token) {
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
				var data = new FormData();
				data.append('grant_type','password');
				data.append('client_id', config.client_id);
				data.append('client_secret', config.client_secret);
				data.append('username', username);
				data.append('password', password);

				ajax('post', config.login_url, data, function (err, response) {
					if (err) {
						page.showError('There was a problem logging in');
						page.hideLoading();
						return;
					}

					access_token = response.access_token;
					chrome.storage.sync.set({'access_token': access_token}, function () {
						if (chrome.runtime.lastError) {
							page.showError(chrome.runtime.lastError.message);
							page.hideLoading();
						} else {
							self.defaultView();
						}
					});
				});
			},

			/**
			 * Sets our event handlers
			 */
			registerEvents: function() {
				if (!registered_events) {
					content.addEventListener('click', self.content_click_listener);
					content.addEventListener('submit', self.sign_in_submit_listener);
					registered_events = true;
				}
			},

			/**
			 * Removes all our event handlers. Use this before reinstantiating
			 */
			unregisterEvents: function() {
				content.removeEventListener('click', self.content_click_listener);
				content.removeEventListener('submit', self.sign_in_submit_listener);
				registered_events = false;
			},

			content_click_listener: function (e) {
				switch (e.target.tagName) {
					case 'A':
						if (e.target.className === 'logout') {
							e.preventDefault();

							self.logout();
						} else if (page.hasParent(e.target, 'nav')) {
							var class_name = e.target.className;

							e.preventDefault();

							if (class_name.indexOf('active') === -1) {
								self['show' + class_name.charAt(0).toUpperCase() + class_name.slice(1)]();
							}
						}
						break;
				}
			},

			logout: function () {
				access_token = null;

				chrome.storage.sync.clear(function () {
					self.checkLogin(function (next) {
						page.showError('You have been logged out', true);
						if (typeof next === 'function') { next(); }
					});
				});
			},

			sign_in_submit_listener: function (e) {
				if (e.target.id === 'sign-in') {
					var username = document.getElementById('username').value.trim();
					var password = document.getElementById('password').value.trim();

					e.preventDefault();

					if (!username) {
						page.showError('Please enter a username');
					} else if (!password) {
						page.showError('Please enter a password');
					} else {
						page.hideError();
						page.showLoading();
						self.login(username, password);
					}
				}
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
						ajax('get', path, function (err, data) {
							if (err) {
								if (typeof next === 'function') {
									next(err);
								}

								return;
							}

							if (typeof massager === 'function') {
								storage = massager(data);
							} else {
								storage = data;
							}

							if (typeof next === 'function') { next(null, storage); }
						});
					} else {
						if (typeof next === 'function') { next(null, storage); }
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
					get_function(function (err, got_data) {
						if (err) {
							if (err.error === 'Unauthorized' && access_token) {
								// We probably have a bad token, so force a 'logout'
								self.logout();
							}

							console.log('Error needs to be handled', err);
							return;
						}

						data[template_id] = got_data;
						page.replaceWithTemplate(template_id, data, next);
					});
				};
			},

			showLogin: function(next) {
				page.replaceWithTemplate('login', null, next);
			},

			getTargetName: function(type) {
				return EVENT_TARGET_TYPES[type];
			},

			getEventName: function(type) {
				return EVENT_TYPES[type];
			}
		};

		return Thingiverse;
	}());

	return new Thingiverse();
});
