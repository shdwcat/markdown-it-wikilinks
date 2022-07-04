'use strict'

const Plugin = require('markdown-it-regexp')
const extend = require('extend')
const sanitize = require('sanitize-filename')

module.exports = (options) => {

  const defaults = {
    vscodeSupport: false,
    baseURL: '/',
    relativeBaseURL: './',
    makeAllLinksAbsolute: false,
    uriSuffix: '.html',
    description_then_file: false,
    separator: "\\|",
    htmlAttributes: {
    },
    generatePageNameFromLabel: (label) => {
      return label
    },
    postProcessPageName: (pageName) => {
      pageName = pageName.trim()
      pageName = pageName.split('/').map(sanitize).join('/')
      pageName = pageName.replace(/\s+/, '_')
      return pageName
    },
    postProcessLabel: (label) => {
      label = label.trim()
      return label
    }
  }

  options = extend(true, defaults, options)

  const headingRegex = /([^#]+)?#?([^#]+)?/

  function isAbsolute(pageName) {
    return options.makeAllLinksAbsolute || pageName.charCodeAt(0) === 0x2F/* / */
  }

  function removeInitialSlashes(str) {
    return str.replace(/^\/+/g, '')
  }

  return Plugin(
    new RegExp("\\[\\[([^sep\\]]+)(sep[^sep\\]]+)?\\]\\]".replace(/sep/g, options.separator)),
    (match, utils, document) => {
      let label = ''
      let pageName = ''
      let href = ''
      let htmlAttrs = []
      let htmlAttrsString = ''

      const isSplit = !!match[2]
      if (isSplit) {
        if (options.description_then_file) {
          label = match[1]
          pageName = match[2].replace(options.separator, '')
        } else {
          label = match[2].replace(options.separator, '')
          pageName = match[1]
        }
      }
      else {
        label = match[1]
        pageName = options.generatePageNameFromLabel(label)
      }

      let headingMatch = headingRegex.exec(pageName)
      pageName = headingMatch[1] ?? ''
      let heading = headingMatch[2]?.split(/\s+/).join('-')

      // e.g just '#HeadingName'
      let isHeadingLink = heading && !pageName

      // fixup label when there's a heading but no explicit description
      if (heading && !isSplit) {
        label = pageName || heading
      }

      label = options.postProcessLabel(label)
      pageName = options.postProcessPageName(pageName)

      // make sure none of the values are empty
      if (!label || (!pageName && pageName !== '')) {
        return match.input
      }

      if (isHeadingLink) {
        // in this case the href is just the link content, e.g. '#HeadingName'
        href = "#" + heading.toLowerCase().split(/\s+/).join('-')
      }
      else {

        // if a uriSuffix isn't provided, default to whatever the extension for this file is
        let uriSuffix = options.uriSuffix
        if (!uriSuffix) {
          var currentFileName = document.fsPath;
          var currentExtension = currentFileName.split('.').pop()
          uriSuffix = "." + currentExtension
        }

        if (isAbsolute(pageName)) {
          pageName = removeInitialSlashes(pageName)
          href = options.baseURL + pageName + uriSuffix
        }
        else {
          href = options.relativeBaseURL + pageName + uriSuffix
        }

        // append heading if present
        if (heading) {
          href += "#" + heading.toLowerCase();
        }
      }

      href = utils.escape(href)

      htmlAttrs.push(`href="${href}"`)

      // vscode uses data-href attribute to link within the preview
      if (options.vscodeSupport) {
        htmlAttrs.push(`data-href="${href}"`)
      }

      for (let attrName in options.htmlAttributes) {
        const attrValue = options.htmlAttributes[attrName]
        htmlAttrs.push(`${attrName}="${attrValue}"`)
      }
      htmlAttrsString = htmlAttrs.join(' ')

      return `<a ${htmlAttrsString}>${label}</a>`
    }
  )
}