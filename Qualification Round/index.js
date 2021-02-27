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
    const numOfRuns = 1;
    let _maxScore = 0;
    //pass input into BusinessLogic (replace name as appropriate)
    for (let i = 0; i < numOfRuns; i++) {
        //console.log("runnning...", i + 1);
        let localResult = fnTrafficSignalling(...dataStructure/*args*/);

        const perfArgs = [4, 2, 0, 6].map((i) => dataStructure[i]);
        const performance = resultPerformance(localResult, ...perfArgs);
        //console.log(performance);
        const [score, maxScore] = performance;
        if (score > _maxScore) {
            _maxScore = score;
            result = localResult;
            console.log(`score => ${score}/${maxScore}, percentage Score => ${(score / maxScore) * 100}%`);
        }
    }
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
const resultPerformance = function (result, carPaths, carBonus, durationOfSimulation, streetIndexByName) {
    let maxScore = computeScoreByCarPaths(carPaths, carBonus, durationOfSimulation, streetIndexByName);
    let scheduledCarPaths = createCarPathsFromSchedule(result, streetIndexByName);
    //remove cars that coudnt complete their journey
    //And append last street to completed journey to compute score correctly
    scheduledCarPaths = scheduledCarPaths.filter((carObj, i) => {
        const mainCarPathSize = carPaths[i].PATHS.length - 1;
        const journeyIsCompleted = carObj.PATHS.length === mainCarPathSize;
        const lastStreet = carPaths[i].PATHS[mainCarPathSize]; //same as lastStreet Index
        if (journeyIsCompleted)
            carObj.PATHS.push(lastStreet);

        return journeyIsCompleted;
    });
    //compute score
    let score = computeScoreByCarPaths(scheduledCarPaths, carBonus, durationOfSimulation, streetIndexByName);

    //console.log(`Simulation Duration => ${durationOfSimulation}`);

    return [score, maxScore, (score / maxScore) * 100];
}

const createCarPathsFromSchedule = function (schedule, streetIndexByName) {
    let carPaths = [];
    let _schedule;
    let totalDuration = 0;
    for (_schedule of schedule) {
        const { STREETS } = _schedule;
        let street;
        for (street of STREETS) {
            const { NAME } = street;
            totalDuration += street.TIME_TAKEN;
            const streetObj = streetIndexByName[NAME];
            const cars = streetObj.CARS;
            let car;
            for (car of cars) {
                if (!carPaths[car])
                    carPaths[car] = { PATHS: [] };
                carPaths[car].PATHS.push(NAME);
            }
        }
    }
    //console.log("schedule Duration => ", totalDuration);
    return carPaths;
}
const computeScoreByCarPaths = function (carPaths, carBonus, durationOfSimulation, streetIndexByName) {
    const score = carPaths.reduce(function (acc, cur) {
        const path = cur.PATHS;
        let totalTime = path.reduce((acc, street) => acc + streetIndexByName[street].TIME_TAKEN, 0) - streetIndexByName[path[0]].TIME_TAKEN;
        if (totalTime > durationOfSimulation)
            totalTime = null; //so bonus point for that

        const points = (!totalTime) ? 0 : carBonus + (durationOfSimulation - totalTime);
        return acc + points;
    }, 0);

    return score;
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

const shuffle = function (array) {
    for (let i = array.length - 1; i > 0; i--) {
        //uniform random probability
        let j = Math.floor(Math.random() * (i + 1)); // random index from 0 to i

        // swap elements array[i] and array[j]
        // we use "destructuring assignment" syntax to achieve that
        // you'll find more details about that syntax in later chapters
        // same can be written as:
        // let t = array[i]; array[i] = array[j]; array[j] = t
        [array[i], array[j]] = [array[j], array[i]];
    }
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

const AddCarsToStreet = function (streetIndexByName, carPaths) {
    let street, carIndex, car, i;
    for ([carIndex, car] of carPaths.entries()) {

        for ([i, street] of car.PATHS.entries()) {
            if (i == (car.PATHS.length - 1)) continue;
            let streetObj = streetIndexByName[street];
            if (!streetObj["CARS"])
                streetObj["CARS"] = [];
            streetObj["CARS"].push(carIndex);
        }
    }
}

const simulateByIntersectionTraffic = function (intersections, streetIndexByName, carPaths) {
    let schedule = {};
    let _intersections = [...intersections];
    //mutate streetsObject by adding respective cars on the street to the list
    AddCarsToStreet(streetIndexByName, carPaths);
    for (let intersection of _intersections) {
        let incomingJunction = intersection.ID;
        let streets = intersection.STREETS;
        streets = streets.filter((street) => street.CARS && (street.CARS.length > 0));
        for (street of streets) {
            let trafficCount = street.CARS.length;
            let { NAME } = street;
            let TIME_TAKEN = trafficCount;
            let scheduleInfo = { NAME, TIME_TAKEN }
            //keep traffic light for street on for trafficCount secs
            if (!schedule[incomingJunction])
                schedule[incomingJunction] = [];

            schedule[incomingJunction].push(scheduleInfo);
            //simulationTime += TIME_TAKEN;
        }
    }

    return schedule;
}

const simulateByStreetTraffic = function (streetIndexByName, streets, carPaths, intersections, durationOfSimulation) {
    let schedule = {};
    //mutate streetsObject by adding respective cars on the street to the list
    AddCarsToStreet(streetIndexByName, carPaths);
    //sort streets by traffic size in descending order
    let _streets = streets.filter((a) => (a.CARS || []).length > 0);
    shuffle(_streets);
    //_streets.sort((a, b) => b.CARS.length - a.CARS.length);
    let street, simulationTime = 0;
    for (street of _streets) {
        //if (simulationTime >= durationOfSimulation) break;
        let incomingJunction = street.INTERSECTION[1];
        let trafficCount = street.CARS.length;
        let { NAME } = street;
        let TIME_TAKEN = trafficCount;
        let scheduleInfo = { NAME, TIME_TAKEN }
        //keep traffic light for street on for trafficCount secs
        if (!schedule[incomingJunction])
            schedule[incomingJunction] = [];

        schedule[incomingJunction].push(scheduleInfo);
        simulationTime += TIME_TAKEN;
    }

    return schedule;
}

const fnTrafficSimulate = function (durationOfSimulation, noOfIntersection, CarBonus, streets, carPaths, intersections, streetIndexByName) {
    let simulationTime = 0, schedule = {};
    schedule = simulateByStreetTraffic(streetIndexByName, streets, carPaths, intersections, durationOfSimulation);
    //schedule = simulateByIntersectionTraffic(intersections, streetIndexByName, carPaths);

    //let _carPaths = [...carPaths];
    //_carPaths.sort(function (a, b) {
    //    const pathA = a.PATHS;
    //    const pathB = b.PATHS;
    //    //const priorityA = pathA.reduce((acc, cur) => acc + streetIndexByName[cur].TIME_TAKEN, 0) - streetIndexByName[pathA[0]].TIME_TAKEN;
    //    //const priorityB = pathB.reduce((acc, cur) => acc + streetIndexByName[cur].TIME_TAKEN, 0) - streetIndexByName[pathB[0]].TIME_TAKEN;

    //    //return priorityA - priorityB;
    //    return pathA.length - pathB.length;
    //});

    ////start with FCFS
    //let carIndex = 0;
    //let currentCarJourneyCompleted = false;
    //let carProcessed = [];
    //while (simulationTime < durationOfSimulation) {
    //    if (carIndex >= _carPaths.length) break;

    //    if (currentCarJourneyCompleted) {
    //        carProcessed.push(carIndex);
    //        currentCarJourneyCompleted = false;
    //    }

    //    let car = _carPaths[carIndex++];
    //    let { PATHS } = car;
    //    let streetIndex;
    //    let streetLength = PATHS.length;
    //    for (streetIndex = 0; streetIndex < streetLength - 1; streetIndex++) {
    //        if (simulationTime >= durationOfSimulation) break;

    //        // console.log(simulationTime, durationOfSimulation);


    //        let street = PATHS[streetIndex];
    //        let streetObj = streetIndexByName[street];

    //        let { NAME, TIME_TAKEN, INTERSECTION } = streetObj;
    //        TIME_TAKEN = 1;
    //        let inComingJunction = INTERSECTION[1];
    //        let streetInfo = { NAME, TIME_TAKEN };

    //        let remainingTime = durationOfSimulation - simulationTime;

    //        if (TIME_TAKEN > remainingTime)
    //            TIME_TAKEN = remainingTime;

    //        simulationTime += TIME_TAKEN;


    //        if (!schedule[inComingJunction])
    //            schedule[inComingJunction] = [];

    //        let _schedule = schedule[inComingJunction];
    //        let index = _schedule.findIndex((x) => streetInfo.NAME == x.NAME);
    //        if (_schedule.length && (index != -1)) {
    //            _schedule[index].TIME_TAKEN += streetInfo.TIME_TAKEN;
    //            //console.log("MULTIPLE STREET IN INTERSECTION FOUND");
    //        }
    //        else
    //            schedule[inComingJunction].push(streetInfo);

    //    }

    //    currentCarJourneyCompleted = true;
    //}

    //console.log(`NO OF CARS PROCESSED => ${carProcessed.length}/${carPaths.length}`, `SIMULATION RUN TIME => ${simulationTime}/${durationOfSimulation}`);


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

    //console.log(JSON.stringify(result, null, 2));
    return result;
}

//run test cases 
console.clear();
console.log("running.......");
runTestCases(3,4);
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