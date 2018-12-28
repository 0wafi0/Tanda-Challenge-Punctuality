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


const GetDataCB = (start, end, label) => {
	if(start === end) {
		Promise.all([
			fetch('http://localhost:4567/roster/' + start)
			.then((roster) => roster.json()),
			fetch('http://localhost:4567/shift/' + start)
			.then((shift) => shift.json())
		]).then(([roster, shift]) => {
			ArrangeData(roster, shift);
		}).catch((err) => console.log(err));
	} else {
		Promise.all([
			fetch('http://localhost:4567/rosters/' + start + '/' + end)
			.then((rosters) => rosters.json()),
			fetch('http://localhost:4567/shifts/' + start + '/' + end)
			.then((shifts) => shifts.json())
		]).then(([rosters, shifts]) => {
			console.log(rosters);
			console.log(shifts);
			ArrangeData(rosters, shifts);
		}).catch((err) => console.log(err));
	}
}

GetDataCB('2014-03-27', '2014-06-20');

const ArrangeData = (rosters, shifts) => {
	console.log(rosters);
	console.log(shifts);
	let dates = [];
	rosters.forEach((item) => dates.push(item.date));
	shifts.forEach((item) => dates.push(item.date));
	dates = dates.filter((item, pos) => dates.indexOf(item) === pos);
	console.log(dates);
	dates.forEach((date) => {
		const roster = rosters.find(eachRosterEntry => eachRosterEntry.date === date);
		const shift = shifts.find(eachShiftsEntry => eachShiftsEntry.date === date);
	})
}