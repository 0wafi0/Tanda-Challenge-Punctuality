const dataRosterViewingPage = {
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
	"startDate": moment('2013-07-31'),
	"endDate": moment('2014-06-25'),
	"maxDate": moment(),
	"opens": "left"
}, function(start, end, label) {
  		//DO STUFF
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
		dataRosterViewingPage.rosters = rostersFromServer;
		dataRosterViewingPage.shifts = shiftsFromServer;
		dataRosterViewingPage.rosters.forEach((item) => dataRosterViewingPage.dates.push(item.date));
		dataRosterViewingPage.shifts.forEach((item) => dataRosterViewingPage.dates.push(item.date));
		dataRosterViewingPage.dates = dataRosterViewingPage.dates.filter((item, pos) => dataRosterViewingPage.dates.indexOf(item) === pos);
		sortDatesMostRecent();
		console.log(dataRosterViewingPage.dates);
		RenderData();
	}).catch((err) => console.log(err));
}

const sortDatesMostRecent = () => {
	dataRosterViewingPage.dates.sort((prev, next) => {
		return moment(next).diff(moment(prev));
	})
}

const sortDatesEarliest = () => {
	dataRosterViewingPage.dates.sort((prev, next) => {
		return moment(prev).diff(moment(next));
	})
}

document.getElementById('date-sort').addEventListener('click', () => {
	if(document.getElementById('date-sort').classList.contains('down')) {
		sortDatesEarliest();
		document.getElementById('date-sort').classList.remove('down');
		document.getElementById('date-sort').classList.add('up');
	} else {
		sortDatesMostRecent();
		document.getElementById('date-sort').classList.remove('up');
		document.getElementById('date-sort').classList.add('down');
	}
	deleteAllEntries();
	RenderData();
});

const deleteAllEntries = () => {
	const table = document.getElementById('entries');
	table.innerHTML = ''; // due to pagination purge it completely
}

const RenderData = () => {
	

	let late = 0;
	let early = 0;
	
	dataRosterViewingPage.dates.forEach((date) => {
		const rosterEntry = dataRosterViewingPage.rosters.find(eachRosterEntry => eachRosterEntry.date === date);
		const shiftEntry = dataRosterViewingPage.shifts.find(eachShiftsEntry => eachShiftsEntry.date === date);
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
					
					late++;
				} else {
					actualStart.innerHTML = 'on time';
				}
				
				if(moment(shiftEntry.finish).isBefore(moment(rosterEntry.finish))){
					const diffFinish = moment(moment(rosterEntry.finish).diff(moment(shiftEntry.finish))).format('m [min]');
					const tooltipFinish = document.createElement('span');
					tooltipFinish.classList.add('tooltip');
					tooltipFinish.innerHTML = diffFinish + ' <span>' + moment(shiftEntry.finish).format('HH:mm') + '</span>';
					
					actualFinish.innerHTML = 'left early ';
					actualFinish.appendChild(tooltipFinish);
					
					early++;
				} else {
					actualFinish.innerHTML = 'on time';
				}			
			} else {
				actualStart.innerHTML = moment(shiftEntry.start).format('HH:mm')
				actualFinish.innerHTML = moment(shiftEntry.finish).format('HH:mm')
			}
		}	
	});
	paginator({
		table: document.getElementsByTagName('table')[0],
		box: document.getElementById("table-footer"),
		active_class: "color_page"
	});
	
	const percentage = Math.round(100 * ((dataRosterViewingPage.dates.length - (late + early))/dataRosterViewingPage.dates.length));
	const circlePercentageElement = document.getElementById('circle-percentage');
	const circlePercentageClasses = circlePercentageElement.classList;
	const percentageElementSpan = circlePercentageElement.getElementsByTagName('span');
	percentageElementSpan[0].innerHTML = percentage + '%';
	circlePercentageClasses.remove(circlePercentageClasses.item(circlePercentageClasses.length));
	
	circlePercentageClasses.add('p' + percentage);
	
	document.getElementsByClassName('summary')[0].innerHTML = 'The Slave Pikachu has been punctual ' + percentage + '% of the time';
	
	document.getElementsByClassName('card')[0].innerHTML = 'on time: ' + (dataRosterViewingPage.dates.length - (late + early));
	
	document.getElementsByClassName('card')[1].innerHTML = 'late: ' + late;
	
	document.getElementsByClassName('card')[2].innerHTML = 'left early: ' + early;
	
}

GetDataCB('2013-07-31', '2014-06-25');
