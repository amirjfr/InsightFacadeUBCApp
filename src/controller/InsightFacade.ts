import Log from "../Util";
import {
    IInsightFacade,
    InsightDataset,
    InsightDatasetKind,
    InsightError,
    NotFoundError,
    ResultTooLargeError
} from "./IInsightFacade";
import {JSZipObject} from "jszip";
import Helpers from "./Helpers";
import Filters from "./Filters";
import Room from "./Room";
import Transformations from "./Transformations";
import RoomFilters from "./RoomFilters";

/**
 * This is the main programmatic entry point for the project.
 * Method documentation is in IInsightFacade
 *
 */
export default class InsightFacade implements IInsightFacade {
    public datasets: string[];
    public promisesArray: Array<Promise<any>>;
    public numRowsCounter: number;
    public numRowsArray: number[];
    public helpers: Helpers;
    public filters: Filters;
    public transformations: Transformations;
    public room: Room;
    public relativePathArray: string[];
    public idToKindMap: any;

    constructor() {
        Log.trace("InsightFacadeImpl::init()");
        this.datasets = [];
        this.promisesArray = [];
        this.numRowsArray = [];
        this.numRowsCounter = 0;
        this.helpers = new Helpers();
        this.filters = new Filters();
        this.transformations = new Transformations();
        this.room = new Room();
        this.relativePathArray = [];
        this.idToKindMap = {};
    }

    public addDataset(id: string, content: string, kind: InsightDatasetKind): Promise<string[]> {
        this.idToKindMap[id] = kind;
        if (kind === InsightDatasetKind.Rooms) {
            return this.room.addDataset(id, content, kind, this.datasets, this.numRowsArray);
        }
        const JSZip = require("jszip");
        const fs = require("fs");
        let zip = new JSZip();
        this.numRowsCounter = 0;

        if (id === undefined || id.includes("_")
            || !id.trim().length || kind !== "courses" || this.datasets.includes(id)) {
            return Promise.reject(new InsightError());
        }

        return new Promise((resolve, reject) => {
            let hasAtLeastOneValidSection = false;
            let parsedObject: any = {};
            parsedObject[id] = {};
            zip.loadAsync(content, {base64: true}).then((resolvedZip: any) => {
                resolvedZip.folder("courses").forEach((relativePath: string, file: JSZipObject) => {
                    let filePromise: Promise<any> = file.async("string");
                    this.relativePathArray.push(relativePath);
                    this.promisesArray.push(filePromise);
                });
                for (let filePromise of this.promisesArray) {
                    let index = this.promisesArray.indexOf(filePromise);
                    let relativePath = this.relativePathArray[index];
                    filePromise.then((data: string) => {
                        try {
                            let object = JSON.parse(data);
                            parsedObject[id][relativePath] = {};
                            let count = 0;
                            for (let i = 0; i < object["result"].length; i++) {
                                if (object["result"][i].hasOwnProperty("Subject") &&
                                    object["result"][i].hasOwnProperty("Course") &&
                                    object["result"][i].hasOwnProperty("Avg") &&
                                    object["result"][i].hasOwnProperty("Professor") &&
                                    object["result"][i].hasOwnProperty("Title") &&
                                    object["result"][i].hasOwnProperty("Pass") &&
                                    object["result"][i].hasOwnProperty("Fail") &&
                                    object["result"][i].hasOwnProperty("Audit") &&
                                    object["result"][i].hasOwnProperty("id") &&
                                    object["result"][i].hasOwnProperty("Year")) {
                                    count++;
                                    let sectionNum = "section" + "_" + i.toString();
                                    parsedObject[id][relativePath][sectionNum] = {};
                                    parsedObject[id][relativePath][sectionNum]["dept"] =
                                        object["result"][i]["Subject"];
                                    parsedObject[id][relativePath][sectionNum]["id"] =
                                        object["result"][i]["Course"];
                                    parsedObject[id][relativePath][sectionNum]["avg"] =
                                        object["result"][i]["Avg"];
                                    parsedObject[id][relativePath][sectionNum]["instructor"] =
                                        object["result"][i]["Professor"];
                                    parsedObject[id][relativePath][sectionNum]["title"] =
                                        object["result"][i]["Title"];
                                    parsedObject[id][relativePath][sectionNum]["pass"] =
                                        object["result"][i]["Pass"];
                                    parsedObject[id][relativePath][sectionNum]["fail"] =
                                        object["result"][i]["Fail"];
                                    parsedObject[id][relativePath][sectionNum]["audit"] =
                                        object["result"][i]["Audit"];
                                    parsedObject[id][relativePath][sectionNum]["uuid"] =
                                        object["result"][i]["id"].toString();
                                    if (object["result"][i]["Section"] === "overall") {
                                        parsedObject[id][relativePath][sectionNum]["year"] = 1900;
                                    } else {
                                        parsedObject[id][relativePath][sectionNum]["year"] =
                                            parseInt(object["result"][i]["Year"], 10);
                                    }
                                }
                            }
                            if (count > 0) {
                                this.numRowsCounter += count;
                                hasAtLeastOneValidSection = true;
                            } else {
                                delete parsedObject[id][relativePath];
                            }
                        } catch (err) { /*do nothing*/
                        }
                    }).catch((e: any) => {
                        return reject(new InsightError());
                    });
                }
                Promise.all(this.promisesArray).then(() => {
                    if (hasAtLeastOneValidSection) {
                        fs.writeFileSync("./data/" + id + ".json", JSON.stringify(parsedObject));
                        this.datasets.push(id);
                        this.numRowsArray.push(this.numRowsCounter);
                        return resolve(this.datasets);
                    } else {
                        return reject(new InsightError());
                    }
                }).catch((e: any) => {
                    return reject(new InsightError());
                });
            }).catch((e: any) => {
                return reject(new InsightError());
            });
        });
    }

    public removeDataset(id: string): Promise<string> {
        const fs = require("fs");
        const path = "./data/" + id + ".json";

        if (id === undefined || id.includes("_") || !id.trim().length) {
            return Promise.reject(new InsightError());
        }
        if (!this.datasets.includes(id)) {
            return Promise.reject(new NotFoundError());
        }
        try {
            fs.unlinkSync(path);
            for (let i = 0; i < this.datasets.length; i++) {
                if (this.datasets[i] === id) {
                    this.datasets.splice(i, 1);
                    break;
                }
            }
            return Promise.resolve(id);
        } catch (err) {
            return Promise.reject(new InsightError());
        }
    }

    public performQuery(query: any): Promise<any[]> {
        if (!this.helpers.isValidQuery(query, this.datasets, this.idToKindMap)) {
            return Promise.reject(new InsightError());
        }
        let ids: string[] = [];
        this.helpers.checkIds(query, ids);
        let id = ids[0];
        const fs = require("fs");
        let filteredResult: any = [];
        let transformedResult: any = [];
        let trimmedResult: any = [];
        try {
            let datasetString: string = fs.readFileSync("./data/" + id + ".json");
            let dataset = JSON.parse(datasetString);
            if (this.idToKindMap[id] === InsightDatasetKind.Courses) {
                this.writeCourses(dataset, id, query, filteredResult);
            } else {
                this.writeRooms(dataset, id, query, filteredResult);
            }
            transformedResult =
                this.transformations.processTransformations(query["TRANSFORMATIONS"], filteredResult, id);
            if (transformedResult.length > 5000) {
                return Promise.reject(new ResultTooLargeError());
            }
            trimmedResult = this.helpers.processOptions(query["OPTIONS"], query, transformedResult, id);
        } catch (e) {
            return Promise.reject(new InsightError());
        }
        let jsonString = JSON.stringify(query);
        let criteria: any;
        if (jsonString.indexOf("ORDER") >= 0) {
            criteria = query["OPTIONS"]["ORDER"];
            trimmedResult.sort(this.helpers.sortByCriteria(criteria));
        }
        return Promise.resolve(trimmedResult);
    }

    public listDatasets(): Promise<InsightDataset[]> {
        let listDateSets: InsightDataset[] = [];
        let id: string = "";
        let numRows: number = 0;
        for (let i in this.datasets) {
            id = this.datasets[i];
            if (id === "rooms") {
                numRows = this.numRowsArray[i];
                listDateSets.push({id: id, kind: InsightDatasetKind.Rooms, numRows: numRows, } as InsightDataset);
            } else {
                numRows = this.numRowsArray[i];
                listDateSets.push({id: id, kind: InsightDatasetKind.Courses, numRows: numRows, } as InsightDataset);
            }
        }
        return Promise.resolve(listDateSets);
    }

    public writeRooms(dataset: any, id: string, query: any, filteredResult: any): void {
        if (Object.keys(query["WHERE"]).length === 0) {
            for (let building in dataset["rooms"]) {
                for (let room of dataset["rooms"][building]) {
                    let roomObject: any = {};
                    for (let key in room) {
                        roomObject[id + "_" + key] = room[key];
                    }
                    filteredResult.push(roomObject);
                }
            }
            return;
        }
        for (let building in dataset["rooms"]) {
            for (let room of dataset["rooms"][building]) {
                let roomObject: any = {};
                for (let key in room) {
                    roomObject[id + "_" + key] = room[key];
                    let objectKey: object = room;
                    if (this.filters.processFilters(query["WHERE"], objectKey, id) &&
                        !filteredResult.includes(roomObject)) {
                        filteredResult.push(roomObject);
                    }
                }
            }
        }
    }

    public writeCourses(dataset: any, id: string, query: any, filteredResult: any): void {
        if (Object.keys(query["WHERE"]).length === 0) {
            for (let course in dataset["courses"]) {
                for (let section in dataset["courses"][course]) {
                    let sectionObject: any = {};
                    for (let key in dataset["courses"][course][section]) {
                        sectionObject[id + "_" + key] = dataset["courses"][course][section][key];
                    }
                    filteredResult.push(sectionObject);
                }
            }
            return;
        }
        for (let course in dataset["courses"]) {
            for (let section in dataset["courses"][course]) {
                let sectionObject: any = {};
                for (let key in dataset["courses"][course][section]) {
                    sectionObject[id + "_" + key] = dataset["courses"][course][section][key];
                    let objectKey: object = dataset["courses"][course][section];
                    if (this.filters.processFilters(query["WHERE"], objectKey, id) &&
                        !filteredResult.includes(sectionObject)) {
                        filteredResult.push(sectionObject);
                    }
                }
            }
        }
    }
}
