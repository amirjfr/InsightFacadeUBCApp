"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class Scheduler {
    constructor() {
        this.timeSlots = ["MWF 0800-0900", "MWF 0900-1000", "MWF 1000-1100",
            "MWF 1100-1200", "MWF 1200-1300", "MWF 1300-1400",
            "MWF 1400-1500", "MWF 1500-1600", "MWF 1600-1700",
            "TR  0800-0930", "TR  0930-1100", "TR  1100-1230",
            "TR  1230-1400", "TR  1400-1530", "TR  1530-1700"];
        this.roomsMap = new Map();
    }
    schedule(sections, rooms) {
        this.roomsMap = new Map();
        let result = [];
        sections.sort(this.compareSections);
        rooms.sort(this.compareRooms);
        let i = 0;
        this.getRoomsMap(rooms);
        this.scheduleFirstSection(result, sections.shift(), rooms);
        this.getRelativeDistances(result[0][0], rooms);
        rooms.sort(this.compareDistance);
        this.scheduleOtherSections(result, sections, rooms);
        this.deleteDistance(result);
        return result;
    }
    deleteDistance(result) {
        for (let res of result) {
            delete res[0]["distance"];
        }
    }
    scheduleFirstSection(result, section, rooms) {
        for (let room of rooms) {
            if (Scheduler.sectionSize(section) <= room["rooms_seats"]) {
                let timeSlots = this.roomsMap.get(room["rooms_shortname"] + room["rooms_number"])[0];
                let timeSlot = timeSlots.shift();
                result.push([room, section, timeSlot]);
                return;
            }
        }
    }
    scheduleOtherSections(result, sections, rooms) {
        for (let section of sections) {
            for (let room of rooms) {
                if (Scheduler.sectionSize(section) <= room["rooms_seats"]) {
                    let timeSlots = this.roomsMap.get(room["rooms_shortname"] + room["rooms_number"])[0];
                    if (timeSlots.length !== 0) {
                        let timeSlot = timeSlots.shift();
                        result.push([room, section, timeSlot]);
                        break;
                    }
                }
            }
        }
    }
    getRelativeDistances(firstRoom, rooms) {
        for (let room of rooms) {
            room["distance"] = Scheduler.calculateDistance(room, firstRoom);
        }
    }
    getRoomsMap(rooms) {
        for (let room of rooms) {
            this.roomsMap.set(room["rooms_shortname"] + room["rooms_number"], [JSON.parse(JSON.stringify(this.timeSlots)), room["rooms_seats"]]);
        }
    }
    compareSections(a, b) {
        let aSize = Scheduler.sectionSize(a);
        let bSize = Scheduler.sectionSize(b);
        if (aSize > bSize) {
            return -1;
        }
        else if (aSize < bSize) {
            return 1;
        }
        else {
            return 0;
        }
    }
    compareRooms(a, b) {
        let aSize = a["rooms_seats"];
        let bSize = b["rooms_seats"];
        if (aSize > bSize) {
            return -1;
        }
        else if (aSize < bSize) {
            return 1;
        }
        else {
            return 0;
        }
    }
    compareDistance(a, b) {
        let aSize = a["distance"];
        let bSize = b["distance"];
        if (aSize < bSize) {
            return -1;
        }
        else if (aSize > bSize) {
            return 1;
        }
        else {
            return 0;
        }
    }
    static sectionSize(section) {
        let sum = section["courses_pass"] + section["courses_fail"] + section["courses_audit"];
        return sum;
    }
    static calculateDistance(a, b) {
        let latA = a["rooms_lat"];
        let latB = b["rooms_lat"];
        let lonA = a["rooms_lon"];
        let lonB = b["rooms_lon"];
        const earthRadius = 6371e3;
        let phi1 = latA * Math.PI / 180;
        let phi2 = latB * Math.PI / 180;
        let deltaPhi = (latB - latA) * Math.PI / 180;
        let deltaLambda = (lonB - lonA) * Math.PI / 180;
        let alpha = Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) +
            Math.cos(phi1) * Math.cos(phi2) *
                Math.sin(deltaLambda / 2) * Math.sin(deltaLambda / 2);
        let beta = 2 * Math.atan2(Math.sqrt(alpha), Math.sqrt(1 - alpha));
        let distance = earthRadius * beta;
        return distance;
    }
}
exports.default = Scheduler;
//# sourceMappingURL=Scheduler.js.map