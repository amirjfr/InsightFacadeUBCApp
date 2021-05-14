"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const Util_1 = require("../Util");
const RoomHelpers_1 = require("./RoomHelpers");
const CourseHelpers_1 = require("./CourseHelpers");
const IInsightFacade_1 = require("./IInsightFacade");
class Helpers {
    constructor() {
        Util_1.default.trace("Helpers2::init()");
        this.roomHelpers = new RoomHelpers_1.default();
        this.courseHelpers = new CourseHelpers_1.default();
        this.numberKeys = [];
        this.validKeys = [];
    }
    isValidQueryHelper3(object, id, filters, idToKindMap) {
        let jsonString;
        try {
            jsonString = JSON.stringify(object);
        }
        catch (e) {
            return false;
        }
        let kind = idToKindMap[id];
        if (kind === IInsightFacade_1.InsightDatasetKind.Courses) {
            this.numberKeys = [id + "_" + "avg", id + "_" + "pass", id + "_" + "fail", id + "_" + "audit",
                id + "_" + "year"];
            this.validKeys = [id + "_" + "dept", id + "_" + "id", id + "_" + "avg", id + "_" + "instructor",
                id + "_" + "title", id + "_" + "pass", id + "_" + "fail", id + "_" + "fail", id + "_" + "audit",
                id + "_" + "uuid", id + "_" + "year"];
        }
        else {
            this.numberKeys = [id + "_" + "lat", id + "_" + "lon", id + "_" + "seats"];
            this.validKeys = [id + "_" + "fullname", id + "_" + "shortname", id + "_" + "number", id + "_" + "name",
                id + "_" + "address", id + "_" + "lat", id + "_" + "lon", id + "_" + "seats", id + "_" + "type",
                id + "_" + "furniture", id + "_" + "href"];
        }
        for (let filter in object["WHERE"]) {
            if (!filters.includes(filter)) {
                return false;
            }
        }
        if (jsonString.indexOf("ORDER") >= 0) {
            if (!this.checkSORT(object)) {
                return false;
            }
        }
        if (jsonString.indexOf("MAX") >= 0 || jsonString.indexOf("MIN") >= 0 || jsonString.indexOf("AVG") >= 0 ||
            jsonString.indexOf("SUM") >= 0 || jsonString.indexOf("APPLY") >= 0) {
            if (!this.checkApplyTokens(object)) {
                return false;
            }
        }
        return true;
    }
    checkSORT(object) {
        let orderValue = object["OPTIONS"]["ORDER"];
        let columnKeys = object["OPTIONS"]["COLUMNS"];
        if (typeof orderValue === "string") {
            if (!columnKeys.includes(orderValue)) {
                return false;
            }
        }
        else {
            let orderCategories = [];
            for (let orderCategory in orderValue) {
                orderCategories.push(orderCategory);
            }
            if (orderCategories.length !== 2 || !orderCategories.includes("dir") || !orderCategories.includes("keys")) {
                return false;
            }
            let orderDir = orderValue["dir"];
            if (orderDir !== "UP" && orderDir !== "DOWN") {
                return false;
            }
            let orderKeys = orderValue["keys"];
            if (orderKeys.length === 0) {
                return false;
            }
            for (let key of orderKeys) {
                if (!columnKeys.includes(key)) {
                    return false;
                }
            }
        }
        return true;
    }
    checkApplyTokens(object) {
        let transformationsObject = object["TRANSFORMATIONS"];
        if (Array.isArray(transformationsObject) || Object.keys(transformationsObject).length !== 2) {
            return false;
        }
        let applyArray = object["TRANSFORMATIONS"]["APPLY"];
        if (!Array.isArray(applyArray)) {
            return false;
        }
        for (let applyObject of applyArray) {
            for (let key in applyObject) {
                if (Object.keys(applyObject[key]).length !== 1) {
                    return false;
                }
                for (let applyToken in applyObject[key]) {
                    if (applyToken === "MAX" || applyToken === "MIN" || applyToken === "AVG" || applyToken === "SUM") {
                        if (!this.numberKeys.includes(applyObject[key][applyToken])) {
                            return false;
                        }
                    }
                    else if (applyToken === "COUNT") {
                        if (!this.validKeys.includes(applyObject[key][applyToken])) {
                            return false;
                        }
                    }
                    else {
                        return false;
                    }
                }
            }
        }
        return true;
    }
}
exports.default = Helpers;
//# sourceMappingURL=Helpers2.js.map