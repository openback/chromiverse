define(['underscore', 'minpubsub', 'config'], function (_, MinPubSub, config) {
	"use strict";

	var Page = (function () {
		var self;
		var errorTimeout;
		var error;
		var loading_screen;
		var loading_screen_text;
		// Used to force a short delay before hiding the loading screen to prevent flashing
		var loading_shown_at = 0;
		// Amount of time to force the loading screen to show for
		var LOADING_DISP_MIN_TIME = 250;
		var content;
		var templates = [];

		var Page = function () {
			this.initialize();
		};

		Page.prototype = {
			constructor: Page,
			initialize: function () {
				self = this;
				content = document.getElementById('content');
				error = document.getElementById('error');
				loading_screen = document.getElementById('loading-screen');
				loading_screen_text = document.getElementById('loading-screen-text');

				MinPubSub.subscribe('/thingiverse/load/start', self.showLoading);
				MinPubSub.subscribe('/thingiverse/load/done', self.hideLoading);
			},

			onReady: function(fn) {
				document.addEventListener('DOMContentLoaded', fn, false);
			},

			showLoading: function(message) {
				loading_screen_text.innerHTML = (message) ? message: '';
				self.addClass(loading_screen, 'show');
				loading_shown_at = Date.now();
			},

			hideLoading: function() {
				var t = Date.now();

				if (t - loading_shown_at < LOADING_DISP_MIN_TIME) {
					setTimeout(self.hideLoading, LOADING_DISP_MIN_TIME - (t - loading_shown_at));
				} else {
					self.removeClass(loading_screen, 'show');
				}
			},

			showError: function (message, hide_timeout) {
				if (errorTimeout) {
					clearTimeout(errorTimeout);
				}

				error.innerHTML = message;
				error.style.height = '1.5em';
				error.style.padding = '3px 0 3px 0';
				error.style.marginBottom = '1em';

				if (hide_timeout) {
					errorTimeout = setTimeout(self.hideError, 4000);
				}
			},

			hideError: function () {
				error.style.marginBottom = '0';
				error.style.padding = '0';
				error.style.height = '0';
			},

			/**
			 * Get the nav
			 * @param active String classname of the section to set as 'active'
			 * @return String HTML
			 */
			getNav: function (active) {
				var compiled = self.getCompiledTemplate('nav');

				return compiled({'items': config.nav_items, 'active': active});
			},

			/**
			 * Returns the specified compiled template, compiling it if needed
			 * @param template_id String ID of template element, minus '-template'
			 * @return function Compiled underscore.js template
			 */
			getCompiledTemplate: function(template_id) {
				templates[template_id] = templates[template_id] || _.template(document.getElementById(template_id + '-template').innerHTML);

				return templates[template_id];
			},

			/**
			 * Replaces #content with the result of an underscore template
			 * @param template_id string First part of the template id, minus '-template'
			 * @param data object Data to pass to the compiled template, including nav classname
			 * @param settings object Optional Settings to pass to the compiled template
			 * @param next function optional Callback
			 */
			replaceWithTemplate: function(template_id, data, settings, next) {
				if (typeof settings === 'function') {
					next = settings;
					settings = null;
				}

				// Only generate the nav if it's specified and doesn't contain HTML already
				if (data && data.nav && data.nav.indexOf('<') === -1) {
					data.nav = self.getNav(data.nav);
				}

				var compiled = self.getCompiledTemplate(template_id);

				content.innerHTML = compiled(data, settings);

				if (typeof next === 'function') { next(); }
			},

			/**
			 * Check if the HTMLElement has the specified selector (tag, class, or id) as a parent
			 * @param HTMLElement The child to start at
			 * @param string The single id, class, or tagName to search for
			 * @return HTMLElement|false The found parent or false
			 */
			hasParent: function(el, selector) {
				var prop = null;

				if (selector.charAt(0) === '#') {
					prop = 'id';
					selector = selector.slice(1);
				} else if (selector.charAt(0) === '.') {
					prop = 'className';
					selector = selector.slice(1);
				} else {
					prop = 'tagName';
					selector = selector.toUpperCase();
				}

				while (el.parentElement && el.parentElement.tagName !== 'HTML') {
					el = el.parentElement;

					if (el[prop] === selector) {
						return el;
					}
				}

				return false;
			},

			addClass: function(el, class_name) {
				var classes = el.className.split(' ');
				classes.push(class_name);
				el.className = _.uniq(classes).join(' ').trim();
			},

			removeClass: function(el, class_name) {
				var classes = el.className.split(' ');
				el.className = _.without(classes, class_name).join(' ').trim();
			}
		};

		return Page;
	}());

	return new Page();
});
