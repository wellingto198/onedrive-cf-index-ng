        <DownloadButton
          onClickCallback={() => {
            const videoUrl = `${getBaseUrl().replace(/\/$/, '')}/api/raw?path=${asPath}${hashedToken ? `&odpt=${hashedToken}` : ''}`;
            const mpvUrl = `mpv://${videoUrl.replace(/^https?:\/\//, '')}`;
            window.location.href = mpvUrl;
          }}
          btnText="MPV Android"
          btnImage="/players/mpv.png"
        />
      </>
    )}
  </DownloadBtnContainer>
</>
