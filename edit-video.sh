#!/bin/zsh

mkdir -p "./inputFile"
mkdir -p "./outputFile"

convertVideoFormat() {
    inputFile=$1
    fileNameWithoutExtension=$2

    outputFile="$fileNameWithoutExtension.mp4"

    ffmpeg -i $inputFile -c copy $outputFile

    echo "convert video format done"
}

videoEdit() {
    inputFile=$1

    videoDuration=$(ffprobe -i $inputFile -show_entries format=duration -v quiet -of csv="p=0")
    echo "videoDuration = $videoDuration"

    totalMinutes=$(echo $videoDuration / 60 | node -p)
    echo "totalMinutes = $totalMinutes"

    totalMinutesRoundDown=$(echo $totalMinutes | awk '{print int($1)}')
    echo "totalMinutesRoundDown = $totalMinutesRoundDown"

    timeList=(0)
    loopTimes=$(echo $totalMinutesRoundDown / 10 + 1 | node -p)

    item=0
    for i in $(seq 1 $loopTimes); do
        if [ $i > 1 ]; then
            item=$(echo $item + 600 | node -p)
        fi
        
        timeList+=($item)
    done

    # in second
    duration=600

    for i in ${!timeList[@]}; do
        formattedIndex=$(($i + 1))
        time="${timeList[$i]}"
        echo "formattedIndex = $formattedIndex, time = $time"

        outputFile="./outputFile/video-output-part$formattedIndex.mp4"

        ffmpeg -i $inputFile -ss $time -t $duration -c copy $outputFile
    done

    echo "conversion done"
}

for file in ./inputFile/*; do
    echo "file = $file"

    fileName=$(basename $file)
    echo "fileName = $fileName"

    fileNameWithoutExtension=${file%.*}
    echo "fileNameWithoutExtension = $fileNameWithoutExtension"

    if [ -f $file ] && [ ${file: -4} != ".mp4" ]; then
        convertVideoFormat $file $fileNameWithoutExtension
    fi
    
    if [ -f $file ] && [ $file != *".DS_Store"* ]; then
        videoEdit $file
    fi
done