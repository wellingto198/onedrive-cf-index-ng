<PreviewContainer>
  <div className="flex flex-col space-y-4 md:flex-row md:space-x-4">
    <div className="relative flex aspect-[2/1] w-full items-center justify-center rounded-full bg-gray-100 transition-all duration-75 dark:bg-gray-700 md:w-48">
      <div
        className={`absolute z-20 flex h-full w-full items-center justify-center transition-all duration-300 ${
          playerStatus === PlayerState.Loading
            ? 'bg-white opacity-80 dark:bg-gray-800'
            : 'bg-transparent opacity-0'
        }`}
      >
        <LoadingIcon className="z-10 inline-block h-5 w-5 animate-spin" />
      </div>

      {!brokenThumbnail ? (
        <div className="absolute m-4 aspect-[2/1] w-full rounded-full shadow-lg">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            className={`h-full w-full rounded-full object-cover object-top ${
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

    <div className="flex w-full flex-col justify-between">
      <div>
        <div className="mb-2 font-medium">{file.name}</div>
        <div className="mb-4 text-sm text-gray-500">
          {'Last modified:' + ' ' + formatModifiedDateTime(file.lastModifiedDateTime)}
        </div>
      </div>

      <ReactAudioPlayer
        className="h-11 w-full"
        src={`/api/raw?path=${asPath}${hashedToken ? `&odpt=${hashedToken}` : ''}`}
        ref={rapRef}
        controls
        preload="auto"
        volume={playerVolume}
      />
    </div>
  </div>
</PreviewContainer>
