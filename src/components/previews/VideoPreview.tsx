import type { OdFileObject } from '../../types';

import { FC, useEffect, useState } from 'react';
import { useRouter } from 'next/router';

import axios from 'axios';
import toast from 'react-hot-toast';
import Plyr from 'plyr-react';
import { useAsync } from 'react-async-hook';
import { useClipboard } from 'use-clipboard-copy';

import { getBaseUrl } from '../../utils/getBaseUrl';
import { getExtension } from '../../utils/getFileIcon';
import { getStoredToken } from '../../utils/protectedRouteHandler';

import { DownloadButton } from '../DownloadBtnGtoup';
import { DownloadBtnContainer, PreviewContainer } from './Containers';
import FourOhFour from '../FourOhFour';
import Loading from '../Loading';
import CustomEmbedLinkMenu from '../CustomEmbedLinkMenu';

import 'plyr-react/plyr.css';

const VideoPlayer: FC<{
  videoName: string;
  videoUrl: string;
  width?: number;
  height?: number;
  thumbnail: string;
  subtitle: string;
  isFlv: boolean;
  mpegts: any;
}> = ({ videoName, videoUrl, width, height, thumbnail, subtitle, isFlv, mpegts }) => {
  
  useEffect(() => {
    // Carregar a legenda automaticamente quando disponível
    axios
      .get(subtitle, { responseType: 'blob' })
      .then(resp => {
        const track = document.querySelector('track');
        if (track) {
          track.setAttribute('src', URL.createObjectURL(resp.data));
          track.setAttribute('default', 'true'); // Garantir que a legenda seja padrão
          const video = document.querySelector('video');
          if (video) {
            video.textTracks[0].mode = 'showing'; // Forçar a exibição automática das legendas
          }
        }
      })
      .catch(() => {
        console.log('Could not load subtitle.');
      });

    if (isFlv) {
      const loadFlv = () => {
        const video = document.getElementById('plyr') as HTMLVideoElement;
        const flv = mpegts.createPlayer({ url: videoUrl, type: 'flv' });
        flv.attachMediaElement(video);
        flv.load();
      };
      loadFlv();
    }
  }, [videoUrl, isFlv, mpegts, subtitle]);

  const plyrSource = {
    type: isFlv ? 'video' : 'video', // Define como 'video', mesmo para FLV
    poster: thumbnail,
    tracks: [{ kind: 'captions', label: videoName, src: '', default: true }],
    sources: isFlv ? [] : [{ src: videoUrl, type: 'video/mp4' }], // Adiciona a fonte com tipo específico
  };

  const plyrOptions = {
    ratio: `${width ?? 16}:${height ?? 9}`,
    fullscreen: { iosNative: true },
    captions: { active: true, update: true },
    controls: ['play', 'current-time', 'progress', 'duration', 'captions', 'fullscreen'],
  };

  return (
    <div>
      <div style={{ textAlign: 'center', marginBottom: '10px' }}>
        <h2>{videoName}</h2> {/* Adiciona o título acima do player */}
      </div>
      <Plyr id="plyr" source={plyrSource} options={plyrOptions} />
    </div>
  );
};

const VideoPreview: FC<{ file: OdFileObject }> = ({ file }) => {
  const { asPath } = useRouter();
  const hashedToken = getStoredToken(asPath);
  const clipboard = useClipboard();

  const [menuOpen, setMenuOpen] = useState(false);
  const [legendasDisponiveis, setLegendasDisponiveis] = useState(true); // Inicialmente assume que legendas estão disponíveis

  const thumbnail = `/api/thumbnail?path=${asPath}&size=large${hashedToken ? `&odpt=${hashedToken}` : ''}`;
  const vtt = `${asPath.substring(0, asPath.lastIndexOf('.'))}.vtt`;
  const subtitle = `/api/raw?path=${vtt}${hashedToken ? `&odpt=${hashedToken}` : ''}`;
  const videoUrl = `/api/raw?path=${asPath}${hashedToken ? `&odpt=${hashedToken}` : ''}`;

  const isFlv = getExtension(file.name) === 'flv';
  const { loading, error, result: mpegts } = useAsync(async () => {
    if (isFlv) {
      return (await import('mpegts.js')).default;
    }
  }, [isFlv]);

  // Função para verificar a existência das legendas
  const verificarExistenciaLegendas = async (subtitleUrl: string) => {
    try {
      await axios.head(subtitleUrl); // Usar HEAD para verificar a existência do arquivo
      setLegendasDisponiveis(true);
    } catch (error) {
      console.log('Legendas não encontradas:', error);
      setLegendasDisponiveis(false);
    }
  };

  useEffect(() => {
    verificarExistenciaLegendas(subtitle); // Verificar legendas ao carregar o componente
  }, [subtitle]);

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

        <p
          style={{
            textAlign: 'center',
            marginTop: '10px',
            color: window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches
              ? 'white'
              : 'black',
          }}
        >
          {legendasDisponiveis ? 'Legenda externa disponível, Aperte "CC" no player.' : 'Sem legendas externas disponíveis.'}
        </p>
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
              clipboard.copy(`${getBaseUrl()}/api/raw?path=${asPath}${hashedToken ? `&odpt=${hashedToken}` : ''}`);
              toast.success('Link Copiado.');
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
          {isWindows ? (
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

        <div className="flex justify-center gap-4">
          <DownloadButton
            onClickCallback={() => {
              const videoUrl = `${getBaseUrl().replace(/\/$/, '')}/api/raw?path=${asPath}${hashedToken ? `&odpt=${hashedToken}` : ''}`;
              const encodedUrl = encodeURIComponent(videoUrl); // Codifica a URL
              window.location.href = `iina://weblink?url=${encodedUrl}`;
            }}
            btnText="IINA"
            btnImage="/players/iina.png"
          />

          <DownloadButton
            onClickCallback={() => {
              const videoUrl = `${getBaseUrl().replace(/\/$/, '')}/api/raw?path=${asPath}${hashedToken ? `&odpt=${hashedToken}` : ''}`;
              const vlcUrl = `vlc://${videoUrl.replace(/^https?:\/\//, '')}`; // Remove protocolo http/https
              window.location.href = vlcUrl;
            }}
            btnText="VLC"
            btnImage="/players/vlc.png"
          />

          <DownloadButton
            onClickCallback={() => {
              const videoUrl = `${getBaseUrl().replace(/\/$/, '')}/api/raw?path=${asPath}${hashedToken ? `&odpt=${hashedToken}` : ''}`;
              const nPlayerUrl = `nplayer://${videoUrl.replace(/^https?:\/\//, '')}`; // Remove protocolo http/https
              window.location.href = nPlayerUrl;
            }}
            btnText="NPlayer"
            btnImage="/players/nplayer.png"
          />

          <DownloadButton
            onClickCallback={() => {
              const videoUrl = `${getBaseUrl().replace(/\/$/, '')}/api/raw?path=${asPath}${hashedToken ? `&odpt=${hashedToken}` : ''}`;
              const mpvUrl = `mpv://${videoUrl.replace(/^https?:\/\//, '')}`; // Remove protocolo http/https
              window.location.href = mpvUrl;
            }}
            btnText="MPV"
            btnImage="/players/mpv.png"
          />
        </div>
      </DownloadBtnContainer>
    </>
  );
};

export default VideoPreview;
