import type { ParsedUrlQuery } from 'querystring'

import Link from 'next/link'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'

const CrumbHome = () => {
  return (
    <Link href="/" className="flex items-center" aria-label="Início">
      <FontAwesomeIcon className="h-3 w-3" icon={['far', 'flag']} />
      <span className="ml-2 font-medium">{'Início'}</span>
    </Link>
  )
}

const Breadcrumb: React.FC<{ query?: ParsedUrlQuery }> = ({ query }) => {
  if (query?.path) {
    const path = Array.isArray(query.path) ? query.path : [query.path]
    
    // Estamos renderizando o caminho de trás para frente para permitir que o navegador role para o final
    return (
      <ol className="no-scrollbar inline-flex flex-row-reverse items-center gap-1 overflow-x-scroll text-sm text-gray-600 dark:text-gray-300 md:gap-3">
        {path
          .reverse()
          .map((p, i) => (
            <li key={i} className="flex flex-shrink-0 items-center">
              <FontAwesomeIcon className="h-3 w-3" icon="angle-right" />
              <Link
                href={`/${path.slice(0, path.length - i).map(encodeURIComponent).join('/')}`}
                passHref
                aria-label={p}
                className={`ml-1 transition-all duration-75 hover:opacity-70 md:ml-3 ${
                  i === 0 ? 'pointer-events-none opacity-80' : ''
                }`}
              >
                {p}
              </Link>
            </li>
          ))}
        <li className="flex-shrink-0 transition-all duration-75 hover:opacity-80">
          <CrumbHome />
        </li>
      </ol>
    )
  }

  return (
    <div className="text-sm text-gray-600 transition-all duration-75 hover:opacity-80 dark:text-gray-300">
      <CrumbHome />
    </div>
  )
}

export default Breadcrumb
