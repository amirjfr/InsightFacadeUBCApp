import Server from "../src/rest/Server";

import InsightFacade from "../src/controller/InsightFacade";
import chai = require("chai");
import chaiHttp = require("chai-http");
import Response = ChaiHttp.Response;
import {expect} from "chai";
import Log from "../src/Util";
import * as fs from "fs";

describe("Facade D3", function () {

    let facade: InsightFacade = null;
    let server: Server = null;
    let SERVER_URL: string = "http://localhost:4321";

    chai.use(chaiHttp);

    before(function () {
        facade = new InsightFacade();
        server = new Server(4321);
        server.start().catch((err) => {
            Log.error(err);
        });
    });

    after(function () {
        server.stop().catch((err) => {
            Log.error(err);
        });
    });

    beforeEach(function () {
        // might want to add some process logging here to keep track of what"s going on
    });

    afterEach(function () {
        // might want to add some process logging here to keep track of what"s going on
    });

    // Sample on how to format PUT requests
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
                .then(function (res: Response) {
                    expect.fail();
                })
                .catch(function (err) {
                    Log.trace(err);
                    expect(err.status).to.be.equal(400);
                });
        } catch (err) {
            Log.trace(err);
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
                .then(function (res: Response) {
                    expect(res.status).to.be.equal(200);
                })
                .catch(function (err) {
                    Log.trace(err);
                    expect.fail();
                });
        } catch (err) {
            Log.trace(err);
        }
    });

    it("GET datasets test for courses", function () {
        let ENDPOINT_URL = "/datasets";
        try {
            return chai.request(SERVER_URL)
                .get(ENDPOINT_URL)
                .then(function (res: Response) {
                    expect(res.status).to.be.equal(200);
                })
                .catch(function (err) {
                    Log.trace(err);
                    expect.fail();
                });
        } catch (err) {
            Log.trace(err);
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
                .then(function (res: Response) {
                    expect(res.status).to.be.equal(200);
                })
                .catch(function (err) {
                    Log.trace(err);
                    expect.fail();
                });
        } catch (err) {
            Log.trace(err);
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
                .then(function (res: Response) {
                    expect.fail();
                })
                .catch(function (err) {
                    Log.trace(err);
                    expect(err.status).to.be.equal(400);
                });
        } catch (err) {
            Log.trace(err);
            expect.fail();
        }
    });

    it("DELETE test for courses dataset", function () {
        let ENDPOINT_URL = "/dataset/courses";
        try {
            return chai.request(SERVER_URL)
                .del(ENDPOINT_URL)
                .then(function (res: Response) {
                    expect(res.status).to.be.equal(200);
                })
                .catch(function (err) {
                    Log.trace(err);
                    expect.fail();
                });
        } catch (err) {
            Log.trace(err);
        }
    });

    it("DELETE test for dataset not found", function () {
        let ENDPOINT_URL = "/dataset/courses";
        try {
            return chai.request(SERVER_URL)
                .del(ENDPOINT_URL)
                .then(function (res: Response) {
                    expect.fail();
                })
                .catch(function (err) {
                    Log.trace(err);
                    expect(err.status).to.be.equal(404);
                });
        } catch (err) {
            Log.trace(err);
        }
    });

    it("DELETE test error", function () {
        let ENDPOINT_URL = "/dataset/_courses_";
        try {
            return chai.request(SERVER_URL)
                .del(ENDPOINT_URL)
                .then(function (res: Response) {
                    expect.fail();
                })
                .catch(function (err) {
                    Log.trace(err);
                    expect(err.status).to.be.equal(400);
                });
        } catch (err) {
            Log.trace(err);
        }
    });
    // The other endpoints work similarly. You should be able to find all instructions at the chai-http documentation
});
