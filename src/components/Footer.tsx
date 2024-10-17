import config from '../../config/site.config'

const createFooterMarkup = () => {
  return {
    __html: `
      ${config.footer}
      <script id="_wauv9i">var _wau = _wau || []; _wau.push(["small", "6mzocwh7kd", "v9i"]);\u003C/script>
      <script async src="//waust.at/s.js">\u003C/script>
    `,
  }
}

const Footer = () => {
  return (
    <div
      className="w-full border-t border-gray-900/10 p-4 text-center text-xs font-medium text-gray-400 dark:border-gray-500/30"
      dangerouslySetInnerHTML={createFooterMarkup()}
    ></div>
  )
}

export default Footer
