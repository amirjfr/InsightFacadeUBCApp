"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const Server_1 = require("../src/rest/Server");
const InsightFacade_1 = require("../src/controller/InsightFacade");
const chai = require("chai");
const chaiHttp = require("chai-http");
const chai_1 = require("chai");
const Util_1 = require("../src/Util");
const fs = require("fs");
describe("Facade D3", function () {
    let facade = null;
    let server = null;
    let SERVER_URL = "http://localhost:4321";
    chai.use(chaiHttp);
    before(function () {
        facade = new InsightFacade_1.default();
        server = new Server_1.default(4321);
        server.start().catch((err) => {
            Util_1.default.error(err);
        });
    });
    after(function () {
        server.stop().catch((err) => {
            Util_1.default.error(err);
        });
    });
    beforeEach(function () {
    });
    afterEach(function () {
    });
    it("POST query test for dataset not added", function () {
        let ENDPOINT_URL = "/query";
        let query = {
            WHERE: {
                AND: [
                    {
                        IS: {
                            courses_dept: "busi"
                        }
                    },
                    {
                        EQ: {
                            courses_avg: 50
                        }
                    }
                ]
            },
            OPTIONS: {
                COLUMNS: [
                    "courses_avg",
                    "courses_dept"
                ],
                ORDER: "courses_avg"
            }
        };
        try {
            return chai.request(SERVER_URL)
                .post(ENDPOINT_URL)
                .send(query)
                .then(function (res) {
                chai_1.expect.fail();
            })
                .catch(function (err) {
                Util_1.default.trace(err);
                chai_1.expect(err.status).to.be.equal(400);
            });
        }
        catch (err) {
            Util_1.default.trace(err);
        }
    });
    it("PUT test for courses dataset", function () {
        let ENDPOINT_URL = "/dataset/courses/courses";
        let ZIP_FILE_DATA = fs.readFileSync("./test/data/courses.zip");
        try {
            return chai.request(SERVER_URL)
                .put(ENDPOINT_URL)
                .send(ZIP_FILE_DATA)
                .set("Content-Type", "application/x-zip-compressed")
                .then(function (res) {
                chai_1.expect(res.status).to.be.equal(200);
            })
                .catch(function (err) {
                Util_1.default.trace(err);
                chai_1.expect.fail();
            });
        }
        catch (err) {
            Util_1.default.trace(err);
        }
    });
    it("GET datasets test for courses", function () {
        let ENDPOINT_URL = "/datasets";
        try {
            return chai.request(SERVER_URL)
                .get(ENDPOINT_URL)
                .then(function (res) {
                chai_1.expect(res.status).to.be.equal(200);
            })
                .catch(function (err) {
                Util_1.default.trace(err);
                chai_1.expect.fail();
            });
        }
        catch (err) {
            Util_1.default.trace(err);
        }
    });
    it("POST query test for courses dataset", function () {
        let ENDPOINT_URL = "/query";
        let query = {
            WHERE: {
                AND: [
                    {
                        IS: {
                            courses_dept: "busi"
                        }
                    },
                    {
                        EQ: {
                            courses_avg: 50
                        }
                    }
                ]
            },
            OPTIONS: {
                COLUMNS: [
                    "courses_avg",
                    "courses_dept"
                ],
                ORDER: "courses_avg"
            }
        };
        try {
            return chai.request(SERVER_URL)
                .post(ENDPOINT_URL)
                .send(query)
                .then(function (res) {
                chai_1.expect(res.status).to.be.equal(200);
            })
                .catch(function (err) {
                Util_1.default.trace(err);
                chai_1.expect.fail();
            });
        }
        catch (err) {
            Util_1.default.trace(err);
        }
    });
    it("PUT test for invalid dataset", function () {
        let ENDPOINT_URL = "/dataset/_courses_/courses";
        let ZIP_FILE_DATA = fs.readFileSync("./test/data/courses.zip");
        try {
            return chai.request(SERVER_URL)
                .put(ENDPOINT_URL)
                .send(ZIP_FILE_DATA)
                .set("Content-Type", "application/x-zip-compressed")
                .then(function (res) {
                chai_1.expect.fail();
            })
                .catch(function (err) {
                Util_1.default.trace(err);
                chai_1.expect(err.status).to.be.equal(400);
            });
        }
        catch (err) {
            Util_1.default.trace(err);
            chai_1.expect.fail();
        }
    });
    it("DELETE test for courses dataset", function () {
        let ENDPOINT_URL = "/dataset/courses";
        try {
            return chai.request(SERVER_URL)
                .del(ENDPOINT_URL)
                .then(function (res) {
                chai_1.expect(res.status).to.be.equal(200);
            })
                .catch(function (err) {
                Util_1.default.trace(err);
                chai_1.expect.fail();
            });
        }
        catch (err) {
            Util_1.default.trace(err);
        }
    });
    it("DELETE test for dataset not found", function () {
        let ENDPOINT_URL = "/dataset/courses";
        try {
            return chai.request(SERVER_URL)
                .del(ENDPOINT_URL)
                .then(function (res) {
                chai_1.expect.fail();
            })
                .catch(function (err) {
                Util_1.default.trace(err);
                chai_1.expect(err.status).to.be.equal(404);
            });
        }
        catch (err) {
            Util_1.default.trace(err);
        }
    });
    it("DELETE test error", function () {
        let ENDPOINT_URL = "/dataset/_courses_";
        try {
            return chai.request(SERVER_URL)
                .del(ENDPOINT_URL)
                .then(function (res) {
                chai_1.expect.fail();
            })
                .catch(function (err) {
                Util_1.default.trace(err);
                chai_1.expect(err.status).to.be.equal(400);
            });
        }
        catch (err) {
            Util_1.default.trace(err);
        }
    });
});
//# sourceMappingURL=Server.spec.js.map