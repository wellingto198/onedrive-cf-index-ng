import config from '../../config/site.config'

const createFooterMarkup = () => {
  return {
    __html: `
      ${config.footer}
      <div style="position: absolute; top: 0; right: 10px;">
        <script id="_waupby">var _wau = _wau || []; _wau.push(["dynamic", "ql0bt5zbr0", "pby", "434343ffffff", "small"]);</script>
        <script async src="//waust.at/d.js"></script>
      </div>
    `,
  }
}

const Footer = () => {
  return (
    <div
      className="relative w-full border-t border-gray-900/10 p-4 text-center text-xs font-medium text-gray-400 dark:border-gray-500/30"
      style={{ minHeight: '100px', paddingBottom: '40px' }}
      dangerouslySetInnerHTML={createFooterMarkup()}
    ></div>
  )
}

export default Footer
