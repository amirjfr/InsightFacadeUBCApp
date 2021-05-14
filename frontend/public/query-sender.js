/**
 * Receives a query object as parameter and sends it as Ajax request to the POST /query REST endpoint.
 *
 * @param query The query object
 * @returns {Promise} Promise that must be fulfilled if the Ajax request is successful and be rejected otherwise.
 */
CampusExplorer.sendQuery = (query) => {
    return new Promise((resolve, reject) => {
        // TODO: implement!
        let xhttp = new XMLHttpRequest();
        let method = "POST";
        let url = "http://localhost:4321/query";
        xhttp.open(method, url, true);
        xhttp.onreadystatechange = function() {
            if (this.readyState == 4 && this.status == 200) {
                return resolve(JSON.parse(this.responseText));
            }
        }
        xhttp.onload = function() {
            // do nothing
        }
        xhttp.setRequestHeader("Content-type", "application/json");
        xhttp.send(JSON.stringify(query));

    });
};
