"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const Util_1 = require("../Util");
class Helpers {
    constructor() {
        Util_1.default.trace("CourseHelpers::init()");
    }
    isValidCourseQuery(object, id, jsonString) {
        if (!this.checkValues(object, id) || !this.checkCOLUMNS(object, id)) {
            return false;
        }
        if (jsonString.indexOf("LT") >= 0 || jsonString.indexOf("GT") >= 0 || jsonString.indexOf("EQ") >= 0
            || jsonString.indexOf("IS") >= 0) {
            if (!this.checkMComparator(object, id)) {
                return false;
            }
        }
        return true;
    }
    checkCOLUMNS(object, id) {
        let value = object["OPTIONS"]["COLUMNS"];
        if (!Array.isArray(value) || value.length === 0) {
            return false;
        }
        return true;
    }
    checkMComparator(object, id) {
        for (let item in object) {
            if (object[item] instanceof Object && item !== "LT" && item !== "GT" && item !== "EQ" && item !== "IS") {
                return true && this.checkMComparator(object[item], id);
            }
            else {
                if (item === "LT" || item === "GT" || item === "EQ" || item === "IS") {
                    if (Array.isArray(object[item]) || Object.keys(object[item]).length !== 1 ||
                        typeof object[item] === "string") {
                        return false;
                    }
                    if (item === "LT" || item === "GT" || item === "EQ") {
                        for (let key in object[item]) {
                            if (key !== id + "_" + "avg" && key !== id + "_" + "pass" && key !== id + "_" + "fail" &&
                                key !== id + "_" + "audit" && key !== id + "_" + "year") {
                                return false;
                            }
                        }
                    }
                    if (item === "IS") {
                        for (let key in object[item]) {
                            if (key !== id + "_" + "dept" && key !== id + "_" + "id" &&
                                key !== id + "_" + "instructor" &&
                                key !== id + "_" + "title" && key !== id + "_" + "uuid") {
                                return false;
                            }
                        }
                    }
                }
                else {
                    return true;
                }
                return true;
            }
        }
    }
    checkValues(object, id) {
        for (let item in object) {
            if (object[item] instanceof Object &&
                Object.keys(object[item]).length !== 0) {
                return true && this.checkValues(object[item], id);
            }
            else {
                switch (item) {
                    case id + "_" + "dept":
                        return typeof object[item] === "string";
                        break;
                    case id + "_" + "id":
                        return typeof object[item] === "string";
                        break;
                    case id + "_" + "avg":
                        return typeof object[item] === "number";
                        break;
                    case id + "_" + "instructor":
                        return typeof object[item] === "string";
                        break;
                    case id + "_" + "title":
                        return typeof object[item] === "string";
                        break;
                    case id + "_" + "pass":
                        return typeof object[item] === "number";
                        break;
                    case id + "_" + "fail":
                        return typeof object[item] === "number";
                        break;
                    case id + "_" + "audit":
                        return typeof object[item] === "number";
                        break;
                    case id + "_" + "uuid":
                        return typeof object[item] === "string";
                        break;
                    case id + "_" + "year":
                        return typeof object[item] === "number";
                        break;
                    default:
                        return true;
                }
            }
        }
    }
}
exports.default = Helpers;
//# sourceMappingURL=CourseHelpers.js.map