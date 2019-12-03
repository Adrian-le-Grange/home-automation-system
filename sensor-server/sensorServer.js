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

const sensorManagementServerIP = "127.0.0.1";
const sensorManagementServerPort = "3939";

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

function initialize(deviceConfigs)
{
    var registerArray = []; //Array that keeps the register objects of all
                            //sensors that need to be registered

    //Check if all devices have an id field.
    var numNewConfigurations = 0;
    for(var i = 0; i < deviceConfigs.length; i++)
    {
        var checkObject = checkConfigObject(deviceConfigs[i]);
        if(checkObject.valid)
        {
            //The object configuration is valid
            
            //If there is no 'id' attribute then the device has not been registered
            if(!deviceConfigs[i].hasOwnProperty('id'))
            {
                //We need to register device on the sensor interface server
                numNewConfigurations++;

                //Create a registration object for the device
                var registerObject = 
                    {
                        "name": deviceConfigs[i].name,
                        "type" : deviceConfigs[i].type,
                        "datatype" : deviceConfigs[i].datatype,
                        "server" : server,
                        "port" : port,
                        "unit" : deviceConfigs[i].unit
                    };

                //Outputs has a initial value attribute
                if(registerObject.type == "output")
                {
                    registerObject.initialValue = deviceConfigs[i].initialValue;
                }

                //Float and integer types have min and max values
                switch(deviceConfigs[i].datatype)
                {
                    case "float":
                    {
                        registerObject.min = deviceConfigs[i].min;
                        registerObject.max = deviceConfigs[i].max;
                        break;
                    }
                    case "integer":
                    {
                        registerObject.min = deviceConfigs[i].min;
                        registerObject.max = deviceConfigs[i].max;
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
            uri: "http://" + sensorManagementServerIP + ":" + sensorManagementServerPort + "/register",
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
                console.log("Error - Failed to register new devices");
                return console.log(err);
            }

            var responses = JSON.parse(body);
            var numSuccessful = 0;
            for(var i = 0; i < responses.length; i++)
            {
                if(responses[i].status == "ok")
                {
                    //We count how many of the devices registered successfully
                    numSuccessful++;

                    //Update the deviceConfiguration objects with their newly allocated ids
                    deviceConfigs[i].id = responses[i].id;
                }
                else
                {
                    console.log("Warning - Device registration failed");
                    if(responses[i].hasOwnProperty("message"))
                    {
                        console.log("\tReason: " + responses[i].message);
                    }
                }
            }

            //Remove the local address and port from the config array (We dont want to save this in the config file)
            for(i = 0; i < deviceConfigs.length; i++)
            {
                delete deviceConfigs[i].server;
                delete deviceConfigs[i].port;
            }

            //Overwrite devices.json file with the updated configs
            fs.renameSync("./devices.json", "./devices.json.old");
            //fs.appendFileSync("./devices.json", JSON.stringify(deviceConfigs));
            var configFile = JSON.stringify(deviceConfigs, null, 2);
            fs.appendFileSync("./devices.json", configFile);
            fs.unlinkSync("./devices.json.old") ;

            console.log("Successfully registered " + numSuccessful + " new device(s)");
        });
    }
}

function getCurrentDeviceValue(deviceConfig)
{
    //Get the current value in the file
    var value = JSON.parse(fs.readFileSync(deviceConfig.source));

    //Case the value to appropriate type
    switch(deviceConfig.datatype)
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
    for(i = 0; i < deviceConfigs.length; i++)
    {
        if(deviceConfigs[i].id == deviceID)
        {
            return deviceConfigs[i];
        }
    }

    return null;
}

//Endpoint: poll
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
        //  TODO: Add ability to request only specific sensors
        
        //Return list of current sensor values and their respective ids
        responseObject = [];
        
        for(i = 0; i < deviceConfigs.length; i++)
        {
            //Get reading from this sensor
            var value = getCurrentDeviceValue(deviceConfigs[i]);

            responseObject.push({
                "status" : "ok",
                "id" : deviceConfigs[i].id,
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
var deviceConfigs = JSON.parse(fs.readFileSync('./devices.json', 'utf8'));

//Remove config file IDs if specified
if(process.argv[2] == "-r")
{
    //We remove all ids from config file as if we are registering all devices again
    for(i = 0; i < deviceConfigs.length; i++)
    {
        if(deviceConfigs[i].hasOwnProperty('id'))
        {
            delete deviceConfigs[i].id;
        }
    }
    console.log("Removed device IDs");
}

initialize(deviceConfigs);

//Start the server
app.listen(port, function ()
{
    console.log("Sensor server running " + "(Started " + new Date() + " on "+ server + ":" + port +")");
});