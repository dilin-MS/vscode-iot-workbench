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
    const temp = errorLinks.concat(errorLinksInFile);
    errorLinks = temp;
  }

  // Log out error message
  if (errorLinks) {
    console.log("########### Issues :( ########");
    console.log(`[3] error links len: ${errorLinks.length}`);
    errorLinks.forEach(errorLink => {
      console.log(errorLink);
    });
  }
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
  const errorLinksInFile: string[] = [];
  console.log(`###### Checking file: ${file}`);
  const links: Link[] = await getLinks(file);

  if (links) {
    await checkLinksCore(file, links, errorLinksInFile);
  }

  return errorLinksInFile;
}

function checkLinksCore(file: string, links: Link[], errorLinksInFile: string[]): Promise<void> {
  links.forEach(async link => {
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
    if (isBroken) {
      const errorMessage = `Error: [${file}] ${link.address} on line ${link.lineNumber} is unreachable.`;
      errorLinksInFile.push(errorMessage);
      // console.log(errorMessage);
    } else {
      console.log(`Info: [${file}] ${link.address} on line ${link.lineNumber}.`);
    }
  });

  console.log(`error links len: ${errorLinksInFile.length}`)
  return;
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

      const links = line.match(/\[[^\[]+\]\(([^\)]+(\)[a-zA-Z0-9-]*.\w*\)|\)))|\[[a-zA-z0-9_-]+\]:\s*(\S+)/g);
      if (links) {
        for (let i = 0; i < links.length; i++) {
          const link = links[i].match(/\[[^\[]+\]\(([^\)]+(\)[a-zA-Z0-9-]*.\w+\)|\)))|\[[a-zA-z0-9_-]+\]:\s*(\S+)/);
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
