const request = require('request');
var bodyParser = require("body-parser");
var express = require('express');

var app = express();
app.use(bodyParser.urlencoded({ extended : false }));
app.use(bodyParser.json());

var port = process.env.port || 3939;
var devices = []; //Array that contains all registered devices

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

    //Check 'id' field if present
    if(configObject.hasOwnProperty("id"))
    {
        if(typeof configObject.id != "number")
        {
            return  {
                        "valid" : false,
                        "message" : "The 'id' attribute must be a number"
                    }
        }
    }

    //TODO: Check that path specified by source exists
    //TODO: Check that a value can be written to or read from source

    //If we passed all the checks we can return succsessfully
    return  {
                "valid" : true
            }
}

//Function to generate a unique id
var currentID = 1;
function getUniqueID()
{
    return currentID++;
}

//Function that is used to find a registered object by id
//Returns the object if found and null otherwise
function findDevice(id)
{
    //TODO: Could maybe use a hash table to speed up searching
    
    for(var searchIndex = 0; searchIndex < deviceConfigs.length; i++)
    {
        if(devices[searchIndex].id == id)
        {
            return devices[searchIndex];
        }
    }

    return null;
}

//Endpoint: register
app.get("/register", function(request, response)
{
    var deviceConfigs = request.body;
    var requestingServerIP = request.get("host");
    var requestingServerPort = 3838;

    var results = [];
    var numUpdates = 0;
    var numRegister = 0;
    for(var i = 0; i < deviceConfigs.length; i++)
    {
        var checkObject = checkConfigObject(deviceConfigs[i]);
        if(checkObject.valid)
        {   
            if(deviceConfigs[i].hasOwnProperty("id"))
            {
                //If the object has an id we try to update it, otherwise we register it
                var updateObject = findDevice(deviceConfigs[i].id);

                if(updateObject != null)
                {
                    //We found the object so update it
                    updateObject.name = deviceConfigs[i].name;
                    updateObject.type = deviceConfigs[i].type;
                    updateObject.datatype = deviceConfigs[i].datatype;
                    
                    if(updateObject.datatype == "boolean")
                    {
                        updateObject.min = 0;
                        updateObject.max = 1;
                    }
                    else
                    {
                        updateObject.min = deviceConfigs[i].min;
                        updateObject.max = deviceConfigs[i].max;
                    }

                    updateObject.server = requestingServerIP;
                    updateObject.port = requestingServerPort;

                    results.push({
                        "status" : "ok",
                        "id" : deviceID
                    });
                    numUpdates++;
                    continue;
                }
            }

            //Register the device since it was not already registered
            switch(deviceConfigs[i].datatype)
            {
                case "float":
                {
                    break;   
                }
                case "integer":
                {
                    break;
                }
                case "boolean":
                {
                    deviceConfigs[i].min = 0;
                    deviceConfigs[i].max = 1;
                    break;
                }
            }

            //Assign the device an id
            var deviceID = getUniqueID();

            //Create a registration object for the device
            var device = 
            {
                "id" : deviceID,
                "name": deviceConfigs[i].name,
                "type" : deviceConfigs[i].type,
                "datatype" : deviceConfigs[i].datatype,
                "min" : deviceConfigs[i].min,
                "max" : deviceConfigs[i].max,
                "server" : requestingServerIP,
                "port" : requestingServerPort
            }

            //Add the device to the array of registered devices
            devices.push(device);

            //Indicate success in the results of the response
            results.push({
                "status" : "ok",
                "id" : deviceID
            });
            numRegister++;
        }
        else
        {
            //The registration object is not valid
            console.log("Registration for object " + (i+1) + " is invalid, skipping device.");
            console.log("\tReason: " + checkObject.message);

            //Indicate failure in the results of the response
            results.push({
                "status" : "failed",
                "message" : checkObject.message
            });
        }
    }
    
    if(numUpdates > 0)
    {
        console.log("Updated " + numUpdates + " device(s)");
    }

    if(numRegister > 0)
    {
        console.log("Registered " + numRegister + " device(s)")
    }

    console.log("Regestered devices:\n");
    console.debug(devices);

    //Complete request
    response.end(JSON.stringify(results));
});

app.listen(port, function ()
{
    console.log("Sensor manager server running on port " + port + " (Started " + new Date() + ")");
});