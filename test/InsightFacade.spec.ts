import {expect} from "chai";
import * as chai from "chai";
import * as fs from "fs-extra";
import * as chaiAsPromised from "chai-as-promised";
import {InsightDataset, InsightDatasetKind, InsightError} from "../src/controller/IInsightFacade";
import InsightFacade from "../src/controller/InsightFacade";
import Log from "../src/Util";
import TestUtil from "./TestUtil";

// This should match the schema given to TestUtil.validate(..) in TestUtil.readTestQueries(..)
// except 'filename' which is injected when the file is read.
export interface ITestQuery {
    title: string;
    query: any;  // make any to allow testing structurally invalid queries
    isQueryValid: boolean;
    result: any;
    filename: string;  // This is injected when reading the file
}

describe("InsightFacade Add/Remove/List Dataset", function () {
    // Reference any datasets you've added to test/data here and they will
    // automatically be loaded in the 'before' hook.
    const datasetsToLoad: { [id: string]: string } = {
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
    let datasets: { [id: string]: string } = {};
    let insightFacade: InsightFacade;
    const cacheDir = __dirname + "/../data";

    before(function () {
        // This section runs once and loads all datasets specified in the datasetsToLoad object
        // into the datasets object
        Log.test(`Before all`);
        chai.use(chaiAsPromised);
        if (!fs.existsSync(cacheDir)) {
            fs.mkdirSync(cacheDir);
        }
        for (const id of Object.keys(datasetsToLoad)) {
            datasets[id] = fs.readFileSync(datasetsToLoad[id]).toString("base64");
        }
        try {
            insightFacade = new InsightFacade();
        } catch (err) {
            Log.error(err);
        }
    });

    beforeEach(function () {
        Log.test(`BeforeTest: ${this.currentTest.title}`);
    });

    after(function () {
        Log.test(`After: ${this.test.parent.title}`);
    });

    afterEach(function () {
        // This section resets the data directory (removing any cached data) and resets the InsightFacade instance
        // This runs after each test, which should make each test independent from the previous one
        Log.test(`AfterTest: ${this.currentTest.title}`);
        try {
            fs.removeSync(cacheDir);
            fs.mkdirSync(cacheDir);
            insightFacade = new InsightFacade();
        } catch (err) {
            Log.error(err);
        }
    });

    /**
     * addDataset unit tests
     */

    // This is a unit test. You should create more like this!
    it("Should add a valid dataset", function () {
        const id: string = "courses";
        const expected: string[] = [id];
        const futureResult: Promise<string[]> = insightFacade.addDataset(id, datasets[id], InsightDatasetKind.Courses);
        return expect(futureResult).to.eventually.deep.equal(expected);
    });

    it("Should add a valid dataset for room", function () {
        const id: string = "rooms";
        const expected: string[] = [id];
        const futureResult: Promise<string[]> = insightFacade.addDataset(id, datasets[id], InsightDatasetKind.Rooms);
        return expect(futureResult).to.eventually.deep.equal(expected);
    });

    it("Should add a small valid dataset", function () {
        const id: string = "smallDataset";
        const expected: string[] = [id];
        const futureResult: Promise<string[]> = insightFacade.addDataset(id, datasets[id], InsightDatasetKind.Courses);
        return expect(futureResult).to.eventually.deep.equal(expected);
    });

    it("Should reject if the second dataset is the same as the first one", function () {
        const id: string = "courses";
        let futureResult: Promise<string[]> = insightFacade.addDataset(id, datasets[id], InsightDatasetKind.Courses);
        futureResult.then(function () {
            futureResult = insightFacade.addDataset(id, datasets[id], InsightDatasetKind.Courses);
            return expect(futureResult).to.be.rejectedWith(new InsightError());
        });
    });

    it("Should reject if dataset is not a zip file", function () {
        const id: string = "notZip";
        const futureResult: Promise<string[]> = insightFacade.addDataset(id, datasets[id], InsightDatasetKind.Courses);
        return expect(futureResult).to.be.rejectedWith(new InsightError());
    });

    it("Should reject if dataset kind is not courses", function () {
        const id: string = "courses";
        const futureResult: Promise<string[]> = insightFacade.addDataset(id, datasets[id], InsightDatasetKind.Rooms);
        return expect(futureResult).to.be.rejectedWith(new InsightError());
    });

    it("Should reject if id contains _ or whitespace", function () {
        const id: string = "whitespaceId";
        const id2: string = "all_courses";
        const futureResult: Promise<string[]> = insightFacade.addDataset(id, datasets[id], InsightDatasetKind.Courses);
        const futureResult2: Promise<string[]>
            = insightFacade.addDataset(id2, datasets[id2], InsightDatasetKind.Courses);
        return expect(futureResult).to.be.rejectedWith(new InsightError())
            && expect(futureResult2).to.be.rejectedWith(new InsightError());
    });

    it("Should add 2 datasets back to back", function () {
        const id: string = "courses";
        let futureResult: Promise<void | string[]> =
            insightFacade.addDataset(id, datasets[id],
                InsightDatasetKind.Courses).then(function () {
                futureResult = insightFacade.addDataset("smallDataset",
                    datasets["smallDataset"], InsightDatasetKind.Courses).then(() => {
                    return expect(futureResult).to.eventually.deep.equal(["courses", "smallDataset"]);
                });
            });
    });

    it("Should reject if zip file contains wrong JSON format", function () {
        const id: string = "invalidJSON";
        const futureResult: Promise<string[]> = insightFacade.addDataset(id, datasets[id], InsightDatasetKind.Courses);
        return expect(futureResult).to.be.rejectedWith(new InsightError());
    });

    it("Should reject if zip file contains courses with no section", function () {
        const id: string = "noCourseSection";
        const futureResult: Promise<string[]> = insightFacade.addDataset(id, datasets[id], InsightDatasetKind.Courses);
        return expect(futureResult).to.be.rejectedWith(new InsightError());
    });

    it("Should reject if zip file does not contain courses folder", function () {
        const id: string = "noCoursesFolder";
        const futureResult: Promise<string[]> = insightFacade.addDataset(id, datasets[id], InsightDatasetKind.Courses);
        return expect(futureResult).to.be.rejectedWith(new InsightError());
    });

    it("Should reject an empty dataset", function () {
        const id: string = "empty";
        const futureResult: Promise<string[]> = insightFacade.addDataset(id, datasets[id], InsightDatasetKind.Courses);
        return expect(futureResult).to.be.rejectedWith(new InsightError());
    });

    it("Should reject if id not found", function () {
        const id: string = "notFound";
        const futureResult: Promise<string[]> = insightFacade.addDataset(id, datasets[id], InsightDatasetKind.Courses);
        return expect(futureResult).to.be.rejectedWith(new InsightError());
    });

    /**
     * removeDataset unit tests
     */

    it("Should remove a valid dataset", function () {
        const id: string = "courses";
        const expected: string = id;
        insightFacade.addDataset(id, datasets[id], InsightDatasetKind.Courses)
            .then(function () {
                const futureResult: Promise<string> = insightFacade.removeDataset(id);
                return expect(futureResult).to.eventually.deep.equal(expected);
            });
    });

    it("Should remove a valid room dataset", function () {
        const id: string = "rooms";
        const expected: string = id;
        let futureResult: Promise<any> = insightFacade.addDataset(id, datasets[id], InsightDatasetKind.Rooms)
            .then(function () {
                return insightFacade.removeDataset(id);
            });
        return expect(futureResult).to.eventually.deep.equal(expected);
    });

    it("Should reject removing a dataset not found", function () {
        const id: string = "courses";
        const id2: string = "smallDataset";
        const futureResult: Promise<string[]> = insightFacade.addDataset(id, datasets[id], InsightDatasetKind.Courses);
        futureResult.then(function () {
            const futureResult2: Promise<string> = insightFacade.removeDataset(id2);
            return expect(futureResult2).to.be.rejectedWith("NotFoundError");
        });
    });

    it("reject removing a dataset that's not added", function () {
        const id: string = "courses";
        const futureResult: Promise<string> = insightFacade.removeDataset(id);
        return expect(futureResult).to.be.rejectedWith("NotFoundError");
    });

    it("reject removing a dataset that its id contains whitespace", function () {
        const id: string = " ";
        const futureResult: Promise<string[]> = insightFacade.addDataset(id, datasets[id], InsightDatasetKind.Courses);
        futureResult.then(function () {
            const futureResult2: Promise<string> = insightFacade.removeDataset(id);
            return expect(futureResult2).to.be.rejectedWith(new InsightError());
        });
    });

    it("reject removing a dataset that its id contains _", function () {
        const id: string = "all_courses";
        const futureResult: Promise<string[]> = insightFacade.addDataset(id, datasets[id], InsightDatasetKind.Courses);
        futureResult.then(function () {
            const futureResult2: Promise<string> = insightFacade.removeDataset(id);
            return expect(futureResult2).to.be.rejectedWith(new InsightError());
        });
    });

    it("Should remove the correct dataset out of two datasets", function () {
        const id: string = "courses";
        const id2: string = "smallDataset";
        const expected: string = id2;
        let futureResult: Promise<string[]> = insightFacade.addDataset(id, datasets[id], InsightDatasetKind.Courses);
        futureResult.then(function () {
            futureResult = insightFacade.addDataset(id2, datasets[id2], InsightDatasetKind.Courses);
        });
        futureResult.then(function () {
            const futureResult2: Promise<string> = insightFacade.removeDataset(id2);
            return expect(futureResult2).to.eventually.deep.equal(expected);
        });
    });

    /**
     * listDataset unit tests
     */

    it("Should list all added data sets (one dataset)", function () {
        const id: string = "smallDataset";
        const expected: InsightDataset[] =
            [{id: id, kind: InsightDatasetKind.Courses, numRows: 134, } as InsightDataset, ];
        const futureResult: Promise<string[]> = insightFacade.addDataset(id, datasets[id], InsightDatasetKind.Courses);
        const listPromise: Promise<InsightDataset[]> = futureResult.then(function () {
            return insightFacade.listDatasets();
        });
        return expect(listPromise).to.eventually.deep.equal(expected);
    });

    it("Should list added data sets (one dataset) room", function () {
        const id: string = "rooms";
        const expected: InsightDataset[] =
            [{id: id, kind: InsightDatasetKind.Rooms, numRows: 364, } as InsightDataset, ];
        const futureResult: Promise<string[]> = insightFacade.addDataset(id, datasets[id], InsightDatasetKind.Rooms);
        const listPromise: Promise<InsightDataset[]> = futureResult.then(function () {
            return insightFacade.listDatasets();
        });
        return expect(listPromise).to.eventually.deep.equal(expected);
    });

    it("Should list all added data sets (two datasets)", function () {
        const id: string = "courses";
        const id2: string = "smallDataset";
        const expected: InsightDataset[] =
            [{id: id, kind: InsightDatasetKind.Courses, numRows: 64612, } as InsightDataset,
                {id: id2, kind: InsightDatasetKind.Courses, numRows: 134, } as InsightDataset, ];
        const futureResult: Promise<string[]> = insightFacade.addDataset(id, datasets[id], InsightDatasetKind.Courses);
        const futureResult2: Promise<string[]> = futureResult.then(function () {
            return insightFacade.addDataset(id2, datasets[id2], InsightDatasetKind.Courses);
        });
        const listPromise: Promise<InsightDataset[]> = futureResult2.then(function () {
            return insightFacade.listDatasets();
        });
        return expect(listPromise).to.eventually.include(expected);
    });

    it("listDataset should fulfill even if no dataset added", function () {
        const expected: InsightDataset[] = [];
        const futureResult: Promise<InsightDataset[]> = insightFacade.listDatasets();
        return expect(futureResult).to.eventually.deep.equal(expected);
    });

    it("Should list the correct dataset out of two datasets (first one removed)", function () {
        const id: string = "courses";
        const id2: string = "smallDataset";
        const expected: InsightDataset[] =
            [{id: id, kind: InsightDatasetKind.Courses, numRows: 134, } as InsightDataset, ];
        let futureResult: Promise<string[]> = insightFacade.addDataset(id, datasets[id], InsightDatasetKind.Courses);
        futureResult.then(function () {
            futureResult = insightFacade.addDataset(id2, datasets[id2], InsightDatasetKind.Courses);
        });
        futureResult.then(function () {
            const futureResult2: Promise<string> = insightFacade.removeDataset(id);
            futureResult2.then(function () {
                const listPromise: Promise<InsightDataset[]> = insightFacade.listDatasets();
                return expect(listPromise).to.eventually.deep.equal(expected);
            });
        });
    });

    it("Should list the correct dataset out of two datasets (second one removed)", function () {
        const id: string = "courses";
        const id2: string = "smallDataset";
        const expected: InsightDataset[] =
            [{id: id, kind: InsightDatasetKind.Courses, numRows: 64612, } as InsightDataset, ];
        let futureResult: Promise<string[]> = insightFacade.addDataset(id, datasets[id], InsightDatasetKind.Courses);
        futureResult.then(function () {
            futureResult = insightFacade.addDataset(id2, datasets[id2], InsightDatasetKind.Courses);
        });
        futureResult.then(function () {
            const futureResult2: Promise<string> = insightFacade.removeDataset(id2);
            futureResult2.then(function () {
                const listPromise: Promise<InsightDataset[]> = insightFacade.listDatasets();
                return expect(listPromise).to.eventually.deep.equal(expected);
            });
        });
    });
});

/*
 * This test suite dynamically generates tests from the JSON files in test/queries.
 * You should not need to modify it; instead, add additional files to the queries directory.
 * You can still make tests the normal way, this is just a convenient tool for a majority of queries.
 */
describe("InsightFacade PerformQuery", () => {
    const datasetsToQuery: { [id: string]: { path: string, kind: InsightDatasetKind } } = {
        courses: {path: "./test/data/courses.zip", kind: InsightDatasetKind.Courses},
        rooms: {path: "./test/data/rooms.zip", kind: InsightDatasetKind.Rooms},
    };
    let insightFacade: InsightFacade;
    let testQueries: ITestQuery[] = [];

    // Load all the test queries, and call addDataset on the insightFacade instance for all the datasets
    before(function () {
        chai.use(chaiAsPromised);
        Log.test(`Before: ${this.test.parent.title}`);

        // Load the query JSON files under test/queries.
        // Fail if there is a problem reading ANY query.
        try {
            testQueries = TestUtil.readTestQueries();
        } catch (err) {
            expect.fail("", "", `Failed to read one or more test queries. ${err}`);
        }

        // Load the datasets specified in datasetsToQuery and add them to InsightFacade.
        // Will fail* if there is a problem reading ANY dataset.
        const loadDatasetPromises: Array<Promise<string[]>> = [];
        insightFacade = new InsightFacade();
        for (const id of Object.keys(datasetsToQuery)) {
            const ds = datasetsToQuery[id];
            const data = fs.readFileSync(ds.path).toString("base64");
            loadDatasetPromises.push(insightFacade.addDataset(id, data, ds.kind));
        }
        return Promise.all(loadDatasetPromises);
        //     .catch((err) => {
        //     /* *IMPORTANT NOTE: This catch is to let this run even without the implemented addDataset,
        //      * for the purposes of seeing all your tests run.
        //      * TODO For C1, remove this catch block (but keep the Promise.all)
        //      */
        //     return Promise.resolve("HACK TO LET QUERIES RUN");
        // });
    });

    beforeEach(function () {
        Log.test(`BeforeTest: ${this.currentTest.title}`);
    });

    after(function () {
        Log.test(`After: ${this.test.parent.title}`);
    });

    afterEach(function () {
        Log.test(`AfterTest: ${this.currentTest.title}`);
    });

    // Dynamically create and run a test for each query in testQueries
    // Creates an extra "test" called "Should run test queries" as a byproduct. Don't worry about it
    it("Should run test queries", function () {
        describe("Dynamic InsightFacade PerformQuery tests", function () {
            for (const test of testQueries) {
                it(`[${test.filename}] ${test.title}`, function () {
                    const futureResult: Promise<any[]> = insightFacade.performQuery(test.query);
                    return TestUtil.verifyQueryResult(futureResult, test);
                });
            }
        });
    });
});
