requirejs.config({
	baseUrl: 'js',
	shim: {
		'underscore': {
			exports: '_'
		},
		'underscore_template_helpers': {
			deps: ['underscore']
		}
	},
	paths: {
		underscore: '/bower_components/underscore-amd/underscore-min',
		underscore_template_helpers: 'underscore-template-helpers/underscore.template-helpers',
		minpubsub: '/bower_components/minpubsub/minpubsub',
		thingiverse: 'thingiverse',
		page: 'page',
		config: 'config'
	}
});

require(['thingiverse', 'underscore', 'underscore_template_helpers'], function (thingiverse, _) {
	"use strict";

	// Add some helpers to underscore
	_.addTemplateHelpers({
		// if and only if
		iff: function(condition, outputString) {
			return condition ? outputString : "";
		},

		pluralize: function(word, count, suffix) {
			suffix = typeof suffix !== 'undefined' ? suffix : 's';

			return (count === 1) ? word : word + suffix;
		},

		formatTimeAgo: function(time_string, short_words) {
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
	});

	thingiverse.checkLogin();
});
