import { useCallback, useRef, useState } from 'react'

export function useVoiceRecorder() {
  const [isRecording, setIsRecording] = useState(false)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<BlobPart[]>([])

  const startRecording = useCallback(async () => {
    if (!navigator.mediaDevices?.getUserMedia) {
      throw new Error('Microphone is not supported in this browser')
    }

    const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
    const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
      ? 'audio/webm;codecs=opus'
      : MediaRecorder.isTypeSupported('audio/webm')
        ? 'audio/webm'
        : ''

    const recorder = mimeType
      ? new MediaRecorder(stream, { mimeType })
      : new MediaRecorder(stream)

    chunksRef.current = []
    recorder.ondataavailable = (event) => {
      if (event.data.size > 0) {
        chunksRef.current.push(event.data)
      }
    }

    mediaRecorderRef.current = recorder
    recorder.start()
    setIsRecording(true)
  }, [])

  const stopRecording = useCallback(async (): Promise<Blob> => {
    const recorder = mediaRecorderRef.current
    if (!recorder) {
      throw new Error('No active recording')
    }

    return new Promise((resolve, reject) => {
      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, {
          type: recorder.mimeType || 'audio/webm',
        })
        recorder.stream.getTracks().forEach((track) => track.stop())
        mediaRecorderRef.current = null
        chunksRef.current = []
        setIsRecording(false)
        resolve(blob)
      }

      recorder.onerror = () => {
        reject(new Error('Recording failed'))
      }

      if (recorder.state !== 'inactive') {
        recorder.stop()
      }
    })
  }, [])

  const cancelRecording = useCallback(() => {
    const recorder = mediaRecorderRef.current
    if (!recorder) return

    recorder.stream.getTracks().forEach((track) => track.stop())
    mediaRecorderRef.current = null
    chunksRef.current = []
    setIsRecording(false)
  }, [])

  return {
    isRecording,
    startRecording,
    stopRecording,
    cancelRecording,
  }
}
