/**
 * validate relative urls and external links in markdown files
 *
 */
import validator = require("validator");
import brokenLink = require("broken-link");
import path = require("path");
import fs = require("fs");
import readline = require("readline");

const exec = require("child_process").exec;
const args = require("yargs").argv;

//Interface for links
interface Link {
  address: string;
  lineNumber: number;
}

interface FileReport {
  all: string[],
  errors: string[]
}

async function main() {
  const rootDir = args.rootDir;
  const file = args.file;

  let files = [];
  let errorLinks: string[] = [];
  if (rootDir) {
    const command = `find ${rootDir}` + " -name '*.md' ! -path './node_modules/*' ! -path './out/*'";
    files = (await executeCommand(command)).trim().split("\n");
  } else if (file) {
    files[0] = file;
  }

  for (let i = 0; i < files.length; i++) {
    const errorLinksInFile = await checkLinks(files[i]);
    errorLinks = errorLinks.concat(errorLinksInFile);
  }

  // Log out error message
  if (errorLinks.length > 0) {
    console.log("########### Issues :( ########");
    console.log(`Error Links in total: ${errorLinks.length}`);
    for (let i=0; i<errorLinks.length; i++) {
      console.log(` ${i+1}. ${errorLinks[i]}`);
    }
    throw new Error("There are invalid links");
  }
  console.log("####################### DONE ###########################");
}

main();

function executeCommand(command: string): Promise<string> {
  return new Promise((resolve, reject) => {
    exec(command, (error, stdout, stderr) => {
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
// Validate external urls and relative links in markdown file
async function checkLinks(file: string): Promise<string[]> {
  // console.log(`\n####### Checking File: ${file}`);

  const links: Link[] = await getLinks(file);

  if (links.length > 0) {
    return new Promise((resolve, reject) => {
      checkLinksCore(file, links).then((fileReport) => {
        console.log(`\n####### Checking File: ${file}`);
        
        // Print all links
        console.log(`> All Links no: ${fileReport.all.length}`);
        if (fileReport.all.length > 0) {
          for (let i=0; i<fileReport.all.length; i++) {
            console.log(fileReport.all[i]);
          }
        }
  
        // Print error links
        console.log(`> Error Links no: ${fileReport.errors.length}`);
        if (fileReport.errors.length > 0) {
          for (let i=0; i<fileReport.errors.length; i++) {
            console.log(fileReport.errors[i]);
          }
        }
  
        resolve(fileReport.errors);
      });
    });
  } else {
    return new Promise((resolve, reject) => {
      console.log(`\n###### Checking file: ${file}`);
      console.log(`No links found.`);

      resolve([]);
    });
  }
}

function checkLinksCore(file: string, links: Link[]): Promise<FileReport> {
  return new Promise((resolve, reject) => {
    let fileReport: FileReport = {all: [], errors: []};

    links.forEach(async (link, index, array) => {
      let isBroken = false;
      if (isHttpLink(link.address)) {
        // Check external links
        isBroken = await checkBrokenLinks(link.address, { allowRedirects: true, match404Page: /404/ });
      } else {
        // Check markdown relative urls
        try {
          const currentWorkingDirectory = path.dirname(file);
          const fullPath = path.resolve(currentWorkingDirectory, link.address).split("#")[0];
          isBroken = !fs.existsSync(fullPath);
        } catch (error) {
          // If there's an error, log the link
          console.log(`Error: ${link.address} on line ${link.lineNumber} is not an HTTP/s or relative link.`);
          isBroken = true;
        }
      }
  
      // Print log
      let message = "";
      if (isBroken) {
        message  = `Error: [${file}] ${link.address} on line ${link.lineNumber} is unreachable.`;
        fileReport.errors.push(message);
        fileReport.all.push(message);
      } else {
        message = `Info: [${file}] ${link.address} on line ${link.lineNumber}.`; 
        fileReport.all.push(message);
      }
      // console.log(message);

      if (index === array.length -1) {
        resolve(fileReport);
      }
    });
  });
}

function checkBrokenLinks(url: string, options: any): Promise<boolean> {
  return new Promise((resolve, reject) => {
    brokenLink(url, options).then(answer => {
      if (answer) {
        resolve(true);
      } else {
        resolve(false);
      }
    });
  });
}

function getLinks(file: string): Promise<Link[]> {
  return new Promise((resolve, reject) => {
    const rl = readline.createInterface({
      input: fs.createReadStream(file)
    });

    const linksToReturn = new Array<Link>();
    let lineNumber = 0;

    rl.on("line", line => {
      lineNumber++;

      const links = line.match(/ \[ [^\[]+ \] \( ( [^\)] +(\)[a-zA-Z0-9-]*.\w*\)|\)))|\[[a-zA-z0-9_-]+\]:\s*(\S+)/g);
      // const links = line.match(/\[[\s\S]*?\]\([\s\S]*?\)/g);
      if (links) {
        // console.log(`links: ${links}`);
        for (let i = 0; i < links.length; i++) {
          const link = links[i].match(/\[[^\[]+\]\(([^\)]+(\)[a-zA-Z0-9-]*.\w+\)|\)))|\[[a-zA-z0-9_-]+\]:\s*(\S+)/);
          // for (let i=0; i<link.length; i++) {
          //     console.log(`${i} -> ${link[i]}`);
          // }
          const address = link[3] == null ? link[1].slice(0, -1) : link[3];
          linksToReturn.push({
            address: address,
            lineNumber: lineNumber
          });
        }
      }

    });

    rl.on("close", () => {
      resolve(linksToReturn);
    });
  });
}

// Is this a valid HTTP/S link?
function isHttpLink(linkToCheck: string): boolean {
  // Use the validator to avoid writing URL checking logic
  return validator.isURL(linkToCheck, { require_protocol: true, protocols: ["http", "https"] }) ? true : false;
}
