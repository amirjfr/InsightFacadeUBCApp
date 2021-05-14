"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const chai_1 = require("chai");
const chai = require("chai");
const chaiAsPromised = require("chai-as-promised");
const Scheduler_1 = require("../src/scheduler/Scheduler");
const Util_1 = require("../src/Util");
let sections = [
    {
        courses_dept: "cpsc",
        courses_id: "340",
        courses_uuid: "1319",
        courses_pass: 101,
        courses_fail: 7,
        courses_audit: 2
    },
    {
        courses_dept: "cpsc",
        courses_id: "340",
        courses_uuid: "3397",
        courses_pass: 171,
        courses_fail: 3,
        courses_audit: 1
    },
    {
        courses_dept: "cpsc",
        courses_id: "344",
        courses_uuid: "62413",
        courses_pass: 93,
        courses_fail: 2,
        courses_audit: 0
    },
    {
        courses_dept: "cpsc",
        courses_id: "344",
        courses_uuid: "72385",
        courses_pass: 43,
        courses_fail: 1,
        courses_audit: 0
    }
];
let rooms = [
    {
        rooms_shortname: "AERL",
        rooms_number: "120",
        rooms_seats: 144,
        rooms_lat: 49.26372,
        rooms_lon: -123.25099
    },
    {
        rooms_shortname: "ALRD",
        rooms_number: "105",
        rooms_seats: 94,
        rooms_lat: 49.2699,
        rooms_lon: -123.25318
    },
    {
        rooms_shortname: "ANGU",
        rooms_number: "098",
        rooms_seats: 260,
        rooms_lat: 49.26486,
        rooms_lon: -123.25364
    },
    {
        rooms_shortname: "BUCH",
        rooms_number: "A101",
        rooms_seats: 275,
        rooms_lat: 49.26826,
        rooms_lon: -123.25468
    }
];
let output = [[{ rooms_shortname: "AERL",
            rooms_number: "120",
            rooms_seats: 144,
            rooms_lat: 49.26372,
            rooms_lon: -123.25099 },
        { courses_dept: "cpsc",
            courses_id: "340",
            courses_uuid: "1319",
            courses_pass: 101,
            courses_fail: 7,
            courses_audit: 2 },
        "MWF 0800-0900"],
    [{ rooms_shortname: "ANGU",
            rooms_number: "098",
            rooms_seats: 260,
            rooms_lat: 49.26486,
            rooms_lon: -123.25364 },
        { courses_dept: "cpsc",
            courses_id: "340",
            courses_uuid: "3397",
            courses_pass: 171,
            courses_fail: 3,
            courses_audit: 1 },
        "MWF 0900-1000"],
    [{ rooms_shortname: "BUCH",
            rooms_number: "A101",
            rooms_seats: 275,
            rooms_lat: 49.26826,
            rooms_lon: -123.25468 },
        { courses_dept: "cpsc",
            courses_id: "344",
            courses_uuid: "62413",
            courses_pass: 93,
            courses_fail: 2,
            courses_audit: 0 },
        "MWF 0800-0900"],
    [{ rooms_shortname: "ALRD",
            rooms_number: "105",
            rooms_seats: 94,
            rooms_lat: 49.2699,
            rooms_lon: -123.25318 },
        { courses_dept: "cpsc",
            courses_id: "344",
            courses_uuid: "72385",
            courses_pass: 43,
            courses_fail: 1,
            courses_audit: 0 },
        "MWF 0900-1000"]];
describe("Scheduler schedule", function () {
    before(function () {
        Util_1.default.test(`Before all`);
        chai.use(chaiAsPromised);
    });
    beforeEach(function () {
        Util_1.default.test(`BeforeTest: ${this.currentTest.title}`);
    });
    after(function () {
        Util_1.default.test(`After: ${this.test.parent.title}`);
    });
    afterEach(function () {
        Util_1.default.test(`AfterTest: ${this.currentTest.title}`);
    });
    it("Should return sample output", function () {
        let scheduler = new Scheduler_1.default();
        let result = scheduler.schedule(sections, rooms);
        chai_1.expect(result).to.deep.equal(output);
    });
    it("Should return one tuple", function () {
        let scheduler = new Scheduler_1.default();
        let smallSections = [{
                courses_dept: "cpsc",
                courses_id: "340",
                courses_uuid: "1319",
                courses_pass: 101,
                courses_fail: 7,
                courses_audit: 2
            }];
        let smallRooms = [{
                rooms_shortname: "AERL",
                rooms_number: "120",
                rooms_seats: 144,
                rooms_lat: 49.26372,
                rooms_lon: -123.25099
            }];
        let expectedResult = [[
                { rooms_shortname: "AERL",
                    rooms_number: "120",
                    rooms_seats: 144,
                    rooms_lat: 49.26372,
                    rooms_lon: -123.25099 },
                { courses_dept: "cpsc",
                    courses_id: "340",
                    courses_uuid: "1319",
                    courses_pass: 101,
                    courses_fail: 7,
                    courses_audit: 2 },
                "MWF 0800-0900"
            ]];
        let result = scheduler.schedule(smallSections, smallRooms);
        chai_1.expect(result).to.deep.equal(expectedResult);
    });
});
//# sourceMappingURL=Scheduler.spec.js.map