import { createContentLoader } from 'vitepress'
import project from '../.vitepress/project.json' with { type: 'json' }
import navigation from '../.vitepress/navigation.json' with { type: 'json' }
import { clean, topicFor } from '../.vitepress/navigation.mjs'

const patterns = ['index.md', ...project.articleRoots.map(path => path + '/**/*.md')]
const collator = new Intl.Collator('de', { sensitivity: 'base', numeric: true })
export default createContentLoader(patterns, {
  includeSrc: true,
  transform(pages) {
    const entries = pages.filter(page => !page.frontmatter.redirect && page.frontmatter.search !== false &&
      !page.url.endsWith('/notes.html') && clean(page.url) !== '/hilfe/alle-artikel'
    ).map(page => {
      const { trail } = topicFor(navigation, page.url)
      const menuItem = trail.at(-1)
      const menuTitle = menuItem?.link && clean(menuItem.link) === clean(page.url) ? menuItem.text : undefined
      const heading = page.src?.match(/^#{1,6}[ \t]+(.+)$/m)?.[1]
      const title = page.frontmatter.title ||
        (page.url.startsWith('/schulungsmodule/') && menuTitle) ||
        heading || menuTitle || page.frontmatter.hero?.name ||
        clean(page.url).split('/').at(-1)
      return {
        title: String(title).replace(/\s*\{#[^}]+\}\s*$/, '').replace(/[*`]/g, '').trim(),
        context: trail.slice(0, -1).map(item => item.text).join(' › '),
        url: page.url
      }
    })
    return entries.map(({ title, context, url }) => ({
      title: context && entries.some(entry => entry.url !== url && collator.compare(entry.title, title) === 0)
        ? `${title} (${context})` : title,
      url
    })).sort((a, b) => collator.compare(a.title, b.title) || collator.compare(a.url, b.url))
  }
})
