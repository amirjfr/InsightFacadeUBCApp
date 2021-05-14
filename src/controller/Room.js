"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const Util_1 = require("../Util");
const IInsightFacade_1 = require("./IInsightFacade");
class Room {
    constructor() {
        Util_1.default.trace("Room::init()");
        this.hrefArray = new Set();
        this.fileNames = [];
        this.promisesArrayRoom = [];
        this.promisesArrayLatLon = [];
        this.numRooms = 0;
    }
    addDataset(id, content, kind, datasets, numRowsArray) {
        const JSZip = require("jszip");
        const fs = require("fs");
        const parse5 = require("parse5");
        let zip = new JSZip();
        if (id === undefined || id.includes("_") || !id.trim().length || kind !== "rooms" || datasets.includes(id)) {
            return Promise.reject(new IInsightFacade_1.InsightError());
        }
        return new Promise((resolve, reject) => {
            let hasAtLeastOneValidRoom = false;
            let object;
            return zip.loadAsync(content, { base64: true }).then((resolvedZip) => {
                return resolvedZip.folder("rooms").file("index.htm").async("string").then((data) => {
                    if (data.indexOf("<table") === -1 || data.indexOf("<table") === undefined) {
                        return reject(new IInsightFacade_1.InsightError());
                    }
                    let start = data.indexOf("<tbody>");
                    let end = data.indexOf("</tbody>");
                    let bodyContent = data.substring(start, end + 8);
                    let parsedBody = parse5.parse(bodyContent);
                    this.addHrefLinks(parsedBody);
                    return this.writeDataset(resolvedZip, id, content, datasets);
                }).then(() => {
                    return Promise.all(this.promisesArrayLatLon);
                });
            }).then(() => {
                numRowsArray.push(this.numRooms);
                return resolve(datasets);
            }).catch((e) => {
                return reject(new IInsightFacade_1.InsightError());
            });
        });
    }
    addHrefLinks(body) {
        let attrs = [];
        if (body === undefined || body["nodeName"] === undefined) {
            return;
        }
        for (let node of body["childNodes"]) {
            if (node["childNodes"] === undefined || node["childNodes"].length === 0) {
                continue;
            }
            if (node["attrs"] === undefined || node["attrs"].length === 0) {
                this.addHrefLinks(node);
            }
            else {
                attrs.push(node["attrs"]);
            }
        }
        for (let attr of attrs) {
            for (let object of attr) {
                if (object["name"] === "href") {
                    this.hrefArray.add(object["value"]);
                }
            }
        }
    }
    getLatLon(address) {
        const http = require("http");
        let addr = address.trim().split(" ").join("%20");
        let url = "http://cs310.students.cs.ubc.ca:11316/api/v1/project_team128/" + addr;
        return new Promise(((resolve, reject) => {
            http.get(url, (response) => {
                response.on("data", (data) => {
                    try {
                        let latLon = JSON.parse(data);
                        resolve(latLon);
                    }
                    catch (e) {
                        reject(new IInsightFacade_1.InsightError());
                    }
                });
            }).on("error", () => {
                reject(new IInsightFacade_1.InsightError());
            });
        }));
    }
    writeDataset(resolvedZip, id, content, datasets) {
        const JSZip = require("jszip");
        const fs = require("fs");
        const parse5 = require("parse5");
        let zip = new JSZip();
        let parsedObject = {};
        parsedObject[id] = {};
        datasets.push(id);
        for (let building of this.hrefArray) {
            let fileName = "";
            let folderFilePath = "";
            let i = building.length - 1;
            while (building.charAt(i) !== "/" && i >= 0) {
                i--;
            }
            fileName = building.substring(i + 1, building.length);
            folderFilePath = building.substring(1, i);
            this.fileNames.push(fileName);
            let filePromise = resolvedZip.folder("rooms" + folderFilePath).file(fileName).async("string");
            this.promisesArrayRoom.push(filePromise);
        }
        return Promise.all(this.promisesArrayRoom).then(() => {
            for (let filePromise of this.promisesArrayRoom) {
                let index = this.promisesArrayRoom.indexOf(filePromise);
                let fileName = this.fileNames[index];
                filePromise.then((data) => {
                    try {
                        let numRooms = (data.match(/Room Details/g) || []).length;
                        if (numRooms === 0) {
                            return;
                        }
                        parsedObject[id][fileName] = [];
                        let rooms = [];
                        return this.parseBuilding(data, fileName, numRooms, rooms, id, parsedObject);
                    }
                    catch (err) {
                        return Promise.reject(new IInsightFacade_1.InsightError());
                    }
                });
            }
        });
    }
    parseBuilding(data, fileName, numRooms, rooms, id, parsedObject) {
        let fullNames = [];
        let shortNames = [];
        let numbers = [];
        let names = [];
        let addresses = [];
        let latitudes = [];
        let longitudes = [];
        let seats = [];
        let types = [];
        let furnitures = [];
        let hrefs = [];
        const fs = require("fs");
        this.getFullNames(data, fullNames, numRooms);
        for (let i = 0; i < numRooms; i++) {
            shortNames[i] = fileName;
        }
        this.getAddresses(data, addresses, numRooms);
        this.getRoomDetails(data, numbers, seats, types, furnitures, hrefs, numRooms);
        for (let i = 0; i < numRooms; i++) {
            names.push(shortNames[i] + "_" + numbers[i]);
        }
        this.promisesArrayLatLon.push(this.getLatLon(addresses[0]).then((latLon) => {
            for (let i = 0; i < numRooms; i++) {
                let room = {};
                latitudes.push(latLon["lat"]);
                longitudes.push(latLon["lon"]);
                room["fullname"] = fullNames[i];
                room["shortname"] = shortNames[i];
                room["number"] = numbers[i];
                room["name"] = names[i];
                room["address"] = addresses[i];
                room["lat"] = latitudes[i];
                room["lon"] = longitudes[i];
                room["seats"] = seats[i];
                room["type"] = types[i];
                room["furniture"] = furnitures[i];
                room["href"] = hrefs[i];
                parsedObject[id][fileName].push(room);
                this.numRooms++;
                fs.writeFileSync("./data/" + id + ".json", JSON.stringify(parsedObject));
            }
        }));
    }
    getFullNames(data, fullNames, numRooms) {
        const parse5 = require("parse5");
        let start = data.indexOf("<h2><span class=\"field-content\">");
        let endSearchTerm = "</span></h2>";
        let end = data.indexOf(endSearchTerm);
        let bodyContent = data.substring(start, end + endSearchTerm.length);
        let parsedBody = parse5.parse(bodyContent);
        let fullName = parsedBody["childNodes"][0]["childNodes"][1]["childNodes"][0]["childNodes"][0]["childNodes"][0]["value"];
        for (let i = 0; i < numRooms; i++) {
            fullNames[i] = fullName;
        }
    }
    getAddresses(data, addresses, numRooms) {
        const parse5 = require("parse5");
        let start = data.indexOf("<div class=\"field-content\">");
        let subString = data.substring(start, start + 100);
        let endSearchTerm = "</div>";
        let end = subString.indexOf(endSearchTerm);
        let bodyContent = data.substring(start, start + end + endSearchTerm.length);
        let parsedBody = parse5.parse(bodyContent);
        let address = parsedBody["childNodes"][0]["childNodes"][1]["childNodes"][0]["childNodes"][0]["value"];
        for (let i = 0; i < numRooms; i++) {
            addresses[i] = address;
        }
    }
    getRoomDetails(data, numbers, seats, types, furnitures, hrefs, numRooms) {
        const parse5 = require("parse5");
        let start = data.indexOf("<tbody>");
        let endSearchTerm = "</tbody>";
        let end = data.indexOf(endSearchTerm);
        let bodyContent = data.substring(start, end + endSearchTerm.length);
        for (let i = 0; i < numRooms; i++) {
            let startRow = bodyContent.indexOf("<tr");
            let endRowSearchTerm = "</tr>";
            let endRow = bodyContent.indexOf(endRowSearchTerm);
            let rowContent = bodyContent.substring(startRow, endRow + endRowSearchTerm.length);
            let parsedBody = parse5.parse(rowContent);
            this.getRoomDetailsHelper(parsedBody, numbers, seats, types, furnitures, hrefs);
            bodyContent = bodyContent.substring(endRow + endRowSearchTerm.length, end + endSearchTerm.length);
        }
    }
    getRoomDetailsHelper(body, numbers, seats, types, furnitures, hrefs) {
        let href = body["childNodes"][0]["childNodes"][1]["childNodes"][1]["attrs"][0]["value"];
        let num = body["childNodes"][0]["childNodes"][1]["childNodes"][1]["childNodes"][0]["value"];
        let detailsString = body["childNodes"][0]["childNodes"][1]["childNodes"][2]["value"];
        let stringArray = detailsString.split("\n");
        let seat = Number(stringArray[2].trim());
        let furniture = stringArray[4].trim();
        let type = stringArray[6].trim();
        numbers.push(num);
        seats.push(seat);
        types.push(type);
        furnitures.push(furniture);
        hrefs.push(href);
    }
}
exports.default = Room;
//# sourceMappingURL=Room.js.map