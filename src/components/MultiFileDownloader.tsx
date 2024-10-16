import { NextRouter } from 'next/router'
import toast from 'react-hot-toast'
import JSZip from 'jszip'

import { fetcher } from '../utils/fetchWithSWR'
import { getStoredToken } from '../utils/protectedRouteHandler'

/**
 * Componente de toast de carregamento com suporte para progresso de download de arquivos
 * @param props
 * @param props.router Instância do roteador Next, usada para recarregar a página
 * @param props.progress Progresso atual de download e compressão (retornado pelos metadados do jszip)
 */
export function DownloadingToast({ router, progress }: { router: NextRouter; progress?: string }) {
  return (
    <div className="flex items-center space-x-2">
      <div className="w-56">
        <span>{progress ? `Baixando ${progress}%` : 'Baixando arquivos selecionados...'}</span>

        <div className="relative mt-2">
          <div className="flex h-1 overflow-hidden rounded bg-gray-100">
            <div style={{ width: `${progress}%` }} className="bg-gray-500 text-white transition-all duration-100"></div>
          </div>
        </div>
      </div>
      <button
        className="rounded bg-red-500 p-2 text-white hover:bg-red-400 focus:outline-none focus:ring focus:ring-red-300"
        onClick={() => router.reload()}
      >
        {'Cancelar'}
      </button>
    </div>
  )
}

// Helper de download de Blob
export function downloadBlob({ blob, name }: { blob: Blob; name: string }) {
  // Preparar para download
  const el = document.createElement('a')
  el.style.display = 'none'
  document.body.appendChild(el)

  // Baixar arquivo zip
  const bUrl = window.URL.createObjectURL(blob)
  el.href = bUrl
  el.download = name
  el.click()
  window.URL.revokeObjectURL(bUrl)
  el.remove()
}

/**
 * Baixar múltiplos arquivos após compactá-los em um zip
 * @param toastId ID do Toast a ser usado para notificação
 * @param files Arquivos a serem baixados
 * @param folder Nome opcional da pasta que conterá os arquivos, caso contrário, os arquivos serão achatados no zip
 */
export async function downloadMultipleFiles({
  toastId,
  router,
  files,
  folder,
}: {
  toastId: string
  router: NextRouter
  files: { name: string; url: string }[]
  folder?: string
}): Promise<void> {
  const zip = new JSZip()
  const dir = folder ? zip.folder(folder)! : zip

  // Adicionar blobs dos arquivos selecionados ao zip
  files.forEach(({ name, url }) => {
    dir.file(
      name,
      fetch(url).then(r => {
        return r.blob()
      })
    )
  })

  // Criar o arquivo zip e baixar
  const b = await zip.generateAsync({ type: 'blob' }, metadata => {
    toast.loading(<DownloadingToast router={router} progress={metadata.percent.toFixed(0)} />, {
      id: toastId,
    })
  })
  downloadBlob({ blob: b, name: folder ? folder + '.zip' : 'download.zip' })
}

/**
 * Baixar arquivos em formato de árvore hierárquica após compactá-los em um zip
 * @param toastId ID do Toast a ser usado para notificação
 * @param files Arquivos a serem baixados. Array de itens de arquivo e pasta, excluindo a pasta raiz.
 * Itens de pasta DEVEM estar na frente dos seus itens filhos no array.
 * Use gerador assíncrono, pois a geração do array pode ser lenta.
 * @param basePath Caminho da pasta raiz dos arquivos a serem baixados
 * @param folder Nome opcional da pasta que conterá os arquivos, caso contrário, os arquivos serão achatados no zip
 */
export async function downloadTreelikeMultipleFiles({
  toastId,
  router,
  files,
  basePath,
  folder,
}: {
  toastId: string
  router: NextRouter
  files: AsyncGenerator<{
    name: string
    url?: string
    path: string
    isFolder: boolean
  }>
  basePath: string
  folder?: string
}): Promise<void> {
  const zip = new JSZip()
  const root = folder ? zip.folder(folder)! : zip
  const map = [{ path: basePath, dir: root }]

  // Adicionar blobs dos arquivos selecionados ao zip conforme o caminho
  for await (const { name, url, path, isFolder } of files) {
    // Procurar diretório pai no mapa
    const i = map
      .slice()
      .reverse()
      .findIndex(
        ({ path: parent }) =>
          path.substring(0, parent.length) === parent && path.substring(parent.length + 1).indexOf('/') === -1
      )
    if (i === -1) {
      throw new Error('Array de arquivos não satisfaz os requisitos')
    }

    // Adicionar arquivo ou pasta ao zip
    const dir = map[map.length - 1 - i].dir
    if (isFolder) {
      map.push({ path, dir: dir.folder(name)! })
    } else {
      dir.file(
        name,
        fetch(url!).then(r => r.blob())
      )
    }
  }

  // Criar o arquivo zip e baixar
  const b = await zip.generateAsync({ type: 'blob' }, metadata => {
    toast.loading(<DownloadingToast router={router} progress={metadata.percent.toFixed(0)} />, {
      id: toastId,
    })
  })
  downloadBlob({ blob: b, name: folder ? folder + '.zip' : 'download.zip' })
}

interface TraverseItem {
  path: string
  meta: any
  isFolder: boolean
  error?: { status: number; message: string }
}

/**
 * Traversing de arquivos em uma pasta de maneira assíncrona e concorrente.
 * Devido à limitação dos hooks do React, não podemos reutilizar os utilitários do SWR para ações recursivas.
 * Faremos diretamente o fetch da API e organizaremos as respostas.
 * Nas árvores de pastas, visitamos as pastas de maneira concorrente o máximo possível.
 * Toda vez que visitamos uma pasta, fazemos o fetch e retornamos os metadados de todos os filhos.
 * Se houver paginação, itens parcialmente recuperados não serão retornados imediatamente,
 * mas somente após todos os filhos da pasta terem sido recuperados com sucesso.
 * Se ocorrer um erro na obtenção paginada, todos os filhos serão descartados.
 * @param path Pasta a ser percorrida. O caminho deve ser limpo antecipadamente.
 * @returns Array de itens representando pastas e arquivos da pasta percorrida, de cima para baixo e excluindo a pasta raiz.
 * Devido ao percurso de cima para baixo, os itens de pasta estão SEMPRE à frente de seus itens filhos.
 * A chave de erro no item conterá o erro quando houver um erro tratável.
 */
export async function* traverseFolder(path: string): AsyncGenerator<TraverseItem, void, undefined> {
  const hashedToken = getStoredToken(path)

  // Gerar a tarefa passada para Promise.race para solicitar uma pasta
  const genTask = async (i: number, path: string, next?: string) => {
    return {
      i,
      path,
      data: await fetcher([ 
        next ? `/api?path=${path}&next=${next}` : `/api?path=${path}`,
        hashedToken ?? undefined,
      ]).catch(error => ({ i, path, error })),
    }
  }

  // Pool contendo Promises de solicitações de pasta
  let pool = [genTask(0, path)]

  // Buffer como mapa para itens de pasta com paginação
  const buf: { [k: string]: TraverseItem[] } = {}

  // filter(() => true) remove lacunas no array
  while (pool.filter(() => true).length > 0) {
    let info: { i: number; path: string; data: any }
    try {
      info = await Promise.race(pool.filter(() => true))
    } catch (error: any) {
      const { i, path, error: innerError } = error
      // Erros 4xx são identificados como erros tratáveis
      if (Math.floor(innerError.status / 100) === 4) {
        delete pool[i]
        yield {
          path,
          meta: {},
          isFolder: true,
          error: { status: innerError.status, message: innerError.message.error },
        }
        continue
      } else {
        throw error
      }
    }

    const { i, path, data } = info
    if (!data || !data.folder) {
      throw new Error('Caminho não é uma pasta')
    }
    delete pool[i]

    const items = data.folder.value.map((c: any) => {
      const p = `${path === '/' ? '' : path}/${encodeURIComponent(c.name)}`
      return { path: p, meta: c, isFolder: Boolean(c.folder) }
    }) as TraverseItem[]

    if (data.next) {
      buf[path] = (buf[path] ?? []).concat(items)

      // Adicionar tarefa da próxima página ao pool no final
      const genTaskP = genTask(i + 1, path, data.next)
      pool.push(genTaskP)
    } else {
      yield* items
    }
  }
}
