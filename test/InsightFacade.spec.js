"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const chai_1 = require("chai");
const chai = require("chai");
const fs = require("fs-extra");
const chaiAsPromised = require("chai-as-promised");
const IInsightFacade_1 = require("../src/controller/IInsightFacade");
const InsightFacade_1 = require("../src/controller/InsightFacade");
const Util_1 = require("../src/Util");
const TestUtil_1 = require("./TestUtil");
describe("InsightFacade Add/Remove/List Dataset", function () {
    const datasetsToLoad = {
        courses: "./test/data/courses.zip",
        rooms: "./test/data/rooms.zip",
        empty: "./test/data/empty.zip",
        noCoursesFolder: "./test/data/noCoursesFolder.zip",
        invalidJSON: "./test/data/invalidJSON.zip",
        smallDataset: "./test/data/smallDataset.zip",
        noCourseSection: "./test/data/noCourseSection.zip",
        whitespaceId: "./test/data/ .zip",
        all_courses: "./test/data/all_courses.zip",
        notZip: "./test/data/notZip.txt",
    };
    let datasets = {};
    let insightFacade;
    const cacheDir = __dirname + "/../data";
    before(function () {
        Util_1.default.test(`Before all`);
        chai.use(chaiAsPromised);
        if (!fs.existsSync(cacheDir)) {
            fs.mkdirSync(cacheDir);
        }
        for (const id of Object.keys(datasetsToLoad)) {
            datasets[id] = fs.readFileSync(datasetsToLoad[id]).toString("base64");
        }
        try {
            insightFacade = new InsightFacade_1.default();
        }
        catch (err) {
            Util_1.default.error(err);
        }
    });
    beforeEach(function () {
        Util_1.default.test(`BeforeTest: ${this.currentTest.title}`);
    });
    after(function () {
        Util_1.default.test(`After: ${this.test.parent.title}`);
    });
    afterEach(function () {
        Util_1.default.test(`AfterTest: ${this.currentTest.title}`);
        try {
            fs.removeSync(cacheDir);
            fs.mkdirSync(cacheDir);
            insightFacade = new InsightFacade_1.default();
        }
        catch (err) {
            Util_1.default.error(err);
        }
    });
    it("Should add a valid dataset", function () {
        const id = "courses";
        const expected = [id];
        const futureResult = insightFacade.addDataset(id, datasets[id], IInsightFacade_1.InsightDatasetKind.Courses);
        return chai_1.expect(futureResult).to.eventually.deep.equal(expected);
    });
    it("Should add a valid dataset for room", function () {
        const id = "rooms";
        const expected = [id];
        const futureResult = insightFacade.addDataset(id, datasets[id], IInsightFacade_1.InsightDatasetKind.Rooms);
        return chai_1.expect(futureResult).to.eventually.deep.equal(expected);
    });
    it("Should add a small valid dataset", function () {
        const id = "smallDataset";
        const expected = [id];
        const futureResult = insightFacade.addDataset(id, datasets[id], IInsightFacade_1.InsightDatasetKind.Courses);
        return chai_1.expect(futureResult).to.eventually.deep.equal(expected);
    });
    it("Should reject if the second dataset is the same as the first one", function () {
        const id = "courses";
        let futureResult = insightFacade.addDataset(id, datasets[id], IInsightFacade_1.InsightDatasetKind.Courses);
        futureResult.then(function () {
            futureResult = insightFacade.addDataset(id, datasets[id], IInsightFacade_1.InsightDatasetKind.Courses);
            return chai_1.expect(futureResult).to.be.rejectedWith(new IInsightFacade_1.InsightError());
        });
    });
    it("Should reject if dataset is not a zip file", function () {
        const id = "notZip";
        const futureResult = insightFacade.addDataset(id, datasets[id], IInsightFacade_1.InsightDatasetKind.Courses);
        return chai_1.expect(futureResult).to.be.rejectedWith(new IInsightFacade_1.InsightError());
    });
    it("Should reject if dataset kind is not courses", function () {
        const id = "courses";
        const futureResult = insightFacade.addDataset(id, datasets[id], IInsightFacade_1.InsightDatasetKind.Rooms);
        return chai_1.expect(futureResult).to.be.rejectedWith(new IInsightFacade_1.InsightError());
    });
    it("Should reject if id contains _ or whitespace", function () {
        const id = "whitespaceId";
        const id2 = "all_courses";
        const futureResult = insightFacade.addDataset(id, datasets[id], IInsightFacade_1.InsightDatasetKind.Courses);
        const futureResult2 = insightFacade.addDataset(id2, datasets[id2], IInsightFacade_1.InsightDatasetKind.Courses);
        return chai_1.expect(futureResult).to.be.rejectedWith(new IInsightFacade_1.InsightError())
            && chai_1.expect(futureResult2).to.be.rejectedWith(new IInsightFacade_1.InsightError());
    });
    it("Should add 2 datasets back to back", function () {
        const id = "courses";
        let futureResult = insightFacade.addDataset(id, datasets[id], IInsightFacade_1.InsightDatasetKind.Courses).then(function () {
            futureResult = insightFacade.addDataset("smallDataset", datasets["smallDataset"], IInsightFacade_1.InsightDatasetKind.Courses).then(() => {
                return chai_1.expect(futureResult).to.eventually.deep.equal(["courses", "smallDataset"]);
            });
        });
    });
    it("Should reject if zip file contains wrong JSON format", function () {
        const id = "invalidJSON";
        const futureResult = insightFacade.addDataset(id, datasets[id], IInsightFacade_1.InsightDatasetKind.Courses);
        return chai_1.expect(futureResult).to.be.rejectedWith(new IInsightFacade_1.InsightError());
    });
    it("Should reject if zip file contains courses with no section", function () {
        const id = "noCourseSection";
        const futureResult = insightFacade.addDataset(id, datasets[id], IInsightFacade_1.InsightDatasetKind.Courses);
        return chai_1.expect(futureResult).to.be.rejectedWith(new IInsightFacade_1.InsightError());
    });
    it("Should reject if zip file does not contain courses folder", function () {
        const id = "noCoursesFolder";
        const futureResult = insightFacade.addDataset(id, datasets[id], IInsightFacade_1.InsightDatasetKind.Courses);
        return chai_1.expect(futureResult).to.be.rejectedWith(new IInsightFacade_1.InsightError());
    });
    it("Should reject an empty dataset", function () {
        const id = "empty";
        const futureResult = insightFacade.addDataset(id, datasets[id], IInsightFacade_1.InsightDatasetKind.Courses);
        return chai_1.expect(futureResult).to.be.rejectedWith(new IInsightFacade_1.InsightError());
    });
    it("Should reject if id not found", function () {
        const id = "notFound";
        const futureResult = insightFacade.addDataset(id, datasets[id], IInsightFacade_1.InsightDatasetKind.Courses);
        return chai_1.expect(futureResult).to.be.rejectedWith(new IInsightFacade_1.InsightError());
    });
    it("Should remove a valid dataset", function () {
        const id = "courses";
        const expected = id;
        insightFacade.addDataset(id, datasets[id], IInsightFacade_1.InsightDatasetKind.Courses)
            .then(function () {
            const futureResult = insightFacade.removeDataset(id);
            return chai_1.expect(futureResult).to.eventually.deep.equal(expected);
        });
    });
    it("Should remove a valid room dataset", function () {
        const id = "rooms";
        const expected = id;
        let futureResult = insightFacade.addDataset(id, datasets[id], IInsightFacade_1.InsightDatasetKind.Rooms)
            .then(function () {
            return insightFacade.removeDataset(id);
        });
        return chai_1.expect(futureResult).to.eventually.deep.equal(expected);
    });
    it("Should reject removing a dataset not found", function () {
        const id = "courses";
        const id2 = "smallDataset";
        const futureResult = insightFacade.addDataset(id, datasets[id], IInsightFacade_1.InsightDatasetKind.Courses);
        futureResult.then(function () {
            const futureResult2 = insightFacade.removeDataset(id2);
            return chai_1.expect(futureResult2).to.be.rejectedWith("NotFoundError");
        });
    });
    it("reject removing a dataset that's not added", function () {
        const id = "courses";
        const futureResult = insightFacade.removeDataset(id);
        return chai_1.expect(futureResult).to.be.rejectedWith("NotFoundError");
    });
    it("reject removing a dataset that its id contains whitespace", function () {
        const id = " ";
        const futureResult = insightFacade.addDataset(id, datasets[id], IInsightFacade_1.InsightDatasetKind.Courses);
        futureResult.then(function () {
            const futureResult2 = insightFacade.removeDataset(id);
            return chai_1.expect(futureResult2).to.be.rejectedWith(new IInsightFacade_1.InsightError());
        });
    });
    it("reject removing a dataset that its id contains _", function () {
        const id = "all_courses";
        const futureResult = insightFacade.addDataset(id, datasets[id], IInsightFacade_1.InsightDatasetKind.Courses);
        futureResult.then(function () {
            const futureResult2 = insightFacade.removeDataset(id);
            return chai_1.expect(futureResult2).to.be.rejectedWith(new IInsightFacade_1.InsightError());
        });
    });
    it("Should remove the correct dataset out of two datasets", function () {
        const id = "courses";
        const id2 = "smallDataset";
        const expected = id2;
        let futureResult = insightFacade.addDataset(id, datasets[id], IInsightFacade_1.InsightDatasetKind.Courses);
        futureResult.then(function () {
            futureResult = insightFacade.addDataset(id2, datasets[id2], IInsightFacade_1.InsightDatasetKind.Courses);
        });
        futureResult.then(function () {
            const futureResult2 = insightFacade.removeDataset(id2);
            return chai_1.expect(futureResult2).to.eventually.deep.equal(expected);
        });
    });
    it("Should list all added data sets (one dataset)", function () {
        const id = "smallDataset";
        const expected = [{ id: id, kind: IInsightFacade_1.InsightDatasetKind.Courses, numRows: 134, },];
        const futureResult = insightFacade.addDataset(id, datasets[id], IInsightFacade_1.InsightDatasetKind.Courses);
        const listPromise = futureResult.then(function () {
            return insightFacade.listDatasets();
        });
        return chai_1.expect(listPromise).to.eventually.deep.equal(expected);
    });
    it("Should list added data sets (one dataset) room", function () {
        const id = "rooms";
        const expected = [{ id: id, kind: IInsightFacade_1.InsightDatasetKind.Rooms, numRows: 364, },];
        const futureResult = insightFacade.addDataset(id, datasets[id], IInsightFacade_1.InsightDatasetKind.Rooms);
        const listPromise = futureResult.then(function () {
            return insightFacade.listDatasets();
        });
        return chai_1.expect(listPromise).to.eventually.deep.equal(expected);
    });
    it("Should list all added data sets (two datasets)", function () {
        const id = "courses";
        const id2 = "smallDataset";
        const expected = [{ id: id, kind: IInsightFacade_1.InsightDatasetKind.Courses, numRows: 64612, },
            { id: id2, kind: IInsightFacade_1.InsightDatasetKind.Courses, numRows: 134, },];
        const futureResult = insightFacade.addDataset(id, datasets[id], IInsightFacade_1.InsightDatasetKind.Courses);
        const futureResult2 = futureResult.then(function () {
            return insightFacade.addDataset(id2, datasets[id2], IInsightFacade_1.InsightDatasetKind.Courses);
        });
        const listPromise = futureResult2.then(function () {
            return insightFacade.listDatasets();
        });
        return chai_1.expect(listPromise).to.eventually.include(expected);
    });
    it("listDataset should fulfill even if no dataset added", function () {
        const expected = [];
        const futureResult = insightFacade.listDatasets();
        return chai_1.expect(futureResult).to.eventually.deep.equal(expected);
    });
    it("Should list the correct dataset out of two datasets (first one removed)", function () {
        const id = "courses";
        const id2 = "smallDataset";
        const expected = [{ id: id, kind: IInsightFacade_1.InsightDatasetKind.Courses, numRows: 134, },];
        let futureResult = insightFacade.addDataset(id, datasets[id], IInsightFacade_1.InsightDatasetKind.Courses);
        futureResult.then(function () {
            futureResult = insightFacade.addDataset(id2, datasets[id2], IInsightFacade_1.InsightDatasetKind.Courses);
        });
        futureResult.then(function () {
            const futureResult2 = insightFacade.removeDataset(id);
            futureResult2.then(function () {
                const listPromise = insightFacade.listDatasets();
                return chai_1.expect(listPromise).to.eventually.deep.equal(expected);
            });
        });
    });
    it("Should list the correct dataset out of two datasets (second one removed)", function () {
        const id = "courses";
        const id2 = "smallDataset";
        const expected = [{ id: id, kind: IInsightFacade_1.InsightDatasetKind.Courses, numRows: 64612, },];
        let futureResult = insightFacade.addDataset(id, datasets[id], IInsightFacade_1.InsightDatasetKind.Courses);
        futureResult.then(function () {
            futureResult = insightFacade.addDataset(id2, datasets[id2], IInsightFacade_1.InsightDatasetKind.Courses);
        });
        futureResult.then(function () {
            const futureResult2 = insightFacade.removeDataset(id2);
            futureResult2.then(function () {
                const listPromise = insightFacade.listDatasets();
                return chai_1.expect(listPromise).to.eventually.deep.equal(expected);
            });
        });
    });
});
describe("InsightFacade PerformQuery", () => {
    const datasetsToQuery = {
        courses: { path: "./test/data/courses.zip", kind: IInsightFacade_1.InsightDatasetKind.Courses },
        rooms: { path: "./test/data/rooms.zip", kind: IInsightFacade_1.InsightDatasetKind.Rooms },
    };
    let insightFacade;
    let testQueries = [];
    before(function () {
        chai.use(chaiAsPromised);
        Util_1.default.test(`Before: ${this.test.parent.title}`);
        try {
            testQueries = TestUtil_1.default.readTestQueries();
        }
        catch (err) {
            chai_1.expect.fail("", "", `Failed to read one or more test queries. ${err}`);
        }
        const loadDatasetPromises = [];
        insightFacade = new InsightFacade_1.default();
        for (const id of Object.keys(datasetsToQuery)) {
            const ds = datasetsToQuery[id];
            const data = fs.readFileSync(ds.path).toString("base64");
            loadDatasetPromises.push(insightFacade.addDataset(id, data, ds.kind));
        }
        return Promise.all(loadDatasetPromises);
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
    it("Should run test queries", function () {
        describe("Dynamic InsightFacade PerformQuery tests", function () {
            for (const test of testQueries) {
                it(`[${test.filename}] ${test.title}`, function () {
                    const futureResult = insightFacade.performQuery(test.query);
                    return TestUtil_1.default.verifyQueryResult(futureResult, test);
                });
            }
        });
    });
});
//# sourceMappingURL=InsightFacade.spec.js.map