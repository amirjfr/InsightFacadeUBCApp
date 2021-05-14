import Log from "../Util";
import RoomFilters from "./RoomFilters";
export default class Filters {
    public roomFilters: RoomFilters;
    constructor() {
        Log.trace("Filters::init()");
        this.roomFilters = new RoomFilters();
    }

    public processFilters (query: any, objectKey: any, id: any): boolean {
        let that = this;
        for (let key in query) {
            switch (key) {
                case "AND":
                    return that.processAND(query[key], objectKey, id);
                case "OR":
                    return that.processOR(query[key], objectKey, id);
                case "LT":
                    return that.processLT(query[key], objectKey, id);
                case "GT":
                    return that.processGT(query[key], objectKey, id);
                case "EQ":
                    return that.processEQ(query[key], objectKey, id);
                case "IS":
                    return that.processIS(query[key], objectKey, id);
                case "NOT":
                    return !that.processFilters(query[key], objectKey, id);
                default:
                    return that.processFilters(query[key], objectKey, id);
            }
        }
    }

    public processAND (query: any, objectKey: any, id: any): boolean {
        let that = this;
        let result: boolean;
        for (let i of query) {
            if (result === undefined) {
                result = that.processFilters(i, objectKey, id);
            } else {
                result = result && that.processFilters(i, objectKey, id);
            }
        }
        return result;
    }

    public processOR (query: any, objectKey: any, id: any): boolean {
        let that = this;
        let result: boolean;
        for (let i of query) {
            if (result === undefined) {
                result = that.processFilters(i, objectKey, id);
            } else {
                result = result || that.processFilters(i, objectKey, id);
            }
        }
        return result;
    }

    public processLT (query: any, objectKey: any, id: any): boolean {
        if (id === "rooms") {
            return this.roomFilters.processLTRoom(query, objectKey, id);
        } else {
            for (let key in query) {
                switch (key) {
                    case id + "_avg":
                        return objectKey["avg"] < query[id + "_avg"];
                    case id + "_pass":
                        return objectKey["pass"] < query[id + "_pass"];
                    case id + "_fail":
                        return objectKey["fail"] < query[id + "_fail"];
                    case id + "_audit":
                        return objectKey["audit"] < query[id + "_audit"];
                    case id + "_year":
                        return objectKey["year"] < query[id + "_year"];
                }
            }
        }
    }

    public processGT (query: any, objectKey: any, id: any): boolean {
        if (id === "rooms") {
            return this.roomFilters.processGTRoom(query, objectKey, id);
        } else {
            for (let key in query) {
                switch (key) {
                    case id + "_avg":
                        return objectKey["avg"] > query[id + "_avg"];
                    case id + "_pass":
                        return objectKey["pass"] > query[id + "_pass"];
                    case id + "_fail":
                        return objectKey["fail"] > query[id + "_fail"];
                    case id + "_audit":
                        return objectKey["audit"] > query[id + "_audit"];
                    case id + "_year":
                        return objectKey["year"] > query[id + "_year"];
                }
            }
        }
    }

    public processEQ (query: any, objectKey: any, id: any): boolean {
        if (id === "rooms") {
            return this.roomFilters.processEQRoom(query, objectKey, id);
        } else {
            for (let key in query) {
                switch (key) {
                    case id + "_avg":
                        return objectKey["avg"] === query[id + "_avg"];
                    case id + "_pass":
                        return objectKey["pass"] === query[id + "_pass"];
                    case id + "_fail":
                        return objectKey["fail"] === query[id + "_fail"];
                    case id + "_audit":
                        return objectKey["audit"] === query[id + "_audit"];
                    case id + "_year":
                        return objectKey["year"] === query[id + "_year"];
                }
            }
        }
    }

    public processIS (query: any, objectKey: any, id: any): boolean {
        if (id === "rooms") {
            return this.roomFilters.processISRoom(query, objectKey, id);
        } else {
            for (let key in query) {
                if (query[key].includes("*")) {
                    return this.processWildCard(query, objectKey, id, key);
                }
                switch (key) {
                    case id + "_id":
                        return objectKey["id"] === query[id + "_id"];
                    case id + "_uuid":
                        return objectKey["uuid"] === query[id + "_uuid"];
                    case id + "_dept":
                        return objectKey["dept"] === query[id + "_dept"];
                    case id + "_title":
                        return objectKey["title"] === query[id + "_title"];
                    case id + "_instructor":
                        return objectKey["instructor"] === query[id + "_instructor"];
                }
            }
        }
    }

    public processWildCard (query: any, objectKey: any, id: any, key: any): boolean {
        let key1: string = "";
        let key2: string = "";
        switch (key) {
            case id + "_id":
                key1 = id + "_id";
                key2 = "id";
                break;
            case id + "_uuid":
                key1 = id + "_uuid";
                key2 = "uuid";
                break;
            case id + "_dept":
                key1 = id + "_dept";
                key2 = "dept";
                break;
            case id + "_title":
                key1 = id + "_title";
                key2 = "title";
                break;
            case id + "_instructor":
                key1 = id + "_instructor";
                key2 = "instructor";
                break;
        }
        if (query[key1].length > 1 && query[key1].startsWith("*") && query[key1].endsWith("*")) {
            let queryString = query[key1].split("*");
            return objectKey[key2].includes(queryString[1]);
        } else if (query[key1].startsWith("*")) {
            let queryString = query[key1].split("*");
            return objectKey[key2].endsWith(queryString[1]);
        } else if (query[key1].endsWith("*")) {
            let queryString = query[key1].split("*");
            return objectKey[key2].startsWith(queryString[0]);
        }
    }
}
