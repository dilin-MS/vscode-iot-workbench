"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
exports.__esModule = true;
/**
 * validate relative urls and external links in markdown files
 *
 */
var validator = require("validator");
var brokenLink = require("broken-link");
var path = require("path");
var fs = require("fs");
var readline = require("readline");
var exec = require("child_process").exec;
var args = require("yargs").argv;
function executeCommand(command) {
    return new Promise(function (resolve, reject) {
        exec(command, function (error, stdout, stderr) {
            if (error) {
                reject(error);
            }
            if (stderr) {
                reject(stderr);
            }
            resolve(stdout);
        });
    });
}
// eslint-disable-next-line  @typescript-eslint/no-explicit-any
function checkBrokenLinks(url, options) {
    return new Promise(function (resolve) {
        brokenLink(url, options).then(function (answer) {
            if (answer) {
                resolve(true);
            }
            else {
                resolve(false);
            }
        });
    });
}
// Is this a valid HTTP/S link?
function isHttpLink(linkToCheck) {
    // Use the validator to avoid writing URL checking logic
    // eslint-disable-next-line  @typescript-eslint/camelcase
    return validator.isURL(linkToCheck, { require_protocol: true, protocols: ["http", "https"] }) ? true : false;
}
function checkLinksCore(file, links) {
    var _this = this;
    return new Promise(function (resolve) {
        var fileReport = { all: [], errors: [] };
        links.forEach(function (link, index, array) { return __awaiter(_this, void 0, void 0, function () {
            var isBroken, currentWorkingDirectory, fullPath, message;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        isBroken = false;
                        if (!isHttpLink(link.address)) return [3 /*break*/, 2];
                        return [4 /*yield*/, checkBrokenLinks(link.address, { allowRedirects: true, match404Page: /404/ })];
                    case 1:
                        // Check external links
                        isBroken = _a.sent();
                        return [3 /*break*/, 3];
                    case 2:
                        // Check markdown relative urls
                        try {
                            currentWorkingDirectory = path.dirname(file);
                            fullPath = path.resolve(currentWorkingDirectory, link.address).split("#")[0];
                            isBroken = !fs.existsSync(fullPath);
                        }
                        catch (error) {
                            // If there's an error, log the link
                            console.log("Error: " + link.address + " on line " + link.lineNumber + " is not an HTTP/s or relative link.");
                            isBroken = true;
                        }
                        _a.label = 3;
                    case 3:
                        message = "";
                        if (isBroken) {
                            message = "Error: [" + file + "] " + link.address + " on line " + link.lineNumber + " is unreachable.";
                            fileReport.errors.push(message);
                            fileReport.all.push(message);
                        }
                        else {
                            message = "Info: [" + file + "] " + link.address + " on line " + link.lineNumber + ".";
                            fileReport.all.push(message);
                        }
                        // console.log(message);
                        if (index === array.length - 1) {
                            resolve(fileReport);
                        }
                        return [2 /*return*/];
                }
            });
        }); });
    });
}
function getLinks(file) {
    return new Promise(function (resolve) {
        var rl = readline.createInterface({
            input: fs.createReadStream(file)
        });
        var linksToReturn = new Array();
        var lineNumber = 0;
        rl.on("line", function (line) {
            lineNumber++;
            var links = line.match(/\[[^\[]+\]\(([^\)]+(\)[a-zA-Z0-9-]*.\w*\)|\)))|\[[a-zA-z0-9_-]+\]:\s*(\S+)/g);
            // const links = line.match(/\[[\s\S]*?\]\([\s\S]*?\)/g);
            if (links) {
                // console.log(`links: ${links}`);
                for (var i = 0; i < links.length; i++) {
                    var link = links[i].match(/\[[^\[]+\]\(([^\)]+(\)[a-zA-Z0-9-]*.\w+\)|\)))|\[[a-zA-z0-9_-]+\]:\s*(\S+)/);
                    // for (let i=0; i<link.length; i++) {
                    //     console.log(`${i} -> ${link[i]}`);
                    // }
                    var address = link[3] == null ? link[1].slice(0, -1) : link[3];
                    linksToReturn.push({
                        address: address,
                        lineNumber: lineNumber
                    });
                }
            }
        });
        rl.on("close", function () {
            resolve(linksToReturn);
        });
    });
}
// Validate external urls and relative links in markdown file
function checkLinks(file) {
    return __awaiter(this, void 0, void 0, function () {
        var links;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, getLinks(file)];
                case 1:
                    links = _a.sent();
                    if (links.length > 0) {
                        return [2 /*return*/, new Promise(function (resolve) {
                                checkLinksCore(file, links).then(function (fileReport) {
                                    console.log("\n####### Checking File: " + file);
                                    // Print all links
                                    console.log("> All Links no: " + fileReport.all.length);
                                    if (fileReport.all.length > 0) {
                                        for (var i = 0; i < fileReport.all.length; i++) {
                                            console.log(fileReport.all[i]);
                                        }
                                    }
                                    // Print error links
                                    console.log("> Error Links no: " + fileReport.errors.length);
                                    if (fileReport.errors.length > 0) {
                                        for (var i = 0; i < fileReport.errors.length; i++) {
                                            console.log(fileReport.errors[i]);
                                        }
                                    }
                                    resolve(fileReport.errors);
                                });
                            })];
                    }
                    else {
                        return [2 /*return*/, new Promise(function (resolve) {
                                console.log("\n###### Checking file: " + file);
                                console.log("No links found.");
                                resolve([]);
                            })];
                    }
                    return [2 /*return*/];
            }
        });
    });
}
function main() {
    return __awaiter(this, void 0, void 0, function () {
        var rootDir, file, files, errorLinks, command, i, errorLinksInFile, i;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    rootDir = args.rootDir;
                    file = args.file;
                    files = [];
                    errorLinks = [];
                    if (!rootDir) return [3 /*break*/, 2];
                    command = "find " + rootDir + " -name '*.md' ! -path './node_modules/*' ! -path './out/*'";
                    return [4 /*yield*/, executeCommand(command)];
                case 1:
                    files = (_a.sent()).trim().split("\n");
                    return [3 /*break*/, 3];
                case 2:
                    if (file) {
                        files[0] = file;
                    }
                    _a.label = 3;
                case 3:
                    i = 0;
                    _a.label = 4;
                case 4:
                    if (!(i < files.length)) return [3 /*break*/, 7];
                    return [4 /*yield*/, checkLinks(files[i])];
                case 5:
                    errorLinksInFile = _a.sent();
                    errorLinks = errorLinks.concat(errorLinksInFile);
                    _a.label = 6;
                case 6:
                    i++;
                    return [3 /*break*/, 4];
                case 7:
                    // Log out error message
                    if (errorLinks.length > 0) {
                        console.log("########### Issues :( ########");
                        console.log("Error Links in total: " + errorLinks.length);
                        for (i = 0; i < errorLinks.length; i++) {
                            console.log(" " + (i + 1) + ". " + errorLinks[i]);
                        }
                        throw new Error("There are invalid links");
                    }
                    console.log("####################### DONE ###########################");
                    return [2 /*return*/];
            }
        });
    });
}
main();
