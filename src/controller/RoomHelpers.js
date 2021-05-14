"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const Util_1 = require("../Util");
class Helpers {
    constructor() {
        Util_1.default.trace("RoomHelpers::init()");
    }
    isValidRoomQuery(object, id, jsonString) {
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
                            if (key !== id + "_" + "lat" && key !== id + "_" + "lon" && key !== id + "_" + "seats") {
                                return false;
                            }
                        }
                    }
                    if (item === "IS") {
                        for (let key in object[item]) {
                            if (key !== id + "_" + "fullname" && key !== id + "_" + "shortname" &&
                                key !== id + "_" + "number" && key !== id + "_" + "name" &&
                                key !== id + "_" + "address" &&
                                key !== id + "_" + "type" && key !== id + "_" + "furniture" &&
                                key !== id + "_" + "href") {
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
                    case id + "_" + "fullname":
                        return typeof object[item] === "string";
                        break;
                    case id + "_" + "shortname":
                        return typeof object[item] === "string";
                        break;
                    case id + "_" + "name":
                        return typeof object[item] === "string";
                        break;
                    case id + "_" + "address":
                        return typeof object[item] === "string";
                        break;
                    case id + "_" + "lat":
                        return typeof object[item] === "number";
                        break;
                    case id + "_" + "lon":
                        return typeof object[item] === "number";
                        break;
                    case id + "_" + "seats":
                        return typeof object[item] === "number";
                        break;
                    case id + "_" + "type":
                        return typeof object[item] === "string";
                        break;
                    case id + "_" + "furniture":
                        return typeof object[item] === "string";
                        break;
                    case id + "_" + "href":
                        return typeof object[item] === "string";
                        break;
                    default:
                        return true;
                }
            }
        }
    }
}
exports.default = Helpers;
//# sourceMappingURL=RoomHelpers.js.map