const fs = require('fs');

/**
 * 
 * @param {number} begin - index of the first test case
 * @param {number} size - number of test cases to run
 * @description 
 * Runs testcases within supplied range, extracts testcases from data/input folder,
 * processes the extracted data and writes corresponding output into 
 * data/output folder.
 */
const runTestCases = function (begin = 0, size = 5) {
    //register test cases here
    let testCases = ['a.txt', 'b.txt', 'c.txt',
        'd.txt', 'e.txt',
        'f.txt'
    ];

    if (begin != 0 || size != 5) testCases = testCases.slice(begin, size);

    //read testcase from file, process and write to Output
    for (let test of testCases) {
        const _input = fs.readFileSync(`data/input/${test}`, 'utf8');
        const _output = processData(_input, test);
        fs.writeFileSync(`data/output/${test.replace('in', 'out')}`, _output);
    }
}

/**
 * 
 * @param {string} str - space delimited string
 * @returns {number[]} - list of integers
 * @description parses space delimited strings into a list of integers
 */
const strToArray = function (str) {
    str = str.trim().replace("\r");
    return str.split(' ').map(o =>
        (!isNaN(o)) ? parseInt(o) : o
    );
}


/**
 * 
 * @param {string} input - raw testcase input from file.
 * @param {string} noOfScanningDays - Number of days for scanning.
 * @returns {Object[]} - returns libraries, their meta-datas and assigned priorities.
 * @description
 * parses string into List of library data
 * computes priority for each library based on (
 * library Books Score(aka bookWeight), bookDispatchRate(
 *  for most testCases its constant except for type f which is directly
 *  proportional to each library bookLength
 *) and noOfBookSignupDays
 *)processes and schedules books in order of priority
 */
const processData = (input, test) => {
    const _datasets = input.split('\n');
    //begin parse data input into proper data structure for data-processing
    let dataStructure = parseDataSet(_datasets);
    //end parse data input into proper data structure for data-processing

    let result = [], outputFormat;
    //pass input into BusinessLogic (replace name as appropriate)
    result = fnTrafficSignalling(...dataStructure/*args*/);

    const performance = resultPerformance(result);
    //console.log(performance);
    outputFormat = formatOutputData(result);
    return outputFormat;
}

const parseDataSet = function (_datasets, cb) {
    let [durationOfSimulation, noOfIntersection, noOfStreets, noOfCars, CarBonus] = strToArray(_datasets[0]);

    let streets = [], currLine = 1;
    const intersections = new Array(noOfIntersection).fill(null);
    const streetIndexByName = {};
    for (let i = 0; i < noOfStreets; i++) {
        let streetArr = strToArray(_datasets[currLine++]);
        let street = {
            "INTERSECTION": [streetArr[0], streetArr[1]],
            "NAME": streetArr[2],
            "TIME_TAKEN": streetArr[3]
        }

        streetIndexByName[street.NAME] = street;
        //if (intersections[streetArr[0]] == null)
        //    intersections[streetArr[0]] = { ID: streetArr[0], STREETS: [] };

        if (intersections[streetArr[1]] == null)
            intersections[streetArr[1]] = { ID: streetArr[1], STREETS: [] };

        //intersections[streetArr[0]].STREETS.push(street);
        intersections[streetArr[1]].STREETS.push(street);

        streets.push(street);
    }

    let carPaths = [];
    for (let i = 0; i < noOfCars; i++) {
        let carDescArr = strToArray(_datasets[currLine++]);
        let PATHS = carDescArr.slice(1);
        carPaths.push({ PATHS });
    }

    return [durationOfSimulation, noOfIntersection, CarBonus, streets, carPaths, intersections, streetIndexByName];
}

/**
 * 
 * @param {number[][]} result - book scanning algorithm output(resultFormat => [[libIndex, len(booksScanned), booksScanned]]).
 * @param {Object[]} bookScore - An Hashmap of all books in the system and their corresponding bookScore.
 * @param {number} maxScore - A sum of all available book scores in the system.
 * @returns {number[]} - returns [score, maxScore, percentageScore]
 * @description Evaluate Algorithm performance locally before uploading to hashcode judge system. 
 * It compares scores of all books in the system(maxScore) to the overall score of books scanned(score).
 */
const resultPerformance = function (result, /*args*/) {
    //let score = result.reduce((a, b, i) => 0/*define logic*/);
    //let maxScore = 0/*write maxScore Logic*/;

    //return [score, maxScore, (score / maxScore) * 100];
    return [0, 0, 0];
}

/**
 * 
 * @param {number[][]} result - book scanning algorithm output(resultFormat => [[libIndex, len(booksScanned), booksScanned]]).
 * @param {Object[]} bookScore - An Hashmap of all books in the system and their corresponding bookScore.
 * @param {number} maxScore - A sum of all available book scores in the system.
 * @returns {number[]} - returns [score, maxScore, percentageScore]
 * @description Evaluate Algorithm performance locally before uploading to hashcode judge system. 
 * It compares scores of all books in the system(maxScore) to the overall score of books scanned(score).
 */
const formatOutputData = function (result, /*args*/) {
    let outputFormat = [result.length];

    for (let res of result) {
        let { ID, STREETS } = res;
        outputFormat.push(ID);
        outputFormat.push(STREETS.length);
        for (let street of STREETS) {
            let { NAME, TIME_TAKEN } = street;
            outputFormat.push(`${NAME} ${TIME_TAKEN}`);
        }
    }

    return outputFormat.join("\n");
}

const fakeSimulation = function (durationOfSimulation, noOfIntersection, CarBonus, streets, carPaths, intersections) {
    let result = [];
    let simulationTime = durationOfSimulation;
    let i = 0;
    while (simulationTime != 0) {
        let len = intersections.length;
        let intersection = Math.floor(Math.random() * len);
        let objIntersection = intersections[intersection];
        if (len === 0) break;

        let streets = objIntersection.STREETS.sort((a, b) => a - b);
        let streetLength = Math.floor(Math.random() * streets.length) + 1;

        let streetSchedule = [];
        for (let i = 0; i < streetLength; i++) {
            let street = streets[i];
            let _t = street.TIME_TAKEN;
            //console.log(street);
            let TIME_TAKEN = Math.floor(Math.random() * _t) + 1;

            if (simulationTime < TIME_TAKEN)
                TIME_TAKEN = simulationTime;

            streetSchedule.push({ NAME: street.NAME, TIME_TAKEN });

            simulationTime -= TIME_TAKEN;
        }

        result.push({
            ID: objIntersection.ID,
            STREETS: streetSchedule
        });

        if (++i == 1000) break;
        intersections.splice(intersection, 1);
        //console.log(simulationTime, result);
    }

    return result;
}

const fnTrafficSimulate = function (durationOfSimulation, noOfIntersection, CarBonus, streets, carPaths, intersections, streetIndexByName) {
    let simulationTime = 0;

    //start with FCFS
    let carIndex = 0;
    let schedule = {};
    while (simulationTime < durationOfSimulation) {
        if (carIndex >= carPaths.length) break;

        let car = carPaths[carIndex++];
        let { PATHS } = car;
        let streetIndex = 1;
        let streetLength = PATHS.length;
        for (streetIndex = 1; streetIndex < streetLength; streetIndex++) {
            let street = PATHS[streetIndex];
            let streetObj = streetIndexByName[street];

            let { NAME, TIME_TAKEN, INTERSECTION } = streetObj;
            let inComingJunction = INTERSECTION[1];
            let streetInfo = { NAME, TIME_TAKEN };

            let remainingTime = durationOfSimulation - simulationTime;

            if (TIME_TAKEN > remainingTime)
                TIME_TAKEN = remainingTime;

            simulationTime += TIME_TAKEN;

            if (!schedule[inComingJunction])
                schedule[inComingJunction] = [];

            schedule[inComingJunction].push(streetInfo);
        }

    }

    let result = [], junction;
    for (junction in schedule) {
        let streetInfo = schedule[junction];
        result.push({
            "ID": junction,
            "STREETS": streetInfo
        });
    }

    return result;
}

/**
 * 
 * @param {Object[]} Libraries - A list of library(Hashmap).
 * @param {number} noOfScanningDays - Number of days for scanning.
 * @returns {number[][]} - returns libraries, number of bookScanned in each library and the corresponding books.
 * @description Algorithm that schedules books for scanning.
 */
const fnTrafficSignalling = function (durationOfSimulation, noOfIntersection, CarBonus, streets, carPaths, intersections, streetIndexByName) {
    let result = [];
    let simulationTime = durationOfSimulation;
    let i = 0;
    //console.log(JSON.stringify(intersections, null, 1), streets);
   
    result = fnTrafficSimulate(durationOfSimulation, noOfIntersection, CarBonus, streets, carPaths, intersections, streetIndexByName);

    console.log(JSON.stringify(result, null, 2));

    //let intersections = [
    //    {
    //        ID: 1,
    //        STREETS: [
    //            { "NAME": "rue-d-athenes", "TIME_TAKEN": 2 },
    //            { "NAME": "rue-d-amsterdam", "TIME_TAKEN": 1 }
    //        ]
    //    },
    //    {
    //        ID: 0,
    //        STREETS: [
    //            { "NAME": "rue-de-londres", "TIME_TAKEN": 2 }
    //        ]
    //    },
    //    {
    //        ID: 2,
    //        STREETS: [
    //            { "NAME": "rue-de-moscou", "TIME_TAKEN": 1 }
    //        ]
    //    }
    //];

    //result = intersections;

    return result;
}

//run test cases 
console.clear();
console.log("running.......");
runTestCases(0,1);
console.log("done.");

// node.js get keypress
var stdin = process.stdin;

// without this, we would only get streams once enter is pressed
//stdin.setRawMode( true );

// resume stdin in the parent process (node app won't quit all by itself
// unless an error or process.exit() happens)
stdin.resume();
// i don't want binary, do you?
stdin.setEncoding('utf8');

// on any data into stdin
stdin.on('data', function (key) {
    // ctrl-c ( end of text )
    if (key === '\u0003') {
        process.exit();
    }

    // write the key to stdout all normal like
    // process.stdout.write( key );
});