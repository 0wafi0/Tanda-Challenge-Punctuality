/*

Tanda Coding Challenge Front End
Author: Wafi Hossain

*/

// Global storage for roster data from
// server
const dataRosterViewingPage = {
	rosters: [],
	shifts: [],
	dates: []
}

// set up the date picker 
$('input[name="daterange"]').daterangepicker({
	
	// set up selectable date ranges
	ranges: {
		'This Pay Period': [moment().subtract(moment().day(), 'days'), moment()],
		'Last Pay Period': [moment().subtract(moment().day()+6, 'days'), moment().subtract(moment().day(), 'days')],
		'This Month': [moment().startOf('month'), moment().endOf('month')],
		'Last Month': [moment().subtract(1, 'month').startOf('month'), moment().subtract(1, 'month').endOf('month')]
	},
	
	// format the dates displayed
	locale: {
      format: 'DD/MM/YYYY'
    },
	"alwaysShowCalendars": true,
	"startDate": moment('2013-07-31'),	// default start date
	"endDate": moment('2014-06-25'), 	// default end date
	"maxDate": moment(),
	"opens": "left"
}, function(start, end, label) {
	
	// delete all the entries rendered on the page
	deleteAllEntries();
	
	// delete all the data stored
	purgeData(); 
	
	// get new data based on the new selected dates in the date picker
	GetDataCB(start.format('YYYY-MM-DD'), end.format('YYYY-MM-DD'));
	
});


// obtain data from server and store it
const GetDataCB = (start, end, label) => {
	
	// create necessary URLs
	const rostersURL = start === end ? 'http://localhost:4567/roster/' + start : 'http://localhost:4567/rosters/' + start + '/' + end;
	const shiftsURL = start === end ? 'http://localhost:4567/shift/' + start : 'http://localhost:4567/shifts/' + start + '/' + end;
	
	Promise.all([
		fetch(rostersURL)
		.then((rostersFromServer) => rostersFromServer.json()),
		fetch(shiftsURL)
		.then((shiftsFromServer) => shiftsFromServer.json())
	]).then(([rostersFromServer, shiftsFromServer]) => {
		
		// store the data received from server
		dataRosterViewingPage.rosters = rostersFromServer;
		dataRosterViewingPage.shifts = shiftsFromServer;
		
		// extract all the dates and eliminate duplicates
		dataRosterViewingPage.rosters.forEach((item) => dataRosterViewingPage.dates.push(item.date));
		dataRosterViewingPage.shifts.forEach((item) => dataRosterViewingPage.dates.push(item.date));
		dataRosterViewingPage.dates = dataRosterViewingPage.dates.filter((item, pos) => dataRosterViewingPage.dates.indexOf(item) === pos);
		
		//sort and render
		sortDatesMostRecent();
		RenderData();
	}).catch((err) => console.log(err));
}

// helper function to sort dates from the most recent to earliest
const sortDatesMostRecent = () => {
	dataRosterViewingPage.dates.sort((prev, next) => {
		return moment(next).diff(moment(prev));
	})
}

// helper function to sort dates from the earliest to most recent
const sortDatesEarliest = () => {
	dataRosterViewingPage.dates.sort((prev, next) => {
		return moment(prev).diff(moment(next));
	})
}


// event listener for sorting dates
document.getElementById('date-sort').addEventListener('click', () => {
	
	// sort based on current order
	if(document.getElementById('date-sort').classList.contains('down')) {
		sortDatesEarliest();
		document.getElementById('date-sort').classList.remove('down');
		document.getElementById('date-sort').classList.add('up');
	} else {
		sortDatesMostRecent();
		document.getElementById('date-sort').classList.remove('up');
		document.getElementById('date-sort').classList.add('down');
	}
	
	// delete current entries and re-render
	deleteAllEntries();
	RenderData();
});

// helper function to delet all entries in the html
const deleteAllEntries = () => {
	const table = document.getElementById('entries');
	table.innerHTML = ''; // due to pagination purge it completely
}

// helper function to clear stored data
const purgeData = () => {
	dataRosterViewingPage.dates.splice(0, dataRosterViewingPage.dates.length);
	dataRosterViewingPage.rosters.splice(0, dataRosterViewingPage.rosters.length);
	dataRosterViewingPage.shifts.splice(0, dataRosterViewingPage.shifts.length);
}


// Main function used to render the page
const RenderData = () => {
	
	// variables to store and keep track of
	// stats for late and early clock ins
	let late = 0;
	let early = 0;
	
	// iterate through each date previously stored
	dataRosterViewingPage.dates.forEach((date) => {
		
		//store respective roster entries and actual clockins for the date
		const rosterEntry = dataRosterViewingPage.rosters.find(eachRosterEntry => eachRosterEntry.date === date);
		const shiftEntry = dataRosterViewingPage.shifts.find(eachShiftsEntry => eachShiftsEntry.date === date);
		
		// create a row in the table
		const table = document.getElementById("entries");
		const row = table.insertRow(table.rows.length);
		row.classList.add('entry')
		const day = row.insertCell(row.length);
		const rosteredStart = row.insertCell(row.length);
		const actualStart = row.insertCell(row.length);
		const rosteredFinish = row.insertCell(row.length);
		const actualFinish = row.insertCell(row.length);
		
		// render the date
		day.innerHTML = moment(date).format('DD MMM YYYY');
		
		// store various conditionals
		const rosterUndefined = typeof(rosterEntry) === 'undefined';
		const shiftUndefined = typeof(shiftEntry) === 'undefined';
		const calculateDiff = typeof(shiftEntry) !== 'undefined' && typeof(rosterEntry) !== 'undefined';
		
		// if roster entries are missing for a given date
		if(rosterUndefined) {
			rosteredStart.innerHTML = 'Not Rostered'
			rosteredFinish.innerHTML = 'Not Rostered'
		} else {
			rosteredStart.innerHTML = moment(rosterEntry.start).format('HH:mm');
			rosteredFinish.innerHTML = moment(rosterEntry.finish).format('HH:mm');
		}
		
		// if clock in entries are missing for a given date
		if(shiftUndefined) {
			actualStart.innerHTML = 'No Log'; 
			actualFinish.innerHTML = 'No Log';
		} else {
			
			// if both roster entries and clockin entries are present for a given date
			if(calculateDiff) {		
				
				// if clock in is later than the rostered start time
				if(moment(rosterEntry.start).isBefore(moment(shiftEntry.start))){
					
					// calculate difference
					const diffStart = moment(moment(shiftEntry.start).diff(moment(rosterEntry.start))).format('m [min]');
					
					// create tooltip pop-up
					const tooltipStart = document.createElement('span');
					tooltipStart.classList.add('tooltip');
					tooltipStart.innerHTML = diffStart + ' <span>' + moment(shiftEntry.start).format('HH:mm') + '</span>';
					
					// render entry and the tooltip
					actualStart.innerHTML = 'late ';
					actualStart.appendChild(tooltipStart);
					
					late++; // keep track of late shift
				} else {
					actualStart.innerHTML = 'on time'; // else render on time
				}
				
				// if clocked out earlier than the rostered finish time
				if(moment(shiftEntry.finish).isBefore(moment(rosterEntry.finish))){
					
					// same procedure as above, calculate difference
					const diffFinish = moment(moment(rosterEntry.finish).diff(moment(shiftEntry.finish))).format('m [min]');
					
					// create tooltip pop-up
					const tooltipFinish = document.createElement('span');
					tooltipFinish.classList.add('tooltip');
					tooltipFinish.innerHTML = diffFinish + ' <span>' + moment(shiftEntry.finish).format('HH:mm') + '</span>';
					
					// render entry and tooltip
					actualFinish.innerHTML = 'left early ';
					actualFinish.appendChild(tooltipFinish);
					
					early++; // keep track
				} else {
					actualFinish.innerHTML = 'on time'; // else render on time
				}			
			} else {
				
				// rostered time is missing but clockins are there just render the actual time
				actualStart.innerHTML = moment(shiftEntry.start).format('HH:mm')
				actualFinish.innerHTML = moment(shiftEntry.finish).format('HH:mm')
			}
		}	
	});
	
	// set up the pagination since this function can be called as an async CB
	paginator({
		table: document.getElementsByTagName('table')[0],
		box: document.getElementById("table-footer"),
		active_class: "color_page",
		rows_per_page: 25,
		page_options: [
			{ value: 25, text: '25'},
			{ value: 50, text: '50'},
			{ value: 100, text: '100'},
			{ value: 0, text: 'All'}
		]
	});
	
	// calculate percentage of punctuality
	const percentage = Math.round(100 * ((dataRosterViewingPage.dates.length - (late + early))/dataRosterViewingPage.dates.length));
	
	// create the circle percentage element
	const circlePercentageElement = document.getElementById('circle-percentage');
	const circlePercentageClasses = circlePercentageElement.classList;
	const percentageElementSpan = circlePercentageElement.getElementsByTagName('span');
	percentageElementSpan[0].innerHTML = percentage + '%';
	circlePercentageClasses.remove(circlePercentageClasses.item(circlePercentageClasses.length));	
	circlePercentageClasses.add('p' + percentage);
	
	//write summary stats
	document.getElementsByClassName('summary')[0].innerHTML = 'The Slave Pikachu is punctual ' + percentage + '% of the time.';
	document.getElementsByClassName('card')[0].innerHTML = 'Punctual: ' + (dataRosterViewingPage.dates.length - (late + early));
	document.getElementsByClassName('card')[1].innerHTML = 'Arrived Late: ' + late;
	document.getElementsByClassName('card')[2].innerHTML = 'Left Early: ' + early;
}

// Initial call to obtain data and render the page with the default values set in the date picker
GetDataCB($('input[name="daterange"]').data('daterangepicker').startDate.format('YYYY-MM-DD'), $('input[name="daterange"]').data('daterangepicker').endDate.format('YYYY-MM-DD'));
