import ReactMarkdown from 'react-markdown'
import rehypeSanitize from 'rehype-sanitize'

export default function Markdown({ children = '' }) {
  return <ReactMarkdown rehypePlugins={[rehypeSanitize]} components={{
    a: ({ node: _node, ...props }) => <a {...props} target="_blank" rel="noopener noreferrer" />,
  }}>{children}</ReactMarkdown>
}
