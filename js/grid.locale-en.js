// afGrid English Translation
$.widget("ui.afGrid", {
	defaults: {
		recordsText: "Showing {0} to {1} of {2} entries",
		noRecordsText: "0 entries",
		previousPageText: "Prev",
		nextPageText: "Next"
	},
	errors: {
		errcap: "Error",
		nourl: "No url is set",
		norecords: "No records to process"
	},
	formatter: {
		integer: { thousandsSeparator: ",", defaultValue: '0' },
		number: { decimalSeparator: ".", thousandsSeparator: ",", decimalPlaces: 2, defaultValue: '0.00' },
		currency: { decimalSeparator: ".", thousandsSeparator: ",", decimalPlaces: 2, prefix: "$", suffix: "", defaultValue: '0.00' },
		date: {
		/*	dayNames: [
				"Sun", "Mon", "Tue", "Wed", "Thr", "Fri", "Sat",
				"Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"
			],
			monthNames: [
				"Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
				"January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"
			],
			AmPm: ["am", "pm", "AM", "PM"],
			S: function (j) { return j < 11 || j > 13 ? ['st', 'nd', 'rd', 'th'][Math.min((j - 1) % 10, 3)] : 'th'; }, */
			format: 'dd/MM/yyyy',
		},
		baseLinkUrl: '',
		showAction: '',
		target: '',
		checkbox: { disabled: true },
		idName: 'id'
	},

	_create: function () {
	}
});
