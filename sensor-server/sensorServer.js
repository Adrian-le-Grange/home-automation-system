var fs = require("fs");
var request = require("request");
var bodyParser = require('body-parser');
var express = require("express");
var ip = require("ip");
var app = express();
app.use(bodyParser.json());
var port = process.env.port || 3838;

//Set local address
var server = ip.address();

const sensorHubIP = "127.0.0.1";
const sensorHubPort = "3939";

const configRefreshRate = 5000;

//Function to check if a given config object (objects contained in 
//devices.json) is valid
//If valid the function returns:
//{
//  "valid" : true
//}
//
//If invalid the function returns:
//{
//  "valid" : false,
//  "message" : "description of problem"
//}
function checkConfigObject(configObject)
{
    //Check 'name'
    if(!configObject.hasOwnProperty('name'))
    {
        return  {
                    "valid" : false,
                    "message" : "Device configuration object is missing the 'name' attribute"
                }
    }

    if(configObject.name == "")
    {
        return  {
                    "valid" : false,
                    "message" : "The 'name' attribute may not be an empty string"
                }
    }

    //Check 'type'
    if(!configObject.hasOwnProperty('type'))
    {
        return  {
                    "valid" : false,
                    "message" : "Device configuration object is missing the 'type' attribute"
                }
    }

    if(configObject.type == "")
    {
        return  {
                    "valid" : false,
                    "message" : "The 'type' attribute may not be an empty string"
                }
    }

    //Check 'datatype'
    if(!configObject.hasOwnProperty('datatype'))
    {
        return  {
                    "valid" : false,
                    "message" : "Device configuration object is missing the 'datatype' attribute"
                }
    }

    if(configObject.datatype == "")
    {
        return  {
                    "valid" : false,
                    "message" : "The 'datatype' attribute may not be an empty string"
                }
    }

    //Check 'source'
    if(!configObject.hasOwnProperty('source'))
    {
        return  {
                    "valid" : false,
                    "message" : "Device configuration object is missing the 'source' attribute"
                }
    }

    if(configObject.source == "")
    {
        return  {
                    "valid" : false,
                    "message" : "The 'source' attribute may not be an empty string"
                }
    }

    switch(configObject.type)
    {
        case "input":
        {
            break;
        }
        case "output":
        {
            //Check 'initialValue'
            if(!configObject.hasOwnProperty('initialValue'))
            {
                return  {
                            "valid" : false,
                            "message" : "Device configuration object is missing the 'initialValue' attribute"
                        }
            }

            //TODO: Check type of initialValue
            break;
        }
        default:
                return  {
                            "valid" : false,
                            "message" : "The type '" + configObject.datatype + "' is not a valid type"
                        }
    }

    switch(configObject.datatype)
    {
        case "float":
        {
            //Check 'min'
            if(!configObject.hasOwnProperty('min'))
            {
                return  {
                            "valid" : false,
                            "message" : "Device configuration object is missing the 'min' attribute"
                        }
            }

            if(typeof configObject.min != "number")
            {
                return  {
                            "valid" : false,
                            "message" : "The 'min' attribute must be a float as specified by the datatype"
                        }
            }

            //Check 'max'
            if(!configObject.hasOwnProperty('max'))
            {
                return  {
                            "valid" : false,
                            "message" : "Device configuration object is missing the 'max' attribute"
                        }
            }

            if(typeof configObject.max != "number")
            {
                return  {
                            "valid" : false,
                            "message" : "The 'max' attribute must be a float as specified by the datatype"
                        }
            }
            break;
        }
        case "boolean":
        {
            break;
        }
        case "integer":
        {
            //Check 'min'
            if(!configObject.hasOwnProperty('min'))
            {
                return  {
                            "valid" : false,
                            "message" : "Device configuration object is missing the 'min' attribute"
                        }
            }

            if(typeof configObject.min != "number")
            {
                return  {
                            "valid" : false,
                            "message" : "The 'min' attribute must be a float as specified by the datatype"
                        }
            }

            //Check 'max'
            if(!configObject.hasOwnProperty('max'))
            {
                return  {
                            "valid" : false,
                            "message" : "Device configuration object is missing the 'max' attribute"
                        }
            }

            if(typeof configObject.max != "number")
            {
                return  {
                            "valid" : false,
                            "message" : "The 'max' attribute must be a float as specified by the datatype"
                        }
            }
            break;
        }
        default:
        {
            return  {
                        "valid" : false,
                        "message" : "The datatype '" + configObject.datatype + "' is not a valid datatype"
                    }
        }
    }

    //Check 'unit'
    if(!configObject.hasOwnProperty('unit'))
    {
        return  {
                    "valid" : false,
                    "message" : "Device configuration object is missing the 'unit' attribute"
                }
    }

    if(configObject.source == "")
    {
        return  {
                    "valid" : false,
                    "message" : "The 'unit' attribute may not be an empty string"
                }
    }

    //TODO: Check that path specified by source exists
    //TODO: Check that a value can be written to or read from source

    //If we passed all the checks we can return succsessfully
    return  {
                "valid" : true
            }
}

function overwriteConfigFile(configsArray)
{
    //Overwrite config file with the updated configs
    fs.renameSync("./devices.json", "./devices.json.old");
    var configFile = JSON.stringify(configsArray, null, 2);
    fs.appendFileSync("./devices.json", configFile);
    fs.unlinkSync("./devices.json.old") ;
}

function removeConfigFileIDs(configsArray)
{
    //We remove all ids from config file as if we are registering all devices again
    for(i = 0; i < configsArray.length; i++)
    {
        if(configsArray[i].hasOwnProperty('id'))
        {
            delete configsArray[i].id;
        }
    }

    //Write the updated configs back to file
    overwriteConfigFile(configsArray);
}

function initialize(registeredDevices)
{
    var registerArray = []; //Array that keeps the register objects of all sensors that need to be registered

    //Check if all devices have an id field.
    var numNewConfigurations = 0;
    for(var i = 0; i < registeredDevices.length; i++)
    {
        var checkObject = checkConfigObject(registeredDevices[i]);
        if(checkObject.valid)
        {
            //The object configuration is valid
            
            //If there is no 'id' attribute then the device has not been registered
            if(!registeredDevices[i].hasOwnProperty('id'))
            {
                //We need to register device on the sensor interface server

                //Create a registration object for the device
                numNewConfigurations++;
                var registerObject = 
                    {
                        "name": registeredDevices[i].name,
                        "type" : registeredDevices[i].type,
                        "datatype" : registeredDevices[i].datatype,
                        "server" : server,
                        "port" : port,
                        "unit" : registeredDevices[i].unit
                    };

                //Outputs has a initial value attribute
                if(registerObject.type == "output")
                {
                    registerObject.initialValue = registeredDevices[i].initialValue;
                }

                //Float and integer types have min and max values
                switch(registeredDevices[i].datatype)
                {
                    case "float":
                    {
                        registerObject.min = registeredDevices[i].min;
                        registerObject.max = registeredDevices[i].max;
                        break;
                    }
                    case "integer":
                    {
                        registerObject.min = registeredDevices[i].min;
                        registerObject.max = registeredDevices[i].max;
                        break;
                    }
                    case "boolean":
                    {
                        break;
                    }
                }

                //Add the object to the array of objects that are going to be registered
                registerArray.push(registerObject);
            }
        }
        else
        {
            //The object configuration is not valid
            console.log("Configuration for device " + (i+1) + " is invalid, skipping device.");
            console.log("\tReason: " + checkObject.message);
        }
    }
    
    if(numNewConfigurations > 0)
    {
        console.log("Discovered " + numNewConfigurations + " new device configurations");

        //Now we register the devices that has not been regestered
        var requestOptions = {
            uri: "http://" + sensorHubIP + ":" + sensorHubPort + "/register",
            body: JSON.stringify(registerArray),
            method: 'GET',
            headers: 
                {
                    'Content-Type': 'application/json'
                }
        }
        request(requestOptions, (err, res, body) => {
            if(err)
            {
                console.log("Warning - Failed to register new devices");
                
                switch(err.code)
                {
                    case "ECONNREFUSED":
                    {
                        console.log("\tReason - Could not connect to sensor hub server @ " + sensorHubIP + ":" + sensorHubPort);
                        break;
                    }
                    default:
                    {
                        console.log("\tReason - " + err.Error);
                    }
                }
            }
            else //Request succeeded
            {
                var responses = JSON.parse(body);
                
                var numSuccessful = 0;
                var numFailed = 0;
                for(var i = 0; i < responses.length; i++)
                {
                    if(responses[i].status == "ok")
                    {
                        numSuccessful++;

                        //Store the allocated id for the device
                        registeredDevices[i].id = responses[i].id;
                    }
                    else
                    {
                        numFailed++;
                        console.log("Warning - Device registration failed");
                        console.log("\tReason: " + responses[i].message);
                    }
                }

                //Remove the local address and port from the config array (We dont want to save this in the config file)
                for(i = 0; i < registeredDevices.length; i++)
                {
                    delete registeredDevices[i].server;
                    delete registeredDevices[i].port;
                }

                //Overwrite devices.json file with the updated configs
                overwriteConfigFile(registeredDevices);

                if(numSuccessful > 0)
                {
                    console.log("Successfully registered " + numSuccessful + " new device(s)");
                }

                if(numFailed > 0)
                {
                    console.log("Could not register " + numFailed + " of the device(s)");
                }
            }
        });
    }
}

function updateDevices()
{
    //Read the config file
    registeredDevices = JSON.parse(fs.readFileSync('./devices.json', 'utf8'));

    //Attempt to register new devices (if any)
    initialize(registeredDevices);

    setTimeout(updateDevices, configRefreshRate);
}

function getCurrentDeviceValue(device)
{
    //Get the current value in the file
    var value = JSON.parse(fs.readFileSync(device.source));

    //Case the value to appropriate type
    switch(device.datatype)
    {
        case "integer":
        {
            value = parseInt(value);
            break;
        }
        case "float":
        {
            value = parseFloat(value);
            break;
        }
        case "boolean":
        {
            //No parsing neccesary for bool values. Already 0 or 1.
            break;
        }
    }

    return value;
}

//Function to retrieve a device's config object by the device ID
//Returns the device's config object if the ID was found and null otherwise
function getDeviceConfigByID(deviceID)
{
    for(i = 0; i < registeredDevices.length; i++)
    {
        if(registeredDevices[i].id == deviceID)
        {
            return registeredDevices[i];
        }
    }

    return null;
}

//Endpoint: poll
//TODO: Add ability to request array of specific sensors
app.get("/poll", function(request, response)
{   
    var responseObject = null;
    
    if(request.body.hasOwnProperty("id"))
    {   
        //Check if id is known
        var device = getDeviceConfigByID(request.body.id);
        if(device == null)
        {
            //Requested device does not exist
            responseObject = {
                "status" : "failed",
                "message" : "Requested device (id: " + request.body.id + ") does not exist"
            }
        }
        else
        {
            //Get current value from device
            var deviceValue = getCurrentDeviceValue(device);
            responseObject = {
                "status" : "ok",
                "id" : request.body.id,
                "value" : deviceValue
            }
        }
    }
    else
    {   
        //Return list of current sensor values and their respective ids
        responseObject = [];

        for(i = 0; i < registeredDevices.length; i++)
        {
            //Get reading from this sensor
            var value = getCurrentDeviceValue(registeredDevices[i]);

            responseObject.push({
                "status" : "ok",
                "id" : registeredDevices[i].id,
                "value" : value
            });
        }
    }
    
    //Respond with the requested values
    response.json(responseObject);
});

//Endpoint: control
app.get("/control", function(request, response)
{
    //Check request
    if(!request.body.hasOwnProperty("id"))
    {
        response.json({
        	"status" : "failed",
        	"message" : "No 'id' attribute specified"
		});
		return;
    }

    if(!request.body.hasOwnProperty("value"))
    {
        response.json({
            "status" : "failed",
            "message" : "No 'value' attribute specified"
		});
		return;
    }

    //Check if device id is known
    var deviceConfig = getDeviceConfigByID(request.body.id);
    if(deviceConfig == null)
    {
        response.json({
            "status" : "failed",
            "message" : "Device with id '" + request.body.id + "' could not be found"
		});
		return;
    }

	//Write given value to device file
	if(fs.existsSync(deviceConfig.source))
	{
    	fs.renameSync(deviceConfig.source, deviceConfig.source + ".old");
    	fs.appendFileSync(deviceConfig.source, request.body.value);
    	fs.unlinkSync(deviceConfig.source + ".old") ;
	}
	else
	{
		fs.appendFileSync(deviceConfig.source, request.body.value);
	}

    //Indicate succsess
    response.json({ "status" : "ok" });
});


//-- Initialize the server --//
console.log("Initializing...");

//Read the config file
var registeredDevices = JSON.parse(fs.readFileSync('./devices.json', 'utf8'));

//Remove config file IDs if specified
if(process.argv[2] == "-r")
{
    removeConfigFileIDs(registeredDevices);
    
    //Re-read configs as the id's have been removed from the file
    registeredDevices = JSON.parse(fs.readFileSync('./devices.json', 'utf8'));
    
    console.log("Removed device IDs");
}

//Start the server
app.listen(port, function ()
{
    console.log("Sensor server running " + "(Started " + new Date() + " on "+ server + ":" + port +")");
    updateDevices();
});