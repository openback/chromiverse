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
		underscore: 'underscore-min',
		underscore_template_helpers: 'underscore-template-helpers/underscore.template-helpers',
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
		}
	});

	thingiverse.checkLogin();
});
