import Log from "../Util";
import RoomHelpers from "./RoomHelpers";
import CourseHelpers from "./CourseHelpers";
import {InsightDatasetKind} from "./IInsightFacade";
import Helpers2 from "./Helpers2";
export default class Helpers {
    public roomHelpers: RoomHelpers;
    public courseHelpers: CourseHelpers;
    public helpers2: Helpers2;
    constructor() {
        Log.trace("Helpers::init()");
        this.roomHelpers = new RoomHelpers();
        this.courseHelpers = new CourseHelpers();
        this.helpers2 = new Helpers2();
    }

    public filters: string[] = ["AND", "OR", "LT", "GT", "EQ", "IS", "NOT"];

    public sortByCriteria(criteria: any): any {
        return function (a: any, b: any) {

            if (typeof criteria === "string") {
                if (a[criteria] < b[criteria]) {
                    return -1;
                } else if (a[criteria] > b[criteria]) {
                    return 1;
                } else {
                    return 0;
                }
            } else {
                let dir: string = criteria["dir"];
                let keys: string[] = criteria["keys"];
                if (dir === "UP") {
                    return Helpers.sortHelper(a, b, keys);
                } else if (dir === "DOWN") {
                    return Helpers.sortHelper(b, a, keys);
                }
            }
        };
    }

    public static sortHelper(a: any, b: any, keys: any): number {
        if (a[keys[0]] < b[keys[0]]) {
            return -1;
        } else if (a[keys[0]] > b[keys[0]]) {
            return 1;
        } else if (keys.length === 1) {
            return 0;
        } else {
            return this.sortHelper(a, b, keys.slice(1, keys.length));
        }
    }

    public isValidQuery(object: any, datasets: string[], idToKindMap: any) {
        let jsonString: string;
        try {
            jsonString = JSON.stringify(object);
        } catch (e) {
            return false;
        }
        if (!this.isValidQueryHelper(object)) {
            return false;
        }
        let ids: string[] = [];
        this.checkIds(object, ids);
        for (let prefix of ids) {
            if (ids[0] !== prefix) {
                return false;
            }
        }
        let id = ids[0];
        if (!datasets.includes(id)) {
            return false;
        }
        if (idToKindMap[id] === InsightDatasetKind.Rooms) {
            if (!this.roomHelpers.isValidRoomQuery(object, id, jsonString)) {
                return false;
            }
        } else if (idToKindMap[id] === InsightDatasetKind.Courses) {
            if (!this.courseHelpers.isValidCourseQuery(object, id, jsonString)) {
                return false;
            }
        } else {
            return false;
        }
        if (jsonString.indexOf("OR") >= 0 || jsonString.indexOf("AND") >= 0 || jsonString.indexOf("COLUMNS") >= 0) {
            if (!this.checkLogicValues(object, id)) {
                return false;
            }
        }
        if (Array.isArray(object["WHERE"]) || typeof object["WHERE"] !== "object") {
            return false;
        }
        if (!this.helpers2.isValidQueryHelper3(object, id, this.filters, idToKindMap)) {
            return false;
        }
        if (!this.isValidQueryHelper2(object, id)) {
            return false;
        }
        return true;
    }

    public isValidQueryHelper(object: any): boolean {
        let jsonString: string;
        try {
            jsonString = JSON.stringify(object);
        } catch (e) {
            return false;
        }
        if (!object.hasOwnProperty("WHERE") || !object.hasOwnProperty("OPTIONS")
            || jsonString.indexOf("COLUMNS") < 0) {
            return false;
        }
        if (jsonString.indexOf("COLUMNS") >= 0) {
            if (!Array.isArray(object["OPTIONS"]["COLUMNS"]) || object["OPTIONS"]["COLUMNS"].length === 0) {
                return false;
            }
        }
        if (jsonString.indexOf("NOT") >= 0) {
            if (!this.checkNOT(object)) {
                return false;
            }
        }
        for (let key in object["OPTIONS"]) {
            if (key !== "COLUMNS" && key !== "ORDER") {
                return false;
            }
        }
        return true;
    }

    public checkNOT(object: any): boolean {
        for (let item in object) {
            if (object[item] instanceof Object && Object.keys(object[item]).length !== 0 && item !== "NOT") {
                return true && this.checkNOT(object[item]);
            } else {
                if (item === "NOT") {
                    if (Array.isArray(object[item]) || typeof object[item] !== "object" ||
                        Object.keys(object[item]).length !== 1) {
                        return false;
                    }
                    for (let key in object[item]) {
                        if (!this.filters.includes(key)) {
                            return false;
                        }
                    }
                }
            }
            return true;
        }
    }

    public checkLogicValues(object: any, id: any): boolean {
        for (let item in object) {
            if (object[item] instanceof Object && Object.keys(object[item]).length !== 0 &&
                item !== "AND" && item !== "OR" && item !== "COLUMNS") {
                return true && this.checkLogicValues(object[item], id);
            } else {
                if (item === "AND" || item === "OR" || item === "COLUMNS") {
                    if (!Array.isArray(object[item]) || object[item].length === 0) {
                        return false;
                    }
                    if (item === "AND" || item === "OR") {
                        for (let index in object[item]) {
                            for (let element in object[item][index]) {
                                if (!this.filters.includes(element)) {
                                    return false;
                                }
                            }
                        }
                    }
                } else {
                    return true;
                }
                return true;
            }
        }
    }

    public checkIds(object: any, ids: string[]): void {
        for (let item in object) {
            if ((object[item] instanceof Object) && item !== "COLUMNS" &&
                Object.keys(object[item]).length !== 0) {
                this.checkIds(object[item], ids);
            } else {
                let key = item;
                if (key === "COLUMNS") {
                    let keyString: any = object[key][0];
                    if (typeof keyString !== "string") {
                        continue;
                    }
                    let index = keyString.indexOf("_");
                    let prefix = keyString.substring(0, index);
                    ids.push(prefix);
                } else {
                    if (key.includes("_")) {
                        let index = key.indexOf("_");
                        let prefix = key.substring(0, index);
                        ids.push(prefix);
                    }
                }
            }
        }
    }

    public isValidQueryHelper2(object: any, id: string): boolean {
        let jsonString: string;
        try {
            jsonString = JSON.stringify(object);
        } catch (e) {
            return false;
        }
        if (jsonString.indexOf("TRANSFORMATIONS") >= 0) {
            if (jsonString.indexOf("GROUP") === -1 || jsonString.indexOf("APPLY") === -1) {
                return false;
            }
        }
        if (jsonString.indexOf("GROUP") >= 0) {
            let groupKeys: string[] = object["TRANSFORMATIONS"]["GROUP"];
            if (!Array.isArray(groupKeys) || groupKeys.length === 0) {
                return false;
            }
            let applyKeys: string[] = this.getApplyKeys(object);
            let columnKeys: string[] = object["OPTIONS"]["COLUMNS"];
            for (let key of columnKeys) {
                if (!groupKeys.includes(key) && !applyKeys.includes(key)) {
                    return false;
                }
            }
        }
        if (jsonString.indexOf("APPLY") >= 0) {
            let set: any = new Set();
            let applyKeys: string[] = this.getApplyKeys(object);
            for (let key of applyKeys) {
                if (set.has(key)) {
                    return false;
                } else {
                    set.add(key);
                }
            }
        }
        return true;
    }

    public getApplyKeys(object: any): string[] {
        let applyKeys: string[] = [];
        if (object["TRANSFORMATIONS"] === undefined) {
            return applyKeys;
        }
        let applyArray: any[] = object["TRANSFORMATIONS"]["APPLY"];
        for (let applyObject of applyArray) {
            for (let key in applyObject) {
                applyKeys.push(key);
            }
        }
        return applyKeys;
    }

    public processOptions(query: any, compQuery: any, filteredResult: any, id: any): any[] {
        let trimmedResult: any[] = filteredResult;
        let applyKeys = this.getApplyKeys(compQuery);
        let allKeys: any[];
        if (id === "rooms") {
            allKeys =
                [id + "_fullname", id + "_shortname", id + "_number", id + "_name",
                    id + "_address", id + "_type", id + "_furniture", id + "_href",
                    id + "_lat", id + "_lon", id + "_seats"].concat(applyKeys);
        } else {
            allKeys =
                [id + "_dept", id + "_id", id + "_avg", id + "_instructor",
                    id + "_title", id + "_pass", id + "_fail", id + "_audit",
                    id + "_uuid", id + "_year"].concat(applyKeys);
        }
        allKeys = allKeys.filter((item) => query["COLUMNS"].indexOf(item) === -1);
        for (let key of allKeys) {
            for (let result of trimmedResult) {
                delete result[key];
            }
        }
        return trimmedResult;
    }
}
