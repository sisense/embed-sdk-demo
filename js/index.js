/**
 * Sisense Embed SDK Demo
 * Written by Moti Granovsky, Sisense DevX, 2020
 * ---------------------------------------------
 * 
 * This is the main JS file for the demo. Please consult the `README` and inline comments.
 * The code here is split into 3 sections:
 *  - Anything UI related
 *  - Embed SDK code
 *  - Functions and event handlers
 */

function ready(fn) {
	if (document.readyState != 'loading'){
	  fn();
	} else {
	  document.addEventListener('DOMContentLoaded', fn);
	}
}

ready(function() {

	/***************************************/
	/** Section 1: UI Setup               **/
	/***************************************/

	// Import other js content
	var logger = new Logger(document.querySelectorAll('#logContainer pre code')[0]);
	var config = window['embedsdk.demo.config'];

	// DOM Elements
	var	countryFilterElement	= document.getElementById('countryInput'),
		frameContainerElement	= document.getElementById('frameContainer'),
		fromDateElement 		= document.getElementById('fromDate'),
		toDateElement			= document.getElementById('toDate'),
		saveElement				= document.getElementById('save');

	// Set some defaults
	window.sizingMode = 'set';
	window.editMode = false;
	window.currentDashboard = config.defaultDashOid;
	
	// Render Dashboard Navigation Panel items
	renderNavigation(config.dashboards, document.querySelectorAll('.sidebar ul.nav')[0], function(item) {
		logger.log('Navigating to dashboard ' + item.oid);
		// Navigate to a dashboard
		sisenseFrame.dashboard.open(item.oid, window.editMode).then(function() {
			logger.log('Navigated to new dashboard ' + item.oid);
			currentDashboard = item.oid;
		});
	});

	// Set handlers for various buttons
	document.getElementById('filterButton').addEventListener('click',updateFilters);
	document.getElementById('clearButton').addEventListener('click',clearFilters);
	document.getElementById('exportButton').addEventListener('click',exportPDF);
	document.getElementById('advancedButton').addEventListener('click',toggleFilterPane);
	document.getElementById('sizingButton').addEventListener('click',toggleSizingMode);
	document.getElementById('editButton').addEventListener('click',toggleEditMode);

	/***************************************/
	/** Section 2: Embedding              **/
	/***************************************/

	// Import SDK
	var SisenseFrame = window['sisense.embed'].SisenseFrame,
		enums 		 = window['sisense.embed'].enums;

	// Instantiate SDK
	var sisenseFrame = new SisenseFrame({
		url: config.baseUrl,
		dashboard: currentDashboard
	});
	
	// Render iFrame
	sisenseFrame.render(frameContainerElement).then(function() {

		logger.log('iFrame element rendered');
		
		// Get current user
		sisenseFrame.app.getUser().then(function(user) {
			logger.log('Got current user information: ' + user.username);
		});

		// Get application info
		sisenseFrame.app.getInfo().then(function(info) {
			logger.log("Sisense version is " + info.version);
		});

		// Handle dashboard load event
		sisenseFrame.dashboard.on(enums.DashboardEventType.LOADED, dashboardLoadedHandler);

		// Handle filter change
		sisenseFrame.dashboard.on(enums.DashboardEventType.FILTERS_CHANGED, dashboardFiltersChangedHandler);

		// Handle widget editor load
		sisenseFrame.widget.on(enums.WidgetEventType.LOADED, widgetLoadedHandler);

		// Handle widget editor unload
		sisenseFrame.widget.on(enums.WidgetEventType.UNLOADED, widgetUnloadedHandler);
	});

	/***************************************/
	/** Section 3: Functions and Handlers **/
	/***************************************/

	/**
	 * Renders the left-side navigation items
	 * @param {object[]} dashboards an array of objects (see `config.js`)
	 * @param {DOMElement} container DOM element of the navigation panel's `UL`
	 * @param {Function} handler handler to invoke when an item is clicked
	 */
	function renderNavigation(dashboards, container, handler) {

		// Render Dashboard Navigation Panel items
		dashboards.forEach(function(item) {

			// Ignore hidden dashboards
			if (item.hide) return;

			// Create DOM elements
			var listItemElement = document.createElement('li'), anchorElement = document.createElement('a');

			// Set title & href
			anchorElement.innerText = item.title;
			anchorElement.setAttribute('href', '#');

			// Set classes
			listItemElement.classList.add('nav-item');
			anchorElement.classList.add('nav-link');

			// Wrap A with LI
			listItemElement.appendChild(anchorElement);

			// Set click event handler
			listItemElement.addEventListener('click',function() {
				handler(item);
			});

			// Add to navigation panel
			container.appendChild(listItemElement);

			// Reference to DOM element
			item.el = listItemElement;
		});
	}

	/**
	 * Generates JAQL filters from the filter UI and applies them to the current dashboard
	 */
	function updateFilters() {

		logger.log('Updating dashboard filters');

		// Get values from UI
		var value   = countryFilterElement.value || '',
			from    = fromDateElement.value 	 || null,
			to      = toDateElement.value 	     || null,
			persist = saveElement.checked

		// Create JAQL filters
		var filters = [
			{
				"jaql" : {
					"title": "Country",
					"dim" : config.countryDim,
					"datatype": "text",
					"filter" : {
						"startsWith" : value
					}
				}
			},
			{
				"jaql": {
					"title": "Date",
					"dim": config.dateDim,
					"datatype": "datetime",
					"level": "days",
					"filter": {
						"from": from,
						"to": to
					}
				}
			}
		];

		// Apply filters to the current dashboard
		sisenseFrame.dashboard.applyFilters(filters, persist).then(function() {
			logger.log('Applied filters');
		});
	}

	/**
	 * Removes the date and country filters from the current dashboard - does not affect other filters on it
	 */
	function clearFilters() {

		logger.log('Clearing dashboard filters');

		// Clear values from UI
		countryFilterElement.value = null;
		fromDateElement.value = null;
		toDateElement.value = null;
		var persist = saveElement.checked

		// Create JAQL	 
		var filters = [
			{
				"jaql" : {
					"dim" : config.countryDim
				}
			},
			{
				"jaql": {
					"dim": config.dateDim,
					"level": "days"
				}
			}
		];

		// Remove filters from the current dashboard
		sisenseFrame.dashboard.removeFilters(filters, persist).then(function() {
			logger.log('Removed filters');
		});	
	}
	
	/**
	 * Invokes the `dashboard.export` action in default mode, which is PDF
	 */
	function exportPDF() {

		logger.log('Opening export window');

		// Open Sisense Dashboard Export to PDF window
		sisenseFrame.dashboard.export().then(function() {
			logger.log('Rxport window closed');
		});
	}

	/**
	 * Toggles the Sisense filters panel visibility
	 */
	function toggleFilterPane() {

		// Get current UI settings
		var currentSettings = sisenseFrame.getSettings();

		// Toggle
		currentSettings.showRightPane = !currentSettings.showRightPane;

		// Update to new settings
		sisenseFrame.updateSettings(currentSettings).then(function() {
			logger.log('Updated UI settings');
		});
	}

	/**
	 * Toggles between fixed height and dynamic height for the iFrame
	 */
	function toggleSizingMode() {

		// Toggle current mode
		window.sizingMode = (window.sizingMode == 'set' ? 'fit' : 'set');

		// If new mode is `set` apply a predefined height
		if(window.sizingMode == 'set') {
			frameContainerElement.style['height'] = '600px';
		}
		// If new mode is `fit` get the real dashboard height and adjust accordingly
		else {
			sisenseFrame.getSize().then(function(data) {
				frameContainerElement.style['height'] = data.content.height+'px';
			});
		}
	}

	/**
	 * Toggles dashboard mode between view and edit mode
	 */
	function toggleEditMode() {

		// Toggle current mode
		window.editMode = !window.editMode;

		// Re-open current dashboard in new mode
		sisenseFrame.dashboard.open(currentDashboard, editMode).then(function(dash) {
			logger.log('Reloaded dashboard ' + dash.oid + ' with edit mode: ' + editMode);
		});

	}

	/**
	 * Handle widget loaded event
	 * @param {object} args event arguments containing the widget causing the event
	 */
	function widgetLoadedHandler(args) {

		// Check that we are really in widget mode
		if(args.widget && Object.keys(args.widget).length) {

			var currentSettings = sisenseFrame.getSettings();

			// Toggle
			currentSettings.showRightPane = true;
			currentSettings.showLeftPane = true;
			currentSettings.showToolbar = true;

			// Update to new settings
			sisenseFrame.updateSettings(currentSettings).then(function() {
				logger.log('Updated UI settings');
			});
		}
	}

	/**
	 * Handle widget un-loaded event
	 * @param {object} args event arguments containing the widget causing the event
	 */
	function widgetUnloadedHandler(args) {

		// Check that we are really in widget mode
		if(args.widget && Object.keys(args.widget).length) {

			var currentSettings = sisenseFrame.getSettings();

			// Toggle
			currentSettings.showRightPane = false;
			currentSettings.showLeftPane = false;
			currentSettings.showToolbar = false;

			// Update to new settings
			sisenseFrame.updateSettings(currentSettings).then(function() {
				logger.log('Updated UI settings');
			});
		}
	}

	/**
	 * Handle dashboard loaded event
	 * @param {object} args event arguments containing the dashboard causing the event
	 */
	function dashboardLoadedHandler(args) {
				
		var dash = args.dashboard;
		logger.log('Dashboard ' + dash.oid + ' loaded');

		// Mark current dashboard in navver
		var itemElement = config.dashboards.find(function(item) { return item.oid == dash.oid }).el;
		var currentActiveItem = document.querySelectorAll('nav.sidebar .active')[0];
		currentActiveItem && currentActiveItem.classList.remove('active');
		itemElement.querySelectorAll('a')[0].classList.add('active');

		// Log size of dashboard when it loads
		sisenseFrame.getSize().then(function(data) {
			logger.log('New dashboard content height is ' + data.content.height + ' px');
		});
	}

	/**
	 * Handle dashboard loaded event
	 * @param {object} args event arguments containing the dashboard causing the event
	 */
	function dashboardFiltersChangedHandler(args) {

		var dash = args.dashboard;
		logger.log('Dashboard ' + dash.oid + ' filters changed');

		// Update to current country filter
		var filter = dash.filters.find(function(filter) {
			return filter.jaql.dim == config.countryDim && filter.jaql.filter && filter.jaql.filter.startsWith;
		});
		if(filter && !filter.disabled) {
			countryFilterElement.value = filter.jaql.filter.startsWith;
		}
		else {
			countryFilterElement.value = null;
		}
		
		// Update to current date filter
		var dateFilter = dash.filters.find(function(filter) {
			return  filter.jaql.dim == config.dateDim &&
					filter.jaql.level == "days" &&
					filter.jaql.filter &&
					(filter.jaql.filter.from || filter.jaql.filter.to);
		});
		if(dateFilter && !dateFilter.disabled) {
			fromDateElement.value = (dateFilter.jaql.filter.from || null);
			toDateElement.value = (dateFilter.jaql.filter.to || null);
		}
		else {
			fromDateElement.value = null;
			toDateElement.value = null;
		}
	}
});



