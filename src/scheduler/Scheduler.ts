import {IScheduler, SchedRoom, SchedSection, TimeSlot} from "./IScheduler";

export default class Scheduler implements IScheduler {
    public timeSlots: string[] = ["MWF 0800-0900", "MWF 0900-1000", "MWF 1000-1100",
        "MWF 1100-1200", "MWF 1200-1300", "MWF 1300-1400",
        "MWF 1400-1500", "MWF 1500-1600", "MWF 1600-1700",
        "TR  0800-0930", "TR  0930-1100", "TR  1100-1230",
        "TR  1230-1400", "TR  1400-1530", "TR  1530-1700"];

    public roomsMap: Map<any, any> = new Map();

    public schedule(sections: SchedSection[], rooms: SchedRoom[]): Array<[SchedRoom, SchedSection, TimeSlot]> {
    this.roomsMap = new Map();
        // TODO Implement this
    let result: any = [];
    sections.sort(this.compareSections);
    rooms.sort(this.compareRooms);
    let i = 0;
    this.getRoomsMap(rooms);
    // sections.forEach((section) => {
    //         result.push([rooms[i % rooms.length], section, this.timeSlots[i % this.timeSlots.length]]);
    //         i++;
    //     });
    this.scheduleFirstSection(result, sections.shift(), rooms);
    this.getRelativeDistances(result[0][0], rooms);
    rooms.sort(this.compareDistance);
    this.scheduleOtherSections(result, sections, rooms);
    this.deleteDistance(result);
    return result;
    }

    public deleteDistance(result: any): void {
        for (let res of result) {
            delete res[0]["distance"];
        }
    }

    public scheduleFirstSection(result: any , section: any, rooms: SchedRoom[]): void {
        for (let room of rooms) {
            if (Scheduler.sectionSize(section) <= room["rooms_seats"]) {
                let timeSlots = this.roomsMap.get(room["rooms_shortname"] + room["rooms_number"])[0];
                let timeSlot = timeSlots.shift();
                result.push([room, section, timeSlot]);
                return;
            }
        }
    }

    public scheduleOtherSections(result: any , sections: SchedSection[], rooms: SchedRoom[]): void {
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

    public getRelativeDistances(firstRoom: any, rooms: any): void {
        for (let room of rooms) {
            room["distance"] = Scheduler.calculateDistance(room, firstRoom);
        }
    }

    public getRoomsMap(rooms: SchedRoom[]): void {
        for (let room of rooms) {
            this.roomsMap.set(room["rooms_shortname"] + room["rooms_number"],
                [JSON.parse(JSON.stringify(this.timeSlots)), room["rooms_seats"]]);
        }
    }

    // sort by largest to smallest enrollment
    public compareSections(a: any, b: any): any {
        let aSize: number = Scheduler.sectionSize(a);
        let bSize: number = Scheduler.sectionSize(b);
        if (aSize > bSize) {
            return -1;
        } else if (aSize < bSize) {
            return 1;
        } else {
            return 0;
        }
    }

    // sort by largest to smallest number of seats
    public compareRooms(a: any, b: any): any {
        let aSize: number = a["rooms_seats"];
        let bSize: number = b["rooms_seats"];
        if (aSize > bSize) {
            return -1;
        } else if (aSize < bSize) {
            return 1;
        } else {
            return 0;
        }
    }

    // sort rooms by distance
    public compareDistance(a: any, b: any): any {
        let aSize: number = a["distance"];
        let bSize: number = b["distance"];
        if (aSize < bSize) {
            return -1;
        } else if (aSize > bSize) {
            return 1;
        } else {
            return 0;
        }
    }


    public static sectionSize(section: any): number {
        let sum: number = section["courses_pass"] + section["courses_fail"] + section["courses_audit"];
        return sum;
    }

    // haversine code from https://www.movable-type.co.uk/scripts/latlong.html
    public static calculateDistance(a: any, b: any): any {
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
