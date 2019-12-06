var pollingRate = 1000;
var sensorHubURI = "127.0.0.1";
var sensorHubPort = "3939";

var devices = [];
var deviceIDs = [];

function onReady()
{
    //Collapse the sidebar when button is clicked
    $('#sidebarCollapse').on('click', function () {
        $('#sidebar').toggleClass('active');
    });

    var request = new XMLHttpRequest();
    request.open('POST', '/getDevices', false);  // `false` makes the request synchronous
    request.send(null);

    if (request.status === 200)
    {
        devices = JSON.parse(request.responseText);
        console.log("Discovered " + devices.length + " devices");

        //Add discovered sensors to the list of IDs
        for(i = 0; i < devices.length; i++)
        {
            deviceIDs.push(devices[i].id);
        }
    }

    //Generate the widgets for the devices
    generateDeviceWidgets();

    //Start updating the dash by polling the sensor hub
    setTimeout(updateDeviceValues, pollingRate);
}
$(document).ready(onReady);

//Function that is used to find a registered object by id
//Returns the object if found and null otherwise
function findDevice(id)
{
    //TODO: Could maybe use a hash table to speed up searching

    for(var searchIndex = 0; searchIndex < devices.length; searchIndex++)
    {
        if(devices[searchIndex].id == id)
        {
            return devices[searchIndex];
        }
    }

    return null;
}

function roundTo(n, digits)
{
    if (digits === undefined)
    {
        digits = 0;
    }

    var multiplicator = Math.pow(10, digits);
    n = parseFloat((n * multiplicator).toFixed(11));
    var test = (Math.round(n) / multiplicator);
    return +(test.toFixed(digits));
  }

function generateTicks(min, max)
{
    var ticks = [];
    if(min == 0 && max == 1)
    {
        //Boolean value
        ticks = ["0" , "1"];
    }
    else
    {
        var range = max - min;
        var steps = 10;

        var stepSize = range/steps;

        var currentStepValue = min;
        ticks.push(roundTo(currentStepValue, 2).toString());

        for(var i = 0; i < steps; i++)
        {
            currentStepValue += stepSize;
            ticks.push(roundTo(currentStepValue, 2).toString());
        }
    }

    return ticks;
}

function generateHighlights(min, max, redPercentage)
{
    var highlights = [];

    var highlight = {
        "color": "rgba(200, 50, 50, .75)"
    }

    highlight.from = max - (max*(redPercentage/100));

    highlight.to = max;

    highlights.push(highlight);

    return highlights;
}

function generateDeviceWidgets()
{
    console.log("Generating widgets...");
    for(i = 0; i < devices.length; i++)
    {
        //Create the card
        var card = document.createElement('div');
        var sensorWidgetID = "sensor" + devices[i].id + "Widget";
        $(card).attr("id", sensorWidgetID);
        $(card).attr("class", "widget");

        //Add title to card
        var title = document.createElement("div");
        $(title).attr("class", "widget-heading");
        title.innerHTML = devices[i].name;
        card.appendChild(title);

        //Add gauge to card
        devices[i].gaugeUI = new RadialGauge({
            renderTo: document.createElement("canvas"),
            width: 300,
            height: 300,
            units: devices[i].unit,
            minValue: devices[i].min,
            maxValue: devices[i].max,
            majorTicks: generateTicks(devices[i].min, devices[i].max),
            minorTicks: 2,
            strokeTicks: true,
            highlights: generateHighlights(devices[i].min, devices[i].max, 10),
            colorPlate: "#fff",
            borderShadowWidth: 0,
            borders: false,
            needleType: "arrow",
            needleWidth: 2,
            needleCircleSize: 7,
            needleCircleOuter: true,
            needleCircleInner: false,
            animationDuration: 800,
            animationRule: "linear"
        });
        card.appendChild(devices[i].gaugeUI.options.renderTo);
        
        //Add status LED to card
        devices[i].statusLight = document.createElement("div");
        $(devices[i].statusLight).attr("class", "widget-status-led-green");
        card.appendChild(devices[i].statusLight);

        //Add card to the widget container
        document.getElementById("widgetsContainer").appendChild(card);

        //Draw our gauge
        devices[i].gaugeUI.draw();
    }
}

function updateDeviceValues()
{
    //Create query body
    var updateRequestBody = {};
    updateRequestBody.ids = deviceIDs;

    var request = new XMLHttpRequest();   // new HttpRequest instance 
    request.open("POST", "/getUpdate", false);
    request.setRequestHeader("Content-Type", "application/json; charset=UTF-8");
    request.send(JSON.stringify(updateRequestBody));

    if(request.status === 200)
    {
        var responseArray = JSON.parse(request.responseText);
        for(var i = 0; i < responseArray.length; i++)
        {
            var response = responseArray[i];

            if(response.status == "ok")
            {
                //Find the sensor with this id and update it's gauge value
                var device = findDevice(response.id);
                if(device != null)
                {
                    //console.log("Debug - Updated sensor (" + device.name + ")\n\tNew: " + response.value + " (Old: " + device.gaugeUI.value + ")");
                    //device.gaugeUI.update({ value : response.value });
                    device.gaugeUI.value = response.value;
                    //device.isResponding = response.isResponding;
                    if(response.isResponding)
                    {
                        $(device.statusLight).attr("class", "widget-status-led-green");
                    }
                    else
                    {
                        $(device.statusLight).attr("class", "widget-status-led-red");
                    }
                }
                else
                {
                    console.log("Warning - Recieved update for unknown device");
                }
            }
            else
            {
                //Indicate that this sensor is not updating or removed
                console.log("Warning - Update request to device id: " + device.id + " failed");
                console.log("\tReason: " + response.message);
            }
        }
    }
    else
    {
        console.log("Warning - Update request failed (Status code: " + request.status + ")");
    }

    setTimeout(updateDeviceValues, pollingRate);
}