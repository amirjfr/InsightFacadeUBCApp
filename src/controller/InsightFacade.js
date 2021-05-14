"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const Util_1 = require("../Util");
const IInsightFacade_1 = require("./IInsightFacade");
const Helpers_1 = require("./Helpers");
const Filters_1 = require("./Filters");
const Room_1 = require("./Room");
const Transformations_1 = require("./Transformations");
class InsightFacade {
    constructor() {
        Util_1.default.trace("InsightFacadeImpl::init()");
        this.datasets = [];
        this.promisesArray = [];
        this.numRowsArray = [];
        this.numRowsCounter = 0;
        this.helpers = new Helpers_1.default();
        this.filters = new Filters_1.default();
        this.transformations = new Transformations_1.default();
        this.room = new Room_1.default();
        this.relativePathArray = [];
        this.idToKindMap = {};
    }
    addDataset(id, content, kind) {
        this.idToKindMap[id] = kind;
        if (kind === IInsightFacade_1.InsightDatasetKind.Rooms) {
            return this.room.addDataset(id, content, kind, this.datasets, this.numRowsArray);
        }
        const JSZip = require("jszip");
        const fs = require("fs");
        let zip = new JSZip();
        this.numRowsCounter = 0;
        if (id === undefined || id.includes("_")
            || !id.trim().length || kind !== "courses" || this.datasets.includes(id)) {
            return Promise.reject(new IInsightFacade_1.InsightError());
        }
        return new Promise((resolve, reject) => {
            let hasAtLeastOneValidSection = false;
            let parsedObject = {};
            parsedObject[id] = {};
            zip.loadAsync(content, { base64: true }).then((resolvedZip) => {
                resolvedZip.folder("courses").forEach((relativePath, file) => {
                    let filePromise = file.async("string");
                    this.relativePathArray.push(relativePath);
                    this.promisesArray.push(filePromise);
                });
                for (let filePromise of this.promisesArray) {
                    let index = this.promisesArray.indexOf(filePromise);
                    let relativePath = this.relativePathArray[index];
                    filePromise.then((data) => {
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
                                    }
                                    else {
                                        parsedObject[id][relativePath][sectionNum]["year"] =
                                            parseInt(object["result"][i]["Year"], 10);
                                    }
                                }
                            }
                            if (count > 0) {
                                this.numRowsCounter += count;
                                hasAtLeastOneValidSection = true;
                            }
                            else {
                                delete parsedObject[id][relativePath];
                            }
                        }
                        catch (err) {
                        }
                    }).catch((e) => {
                        return reject(new IInsightFacade_1.InsightError());
                    });
                }
                Promise.all(this.promisesArray).then(() => {
                    if (hasAtLeastOneValidSection) {
                        fs.writeFileSync("./data/" + id + ".json", JSON.stringify(parsedObject));
                        this.datasets.push(id);
                        this.numRowsArray.push(this.numRowsCounter);
                        return resolve(this.datasets);
                    }
                    else {
                        return reject(new IInsightFacade_1.InsightError());
                    }
                }).catch((e) => {
                    return reject(new IInsightFacade_1.InsightError());
                });
            }).catch((e) => {
                return reject(new IInsightFacade_1.InsightError());
            });
        });
    }
    removeDataset(id) {
        const fs = require("fs");
        const path = "./data/" + id + ".json";
        if (id === undefined || id.includes("_") || !id.trim().length) {
            return Promise.reject(new IInsightFacade_1.InsightError());
        }
        if (!this.datasets.includes(id)) {
            return Promise.reject(new IInsightFacade_1.NotFoundError());
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
        }
        catch (err) {
            return Promise.reject(new IInsightFacade_1.InsightError());
        }
    }
    performQuery(query) {
        if (!this.helpers.isValidQuery(query, this.datasets, this.idToKindMap)) {
            return Promise.reject(new IInsightFacade_1.InsightError());
        }
        let ids = [];
        this.helpers.checkIds(query, ids);
        let id = ids[0];
        const fs = require("fs");
        let filteredResult = [];
        let transformedResult = [];
        let trimmedResult = [];
        try {
            let datasetString = fs.readFileSync("./data/" + id + ".json");
            let dataset = JSON.parse(datasetString);
            if (this.idToKindMap[id] === IInsightFacade_1.InsightDatasetKind.Courses) {
                this.writeCourses(dataset, id, query, filteredResult);
            }
            else {
                this.writeRooms(dataset, id, query, filteredResult);
            }
            transformedResult =
                this.transformations.processTransformations(query["TRANSFORMATIONS"], filteredResult, id);
            if (transformedResult.length > 5000) {
                return Promise.reject(new IInsightFacade_1.ResultTooLargeError());
            }
            trimmedResult = this.helpers.processOptions(query["OPTIONS"], query, transformedResult, id);
        }
        catch (e) {
            return Promise.reject(new IInsightFacade_1.InsightError());
        }
        let jsonString = JSON.stringify(query);
        let criteria;
        if (jsonString.indexOf("ORDER") >= 0) {
            criteria = query["OPTIONS"]["ORDER"];
            trimmedResult.sort(this.helpers.sortByCriteria(criteria));
        }
        return Promise.resolve(trimmedResult);
    }
    listDatasets() {
        let listDateSets = [];
        let id = "";
        let numRows = 0;
        for (let i in this.datasets) {
            id = this.datasets[i];
            if (id === "rooms") {
                numRows = this.numRowsArray[i];
                listDateSets.push({ id: id, kind: IInsightFacade_1.InsightDatasetKind.Rooms, numRows: numRows, });
            }
            else {
                numRows = this.numRowsArray[i];
                listDateSets.push({ id: id, kind: IInsightFacade_1.InsightDatasetKind.Courses, numRows: numRows, });
            }
        }
        return Promise.resolve(listDateSets);
    }
    writeRooms(dataset, id, query, filteredResult) {
        if (Object.keys(query["WHERE"]).length === 0) {
            for (let building in dataset["rooms"]) {
                for (let room of dataset["rooms"][building]) {
                    let roomObject = {};
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
                let roomObject = {};
                for (let key in room) {
                    roomObject[id + "_" + key] = room[key];
                    let objectKey = room;
                    if (this.filters.processFilters(query["WHERE"], objectKey, id) &&
                        !filteredResult.includes(roomObject)) {
                        filteredResult.push(roomObject);
                    }
                }
            }
        }
    }
    writeCourses(dataset, id, query, filteredResult) {
        if (Object.keys(query["WHERE"]).length === 0) {
            for (let course in dataset["courses"]) {
                for (let section in dataset["courses"][course]) {
                    let sectionObject = {};
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
                let sectionObject = {};
                for (let key in dataset["courses"][course][section]) {
                    sectionObject[id + "_" + key] = dataset["courses"][course][section][key];
                    let objectKey = dataset["courses"][course][section];
                    if (this.filters.processFilters(query["WHERE"], objectKey, id) &&
                        !filteredResult.includes(sectionObject)) {
                        filteredResult.push(sectionObject);
                    }
                }
            }
        }
    }
}
exports.default = InsightFacade;
//# sourceMappingURL=InsightFacade.js.map