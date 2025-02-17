"use client"
import { useEffect, useRef, useState } from "react";

interface AudioDevice {
  id: string;
  name: string;
}

export default function Home() {
  const [microphonePermissionState, setMicrophonePermissionState] = useState<"granted" | "prompt" | "denied">("denied")
  const [availableAudioDevices, setAvailableAudioDevices] = useState<AudioDevice[]>([])
  const [selectedAudioDevices, setSelectedAudioDevices] = useState<string | undefined>(undefined)
  const [isRecording, setIsRecording] = useState<boolean>(false)
  const [saveAudios, setSaveAudios] = useState<any[]>([])

  const mediaRecorder = useRef<any>(undefined);

  //Handle Permisson state
  const handlePermissionState = (state: "granted" | "prompt" | "denied") => {
    setMicrophonePermissionState(state);
    if (state == "granted") {
      getAvailableAudioDevices().then((devices) => {
        setAvailableAudioDevices(devices);
        setSelectedAudioDevices(devices.find((device) => device.id === "default")?.id)
      })
    }
  }

  //Get available audio devices
  function getAvailableAudioDevices(): Promise<any[]> {
    return new Promise<any[]>((resolve) => {
      navigator.mediaDevices.enumerateDevices().then((devices) => {
        const availableDevices = devices
        .filter((d) => d.kind === "audioinput" )
        .map((d) => ({ id: d.deviceId, name: d.label }));

        resolve(availableDevices)
      })
    })
  }

  //Handle on change audio device
  const handleClickSelectedAudioDevice = (id: string) => {
    setSelectedAudioDevices(id)
  }

  //Handle to click start record
  const handleClickStartRecord = () => {
    if (selectedAudioDevices) {
      setIsRecording(true);
      const audio = selectedAudioDevices!.length > 0 ? { deviceId: selectedAudioDevices } : true;

      navigator.mediaDevices.getUserMedia({ audio: audio, video: false }).then((stream) => {
        const options = { mimeType: "audio/webm" }
        const recordedChunks: any[] = [];

        mediaRecorder.current = new MediaRecorder(stream, options);

        mediaRecorder.current.addEventListener("dataavailable", function(e: any){
          if(e.data.size > 0) recordedChunks.push(e.data)
        })

        mediaRecorder.current.addEventListener("stop", function(e: any){
          setSaveAudios(prev => [...prev, recordedChunks])

          stream.getTracks().forEach(function(track) {
            track.stop();
          })
        })

        mediaRecorder.current.start();

      })
    }
  }

  //Handle on click stop recording
  function handleClickStopRecord() {
    setIsRecording(false)
    if (mediaRecorder) {
      mediaRecorder.current.stop();
    }
  }

  //Get audio URL from save chunks
  const getAudioRef = (index: number) => {
    const recordedChunks = saveAudios[index];
    return URL.createObjectURL(new Blob(recordedChunks))
  }

  useEffect(() => {
    navigator.permissions.query({ name: "microphone" as PermissionName })
    .then(function (queryResults){
      handlePermissionState(queryResults.state)
      queryResults.onchange = function(onChangeResult){
        if (onChangeResult.target) {
          handlePermissionState((onChangeResult.target as PermissionStatus).state)
        }
      }
    });
  }, []);

  return (
    <div className="w-screen h-screen flex items-start justify-center">
      <div className="flex flex-col gap-8 mt-40">
        <h1 className="text-4xl font-bold text-gray-800">Javascript Audio Manager</h1>
        {microphonePermissionState === "granted" && (
          <div className=" flex items-center gap-4 bg-green-800 w-fit rounded-full py-1 px-3 text-white">
            <p className="text-sm font-medium">Has microphone permission</p>
          </div>
        )}
        {microphonePermissionState === "prompt" && (
          <div className=" flex items-center gap-4 bg-red-800 w-fit rounded-full py-1 px-3 text-white">
            <p className="text-sm font-medium">Does not have microphone permission yet</p>
          </div>
        )}
        {microphonePermissionState === "denied" && (
          <div className=" flex items-center gap-4 bg-red-800 w-fit rounded-full py-1 px-3 text-white">
            <p className="text-sm font-medium">User declined permission</p>
          </div>
        )}
        {microphonePermissionState === "granted" && !isRecording && (
          <button type="button" onClick={handleClickStartRecord} className="rounded-md bg-red-600 px-2.5 py-1.5 text-sm font-semibold text-white shadow-sm hover:bg-red-500 focus-visible:bg-red-400">
            Record
          </button>
        )}
        {microphonePermissionState === "granted" && isRecording && (
          <button type="button" onClick={handleClickStopRecord} className="rounded-md bg-red-600 px-2.5 py-1.5 text-sm font-semibold text-white shadow-sm hover:bg-red-500 focus-visible:bg-red-400">
            Stop
          </button>
        )}
        {microphonePermissionState === "granted" && (
          <div className="space-y-4 mt-8">
            <h3 className="text-base font-semibold text-gray-800">Devices</h3>
            {availableAudioDevices.map((audioDevice, index) => (
              <label 
                key={index}
                className={`relative block cursor-pointer rounded-lg border bg-white px-6 py-4 shadow-sm focus:outline-none ${selectedAudioDevices === audioDevice.id ? "border-indigo-600 ring-2 ring-indigo-600" : ""}`}
                onClick={() => handleClickSelectedAudioDevice(audioDevice.id)}
              >
                <span className="flex items-center">
                  <span className="flex flex-col text-sm">
                    <span className="font-medium text-gray-900">{audioDevice.name}</span>
                    <span className="text-gray-500">
                      <span className="block sm:inline text-xs">{audioDevice.id}</span>
                    </span>
                  </span>
                </span>
                <span className="pointer-events-none absolute -inset-px rounded-lg border-2" aria-hidden="true"></span>
              </label>
            ))}
          </div>
        )}
        {saveAudios.length > 0 && 
          <div className="space-y-4 mt-8">
            <h3 className="text-base font-semibold text-gray-800">Audios</h3>
            <ul role="list" className="divide-y divide-gray-100 overflow-hidden bg-white shadow-sm ring-1 ring-gray-900/5 sm:rounded-xl">
              {saveAudios.map((audio, index) => (
                <li key={index} className=" relative flex justify-between items-center gap-x-6 px-4 py-2 sm:px-6">
                  <div className="flex gap-x-4 items-center gap-8">
                    <div className="min-w-0 flex-auto">
                      <p className="text-sm font-semibold leading-6 text-gray-900">Audio {index + 1}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-x-4">
                    <div className="hidden sm:flex sm:flex-col sm:items-end">
                      <audio src={getAudioRef(index)} controls></audio>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        }
      </div>
    </div>
  );
}
