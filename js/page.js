define(['jquery', 'underscore'], function ($, _) {
	var Page = (function () {
		"use strict";
		var self;
		var $error;
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

			showError: function (message) {
				$error.stop().html(message).slideDown('fast');
			},

			hideError: function () {
				$error.stop().slideUp('fast');
			},

			/**
			 * Replaces #content with the result of an underscore template
			 * @param template_id string First part of the template id, minus '-template'
			 * @param data object Data to pass to the compiled template
			 * @param settings object Settings to pass to the compiled template
			 */
			replaceWithTemplate: function(template_id, data, settings) {
				// Store our compiled templates
				var compiled = (templates[template_id]) ? 
					templates[template_id] 
					: templates[template_id] = _.template($('#' + template_id + '-template').html());

				$content.html(compiled(data, settings));
			}
		};

		return Page;
	}());

	return new Page();
});
