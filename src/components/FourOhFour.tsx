import Image from 'next/image'

const FourOhFour: React.FC<{ errorMsg: string }> = ({ errorMsg }) => {
  return (
    <div className="my-12">
      <div className="mx-auto w-1/3">
        <Image src="/images/fabulous-rip-2.png" alt="404" width={912} height={912} priority />
      </div>
      <div className="mx-auto mt-6 max-w-xl text-gray-500">
        <div className="mb-8 text-xl font-bold">
          Opa, isso é um <span className="underline decoration-red-500 decoration-wavy">404</span>.
        </div>
        <div className="mb-4 overflow-hidden break-all rounded border border-gray-400/20 bg-gray-50 p-2 font-mono text-xs dark:bg-gray-800">
          {errorMsg}
        </div>
        <div className="text-sm">
          Pressione{' '}
          <kbd className="rounded border border-gray-400/20 bg-gray-100 px-1 font-mono text-xs dark:bg-gray-800">
            F12
          </kbd>{' '}
          e abra as ferramentas de desenvolvedor para mais detalhes, e reporte este problema em{' '}
          <a
            className="text-blue-600 hover:text-blue-700 hover:underline"
            href="https://github.com/lyc8503/onedrive-cf-index-ng/issues"
            target="_blank"
            rel="noopener noreferrer"
          >
            onedrive-cf-index-ng issues
          </a>
          .
        </div>
      </div>
    </div>
  )
}

export default FourOhFour
