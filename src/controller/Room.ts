import Log from "../Util";
import {InsightDataset, InsightDatasetKind, InsightError, NotFoundError} from "./IInsightFacade";

export default class Room {
    public hrefArray: Set<any>;
    public fileNames: string[];
    public promisesArrayRoom: any[];
    public promisesArrayLatLon: any[];
    public numRooms: number;

    constructor() {
        Log.trace("Room::init()");
        this.hrefArray = new Set();
        this.fileNames = [];
        this.promisesArrayRoom = [];
        this.promisesArrayLatLon = [];
        this.numRooms = 0;
    }

    public addDataset(id: string, content: string,
                      kind: InsightDatasetKind, datasets: string[], numRowsArray: number[]): Promise<string[]> {
        const JSZip = require("jszip");
        const fs = require("fs");
        const parse5 = require("parse5");
        let zip = new JSZip();
        if (id === undefined || id.includes("_") || !id.trim().length || kind !== "rooms" || datasets.includes(id)) {
            return Promise.reject(new InsightError());
        }
        return new Promise((resolve, reject) => {
            let hasAtLeastOneValidRoom = false;
            let object: any;
            return zip.loadAsync(content, {base64: true}).then((resolvedZip: any) => {
                return resolvedZip.folder("rooms").file("index.htm").async("string").then((data: string) => {
                    if (data.indexOf("<table") === -1 || data.indexOf("<table") === undefined) {
                        return reject(new InsightError());
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
            }).catch((e: any) => {
                return reject(new InsightError());
            });
        });
    }

    public addHrefLinks(body: any): void {
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
            } else {
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

    // https://stackoverflow.com/questions/6968448/where-is-body-in-a-nodejs-http-get-response
    public getLatLon(address: string): Promise<any> {
        const http = require("http");
        let addr = address.trim().split(" ").join("%20");
        let url = "http://cs310.students.cs.ubc.ca:11316/api/v1/project_team128/" + addr;
        return new Promise<string>(((resolve, reject) => {
            http.get(url, (response: any) => {
                response.on("data", (data: any) => {
                    try {
                        let latLon = JSON.parse(data);
                        resolve(latLon);
                    } catch (e) {
                        reject(new InsightError());
                    }
                });
            }).on("error", () => {
                reject(new InsightError());
            });
        }));
    }

    public writeDataset(resolvedZip: any, id: string, content: string, datasets: string[]): Promise<any> {
        const JSZip = require("jszip");
        const fs = require("fs");
        const parse5 = require("parse5");
        let zip = new JSZip();
        let parsedObject: any = {};
        // let promisesArrayRoom: Array<Promise<any>> = [];
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
            let filePromise: Promise<any> =
                resolvedZip.folder("rooms" + folderFilePath).file(fileName).async("string");
            this.promisesArrayRoom.push(filePromise);
        }
        return Promise.all(this.promisesArrayRoom).then(() => {
            for (let filePromise of this.promisesArrayRoom) {
                let index = this.promisesArrayRoom.indexOf(filePromise);
                let fileName = this.fileNames[index];
                filePromise.then((data: string) => {
                    try {
                        let numRooms = (data.match(/Room Details/g) || []).length;
                        if (numRooms === 0) {
                            return;
                        }
                        parsedObject[id][fileName] = [];
                        let rooms: any[] = [];
                        return this.parseBuilding(data, fileName, numRooms, rooms, id, parsedObject);
                    } catch (err) {
                        return Promise.reject(new InsightError());
                    }
                });
            }
        });
    }

    public parseBuilding(data: string, fileName: string, numRooms: number, rooms: any, id: string,
                         parsedObject: any): any {
        let fullNames: string[] = [];
        let shortNames: string[] = [];
        let numbers: string[] = [];
        let names: string[] = [];
        let addresses: string[] = [];
        let latitudes: number[] = [];
        let longitudes: number[] = [];
        let seats: number[] = [];
        let types: string[] = [];
        let furnitures: string[] = [];
        let hrefs: string[] = [];
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
                let room: any = {};
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

    public getFullNames(data: any, fullNames: any, numRooms: number): void {
        const parse5 = require("parse5");
        let start = data.indexOf("<h2><span class=\"field-content\">");
        let endSearchTerm = "</span></h2>";
        let end = data.indexOf(endSearchTerm);
        let bodyContent = data.substring(start, end + endSearchTerm.length);
        let parsedBody = parse5.parse(bodyContent);
        let fullName =
            parsedBody["childNodes"][0]["childNodes"][1]["childNodes"][0]["childNodes"][0]["childNodes"][0]["value"];
        for (let i = 0; i < numRooms; i++) {
            fullNames[i] = fullName;
        }
    }

    public getAddresses(data: any, addresses: string[], numRooms: number): void {
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

    public getRoomDetails(data: any, numbers: string[], seats: number[], types: string[], furnitures: string[],
                          hrefs: string[], numRooms: number): void {
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

    public getRoomDetailsHelper(body: any, numbers: string[], seats: number[],
                                types: string[], furnitures: string[], hrefs: string[]): void {
        let href: string = body["childNodes"][0]["childNodes"][1]["childNodes"][1]["attrs"][0]["value"];
        let num: string = body["childNodes"][0]["childNodes"][1]["childNodes"][1]["childNodes"][0]["value"];

        let detailsString = body["childNodes"][0]["childNodes"][1]["childNodes"][2]["value"];
        let stringArray = detailsString.split("\n");

        let seat: number = Number(stringArray[2].trim());
        let furniture = stringArray[4].trim();
        let type = stringArray[6].trim();

        numbers.push(num);
        seats.push(seat);
        types.push(type);
        furnitures.push(furniture);
        hrefs.push(href);
    }
}
