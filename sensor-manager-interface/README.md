# sensor-manager-interface
The main server for controlling and monitoring sensors using the sensor-server
API. The server provides a web user interface.

# Endpoints
## /registerDevice
This endpoint registers an array of new devices on the device manager.

### Request body:
Request Example:
```
[
    {
        "name": "Lettuce (Garden)",
        "type" : "input",
        "datatype" : "float",
        "min" : 0.0,
        "max" : 2.0
    }
]
```
### Response body:
Response example:
```
[
    {
        "id" : 20,
        "status" : "ok"
    }
]
```
# Usage