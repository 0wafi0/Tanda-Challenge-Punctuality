

$('input[name="daterange"]').daterangepicker({
	ranges: {
		'This Pay Period': [moment().subtract(moment().day(), 'days'), moment()],
		'Last 30 Days': [moment().subtract(29, 'days'), moment()],
		'This Month': [moment().startOf('month'), moment().endOf('month')],
		'Last Month': [moment().subtract(1, 'month').startOf('month'), moment().subtract(1, 'month').endOf('month')]
	},
	"alwaysShowCalendars": true,
	"startDate": moment().subtract(moment().day(), 'days'),
	"endDate": moment(),
	"maxDate": moment(),
	"showWeekNumbers": true,
	"opens": "left"
}, function(start, end, label) {
  console.log('New date range selected: ' + start.format('YYYY-MM-DD') + ' to ' + end.format('YYYY-MM-DD') + ' (predefined range: ' + "asdasdas" + ')');
});

console.log($('input[name="daterange"]').data('daterangepicker').startDate.format('YYYY-MM-DD'));

fetch('http://localhost:4567/roster/2013-09-15').then(function(response) {
	console.log(response.json());
});