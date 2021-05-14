import Log from "../Util";
import Decimal from "decimal.js";

export default class Transformations {
    public transformedResult: any;
    public groupKeys: any;
    public applyKeys: any;

    constructor() {
        Log.trace("Transformations::init()");
        this.transformedResult = [];
        this.groupKeys = [];
        this.applyKeys = [];
    }

    public processTransformations(query: any, filteredResult: any, id: any): any[] {
        this.groupKeys = [];
        this.applyKeys = [];
        this.transformedResult = filteredResult;
        if (query === undefined || (query["APPLY"] === undefined && query["GROUP"] === undefined)) {
            return filteredResult;
        }
        for (let result of this.transformedResult) {
            let object: any = {};
            for (let groupKey of query["GROUP"]) {
                object[groupKey] = result[groupKey];
            }
            this.groupKeys.push(object);
        }
        for (let result of this.transformedResult) {
            let object: any = {};
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

    public removeDuplicatesCourses(result: any): any[] {
        let noDup: any;
        noDup = result.reduce((arr: any, item: any) => {
            let exists = !!arr.find((x: any) => x["courses_dept"] === item["courses_dept"]
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

    public removeDuplicatesRooms(result: any): any[] {
        let noDup: any;
        noDup = result.reduce((arr: any, item: any) => {
            let exists = !!arr.find((x: any) => x["rooms_fullname"] === item["rooms_fullname"]
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

    public getOriginalLength(): number {
        if (this.groupKeys !== undefined) {
            return  Object.values(this.groupKeys[0]).length;
        }
        return 0;
    }

    public getStringObject(groupKey: any, stringObjectArrayLength: number): string {
        let stringObjectArrayLength2 = Object.values(groupKey).length;
        let stringObjectArray = Array.from(Object.values(groupKey));
        let stringDiffLength = stringObjectArrayLength2 - stringObjectArrayLength;
        for (let i = 0; i < stringDiffLength; i++) {
            stringObjectArray.pop();
        }
        let stringObject = stringObjectArray.toString();
        return stringObject;
    }

    public processApply(query: any): void {
        let map: Map<string, any> = new Map();
        let stringObject: string = "";
        let tokenKey: string = "";
        const stringObjectArrayLength: number = this.getOriginalLength();
        let copyOfGroupKeys: any = JSON.parse(JSON.stringify(this.groupKeys));
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

    public isSubset(array1: any[], array2: any[]): boolean {
        array2 = Array.from(array2);
        return array2.every((el) => {
            return array1.indexOf(el) !== -1;
        });
    }

    public processTokenValue(tokenKey: any, array: any): number {
        if (array.length === 0) {
            return 0;
        }
        switch (tokenKey) {
            case "MAX":
                return Math.max(...array);
            case "MIN":
                return Math.min(...array);
            case "AVG":
                let count: number = array.length;
                let total: any = new Decimal(0);
                for (let item of array) {
                    total = total.add(new Decimal(item));
                }
                let sumAvg: number = total.toNumber();
                return Number((sumAvg / count).toFixed(2));
            case "COUNT":
                let unique = array.filter(function (elem: any, index: any, self: any) {
                    return index === self.indexOf(elem);
                });
                return unique.length;
            case "SUM":
                let sum: any = new Decimal(0);
                for (let num of array) {
                    sum = sum.add(new Decimal(num));
                }
                return Number(sum.toNumber().toFixed(2));
        }
    }
}
