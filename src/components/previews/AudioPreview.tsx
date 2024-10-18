import { FC, useEffect, useRef, useState } from 'react'
import ReactAudioPlayer from 'react-audio-player'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faPlay, faPause, faVolumeUp, faVolumeMute, faDownload } from '@fortawesome/free-solid-svg-icons'
import { useRouter } from 'next/router'
import { formatModifiedDateTime } from '../../utils/fileDetails'
import { getStoredToken } from '../../utils/protectedRouteHandler'

enum PlayerState {
  Loading,
  Ready,
  Playing,
  Paused,
}

const AudioPreview: FC<{ file: OdFileObject }> = ({ file }) => {
  const { asPath } = useRouter()
  const hashedToken = getStoredToken(asPath)
  const rapRef = useRef<ReactAudioPlayer>(null)

  const [playerStatus, setPlayerStatus] = useState(PlayerState.Loading)
  const [playerVolume, setPlayerVolume] = useState(1)
  const [isMuted, setIsMuted] = useState(false)

  const thumbnail = `/api/thumbnail?path=${asPath}&size=medium${hashedToken ? `&odpt=${hashedToken}` : ''}`
  const [brokenThumbnail, setBrokenThumbnail] = useState(false)

  useEffect(() => {
    const rap = rapRef.current?.audioEl.current
    if (rap) {
      rap.oncanplay = () => setPlayerStatus(PlayerState.Ready)
      rap.onended = () => setPlayerStatus(PlayerState.Paused)
      rap.onpause = () => setPlayerStatus(PlayerState.Paused)
      rap.onplay = () => setPlayerStatus(PlayerState.Playing)
      rap.onvolumechange = () => setPlayerVolume(rap.volume)
    }
  }, [])

  const toggleMute = () => {
    const rap = rapRef.current?.audioEl.current
    if (rap) {
      rap.muted = !rap.muted
      setIsMuted(rap.muted)
    }
  }

  return (
    <div className="p-4 bg-white rounded-lg shadow-md dark:bg-gray-800">
      <div className="flex flex-col space-y-4 md:flex-row md:space-x-4">
        <div className="relative flex aspect-[2/1] w-full items-center justify-center rounded-full bg-gray-100 transition-all duration-75 dark:bg-gray-700 md:w-48">
          <div
            className={`absolute z-20 flex h-full w-full items-center justify-center transition-all duration-300 ${
              playerStatus === PlayerState.Loading
                ? 'bg-white opacity-80 dark:bg-gray-800'
                : 'bg-transparent opacity-0'
            }`}
          >
            <FontAwesomeIcon className="z-10 inline-block h-5 w-5 animate-spin" icon={faPlay} />
          </div>

          {!brokenThumbnail ? (
            <div className="absolute m-4 aspect-[2/1] w-full rounded-full shadow-lg">
              <img
                className={`h-full w-full rounded-full object-cover ${
                  playerStatus === PlayerState.Playing ? 'animate-spin-slow' : ''
                }`}
                src={thumbnail}
                alt={file.name}
                onError={() => setBrokenThumbnail(true)}
              />
            </div>
          ) : (
            <FontAwesomeIcon
              className={`z-10 h-5 w-5 ${playerStatus === PlayerState.Playing ? 'animate-spin' : ''}`}
              icon="music"
              size="2x"
            />
          )}
        </div>

        <div className="flex flex-col w-full justify-between">
          <div>
            <div className="mb-2 text-lg font-medium">{file.name}</div>
            <div className="mb-4 text-sm text-gray-500">
              {'Last modified: ' + formatModifiedDateTime(file.lastModifiedDateTime)}
            </div>
          </div>

          <div className="flex items-center space-x-4">
            <ReactAudioPlayer
              className="h-11 w-full"
              src={`/api/raw?path=${asPath}${hashedToken ? `&odpt=${hashedToken}` : ''}`}
              ref={rapRef}
              controls
              preload="auto"
              volume={playerVolume}
              onPlay={() => setPlayerStatus(PlayerState.Playing)}
              onPause={() => setPlayerStatus(PlayerState.Paused)}
            />
            <button
              className="flex items-center justify-center p-2 bg-gray-200 rounded-full dark:bg-gray-600 hover:bg-gray-300 dark:hover:bg-gray-700 transition-all"
              onClick={toggleMute}
            >
              <FontAwesomeIcon icon={isMuted ? faVolumeMute : faVolumeUp} />
            </button>
          </div>
        </div>
      </div>

      <div className="mt-4 flex justify-end">
        <a href={`/api/raw?path=${asPath}${hashedToken ? `&odpt=${hashedToken}` : ''}`} download>
          <button className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all">
            <FontAwesomeIcon icon={faDownload} className="mr-2" /> Download
          </button>
        </a>
      </div>
    </div>
  )
}

export default AudioPreview
