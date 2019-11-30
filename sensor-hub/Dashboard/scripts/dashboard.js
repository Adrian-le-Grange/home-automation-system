var pollingRate = 1000;
var sensorHubURI = "127.0.0.1";
var sensorHubPort = "3939";

var devices = [];
var deviceIDs = [];
var deviceWidgets = [];

$(document).ready(function () {
    //Collapse the sidebar when button is clicked
    $('#sidebarCollapse').on('click', function () {
        $('#sidebar').toggleClass('active');
    });

    var request = new XMLHttpRequest();
    request.open('GET', '/getDevices', false);  // `false` makes the request synchronous
    request.send(null);

    if (request.status === 200)
    {
        devices = JSON.parse(request.responseText);
        console.log("Discovered " + devices.length + " devices");
    }

    //Generate the widgets for the devices
    generateSensorWidgets();

    //Start updating the dash by polling the 
    /*
    $(function() {
        setTimeout(updateSensorValues, pollingRate);
    });
    */
});

function generateSensorWidgets()
{
    console.log("Generating widgets...");
    for(i = 0; i < devices.length; i++)
    {
        //Create the card
        var card = document.createElement('div');
        
        //Add id to card
        var sensorWidgetID = "sensor" + devices[i].id + "Widget";
        $(card).attr("id", sensorWidgetID);

        //Add title to card
        var title = document.createElement("div");
        $(title).attr("class", "widget-heading");
        title.innerHTML = devices[i].name;
        card.appendChild(title);

        console.log("Appending to DOM")
        //Add card to the widget container
        document.getElementById("widgetsContainer").appendChild(card);

        //Add canvas to card
        /*
        //Create the guage
        var gauge = new RadialGauge({
            renderTo: 'canvas-id',
            width: 300,
            height: 300,
            units: "Km/h",
            minValue: 0,
            startAngle: 0,
            ticksAngle: 180,
            valueBox: false,
            maxValue: 220,
            majorTicks: [
                "0",
                "20",
                "40",
                "60",
                "80",
                "100",
                "120",
                "140",
                "160",
                "180",
                "200",
                "220"
            ],
            minorTicks: 2,
            strokeTicks: true,
            highlights: [
                {
                    "from": 160,
                    "to": 220,
                    "color": "rgba(200, 50, 50, .75)"
                }
            ],
            colorPlate: "#fff",
            borderShadowWidth: 0,
            borders: false,
            needleType: "arrow",
            needleWidth: 2,
            needleCircleSize: 7,
            needleCircleOuter: true,
            needleCircleInner: false,
            animationDuration: 1500,
            animationRule: "linear",
            animationTarget: "plate"
        }).draw();
        */
    }
}

function updateSensorValues()
{
    //We retrieve the latest sensor values from the server
    var request = new Request(sensorHubURI + ":" + sensorHubPort + "/getUpdate", { method: 'GET', body: JSON.stringify(deviceIDs) });
    fetch(request).then(function(response) {
        return response.json();
    }).then(function(json) {
        console.log(json);
        //Update each of the device interfaces
    });

    setTimeout(updateSensorValues, pollingRate);
}