"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const fs = require("fs");
const restify = require("restify");
const Util_1 = require("../Util");
const InsightFacade_1 = require("../controller/InsightFacade");
const IInsightFacade_1 = require("../controller/IInsightFacade");
class Server {
    constructor(port) {
        Util_1.default.info("Server::<init>( " + port + " )");
        this.port = port;
    }
    stop() {
        Util_1.default.info("Server::close()");
        const that = this;
        return new Promise(function (fulfill) {
            that.rest.close(function () {
                fulfill(true);
            });
        });
    }
    start() {
        const that = this;
        return new Promise(function (fulfill, reject) {
            try {
                Util_1.default.info("Server::start() - start");
                that.rest = restify.createServer({
                    name: "insightUBC",
                });
                that.rest.use(restify.bodyParser({ mapFiles: true, mapParams: true }));
                that.rest.use(function crossOrigin(req, res, next) {
                    res.header("Access-Control-Allow-Origin", "*");
                    res.header("Access-Control-Allow-Headers", "X-Requested-With");
                    return next();
                });
                that.rest.get("/echo/:msg", Server.echo);
                that.rest.put("/dataset/:id/:kind", Server.addDataset);
                that.rest.del("/dataset/:id", Server.removeDataset);
                that.rest.post("/query", Server.performQuery);
                that.rest.get("/datasets", Server.listDatasets);
                that.rest.get("/.*", Server.getStatic);
                that.rest.listen(that.port, function () {
                    Util_1.default.info("Server::start() - restify listening: " + that.rest.url);
                    fulfill(true);
                });
                that.rest.on("error", function (err) {
                    Util_1.default.info("Server::start() - restify ERROR: " + err);
                    reject(err);
                });
            }
            catch (err) {
                Util_1.default.error("Server::start() - ERROR: " + err);
                reject(err);
            }
        });
    }
    static echo(req, res, next) {
        Util_1.default.trace("Server::echo(..) - params: " + JSON.stringify(req.params));
        try {
            const response = Server.performEcho(req.params.msg);
            Util_1.default.info("Server::echo(..) - responding " + 200);
            res.json(200, { result: response });
        }
        catch (err) {
            Util_1.default.error("Server::echo(..) - responding 400");
            res.json(400, { error: err });
        }
        return next();
    }
    static performEcho(msg) {
        if (typeof msg !== "undefined" && msg !== null) {
            return `${msg}...${msg}`;
        }
        else {
            return "Message not provided";
        }
    }
    static addDataset(req, res, next) {
        try {
            let id = req.params.id.toString();
            let content = req.body.toString("base64");
            let kind;
            if (req.params.kind.toString() === "rooms") {
                kind = IInsightFacade_1.InsightDatasetKind.Rooms;
            }
            else if (req.params.kind.toString() === "courses") {
                kind = IInsightFacade_1.InsightDatasetKind.Courses;
            }
            Server.insightFacade.addDataset(id, content, kind).then((response) => {
                res.json(200, { result: response });
                return next();
            }).catch((err) => {
                res.json(400, { error: err.message });
                return next();
            });
        }
        catch (err) {
            res.json(400, { error: err.message });
        }
    }
    static removeDataset(req, res, next) {
        Server.insightFacade.removeDataset(req.params.id).then((response) => {
            res.json(200, { result: response });
        }).catch((err) => {
            if (err instanceof IInsightFacade_1.NotFoundError) {
                res.json(404, { error: err.message });
            }
            else {
                res.json(400, { error: err.message });
            }
        });
        return next();
    }
    static performQuery(req, res, next) {
        Server.insightFacade.performQuery(req.params).then((response) => {
            res.json(200, { result: response });
        }).catch((err) => {
            res.json(400, { error: err.message });
        });
        return next();
    }
    static listDatasets(req, res, next) {
        Server.insightFacade.listDatasets().then((response) => {
            res.json(200, { result: response });
        }).catch((err) => {
            res.json(400, { error: err.message });
        });
        return next();
    }
    static getStatic(req, res, next) {
        const publicDir = "frontend/public/";
        Util_1.default.trace("RoutHandler::getStatic::" + req.url);
        let path = publicDir + "index.html";
        if (req.url !== "/") {
            path = publicDir + req.url.split("/").pop();
        }
        fs.readFile(path, function (err, file) {
            if (err) {
                res.send(500);
                Util_1.default.error(JSON.stringify(err));
                return next();
            }
            res.write(file);
            res.end();
            return next();
        });
    }
}
exports.default = Server;
Server.insightFacade = new InsightFacade_1.default();
//# sourceMappingURL=Server.js.map