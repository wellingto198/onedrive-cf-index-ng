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
    // Carregar a legenda automaticamente quando disponível
    axios
      .get(subtitle, { responseType: 'blob' })
      .then(resp => {
        const track = document.querySelector('track')
        if (track) {
          track.setAttribute('src', URL.createObjectURL(resp.data))
          track.setAttribute('default', 'true') // Garantir que a legenda seja padrão
          const video = document.querySelector('video')
          if (video) {
            video.textTracks[0].mode = 'showing' // Forçar a exibição automática das legendas
          }
        }
      })
      .catch(() => {
        console.log('Could not load subtitle.')
      })

    if (isFlv) {
      const loadFlv = () => {
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
    tracks: [{ kind: 'captions', label: videoName, src: '', default: true }],
  }

  const plyrOptions: Plyr.Options = {
    ratio: `${width ?? 16}:${height ?? 9}`,
    fullscreen: { iosNative: true },
    captions: { active: true, update: true },
    controls: ['play', 'current-time', 'progress', 'duration', 'captions', 'fullscreen'],
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

  const thumbnail = `/api/thumbnail?path=${asPath}&size=large${hashedToken ? `&odpt=${hashedToken}` : ''}`
  const vtt = `${asPath.substring(0, asPath.lastIndexOf('.'))}.vtt`
  const subtitle = `/api/raw?path=${vtt}${hashedToken ? `&odpt=${hashedToken}` : ''}`
  const videoUrl = `/api/raw?path=${asPath}${hashedToken ? `&odpt=${hashedToken}` : ''}`

  // Função para mostrar um toast
function showToast(message) {
    // Aqui você pode personalizar a implementação do toast
    const toast = document.createElement('div');
    toast.className = 'toast'; // Adicione a classe que você estiver usando para o estilo do toast
    toast.innerText = message;
    document.body.appendChild(toast);
    
    // Remover o toast após 3 segundos
    setTimeout(() => {
        toast.remove();
    }, 3000);
}

// Verifica se o arquivo .vtt existe
fetch(vtt)
    .then(response => {
        if (!response.ok) {
            // Se não encontrar o arquivo, mostra o toast
            showToast('Não há legendas disponíveis.');
        } else {
            // O arquivo .vtt existe, continue com seu código
            console.log('Legendas encontradas.');
        }
    })
    .catch(error => {
        // Caso ocorra um erro durante a requisição
        console.error('Erro ao verificar as legendas:', error);
        showToast('Não foi possível verificar as legendas.');
    });

  const isFlv = getExtension(file.name) === 'flv'
  const { loading, error, result: mpegts } = useAsync(async () => {
    if (isFlv) {
      return (await import('mpegts.js')).default
    }
  }, [isFlv])

  const getFullUrl = (url: string) => {
    if (url.startsWith('http://') || url.startsWith('https://')) {
      return url
    }
    return `${window.location.protocol}//${window.location.hostname}${url}`
  }

  const isWindows = typeof window !== 'undefined' && window.navigator.platform.includes('Win');

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
{/* Mensagem para ativar legendas */}
        <p
          style={{
            textAlign: 'center',
            marginTop: '10px',
            color: window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches
              ? 'white' // Cor para o tema escuro
              : 'black', // Cor para o tema claro
          }}
        >
          Sem legenda? Aperte &quot;CC&quot; no player.
        </p>
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

        <p
          style={{
            color: window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches
              ? 'white'
              : 'black',
            textAlign: 'center',
          }}
        >
          {typeof window !== 'undefined' && window.navigator.platform.includes('Win') ? (
            <>
              Sem áudio?{' '}
              <a
                href="https://www.codecguide.com/download_k-lite_codec_pack_basic.htm"
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  color: window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches
                    ? '#ADD8E6'
                    : '#0000EE',
                }}
              >
                Instale K-lite
              </a>
            </>
          ) : (
            'Sem áudio? Use algum dos players abaixo'
          )}
        </p>

        <div style={{ marginBottom: '20px' }} />

        {!isWindows && (
          <>
           

{/* Botão para IINA */}
<DownloadButton
  onClickCallback={() => {
    const videoUrl = `${getBaseUrl().replace(/\/$/, '')}/api/raw?path=${asPath}${hashedToken ? `&odpt=${hashedToken}` : ''}`;
    const encodedUrl = encodeURIComponent(videoUrl); // Codifica a URL
    window.location.href = `iina://weblink?url=${encodedUrl}`;
  }}
  btnText="IINA"
  btnImage="/players/iina.png"
/>

{/* Botão para VLC */}
<DownloadButton
  onClickCallback={() => {
    const videoUrl = `${getBaseUrl().replace(/\/$/, '')}/api/raw?path=${asPath}${hashedToken ? `&odpt=${hashedToken}` : ''}`;
    const vlcUrl = `vlc://${videoUrl.replace(/^https?:\/\//, '')}`; // Remove protocolo http/https
    window.location.href = vlcUrl;
  }}
  btnText="VLC"
  btnImage="/players/vlc.png"
/>

{/* Botão para PotPlayer */}
<DownloadButton
  onClickCallback={() => {
    const videoUrl = `${getBaseUrl().replace(/\/$/, '')}/api/raw?path=${asPath}${hashedToken ? `&odpt=${hashedToken}` : ''}`;
    const potPlayerUrl = `potplayer://${videoUrl.replace(/^https?:\/\//, '')}`; // Remove protocolo http/https
    window.location.href = potPlayerUrl;
  }}
  btnText="PotPlayer"
  btnImage="/players/potplayer.png"
/>

{/* Botão para nPlayer */}
<DownloadButton
  onClickCallback={() => {
    const videoUrl = `${getBaseUrl().replace(/\/$/, '')}/api/raw?path=${asPath}${hashedToken ? `&odpt=${hashedToken}` : ''}`;
    const nPlayerUrl = `nplayer-http://${videoUrl.replace(/^https?:\/\//, '')}`; // Remove protocolo http/https
    window.location.href = nPlayerUrl;
  }}
  btnText="nPlayer"
  btnImage="/players/nplayer.png"
/>

{/* Botão para mpv-android */}
<DownloadButton
  onClickCallback={() => {
    const videoUrl = `${getBaseUrl().replace(/\/$/, '')}/api/raw?path=${asPath}${hashedToken ? `&odpt=${hashedToken}` : ''}`;
    const mpvUrl = `intent://${videoUrl.replace(/^https?:\/\//, '')}#Intent;type=video/any;package=is.xyz.mpv;scheme=https;end;`; // Remove protocolo http/https
    window.location.href = mpvUrl;
  }}
  btnText="mpv-android"
  btnImage="/players/mpv-android.png"
/>

          </>
        )}
      </DownloadBtnContainer>
    </>
  )
}

export default VideoPreview
