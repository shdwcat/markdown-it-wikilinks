'use strict'

const Plugin = require('@shdwcat/markdown-it-regexp')
const extend = require('extend')
const sanitize = require('sanitize-filename')

const defaultPostProcessLabel = (label, defaultProcess) => {

  // strip extension (file names with only a leading . will be preserved)
  if (label.includes('.', 1)) {
     // ignore the first character because we might have '.foo.txt'
     // which should become '.foo'
    label = label.at(0) + label.substring(1).split('.', 2)[0]
  }
  
  // replace dots underscores and dashes with spaces
  label = label.replace(/[\.\-_]/g, ' ')

  // trim whitespace at ends
  label = label.trim()

  // capitalize first letter
  if (label.length > 0) {
    label = label.at(0).toUpperCase() + label.substring(1)
  }

  return label
}

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
    postProcessPagePath: (pagePath) => {
      return pagePath
    },
    postProcessPageName: (pageName) => {
      pageName = pageName.trim()
      pageName = sanitize(pageName)
      pageName = pageName.replace(/\s+/, '_')
      return pageName
    },
    postProcessLabel: defaultPostProcessLabel
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

      const headingMatch = headingRegex.exec(pageName)
      let link = headingMatch[1] ?? ''
      const heading = headingMatch[2]?.split(/\s+/).join('-')

      // e.g just '#HeadingName'
      let isHeadingLink = heading && !link

      // fixup label when there's a heading but no explicit description
      if (heading && !isSplit) {
        label = link || heading
      }

      // split the link into the name and the path
      // e.g. ../foo/file.name has name 'file.name' and path '../foo'
      let linkSegments = link.split('/')
      pageName = linkSegments.pop()
      let pagePath = linkSegments.join('/')

      if (pagePath) {
        // if this is not a split link, use the page name as the label instead of the whole path
        if (!isSplit) {
          label = pageName
        }
        pagePath = options.postProcessPagePath(pagePath)
      }

      pageName = options.postProcessPageName(pageName)
      label = options.postProcessLabel(label, defaultPostProcessLabel)

      link = pagePath ? pagePath + '/' + pageName : pageName

      // make sure none of the values are empty
      if (!label || (!link && link !== '')) {
        return match.input
      }

      if (isHeadingLink) {
        // in this case the href is just the link content, e.g. '#HeadingName'
        // need to convert it to the markdown heading format:
        // lowercase with whitespace replaced by underscores
        href = "#" + heading.toLowerCase()
      }
      else {
        // if a uriSuffix isn't provided, default to whatever the extension for this file is
        let uriSuffix = options.uriSuffix
        if (!uriSuffix) {
          uriSuffix = "." + document.fsPath.split('.').pop()
        }

        if (isAbsolute(link)) {
          link = removeInitialSlashes(link)
          href = options.baseURL + link
        }
        else {
          href = options.relativeBaseURL + link
        }

        // only append the uriSuffix if the link doesn't already have that extension
        if (!link.endsWith(uriSuffix)) {
          href += uriSuffix
        }

        // append heading if present
        if (heading) {
          href += "#" + heading.toLowerCase()
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
