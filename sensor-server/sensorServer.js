var fs = require('fs');
const request = require('request');
var express = require('express');
var app = express();
var port = process.env.port || 3838;

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
                        "min" : deviceConfigs[i].min,
                        "max" : deviceConfigs[i].max
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
            uri: "https://" + sensorManagementServerIP + ":" + sensorManagementServerPort + "/register",
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
            
            console.log("Debug - Response from registration:");
            console.log("\nBody\n" + body);
            console.log("\nResponse\n" + res);

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

            //Overwrite devices.json file with the updated configs
            fs.renameSync("./devices.json", "./devices.json.old");
            fs.appendFileSync("./devices.json", JSON.stringify(deviceConfigs));
            fs.unlinkSync("./devices.json.old") ;

            console.log("Successfully registered " + numSuccessful + " new device(s)");
        });
    }
}

//Endpoint: poll
app.get("/poll", function(request, response)
{
    //TODO: Check body of request for specific sensor values
    
    var jsonObject = [{ "Message":"Device 1" }, { "Message" : "Device 2" }];
    response.json(jsonObject);
});

//Endpoint: control
app.get("/control", function(request, response)
{    
    response.json({ "result":"ok" });
});

console.log("Initializing");
//Read the config file
var deviceConfigs = JSON.parse(fs.readFileSync('./devices.json', 'utf8'));
initialize(deviceConfigs);

app.listen(port, function ()
{
    console.log("Sensor server running on port " + port + " (Started " + new Date() + ")");
});