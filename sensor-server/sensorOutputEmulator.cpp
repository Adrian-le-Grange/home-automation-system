#include <string>
#include <fstream>
#include <iostream>
#include <unistd.h>
#include <cstring>

using namespace std;

void emulateBooleanSensor(string filename)
{
    //Randomise a boolean value
    bool value;
    if (rand() % 2 == 0)
    {
        value = true;
    }
    else
    {
        value = false;
    }
    
    //Create or overwrite file for sensor
    ofstream sensorFile;
    sensorFile.open(filename);

    //Write new value to sensor output file
    sensorFile << to_string(value);

    sensorFile.close();
}

void emulateFloatSensor(string filename)
{
    //Randomise a float value
    float value = static_cast<float>( rand()) / (static_cast<float>(RAND_MAX/5.0) );
    
    //Create or overwrite file for sensor
    ofstream sensorFile;
    sensorFile.open(filename);

    //Write new value to sensor output file
    sensorFile << to_string(value);

    sensorFile.close();
}

void emulateIntegerSensor(string filename)
{
    //Randomise a integer value
    int value = rand() % 100 + 1;
    
    //Create or overwrite file for sensor
    ofstream sensorFile;
    sensorFile.open(filename);

    //Write new value to sensor output file
    sensorFile << to_string(value);

    sensorFile.close();
}

int main(int argc, char** argv)
{
    int updateInterval = 1000;
    
    char intervalSwitch[] = "-i";
    if(argc > 1)
    {
        //Set update interval if it was specified
        if(strcmp(argv[1], intervalSwitch) == 0)
        {
            if(argc > 2)
            {
                updateInterval = stoi(argv[2]);
            }
            else
            {
                cout << "Interval was not specified." << endl;
                cout << "Example usage: ./sensorOutputEmulator -i 500" << endl;
                return 0;
            }
        }
    }

    cout << "Update interval: " << to_string(updateInterval) << "ms" << endl;    
    cout << "Emulating sensors..." << endl;

    while(true)
    {
        emulateFloatSensor("/tmp/sensor1.source");
        emulateBooleanSensor("/tmp/sensor2.source");
        emulateIntegerSensor("/tmp/sensor3.source");
        //cout << "Updated" << endl;
        usleep(updateInterval*1000);
    }

    return 0;
}