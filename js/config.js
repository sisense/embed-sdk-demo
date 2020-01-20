/**
 * Embed SDK Demo Configuration
 * Written by Moti Granovsky, Sisense DevX, 2020
 * ---------------------------------------------
 * 
 * This file contains some basic configuration for the Embed SDK Demo
 */

(function(w) {

    /**
     * Properties that need to be set are listed
     * @property {string} baseUrl    - The URL of your Sisense web server in the format `<protocol>://<ip or hostname>:<port>` - with no `/` character at the end
     * @property {object[]} dashboards - An array of dashboards to display in the left-side navigation panel
     * @property {string} dateDim    - Dimnensin tied to the date filters in the demo page
     * @property {string} countryDim - Dimension ties to the text filter in the demo page
     */
    const obj = {
        // UPDATE THIS
        baseUrl: 'http://10.53.1.107:8081',

        // UPDATE THIS
        dashboards: [
            {
                title: "Demo Dashboard #1",
                oid: "5d371bf198b98a113c6a5f38",
                default: true
            },
            {
                title: "Demo Dashboard #2",
                oid: "5d46cf2dcccce82a64866050",
                default: false
            }
        ],

        // DON'T UPDATE THIS - just make sure to use the Sample ECommerce sample datasource
        dateDim: '[Commerce.Date (Calendar)]',
        countryDim: '[Country.Country]'
    };

    // DON'T MODIFY THIS
    obj.defaultDashOid = (obj.dashboards.find(function(item) {
		return item.default;
	}) || obj.dashboards[0]).oid;

    // DON'T MODIFY THIS
    w['embedsdk.demo.config'] = obj;

})(window);