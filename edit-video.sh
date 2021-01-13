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

    # in second
    timeList=(0 600 1200 1800 2400 3000)

    # in second
    duration=600

    for i in ${!timeList[@]}; do
        formattedIndex=$(($i + 1))
        time="${timeList[$i]}"
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