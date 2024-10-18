import type { OdFileObject } from '../../types'

import { FC, useEffect, useState } from 'react'
import { useRouter } from 'next/router'

import axios from 'axios'
import toast from 'react-hot-toast'
import Plyr from 'plyr-react'
import { useAsync } from 'react-async-hook'
import { useClipboard } from 'use-clipboard-copy'

import { getBaseUrl } from '../../utils/getBaseUrl'
import { getExtension } from '../../utils/getFileIcon'
import { getStoredToken } from '../../utils/protectedRouteHandler'

import { DownloadButton } from '../DownloadBtnGtoup'
import { DownloadBtnContainer, PreviewContainer } from './Containers'
import FourOhFour from '../FourOhFour'
import Loading from '../Loading'
import CustomEmbedLinkMenu from '../CustomEmbedLinkMenu'

import 'plyr-react/plyr.css'

const VideoPlayer: FC<{
  videoName: string
  videoUrl: string
  width?: number
  height?: number
  thumbnail: string
  subtitle: string
  isFlv: boolean
  mpegts: any
}> = ({ videoName, videoUrl, width, height, thumbnail, subtitle, isFlv, mpegts }) => {
  useEffect(() => {
    // Really hacky way to inject subtitles as file blobs into the video element
    axios
      .get(subtitle, { responseType: 'blob' })
      .then(resp => {
        const track = document.querySelector('track')
        track?.setAttribute('src', URL.createObjectURL(resp.data))
      })
      .catch(() => {
        console.log('Could not load subtitle.')
      })

    if (isFlv) {
      const loadFlv = () => {
        // Hacky way to get the exposed video element from Plyr
        const video = document.getElementById('plyr')
        const flv = mpegts.createPlayer({ url: videoUrl, type: 'flv' })
        flv.attachMediaElement(video)
        flv.load()
      }
      loadFlv()
    }
  }, [videoUrl, isFlv, mpegts, subtitle])

  const plyrSource = {
  type: 'video',
  title: videoName,
  poster: thumbnail,
  // Garantir que as legendas sejam ativadas automaticamente
  tracks: [{ kind: 'captions', label: videoName, src: '', default: true }],
}

  const plyrOptions: Plyr.Options = {
  ratio: `${width ?? 16}:${height ?? 9}`,
  fullscreen: { iosNative: true },
  captions: { active: true, update: true }, // Ativar legendas por padrão
  controls: ['play', 'progress', 'fullscreen'], // Remove a barra de volume
}

  if (!isFlv) {
    plyrSource['sources'] = [{ src: videoUrl }]
  }
  return <Plyr id="plyr" source={plyrSource as Plyr.SourceInfo} options={plyrOptions} />
}

const VideoPreview: FC<{ file: OdFileObject }> = ({ file }) => {
  const { asPath } = useRouter()
  const hashedToken = getStoredToken(asPath)
  const clipboard = useClipboard()

  const [menuOpen, setMenuOpen] = useState(false)

  // OneDrive generates thumbnails for its video files, pick the highest resolution
  const thumbnail = `/api/thumbnail?path=${asPath}&size=large${hashedToken ? `&odpt=${hashedToken}` : ''}`

  // Assume subtitle files are beside the video with the same name, only webvtt '.vtt' files supported
  const vtt = `${asPath.substring(0, asPath.lastIndexOf('.'))}.vtt`
  const subtitle = `/api/raw?path=${vtt}${hashedToken ? `&odpt=${hashedToken}` : ''}`

  // Format raw video file for in-browser player as well as other players
  const videoUrl = `/api/raw?path=${asPath}${hashedToken ? `&odpt=${hashedToken}` : ''}`

  const isFlv = getExtension(file.name) === 'flv'
  const {
    loading,
    error,
    result: mpegts,
  } = useAsync(async () => {
    if (isFlv) {
      return (await import('mpegts.js')).default
    }
  }, [isFlv])

  return (
    <>
      <CustomEmbedLinkMenu path={asPath} menuOpen={menuOpen} setMenuOpen={setMenuOpen} />
      <PreviewContainer>
        {error ? (
          <FourOhFour errorMsg={error.message} />
        ) : loading && isFlv ? (
          <Loading loadingText={'Loading FLV extension...'} />
        ) : (
          <VideoPlayer
            videoName={file.name}
            videoUrl={videoUrl}
            width={file.video?.width}
            height={file.video?.height}
            thumbnail={thumbnail}
            subtitle={subtitle}
            isFlv={isFlv}
            mpegts={mpegts}
          />
        )}
      </PreviewContainer>

      <DownloadBtnContainer>
        <div className="flex flex-wrap justify-center gap-2">
          <DownloadButton
            onClickCallback={() => window.open(videoUrl)}
            btnColor="blue"
            btnText={'Baixar'}
            btnIcon="file-download"
          />
          <DownloadButton
            onClickCallback={() => {
              clipboard.copy(`${getBaseUrl()}/api/raw?path=${asPath}${hashedToken ? `&odpt=${hashedToken}` : ''}`)
              toast.success('Link Copiado.')
            }}
            btnColor="pink"
            btnText={'Copiar Link'}
            btnIcon="copy"
          />
        </div>

        {/* Texto acima dos botões */}
        <p style={{ color: 'white', textAlign: 'center' }}>
          {typeof window !== 'undefined' && window.navigator.platform.includes('Win') ? (
            <>
              Sem áudio?{' '}
              <a
                href="https://www.codecguide.com/download_k-lite_codec_pack_basic.htm"
                target="_blank"
                rel="noopener noreferrer"
                style={{ color: '#ADD8E6' }}
              >
                Instale K-lite
              </a>
            </>
          ) : (
            'Sem áudio? Use algum dos players abaixo'
          )}
        </p>

        {/* Espaço adicionado entre o texto e os botões */}
        <div style={{ marginBottom: '20px' }} />

        {/* Mostrar botões de players somente em dispositivos não-Windows */}
        {typeof window !== 'undefined' && !window.navigator.platform.includes('Win') && (
          <div style={{ textAlign: 'center' }}>
            <DownloadButton
              onClickCallback={() => window.open(`iina://weblink?url=${getBaseUrl()}${videoUrl}`)}
              btnText="IINA"
              btnImage="/players/iina.png"
            />
            <DownloadButton
              onClickCallback={() => window.open(`vlc://${getBaseUrl()}${videoUrl}`)}
              btnText="VLC"
              btnImage="/players/vlc.png"
            />
            <DownloadButton
              onClickCallback={() => window.open(`potplayer://${getBaseUrl()}${videoUrl}`)}
              btnText="PotPlayer"
              btnImage="/players/potplayer.png"
            />
            <DownloadButton
              onClickCallback={() => window.open(`nplayer-http://${window?.location.hostname ?? ''}${videoUrl}`)}
              btnText="nPlayer"
              btnImage="/players/nplayer.png"
            />
            <DownloadButton
              onClickCallback={() => window.open(`intent://${getBaseUrl()}${videoUrl}#Intent;type=video/any;package=is.xyz.mpv;scheme=https;end;`)}
              btnText="mpv-android"
              btnImage="/players/mpv-android.png"
            />
          </div> /* Closing div added here */
        )}
      </DownloadBtnContainer>
    </>
  )
}

export default VideoPreview
