# sensor-server
Server that provides an API interface for controlling and monitoring devices.

# Endpoints
## /poll
This enpoint retrieves an array of samples from all or the specified sensors.

### Request body:
-None: Retrieves array consisting of a sample from every sensor
or
-Array containing the sensor ids of the sensors to be polled
    Request Example:
    ```
    {
        "ids": [
            12,
            8,
            52
        ]
    }
    ```
### Response body:
Response example:
```
[
    {
        "id" : 12,
        "status" : "ok",
        "value" : 1.673
    },
    {
        "id" : 8,
        "status" : "failed",
        "message" : "Sensor value could not be read"
    },
    {
        "id" : 52,
        "status" : "ok",
        "value" : true
    }
]
```
# Usage
## The devices.json file
blah blah

## Plugins
blah blah