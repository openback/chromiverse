define(['jquery', 'underscore', 'config'], function ($, _, config) {
	"use strict";

	var Page = (function () {
		var self;
		var $error;
		var errorTimeout;
		var $loading_screen;
		var $content;
		var templates = [];

		var Page = function () {
			this.initialize();
		};

		Page.prototype = {
			constructor: Page,
			initialize: function () {
				self = this;

				$(document).ready(function () {
					$content = $('#content');
					$error = $('p.error');
					$loading_screen = $('#loading-screen');
				});
			},

			showLoading: function() {
				$loading_screen.addClass('show');
			},

			hideLoading: function() {
				$loading_screen.removeClass('show');
			},

			showError: function (message, hide_timeout) {
				if (errorTimeout) {
					clearTimeout(errorTimeout);
				}

				$error.stop().html(message).slideDown('fast');

				if (hide_timeout) {
					errorTimeout = setTimeout(function () {
						$error.stop().slideUp('slow');
					}, 4000);
				}
			},

			hideError: function () {
				$error.stop().slideUp('fast');
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
				templates[template_id] = templates[template_id] || _.template($('#' + template_id + '-template').html());

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

				if (data && data.nav) {
					data.nav = self.getNav(data.nav);
				}

				var compiled = self.getCompiledTemplate(template_id);

				$content.html(compiled(data, settings));

				if (typeof next === 'function') { next(); }
			}
		};

		return Page;
	}());

	return new Page();
});
