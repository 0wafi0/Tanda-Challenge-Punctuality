const data = {
	rosters: [],
	shifts: [],
	dates: []
}

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

	const rostersURL = start === end ? 'http://localhost:4567/roster/' + start : 'http://localhost:4567/rosters/' + start + '/' + end;
	const shiftsURL = start === end ? 'http://localhost:4567/shift/' + start : 'http://localhost:4567/shifts/' + start + '/' + end;
	
	Promise.all([
		fetch(rostersURL)
		.then((rostersFromServer) => rostersFromServer.json()),
		fetch(shiftsURL)
		.then((shiftsFromServer) => shiftsFromServer.json())
	]).then(([rostersFromServer, shiftsFromServer]) => {
		data.rosters = rostersFromServer;
		data.shifts = shiftsFromServer;
		data.rosters.forEach((item) => data.dates.push(item.date));
		data.shifts.forEach((item) => data.dates.push(item.date));
		data.dates = data.dates.filter((item, pos) => data.dates.indexOf(item) === pos);
		console.log(data);
		ArrangeData();
	}).catch((err) => console.log(err));
}

GetDataCB('2013-07-31', '2014-06-25');

const ArrangeData = () => {
	data.dates.forEach((date) => {
		const rosterEntry = data.rosters.find(eachRosterEntry => eachRosterEntry.date === date);
		const shiftEntry = data.shifts.find(eachShiftsEntry => eachShiftsEntry.date === date);
		const table = document.getElementById("entries");
		const row = table.insertRow(table.rows.length);
		row.classList.add('entry')
		const day = row.insertCell(row.length);
		const rosteredStart = row.insertCell(row.length);
		const actualStart = row.insertCell(row.length);
		const rosteredFinish = row.insertCell(row.length);
		const actualFinish = row.insertCell(row.length);
		
		day.innerHTML = moment(date).format('DD MMM YYYY');
		
		const rosterUndefined = typeof(rosterEntry) === 'undefined';
		const shiftUndefined = typeof(shiftEntry) === 'undefined';
		const calculateDiff = typeof(shiftEntry) !== 'undefined' && typeof(rosterEntry) !== 'undefined';
		
		if(rosterUndefined) {
			rosteredStart.innerHTML = 'Not Rostered'
			rosteredFinish.innerHTML = 'Not Rostered'
		} else {
			rosteredStart.innerHTML = moment(rosterEntry.start).format('HH:mm');
			rosteredFinish.innerHTML = moment(rosterEntry.finish).format('HH:mm');
		}
		
		if(shiftUndefined) {
			actualStart.innerHTML = 'No Log'; 
			actualFinish.innerHTML = 'No Log';
		} else {
			if(calculateDiff) {
				
				if(moment(rosterEntry.start).isBefore(moment(shiftEntry.start))){
					const diffStart = moment(moment(shiftEntry.start).diff(moment(rosterEntry.start))).format('m [min]');
					const tooltipStart = document.createElement('span');
					tooltipStart.classList.add('tooltip');
					tooltipStart.innerHTML = diffStart + ' <span>' + moment(shiftEntry.start).format('HH:mm') + '</span>';
					
					actualStart.innerHTML = 'late ';
					actualStart.appendChild(tooltipStart);
				} else {
					actualStart.innerHTML = 'on time';
				}
				
				if(moment(shiftEntry.finish).isBefore(moment(rosterEntry.finish))){
					const diffFinish = moment(moment(rosterEntry.finish).diff(moment(shiftEntry.finish))).format('m [min]');
					console.log(diffFinish);
					const tooltipFinish = document.createElement('span');
					tooltipFinish.classList.add('tooltip');
					tooltipFinish.innerHTML = diffFinish + ' <span>' + moment(shiftEntry.finish).format('HH:mm') + '</span>';
					
					actualFinish.innerHTML = 'left early ';
					actualFinish.appendChild(tooltipFinish);
				} else {
					actualFinish.innerHTML = 'on time';
				}
				
				
			} else {
				actualStart.innerHTML = moment(shiftEntry.start).format('HH:mm')
				actualFinish.innerHTML = moment(shiftEntry.finish).format('HH:mm')
			}
		}	
	});
}