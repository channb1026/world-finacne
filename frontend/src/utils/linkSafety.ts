/** 仅 http/https 链接可安全用于 <a href>，其它按纯文本处理 */
export function isSafeLink(link: string | undefined): link is string {
  return typeof link === 'string' && (link.startsWith('http://') || link.startsWith('https://'))
}
