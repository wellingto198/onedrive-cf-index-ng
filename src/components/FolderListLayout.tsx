import type { OdFolderChildren } from '../types'

import Link from 'next/link'
import { FC } from 'react'
import { useClipboard } from 'use-clipboard-copy'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'

import { getBaseUrl } from '../utils/getBaseUrl'
import { humanFileSize, formatModifiedDateTime } from '../utils/fileDetails'

import { Downloading, Checkbox, ChildIcon, ChildName } from './FileListing'
import { getStoredToken } from '../utils/protectedRouteHandler'

const ItemListaArquivo: FC<{ conteudoArquivo: OdFolderChildren }> = ({ conteudoArquivo: c }) => {
  return (
    <div className="grid cursor-pointer grid-cols-10 items-center space-x-2 px-3 py-2.5">
      <div className="col-span-10 flex items-center space-x-2 truncate md:col-span-6" title={c.name}>
        <div className="w-5 flex-shrink-0 text-center">
          <ChildIcon child={c} />
        </div>
        <ChildName name={c.name} folder={Boolean(c.folder)} />
      </div>
      <div className="col-span-3 hidden flex-shrink-0 font-mono text-sm text-gray-700 dark:text-gray-500 md:block">
        {formatModifiedDateTime(c.lastModifiedDateTime)}
      </div>
      <div className="col-span-1 hidden flex-shrink-0 truncate font-mono text-sm text-gray-700 dark:text-gray-500 md:block">
        {humanFileSize(c.size)}
      </div>
    </div>
  )
}

const LayoutListaPasta = ({
  caminho,
  filhosPasta,
  selecionados,
  alternarItemSelecionado,
  totalSelecionados,
  alternarTotalSelecionados,
  gerandoTotal,
  manipularDownloadSelecionados,
  gerandoPasta,
  manipularPermalinkSelecionados,
  manipularDownloadPasta,
  toast,
}) => {
  const clipboard = useClipboard()
  const tokenHash = getStoredToken(caminho)

  // Obter caminho do item pelo nome
  const obterCaminhoItem = (nome: string) => `${caminho === '/' ? '' : caminho}/${encodeURIComponent(nome)}`

  return (
    <div className="rounded bg-white shadow-sm dark:bg-gray-900 dark:text-gray-100">
      <div className="grid grid-cols-12 items-center space-x-2 border-b border-gray-900/10 px-3 dark:border-gray-500/30">
        <div className="col-span-12 py-2 text-xs font-bold uppercase tracking-widest text-gray-600 dark:text-gray-300 md:col-span-6">
          {'Nome'}
        </div>
        <div className="col-span-3 hidden text-xs font-bold uppercase tracking-widest text-gray-600 dark:text-gray-300 md:block">
          {'Última Modificação'}
        </div>
        <div className="hidden text-xs font-bold uppercase tracking-widest text-gray-600 dark:text-gray-300 md:block">
          {'Tamanho'}
        </div>
        <div className="hidden text-xs font-bold uppercase tracking-widest text-gray-600 dark:text-gray-300 md:block">
          {'Ações'}
        </div>
        <div className="hidden text-xs font-bold uppercase tracking-widest text-gray-600 dark:text-gray-300 md:block">
          <div className="hidden p-1.5 text-gray-700 dark:text-gray-400 md:flex">
            <Checkbox
              checked={totalSelecionados}
              onChange={alternarTotalSelecionados}
              indeterminate={true}
              title={'Selecionar arquivos'}
            />
            <button
              title={'Copiar permalink dos arquivos selecionados'}
              className="cursor-pointer rounded p-1.5 hover:bg-gray-300 disabled:cursor-not-allowed disabled:text-gray-400 disabled:hover:bg-white dark:hover:bg-gray-600 disabled:dark:text-gray-600 disabled:hover:dark:bg-gray-900"
              disabled={totalSelecionados === 0}
              onClick={() => {
                clipboard.copy(manipularPermalinkSelecionados(getBaseUrl()))
                toast.success('Permalink dos arquivos selecionados copiado.')
              }}
            >
              <FontAwesomeIcon icon={['far', 'copy']} size="lg" />
            </button>
            {gerandoTotal ? (
              <Downloading title={'Baixando arquivos selecionados, recarregue a página para cancelar'} style="p-1.5" />
            ) : (
              <button
                title={'Baixar arquivos selecionados'}
                className="cursor-pointer rounded p-1.5 hover:bg-gray-300 disabled:cursor-not-allowed disabled:text-gray-400 disabled:hover:bg-white dark:hover:bg-gray-600 disabled:dark:text-gray-600 disabled:hover:dark:bg-gray-900"
                disabled={totalSelecionados === 0}
                onClick={manipularDownloadSelecionados}
              >
                <FontAwesomeIcon icon={['far', 'arrow-alt-circle-down']} size="lg" />
              </button>
            )}
          </div>
        </div>
      </div>

      {filhosPasta.map((c: OdFolderChildren) => (
        <div
          className="grid grid-cols-12 transition-all duration-100 hover:bg-gray-100 dark:hover:bg-gray-850"
          key={c.id}
        >
          <Link
            href={`${caminho === '/' ? '' : caminho}/${encodeURIComponent(c.name)}`}
            passHref
            className="col-span-12 md:col-span-10"
          >
            <ItemListaArquivo conteudoArquivo={c} />
          </Link>

          {c.folder ? (
            <div className="hidden p-1.5 text-gray-700 dark:text-gray-400 md:flex">
              <span
                title={'Copiar permalink da pasta'}
                className="cursor-pointer rounded px-1.5 py-1 hover:bg-gray-300 dark:hover:bg-gray-600"
                onClick={() => {
                  clipboard.copy(`${getBaseUrl()}${`${caminho === '/' ? '' : caminho}/${encodeURIComponent(c.name)}`}`)
                  toast('Permalink da pasta copiado.', { icon: '👌' })
                }}
              >
                <FontAwesomeIcon icon={['far', 'copy']} />
              </span>
              {gerandoPasta[c.id] ? (
                <Downloading title={'Baixando pasta, recarregue a página para cancelar'} style="px-1.5 py-1" />
              ) : (
                <span
                  title={'Baixar pasta'}
                  className="cursor-pointer rounded px-1.5 py-1 hover:bg-gray-300 dark:hover:bg-gray-600"
                  onClick={() => {
                    const p = `${caminho === '/' ? '' : caminho}/${encodeURIComponent(c.name)}`
                    manipularDownloadPasta(p, c.id, c.name)()
                  }}
                >
                  <FontAwesomeIcon icon={['far', 'arrow-alt-circle-down']} />
                </span>
              )}
            </div>
          ) : (
            <div className="hidden p-1.5 text-gray-700 dark:text-gray-400 md:flex">
              <span
                title={'Copiar permalink do arquivo bruto'}
                className="cursor-pointer rounded px-1.5 py-1 hover:bg-gray-300 dark:hover:bg-gray-600"
                onClick={() => {
                  clipboard.copy(
                    `${getBaseUrl()}/api/raw?path=${obterCaminhoItem(c.name)}${tokenHash ? `&odpt=${tokenHash}` : ''}`
                  )
                  toast.success('Permalink do arquivo bruto copiado.')
                }}
              >
                <FontAwesomeIcon icon={['far', 'copy']} />
              </span>
              <a
                title={'Baixar arquivo'}
                className="cursor-pointer rounded px-1.5 py-1 hover:bg-gray-300 dark:hover:bg-gray-600"
                href={`/api/raw?path=${obterCaminhoItem(c.name)}${tokenHash ? `&odpt=${tokenHash}` : ''}`}
              >
                <FontAwesomeIcon icon={['far', 'arrow-alt-circle-down']} />
              </a>
            </div>
          )}
          <div className="hidden p-1.5 text-gray-700 dark:text-gray-400 md:flex">
            {!c.folder && !(c.name === '.password') && (
              <Checkbox
                checked={selecionados[c.id] ? 2 : 0}
                onChange={() => alternarItemSelecionado(c.id)}
                title={'Selecionar arquivo'}
              />
            )}
          </div>
        </div>
      ))}
    </div>
  )
}

export default LayoutListaPasta
