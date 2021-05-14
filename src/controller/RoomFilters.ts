import Log from "../Util";

export default class RoomFilters {
    constructor() {
        Log.trace("RoomFilters::init()");
    }

    public processLTRoom (query: any, objectKey: any, id: any): boolean {
        for (let key in query) {
            switch (key) {
                case id + "_lat":
                    return objectKey["lat"] < query[id + "_lat"];
                case id + "_lon":
                    return objectKey["lon"] < query[id + "_lon"];
                case id + "_seats":
                    return objectKey["seats"] < query[id + "_seats"];
            }
        }
    }

    public processGTRoom (query: any, objectKey: any, id: any): boolean {
        for (let key in query) {
            switch (key) {
                case id + "_lat":
                    return objectKey["lat"] > query[id + "_lat"];
                case id + "_lon":
                    return objectKey["lon"] > query[id + "_lon"];
                case id + "_seats":
                    return objectKey["seats"] > query[id + "_seats"];
            }
        }
    }

    public processEQRoom (query: any, objectKey: any, id: any): boolean {
        for (let key in query) {
            switch (key) {
                case id + "_lat":
                    return objectKey["lat"] === query[id + "_lat"];
                case id + "_lon":
                    return objectKey["lon"] === query[id + "_lon"];
                case id + "_seats":
                    return objectKey["seats"] === query[id + "_seats"];
            }
        }
    }

    public processISRoom(query: any, objectKey: any, id: any): boolean {
        for (let key in query) {
            if (query[key].includes("*")) {
                return this.processWildCardRoom(query, objectKey, id, key);
            }
            switch (key) {
                case id + "_fullname":
                    return objectKey["fullname"] === query[id + "_fullname"];
                case id + "_shortname":
                    return objectKey["shortname"] === query[id + "_shortname"];
                case id + "_number":
                    return objectKey["number"] === query[id + "_number"];
                case id + "_name":
                    return objectKey["name"] === query[id + "_name"];
                case id + "_address":
                    return objectKey["address"] === query[id + "_address"];
                case id + "_type":
                    return objectKey["type"] === query[id + "_type"];
                case id + "_furniture":
                    return objectKey["furniture"] === query[id + "_furniture"];
                case id + "_href":
                    return objectKey["href"] === query[id + "_href"];
            }
        }
    }

    public processWildCardRoom(query: any, objectKey: any, id: any, key: any): boolean {
        let key1: string = "";
        let key2: string = "";
        switch (key) {
            case id + "_fullname":
                key1 = id + "_fullname";
                key2 = "fullname";
                break;
            case id + "_shortname":
                key1 = id + "_shortname";
                key2 = "shortname";
                break;
            case id + "_number":
                key1 = id + "_number";
                key2 = "number";
                break;
            case id + "_name":
                key1 = id + "_name";
                key2 = "name";
                break;
            case id + "_address":
                key1 = id + "_address";
                key2 = "address";
                break;
            case id + "_type":
                key1 = id + "_type";
                key2 = "type";
                break;
            case id + "_furniture":
                key1 = id + "_furniture";
                key2 = "furniture";
                break;
            case id + "_href":
                key1 = id + "_href";
                key2 = "href";
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
