"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const Util_1 = require("../Util");
const decimal_js_1 = require("decimal.js");
class Transformations {
    constructor() {
        Util_1.default.trace("Transformations::init()");
        this.transformedResult = [];
        this.groupKeys = [];
        this.applyKeys = [];
    }
    processTransformations(query, filteredResult, id) {
        this.groupKeys = [];
        this.applyKeys = [];
        this.transformedResult = filteredResult;
        if (query === undefined || (query["APPLY"] === undefined && query["GROUP"] === undefined)) {
            return filteredResult;
        }
        for (let result of this.transformedResult) {
            let object = {};
            for (let groupKey of query["GROUP"]) {
                object[groupKey] = result[groupKey];
            }
            this.groupKeys.push(object);
        }
        for (let result of this.transformedResult) {
            let object = {};
            for (let groupKey of query["GROUP"]) {
                object[groupKey] = result[groupKey];
            }
            for (let applyKey of query["APPLY"]) {
                let applyObject = Object.values(applyKey)[0];
                let tokenValue = Object.values(applyObject)[0];
                object[tokenValue] = result[tokenValue];
            }
            this.applyKeys.push(object);
        }
        if (id === "courses") {
            this.groupKeys = this.removeDuplicatesCourses(this.groupKeys);
        }
        this.processApply(query["APPLY"]);
        if (id === "rooms") {
            this.groupKeys = this.removeDuplicatesRooms(this.groupKeys);
        }
        return this.groupKeys;
    }
    removeDuplicatesCourses(result) {
        let noDup;
        noDup = result.reduce((arr, item) => {
            let exists = !!arr.find((x) => x["courses_dept"] === item["courses_dept"]
                && x["courses_id"] === item["courses_id"]
                && x["courses_title"] === item["courses_title"]
                && x["courses_avg"] === item["courses_avg"]
                && x["courses_pass"] === item["courses_pass"]
                && x["courses_fail"] === item["courses_fail"]
                && x["courses_audit"] === item["courses_audit"]
                && x["courses_uuid"] === item["courses_uuid"]
                && x["courses_year"] === item["courses_year"]
                && x["courses_instructor"] === item["courses_instructor"]);
            if (!exists) {
                arr.push(item);
            }
            return arr;
        }, []);
        return noDup;
    }
    removeDuplicatesRooms(result) {
        let noDup;
        noDup = result.reduce((arr, item) => {
            let exists = !!arr.find((x) => x["rooms_fullname"] === item["rooms_fullname"]
                && x["rooms_shortname"] === item["rooms_shortname"]
                && x["rooms_number"] === item["rooms_number"]
                && x["rooms_name"] === item["rooms_name"]
                && x["rooms_address"] === item["rooms_address"]
                && x["rooms_lat"] === item["rooms_lat"]
                && x["rooms_lon"] === item["rooms_lon"]
                && x["rooms_seats"] === item["rooms_seats"]
                && x["rooms_type"] === item["rooms_type"]
                && x["rooms_furniture"] === item["rooms_furniture"]
                && x["rooms_href"] === item["rooms_href"]);
            if (!exists) {
                arr.push(item);
            }
            return arr;
        }, []);
        return noDup;
    }
    getOriginalLength() {
        if (this.groupKeys !== undefined) {
            return Object.values(this.groupKeys[0]).length;
        }
        return 0;
    }
    getStringObject(groupKey, stringObjectArrayLength) {
        let stringObjectArrayLength2 = Object.values(groupKey).length;
        let stringObjectArray = Array.from(Object.values(groupKey));
        let stringDiffLength = stringObjectArrayLength2 - stringObjectArrayLength;
        for (let i = 0; i < stringDiffLength; i++) {
            stringObjectArray.pop();
        }
        let stringObject = stringObjectArray.toString();
        return stringObject;
    }
    processApply(query) {
        let map = new Map();
        let stringObject = "";
        let tokenKey = "";
        const stringObjectArrayLength = this.getOriginalLength();
        let copyOfGroupKeys = JSON.parse(JSON.stringify(this.groupKeys));
        for (let key of query) {
            for (let groupKey of copyOfGroupKeys) {
                stringObject = this.getStringObject(groupKey, stringObjectArrayLength);
                map.set(stringObject, []);
            }
            let columnTitle = Object.keys(key)[0];
            let applyObject = Object.values(key)[0];
            tokenKey = Object.keys(applyObject)[0];
            let tokenValue = Object.values(applyObject)[0];
            for (let applyKey of this.applyKeys) {
                let stringObjectArray = Array.from(Object.values(applyKey));
                let stringObjectArrayLength2 = stringObjectArray.length;
                let stringDiffLength = stringObjectArrayLength2 - stringObjectArrayLength;
                for (let i = 0; i < stringDiffLength; i++) {
                    stringObjectArray.pop();
                }
                let findKey = stringObjectArray.toString();
                let mapValue = map.get(findKey);
                if (mapValue === undefined) {
                    continue;
                }
                mapValue.push(applyKey[tokenValue]);
            }
            for (let groupKey of copyOfGroupKeys) {
                let stringObjectArray = Array.from(Object.values(groupKey));
                let findKey = stringObjectArray.toString();
                let valueArray = Array.from(map.get(findKey));
                let index = copyOfGroupKeys.indexOf(groupKey);
                this.groupKeys[index][columnTitle] = this.processTokenValue(tokenKey, valueArray);
            }
        }
    }
    isSubset(array1, array2) {
        array2 = Array.from(array2);
        return array2.every((el) => {
            return array1.indexOf(el) !== -1;
        });
    }
    processTokenValue(tokenKey, array) {
        if (array.length === 0) {
            return 0;
        }
        switch (tokenKey) {
            case "MAX":
                return Math.max(...array);
            case "MIN":
                return Math.min(...array);
            case "AVG":
                let count = array.length;
                let total = new decimal_js_1.default(0);
                for (let item of array) {
                    total = total.add(new decimal_js_1.default(item));
                }
                let sumAvg = total.toNumber();
                return Number((sumAvg / count).toFixed(2));
            case "COUNT":
                let unique = array.filter(function (elem, index, self) {
                    return index === self.indexOf(elem);
                });
                return unique.length;
            case "SUM":
                let sum = new decimal_js_1.default(0);
                for (let num of array) {
                    sum = sum.add(new decimal_js_1.default(num));
                }
                return Number(sum.toNumber().toFixed(2));
        }
    }
}
exports.default = Transformations;
//# sourceMappingURL=Transformations.js.map